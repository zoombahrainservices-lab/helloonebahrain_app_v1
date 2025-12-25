# Google OAuth Setup - Step by Step

## The 500 Error Fix

The "500 unexpected_failure" error means Supabase Google OAuth is not configured. Follow these exact steps:

## Step 1: Supabase Dashboard - Enable Google Provider

1. Go to: https://supabase.com/dashboard/project/clmhzxiuzqvebzlkbdjs/auth/providers
2. Click on **"Google"** in the providers list
3. Toggle **"Enable Google provider"** to **ON**
4. Enter:
   - **Client ID (for OAuth):** `120230169088-7ppn1sr6mnvekrr6m5m7fq8pu5ktjo4v.apps.googleusercontent.com`
   - **Client Secret (for OAuth):** Get from Step 2 below
5. Click **"Save"**

## Step 2: Get Google Client Secret

1. Go to: https://console.cloud.google.com/apis/credentials
2. Find **"HelloBahrain Web"** OAuth 2.0 Client ID
3. Click to edit it
4. Copy the **"Client secret"** value
5. Paste it into Supabase (Step 1)

## Step 3: Configure Supabase Redirect URLs

1. Go to: https://supabase.com/dashboard/project/clmhzxiuzqvebzlkbdjs/settings/general
2. Scroll to **"Site URL"** section
3. Set **Site URL:** `http://localhost:8081`
4. In **"Redirect URLs"**, click **"Add URL"** and add ALL of these:
   - `http://localhost:8081` (for web development)
   - `http://localhost:19006` (for Expo web)
   - `hellobahrain://` (for mobile deep link)
   - `hellobahrain:///` (alternative mobile format)
   - `https://clmhzxiuzqvebzlkbdjs.supabase.co/auth/v1/callback` (Supabase callback)
5. Click **"Save"**

## Step 4: Configure Google Cloud Console Redirect URI

1. Go to: https://console.cloud.google.com/apis/credentials
2. Find **"HelloBahrain Web"** OAuth 2.0 Client ID
3. Click to edit
4. Under **"Authorized redirect URIs"**, click **"Add URI"**
5. Add: `https://clmhzxiuzqvebzlkbdjs.supabase.co/auth/v1/callback`
6. Click **"Save"**

## Step 5: Wait and Test

1. Wait 2-3 minutes for changes to propagate
2. Clear browser cache
3. Test Google login:
   ```bash
   npx expo start --clear
   ```
4. Press `w` to open in browser
5. Click "Continue with Google"

## Troubleshooting

### Still getting 500 error?

The 500 "Unexpected failure" error means Supabase cannot connect to Google OAuth. Check these:

1. **Verify Google Provider is Enabled:**
   - Go to Supabase Dashboard → Auth → Providers
   - Find "Google" in the list
   - Make sure the toggle is ON (green/enabled)
   - If it's OFF, turn it ON and click "Save"

2. **Verify Client ID and Secret:**
   - In Supabase → Auth → Providers → Google
   - Client ID should be: `120230169088-7ppn1sr6mnvekrr6m5m7fq8pu5ktjo4v.apps.googleusercontent.com`
   - Client Secret should NOT be empty
   - If Client Secret is missing, get it from Google Cloud Console (Step 2)

3. **Check Supabase Logs:**
   - Go to Supabase Dashboard → Logs → Auth
   - Look for recent errors related to Google OAuth
   - The logs will show the exact error from Google

4. **Verify Redirect URLs:**
   - Go to Supabase → Settings → General
   - Check that ALL redirect URLs are added (no typos)
   - URLs must match EXACTLY (case-sensitive, no extra spaces)

5. **Verify Google Cloud Console:**
   - Go to Google Cloud Console → APIs & Services → Credentials
   - Find your OAuth 2.0 Client ID
   - Under "Authorized redirect URIs", verify this is added:
     `https://clmhzxiuzqvebzlkbdjs.supabase.co/auth/v1/callback`

6. **Wait for Propagation:**
   - After making changes, wait 2-5 minutes
   - Clear browser cache
   - Restart the app/emulator
   - Try again

### Error: redirect_uri_mismatch?
- Verify redirect URL in Supabase matches exactly: `http://localhost:8081` (for web) or `hellobahrain://` (for mobile)
- Check Google Cloud Console redirect URI is added
- Clear browser cache and try again

### Error: redirect_uri_mismatch?
- Verify redirect URL in Supabase matches exactly: `http://localhost:8081`
- Check Google Cloud Console redirect URI is added
- Clear browser cache and try again

## Quick Checklist

- [ ] Supabase: Google provider enabled (toggle is ON/green)
- [ ] Supabase: Client ID added: `120230169088-7ppn1sr6mnvekrr6m5m7fq8pu5ktjo4v.apps.googleusercontent.com`
- [ ] Supabase: Client Secret added (from Google Cloud Console)
- [ ] Supabase: Site URL set to `http://localhost:8081`
- [ ] Supabase: Redirect URLs added (5 URLs total):
  - [ ] `http://localhost:8081`
  - [ ] `http://localhost:19006`
  - [ ] `hellobahrain://`
  - [ ] `hellobahrain:///`
  - [ ] `https://clmhzxiuzqvebzlkbdjs.supabase.co/auth/v1/callback`
- [ ] Google Cloud: Redirect URI added: `https://clmhzxiuzqvebzlkbdjs.supabase.co/auth/v1/callback`
- [ ] Waited 2-3 minutes for changes to propagate
- [ ] Cleared browser/app cache
- [ ] Tested login on web
- [ ] Tested login on mobile

Once all checked, Google OAuth will work! ✅












