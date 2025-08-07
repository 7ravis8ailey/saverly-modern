# Enterprise Architecture Implementation & Migration Guide

## Executive Summary

This guide provides detailed implementation steps for migrating the Saverly platform from its current architecture (React + Supabase) to an enterprise-scale architecture supporting 100K+ concurrent users.

**Migration Timeline**: 12 months
**Estimated Investment**: $2.5M - $4M
**Risk Level**: Medium (with comprehensive mitigation)
**Expected ROI**: 300% at 24 months

---

## Phase 1: Foundation & Infrastructure (Months 1-3)

### Month 1: Infrastructure Setup & Monitoring

#### Week 1-2: Environment Setup
```bash
# 1. Multi-Environment Infrastructure Setup
# Set up AWS/GCP accounts and basic infrastructure

# AWS Infrastructure Setup
terraform init
terraform workspace new staging
terraform workspace new production

# Create base VPC and networking
terraform apply -target=module.vpc
terraform apply -target=module.subnets
terraform apply -target=module.security_groups

# Set up Kubernetes clusters
eksctl create cluster --name saverly-staging --region us-east-1
eksctl create cluster --name saverly-production --region us-east-1
```

**Infrastructure as Code Configuration:**
```hcl
# terraform/main.tf
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  
  name = "saverly-${var.environment}"
  cidr = "10.0.0.0/16"
  
  azs             = ["us-east-1a", "us-east-1b", "us-east-1c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
  
  enable_nat_gateway = true
  enable_vpn_gateway = true
  
  tags = {
    Environment = var.environment
    Project     = "saverly"
  }
}

module "eks" {
  source = "terraform-aws-modules/eks/aws"
  
  cluster_name    = "saverly-${var.environment}"
  cluster_version = "1.27"
  
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets
  
  node_groups = {
    main = {
      desired_capacity = 3
      max_capacity     = 10
      min_capacity     = 1
      
      instance_types = ["m5.large", "m5.xlarge"]
      
      k8s_labels = {
        Environment = var.environment
        NodeGroup   = "main"
      }
    }
  }
}
```

#### Week 3-4: Monitoring & Observability Setup
```yaml
# monitoring/datadog-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: datadog-config
data:
  datadog.yaml: |
    api_key: "${DATADOG_API_KEY}"
    site: "datadoghq.com"
    
    # Logs
    logs_enabled: true
    logs_config:
      container_collect_all: true
      
    # APM
    apm_enabled: true
    apm_config:
      receiver_port: 8126
      
    # Process monitoring
    process_config:
      enabled: "true"
      
    # Network monitoring
    network_config:
      enabled: true
```

**Monitoring Implementation:**
```typescript
// monitoring/setup.ts
import { DatadogLogger } from './datadog-logger';
import { PrometheusMetrics } from './prometheus-metrics';
import { AlertManager } from './alert-manager';

export class MonitoringSetup {
  private logger = new DatadogLogger();
  private metrics = new PrometheusMetrics();
  private alerts = new AlertManager();
  
  async initializeMonitoring() {
    // Set up application metrics
    this.metrics.createGauge('active_users', 'Number of active users');
    this.metrics.createHistogram('api_duration', 'API response duration');
    this.metrics.createCounter('api_requests', 'API request count');
    
    // Configure alerts
    await this.alerts.createAlert({
      name: 'HighErrorRate',
      condition: 'error_rate > 5%',
      duration: '5m',
      action: 'page-oncall'
    });
    
    await this.alerts.createAlert({
      name: 'HighLatency', 
      condition: 'p95_latency > 1000ms',
      duration: '10m',
      action: 'slack-alert'
    });
  }
}
```

### Month 2: Database Scaling & Optimization

