// OAuth Diagnostic Tool
// Helps identify the exact issue causing 500 error

console.log('\n🔍 OAUTH DIAGNOSTIC TOOL\n');
console.log('='.repeat(60));
console.log('\nThe 500 error happens at Supabase callback, which means:');
console.log('✓ Google authentication succeeded');
console.log('✓ Google redirected to Supabase');
console.log('✗ Supabase callback failed (500 error)\n');
console.log('='.repeat(60));
console.log('\n📋 CHECKLIST - Verify each item:\n');

console.log('1. SUPABASE → Settings → General');
console.log('   URL: https://supabase.com/dashboard/project/clmhzxiuzqvebzlkbdjs/settings/general');
console.log('   ☐ Site URL is set (NOT empty)');
console.log('   ☐ Site URL matches your app URL (e.g., http://localhost:8081)');
console.log('   ☐ Redirect URLs section has these URLs:');
console.log('      • http://localhost:8081');
console.log('      • http://localhost:19006');
console.log('      • https://clmhzxiuzqvebzlkbdjs.supabase.co/auth/v1/callback');
console.log('   ⚠️  IMPORTANT: URLs must match EXACTLY (including http:// and port)\n');

console.log('2. SUPABASE → Authentication → Providers → Google');
console.log('   URL: https://supabase.com/dashboard/project/clmhzxiuzqvebzlkbdjs/auth/providers?provider=Google');
console.log('   ☐ "Enable Sign in with Google" toggle is ON (green)');
console.log('   ☐ Client ID is: 120230169088-7ppn1sr6mnvekrr6m5m7fq8pu5ktjo4v.apps.googleusercontent.com');
console.log('   ☐ Client Secret is filled in (not empty)');
console.log('   ☐ Clicked "Save" button after making changes');
console.log('   ⚠️  IMPORTANT: Toggle must be ON, not just form filled\n');

console.log('3. GOOGLE CLOUD CONSOLE → Credentials');
console.log('   URL: https://console.cloud.google.com/apis/credentials');
console.log('   ☐ "HelloBahrain Web" OAuth 2.0 Client ID exists');
console.log('   ☐ Under "Authorized redirect URIs", this URL is added:');
console.log('      https://clmhzxiuzqvebzlkbdjs.supabase.co/auth/v1/callback');
console.log('   ☐ Clicked "Save" after adding redirect URI\n');

console.log('4. TIMING');
console.log('   ☐ Waited 2-3 minutes after making Supabase changes');
console.log('   ☐ Cleared browser cache (Ctrl+Shift+Delete)');
console.log('   ☐ Tried in incognito/private window\n');

console.log('='.repeat(60));
console.log('\n🎯 MOST COMMON ISSUE:');
console.log('   Redirect URL mismatch - Your app runs on http://localhost:8081');
console.log('   but Supabase only has http://localhost:19006 in redirect URLs');
console.log('   OR Site URL is not set at all\n');

console.log('🔧 QUICK FIX:');
console.log('   1. Go to Supabase → Settings → General');
console.log('   2. Set Site URL to: http://localhost:8081');
console.log('   3. Add ALL these redirect URLs:');
console.log('      • http://localhost:8081');
console.log('      • http://localhost:19006');
console.log('      • http://localhost:19000');
console.log('      • https://clmhzxiuzqvebzlkbdjs.supabase.co/auth/v1/callback');
console.log('   4. Click SAVE');
console.log('   5. Wait 2-3 minutes');
console.log('   6. Clear cache and try again\n');

console.log('='.repeat(60));
console.log('');

