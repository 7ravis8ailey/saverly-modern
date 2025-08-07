#!/usr/bin/env node

/**
 * Inspect Landing Page Content
 * Check what's actually being displayed on the Saverly landing page
 */

const { chromium } = require('playwright');

const APP_URL = 'http://localhost:5177';

async function inspectLandingPage() {
  console.log('🔍 Inspecting Saverly Landing Page Content...\n');
  
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const page = await browser.newPage();
  
  try {
    // Navigate to the app
    await page.goto(APP_URL, { waitUntil: 'networkidle' });
    
    // Wait for React to render
    await page.waitForTimeout(2000);
    
    // Get the full page content
    console.log('📄 Page Title:', await page.title());
    console.log('🌐 Current URL:', page.url());
    
    // Check what route we're on
    const currentPath = await page.evaluate(() => window.location.pathname);
    console.log('🛣️  Current Route:', currentPath);
    
    // Get all text content from the page
    const allText = await page.evaluate(() => document.body.innerText);
    console.log('\n📝 Full Page Text Content:');
    console.log('=' .repeat(60));
    console.log(allText);
    console.log('=' .repeat(60));
    
    // Check for specific Saverly elements
    console.log('\n🔍 Searching for Saverly Elements:');
    
    // Look for Saverly logo component
    const logoElements = await page.$$('[class*="saverly"], [alt*="Saverly"], [title*="Saverly"]');
    console.log(`📍 Logo elements found: ${logoElements.length}`);
    
    // Look for Saverly text in any element
    const saverlyText = await page.evaluate(() => {
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      
      const textNodes = [];
      let node;
      
      while (node = walker.nextNode()) {
        if (node.textContent.toLowerCase().includes('saverly')) {
          textNodes.push({
            text: node.textContent.trim(),
            parent: node.parentElement?.tagName || 'unknown'
          });
        }
      }
      
      return textNodes;
    });
    
    console.log(`💬 Text mentioning "Saverly": ${saverlyText.length} instances`);
    saverlyText.forEach((item, i) => {
      console.log(`   ${i + 1}. "${item.text}" in <${item.parent.toLowerCase()}>`);
    });
    
    // Check for main navigation items
    const navLinks = await page.$$eval('a[href], button[role="button"]', elements => {
      return elements.map(el => ({
        text: el.textContent.trim(),
        href: el.href || el.getAttribute('href') || 'button',
        tag: el.tagName.toLowerCase()
      })).filter(item => item.text.length > 0);
    });
    
    console.log(`\n🧭 Navigation Items Found: ${navLinks.length}`);
    navLinks.forEach((item, i) => {
      console.log(`   ${i + 1}. "${item.text}" (${item.tag}) -> ${item.href}`);
    });
    
    // Check for headings
    const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', elements => {
      return elements.map(el => ({
        level: el.tagName.toLowerCase(),
        text: el.textContent.trim()
      }));
    });
    
    console.log(`\n📢 Headings Found: ${headings.length}`);
    headings.forEach((item, i) => {
      console.log(`   ${i + 1}. <${item.level}> "${item.text}"`);
    });
    
    // Check for forms
    const forms = await page.$$eval('form, input[type="email"], input[type="password"]', elements => {
      return elements.map(el => ({
        tag: el.tagName.toLowerCase(),
        type: el.type || 'form',
        placeholder: el.placeholder || '',
        id: el.id || '',
        className: el.className || ''
      }));
    });
    
    console.log(`\n📝 Form Elements Found: ${forms.length}`);
    forms.forEach((item, i) => {
      console.log(`   ${i + 1}. <${item.tag}${item.type ? ` type="${item.type}"` : ''}${item.placeholder ? ` placeholder="${item.placeholder}"` : ''}>`);
    });
    
    // Get a screenshot
    await page.screenshot({ 
      path: './landing-page-screenshot.png', 
      fullPage: true 
    });
    console.log('\n📸 Screenshot saved as landing-page-screenshot.png');
    
    // Check for business-related content
    const businessTerms = ['business', 'coupon', 'local', 'discount', 'offer', 'deal', 'save'];
    const foundBusinessTerms = [];
    
    for (const term of businessTerms) {
      const found = await page.evaluate((searchTerm) => {
        return document.body.innerText.toLowerCase().includes(searchTerm);
      }, term);
      
      if (found) {
        foundBusinessTerms.push(term);
      }
    }
    
    console.log(`\n🏢 Business-related terms found: ${foundBusinessTerms.join(', ')}`);
    
    // Check React component tree (if possible)
    const reactComponents = await page.evaluate(() => {
      // Try to detect React components from DOM
      const elements = document.querySelectorAll('[class*="Component"], [data-react-component], [class*="App"]');
      return Array.from(elements).map(el => ({
        className: el.className,
        tagName: el.tagName.toLowerCase(),
        hasChildren: el.children.length > 0
      }));
    });
    
    console.log(`\n⚛️  Potential React Components: ${reactComponents.length}`);
    reactComponents.forEach((item, i) => {
      console.log(`   ${i + 1}. <${item.tagName}> class="${item.className}"`);
    });
    
  } catch (error) {
    console.error('❌ Error inspecting page:', error);
  } finally {
    await browser.close();
  }
}

inspectLandingPage().catch(console.error);