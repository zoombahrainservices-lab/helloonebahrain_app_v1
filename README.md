# Hello Bahrain E-Commerce App

React Native/Expo e-commerce application with Supabase authentication.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npx expo start

# Build for Android
npx expo run:android

# Or use the build script
.\build-android-dev.ps1
```

## Google OAuth Setup (Required)

### 1. Supabase Dashboard
- Go to: Authentication → Providers → Google
- Enable Google provider
- Add Client ID: `120230169088-7ppn1sr6mnvekrr6m5m7fq8pu5ktjo4v.apps.googleusercontent.com`
- Add Client Secret (from Google Cloud Console)

### 2. Supabase Settings
- Go to: Settings → General
- Set Site URL: `http://localhost:8081` (or your web URL)
- Add Redirect URLs:
  - `http://localhost:8081`
  - `http://localhost:19006`
  - `https://clmhzxiuzqvebzlkbdjs.supabase.co/auth/v1/callback`

### 3. Google Cloud Console
- Go to: APIs & Services → Credentials
- Find "HelloBahrain Web" OAuth client
- Add Authorized Redirect URI: `https://clmhzxiuzqvebzlkbdjs.supabase.co/auth/v1/callback`

## Features

- ✅ Email/Password authentication (Supabase)
- ✅ Google OAuth (Web & Mobile)
- ✅ Shopping cart
- ✅ Product browsing
- ✅ Order management
- ✅ Multi-language support

## Tech Stack

- React Native / Expo
- Supabase (Auth & Backend)
- TypeScript
- React Navigation







