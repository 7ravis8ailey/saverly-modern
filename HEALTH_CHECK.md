# Saverly Development Server Health Check

A comprehensive automated validation system that ensures your local development server is truly functional, not just responding with HTTP 200.

## 🎯 What It Tests

### 1. HTTP Response Validation ✅
- Verifies server responds with HTTP 200
- Measures response time and performance
- Detects connection issues and timeouts
- Includes retry logic for reliability

### 2. HTML Content Validation 📄
- Validates proper HTML structure (DOCTYPE, html, head, body)
- Checks for React/Vite specific elements (#root, module scripts)
- Detects empty pages or error content
- Ensures content is actually loading

### 3. Key UI Elements Detection 🎨
- Looks for navigation elements (navbar, links)
- Detects Saverly-specific branding and logos
- Validates authentication forms are present
- Checks for interactive elements (buttons, forms)

### 4. JavaScript Loading Validation ⚡
- Verifies script tags are present and properly configured
- Checks for Vite client and main.tsx loading
- Validates ES module support
- Detects modern JavaScript patterns

### 5. API Endpoints Testing 🔌
- Tests critical application routes (/auth, /dashboard, /simple)
- Validates expected HTTP status codes
- Checks routing configuration
- Measures endpoint response times

### 6. CSS/Styling Validation 🎨
- Checks for stylesheet links and inline styles
- Detects Tailwind CSS configuration
- Validates CSS loading mechanisms
- Ensures styling is properly configured

### 7. Performance Monitoring 📊
- Measures response times across multiple requests
- Provides performance ratings (excellent/good/acceptable/poor)
- Detects performance degradation
- Sets realistic thresholds for development environments

## 🚀 Usage

### Quick Start
```bash
# Install dependencies (if not already installed)
npm install

# Run health check on default URL (http://localhost:5177)
npm run health-check

# Run with verbose output
npm run health-check:verbose

# Run on different port (e.g., http://localhost:5173)
npm run health-check:custom
```

### Using the Shell Script (Recommended)
```bash
# Make it executable (first time only)
chmod +x run-health-check.sh

# Run with default settings
./run-health-check.sh

# Run on custom URL
./run-health-check.sh http://localhost:5173

# Run with verbose output
./run-health-check.sh http://localhost:5177 --verbose

# Run with custom timeout
./run-health-check.sh http://localhost:5177 --timeout=60000
```

### Direct Node.js Execution
```bash
# Basic usage
node health-check.js

# Custom URL and options
node health-check.js --url=http://localhost:5173 --verbose --timeout=30000
```

## 📊 Understanding Results

### Status Indicators
- ✅ **PASS**: All tests successful, server is healthy and ready
- ⚠️ **PASS_WITH_WARNINGS**: Mostly functional but has minor issues
- ❌ **FAIL**: Critical issues that need immediate attention  
- 💥 **ERROR**: Health check system encountered an error

### Test Scoring
- Each test category is evaluated independently
- Overall status requires 70% of tests to pass for PASS_WITH_WARNINGS
- 100% pass rate required for full PASS status
- Performance ratings: excellent (<500ms), good (<1s), acceptable (<3s)

## 🔧 Configuration Options

### Command Line Arguments
- `--url=<URL>`: Target URL to test (default: http://localhost:5177)
- `--timeout=<ms>`: Request timeout in milliseconds (default: 30000)
- `--verbose`: Enable detailed output and debugging information

### Environment Variables
You can also configure using environment variables:
```bash
export HEALTH_CHECK_URL=http://localhost:5173
export HEALTH_CHECK_TIMEOUT=60000
export HEALTH_CHECK_VERBOSE=true
```

## 🚨 Common Issues and Solutions

### Server Not Responding
```
❌ HTTP Response: Server not running or connection refused
```
**Solutions:**
- Start your development server: `npm run dev`
- Check if server is running on correct port
- Verify firewall settings aren't blocking connections

### HTML Structure Issues
```
❌ HTML Content: HTML structure issues detected
```
**Solutions:**
- Check development server logs for build errors
- Verify Vite configuration is correct
- Look for JavaScript errors preventing rendering

### Missing UI Elements
```
❌ Key UI Elements: Missing key elements (2/7)
```
**Solutions:**
- Check React component rendering in browser
- Look for JavaScript console errors
- Verify component imports and exports

### JavaScript Loading Problems
```
❌ JavaScript Loading: JavaScript loading issues detected
```
**Solutions:**
- Verify main.tsx exists and is properly configured
- Check Vite build configuration
- Ensure ES module support is enabled

### API Endpoint Failures
```
❌ API Endpoints: Only 1/3 endpoints working
```
**Solutions:**
- Check React Router configuration
- Verify all route components are exported
- Check for authentication redirects

### Styling Not Loading
```
❌ CSS/Styling: Potential styling issues detected
```
**Solutions:**
- Verify Tailwind CSS is configured
- Check CSS imports in main.tsx
- Ensure PostCSS configuration is correct

### Poor Performance
```
❌ Performance: Performance issues detected (avg: 5000ms)
```
**Solutions:**
- Check for network connectivity issues
- Restart development server
- Check system resources (CPU, memory)

## 🛠️ Integration with CI/CD

### GitHub Actions Example
```yaml
name: Development Server Health Check

on: [push, pull_request]

jobs:
  health-check:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
    - run: npm install
    - run: npm run dev &
    - run: sleep 10  # Wait for server to start
    - run: npm run health-check:verbose
```

### Pre-commit Hook
Add to `.git/hooks/pre-commit`:
```bash
#!/bin/sh
echo "Running health check before commit..."
npm run health-check || {
    echo "Health check failed! Please ensure development server is running and healthy."
    exit 1
}
```

## 📈 Performance Benchmarks

The health check itself is optimized for speed:
- **Typical execution time**: 2-5 seconds
- **Parallel test execution**: Most tests run simultaneously
- **Smart timeouts**: Configurable timeouts prevent hanging
- **Retry logic**: Automatic retry for transient failures

## 🔒 Security Considerations

- Health check uses read-only operations
- No sensitive data is transmitted or stored
- Respects rate limits and server resources
- Safe for production-like environments

## 📝 Extending the Health Check

### Adding Custom Tests
You can extend the health check by adding new test functions:

```javascript
// Add to health-check.js
async function testCustomFeature() {
  const testName = 'Custom Feature';
  
  try {
    // Your custom validation logic here
    const isValid = await validateCustomFeature();
    
    recordResult(testName, isValid, 
      isValid ? 'Custom feature working' : 'Custom feature failed'
    );
    
    return { success: isValid };
  } catch (error) {
    recordResult(testName, false, `Custom test failed: ${error.message}`);
    return { success: false, error };
  }
}
```

### Custom Validation Rules
Modify the validation thresholds in the CONFIG object or individual test functions to match your specific requirements.

## 🤝 Contributing

When contributing to the health check system:

1. Add tests for new validation rules
2. Update documentation for new features
3. Ensure backward compatibility
4. Test with various server configurations
5. Follow existing code style and patterns

## 📊 Sample Output

```
🏥 Saverly Development Server Health Check
==========================================
Target URL: http://localhost:5177
Timeout: 30000ms

✅ HTTP Response: Server responding with HTTP 200
✅ HTML Content: HTML structure is valid and complete  
✅ Key UI Elements: Found 6/7 key elements
✅ JavaScript Loading: JavaScript loading configured correctly
✅ API Endpoints: 3/3 endpoints responding correctly
✅ CSS/Styling: Styling appears to be loading correctly
✅ Performance: Performance is excellent (avg: 245ms)

📊 HEALTH CHECK RESULTS
========================

✅ Overall Status: PASS
⏱️  Total Duration: 3247ms
🎯 Target URL: http://localhost:5177

📈 Summary:
Tests Passed: 7/7 (100%)
🎉 Server is healthy and ready for development!
```

---

**Need help?** Check the [troubleshooting section](#common-issues-and-solutions) or create an issue in the project repository.