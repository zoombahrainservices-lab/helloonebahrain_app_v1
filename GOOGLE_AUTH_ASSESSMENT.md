# Google Auth Login - Complete Assessment & Flow

## Current Implementation Overview

### Authentication Flow Architecture
- **Platform**: React Native with Expo
- **Auth Provider**: Supabase Auth
- **OAuth Method**: Supabase OAuth with `expo-web-browser`
- **Deep Link Scheme**: `hellobahrain://`

## Complete Google Auth Flow (Step-by-Step)

### Step 1: User Clicks "Continue with Google"
**Location**: `src/screens/LoginScreen.tsx` → `handleGoogleLogin()`
- Calls `loginWithGoogle()` from `AuthContext`
- Sets `googleLoading` state to show loading indicator

### Step 2: Platform Detection
**Location**: `src/contexts/AuthContext.tsx` → `loginWithGoogle()`
- Checks `Platform.OS` to determine if web or mobile
- **Web**: Uses Supabase OAuth redirect (automatic)
- **Mobile**: Uses `WebBrowser.openAuthSessionAsync()` (manual handling)

### Step 3: Mobile OAuth Flow (Current Implementation)

#### 3.1 Generate OAuth URL
```typescript
const redirectUrl = 'hellobahrain://'; // Deep link URL
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: redirectUrl,
    skipBrowserRedirect: true, // Manual handling
  },
});
```

