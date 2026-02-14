# Duly Noted 🎤

**Capture voice notes with real-time transcription. Send to GitHub Issues, GitHub Projects, or Notion. Never lose a great idea again.**

A Chrome extension that lets you quickly capture voice notes using Web Speech API for real-time transcription. Instantly send notes to your favorite productivity tools or save them locally.

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/DavinciDreams/duly-noted/releases/tag/v1.0.0)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## 📸 Screenshots & Features

<div align="center">
<img src="assets/Screenshot%202026-02-14%20063750.png" width="45%" />
<img src="assets/Screenshot%202026-02-14%20063601.png" width="45%" />
</div>

<div>
<div style="display: inline-block; width: 48%; vertical-align: top;">

### 🎙️ Voice Recording & Transcription
- **Real-time transcription** using Web Speech API
- **Editable transcripts** - fix any errors before sending
- **Visual feedback** with live recording timer
- **High accuracy** speech-to-text conversion

</div>
<div style="display: inline-block; width: 48%; vertical-align: top; margin-left: 3%;">

### 📜 History & Organization
- **Recent notes** preview in sidebar
- **Full history view** with filtering
- **Click to open** - direct links to GitHub/Notion
- **Persistent storage** - never lose your notes
- **Metadata tracking** - timestamps, destinations, and more

</div>
</div>
  
### Destination Chooser
![GitHub Integration](assets/Screenshot%202026-02-14%20063434.png)
*Choose where to send your note - GitHub, Notion, or save as draft*

### GitHub Integration
![Destination Chooser](assets/Screenshot%202026-02-14%20063151.png)
*Create GitHub Issues with repository selection*

### Notion Integration
![Recording Interface](assets/Screenshot%202026-02-14%20062435.png)
*Send notes to Notion databases or pages*



## ✨ Features

### 🐙 GitHub Integration
- **Create GitHub Issues** directly from voice notes
- **Add to GitHub Projects** with custom fields
- **OAuth authentication** - secure, no tokens to manage
- **Repository selection** - choose from all your repos
- **Clickable history** - links open issues/projects in new tabs

### 📓 Notion Integration
- **Send to Notion databases** or create child pages
- **OAuth authentication** - secure workspace connection
- **Auto-formatting** - first line becomes title
- **Smart detection** - finds all accessible databases and pages
- **Clickable history** - links open Notion pages in new tabs

## 🚀 Quick Start

### Installation

**From Chrome Web Store (Recommended):**
1. Visit the [Chrome Web Store](https://chrome.google.com/webstore) (link coming soon)
2. Click "Add to Chrome"
3. Confirm the permissions
4. Pin the extension to your toolbar

**For Development:**
1. Clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right)
4. Click "Load unpacked"
5. Select this directory
6. Pin the extension to your toolbar

### First Run

1. Click the Duly Noted icon in your toolbar (or press `Alt+Shift+V`)
2. Grant microphone permission when prompted
3. Click "Start Recording" and speak your first note
4. Click "Stop & Send" when done
5. Choose "Save as Draft" to save locally

### Setting up GitHub Integration

1. Click the Settings icon (⚙️) in the extension
2. Scroll to "🐙 GitHub Integration"
3. Click "Sign in with GitHub"
4. Authorize the application
5. You can now send notes to GitHub Issues and Projects!

**Note:** Your GitHub OAuth credentials are stored securely in Chrome's storage and never shared.

### Setting up Notion Integration

1. Click the Settings icon (⚙️) in the extension
2. Scroll to "📝 Notion Integration"
3. Click "Sign in with Notion"
4. Select your workspace and authorize
5. Grant access to specific databases/pages in Notion
6. You can now send notes to Notion!

**Note:** You need to grant the integration access to pages/databases in Notion:
- Open a page in Notion → "..." menu → "Add connections" → Select "Duly Noted"

## 📋 Usage

### Recording a Voice Note

1. Click "Start Recording" (or use keyboard shortcut)
2. Speak your note - transcription appears in real-time
3. Click "Edit" to manually fix any transcription errors
4. Click "Stop & Send" when finished

### Sending to GitHub Issues

1. After recording, click the "GitHub Issue" button
2. Select a repository from the dropdown
3. Edit the title and body if needed
4. Click "Create Issue"
5. Your note is now a GitHub Issue with a clickable link in history!

### Sending to GitHub Projects

1. After recording, click the "GitHub Project" button
2. Select a repository
3. Select a project from that repository
4. Edit the title and body if needed
5. Click "Add to Project"
6. Your note is now a project item!

### Sending to Notion

1. After recording, click the "Notion" button
2. Extension automatically finds your first database or page
3. First line becomes the page title
4. Full transcription becomes the page content
5. Click the note in history to open it in Notion!

## ⚙️ Settings

### General Settings
- **Maximum Recording Duration** - Set recording time limit (default: 5 minutes)

### GitHub Settings
- **OAuth Status** - View connection status and workspace
- **Sign Out** - Disconnect GitHub integration

### Notion Settings
- **OAuth Status** - View connection status and workspace
- **Sign Out** - Disconnect Notion integration

### Advanced Settings
- **Clear All Data** - Reset extension (deletes all notes and settings)

## 🛠️ Development

### Project Structure