#### Week 1-2: PostgreSQL Optimization
```sql
-- database/optimization.sql
-- Create read replicas
CREATE REPLICA DATABASE saverly_replica_1 FROM saverly_production;
CREATE REPLICA DATABASE saverly_replica_2 FROM saverly_production;

-- Optimize existing queries with better indexes
CREATE INDEX CONCURRENTLY idx_coupons_search 
  ON coupons USING GIN(to_tsvector('english', title || ' ' || description));

CREATE INDEX CONCURRENTLY idx_businesses_location_radius
  ON businesses USING GIST(ST_Buffer(ST_MakePoint(longitude, latitude), 0.01));

-- Partition large tables by date
CREATE TABLE redemptions_2024_q1 PARTITION OF redemptions
  FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');

-- Add connection pooling with PgBouncer
-- pgbouncer.ini configuration
[databases]
saverly_production = host=production-db port=5432 dbname=saverly_production
saverly_replica_1 = host=replica-1-db port=5432 dbname=saverly_production
saverly_replica_2 = host=replica-2-db port=5432 dbname=saverly_production

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 250
max_db_connections = 100
```

**Database Service Implementation:**
```typescript
// database/connection-manager.ts
import { Pool, PoolClient } from 'pg';
import { createClient } from 'redis';

export class DatabaseConnectionManager {
  private writePool: Pool;
  private readPools: Pool[];
  private redisClient: any;
  
  constructor() {
    // Primary database for writes
    this.writePool = new Pool({
      host: process.env.DB_PRIMARY_HOST,
      port: 5432,
      database: 'saverly_production',
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      max: 100,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 2000
    });
    
    // Read replicas for queries
    this.readPools = [
      new Pool({
        host: process.env.DB_REPLICA_1_HOST,
        // ... configuration
      }),
      new Pool({
        host: process.env.DB_REPLICA_2_HOST,
        // ... configuration
      })
    ];
    
    // Redis for caching
    this.redisClient = createClient({
      url: process.env.REDIS_URL,
      socket: {
        connectTimeout: 60000,
        commandTimeout: 5000
      },
      retry_strategy: (times) => Math.min(times * 50, 2000)
    });
  }
  
  async executeQuery(query: string, params: any[], useReplica = false) {
    const pool = useReplica ? this.getRandomReadPool() : this.writePool;
    
    try {
      const client = await pool.connect();
      const result = await client.query(query, params);
      client.release();
      
      // Cache frequently accessed data
      if (useReplica && query.includes('SELECT')) {
        const cacheKey = `query:${Buffer.from(query + params.join(':')).toString('base64')}`;
        await this.redisClient.setex(cacheKey, 300, JSON.stringify(result.rows));
      }
      
      return result;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }
  
  private getRandomReadPool(): Pool {
    const randomIndex = Math.floor(Math.random() * this.readPools.length);
    return this.readPools[randomIndex];
  }
}
```

#### Week 3-4: Redis Implementation
```yaml
# redis/redis-cluster.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: redis-cluster
spec:
  serviceName: redis-cluster
  replicas: 6
  selector:
    matchLabels:
      app: redis-cluster
  template:
    metadata:
      labels:
        app: redis-cluster
    spec:
      containers:
      - name: redis
        image: redis:7.0-alpine
        ports:
        - containerPort: 6379
        - containerPort: 16379
        env:
        - name: REDIS_CLUSTER_ANNOUNCE_IP
          valueFrom:
            fieldRef:
              fieldPath: status.podIP
        volumeMounts:
        - name: redis-data
          mountPath: /data
        - name: redis-config
          mountPath: /etc/redis
  volumeClaimTemplates:
  - metadata:
      name: redis-data
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 10Gi
```

### Month 3: CI/CD Pipeline & API Gateway

#### Week 1-2: Advanced CI/CD Pipeline
```yaml
# .github/workflows/production-deploy.yml
name: Production Deployment
on:
  push:
    branches: [main]
    
env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}
  
jobs:
  quality-gates:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Type check
        run: npm run typecheck
      
      - name: Lint
        run: npm run lint
      
      - name: Unit tests
        run: npm run test:coverage
      
      - name: Security scan
        uses: securecodewarrior/github-action-add-sarif@v1
        with:
          sarif-file: security-scan-results.sarif
      
      - name: Performance budget
        run: npm run build:analyze
        
  build-and-deploy:
    needs: quality-gates
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: [user-service, business-service, coupon-service, redemption-service]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Build container
        run: |
          docker build -f services/${{ matrix.service }}/Dockerfile \
            -t $REGISTRY/$IMAGE_NAME/${{ matrix.service }}:$GITHUB_SHA \
            services/${{ matrix.service }}
      
      - name: Security scan container
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: $REGISTRY/$IMAGE_NAME/${{ matrix.service }}:$GITHUB_SHA
      
      - name: Push to registry
        run: |
          echo ${{ secrets.GITHUB_TOKEN }} | docker login $REGISTRY -u ${{ github.actor }} --password-stdin
          docker push $REGISTRY/$IMAGE_NAME/${{ matrix.service }}:$GITHUB_SHA
      
      - name: Deploy to production
        uses: azure/k8s-deploy@v1
        with:
          manifests: |
            k8s/${{ matrix.service }}/deployment.yaml
            k8s/${{ matrix.service }}/service.yaml
          images: $REGISTRY/$IMAGE_NAME/${{ matrix.service }}:$GITHUB_SHA
```

