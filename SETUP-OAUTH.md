# OAuth Setup Guide

This guide walks you through setting up GitHub OAuth for the Duly Noted extension.

## Overview

The extension uses OAuth 2.0 to securely connect to your GitHub account. Your credentials are stored locally in a `.env` file and **never committed to git**.

---

## Step 1: Create GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **"New OAuth App"**
3. Fill in the application details:

   ```
   Application name: Duly Noted (Development)
   Homepage URL: https://github.com/DavinciDreams/duly-noted
   Application description: Voice notes with GitHub integration
   Authorization callback URL: chrome-extension://YOUR_EXTENSION_ID/src/oauth/oauth-callback.html
   ```

   **⚠️ Important:** You'll need to get your extension ID first (see Step 3 below), then come back and update the callback URL.

4. Click **"Register application"**
5. On the next page, you'll see your **Client ID**
6. Click **"Generate a new client secret"** to get your **Client Secret**
7. **Copy both values** - you'll need them in the next step

---

## Step 2: Configure Environment Variables

1. **Copy the example environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` and add your credentials:**
   ```bash
   # .env
   GITHUB_CLIENT_ID=your_actual_client_id_here
   GITHUB_CLIENT_SECRET=your_actual_client_secret_here
   ```

3. **Generate the runtime config:**
   ```bash
   npm run build:config
   ```

   This creates `src/config/runtime-config.json` with your credentials (git-ignored).

4. **Verify success:**
   ```
   ✅ Runtime config generated successfully!
      File: /path/to/src/config/runtime-config.json
   ```

---

## Step 3: Load Extension and Get Extension ID

1. **Open Chrome and go to:** `chrome://extensions`

2. **Enable Developer Mode** (toggle in top-right)

3. **Click "Load unpacked"** and select the extension directory:
   ```
   C:\Users\lmwat\extension\github-integration
   ```

4. **Copy the Extension ID** (looks like: `abcdefghijklmnopqrstuvwxyz123456`)

5. **Go back to GitHub OAuth App settings** and update the callback URL:
   ```
   chrome-extension://YOUR_ACTUAL_EXTENSION_ID/src/oauth/oauth-callback.html
   ```

---

## Step 4: Test OAuth Flow

1. **Click the extension icon** in Chrome toolbar
2. **Click the settings icon** (⚙️) in the extension
3. **Click "Sign in with GitHub"**
4. **Authorize the app** on GitHub
5. **Verify you see your GitHub avatar** and username in settings

### Expected Flow:
```
Extension Settings
  ↓
"Sign in with GitHub" button
  ↓
GitHub authorization page (in popup)
  ↓
User approves permissions
  ↓
Redirect to oauth-callback.html
  ↓
Token exchange happens
  ↓
Success page (auto-closes)
  ↓
Extension shows connected state
```

---

## Troubleshooting

### ❌ "GitHub OAuth is not configured"
**Cause:** Missing or invalid credentials in `.env`

**Fix:**
1. Verify `.env` file exists with correct values
2. Run `npm run build:config` again
3. Reload the extension

### ❌ "Redirect URI mismatch"
**Cause:** Callback URL doesn't match extension ID

**Fix:**
1. Check extension ID in `chrome://extensions`
2. Update callback URL in GitHub OAuth App settings
3. Reload the extension

### ❌ OAuth popup doesn't open
**Cause:** Extension doesn't have `identity` permission

**Fix:**
1. Check `manifest.json` has `"identity"` in permissions
2. Reload the extension

### ❌ "Failed to exchange code for token"
**Cause:** Client secret is incorrect or expired

**Fix:**
1. Regenerate client secret in GitHub OAuth App settings
2. Update `.env` with new secret
3. Run `npm run build:config`
4. Reload the extension

---

## Security Notes

### ⚠️ DO NOT:
- ❌ Commit `.env` file to git (it's in `.gitignore`)
- ❌ Commit `src/config/runtime-config.json` (it's in `.gitignore`)
- ❌ Share your client secret publicly
- ❌ Use the same OAuth app for production

### ✅ DO:
- ✅ Keep `.env` file local to your machine
- ✅ Use separate OAuth apps for dev/staging/production
- ✅ Regenerate secrets if they're ever exposed
- ✅ Consider using an OAuth proxy for production (Cloudflare Workers/Vercel Functions)

---

## Production Deployment

For production, **DO NOT** bundle client secrets in the extension code.

### Recommended Architecture:
```
Extension → OAuth Proxy (Cloudflare Workers) → GitHub OAuth
```

The proxy:
- Stores client secret securely (server-side)
- Exchanges authorization codes for tokens
- Returns only the access token to the extension
- Prevents secret exposure in extension code

### Example Proxy Implementation:
See `PHASE-2-PLAN.md` section "OAuth Proxy Architecture" for details.

---

## Files Reference

| File | Purpose | Committed? |
|------|---------|------------|
| `.env.example` | Template for environment variables | ✅ Yes |
| `.env` | Your actual credentials | ❌ No (git-ignored) |
| `src/config/runtime-config.json` | Generated config from .env | ❌ No (git-ignored) |
| `src/config/oauth-config.js` | Loads runtime config | ✅ Yes |
| `scripts/build-config.js` | Generates runtime config | ✅ Yes |

---

## Quick Reference

### Setup Commands:
```bash
# 1. Copy environment template
cp .env.example .env

# 2. Edit .env with your credentials
# (use your favorite text editor)

# 3. Generate runtime config
npm run build:config

# 4. Load extension in Chrome
# chrome://extensions → Load unpacked
```

### Maintenance:
```bash
# Update credentials
npm run build:config

# Verify config
cat src/config/runtime-config.json

# Clear old config
rm src/config/runtime-config.json
npm run build:config
```

---

## Need Help?

- **GitHub OAuth Docs:** https://docs.github.com/en/apps/oauth-apps/building-oauth-apps
- **Chrome Extensions OAuth:** https://developer.chrome.com/docs/extensions/mv3/tut_oauth/
- **Issue Tracker:** https://github.com/DavinciDreams/duly-noted/issues
