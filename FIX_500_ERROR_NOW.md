# 🔴 FIX THE 500 ERROR - REQUIRED STEPS

## ⚠️ THIS IS NOT A CODE ISSUE - IT'S A SUPABASE CONFIGURATION ISSUE

The 500 error means **Supabase Google OAuth is not configured**. You MUST do these steps in Supabase Dashboard.

---

## ✅ STEP 1: Enable Google Provider in Supabase

1. **Open:** https://supabase.com/dashboard/project/clmhzxiuzqvebzlkbdjs/auth/providers
2. **Click:** "Google" in the list
3. **Toggle:** "Enable Google provider" to **ON**
4. **Enter:**
   - **Client ID (for OAuth):** `120230169088-7ppn1sr6mnvekrr6m5m7fq8pu5ktjo4v.apps.googleusercontent.com`
   - **Client Secret (for OAuth):** Get from Step 3 below
5. **Click:** "Save"

---

## ✅ STEP 2: Configure Redirect URLs in Supabase

1. **Open:** https://supabase.com/dashboard/project/clmhzxiuzqvebzlkbdjs/settings/general
2. **Find:** "Site URL" section
3. **Set Site URL:** `http://localhost:8081`
4. **In "Redirect URLs"**, click "Add URL" and add these **EXACTLY** (one at a time):
   - `http://localhost:8081`
   - `http://localhost:19006`
   - `https://clmhzxiuzqvebzlkbdjs.supabase.co/auth/v1/callback`
5. **Click:** "Save"

---

## ✅ STEP 3: Get Google Client Secret

1. **Open:** https://console.cloud.google.com/apis/credentials
2. **Find:** "HelloBahrain Web" OAuth 2.0 Client ID (the one with ID ending in `...7ppn1sr6mnvekrr6m5m7fq8pu5ktjo4v`)
3. **Click** to edit it
4. **Copy** the "Client secret" value (it looks like: `GOCSPX-...`)
5. **Paste** it into Supabase Step 1 above

---

## ✅ STEP 4: Add Redirect URI in Google Cloud

1. **Same page** as Step 3 (Google Cloud Console)
2. **Under "Authorized redirect URIs"**, click "Add URI"
3. **Add:** `https://clmhzxiuzqvebzlkbdjs.supabase.co/auth/v1/callback`
4. **Click:** "Save"

---

## ⏳ STEP 5: Wait and Test

1. **Wait 2-3 minutes** for changes to propagate
2. **Clear browser cache** (Ctrl+Shift+Delete)
3. **Test:**
   ```bash
   npx expo start --clear
   ```
4. Press `w` to open in browser
5. Click "Continue with Google"

---

## 🔍 How to Verify It's Fixed

After configuration, when you click "Continue with Google":
- ✅ Should redirect to Google login page (not 500 error)
- ✅ After Google login, should redirect back to your app
- ✅ Should be logged in

If you still get 500 error:
- Check Supabase logs: Dashboard → Logs → Auth
- Verify all URLs match EXACTLY (no trailing slashes, no typos)
- Make sure you clicked "Save" on all pages
- Wait 5 minutes and try again

---

## 📋 Quick Checklist

- [ ] Supabase: Google provider enabled
- [ ] Supabase: Client ID added
- [ ] Supabase: Client Secret added (from Google Cloud)
- [ ] Supabase: Site URL = `http://localhost:8081`
- [ ] Supabase: 3 Redirect URLs added
- [ ] Google Cloud: Redirect URI added
- [ ] All changes saved
- [ ] Waited 2-3 minutes
- [ ] Cleared browser cache
- [ ] Tested login

**Once all checked, the 500 error will be gone!** ✅