#### Week 3-4: API Gateway Implementation
```typescript
// api-gateway/kong-config.ts
import { KongAdminClient } from '@kong/admin-client';

export class APIGatewaySetup {
  private kong: KongAdminClient;
  
  constructor() {
    this.kong = new KongAdminClient({
      baseURL: process.env.KONG_ADMIN_URL
    });
  }
  
  async setupServices() {
    // User Service
    await this.kong.services.create({
      name: 'user-service',
      url: 'http://user-service.default.svc.cluster.local:3000',
      tags: ['microservice', 'user-management']
    });
    
    await this.kong.routes.create('user-service', {
      name: 'user-routes',
      paths: ['/v1/users', '/v1/auth'],
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      strip_path: false
    });
    
    // Rate limiting plugin
    await this.kong.plugins.create('user-service', {
      name: 'rate-limiting',
      config: {
        minute: 100,
        hour: 1000,
        policy: 'redis',
        redis_host: process.env.REDIS_HOST,
        redis_port: 6379
      }
    });
    
    // JWT authentication plugin
    await this.kong.plugins.create('user-service', {
      name: 'jwt',
      config: {
        secret_is_base64: false,
        key_claim_name: 'iss',
        claims_to_verify: ['exp', 'nbf']
      }
    });
    
    // Similar setup for other services...
    await this.setupCouponService();
    await this.setupBusinessService();
    await this.setupRedemptionService();
  }
  
  async setupGraphQLGateway() {
    const gatewayConfig = {
      services: [
        {
          name: 'user-subgraph',
          url: 'http://user-service:3000/graphql'
        },
        {
          name: 'coupon-subgraph', 
          url: 'http://coupon-service:3000/graphql'
        },
        {
          name: 'business-subgraph',
          url: 'http://business-service:3000/graphql'
        }
      ],
      
      supergraph: {
        listen: 4000,
        introspection: process.env.NODE_ENV === 'development',
        playground: process.env.NODE_ENV === 'development'
      }
    };
    
    return gatewayConfig;
  }
}
```

---

## Phase 2: Microservices Architecture (Months 4-6)

### Month 4: Service Decomposition & User Service

#### Week 1-2: User Service Implementation
```typescript
// services/user-service/src/app.ts
import express from 'express';
import { graphqlHTTP } from 'express-graphql';
import { buildSchema } from 'graphql';
import { UserController } from './controllers/user-controller';
import { AuthController } from './controllers/auth-controller';
import { SubscriptionController } from './controllers/subscription-controller';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'user-service',
    version: process.env.npm_package_version,
    uptime: process.uptime()
  });
});

// REST API routes
app.use('/v1/auth', AuthController);
app.use('/v1/users', UserController);
app.use('/v1/subscriptions', SubscriptionController);

// GraphQL endpoint
const schema = buildSchema(`
  type User {
    id: ID!
    email: String!
    fullName: String
    subscriptionStatus: String!
    accountType: String!
    createdAt: String!
  }
  
  type Subscription {
    id: ID!
    status: String!
    planType: String!
    currentPeriodEnd: String!
  }
  
  type Query {
    user(id: ID!): User
    currentUser: User
    userSubscription(userId: ID!): Subscription
  }
  
  type Mutation {
    updateUserProfile(input: UserInput!): User
    cancelSubscription(userId: ID!): Boolean
    updateSubscriptionPlan(userId: ID!, planType: String!): Subscription
  }
  
  input UserInput {
    fullName: String
    phone: String
    address: String
  }
