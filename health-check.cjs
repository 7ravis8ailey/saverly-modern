#!/usr/bin/env node

/**
 * Saverly Local Development Health Check
 * 
 * Comprehensive validation script that ensures the local development server
 * is truly functional, not just responding with HTTP 200.
 * 
 * Usage: node health-check.js [--url http://localhost:5177] [--timeout 30000] [--verbose]
 */

const axios = require('axios');
const { JSDOM } = require('jsdom');
const { performance } = require('perf_hooks');

// Configuration
const urlArg = process.argv.find(arg => arg.startsWith('--url='));
const timeoutArg = process.argv.find(arg => arg.startsWith('--timeout='));

const CONFIG = {
  baseUrl: urlArg ? urlArg.split('=')[1] : 'http://localhost:5177',
  timeout: parseInt(timeoutArg ? timeoutArg.split('=')[1] : '30000'),
  verbose: process.argv.includes('--verbose'),
  retryAttempts: 3,
  retryDelay: 2000
};

// Test results storage
const results = {
  overall: { status: 'UNKNOWN', startTime: Date.now() },
  tests: {}
};

// Utility functions
const log = (message, level = 'INFO') => {
  const timestamp = new Date().toISOString();
  const colors = {
    INFO: '\x1b[36m',    // Cyan
    SUCCESS: '\x1b[32m', // Green
    WARNING: '\x1b[33m', // Yellow
    ERROR: '\x1b[31m',   // Red
    RESET: '\x1b[0m'
  };
  
  if (CONFIG.verbose || level !== 'INFO') {
    console.log(`${colors[level]}[${timestamp}] ${level}: ${message}${colors.RESET}`);
  }
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const withTimeout = (promise, timeoutMs, testName) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`${testName} timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
};

const recordResult = (testName, passed, message, details = {}) => {
  results.tests[testName] = {
    status: passed ? 'PASS' : 'FAIL',
    message,
    timestamp: Date.now(),
    ...details
  };
  
  const status = passed ? 'SUCCESS' : 'ERROR';
  log(`${testName}: ${message}`, status);
};

// Test 1: Basic HTTP Response Validation
async function testHttpResponse() {
  const testName = 'HTTP Response';
  const startTime = performance.now();
  
  try {
    log(`Testing HTTP response for ${CONFIG.baseUrl}...`);
    
    const response = await withTimeout(
      axios.get(CONFIG.baseUrl, {
        timeout: CONFIG.timeout,
        validateStatus: (status) => status < 500, // Accept any status < 500
        headers: {
          'User-Agent': 'Saverly-HealthCheck/1.0'
        }
      }),
      CONFIG.timeout,
      testName
    );
    
    const responseTime = Math.round(performance.now() - startTime);
    
    if (response.status === 200) {
      recordResult(testName, true, `Server responding with HTTP 200`, {
        responseTime: `${responseTime}ms`,
        statusCode: response.status,
        headers: {
          'content-type': response.headers['content-type'],
          'content-length': response.headers['content-length']
        }
      });
      return { success: true, data: response.data, responseTime };
    } else {
      recordResult(testName, false, `Server responded with HTTP ${response.status}`, {
        responseTime: `${responseTime}ms`,
        statusCode: response.status
      });
      return { success: false, statusCode: response.status };
    }
    
  } catch (error) {
    const responseTime = Math.round(performance.now() - startTime);
    
    if (error.code === 'ECONNREFUSED') {
      recordResult(testName, false, `Server not running or connection refused`, {
        responseTime: `${responseTime}ms`,
        error: 'ECONNREFUSED'
      });
    } else if (error.message.includes('timeout')) {
      recordResult(testName, false, `Request timed out after ${CONFIG.timeout}ms`, {
        responseTime: `${responseTime}ms`,
        error: 'TIMEOUT'
      });
    } else {
      recordResult(testName, false, `Network error: ${error.message}`, {
        responseTime: `${responseTime}ms`,
        error: error.code || error.message
      });
    }
    
    return { success: false, error };
  }
}

// Test 2: HTML Content Validation
async function testHtmlContent(htmlData) {
  const testName = 'HTML Content';
  
  try {
    log('Validating HTML content structure...');
    
    if (!htmlData || typeof htmlData !== 'string') {
      recordResult(testName, false, 'No HTML content received');
      return { success: false };
    }
    
    const dom = new JSDOM(htmlData);
    const document = dom.window.document;
    
    // Check for basic HTML structure
    const hasDoctype = htmlData.trim().toLowerCase().startsWith('<!doctype html>');
    const hasHtmlTag = document.querySelector('html') !== null;
    const hasHead = document.querySelector('head') !== null;
    const hasBody = document.querySelector('body') !== null;
    const hasTitle = document.querySelector('title') !== null;
    
    // Check for Vite/React specific elements
    const hasRootDiv = document.querySelector('#root') !== null;
    const hasViteScripts = document.querySelectorAll('script[type="module"]').length > 0;
    
    // Check for empty/error pages
    const bodyText = document.body && document.body.textContent ? document.body.textContent.trim() : '';
    const isEmpty = bodyText.length < 100;
    const hasErrorMessages = bodyText.toLowerCase().includes('error') || 
                            bodyText.toLowerCase().includes('cannot') ||
                            bodyText.toLowerCase().includes('failed');
    
    const validationScore = [
      hasDoctype, hasHtmlTag, hasHead, hasBody, hasTitle, hasRootDiv, hasViteScripts
    ].filter(Boolean).length;
    
    const isValid = validationScore >= 6 && !isEmpty && !hasErrorMessages;
    
    recordResult(testName, isValid, 
      isValid ? 'HTML structure is valid and complete' : 'HTML structure issues detected', {
      validation: {
        doctype: hasDoctype,
        htmlTag: hasHtmlTag,
        headTag: hasHead,
        bodyTag: hasBody,
        titleTag: hasTitle,
        rootDiv: hasRootDiv,
        viteScripts: hasViteScripts,
        isEmpty: isEmpty,
        hasErrors: hasErrorMessages
      },
      score: `${validationScore}/7`,
      contentLength: htmlData.length
    });
    
    return { success: isValid, document };
    
  } catch (error) {
    recordResult(testName, false, `HTML parsing failed: ${error.message}`);
    return { success: false, error };
  }
}

// Test 3: Key UI Elements Detection
async function testKeyElements(document) {
  const testName = 'Key UI Elements';
  
  try {
    log('Checking for key UI elements...');
    
    if (!document) {
      recordResult(testName, false, 'No document available for element testing');
      return { success: false };
    }
    
    // Saverly-specific elements to check for
    const elementChecks = {
      // Navigation elements
      navbar: document.querySelector('nav') !== null,
      saverlyLogo: document.querySelector('[aria-label*="Saverly"]') !== null || 
                   (document.documentElement && document.documentElement.textContent && document.documentElement.textContent.includes('Saverly')),
      
      // Authentication elements
      authForm: document.querySelector('form') !== null ||
                document.querySelector('input[type="email"]') !== null ||
                document.querySelector('input[type="password"]') !== null,
      
      // Button elements
      buttons: document.querySelectorAll('button').length > 0,
      
      // Navigation links
      links: document.querySelectorAll('a').length > 0,
      
      // React root element
      reactRoot: document.querySelector('#root') !== null,
      
      // Main content area
      mainContent: document.querySelector('main') !== null || 
                   document.querySelector('[role="main"]') !== null
    };
    
    const passedChecks = Object.entries(elementChecks).filter(([, passed]) => passed);
    const elementScore = passedChecks.length;
    const totalChecks = Object.keys(elementChecks).length;
    
    const hasMinimumElements = elementScore >= Math.ceil(totalChecks * 0.6); // 60% threshold
    
    recordResult(testName, hasMinimumElements,
      hasMinimumElements ? `Found ${elementScore}/${totalChecks} key elements` : 
                          `Missing key elements (${elementScore}/${totalChecks})`, {
      elements: elementChecks,
      score: `${elementScore}/${totalChecks}`,
      threshold: '60%'
    });
    
    return { success: hasMinimumElements, elementChecks };
    
  } catch (error) {
    recordResult(testName, false, `Element detection failed: ${error.message}`);
    return { success: false, error };
  }
}

// Test 4: JavaScript Loading Validation
async function testJavaScriptLoading(htmlData) {
  const testName = 'JavaScript Loading';
  
  try {
    log('Validating JavaScript loading...');
    
    if (!htmlData) {
      recordResult(testName, false, 'No HTML data to check for JavaScript');
      return { success: false };
    }
    
    // Check for script tags
    const scriptMatches = htmlData.match(/<script[^>]*>/gi) || [];
    const moduleScripts = scriptMatches.filter(script => script.includes('type="module"'));
    const srcScripts = scriptMatches.filter(script => script.includes('src='));
    
    // Check for Vite-specific patterns
    const hasViteClient = htmlData.includes('@vite/client') || htmlData.includes('vite/client');
    const hasMainScript = htmlData.includes('main.tsx') || htmlData.includes('main.ts') || htmlData.includes('main.jsx') || htmlData.includes('main.js');
    
    // Check for React/modern JS patterns
    const hasModernJS = moduleScripts.length > 0;
    
    const jsScore = [
      scriptMatches.length > 0,
      moduleScripts.length > 0,
      srcScripts.length > 0,
      hasViteClient,
      hasMainScript,
      hasModernJS
    ].filter(Boolean).length;
    
    const hasValidJS = jsScore >= 3;
    
    recordResult(testName, hasValidJS,
      hasValidJS ? `JavaScript loading configured correctly` : 
                  `JavaScript loading issues detected`, {
      scripts: {
        total: scriptMatches.length,
        moduleScripts: moduleScripts.length,
        srcScripts: srcScripts.length,
        hasViteClient: hasViteClient,
        hasMainScript: hasMainScript,
        hasModernJS: hasModernJS
      },
      score: `${jsScore}/6`
    });
    
    return { success: hasValidJS };
    
  } catch (error) {
    recordResult(testName, false, `JavaScript validation failed: ${error.message}`);
    return { success: false, error };
  }
}

// Test 5: API Endpoints Validation
async function testApiEndpoints() {
  const testName = 'API Endpoints';
  
  try {
    log('Testing critical API endpoints...');
    
    const endpoints = [
      { path: '/auth', expectedStatus: [200, 404], description: 'Authentication page' },
      { path: '/dashboard', expectedStatus: [200, 401, 404], description: 'Dashboard page' },
      { path: '/simple', expectedStatus: [200, 404], description: 'Simple test page' }
    ];
    
    const endpointResults = [];
    
    for (const endpoint of endpoints) {
      try {
        const url = `${CONFIG.baseUrl}${endpoint.path}`;
        const response = await withTimeout(
          axios.get(url, {
            timeout: CONFIG.timeout / 2,
            validateStatus: () => true // Accept all status codes
          }),
          CONFIG.timeout / 2,
          `${testName} - ${endpoint.path}`
        );
        
        const isExpectedStatus = endpoint.expectedStatus.includes(response.status);
        endpointResults.push({
          path: endpoint.path,
          status: response.status,
          success: isExpectedStatus,
          description: endpoint.description
        });
        
        if (CONFIG.verbose) {
          log(`  ${endpoint.path}: HTTP ${response.status} (${isExpectedStatus ? 'OK' : 'Unexpected'})`);
        }
        
      } catch (error) {
        endpointResults.push({
          path: endpoint.path,
          status: 'ERROR',
          success: false,
          error: error.message,
          description: endpoint.description
        });
        
        if (CONFIG.verbose) {
          log(`  ${endpoint.path}: ERROR - ${error.message}`);
        }
      }
    }
    
    const successfulEndpoints = endpointResults.filter(result => result.success).length;
    const totalEndpoints = endpoints.length;
    const endpointScore = successfulEndpoints / totalEndpoints;
    
    const hasValidEndpoints = endpointScore >= 0.5; // 50% threshold
    
    recordResult(testName, hasValidEndpoints,
      hasValidEndpoints ? `${successfulEndpoints}/${totalEndpoints} endpoints responding correctly` :
                         `Only ${successfulEndpoints}/${totalEndpoints} endpoints working`, {
      endpoints: endpointResults,
      score: `${successfulEndpoints}/${totalEndpoints}`,
      threshold: '50%'
    });
    
    return { success: hasValidEndpoints, endpointResults };
    
  } catch (error) {
    recordResult(testName, false, `API endpoint testing failed: ${error.message}`);
    return { success: false, error };
  }
}

// Test 6: CSS/Styling Validation
async function testStylingLoads(htmlData) {
  const testName = 'CSS/Styling';
  
  try {
    log('Validating CSS and styling...');
    
    if (!htmlData) {
      recordResult(testName, false, 'No HTML data to check for styling');
      return { success: false };
    }
    
    // Check for CSS links
    const cssLinkMatches = htmlData.match(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi) || [];
    
    // Check for inline styles
    const inlineStyleMatches = htmlData.match(/<style[^>]*>/gi) || [];
    
    // Check for Tailwind CSS (common in modern React apps)
    const hasTailwind = htmlData.includes('tailwind') || htmlData.includes('tw-');
    
    // Check for CSS modules or styled-components patterns
    const hasCSSModules = htmlData.includes('css?') || htmlData.includes('.module.css');
    
    // Check for Vite CSS handling
    const hasViteCSS = htmlData.includes('?t=') || htmlData.includes('.css');
    
    const stylingScore = [
      cssLinkMatches.length > 0,
      inlineStyleMatches.length > 0 || hasTailwind,
      hasCSSModules || hasViteCSS,
      htmlData.includes('class=') || htmlData.includes('className=')
    ].filter(Boolean).length;
    
    const hasValidStyling = stylingScore >= 2;
    
    recordResult(testName, hasValidStyling,
      hasValidStyling ? 'Styling appears to be loading correctly' : 
                       'Potential styling issues detected', {
      styling: {
        cssLinks: cssLinkMatches.length,
        inlineStyles: inlineStyleMatches.length,
        hasTailwind: hasTailwind,
        hasCSSModules: hasCSSModules,
        hasViteCSS: hasViteCSS
      },
      score: `${stylingScore}/4`
    });
    
    return { success: hasValidStyling };
    
  } catch (error) {
    recordResult(testName, false, `Styling validation failed: ${error.message}`);
    return { success: false, error };
  }
}

// Test 7: Performance and Load Time
async function testPerformance() {
  const testName = 'Performance';
  
  try {
    log('Testing performance metrics...');
    
    const startTime = performance.now();
    
    // Test multiple requests to check consistency
    const performanceTests = [];
    for (let i = 0; i < 3; i++) {
      const requestStart = performance.now();
      try {
        await axios.get(CONFIG.baseUrl, { timeout: CONFIG.timeout });
        performanceTests.push(performance.now() - requestStart);
      } catch (error) {
        performanceTests.push(null);
      }
    }
    
    const totalTime = performance.now() - startTime;
    const validTests = performanceTests.filter(t => t !== null);
    const avgResponseTime = validTests.length > 0 ? 
      validTests.reduce((a, b) => a + b, 0) / validTests.length : null;
    
    const performanceThresholds = {
      excellent: 500,   // < 500ms
      good: 1000,       // < 1s
      acceptable: 3000  // < 3s
    };
    
    let performanceRating = 'poor';
    if (avgResponseTime && avgResponseTime < performanceThresholds.excellent) {
      performanceRating = 'excellent';
    } else if (avgResponseTime && avgResponseTime < performanceThresholds.good) {
      performanceRating = 'good';
    } else if (avgResponseTime && avgResponseTime < performanceThresholds.acceptable) {
      performanceRating = 'acceptable';
    }
    
    const hasGoodPerformance = avgResponseTime && avgResponseTime < performanceThresholds.acceptable;
    
    recordResult(testName, hasGoodPerformance,
      hasGoodPerformance ? 
        `Performance is ${performanceRating} (avg: ${Math.round(avgResponseTime)}ms)` :
        `Performance issues detected (avg: ${avgResponseTime ? Math.round(avgResponseTime) + 'ms' : 'N/A'})`, {
      metrics: {
        avgResponseTime: avgResponseTime ? Math.round(avgResponseTime) + 'ms' : 'N/A',
        totalTestTime: Math.round(totalTime) + 'ms',
        successfulRequests: validTests.length,
        rating: performanceRating
      },
      thresholds: performanceThresholds
    });
    
    return { success: hasGoodPerformance, avgResponseTime };
    
  } catch (error) {
    recordResult(testName, false, `Performance testing failed: ${error.message}`);
    return { success: false, error };
  }
}

// Main health check execution
async function runHealthCheck() {
  console.log('\n🏥 Saverly Development Server Health Check');
  console.log('==========================================');
  console.log(`Target URL: ${CONFIG.baseUrl}`);
  console.log(`Timeout: ${CONFIG.timeout}ms`);
  console.log('');
  
  try {
    // Test 1: HTTP Response
    const httpResult = await testHttpResponse();
    if (!httpResult.success) {
      // If HTTP fails, try retrying
      log(`Retrying HTTP test in ${CONFIG.retryDelay}ms...`, 'WARNING');
      await sleep(CONFIG.retryDelay);
      const retryResult = await testHttpResponse();
      if (!retryResult.success) {
        results.overall.status = 'FAIL';
        return generateReport();
      }
      httpResult.data = retryResult.data;
    }
    
    const htmlData = httpResult.data;
    
    // Run remaining tests in parallel for speed
    const [
      htmlResult,
      jsResult,
      apiResult,
      styleResult,
      performanceResult
    ] = await Promise.all([
      testHtmlContent(htmlData),
      testJavaScriptLoading(htmlData),
      testApiEndpoints(),
      testStylingLoads(htmlData),
      testPerformance()
    ]);
    
    // Test key elements (requires DOM from HTML test)
    const elementResult = await testKeyElements(htmlResult.document);
    
    // Determine overall status
    const allTests = [httpResult, htmlResult, elementResult, jsResult, apiResult, styleResult, performanceResult];
    const passedTests = allTests.filter(result => result.success).length;
    const totalTests = allTests.length;
    
    if (passedTests === totalTests) {
      results.overall.status = 'PASS';
    } else if (passedTests >= Math.ceil(totalTests * 0.7)) {
      results.overall.status = 'PASS_WITH_WARNINGS';
    } else {
      results.overall.status = 'FAIL';
    }
    
  } catch (error) {
    log(`Health check failed with error: ${error.message}`, 'ERROR');
    results.overall.status = 'ERROR';
    results.overall.error = error.message;
  }
  
  return generateReport();
}

// Generate comprehensive report
function generateReport() {
  const endTime = Date.now();
  const duration = endTime - results.overall.startTime;
  
  console.log('\n📊 HEALTH CHECK RESULTS');
  console.log('========================');
  
  // Overall status
  const statusEmoji = {
    PASS: '✅',
    PASS_WITH_WARNINGS: '⚠️',
    FAIL: '❌',
    ERROR: '💥',
    UNKNOWN: '❓'
  };
  
  console.log(`\n${statusEmoji[results.overall.status]} Overall Status: ${results.overall.status}`);
  console.log(`⏱️  Total Duration: ${duration}ms`);
  console.log(`🎯 Target URL: ${CONFIG.baseUrl}`);
  
  // Individual test results
  console.log('\n📋 Test Results:');
  console.log('================');
  
  const testOrder = [
    'HTTP Response',
    'HTML Content',
    'Key UI Elements',
    'JavaScript Loading',
    'API Endpoints',
    'CSS/Styling',
    'Performance'
  ];
  
  for (const testName of testOrder) {
    const test = results.tests[testName];
    if (test) {
      const emoji = test.status === 'PASS' ? '✅' : '❌';
      console.log(`${emoji} ${testName}: ${test.message}`);
      
      if (CONFIG.verbose && test.details) {
        console.log(`   Details: ${JSON.stringify(test.details, null, 2)}`);
      }
    }
  }
  
  // Summary and recommendations
  const passedTests = Object.values(results.tests).filter(test => test.status === 'PASS').length;
  const totalTests = Object.keys(results.tests).length;
  
  console.log('\n📈 Summary:');
  console.log(`Tests Passed: ${passedTests}/${totalTests} (${Math.round(passedTests/totalTests*100)}%)`);
  
  if (results.overall.status === 'PASS') {
    console.log('🎉 Server is healthy and ready for development!');
  } else if (results.overall.status === 'PASS_WITH_WARNINGS') {
    console.log('⚠️  Server is mostly functional but has some issues that should be addressed.');
  } else {
    console.log('🚨 Server has critical issues that need immediate attention.');
    
    // Provide specific recommendations
    console.log('\n🔧 Recommendations:');
    const failedTests = Object.entries(results.tests)
      .filter(([, test]) => test.status === 'FAIL')
      .map(([name]) => name);
    
    for (const failedTest of failedTests) {
      switch (failedTest) {
        case 'HTTP Response':
          console.log('   • Ensure the development server is running: npm run dev');
          console.log('   • Check if the server is running on the expected port');
          break;
        case 'HTML Content':
          console.log('   • Check for build errors in the development server logs');
          console.log('   • Verify Vite configuration is correct');
          break;
        case 'Key UI Elements':
          console.log('   • Check React component rendering');
          console.log('   • Look for JavaScript errors in browser console');
          break;
        case 'JavaScript Loading':
          console.log('   • Verify main.tsx/jsx file exists and is properly configured');
          console.log('   • Check Vite build configuration');
          break;
        case 'API Endpoints':
          console.log('   • Check routing configuration in React Router');
          console.log('   • Verify all route components are properly exported');
          break;
        case 'CSS/Styling':
          console.log('   • Check Tailwind CSS configuration');
          console.log('   • Verify CSS imports in main.tsx');
          break;
        case 'Performance':
          console.log('   • Check for network issues or server overload');
          console.log('   • Consider optimizing build configuration');
          break;
      }
    }
  }
  
  console.log('');
  
  // Exit with appropriate code
  if (results.overall.status === 'PASS' || results.overall.status === 'PASS_WITH_WARNINGS') {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n⛔ Health check interrupted by user');
  process.exit(130);
});

process.on('SIGTERM', () => {
  console.log('\n\n⛔ Health check terminated');
  process.exit(143);
});

// Run the health check
if (require.main === module) {
  runHealthCheck().catch((error) => {
    console.error('❌ Health check crashed:', error.message);
    process.exit(1);
  });
}

module.exports = { runHealthCheck, CONFIG };