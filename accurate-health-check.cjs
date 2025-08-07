#!/usr/bin/env node

/**
 * Accurate Saverly Health Check
 * Properly detects Saverly app functionality and content
 */

const { chromium } = require('playwright');
const axios = require('axios');

const APP_URL = 'http://localhost:5177';

class SaverlyHealthCheck {
  constructor() {
    this.results = {
      overallHealth: 'unknown',
      score: 0,
      checks: {
        serverResponse: false,
        reactMounting: false,
        contentLoading: false,
        navigationWorking: false,
        saverlyBranding: false,
        businessContent: false,
        apiEndpoints: false,
        performanceGood: false
      },
      details: {},
      recommendations: []
    };
  }

  async runHealthCheck() {
    console.log('🏥 Running Accurate Saverly Health Check...\n');
    
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
      // 1. Server Response Test
      await this.testServerResponse();
      
      // 2. React App Mounting Test
      await this.testReactMounting(page);
      
      // 3. Content Loading Test
      await this.testContentLoading(page);
      
      // 4. Navigation Test
      await this.testNavigation(page);
      
      // 5. Saverly Branding Test
      await this.testSaverlyBranding(page);
      
      // 6. Business Content Test
      await this.testBusinessContent(page);
      
      // 7. API Endpoints Test
      await this.testApiEndpoints();
      
      // 8. Performance Test
      await this.testPerformance(page);
      
      // Calculate overall health
      this.calculateOverallHealth();
      
      // Generate report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Health check failed:', error);
      this.results.overallHealth = 'critical';
      this.results.details.fatalError = error.message;
    } finally {
      await browser.close();
    }
    