`);

app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: getUserResolvers(),
  graphiql: process.env.NODE_ENV === 'development'
}));

export default app;
```

**User Service Dockerfile:**
```dockerfile
# services/user-service/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:20-alpine AS runtime

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "dist/server.js"]
```

#### Week 3-4: Business & Coupon Services
```typescript
// services/coupon-service/src/search/elasticsearch-client.ts
import { Client } from '@elastic/elasticsearch';
import { CouponDocument } from '../types/coupon-document';

export class CouponSearchService {
  private client: Client;
  
  constructor() {
    this.client = new Client({
      node: process.env.ELASTICSEARCH_URL,
      auth: {
        username: process.env.ELASTICSEARCH_USERNAME,
        password: process.env.ELASTICSEARCH_PASSWORD
      },
      maxRetries: 3,
      requestTimeout: 60000,
      sniffOnStart: true
    });
  }
  
  async indexCoupon(coupon: CouponDocument) {
    try {
      await this.client.index({
        index: 'coupons',
        id: coupon.id,
        body: {
          ...coupon,
          location: {
            lat: coupon.business.latitude,
            lon: coupon.business.longitude
          },
          suggest: {
            input: [coupon.title, coupon.business.name],
            weight: coupon.featured ? 10 : 5
          }
        }
      });
    } catch (error) {
      console.error('Failed to index coupon:', error);
      throw error;
    }
  }
  
  async searchCoupons(query: {
    text?: string;
    location?: { lat: number; lon: number; radius: string };
    category?: string;
    maxResults?: number;
  }) {
    const body: any = {
      query: {
        bool: {
          must: [],
          filter: []
        }
      },
      sort: [
        { featured: { order: 'desc' } },
        { priority: { order: 'desc' } },
        '_score'
      ],
      size: query.maxResults || 50
    };
    
    // Text search
    if (query.text) {
      body.query.bool.must.push({
        multi_match: {
          query: query.text,
          fields: ['title^3', 'description^2', 'business.name^2'],
          fuzziness: 'AUTO'
        }
      });
    }
    
    // Location filter
    if (query.location) {
      body.query.bool.filter.push({
        geo_distance: {
          distance: query.location.radius || '10km',
          location: {
            lat: query.location.lat,
            lon: query.location.lon
          }
        }
      });
    }
    
    // Category filter
    if (query.category) {
      body.query.bool.filter.push({
        term: { 'business.category': query.category }
      });
    }
    
    // Only active coupons
    body.query.bool.filter.push({
      term: { active: true }
    });
    
    body.query.bool.filter.push({
      range: {
        end_date: { gte: 'now' }
      }
    });
    
    try {
      const response = await this.client.search({
        index: 'coupons',
        body
      });
      
      return response.body.hits.hits.map((hit: any) => hit._source);
    } catch (error) {
      console.error('Search failed:', error);
      throw error;
    }
  }
}
```

### Month 5: Message Queue & Event Processing