```
duly-noted/
├── manifest.json              # Extension configuration (Manifest V3)
├── .env.example              # OAuth credentials template
├── package.json              # Dependencies
├── scripts/
│   └── build-config.js       # Runtime config generator
├── icons/                    # Extension icons (16x16, 48x48, 128x128)
├── assets/                   # Screenshots and logo
└── src/
    ├── service-worker/
    │   └── service-worker.js # Background service worker
    ├── offscreen/
    │   ├── offscreen.html    # Web Speech API context
    │   └── offscreen.js      # Speech recognition handler
    ├── sidepanel/
    │   ├── sidepanel.html    # Main UI
    │   ├── sidepanel.css     # Styles
    │   └── sidepanel.js      # UI controller
    ├── config/
    │   ├── oauth-config.js   # OAuth configuration
    │   └── runtime-config.js # Generated from .env
    ├── lib/
    │   ├── oauth-service.js       # OAuth core logic
    │   ├── github-oauth.js        # GitHub OAuth implementation
    │   ├── github-service.js      # GitHub API wrapper
    │   ├── notion-oauth.js        # Notion OAuth implementation
    │   ├── notion-service.js      # Notion API wrapper
    │   ├── transcription-service.js # Web Speech API wrapper
    │   └── storage.js             # Chrome storage wrappers
    └── utils/
        └── helpers.js        # Utility functions
```

### Building from Source

**Prerequisites:**
- Node.js and npm installed
- Chrome browser

**Steps:**
1. Clone the repository: `git clone https://github.com/DavinciDreams/duly-noted.git`
2. Navigate to the directory: `cd duly-noted`
3. Copy `.env.example` to `.env`
4. Add your OAuth credentials (see below)
5. Install dependencies: `npm install`
6. Generate runtime config: `npm run build:config`
7. Load the extension in Chrome (see Installation for Development above)

### OAuth Credentials Setup

For GitHub:
1. Create OAuth App at https://github.com/settings/developers
2. Set redirect URI: `https://YOUR_EXTENSION_ID.chromiumapp.org/`
3. Add Client ID and Secret to `.env`

For Notion:
1. Create integration at https://www.notion.so/my-integrations
2. Set redirect URI: `https://YOUR_EXTENSION_ID.chromiumapp.org/`
3. Add Client ID and Secret to `.env`

**Note:** Extension ID can be found at `chrome://extensions/` after loading the unpacked extension.

### Debugging

**Service Worker Console:**
- Go to `chrome://extensions/`
- Click "service worker" link under Duly Noted
- Console shows background logs

**Side Panel Console:**
- Right-click inside the side panel
- Select "Inspect"
- Console shows UI logs

**View Storage:**
```javascript
// In any extension context
chrome.storage.local.get(null, (data) => console.log(data));
```

**Clear Storage:**
```javascript
chrome.storage.local.clear();
```

## 🐛 Troubleshooting

### OAuth Not Working

**Issue:** "URI mismatch" error when signing in

**Solution:**
1. Check your extension ID at `chrome://extensions/`
2. Update redirect URI in GitHub/Notion OAuth settings
3. Reload the extension
4. Try signing in again

**Note:** Extension ID changes when you reload an unpacked extension in a different directory.

### Notion Button Disabled

**Issue:** Notion button is grayed out

**Solution:**
1. Click Settings → Notion Integration
2. Click "Sign in with Notion"
3. Complete OAuth flow
4. Grant integration access to pages/databases in Notion

### GitHub API Rate Limit

**Issue:** "API rate limit exceeded" error

**Solution:**
- Wait an hour for rate limit to reset
- Use OAuth (provides higher rate limits than anonymous)

### No Transcription Appearing

**Issue:** Recording starts but no text appears

**Solution:**
1. Check microphone permission at `chrome://settings/content/microphone`
2. Verify your browser supports Web Speech API (Chrome/Edge)
3. Check internet connection (Web Speech API requires internet)
4. Try speaking louder or closer to microphone

### Extension Crashes

**Issue:** Extension stops working or crashes

**Solution:**
1. Go to `chrome://extensions/`
2. Click reload button for Duly Noted
3. Check service worker console for errors
4. Try clearing extension storage (Settings → Advanced → Clear All Data)

## 📚 Documentation

- [Setup Guide](SETUP-OAUTH.md) - Detailed OAuth setup instructions
- [Notion Setup](NOTION-SETUP.md) - Notion integration guide
- [Testing Guide](TESTING-NOTION.md) - Testing checklist
- [PRD](PRD.md) - Product requirements
- [Development Learnings](CHROME-EXTENSION-LEARNINGS.md) - Chrome extension tips

## 🔒 Privacy & Security

- **Local Storage:** All voice notes are stored locally in Chrome's storage
- **No Cloud Recording:** Audio is processed in-browser only (Web Speech API)
- **OAuth Tokens:** Stored securely in `chrome.storage.local`
- **No Analytics:** We don't track your usage
- **No Third-Party Servers:** Direct API calls to GitHub/Notion only

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Guidelines

1. Follow existing code style
2. Test all changes thoroughly
3. Update documentation if needed
4. Commit messages should be clear and descriptive

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

- Built with [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- Icons from [Heroicons](https://heroicons.com/)
- GitHub API integration via [GitHub REST API](https://docs.github.com/en/rest)
- Notion API integration via [Notion API](https://developers.notion.com/)

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/DavinciDreams/duly-noted/issues)
- **Discussions:** [GitHub Discussions](https://github.com/DavinciDreams/duly-noted/discussions)

---

**Version:** 1.0.0 | **Released:** 2026-02-14

Made with ❤️ and Claude Code
