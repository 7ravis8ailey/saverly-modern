// Security Headers Middleware
export const securityHeaders = {
  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://js.stripe.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.stripe.com https://maps.googleapis.com https://*.supabase.co wss://*.supabase.co",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "upgrade-insecure-requests"
  ].join('; '),

  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',

  // Enable XSS filtering
  'X-XSS-Protection': '1; mode=block',

  // Prevent page from being framed
  'X-Frame-Options': 'DENY',

  // Force HTTPS
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Permissions policy
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',

  // Remove server information
  'Server': '',
  'X-Powered-By': ''
}

// CORS configuration
export const corsConfig = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://saverly.app', 'https://www.saverly.app'] 
    : ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin', 
    'X-Requested-With', 
    'Content-Type', 
    'Accept', 
    'Authorization',
    'apikey',
    'x-client-info'
  ]
}

// Apply security headers to Vite development server
export const viteSecurityPlugin = () => ({
  name: 'security-headers',
  configureServer(server: any) {
    server.middlewares.use((_req: any, res: any, next: any) => {
      // Apply security headers
      Object.entries(securityHeaders).forEach(([key, value]) => {
        res.setHeader(key, value)
      })

      // Apply CORS in development
      if (process.env.NODE_ENV === 'development') {
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', corsConfig.methods.join(', '))
        res.setHeader('Access-Control-Allow-Headers', corsConfig.allowedHeaders.join(', '))
        res.setHeader('Access-Control-Allow-Credentials', 'true')
      }

      next()
    })
  }
})

export default securityHeaders