#### Week 1-2: Kafka Implementation
```typescript
// messaging/kafka-producer.ts
import { Kafka, Producer } from 'kafkajs';
import { EventPayload } from '../types/events';

export class EventProducer {
  private kafka: Kafka;
  private producer: Producer;
  
  constructor() {
    this.kafka = new Kafka({
      clientId: 'saverly-producer',
      brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    });
    
    this.producer = this.kafka.producer({
      maxInFlightRequests: 1,
      idempotent: true,
      retry: {
        retries: 5
      }
    });
  }
  
  async publishEvent(topic: string, event: EventPayload) {
    try {
      await this.producer.send({
        topic,
        messages: [
          {
            partition: event.userId ? this.getPartition(event.userId) : undefined,
            key: event.entityId,
            value: JSON.stringify({
              ...event,
              timestamp: new Date().toISOString(),
              version: '1.0'
            }),
            headers: {
              eventType: event.eventType,
              source: 'saverly-platform'
            }
          }
        ]
      });
      
      console.log(`Event published: ${topic}/${event.eventType}`);
    } catch (error) {
      console.error('Failed to publish event:', error);
      throw error;
    }
  }
  
  private getPartition(userId: string): number {
    // Hash user ID to partition for consistent ordering
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash) % 10; // Assuming 10 partitions
  }
}

// messaging/kafka-consumer.ts
import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { EventHandler } from '../handlers/event-handler';

export class EventConsumer {
  private kafka: Kafka;
  private consumer: Consumer;
  private eventHandler: EventHandler;
  
  constructor(groupId: string) {
    this.kafka = new Kafka({
      clientId: `saverly-consumer-${groupId}`,
      brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092']
    });
    
    this.consumer = this.kafka.consumer({
      groupId,
      sessionTimeout: 30000,
      heartbeatInterval: 3000
    });
    
    this.eventHandler = new EventHandler();
  }
  
  async start() {
    await this.consumer.connect();
    
    await this.consumer.subscribe({
      topics: [
        'user.events',
        'coupon.events', 
        'redemption.events',
        'payment.events'
      ],
      fromBeginning: false
    });
    
    await this.consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        try {
          const event = JSON.parse(payload.message.value?.toString() || '{}');
          const eventType = payload.message.headers?.eventType?.toString();
          
          if (eventType) {
            await this.eventHandler.handle(eventType, event);
          }
          
          // Commit offset after successful processing
          await payload.heartbeat();
        } catch (error) {
          console.error('Error processing message:', error);
          // Implement dead letter queue for failed messages
        }
      }
    });
  }
}
```

#### Week 3-4: Real-time Analytics Pipeline
```typescript
// analytics/clickhouse-client.ts
import { ClickHouse } from 'clickhouse';
import { AnalyticsEvent } from '../types/analytics';

export class AnalyticsService {
  private clickhouse: ClickHouse;
  
  constructor() {
    this.clickhouse = new ClickHouse({
      url: process.env.CLICKHOUSE_URL,
      port: 8123,
      debug: process.env.NODE_ENV === 'development',
      basicAuth: {
        username: process.env.CLICKHOUSE_USERNAME || 'default',
        password: process.env.CLICKHOUSE_PASSWORD || ''
      },
      config: {
        session_timeout: 60,
        output_format_json_quote_64bit_integers: 0,
        enable_http_compression: 1
      }
    });
  }
  
  async recordEvent(event: AnalyticsEvent) {
    const query = `
      INSERT INTO analytics_events (
        event_id, user_id, event_type, event_data, 
        session_id, timestamp, ip_address, user_agent
      ) VALUES
    `;
    
    const values = [
      event.eventId,
      event.userId,
      event.eventType,
      JSON.stringify(event.eventData),
      event.sessionId,
      event.timestamp,
      event.ipAddress,
      event.userAgent
    ];
    
    try {
      await this.clickhouse.query(query, { values }).toPromise();
    } catch (error) {
      console.error('Failed to record analytics event:', error);
      throw error;
    }
  }
  
  async getUserMetrics(userId: string, days: number = 30) {
    const query = `
      SELECT 
        event_type,
        COUNT(*) as event_count,
        uniq(session_id) as unique_sessions,
        toStartOfDay(timestamp) as date
      FROM analytics_events 
      WHERE user_id = ? 
        AND timestamp >= now() - INTERVAL ? DAY
      GROUP BY event_type, date
      ORDER BY date DESC
    `;
    
    try {
      const result = await this.clickhouse.query(query, {
        params: [userId, days]
      }).toPromise();
      
      return result;
    } catch (error) {
      console.error('Failed to fetch user metrics:', error);
      throw error;
    }
  }
  
  async getCouponPerformance(couponId: string) {
    const query = `
      SELECT 
        COUNT(*) as total_views,
        countIf(event_type = 'coupon_redemption_attempt') as redemption_attempts,
        countIf(event_type = 'coupon_redeemed') as successful_redemptions,
        round(countIf(event_type = 'coupon_redeemed') / countIf(event_type = 'coupon_redemption_attempt') * 100, 2) as conversion_rate,
        uniq(user_id) as unique_users,
        avgIf(toFloat64(JSONExtract(event_data, 'transaction_amount')), event_type = 'coupon_redeemed') as avg_transaction_amount
      FROM analytics_events 
      WHERE JSONExtract(event_data, 'coupon_id') = ?
        AND timestamp >= now() - INTERVAL 30 DAY
    `;
    
    try {
      const result = await this.clickhouse.query(query, {
        params: [couponId]
      }).toPromise();
      
      return result[0] || {};
    } catch (error) {
      console.error('Failed to fetch coupon performance:', error);
      throw error;
    }
  }
}
```

