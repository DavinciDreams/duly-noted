# Troubleshooting Guide

## OAuth Not Working

**Issue:** "URI mismatch" error when signing in

**Solution:**
1. Check your extension ID at `chrome://extensions/`
2. Update redirect URI in GitHub/Notion OAuth settings
3. Reload the extension
4. Try signing in again

**Note:** Extension ID changes when you reload an unpacked extension in a different directory.

## Notion Button Disabled

**Issue:** Notion button is grayed out

**Solution:**
1. Click Settings → Notion Integration
2. Click "Sign in with Notion"
3. Complete OAuth flow
4. Grant integration access to pages/databases in Notion

## GitHub API Rate Limit

**Issue:** "API rate limit exceeded" error

**Solution:**
- Wait an hour for rate limit to reset
- Use OAuth (provides higher rate limits than anonymous)

## No Transcription Appearing

**Issue:** Recording starts but no text appears

**Solution:**
1. Check microphone permission at `chrome://settings/content/microphone`
2. Verify your browser supports Web Speech API (Chrome/Edge)
3. Check internet connection (Web Speech API requires internet)
4. Try speaking louder or closer to microphone

## Extension Crashes

**Issue:** Extension stops working or crashes

**Solution:**
1. Go to `chrome://extensions/`
2. Click reload button for Duly Noted
3. Check service worker console for errors
4. Try clearing extension storage (Settings → Advanced → Clear All Data)

## Debugging Tips

### Service Worker Console
- Go to `chrome://extensions/`
- Click "service worker" link under Duly Noted
- Console shows background logs

### Side Panel Console
- Right-click inside the side panel
- Select "Inspect"
- Console shows UI logs

### View Storage
```javascript
// In any extension context
chrome.storage.local.get(null, (data) => console.log(data));
```

### Clear Storage
```javascript
chrome.storage.local.clear();
```
