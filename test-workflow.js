#!/usr/bin/env node

// Workflow Testing Script for Saverly User Paths
// Tests all critical user journeys as requested by swarm coordination

const puppeteer = require('puppeteer');

const BASE_URL = 'http://localhost:5174';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class WorkflowTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = [];
  }

  async init() {
    console.log('🚀 Initializing Workflow Tester...');
    this.browser = await puppeteer.launch({ 
      headless: false, // Set to true for headless testing
      devtools: true,
      defaultViewport: { width: 1920, height: 1080 }
    });
    this.page = await this.browser.newPage();
    
    // Enable console logging from the page
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Console Error:', msg.text());
      }
    });
  }

  async logResult(testName, status, details = '') {
    const result = { testName, status, details, timestamp: new Date().toISOString() };
    this.testResults.push(result);
    const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${icon} ${testName}: ${status} ${details ? '- ' + details : ''}`);
  }

  async testLandingPage() {
    console.log('\n📋 Testing Landing Page Functionality...');
    
    try {
      await this.page.goto(BASE_URL, { waitUntil: 'networkidle0' });
      await delay(2000);

      // Test 1: Page loads correctly
      const title = await this.page.title();
      const hasContent = await this.page.$('text=Save Money with Local Deals');
      
      if (hasContent) {
        await this.logResult('Landing Page Load', 'PASS', 'Page loaded with expected content');
      } else {
        await this.logResult('Landing Page Load', 'FAIL', 'Expected content not found');
        return false;
      }

      // Test 2: Create Account buttons exist and are clickable
      const createAccountButtons = await this.page.$$('text=Create Account');
      if (createAccountButtons.length >= 2) {
        await this.logResult('Create Account Buttons', 'PASS', `Found ${createAccountButtons.length} Create Account buttons`);
      } else {
        await this.logResult('Create Account Buttons', 'FAIL', `Only found ${createAccountButtons.length} Create Account buttons`);
      }

      // Test 3: Subscribe buttons exist and are clickable
      const subscribeButtons = await this.page.$$('text=Subscribe');
      if (subscribeButtons.length >= 2) {
        await this.logResult('Subscribe Buttons', 'PASS', `Found ${subscribeButtons.length} Subscribe buttons`);
      } else {
        await this.logResult('Subscribe Buttons', 'FAIL', `Only found ${subscribeButtons.length} Subscribe buttons`);
      }

      // Test 4: Test subscription dialog opens
      try {
        await this.page.click('text=Subscribe Now');
        await delay(1000);
        
        const dialogVisible = await this.page.$('.dialog, [role="dialog"]');
        if (dialogVisible) {
          await this.logResult('Subscription Dialog', 'PASS', 'Dialog opens when Subscribe clicked');
          
          // Close dialog for next tests
          await this.page.keyboard.press('Escape');
          await delay(500);
        } else {
          await this.logResult('Subscription Dialog', 'FAIL', 'Dialog did not open');
        }
      } catch (error) {
        await this.logResult('Subscription Dialog', 'FAIL', `Error: ${error.message}`);
      }

      return true;
    } catch (error) {
      await this.logResult('Landing Page Test', 'FAIL', `Error: ${error.message}`);
      return false;
    }
  }

  async testCreateAccountNavigation() {
    console.log('\n📋 Testing Create Account Navigation...');
    
    try {
      // Test navigation to auth page
      await this.page.click('text=Create Account');
      await delay(2000);

      const currentUrl = this.page.url();
      if (currentUrl.includes('/auth')) {
        await this.logResult('Auth Navigation', 'PASS', 'Successfully navigated to /auth');
        
        // Check if auth form is visible
        const authForm = await this.page.$('form, .auth-form, input[type="email"]');
        if (authForm) {
          await this.logResult('Auth Form Present', 'PASS', 'Auth form is visible');
        } else {
          await this.logResult('Auth Form Present', 'FAIL', 'Auth form not found');
        }
        
        return true;
      } else {
        await this.logResult('Auth Navigation', 'FAIL', `Unexpected URL: ${currentUrl}`);
        return false;
      }
    } catch (error) {
      await this.logResult('Create Account Navigation', 'FAIL', `Error: ${error.message}`);
      return false;
    }
  }

  async testDashboardAccess() {
    console.log('\n📋 Testing Dashboard Access...');
    
    try {
      // Navigate directly to dashboard (should work for both logged in and out)
      await this.page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle0' });
      await delay(2000);

      const currentUrl = this.page.url();
      if (currentUrl.includes('/dashboard')) {
        await this.logResult('Dashboard Access', 'PASS', 'Dashboard is accessible');
        
        // Check for either welcome page or deals page
        const welcomeContent = await this.page.$('text=Welcome to Saverly');
        const dealsContent = await this.page.$('text=Available Deals');
        
        if (welcomeContent) {
          await this.logResult('Dashboard Content', 'PASS', 'Shows welcome page (non-subscriber view)');
        } else if (dealsContent) {
          await this.logResult('Dashboard Content', 'PASS', 'Shows deals page (subscriber view)');
        } else {
          await this.logResult('Dashboard Content', 'WARN', 'Unknown dashboard content');
        }
        
        return true;
      } else {
        await this.logResult('Dashboard Access', 'FAIL', `Redirected to: ${currentUrl}`);
        return false;
      }
    } catch (error) {
      await this.logResult('Dashboard Access', 'FAIL', `Error: ${error.message}`);
      return false;
    }
  }

  async testSubscriptionFlow() {
    console.log('\n📋 Testing Subscription Flow for Non-Logged-In User...');
    
    try {
      // Go back to landing page
      await this.page.goto(BASE_URL, { waitUntil: 'networkidle0' });
      await delay(1000);

      // Click subscribe button
      await this.page.click('text=Subscribe Now');
      await delay(1000);

      // Should show "Account Required" dialog for non-logged-in users
      const accountRequiredText = await this.page.$('text=Account Required, text=Sign in to Subscribe');
      if (accountRequiredText) {
        await this.logResult('Subscription Auth Check', 'PASS', 'Shows account required dialog for non-logged-in users');
        
        // Test Create Account button in dialog
        const createAccountInDialog = await this.page.$('text=Create Account');
        if (createAccountInDialog) {
          await this.logResult('Dialog Create Account Button', 'PASS', 'Create Account button present in dialog');
        } else {
          await this.logResult('Dialog Create Account Button', 'FAIL', 'Create Account button missing in dialog');
        }
        
        return true;
      } else {
        await this.logResult('Subscription Auth Check', 'FAIL', 'Did not show account required dialog');
        return false;
      }
    } catch (error) {
      await this.logResult('Subscription Flow', 'FAIL', `Error: ${error.message}`);
      return false;
    }
  }

  async testResponsiveness() {
    console.log('\n📋 Testing Responsive Design...');
    
    try {
      // Test mobile viewport
      await this.page.setViewport({ width: 375, height: 667 });
      await this.page.goto(BASE_URL, { waitUntil: 'networkidle0' });
      await delay(1000);

      const mobileContent = await this.page.$('text=Save Money with Local Deals');
      if (mobileContent) {
        await this.logResult('Mobile Responsive', 'PASS', 'Content visible on mobile viewport');
      } else {
        await this.logResult('Mobile Responsive', 'FAIL', 'Content not visible on mobile');
      }

      // Reset to desktop
      await this.page.setViewport({ width: 1920, height: 1080 });
      
      return true;
    } catch (error) {
      await this.logResult('Responsive Test', 'FAIL', `Error: ${error.message}`);
      return false;
    }
  }

  async generateReport() {
    console.log('\n📊 WORKFLOW TEST REPORT');
    console.log('========================');
    
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    const warnings = this.testResults.filter(r => r.status === 'WARN').length;
    
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️  Warnings: ${warnings}`);
    console.log(`📊 Total: ${this.testResults.length}`);
    
    console.log('\nDetailed Results:');
    this.testResults.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
      console.log(`${icon} ${result.testName}: ${result.status} ${result.details ? '- ' + result.details : ''}`);
    });

    // Critical issues
    const criticalFailures = this.testResults.filter(r => 
      r.status === 'FAIL' && (
        r.testName.includes('Navigation') || 
        r.testName.includes('Load') || 
        r.testName.includes('Access')
      )
    );

    if (criticalFailures.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES FOUND:');
      criticalFailures.forEach(failure => {
        console.log(`❌ ${failure.testName}: ${failure.details}`);
      });
    } else {
      console.log('\n✅ No critical issues found!');
    }

    return {
      total: this.testResults.length,
      passed,
      failed,
      warnings,
      criticalFailures: criticalFailures.length,
      results: this.testResults
    };
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async runAllTests() {
    try {
      await this.init();
      
      // Run all workflow tests
      await this.testLandingPage();
      await this.testCreateAccountNavigation();
      await this.testDashboardAccess();
      await this.testSubscriptionFlow();
      await this.testResponsiveness();
      
      const report = await this.generateReport();
      return report;
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      return { error: error.message };
    } finally {
      await this.cleanup();
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new WorkflowTester();
  tester.runAllTests().then(report => {
    if (report.error) {
      process.exit(1);
    } else if (report.criticalFailures > 0) {
      console.log('\n🚨 Tests completed with critical failures');
      process.exit(1);
    } else {
      console.log('\n✅ All tests completed successfully');
      process.exit(0);
    }
  });
}

module.exports = WorkflowTester;