### Month 6: Auto-scaling & Performance Optimization

#### Week 1-2: Kubernetes Auto-scaling
```yaml
# k8s/hpa-configuration.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: user-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: user-service
  minReplicas: 3
  maxReplicas: 50
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  - type: Pods
    pods:
      metric:
        name: api_requests_per_second
      target:
        type: AverageValue
        averageValue: "100"
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
      - type: Pods
        value: 5
        periodSeconds: 60
      selectPolicy: Max

---
# Vertical Pod Autoscaler
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: user-service-vpa
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: user-service
  updatePolicy:
    updateMode: "Auto"
  resourcePolicy:
    containerPolicies:
    - containerName: user-service
      maxAllowed:
        cpu: 2
        memory: 4Gi
      minAllowed:
        cpu: 100m
        memory: 128Mi
```

#### Week 3-4: CDN & Caching Implementation
```typescript
// caching/multi-layer-cache.ts
import { RedisClusterType } from 'redis';
import { LRUCache } from 'lru-cache';

export class MultiLayerCache {
  private l1Cache: LRUCache<string, any>; // In-memory cache
  private l2Cache: RedisClusterType; // Distributed cache
  
  constructor(redisClient: RedisClusterType) {
    this.l1Cache = new LRUCache({
      max: 10000,
      ttl: 5 * 60 * 1000, // 5 minutes
      allowStale: true,
      updateAgeOnGet: true
    });
    
    this.l2Cache = redisClient;
  }
  
  async get(key: string, fallback?: () => Promise<any>): Promise<any> {
    // L1 Cache (in-memory)
    let value = this.l1Cache.get(key);
    if (value !== undefined) {
      return value;
    }
    
    try {
      // L2 Cache (Redis)
      const redisValue = await this.l2Cache.get(key);
      if (redisValue) {
        value = JSON.parse(redisValue);
        this.l1Cache.set(key, value); // Promote to L1
        return value;
      }
    } catch (error) {
      console.error('Redis cache error:', error);
    }
    
    // Fallback to data source
    if (fallback) {
      try {
        value = await fallback();
        if (value !== null && value !== undefined) {
          await this.set(key, value, 300); // 5 minutes TTL
        }
        return value;
      } catch (error) {
        console.error('Fallback function error:', error);
        throw error;
      }
    }
    
    return null;
  }
  
  async set(key: string, value: any, ttl: number = 300): Promise<void> {
    // Set in L1 cache
    this.l1Cache.set(key, value, { ttl: ttl * 1000 });
    
    // Set in L2 cache
    try {
      await this.l2Cache.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }
  
  async invalidate(pattern: string): Promise<void> {
    // Clear L1 cache
    this.l1Cache.clear();
    
    // Clear matching keys in Redis
    try {
      const keys = await this.l2Cache.keys(pattern);
      if (keys.length > 0) {
        await this.l2Cache.del(keys);
      }
    } catch (error) {
      console.error('Redis invalidation error:', error);
    }
  }
}

// CDN Configuration
export class CDNManager {
  private cloudfrontClient: any;
  
  constructor() {
    // Initialize CloudFront client
    this.cloudfrontClient = new AWS.CloudFront({
      region: 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });
  }
  
  async invalidateCache(paths: string[]): Promise<void> {
    try {
      const invalidationParams = {
        DistributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID,
        InvalidationBatch: {
          CallerReference: Date.now().toString(),
          Paths: {
            Quantity: paths.length,
            Items: paths
          }
        }
      };
      
      const result = await this.cloudfrontClient.createInvalidation(invalidationParams).promise();
      console.log('Cache invalidation created:', result.Invalidation.Id);
    } catch (error) {
      console.error('Failed to invalidate CDN cache:', error);
      throw error;
    }
  }
  
  async getCacheStatistics(): Promise<any> {
    try {
      const params = {
        DistributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID,
        MetricName: 'Requests',
        StartTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        EndTime: new Date()
      };
      
      const result = await this.cloudfrontClient.getDistributionMetrics(params).promise();
      return result;
    } catch (error) {
      console.error('Failed to get CDN statistics:', error);
      throw error;
    }
  }
}
```

