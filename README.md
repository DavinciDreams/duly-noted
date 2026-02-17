# Duly Noted

**capture creativity**

A Chrome extension that lets you quickly capture voice notes with real-time transcription. Send notes to GitHub Issues, GitHub Projects, Notion, or save them locally as drafts. Never lose a great idea again.

[![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)](https://github.com/DavinciDreams/duly-noted/releases/tag/v1.1.0)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## Features

### Voice Recording & Transcription
- **Real-time transcription** using Web Speech API
- **Editable transcripts** - fix any errors before sending
- **Visual feedback** with live waveform animation and recording timer
- **High accuracy** speech-to-text conversion

### GitHub Integration
- **Create GitHub Issues** directly from voice notes
- **Add to GitHub Projects** with custom fields
- **OAuth authentication** - secure, no tokens to manage
- **Repository selection** - choose from all your repos
- **Clickable history** - links open issues/projects in new tabs

### Notion Integration
- **Send to Notion databases** or create child pages
- **OAuth authentication** - secure workspace connection
- **Auto-formatting** - first line becomes title
- **Smart detection** - finds all accessible databases and pages
- **Clickable history** - links open Notion pages in new tabs

### History & Organization
- **Recent notes** preview in sidebar
- **Full history view** with filtering
- **Click to open** - direct links to GitHub/Notion
- **Persistent storage** - never lose your notes
- **Metadata tracking** - timestamps, destinations, and more

### Design
- **Dark glassmorphic UI** with frosted-glass cards and subtle gradients
- **Circular radial audio visualizer** - 180 frequency bars around a center ring, reactive to your voice in real-time
- **Light mode support** via `prefers-color-scheme`
- **Smooth animations** - brand gradient coloring (teal-to-green), spring-eased toasts
- **Accessible** - focus-visible outlines, reduced-motion support, high contrast text

## Browser Compatibility

**Fully Supported:**
- Google Chrome (recommended)
- Microsoft Edge

**Limited Support:**
- Brave Browser - Requires disabling shields for Web Speech API

**Not Supported:**
- Firefox - Does not support Web Speech API
- Safari - Limited Web Speech API support

## Quick Start

### Installation

**From Chrome Web Store (Recommended):**
1. Visit the [Chrome Web Store listing](https://chrome.google.com/webstore) (link coming soon)
2. Click "Add to Chrome"
3. Confirm the permissions
4. Pin the extension to your toolbar

**Friends & Beta Testers (from zip):**
1. Download the latest `duly-noted-v*-friends.zip` from [Releases](https://github.com/DavinciDreams/duly-noted/releases)
2. Unzip to a folder (e.g. `C:\duly-noted` or `~/duly-noted`)
3. Open Chrome and go to `chrome://extensions/`
4. Enable **Developer mode** (toggle in top-right)
5. Click **Load unpacked** and select the unzipped folder
6. Pin the extension to your toolbar
7. Click the Duly Noted icon, then go to **Settings** to connect your GitHub and/or Notion accounts

> **How it works:** The friends zip includes a public key in the manifest that gives everyone the same extension ID. This means OAuth "just works" — no need to create your own GitHub App, Notion integration, or Cloudflare Worker. You authenticate with *your own* GitHub/Notion accounts through the shared OAuth flow. Your tokens are stored locally and never shared.

**For Development (from source):**
1. Clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right)
4. Click "Load unpacked"
5. Select the project directory
6. Pin the extension to your toolbar

### First Run

1. Click the Duly Noted icon in your toolbar (or press `Alt+Shift+V`)
2. Grant microphone permission when prompted
3. Click "Start Recording" and speak your first note
4. Click "Stop & Send" when done
5. Choose a destination - GitHub, Notion, or save as draft

### Setting up GitHub Integration

1. Click the Settings icon in the extension
2. Scroll to "GitHub Integration"
3. Click "Sign in with GitHub"
4. Authorize the application
5. You can now send notes to GitHub Issues and Projects!

**Note:** Your GitHub OAuth credentials are stored securely in Chrome's storage and never shared.

### Setting up Notion Integration

1. Click the Settings icon in the extension
2. Scroll to "Notion Integration"
3. Click "Sign in with Notion"
4. Select your workspace and authorize
5. Grant access to specific databases/pages in Notion
6. You can now send notes to Notion!

**Note:** You need to grant the integration access to pages/databases in Notion:
- Open a page in Notion > "..." menu > "Add connections" > Select "Duly Noted"

## Usage

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

### Sending to Notion

1. After recording, click the "Notion" button
2. Extension automatically finds your first database or page
3. First line becomes the page title
4. Full transcription becomes the page content
5. Click the note in history to open it in Notion!

## Settings

- **Maximum Recording Duration** - Set recording time limit (default: 5 minutes)
- **GitHub OAuth** - View connection status, sign in/out
- **Notion OAuth** - View connection status, sign in/out
- **Clear All Data** - Reset extension (deletes all notes and settings)

## Development

### Project Structure

```
duly-noted/
├── manifest.json              # Extension configuration (Manifest V3)
├── package.json               # Dependencies & scripts
├── scripts/
│   └── package.js             # Zip packager for Chrome Web Store
├── icons/                     # Extension icons & logos
├── src/
│   ├── service-worker/
│   │   └── service-worker.js  # Background service worker
│   ├── offscreen/
│   │   ├── offscreen.html     # Web Speech API context
│   │   └── offscreen.js       # Speech recognition handler
│   ├── sidepanel/
│   │   ├── sidepanel.html     # Main UI
│   │   ├── sidepanel.css      # Styles (dark glassmorphic theme)
│   │   └── sidepanel.js       # UI controller
│   ├── permission/
│   │   ├── permission.html    # Microphone permission popup
│   │   └── permission.js      # Permission request handler
│   ├── config/
│   │   └── oauth-config.js    # OAuth configuration
│   ├── lib/
│   │   ├── oauth-service.js        # OAuth core logic
│   │   ├── github-oauth.js         # GitHub OAuth implementation
│   │   ├── github-service.js       # GitHub API wrapper
│   │   ├── github-cache.js         # Recently used repos/projects cache
│   │   ├── notion-oauth.js         # Notion OAuth implementation
│   │   ├── notion-service.js       # Notion API wrapper
│   │   ├── transcription-service.js # Web Speech API wrapper
│   │   └── storage.js              # Chrome storage wrappers
│   ├── utils/
│   │   └── helpers.js         # Utility functions
│   └── fonts/                 # Open Sans & Poppins (local)
└── worker/                    # Cloudflare Worker for OAuth token exchange
    ├── src/index.js
    └── wrangler.toml
```

### Building from Source

**Prerequisites:**
- Node.js and npm installed
- Chrome browser

**Steps:**
1. Clone the repository: `git clone https://github.com/DavinciDreams/duly-noted.git`
2. Navigate to the directory: `cd duly-noted`
3. Install dependencies: `npm install`
4. Load the extension in Chrome (see Installation for Development above)

### Packaging

**For Chrome Web Store:**
```
npm run package
```
Creates `duly-noted-v{version}.zip` for Chrome Web Store submission.

**For friends/beta testers:**
```
npm run package -- --friends
```
Creates `duly-noted-v{version}-friends.zip` with a public key injected into the manifest. This ensures every unpacked install gets the same extension ID, so the shared OAuth apps work without any per-user setup.

### Debugging

**Service Worker Console:**
- Go to `chrome://extensions/`
- Click "service worker" link under Duly Noted
- Console shows background logs

**Side Panel Console:**
- Right-click inside the side panel
- Select "Inspect"
- Console shows UI logs

## Privacy & Security

- **Local Storage:** All voice notes are stored locally in Chrome's storage
- **No Cloud Recording:** Audio is processed in-browser only (Web Speech API)
- **OAuth Tokens:** Stored securely in `chrome.storage.local`
- **No Analytics:** We don't track your usage
- **Token Exchange:** OAuth token exchange handled via a secure Cloudflare Worker - client secrets never touch the browser

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Follow existing code style
2. Test all changes thoroughly
3. Update documentation if needed

## License

MIT License - see [LICENSE](LICENSE) file for details

## Acknowledgments

- Built with [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- GitHub API via [GitHub REST API](https://docs.github.com/en/rest)
- Notion API via [Notion API](https://developers.notion.com/)
- OAuth token exchange via [Cloudflare Workers](https://workers.cloudflare.com/)

## Support

- **Issues:** [GitHub Issues](https://github.com/DavinciDreams/duly-noted/issues)
- **Discussions:** [GitHub Discussions](https://github.com/DavinciDreams/duly-noted/discussions)

---

**Version:** 1.1.0 | **Updated:** 2026-02-17

Made with Claude Code