    return this.results;
  }

  async testServerResponse() {
    console.log('🌐 Testing server response...');
    
    try {
      const response = await axios.get(APP_URL, { timeout: 10000 });
      
      if (response.status === 200 && response.data.includes('<div id="root">')) {
        this.results.checks.serverResponse = true;
        this.results.details.serverResponse = {
          status: 'healthy',
          httpCode: response.status,
          hasRootDiv: true,
          contentLength: response.data.length
        };
        console.log('   ✅ Server responding correctly');
      } else {
        this.results.details.serverResponse = {
          status: 'unhealthy',
          httpCode: response.status,
          issue: 'Missing root div or invalid response'
        };
        console.log('   ❌ Server response invalid');
      }
    } catch (error) {
      this.results.details.serverResponse = {
        status: 'error',
        error: error.message
      };
      console.log('   ❌ Server not responding');
    }
  }

  async testReactMounting(page) {
    console.log('⚛️  Testing React app mounting...');
    
    try {
      await page.goto(APP_URL, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(2000); // Allow React to render
      
      const rootContent = await page.$eval('#root', el => el.innerHTML);
      const hasReactContent = rootContent.trim().length > 100;
      
      if (hasReactContent) {
        this.results.checks.reactMounting = true;
        this.results.details.reactMounting = {
          status: 'healthy',
          contentLength: rootContent.length,
          hasMinimalContent: rootContent.length > 1000
        };
        console.log('   ✅ React app mounted successfully');
      } else {
        this.results.details.reactMounting = {
          status: 'unhealthy',
          contentLength: rootContent.length,
          issue: 'React app not rendering content'
        };
        console.log('   ❌ React app not mounting properly');
      }
    } catch (error) {
      this.results.details.reactMounting = {
        status: 'error',
        error: error.message
      };
      console.log('   ❌ React mounting test failed');
    }
  }

  async testContentLoading(page) {
    console.log('📄 Testing content loading...');
    
    try {
      const bodyText = await page.evaluate(() => document.body.innerText);
      const hasSubstantialContent = bodyText.length > 500;
      const hasExpectedSections = bodyText.includes('Save Money') && 
                                 bodyText.includes('How Saverly Works') &&
                                 bodyText.includes('$4.99/month');
      
      if (hasSubstantialContent && hasExpectedSections) {
        this.results.checks.contentLoading = true;
        this.results.details.contentLoading = {
          status: 'healthy',
          textLength: bodyText.length,
          hasExpectedSections: true,
          sections: ['pricing', 'features', 'call-to-action']
        };
        console.log('   ✅ Content loaded completely');
      } else {
        this.results.details.contentLoading = {
          status: 'partial',
          textLength: bodyText.length,
          hasExpectedSections,
          issue: hasSubstantialContent ? 'Missing expected sections' : 'Insufficient content'
        };
        console.log('   ⚠️  Content partially loaded');
      }
    } catch (error) {
      this.results.details.contentLoading = {
        status: 'error',
        error: error.message
      };
      console.log('   ❌ Content loading test failed');
    }
  }

  async testNavigation(page) {
    console.log('🧭 Testing navigation...');
    
    try {
      const navLinks = await page.$$eval('a[href]', links => 
        links.map(link => ({
          text: link.textContent.trim(),
          href: link.href
        })).filter(link => link.text.length > 0)
      );
      
      const expectedLinks = ['Home', 'Sign In'];
      const hasExpectedNav = expectedLinks.every(expected => 
        navLinks.some(link => link.text.includes(expected))
      );
      
      if (hasExpectedNav && navLinks.length >= 3) {
        this.results.checks.navigationWorking = true;
        this.results.details.navigation = {
          status: 'healthy',
          linksFound: navLinks.length,
          expectedLinksPresent: true,
          links: navLinks.slice(0, 5) // Show first 5 links
        };
        console.log('   ✅ Navigation working correctly');
      } else {
        this.results.details.navigation = {
          status: 'incomplete',
          linksFound: navLinks.length,
          expectedLinksPresent: hasExpectedNav,
          issue: 'Missing expected navigation links'
        };
        console.log('   ⚠️  Navigation partially working');
      }
    } catch (error) {
      this.results.details.navigation = {
        status: 'error',
        error: error.message
      };
      console.log('   ❌ Navigation test failed');
    }
  }

  async testSaverlyBranding(page) {
    console.log('🏷️  Testing Saverly branding...');
    
    try {
      const saverlyMentions = await page.evaluate(() => {
        const textContent = document.body.innerText.toLowerCase();
        const matches = textContent.match(/saverly/g);
        return matches ? matches.length : 0;
      });
      
      const hasTitle = await page.evaluate(() => 
        document.body.innerText.includes('Saverly')
      );
      
      const hasLogo = await page.$$('[class*="saverly"], [alt*="Saverly"], svg, [role="img"]');
      
      if (saverlyMentions >= 2 && hasTitle) {
        this.results.checks.saverlyBranding = true;
        this.results.details.branding = {
          status: 'healthy',
          saverlyMentions,
          hasTitle: true,
          logoElements: hasLogo.length,
          brandingScore: 'strong'
        };
        console.log('   ✅ Saverly branding present');
      } else {
        this.results.details.branding = {
          status: 'weak',
          saverlyMentions,
          hasTitle,
          logoElements: hasLogo.length,
          issue: 'Insufficient branding elements'
        };
        console.log('   ⚠️  Saverly branding weak');
      }
    } catch (error) {
      this.results.details.branding = {
        status: 'error',
        error: error.message
      };
      console.log('   ❌ Branding test failed');
    }
  }

  async testBusinessContent(page) {
    console.log('🏢 Testing business content...');
    
    try {
      const businessTerms = ['business', 'local', 'deals', 'discount', 'coupon'];
      const bodyText = await page.evaluate(() => document.body.innerText.toLowerCase());
      
      const foundTerms = businessTerms.filter(term => bodyText.includes(term));
      const hasSubscription = bodyText.includes('$4.99') && bodyText.includes('month');
      const hasFeatures = bodyText.includes('unlimited') && bodyText.includes('exclusive');
      
      if (foundTerms.length >= 4 && hasSubscription && hasFeatures) {
        this.results.checks.businessContent = true;
        this.results.details.businessContent = {
          status: 'healthy',
          businessTermsFound: foundTerms,
          hasSubscriptionInfo: hasSubscription,
          hasFeatureList: hasFeatures,
          contentCompleteness: 'high'
        };
        console.log('   ✅ Business content comprehensive');
      } else {
        this.results.details.businessContent = {
          status: 'incomplete',
          businessTermsFound: foundTerms,
          hasSubscriptionInfo: hasSubscription,
          hasFeatureList: hasFeatures,
          issue: 'Missing some business content elements'
        };
        console.log('   ⚠️  Business content incomplete');
      }
    } catch (error) {
      this.results.details.businessContent = {
        status: 'error',
        error: error.message
      };
      console.log('   ❌ Business content test failed');
    }
  }

  async testApiEndpoints() {
    console.log('🔌 Testing API endpoints...');
    
    const endpoints = ['/api/health', '/api/auth/session', '/api/businesses'];
    let workingEndpoints = 0;
    const endpointResults = {};
    
    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(APP_URL + endpoint, { 
          timeout: 5000,
          validateStatus: () => true 
        });
        
        if (response.status === 200) {
          workingEndpoints++;
          endpointResults[endpoint] = { status: 'working', httpCode: 200 };
        } else {
          endpointResults[endpoint] = { status: 'error', httpCode: response.status };
        }
      } catch (error) {
        endpointResults[endpoint] = { status: 'failed', error: error.code };
      }
    }
    
    if (workingEndpoints >= 2) {
      this.results.checks.apiEndpoints = true;
      this.results.details.apiEndpoints = {
        status: 'healthy',
        workingEndpoints,
        totalEndpoints: endpoints.length,
        results: endpointResults
      };
      console.log('   ✅ API endpoints responding');
    } else {
      this.results.details.apiEndpoints = {
        status: 'unhealthy',
        workingEndpoints,
        totalEndpoints: endpoints.length,
        results: endpointResults,
        issue: 'Too few API endpoints working'
      };
      console.log('   ❌ API endpoints not responding properly');
    }
  }

  async testPerformance(page) {
    console.log('⚡ Testing performance...');
    
    try {
      const startTime = Date.now();
      await page.reload({ waitUntil: 'networkidle' });
      const loadTime = Date.now() - startTime;
      
      const performanceRating = loadTime < 2000 ? 'excellent' : 
                               loadTime < 4000 ? 'good' : 
                               loadTime < 6000 ? 'acceptable' : 'poor';
      
      if (loadTime < 5000) {
        this.results.checks.performanceGood = true;
        this.results.details.performance = {
          status: 'healthy',
          loadTime,
          rating: performanceRating,
          benchmark: 'under-5s'
        };
        console.log(`   ✅ Performance ${performanceRating} (${loadTime}ms)`);
      } else {
        this.results.details.performance = {
          status: 'poor',
          loadTime,
          rating: performanceRating,
          issue: 'Load time exceeds 5 seconds'
        };
        console.log(`   ❌ Performance poor (${loadTime}ms)`);
      }
    } catch (error) {
      this.results.details.performance = {
        status: 'error',
        error: error.message
      };
      console.log('   ❌ Performance test failed');
    }
  }

  calculateOverallHealth() {
    const checkCount = Object.keys(this.results.checks).length;
    const passedChecks = Object.values(this.results.checks).filter(Boolean).length;
    
    this.results.score = Math.round((passedChecks / checkCount) * 100);
    
    if (this.results.score >= 90) {
      this.results.overallHealth = 'excellent';
    } else if (this.results.score >= 75) {
      this.results.overallHealth = 'good';
    } else if (this.results.score >= 50) {
      this.results.overallHealth = 'fair';
    } else if (this.results.score >= 25) {
      this.results.overallHealth = 'poor';
    } else {
      this.results.overallHealth = 'critical';
    }

    // Generate recommendations based on failed checks
    Object.entries(this.results.checks).forEach(([check, passed]) => {
      if (!passed) {
        switch (check) {
          case 'serverResponse':
            this.results.recommendations.push('Start the development server: npm run dev');
            break;
          case 'reactMounting':
            this.results.recommendations.push('Check React components and ensure proper rendering');
            break;
          case 'contentLoading':
            this.results.recommendations.push('Verify all page sections are loading correctly');
            break;
          case 'navigationWorking':
            this.results.recommendations.push('Fix navigation links and routing');
            break;
          case 'saverlyBranding':
            this.results.recommendations.push('Ensure Saverly branding is prominent and consistent');
            break;
          case 'businessContent':
            this.results.recommendations.push('Complete business content and feature descriptions');
            break;
          case 'apiEndpoints':
            this.results.recommendations.push('Check API server and endpoint configuration');
            break;
          case 'performanceGood':
            this.results.recommendations.push('Optimize app performance and loading times');
            break;
        }
      }
    });
  }

  generateReport() {
    console.log('\n' + '═'.repeat(60));
    console.log('🏥 SAVERLY HEALTH CHECK REPORT');
    console.log('═'.repeat(60));
    
    const statusEmoji = {
      'excellent': '🟢',
      'good': '🟡',
      'fair': '🟠',
      'poor': '🔴',
      'critical': '💀'
    };
    
    console.log(`\n📊 Overall Health: ${statusEmoji[this.results.overallHealth]} ${this.results.overallHealth.toUpperCase()}`);
    console.log(`🎯 Health Score: ${this.results.score}/100`);
    
    console.log('\n📋 Health Check Results:');
    Object.entries(this.results.checks).forEach(([check, passed]) => {
      const emoji = passed ? '✅' : '❌';
      const checkName = check.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      console.log(`   ${emoji} ${checkName}`);
    });
    
    if (this.results.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      this.results.recommendations.forEach((rec, i) => {
        console.log(`   ${i + 1}. ${rec}`);
      });
    }
    
    if (this.results.overallHealth === 'excellent') {
      console.log('\n🎉 Congratulations! Your Saverly app is running perfectly!');
      console.log('🚀 Ready for production deployment.');
    } else if (this.results.overallHealth === 'good') {
      console.log('\n👍 Your Saverly app is running well with minor issues.');
      console.log('🔧 Address the recommendations above for optimal performance.');
    } else {
      console.log('\n⚠️  Your Saverly app needs attention.');
      console.log('🛠️  Please address the critical issues above.');
    }
    
    console.log('\n' + '═'.repeat(60));
  }
}

// Run the health check
async function main() {
  const healthCheck = new SaverlyHealthCheck();
  try {
    await healthCheck.runHealthCheck();
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}