---

## Phase 3: Security & Compliance (Months 7-9)

### Security Implementation Details
```typescript
// security/zero-trust-auth.ts
import jwt from 'jsonwebtoken';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { DeviceFingerprint } from './device-fingerprint';

export class ZeroTrustAuthenticator {
  private rateLimiter: RateLimiterRedis;
  private deviceFingerprint: DeviceFingerprint;
  
  constructor(redisClient: any) {
    this.rateLimiter = new RateLimiterRedis({
      storeClient: redisClient,
      keyGenerator: (req) => `${req.ip}_${req.user?.id || 'anonymous'}`,
      points: 10, // Number of requests
      duration: 60, // Per 60 seconds
      blockDuration: 300 // Block for 5 minutes
    });
    
    this.deviceFingerprint = new DeviceFingerprint();
  }
  
  async authenticateRequest(req: any, res: any, next: any) {
    try {
      // Rate limiting
      await this.rateLimiter.consume(req.ip);
      
      // Extract and verify JWT
      const token = this.extractToken(req);
      if (!token) {
        return res.status(401).json({ error: 'No authentication token' });
      }
      
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.user = payload;
      
      // Device fingerprinting
      const deviceId = await this.deviceFingerprint.generate(req);
      const isKnownDevice = await this.verifyDevice(payload.sub, deviceId);
      
      if (!isKnownDevice) {
        // Require additional verification
        req.requiresMFA = true;
        return res.status(202).json({ 
          requiresVerification: true,
          message: 'Additional verification required for new device'
        });
      }
      
      // Session validation
      const isValidSession = await this.validateSession(payload.jti, payload.sub);
      if (!isValidSession) {
        return res.status(401).json({ error: 'Invalid session' });
      }
      
      // Update last access time
      await this.updateLastAccess(payload.sub, req.ip, deviceId);
      
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
      } else if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token' });
      }
      
      console.error('Authentication error:', error);
      return res.status(500).json({ error: 'Authentication failed' });
    }
  }
  
  private extractToken(req: any): string | null {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    // Check for token in cookies
    return req.cookies?.authToken || null;
  }
  
  private async verifyDevice(userId: string, deviceId: string): Promise<boolean> {
    // Check if device is in trusted devices list
    const trustedDevices = await this.getTrustedDevices(userId);
    return trustedDevices.includes(deviceId);
  }
  
  private async validateSession(sessionId: string, userId: string): Promise<boolean> {
    // Validate session in Redis
    const sessionData = await redis.get(`session:${sessionId}`);
    if (!sessionData) return false;
    
    const session = JSON.parse(sessionData);
    return session.userId === userId && session.active === true;
  }
}
```

---

## Performance Benchmarks & Testing

### Load Testing Implementation
```javascript
// performance/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export let options = {
  stages: [
    { duration: '5m', target: 100 },   // Ramp-up to 100 users
    { duration: '10m', target: 1000 }, // Stay at 1000 users
    { duration: '15m', target: 5000 }, // Ramp-up to 5000 users
    { duration: '10m', target: 10000 }, // Scale to 10000 users
    { duration: '5m', target: 0 },     // Ramp-down
  ],
  
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],   // Error rate under 1%
    errors: ['rate<0.05'],            // Custom error rate under 5%
  }
};

export default function() {
  // Test authentication endpoint
  let authResponse = http.post('https://api.saverly.com/v1/auth/login', {
    email: 'test@example.com',
    password: 'testpassword123'
  });
  
  let authCheck = check(authResponse, {
    'auth status is 200': (r) => r.status === 200,
    'auth response time < 200ms': (r) => r.timings.duration < 200,
  });
  
  errorRate.add(!authCheck);
  
  if (authResponse.status === 200) {
    const token = authResponse.json('token');
    
    // Test coupon search with authentication
    let searchResponse = http.get('https://api.saverly.com/v1/coupons/search?location=40.7128,-74.0060&radius=10km', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    let searchCheck = check(searchResponse, {
      'search status is 200': (r) => r.status === 200,
      'search response time < 300ms': (r) => r.timings.duration < 300,
      'search returns results': (r) => r.json('results').length > 0,
    });
    
    errorRate.add(!searchCheck);
  }
  
  sleep(1);
}
```

