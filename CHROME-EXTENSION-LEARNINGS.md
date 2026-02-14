# Chrome Extension Development: Lessons Learned

This document captures critical lessons, mistakes, and best practices from building the "Duly Noted" Chrome extension with OAuth integration.

---

## Table of Contents
- [OAuth Implementation](#oauth-implementation)
- [Module System & MIME Types](#module-system--mime-types)
- [Configuration Management](#configuration-management)
- [Chrome Extension APIs](#chrome-extension-apis)
- [Common Mistakes](#common-mistakes)
- [Best Practices](#best-practices)
- [Git Worktrees with Extensions](#git-worktrees-with-extensions)

---

## OAuth Implementation

### ✅ Correct OAuth Flow

**Use `chrome.identity.launchWebAuthFlow()` - NOT `chrome.windows.create()`**

```javascript
// ✅ CORRECT - Official Chrome Extension OAuth API
const redirectUrl = await chrome.identity.launchWebAuthFlow({
  url: authUrl,
  interactive: true
});

// ❌ WRONG - Generic popup (not OAuth-specific)
await chrome.windows.create({
  url: authUrl,
  type: 'popup'
});
```

**Why it matters:**
- `launchWebAuthFlow()` is the official API designed for OAuth
- Handles redirect interception automatically
- Popup closes automatically after auth
- More secure (Chrome manages the flow)
- Better UX (native browser OAuth handling)

### Redirect URI Format

**For `chrome.identity.launchWebAuthFlow()`, use `chromiumapp.org` format:**

```javascript
// ✅ CORRECT
static getRedirectUri() {
  const extensionId = chrome.runtime.id;
  return `https://${extensionId}.chromiumapp.org/`;
}

// ❌ WRONG
static getRedirectUri() {
  return chrome.runtime.getURL('src/oauth/oauth-callback.html');
  // Returns: chrome-extension://<id>/src/oauth/oauth-callback.html
}
```

**Important:**
- The redirect URI in your OAuth provider (GitHub/Google/etc.) MUST match exactly
- Format: `https://<extension-id>.chromiumapp.org/`
- Extension ID can be found in `chrome://extensions`
- Example: `https://mhichihooaoppodidfoipflnlljkjcpa.chromiumapp.org/`

### OAuth Callback Files

**With `launchWebAuthFlow()`, you DON'T need callback HTML/JS files:**

```
❌ NOT NEEDED:
- src/oauth/oauth-callback.html
- src/oauth/oauth-callback.js
- Message passing between contexts
```

Chrome intercepts the redirect automatically and returns the URL to your code.

### Required Permissions

```json
{
  "permissions": [
    "identity",  // Required for OAuth
    "storage"    // To store tokens
  ],
  "host_permissions": [
    "https://github.com/login/oauth/*",  // OAuth provider
    "https://api.github.com/*"           // API calls
  ]
}
```

---

## Module System & MIME Types

### The MIME Type Problem

**Chrome extensions enforce STRICT MIME type checking for ES modules.**

#### ❌ What Doesn't Work

```javascript
// Trying to import JSON with import assertions
const config = await import('./config.json', { assert: { type: 'json' } });
// Error: MIME type mismatch

// Trying to fetch JSON in module context
const response = await fetch(chrome.runtime.getURL('config.json'));
const config = await response.json();
// Error: Expected JavaScript module but got JSON
```

#### ✅ What Works

**Convert JSON to JavaScript module:**

```javascript
// Generate a .js file instead of .json
export const runtimeConfig = {
  "github": {
    "clientId": "...",
    "clientSecret": "..."
  }
};

// Import it as a normal ES module
const configModule = await import('./runtime-config.js');
const config = configModule.runtimeConfig;
```

### Build Script Pattern

```javascript
// scripts/build-config.js
function writeConfig(config) {
  const jsContent = `/**
 * Auto-generated config
 * DO NOT EDIT MANUALLY
 */

export const runtimeConfig = ${JSON.stringify(config, null, 2)};
`;
  fs.writeFileSync('src/config/runtime-config.js', jsContent);
}
```

**Key points:**
- Generate `.js` files, not `.json`
- Use ES module `export` syntax
- Git-ignore the generated file
- Include clear "DO NOT EDIT" warning

---

## Configuration Management

### Environment Variables in Extensions

**Problem:** Chrome extensions can't read `.env` files directly (browser security).

**Solution:** Build-time config generation

```bash
# 1. Developer creates .env file
GITHUB_CLIENT_ID=abc123
GITHUB_CLIENT_SECRET=secret456

# 2. Run build script
npm run build:config

# 3. Generates src/config/runtime-config.js
export const runtimeConfig = {
  github: { clientId: "abc123", clientSecret: "secret456" }
};

# 4. Extension imports the JS module
import { runtimeConfig } from './runtime-config.js';
```

### Security Best Practices

```gitignore
# Always git-ignore credentials
.env
.env.local
src/config/runtime-config.json
src/config/runtime-config.js
```

**Production warning:**
```javascript
/**
 * ⚠️ SECURITY WARNING
 * Client secrets in extension code are NOT secure.
 * For production, use an OAuth proxy:
 * - Cloudflare Workers
 * - Vercel Functions
 * - Your own backend
 *
 * The proxy stores secrets server-side and exchanges
 * auth codes for tokens on behalf of the extension.
 */
```

---

## Chrome Extension APIs

### Side Panels vs Popups vs Offscreen Documents

| Feature | Side Panel | Popup | Offscreen |
|---------|-----------|-------|-----------|
| Microphone Access | ✅ With permission popup | ✅ With permission popup | ❌ Cannot show prompts |
| OAuth UI | ❌ Use launchWebAuthFlow | ❌ Use launchWebAuthFlow | ❌ Hidden document |
| Persistent | ✅ Stays open | ❌ Closes on blur | ✅ Background |
| User Interaction | ✅ Full UI | ✅ Full UI | ❌ Hidden |

**Lesson:** We initially tried using `offscreen` documents for OAuth, but they can't show permission prompts. Use `chrome.identity.launchWebAuthFlow()` instead.

### Service Workers (Background)

```json
{
  "background": {
    "service_worker": "src/service-worker.js"
    // ❌ DON'T use "type": "module" here (causes registration errors)
  }
}
```

**If you need ES modules in service worker:**
- Use `importScripts()` for dependencies
- Or use a bundler (webpack/rollup) to create a single file

---

## Common Mistakes

### Mistake #1: Using Regular Popups for OAuth

```javascript
// ❌ WRONG
chrome.windows.create({ url: authUrl, type: 'popup' });

// ✅ CORRECT
chrome.identity.launchWebAuthFlow({ url: authUrl, interactive: true });
```

### Mistake #2: Wrong Redirect URI Format

```javascript
// ❌ WRONG
redirectUri: chrome.runtime.getURL('oauth-callback.html')
// Results in: chrome-extension://abc123/oauth-callback.html

// ✅ CORRECT
redirectUri: `https://${chrome.runtime.id}.chromiumapp.org/`
```

### Mistake #3: Importing JSON in Module Context

```javascript
// ❌ WRONG
import config from './config.json' assert { type: 'json' };
// MIME type error

// ✅ CORRECT
// Generate config.js instead:
export const config = { /* data */ };
import { config } from './config.js';
```

### Mistake #4: Not Reloading Extension

**Problem:** Made code changes but don't see them.

**Solution:** Always reload extension after changes:
```
chrome://extensions → Click reload button
```

**Even better:** Use extension auto-reload during development
```json
// package.json
"scripts": {
  "watch": "chokidar 'src/**/*' -c 'echo Reload extension in chrome://extensions'"
}
```

### Mistake #5: Wrong Worktree/Branch Loaded

**Problem:** Working in `github-integration` branch but extension loads from `master` branch directory.

**Solution:**
```bash
# Check which directory you loaded
chrome://extensions → "Duly Noted" → Details → Look at path

# Should be:
C:\Users\...\github-integration

# NOT:
C:\Users\...\voice starter
```

---

## Best Practices

### 1. OAuth Implementation Checklist

- [ ] Use `chrome.identity.launchWebAuthFlow()`
- [ ] Redirect URI uses `chromiumapp.org` format
- [ ] Get extension ID from `chrome.runtime.id` dynamically
- [ ] Update OAuth provider with correct callback URL
- [ ] Add `identity` permission to manifest
- [ ] Store tokens in `chrome.storage.local` securely
- [ ] Implement token refresh logic
- [ ] Handle auth errors gracefully

### 2. Configuration Pattern

```javascript
// 1. Create .env.example (commit this)
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_secret_here

// 2. Developer copies to .env (git-ignored)
cp .env.example .env

// 3. Build script generates runtime-config.js (git-ignored)
npm run build:config

// 4. Extension imports config
import { runtimeConfig } from './runtime-config.js';
```

### 3. Module Loading in Extensions

```javascript
// manifest.json
{
  "side_panel": {
    "default_path": "src/sidepanel.html"
  }
}

// sidepanel.html
<script src="sidepanel.js" type="module"></script>

// sidepanel.js - Can use ES modules freely
import { GitHubOAuth } from './lib/github-oauth.js';
```

### 4. Permission Request Flow

```javascript
// For features requiring permissions:
// 1. Check if permission already granted
const hasPermission = await navigator.permissions.query({ name: 'microphone' });

// 2. If not, use a user-triggered action (button click)
button.addEventListener('click', async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  // Permission prompt shows here
});

// 3. Never request permissions on page load (bad UX)
```

### 5. Error Handling Pattern

```javascript
try {
  const result = await GitHubOAuth.authorize();
  await updateUI(result);
} catch (error) {
  console.error('[Component] Operation failed:', error);
  showToast(`Error: ${error.message}`, 'error');
  // Reset UI to previous state
  resetButton();
}
```

---

## Git Worktrees with Extensions

### Problem

When using git worktrees, you may have multiple directories:
```
extension/
├── voice-starter/       # master branch
└── github-integration/  # feature branch
```

Chrome extension loads from a **specific directory**, not the git branch.

### Solution

**Always verify which directory is loaded:**

```bash
# 1. Check loaded extension path
chrome://extensions → Details → "Extension path"

# 2. Should match your current working branch
cd github-integration  # Feature branch
# Load from: .../github-integration/

# 3. Remove old extension and reload correct one if mismatch
```

### Development Workflow

```bash
# 1. Create feature worktree
git worktree add ../feature-branch -b feature-branch

# 2. Load extension from feature worktree
chrome://extensions → Load unpacked → .../feature-branch/

# 3. Make changes in feature worktree
cd ../feature-branch
# edit files

# 4. Reload extension (NOT browser)
chrome://extensions → Reload button

# 5. When done, merge and remove worktree
git checkout main
git merge feature-branch
git worktree remove ../feature-branch
```

---

## Testing OAuth Flow

### Manual Test Checklist

```
□ Extension loads without errors (check console)
□ Settings page shows OAuth UI
□ "Sign in with GitHub" button visible
□ Click button → OAuth popup opens
□ Authorize on provider → popup closes automatically
□ Extension shows connected state (avatar, username)
□ "Sign Out" button appears
□ Token stored in chrome.storage.local
□ Refresh extension → still logged in (token persists)
□ Sign out → token cleared, back to sign-in state
```

### Console Verification

Expected logs:
```
[OAuth Config] Runtime config loaded successfully
[GitHubOAuth] Launching web auth flow
[GitHubOAuth] Authorization successful
[Side Panel] GitHub auth successful: username
```

---

## Quick Reference

### Essential Chrome Extension URLs

```
chrome://extensions          # Manage extensions
chrome://extensions/shortcuts # Configure keyboard shortcuts
chrome://version             # Chrome version info
```

### Debugging

```javascript
// Extension console
Right-click extension → Inspect → Console

// Service worker console
chrome://extensions → Service worker → Inspect → Console

// Check storage
chrome.storage.local.get(null, (items) => console.log(items));
```

### File Structure

```
extension/
├── manifest.json              # Extension config
├── .env                       # OAuth secrets (git-ignored)
├── .env.example              # Template (committed)
├── src/
│   ├── config/
│   │   ├── oauth-config.js   # Loads runtime config
│   │   └── runtime-config.js # Generated (git-ignored)
│   ├── lib/
│   │   ├── oauth-service.js  # Generic OAuth
│   │   └── github-oauth.js   # GitHub-specific
│   ├── sidepanel/
│   │   ├── sidepanel.html
│   │   ├── sidepanel.js
│   │   └── sidepanel.css
│   └── service-worker/
│       └── service-worker.js
└── scripts/
    └── build-config.js       # Generates runtime-config.js
```

---

## Summary

**Top 5 Critical Lessons:**

1. **Use `chrome.identity.launchWebAuthFlow()` for OAuth** - not regular popups
2. **Redirect URI must use `chromiumapp.org` format** - not `chrome-extension://`
3. **Generate `.js` modules, not `.json` files** - to avoid MIME errors
4. **Always reload extension after code changes** - changes don't apply automatically
5. **Check which directory/branch is loaded** - especially with git worktrees

**Developer happiness tip:**
After every code change: `chrome://extensions → Reload → Test in extension`

---

*Document created: 2026-02-14*
*Project: Duly Noted Chrome Extension*
*Phase: 2 - OAuth Integration*
