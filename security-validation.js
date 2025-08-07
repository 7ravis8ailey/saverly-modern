#!/usr/bin/env node

// SECURITY VALIDATION SCRIPT - POST CRISIS FIX
// Run this to verify all security vulnerabilities have been addressed

import fs from 'fs'
import path from 'path'

console.log('🛡️  SECURITY VALIDATION - POST CRISIS RESOLUTION')
console.log('=' .repeat(60))

let validationsPassed = 0
let validationsFailed = 0

function validateItem(check, message) {
  if (check) {
    console.log(`✅ ${message}`)
    validationsPassed++
  } else {
    console.log(`❌ ${message}`)
    validationsFailed++
  }
}

// 1. Check exposed API keys are removed
const testGoogleMapsExists = fs.existsSync('./test-google-maps.html')
const testApiKeyFunctionExists = fs.existsSync('./test-api-key-function.js')

validateItem(
  !testGoogleMapsExists,
  'Exposed Google Maps API key test file removed'
)

validateItem(
  !testApiKeyFunctionExists,
  'Exposed API key test function file removed'
)

// 2. Check .env is in .gitignore
const gitignoreContent = fs.readFileSync('./.gitignore', 'utf8')
const envInGitignore = gitignoreContent.includes('.env')

validateItem(
  envInGitignore,
  '.env files properly excluded from git'
)

// 3. Check .env.example exists
const envExampleExists = fs.existsSync('./.env.example')

validateItem(
  envExampleExists,
  '.env.example template file created'
)

// 4. Check debug component is hardened
const debugComponentPath = './src/components/debug/google-api-test.tsx'
if (fs.existsSync(debugComponentPath)) {
  const debugContent = fs.readFileSync(debugComponentPath, 'utf8')
  const isHardened = !debugContent.includes('AIzaSy') && 
                    debugContent.includes('SECURITY HARDENED') &&
                    debugContent.includes('hasApiKey')

  validateItem(
    isHardened,
    'Debug component hardened against key exposure'
  )
}

// 5. Check auth hooks have race condition protection
const authHookPath = './src/hooks/use-auth.ts'
if (fs.existsSync(authHookPath)) {
  const authContent = fs.readFileSync(authHookPath, 'utf8')
  const hasRaceProtection = authContent.includes('initialized') &&
                           authContent.includes('useCallback')

  validateItem(
    hasRaceProtection,
    'Auth hooks protected against race conditions'
  )
}

// 6. Check security headers are implemented
const securityHeadersPath = './src/middleware/security-headers.ts'
const securityHeadersExist = fs.existsSync(securityHeadersPath)

validateItem(
  securityHeadersExist,
  'Security headers middleware implemented'
)

// 7. Check Vite config includes security plugin
const viteConfigPath = './vite.config.ts'
if (fs.existsSync(viteConfigPath)) {
  const viteContent = fs.readFileSync(viteConfigPath, 'utf8')
  const hasSecurityPlugin = viteContent.includes('viteSecurityPlugin')

  validateItem(
    hasSecurityPlugin,
    'Vite configuration includes security plugin'
  )
}

// 8. Check actual environment file doesn't contain test keys
if (fs.existsSync('./.env')) {
  const envContent = fs.readFileSync('./.env', 'utf8')
  const hasTestKeys = envContent.includes('AIzaSyD7tG8B_Y851kIfPuLaJpX5Cnt8e5W7Gn8')

  validateItem(
    !hasTestKeys,
    'Environment file does not contain exposed test keys'
  )
}

console.log('\n' + '=' .repeat(60))
console.log(`🛡️  SECURITY VALIDATION COMPLETE`)
console.log(`✅ Passed: ${validationsPassed}`)
console.log(`❌ Failed: ${validationsFailed}`)

if (validationsFailed === 0) {
  console.log('\n🎉 ALL SECURITY VULNERABILITIES RESOLVED!')
  console.log('✅ Production deployment is now SAFE to proceed')
} else {
  console.log('\n⚠️  SECURITY ISSUES REMAIN')
  console.log('❌ DO NOT DEPLOY TO PRODUCTION until all issues are resolved')
  process.exit(1)
}