---

## Success Metrics Dashboard

### Real-time Monitoring Configuration
```typescript
// monitoring/metrics-dashboard.ts
import { MetricsRegistry } from './metrics-registry';
import { AlertManager } from './alert-manager';

export class MetricsDashboard {
  private metrics: MetricsRegistry;
  private alerts: AlertManager;
  
  constructor() {
    this.metrics = new MetricsRegistry();
    this.alerts = new AlertManager();
    this.setupMetrics();
    this.setupAlerts();
  }
  
  private setupMetrics() {
    // Performance metrics
    this.metrics.gauge('active_connections', 'Number of active database connections');
    this.metrics.histogram('api_response_time', 'API response times', ['endpoint', 'method']);
    this.metrics.counter('api_requests_total', 'Total API requests', ['endpoint', 'status']);
    
    // Business metrics
    this.metrics.gauge('active_users', 'Number of active users');
    this.metrics.counter('coupon_redemptions', 'Total coupon redemptions', ['business_id']);
    this.metrics.gauge('revenue_current_month', 'Revenue for current month');
    
    // System metrics
    this.metrics.gauge('cpu_usage_percent', 'CPU usage percentage', ['service']);
    this.metrics.gauge('memory_usage_percent', 'Memory usage percentage', ['service']);
    this.metrics.gauge('disk_usage_percent', 'Disk usage percentage', ['mount']);
  }
  
  private setupAlerts() {
    // Critical alerts (page immediately)
    this.alerts.create({
      name: 'ServiceDown',
      condition: 'up{job="user-service"} == 0',
      duration: '1m',
      severity: 'critical',
      action: 'page'
    });
    
    this.alerts.create({
      name: 'DatabaseConnectionFailure',
      condition: 'rate(database_connection_errors[5m]) > 0.1',
      duration: '2m',
      severity: 'critical',
      action: 'page'
    });
    
    // Warning alerts (Slack notification)
    this.alerts.create({
      name: 'HighAPILatency',
      condition: 'histogram_quantile(0.95, api_response_time) > 1000',
      duration: '5m',
      severity: 'warning',
      action: 'slack'
    });
    
    this.alerts.create({
      name: 'HighErrorRate',
      condition: 'rate(api_requests_total{status=~"5.."}[5m]) > 0.05',
      duration: '3m',
      severity: 'warning',
      action: 'slack'
    });
  }
  
  async generateReport(): Promise<any> {
    return {
      timestamp: new Date().toISOString(),
      performance: {
        avgResponseTime: await this.metrics.getAverage('api_response_time', '1h'),
        requestThroughput: await this.metrics.getRate('api_requests_total', '1h'),
        errorRate: await this.metrics.getErrorRate('1h'),
        uptime: await this.metrics.getUptime()
      },
      business: {
        activeUsers: await this.metrics.getValue('active_users'),
        totalRedemptions: await this.metrics.getSum('coupon_redemptions', '24h'),
        revenue: await this.metrics.getValue('revenue_current_month'),
        conversionRate: await this.calculateConversionRate()
      },
      infrastructure: {
        cpuUtilization: await this.metrics.getAverage('cpu_usage_percent', '1h'),
        memoryUtilization: await this.metrics.getAverage('memory_usage_percent', '1h'),
        diskUtilization: await this.metrics.getValue('disk_usage_percent')
      }
    };
  }
}
```

This comprehensive implementation guide provides the detailed steps, code examples, and configurations needed to successfully migrate the Saverly platform to an enterprise-scale architecture. Each phase builds upon the previous one, ensuring a systematic and risk-managed transformation process.