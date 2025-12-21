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
4. In **"Redirect URLs"**, click **"Add URL"** and add:
   - `http://localhost:8081`
   - `http://localhost:19006`
   - `https://clmhzxiuzqvebzlkbdjs.supabase.co/auth/v1/callback`
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
- Check Supabase logs: Dashboard → Logs → Auth
- Verify all URLs match exactly (no trailing slashes)
- Make sure Google provider is enabled and saved
- Wait 5 minutes after configuration

### Error: redirect_uri_mismatch?
- Verify redirect URL in Supabase matches exactly: `http://localhost:8081`
- Check Google Cloud Console redirect URI is added
- Clear browser cache and try again

## Quick Checklist

- [ ] Supabase: Google provider enabled
- [ ] Supabase: Client ID added
- [ ] Supabase: Client Secret added
- [ ] Supabase: Site URL set to `http://localhost:8081`
- [ ] Supabase: Redirect URLs added (3 URLs)
- [ ] Google Cloud: Redirect URI added
- [ ] Waited 2-3 minutes
- [ ] Cleared browser cache
- [ ] Tested login

Once all checked, Google OAuth will work! ✅

