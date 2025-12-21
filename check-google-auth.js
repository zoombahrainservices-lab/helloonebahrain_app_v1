const fs = require('fs');
const path = require('path');

console.log('🔍 Google Auth Diagnostic Check\n');
console.log('='.repeat(50));

// Read app.json
const appJsonPath = path.join(__dirname, 'app.json');
let appConfig = {};
try {
  appConfig = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
} catch (error) {
  console.error('❌ Cannot read app.json:', error.message);
  process.exit(1);
}

const issues = [];
const warnings = [];
const info = [];

// 1. Check Client IDs
console.log('\n1️⃣  CLIENT IDS CONFIGURATION');
console.log('-'.repeat(50));

const googleWebClientId = appConfig.expo?.extra?.googleWebClientId;
const googleAndroidClientId = appConfig.expo?.extra?.googleAndroidClientId;

if (!googleWebClientId) {
  issues.push('Missing googleWebClientId in app.json');
  console.log('❌ googleWebClientId: NOT SET');
} else {
  console.log('✅ googleWebClientId:', googleWebClientId);
  if (!googleWebClientId.includes('.apps.googleusercontent.com')) {
    issues.push('googleWebClientId format looks invalid');
  }
}

if (!googleAndroidClientId) {
  issues.push('Missing googleAndroidClientId in app.json');
  console.log('❌ googleAndroidClientId: NOT SET');
} else {
  console.log('✅ googleAndroidClientId:', googleAndroidClientId);
  if (!googleAndroidClientId.includes('.apps.googleusercontent.com')) {
    issues.push('googleAndroidClientId format looks invalid');
  }
}

if (googleWebClientId === googleAndroidClientId) {
  warnings.push('Web and Android Client IDs are the same - this may cause issues');
  console.log('⚠️  WARNING: Web and Android Client IDs are identical');
}

// 2. Check Package Name
console.log('\n2️⃣  PACKAGE NAME');
console.log('-'.repeat(50));

const packageName = appConfig.expo?.android?.package;
if (!packageName) {
  issues.push('Missing Android package name in app.json');
  console.log('❌ Package name: NOT SET');
} else {
  console.log('✅ Package name:', packageName);
  info.push(`Verify this matches Google Cloud Console: ${packageName}`);
}

// 3. Check Scheme/Redirect URI
console.log('\n3️⃣  REDIRECT URI / SCHEME');
console.log('-'.repeat(50));

const scheme = appConfig.expo?.scheme || 'hellobahrain';
const redirectUri = `${scheme}://`;
console.log('✅ Scheme:', scheme);
console.log('✅ Redirect URI:', redirectUri);
info.push(`Add this redirect URI to Google Cloud Console: ${redirectUri}`);
info.push(`For Expo Go, also add: exp://localhost:8081, exp://192.168.*.*:8081`);

// 4. Check SHA-1 Fingerprint (Android)
console.log('\n4️⃣  SHA-1 CERTIFICATE FINGERPRINT (Android)');
console.log('-'.repeat(50));

const debugKeystorePath = path.join(__dirname, 'android', 'app', 'debug.keystore');
if (fs.existsSync(debugKeystorePath)) {
  console.log('✅ Debug keystore found');
  info.push('Run this to get SHA-1: keytool -keystore android/app/debug.keystore -list -v -alias androiddebugkey -storepass android -keypass android');
} else {
  warnings.push('Debug keystore not found - cannot verify SHA-1');
  console.log('⚠️  Debug keystore not found at:', debugKeystorePath);
}

// 5. Check Backend API
console.log('\n5️⃣  BACKEND API');
console.log('-'.repeat(50));

const apiBaseUrl = appConfig.expo?.extra?.apiBaseUrl;
if (!apiBaseUrl) {
  issues.push('Missing apiBaseUrl in app.json');
  console.log('❌ API Base URL: NOT SET');
} else {
  console.log('✅ API Base URL:', apiBaseUrl);
  info.push(`Verify backend endpoint exists: ${apiBaseUrl}/api/auth/google-mobile`);
}

// 6. Check OAuth Configuration
console.log('\n6️⃣  OAUTH CONFIGURATION CHECKLIST');
console.log('-'.repeat(50));

console.log('\n📋 Things to verify in Google Cloud Console:');
console.log('   1. Web Application OAuth Client exists');
console.log('   2. Android OAuth Client exists');
console.log('   3. Package name matches:', packageName || 'NOT SET');
console.log('   4. SHA-1 fingerprint is added to Android client');
console.log('   5. Redirect URIs are added:');
console.log('      -', redirectUri);
console.log('      - exp://localhost:8081 (for Expo Go)');
console.log('      - exp://192.168.*.*:8081 (for Expo Go on network)');

// 7. Common Issues
console.log('\n7️⃣  COMMON ISSUES TO CHECK');
console.log('-'.repeat(50));

const commonIssues = [
  {
    issue: 'Redirect URI mismatch',
    check: 'Redirect URI in code must EXACTLY match Google Cloud Console',
    fix: 'Add all possible redirect URIs to Web Application client'
  },
  {
    issue: 'Wrong Client ID type',
    check: 'Using Android Client ID for Web/Expo Go',
    fix: 'Use Web Application Client ID for expoClientId'
  },
  {
    issue: 'SHA-1 not added',
    check: 'Android client missing SHA-1 fingerprint',
    fix: 'Add SHA-1 from debug keystore to Android OAuth client'
  },
  {
    issue: 'Package name mismatch',
    check: 'Package name in app.json != Google Cloud Console',
    fix: 'Ensure package names match exactly'
  },
  {
    issue: 'Backend endpoint missing',
    check: 'POST /api/auth/google-mobile not implemented',
    fix: 'Implement backend endpoint to verify Google ID token'
  }
];

commonIssues.forEach((item, index) => {
  console.log(`\n${index + 1}. ${item.issue}`);
  console.log(`   Check: ${item.check}`);
  console.log(`   Fix: ${item.fix}`);
});

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 SUMMARY');
console.log('='.repeat(50));

if (issues.length === 0 && warnings.length === 0) {
  console.log('✅ No critical issues found!');
} else {
  if (issues.length > 0) {
    console.log(`\n❌ CRITICAL ISSUES (${issues.length}):`);
    issues.forEach((issue, i) => console.log(`   ${i + 1}. ${issue}`));
  }
  if (warnings.length > 0) {
    console.log(`\n⚠️  WARNINGS (${warnings.length}):`);
    warnings.forEach((warning, i) => console.log(`   ${i + 1}. ${warning}`));
  }
}

if (info.length > 0) {
  console.log(`\nℹ️  INFO (${info.length}):`);
  info.forEach((item, i) => console.log(`   ${i + 1}. ${item}`));
}

console.log('\n' + '='.repeat(50));
console.log('💡 Next Steps:');
console.log('1. Go to: https://console.cloud.google.com/apis/credentials');
console.log('2. Check your OAuth 2.0 Client IDs');
console.log('3. Verify all redirect URIs are added');
console.log('4. For Android: Verify SHA-1 fingerprint is added');
console.log('5. Test Google login in your app');
console.log('='.repeat(50) + '\n');

