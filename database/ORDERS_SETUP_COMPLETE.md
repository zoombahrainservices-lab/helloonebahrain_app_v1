# Orders Table Setup - Complete Fix

## What Was Fixed

1. ✅ **Added `payment_method` column** to `orders` table
2. ✅ **Fixed foreign key constraint** - Users are now automatically created in `users` table
3. ✅ **Updated code** to use `payment_method` column
4. ✅ **Fixed Google auth redirect URL** to match Supabase settings

## Required Database Setup

### Step 1: Run the SQL Migration

Go to your Supabase Dashboard → SQL Editor and run the script from `database/fix-orders-schema.sql`.

This will:
- Add `payment_method` column to `orders` table
- Create `users` table if it doesn't exist
- Create a trigger to automatically create users in `users` table when they authenticate
- Fix foreign key constraints

### Step 2: Verify Google Auth Configuration

1. **Supabase Dashboard → Auth → Providers → Google:**
   - ✅ Enable Google provider is ON
   - ✅ Client ID is set: `120230169088-7ppn1sr6mnvekrr6m5m7fq8pu5ktjo4v.apps.googleusercontent.com`
   - ✅ Client Secret is set

2. **Supabase Dashboard → Settings → General → Redirect URLs:**
   - ✅ Must include: `hellobahrain://` (exact match, no trailing slash)
   - ✅ Also include: `https://clmhzxiuzqvebzlkbdjs.supabase.co/auth/v1/callback`

3. **Google Cloud Console → Credentials:**
   - ✅ Add Redirect URI: `https://clmhzxiuzqvebzlkbdjs.supabase.co/auth/v1/callback`

## How It Works Now

### User Creation
- When a user authenticates (Google, email/password, etc.), a trigger automatically creates them in the `users` table
- The code also has a fallback function `ensureUserExists()` that creates users if the trigger fails

### Order Creation
- Orders now include `payment_method` column (cod, card, benefit)
- User is automatically created in `users` table before order creation
- Foreign key constraint is satisfied

### Google Auth
- Redirect URL is now exactly `hellobahrain://` to match Supabase settings
- OAuth flow properly handles callbacks and creates users automatically

## Testing

1. **Test Checkout:**
   - Login with email/password or Google
   - Add items to cart
   - Go to checkout
   - Place order - should work without foreign key errors

2. **Test Google Auth:**
   - Click "Continue with Google"
   - Should redirect to Google login
   - After login, should redirect back to app
   - User should be logged in

## Troubleshooting

### If checkout still fails:
- Make sure you ran the SQL migration
- Check that `users` table exists
- Verify the trigger is created: `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';`

### If Google auth still fails:
- Verify redirect URL in Supabase is exactly `hellobahrain://` (no trailing slash)
- Check Google Cloud Console redirect URI is set
- Wait 2-3 minutes after making changes
- Clear app cache and try again

