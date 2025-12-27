// Verify Supabase Google OAuth Configuration
// Run this to check if your Supabase is configured correctly

const SUPABASE_URL = 'https://clmhzxiuzqvebzlkbdjs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsbWh6eGl1enF2ZWJ6bGtiZGpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0Nzg0MjIsImV4cCI6MjA4MDA1NDQyMn0.pSUjWc4Ryu7xJ94n7DFAngGYMzT6gFi8K77OUVYeb3Y';
const GOOGLE_CLIENT_ID = '120230169088-7ppn1sr6mnvekrr6m5m7fq8pu5ktjo4v.apps.googleusercontent.com';

console.log('🔍 Verifying Supabase Google OAuth Configuration...\n');

console.log('📋 Configuration Checklist:\n');

console.log('1. Supabase Dashboard - Google Provider:');
console.log('   URL: https://supabase.com/dashboard/project/clmhzxiuzqvebzlkbdjs/auth/providers');
console.log('   ☐ Enable Google provider');
console.log('   ☐ Client ID:', GOOGLE_CLIENT_ID);
console.log('   ☐ Client Secret: [Get from Google Cloud Console]\n');

console.log('2. Supabase Dashboard - Site URL & Redirect URLs:');
console.log('   URL: https://supabase.com/dashboard/project/clmhzxiuzqvebzlkbdjs/settings/general');
console.log('   ☐ Site URL: http://localhost:8081');
console.log('   ☐ Redirect URL: http://localhost:8081');
console.log('   ☐ Redirect URL: http://localhost:19006');
console.log('   ☐ Redirect URL: https://clmhzxiuzqvebzlkbdjs.supabase.co/auth/v1/callback\n');

console.log('3. Google Cloud Console - Redirect URI:');
console.log('   URL: https://console.cloud.google.com/apis/credentials');
console.log('   ☐ Find "HelloBahrain Web" OAuth client');
console.log('   ☐ Add Redirect URI: https://clmhzxiuzqvebzlkbdjs.supabase.co/auth/v1/callback\n');

console.log('⚠️  IMPORTANT:');
console.log('   - The 500 error means Supabase backend is rejecting the OAuth request');
console.log('   - This happens when Google provider is NOT enabled in Supabase');
console.log('   - OR when redirect URLs are not configured correctly');
console.log('   - After configuration, wait 2-3 minutes for changes to propagate\n');

console.log('✅ Once all checked, test again with:');
console.log('   npx expo start --clear');
console.log('   Press "w" to open in browser');
console.log('   Click "Continue with Google"\n');














