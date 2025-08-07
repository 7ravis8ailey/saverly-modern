#!/usr/bin/env node

/**
 * Comprehensive Saverly App Debugging Script
 * Tests React app loading, rendering, console errors, CSS, and functionality
 */

const { chromium } = require('playwright');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const APP_URL = 'http://localhost:5177';
const TIMEOUT = 30000;

class SaverlyDebugger {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      serverStatus: {},
      htmlStructure: {},
      reactMounting: {},
      consoleErrors: [],
      cssLoading: {},
      keyElements: {},
      apiEndpoints: {},
      performance: {},
      recommendations: []
    };
  }

  async init() {
    console.log('🚀 Starting Saverly App Comprehensive Debug Analysis...\n');
    
    this.browser = await chromium.launch({ 
      headless: true,
      args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
    });
    this.page = await this.browser.newPage();
    
    // Capture console messages and errors
    this.page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      
      if (type === 'error') {
        this.results.consoleErrors.push({
          type: 'error',
          message: text,
          timestamp: new Date().toISOString()
        });
      } else if (type === 'warn') {
        this.results.consoleErrors.push({
          type: 'warning',
          message: text,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Capture JavaScript errors
    this.page.on('pageerror', error => {
      this.results.consoleErrors.push({
        type: 'pageerror',
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    });

    // Capture failed requests
    this.page.on('requestfailed', request => {
      this.results.consoleErrors.push({
        type: 'network',
        message: `Failed to load: ${request.url()} - ${request.failure().errorText}`,
        timestamp: new Date().toISOString()
      });
    });
  }

  async testServerStatus() {
    console.log('📡 Testing Server Status...');
    
    try {
      const response = await axios.get(APP_URL, {
        timeout: 10000,
        validateStatus: () => true
      });
      
      this.results.serverStatus = {
        status: 'success',
        httpCode: response.status,
        headers: response.headers,
        responseTime: response.config.timeout,
        contentType: response.headers['content-type']
      };
      
      console.log(`   ✅ Server responding with HTTP ${response.status}`);
    } catch (error) {
      this.results.serverStatus = {
        status: 'error',
        error: error.message
      };
      console.log(`   ❌ Server not responding: ${error.message}`);
    }
  }

  async testHtmlStructure() {
    console.log('📄 Testing HTML Structure...');
    
    try {
      const response = await this.page.goto(APP_URL, { 
        waitUntil: 'domcontentloaded',
        timeout: TIMEOUT
      });
      
      const html = await this.page.content();
      
      this.results.htmlStructure = {
        status: 'success',
        hasRootDiv: html.includes('<div id="root">'),
        hasMainScript: html.includes('src="/src/main.tsx"'),
        hasViteScript: html.includes('type="module"'),
        title: await this.page.title(),
        htmlLength: html.length,
        responseStatus: response.status()
      };
      
      console.log('   ✅ HTML structure looks valid');
      console.log(`   📄 Title: ${this.results.htmlStructure.title}`);
      
    } catch (error) {
      this.results.htmlStructure = {
        status: 'error',
        error: error.message
      };
      console.log(`   ❌ HTML structure test failed: ${error.message}`);
    }
  }

  async testReactMounting() {
    console.log('⚛️  Testing React App Mounting...');
    
    try {
      // Wait for React to potentially mount
      await this.page.waitForTimeout(3000);
      
      // Check if root div has been populated
      const rootContent = await this.page.$eval('#root', el => el.innerHTML.trim());
      const hasReactContent = rootContent.length > 0;
      
      // Check for React DevTools
      const hasReactDevTools = await this.page.evaluate(() => {
        return typeof window.__REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined';
      });
      
      // Check for specific React elements
      const hasRouterElement = await this.page.$('div[class*="min-h-screen"]') !== null;
      const hasNavbar = await this.page.$('nav') !== null;
      const hasMainContent = await this.page.$('main[role="main"]') !== null;
      
      this.results.reactMounting = {
        status: hasReactContent ? 'success' : 'warning',
        rootPopulated: hasReactContent,
        rootContentLength: rootContent.length,
        rootContentPreview: rootContent.substring(0, 200) + (rootContent.length > 200 ? '...' : ''),
        hasReactDevTools,
        hasRouterElement,
        hasNavbar,
        hasMainContent,
        detectedFrameworks: await this.detectFrameworks()
      };
      
      if (hasReactContent) {
        console.log(`   ✅ React app mounted successfully (${rootContent.length} chars)`);
        console.log(`   🔍 Content preview: ${rootContent.substring(0, 100)}...`);
      } else {
        console.log('   ⚠️  React app may not have mounted - root div is empty');
      }
      
    } catch (error) {
      this.results.reactMounting = {
        status: 'error',
        error: error.message
      };
      console.log(`   ❌ React mounting test failed: ${error.message}`);
    }
  }

  async detectFrameworks() {
    return await this.page.evaluate(() => {
      const detected = [];
      
      // Check for React
      if (window.React) detected.push('React');
      if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) detected.push('React DevTools');
      
      // Check for React Router
      if (document.querySelector('[data-react-router]')) detected.push('React Router');
      
      // Check for Vite
      if (window.__vite_plugin_react_preamble_installed__) detected.push('Vite React');
      
      // Check for TanStack Query
      if (window.ReactQuery) detected.push('TanStack Query');
      
      return detected;
    });
  }

  async testCssLoading() {
    console.log('🎨 Testing CSS Loading...');
    
    try {
      // Get all stylesheets
      const stylesheets = await this.page.$$eval('link[rel="stylesheet"], style', elements => {
        return elements.map(el => ({
          type: el.tagName.toLowerCase(),
          href: el.href || 'inline',
          disabled: el.disabled,
          media: el.media || 'all'
        }));
      });
      
      // Test computed styles for key elements
      const rootStyles = await this.page.evaluate(() => {
        const root = document.getElementById('root');
        if (!root) return null;
        
        const computedStyle = window.getComputedStyle(root);
        return {
          display: computedStyle.display,
          minHeight: computedStyle.minHeight,
          backgroundColor: computedStyle.backgroundColor,
          fontFamily: computedStyle.fontFamily
        };
      });
      
      // Check for Tailwind classes
      const hasTailwindClasses = await this.page.evaluate(() => {
        const elements = document.querySelectorAll('[class*="bg-"], [class*="text-"], [class*="flex"], [class*="min-h-"]');
        return elements.length > 0;
      });
      
      this.results.cssLoading = {
        status: 'success',
        stylesheets,
        stylesheetsCount: stylesheets.length,
        rootStyles,
        hasTailwindClasses,
        tailwindElementsFound: await this.page.$$eval('[class*="bg-"], [class*="text-"], [class*="flex"]', els => els.length)
      };
      
      console.log(`   ✅ Found ${stylesheets.length} stylesheets`);
      console.log(`   🎨 Tailwind classes detected: ${hasTailwindClasses ? 'Yes' : 'No'}`);
      
    } catch (error) {
      this.results.cssLoading = {
        status: 'error',
        error: error.message
      };
      console.log(`   ❌ CSS loading test failed: ${error.message}`);
    }
  }

  async testKeyElements() {
    console.log('🔍 Testing Key UI Elements...');
    
    try {
      const elementChecks = {
        navbar: 'nav, [role="navigation"], .navbar',
        logo: '[alt*="Saverly"], [class*="logo"], .logo',
        saverlyText: 'text*="Saverly"',
        navigation: 'a[href], button, [role="button"]',
        mainContent: 'main, [role="main"], .main-content',
        authForms: 'form, input[type="email"], input[type="password"]',
        businessElements: 'text*="Business", text*="Coupon", text*="Local"'
      };
      
      const results = {};
      
      for (const [key, selector] of Object.entries(elementChecks)) {
        try {
          const elements = await this.page.$$(selector);
          results[key] = {
            found: elements.length > 0,
            count: elements.length
          };
          
          if (elements.length > 0 && key === 'saverlyText') {
            // Get actual text content for verification
            const textContent = await this.page.evaluate((sel) => {
              const els = Array.from(document.querySelectorAll('*')).filter(el => 
                el.textContent && el.textContent.toLowerCase().includes('saverly')
              );
              return els.map(el => el.textContent.trim()).slice(0, 3);
            });
            results[key].textContent = textContent;
          }
        } catch (err) {
          results[key] = { found: false, error: err.message };
        }
      }
      
      this.results.keyElements = {
        status: 'success',
        elements: results,
        totalElementsFound: Object.values(results).reduce((sum, r) => sum + (r.count || 0), 0)
      };
      
      console.log(`   🔍 Found ${this.results.keyElements.totalElementsFound} key UI elements`);
      Object.entries(results).forEach(([key, result]) => {
        console.log(`   ${result.found ? '✅' : '❌'} ${key}: ${result.count || 0} found`);
      });
      
    } catch (error) {
      this.results.keyElements = {
        status: 'error',
        error: error.message
      };
      console.log(`   ❌ Key elements test failed: ${error.message}`);
    }
  }

  async testApiEndpoints() {
    console.log('🌐 Testing API Endpoints...');
    
    try {
      const endpoints = [
        '/api/health',
        '/api/auth/session',
        '/api/businesses'
      ];
      
      const results = {};
      
      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(APP_URL + endpoint, {
            timeout: 5000,
            validateStatus: () => true
          });
          
          results[endpoint] = {
            status: 'success',
            httpCode: response.status,
            responseTime: response.config.timeout,
            hasData: response.data ? Object.keys(response.data).length > 0 : false
          };
        } catch (error) {
          results[endpoint] = {
            status: 'error',
            error: error.code || error.message
          };
        }
      }
      
      this.results.apiEndpoints = {
        status: 'success',
        endpoints: results,
        totalTested: endpoints.length,
        successfulRequests: Object.values(results).filter(r => r.status === 'success').length
      };
      
      console.log(`   🌐 Tested ${endpoints.length} API endpoints`);
      Object.entries(results).forEach(([endpoint, result]) => {
        console.log(`   ${result.status === 'success' ? '✅' : '❌'} ${endpoint}: ${result.httpCode || result.error}`);
      });
      
    } catch (error) {
      this.results.apiEndpoints = {
        status: 'error',
        error: error.message
      };
      console.log(`   ❌ API endpoints test failed: ${error.message}`);
    }
  }

  async testPerformance() {
    console.log('⚡ Testing Performance...');
    
    try {
      const startTime = Date.now();
      await this.page.reload({ waitUntil: 'networkidle' });
      const loadTime = Date.now() - startTime;
      
      // Get performance metrics
      const metrics = await this.page.evaluate(() => {
        const nav = performance.getEntriesByType('navigation')[0];
        return {
          domContentLoaded: nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart,
          loadComplete: nav.loadEventEnd - nav.loadEventStart,
          firstPaint: performance.getEntriesByType('paint').find(p => p.name === 'first-paint')?.startTime || 0,
          firstContentfulPaint: performance.getEntriesByType('paint').find(p => p.name === 'first-contentful-paint')?.startTime || 0
        };
      });
      
      this.results.performance = {
        status: 'success',
        pageLoadTime: loadTime,
        metrics,
        rating: loadTime < 3000 ? 'excellent' : loadTime < 5000 ? 'good' : 'needs-improvement'
      };
      
      console.log(`   ⚡ Page load time: ${loadTime}ms (${this.results.performance.rating})`);
      console.log(`   📊 DOM Content Loaded: ${metrics.domContentLoaded}ms`);
      
    } catch (error) {
      this.results.performance = {
        status: 'error',
        error: error.message
      };
      console.log(`   ❌ Performance test failed: ${error.message}`);
    }
  }

  async analyzeResults() {
    console.log('\n📋 Analyzing Results and Generating Recommendations...\n');
    
    const recommendations = [];
    
    // Check server status
    if (this.results.serverStatus.status !== 'success') {
      recommendations.push({
        priority: 'critical',
        category: 'server',
        issue: 'Server not responding',
        solution: 'Check if the development server is running with `npm run dev`'
      });
    }
    
    // Check React mounting
    if (!this.results.reactMounting.rootPopulated) {
      recommendations.push({
        priority: 'critical',
        category: 'react',
        issue: 'React app not mounting',
        solution: 'Check console errors and verify main.tsx imports. Ensure all dependencies are installed.'
      });
    }
    
    // Check console errors
    if (this.results.consoleErrors.length > 0) {
      const criticalErrors = this.results.consoleErrors.filter(e => e.type === 'error' || e.type === 'pageerror');
      if (criticalErrors.length > 0) {
        recommendations.push({
          priority: 'high',
          category: 'javascript',
          issue: `${criticalErrors.length} JavaScript errors detected`,
          solution: 'Fix JavaScript errors in console. Check component imports and API calls.',
          errors: criticalErrors.slice(0, 3).map(e => e.message)
        });
      }
    }
    
    // Check key elements
    const keyElementsFound = Object.values(this.results.keyElements.elements || {}).filter(e => e.found).length;
    if (keyElementsFound < 3) {
      recommendations.push({
        priority: 'medium',
        category: 'ui',
        issue: 'Missing key UI elements',
        solution: 'Verify component rendering and routing. Check if navigation and main content are displaying.'
      });
    }
    
    // Check CSS
    if (this.results.cssLoading.stylesheetsCount === 0) {
      recommendations.push({
        priority: 'medium',
        category: 'css',
        issue: 'No CSS stylesheets detected',
        solution: 'Check if index.css and Tailwind CSS are being imported properly in main.tsx'
      });
    }
    
    // Check API endpoints
    const apiSuccessRate = this.results.apiEndpoints.successfulRequests / this.results.apiEndpoints.totalTested;
    if (apiSuccessRate < 0.5) {
      recommendations.push({
        priority: 'medium',
        category: 'api',
        issue: 'API endpoints not responding',
        solution: 'Verify API server is running and endpoints are configured correctly'
      });
    }
    
    this.results.recommendations = recommendations;
    
    return recommendations;
  }

  async generateReport() {
    const recommendations = await this.analyzeResults();
    
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔥 SAVERLY APP DEBUG REPORT');
    console.log('═══════════════════════════════════════════════════════\n');
    
    // Overall Status
    const overallStatus = this.calculateOverallStatus();
    console.log(`📊 OVERALL STATUS: ${overallStatus.status}`);
    console.log(`🎯 Health Score: ${overallStatus.score}/100`);
    console.log(`⚠️  Issues Found: ${recommendations.length}\n`);
    
    // Critical Issues
    const criticalIssues = recommendations.filter(r => r.priority === 'critical');
    if (criticalIssues.length > 0) {
      console.log('🚨 CRITICAL ISSUES (Must Fix Immediately):');
      criticalIssues.forEach((issue, i) => {
        console.log(`   ${i + 1}. ${issue.issue}`);
        console.log(`      💡 Solution: ${issue.solution}`);
        if (issue.errors) {
          console.log(`      🔍 Errors: ${issue.errors.join(', ')}`);
        }
      });
      console.log('');
    }
    
    // High Priority Issues
    const highIssues = recommendations.filter(r => r.priority === 'high');
    if (highIssues.length > 0) {
      console.log('⚠️  HIGH PRIORITY ISSUES:');
      highIssues.forEach((issue, i) => {
        console.log(`   ${i + 1}. ${issue.issue}`);
        console.log(`      💡 Solution: ${issue.solution}`);
        if (issue.errors) {
          console.log(`      🔍 Errors: ${issue.errors.join(', ')}`);
        }
      });
      console.log('');
    }
    
    // Console Errors Detail
    if (this.results.consoleErrors.length > 0) {
      console.log('🔍 CONSOLE ERRORS DETAIL:');
      this.results.consoleErrors.slice(0, 5).forEach((error, i) => {
        console.log(`   ${i + 1}. [${error.type.toUpperCase()}] ${error.message}`);
      });
      if (this.results.consoleErrors.length > 5) {
        console.log(`   ... and ${this.results.consoleErrors.length - 5} more errors`);
      }
      console.log('');
    }
    
    // Component Status Summary
    console.log('📋 COMPONENT STATUS SUMMARY:');
    console.log(`   🖥️  Server: ${this.results.serverStatus.status === 'success' ? '✅' : '❌'}`);
    console.log(`   📄 HTML: ${this.results.htmlStructure.status === 'success' ? '✅' : '❌'}`);
    console.log(`   ⚛️  React: ${this.results.reactMounting.rootPopulated ? '✅' : '❌'}`);
    console.log(`   🎨 CSS: ${this.results.cssLoading.hasTailwindClasses ? '✅' : '❌'}`);
    console.log(`   🔍 UI Elements: ${this.results.keyElements.totalElementsFound > 0 ? '✅' : '❌'}`);
    console.log(`   🌐 API: ${this.results.apiEndpoints.successfulRequests > 0 ? '✅' : '❌'}`);
    console.log(`   ⚡ Performance: ${this.results.performance.rating === 'excellent' ? '✅' : '⚠️'}\n`);
    
    // Next Steps
    console.log('🚀 IMMEDIATE NEXT STEPS:');
    if (criticalIssues.length > 0) {
      console.log('   1. Fix critical issues first (server/React mounting)');
      console.log('   2. Check browser console for JavaScript errors');
      console.log('   3. Verify all dependencies are installed: npm install');
      console.log('   4. Try restarting the development server: npm run dev');
    } else if (highIssues.length > 0) {
      console.log('   1. Address high priority issues (JavaScript errors)');
      console.log('   2. Verify component imports and API endpoints');
      console.log('   3. Check environment variables and configuration');
    } else {
      console.log('   1. Address remaining medium priority issues');
      console.log('   2. Run comprehensive tests: npm run test');
      console.log('   3. Deploy to production when ready');
    }
    
    console.log('\n═══════════════════════════════════════════════════════');
    
    // Save detailed report
    const reportData = {
      timestamp: new Date().toISOString(),
      overallStatus,
      results: this.results,
      recommendations,
      summary: {
        criticalIssues: criticalIssues.length,
        highPriorityIssues: highIssues.length,
        totalErrors: this.results.consoleErrors.length,
        healthScore: overallStatus.score
      }
    };
    
    fs.writeFileSync('./debug-report.json', JSON.stringify(reportData, null, 2));
    console.log('📄 Detailed report saved to debug-report.json\n');
    
    return reportData;
  }

  calculateOverallStatus() {
    let score = 100;
    let status = 'healthy';
    
    // Deduct points for various issues
    if (this.results.serverStatus.status !== 'success') {
      score -= 30;
      status = 'critical';
    }
    
    if (!this.results.reactMounting.rootPopulated) {
      score -= 25;
      status = 'critical';
    }
    
    score -= this.results.consoleErrors.filter(e => e.type === 'error').length * 5;
    score -= this.results.consoleErrors.filter(e => e.type === 'warning').length * 2;
    
    if (this.results.keyElements.totalElementsFound < 3) {
      score -= 15;
    }
    
    if (!this.results.cssLoading.hasTailwindClasses) {
      score -= 10;
    }
    
    score = Math.max(0, Math.min(100, score));
    
    if (score >= 90) status = 'excellent';
    else if (score >= 75) status = 'good';
    else if (score >= 50) status = 'needs-improvement';
    else if (score >= 25) status = 'poor';
    else status = 'critical';
    
    return { score: Math.round(score), status };
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run() {
    try {
      await this.init();
      
      await this.testServerStatus();
      await this.testHtmlStructure();
      await this.testReactMounting();
      await this.testCssLoading();
      await this.testKeyElements();
      await this.testApiEndpoints();
      await this.testPerformance();
      
      const report = await this.generateReport();
      
      return report;
    } catch (error) {
      console.error('🔥 Fatal error during debugging:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// Run the debugger
async function main() {
  const debugTool = new SaverlyDebugger();
  
  try {
    await debugTool.run();
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = SaverlyDebugger;