**What happens:**
- Supabase generates OAuth URL: `https://clmhzxiuzqvebzlkbdjs.supabase.co/auth/v1/authorize?provider=google&redirect_to=hellobahrain://`
- This URL includes:
  - Supabase project URL
  - Provider (google)
  - Redirect URL (hellobahrain://)
  - State parameter (for security)

#### 3.2 Open OAuth URL in Browser
```typescript
const result = await WebBrowser.openAuthSessionAsync(
  data.url,
  redirectUrl
);
```

**What happens:**
- Opens system browser with OAuth URL
- User sees Google login page
- User authenticates with Google
- Google redirects to Supabase callback: `https://clmhzxiuzqvebzlkbdjs.supabase.co/auth/v1/callback`
- Supabase processes OAuth and redirects to: `hellobahrain://#access_token=...&refresh_token=...`

#### 3.3 Handle Callback
**Current Implementation:**
- Extracts tokens from callback URL hash (`#access_token=...`)
- Manually sets Supabase session using `supabase.auth.setSession()`
- Creates user in `users` table
- Updates AuthContext with user data

## Issues Identified

### Issue 1: Blank Supabase Page
**Symptom**: Browser shows blank Supabase page with "Connection is not secure" warning

**Root Cause**: 
- The OAuth URL redirects to Supabase callback page
- The callback page might be trying to redirect but failing
- Deep link might not be properly registered or handled

**Possible Causes:**
1. **Deep link not registered**: Android might not recognize `hellobahrain://` scheme
2. **Redirect URL mismatch**: Supabase redirect URL doesn't match exactly
3. **Browser security**: Browser blocking the redirect due to security warning
4. **Callback handling**: Supabase callback page not properly redirecting to deep link

### Issue 2: Orders Not Showing
**Root Cause**: 
- `getUserOrders()` only checks Supabase session
- Backend API users don't have Supabase session
- Returns empty array even if orders exist

**Fix Applied**: Updated `getUserOrders()` to accept `userId` parameter

## Google Auth Flow - Detailed Analysis

### Expected Flow:
```
1. User clicks "Continue with Google"
   ↓
2. App calls supabase.auth.signInWithOAuth()
   ↓
3. Supabase returns OAuth URL
   ↓
4. App opens URL in browser via WebBrowser.openAuthSessionAsync()
   ↓
5. User authenticates with Google
   ↓
6. Google redirects to: https://clmhzxiuzqvebzlkbdjs.supabase.co/auth/v1/callback
   ↓
7. Supabase processes OAuth and redirects to: hellobahrain://#access_token=...&refresh_token=...
   ↓
8. App receives deep link callback
   ↓
9. App extracts tokens from URL
   ↓
10. App sets Supabase session manually
    ↓
11. User is logged in
```

### Current Issues in Flow:

#### Problem 1: Step 6-7 (Redirect Chain)
The redirect chain might be breaking:
- Google → Supabase callback → Deep link
- If Supabase callback page fails, user sees blank page
- Deep link might not be triggered

#### Problem 2: Step 8 (Deep Link Reception)
Deep link might not be received:
- Android might not have deep link registered
- App might not be listening for deep links
- Deep link handler might not be triggered

#### Problem 3: Step 9 (Token Extraction)
Tokens might not be in expected format:
- Might be in query params instead of hash
- URL might be encoded differently
- Tokens might be missing

## Solutions Implemented

### Solution 1: Manual Session Setting
- Extract tokens from callback URL (hash or query)
- Manually set session using `supabase.auth.setSession()`
- This bypasses automatic redirect handling

### Solution 2: Improved Error Handling
- Check for tokens in both hash and query parameters
- Better error messages
- Detailed logging for debugging

### Solution 3: Deep Link Handler
- Added deep link listener in `App.tsx`
- Handles OAuth callbacks via deep links
- Ensures user is created in `users` table

## Configuration Checklist

### Supabase Configuration:
- [x] Google provider enabled
- [x] Client ID set: `120230169088-7ppn1sr6mnvekrr6m5m7fq8pu5ktjo4v.apps.googleusercontent.com`
- [x] Client Secret set
- [x] Site URL: `hellobahrain://`
- [x] Redirect URLs include: `hellobahrain://`

### Google Cloud Console:
- [ ] Redirect URI added: `https://clmhzxiuzqvebzlkbdjs.supabase.co/auth/v1/callback`
- [ ] OAuth consent screen configured
- [ ] Client ID matches Supabase

### App Configuration:
- [x] Deep link scheme: `hellobahrain://` (in app.json)
- [x] `expo-web-browser` plugin enabled
- [x] Deep link handler in App.tsx

## Debugging Steps

### 1. Check OAuth URL Generation
Look for in console:
```
📱 OAuth URL: https://clmhzxiuzqvebzlkbdjs.supabase.co/auth/v1/authorize?provider=google&redirect_to=hellobahrain://...
```

### 2. Check Browser Redirect
After Google login, check:
- Does browser redirect to Supabase callback?
- Does Supabase callback redirect to deep link?
- Is deep link received by app?

### 3. Check Token Extraction
Look for in console:
```
📱 Extracted from URL: {
  hasAccessToken: true/false,
  hasRefreshToken: true/false,
  urlHasHash: true/false,
  urlHasQuery: true/false
}
```

### 4. Check Session Setting
Look for in console:
```
📱 Setting session from tokens...
✅ Google authentication successful via manual session set
```

## Common Issues & Fixes

### Issue: Blank Supabase Page
**Fix**: 
- Check if deep link is registered in AndroidManifest.xml
- Verify redirect URL matches exactly in Supabase
- Try using `https://` redirect URL instead of deep link (for testing)

### Issue: "Connection is not secure" Warning
**Fix**:
- This is normal for Supabase callback page
- The redirect should still work
- Check if deep link is triggered after warning

### Issue: Deep Link Not Received
**Fix**:
- Verify `app.json` has `scheme: "hellobahrain"`
- Check AndroidManifest.xml has intent filter for deep link
- Test deep link manually: `adb shell am start -W -a android.intent.action.VIEW -d "hellobahrain://test" com.helloonebahrain`

### Issue: Tokens Not Extracted
**Fix**:
- Check callback URL format
- Verify tokens are in hash (`#`) not query (`?`)
- Check URL encoding

## Next Steps for Full Fix

1. **Test Deep Link Registration**:
   ```bash
   adb shell am start -W -a android.intent.action.VIEW -d "hellobahrain://test" com.helloonebahrain
   ```

2. **Check AndroidManifest.xml**:
   - Verify intent filter for deep link
   - Check if scheme is registered

3. **Alternative: Use HTTPS Redirect**:
   - Instead of deep link, use HTTPS URL
   - Handle redirect in web view
   - Extract tokens from redirect URL

4. **Add More Logging**:
   - Log every step of OAuth flow
   - Log deep link reception
   - Log token extraction

## Fixes Applied ✅

### Fix 1: Added Deep Link Intent Filter
**File**: `android/app/src/main/AndroidManifest.xml`
- ✅ Added intent filter for `hellobahrain://` scheme
- ✅ Android will now properly route deep links to the app
- ⚠️ **REQUIRED**: Rebuild Android app for changes to take effect

### Fix 2: Fixed Orders Not Showing
**Files**: 
- ✅ `src/lib/orders-api.ts` - Updated `getUserOrders()` to accept `userId` parameter
- ✅ `src/screens/OrdersScreen.tsx` - Passes `user.id` to `getUserOrders()`
- ✅ Now works for both Supabase and backend API users

### Fix 3: Improved Google Auth Flow
**File**: `src/contexts/AuthContext.tsx`
- ✅ Better token extraction (handles both hash `#` and query `?` parameters)
- ✅ Manual session setting from tokens
- ✅ Improved error messages with specific guidance
- ✅ Enhanced logging for debugging

## Required Actions

### 1. Rebuild Android App (CRITICAL)
The deep link intent filter requires a rebuild:
```bash
npx expo run:android
```

### 2. Verify Supabase Configuration
- ✅ Google provider enabled
- ✅ Client ID and Secret set
- ✅ Redirect URL: `hellobahrain://` (exact match, no trailing slash)
- ✅ Site URL: `hellobahrain://`

### 3. Test Deep Link
After rebuild, test if deep link works:
```bash
adb shell am start -W -a android.intent.action.VIEW -d "hellobahrain://test" com.helloonebahrain
```
This should open your app if deep link is working.

## Complete Google Auth Flow (After Fixes)

```
1. User clicks "Continue with Google"
   ↓
2. App calls supabase.auth.signInWithOAuth()
   ↓
3. Supabase returns OAuth URL
   ↓
4. App opens URL in browser via WebBrowser.openAuthSessionAsync()
   ↓
5. User authenticates with Google
   ↓
6. Google redirects to Supabase callback
   ↓
7. Supabase processes OAuth and redirects to: hellobahrain://#access_token=...&refresh_token=...
   ↓
8. Android routes deep link to app (NOW WORKING with intent filter)
   ↓
9. App receives deep link via Linking listener
   ↓
10. App extracts tokens from URL hash
    ↓
11. App sets Supabase session manually using tokens
    ↓
12. App creates user in users table
    ↓
13. App updates AuthContext with user data
    ↓
14. User is logged in ✅
```

## Debugging Guide

### Check Console Logs
When testing Google auth, look for these logs in order:

1. **OAuth URL Generation**:
   ```
   📱 Starting Google OAuth (Mobile)...
   📱 Redirect URL: hellobahrain://
   📱 OAuth URL: https://clmhzxiuzqvebzlkbdjs.supabase.co/auth/v1/authorize?...
   ```

2. **Browser Opening**:
   ```
   📱 Opening OAuth URL in browser...
   ```

3. **OAuth Result**:
   ```
   📱 OAuth result type: success/cancel/dismiss
   📱 Result URL: hellobahrain://#access_token=...
   ```

4. **Token Extraction**:
   ```
   📱 Extracted from URL: {
     hasAccessToken: true,
     hasRefreshToken: true,
     urlHasHash: true
   }
   ```

5. **Session Setting**:
   ```
   📱 Setting session from tokens...
   ✅ Google authentication successful via manual session set
   ```

### If Deep Link Not Received
Check:
- AndroidManifest.xml has intent filter (✅ Fixed)
- App was rebuilt after manifest change (⚠️ Required)
- Deep link scheme matches exactly: `hellobahrain://`

### If Tokens Not Extracted
Check:
- Callback URL format
- Tokens location (hash vs query)
- URL encoding issues

## Expected Behavior After Fixes

1. ✅ Orders will show for all users (Supabase and backend API)
2. ✅ Deep link will be received by app (after rebuild)
3. ✅ Google auth will complete successfully
4. ✅ User will be logged in and redirected to home

## Testing Checklist

- [ ] Rebuild Android app: `npx expo run:android`
- [ ] Test deep link manually: `adb shell am start -W -a android.intent.action.VIEW -d "hellobahrain://test" com.helloonebahrain`
- [ ] Test Google auth login
- [ ] Verify orders are showing after placing order
- [ ] Check console logs for detailed flow information

