# Duly Noted 🎤

**Capture voice notes with real-time transcription. Never lose a great idea again.**

A Chrome extension that lets you quickly capture voice notes using Web Speech API for real-time transcription. Save as drafts or send to GitHub Issues, GitHub Projects, OneNote, or Notion.

## 🚀 Quick Start (Development)

### 1. Load the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select the `voice starter` directory (this folder)
5. The extension should now appear in your extensions list

### 2. Pin the Extension

1. Click the puzzle piece icon in Chrome's toolbar
2. Find "Voice Starter" and click the pin icon
3. The extension icon will now appear in your toolbar

### 3. Open the Side Panel

**Method 1:** Click the Voice Starter icon in your toolbar

**Method 2:** Use keyboard shortcut `Alt+Shift+V`

### 4. Test Basic Functionality

1. Click "Start Recording" button
2. Grant microphone permission when prompted
3. Speak a test note (e.g., "This is a test note")
4. Click "Stop Recording"
5. Choose "Save as Draft" destination
6. Verify the draft appears in "Recent Notes"

## 📋 Current Status (Phase 1 Complete)

### ✅ Working Features

- ✅ Extension loads in Chrome
- ✅ Side panel opens and displays UI
- ✅ Screen routing (Recording, Destination Chooser, History, Settings)
- ✅ Microphone permission request
- ✅ Basic recording start/stop
- ✅ Draft storage in chrome.storage.local
- ✅ Recent notes display
- ✅ Settings persistence

### ⏳ Coming Soon

- **Phase 2 (Week 2):** Real-time transcription with Web Speech API
- **Phase 3 (Week 3):** Draft editing and promotion
- **Phase 4 (Week 4):** GitHub Issues integration
- **Phase 5 (Week 5):** GitHub Projects integration
- **Phase 6 (Week 6):** OneNote integration

## 🐛 Known Issues

1. **No Icons:** Extension uses Chrome's default icon (placeholder)
   - Solution: Add icon files to `icons/` directory (see `icons/README.md`)

2. **Transcription Not Working:** Currently shows "Test transcription text" placeholder
   - Solution: Will be implemented in Phase 2 with Web Speech API

3. **Recording Timer Doesn't Show Duration:** Timer UI visible but recording doesn't save audio yet
   - Solution: Full MediaRecorder integration coming in Phase 2

## 🛠️ Development

### Project Structure

```
voice starter/
├── manifest.json              # Extension configuration
├── icons/                     # Extension icons (TODO: add images)
├── src/
│   ├── service-worker/
│   │   └── service-worker.js  # Background service worker
│   ├── offscreen/
│   │   ├── offscreen.html     # Hidden page for MediaRecorder
│   │   └── offscreen.js       # Audio recording logic
│   ├── sidepanel/
│   │   ├── sidepanel.html     # Main UI
│   │   ├── sidepanel.css      # Styles
│   │   └── sidepanel.js       # UI controller
│   ├── lib/
│   │   └── storage.js         # Chrome storage wrappers
│   └── utils/
│       └── helpers.js         # Utility functions
└── README.md                  # This file
```

### Debugging

**View Service Worker Console:**
1. Go to `chrome://extensions/`
2. Find "Voice Starter"
3. Click "service worker" link under "Inspect views"

**View Side Panel Console:**
1. Right-click inside the side panel
2. Select "Inspect"
3. Console tab shows side panel logs

**View Offscreen Document Console:**
1. Go to `chrome://extensions/`
2. Click "service worker" link
3. In DevTools, go to Sources tab → File system → offscreen.html
4. Set breakpoints or check console

### Storage Inspection

View stored data:
```javascript
// In any extension context (service worker, side panel, etc.)
chrome.storage.local.get(null, (data) => console.log(data));
```

Clear all storage:
```javascript
chrome.storage.local.clear();
```

## 📝 Testing Checklist

### Basic Functionality

- [ ] Extension loads without errors
- [ ] Side panel opens when clicking icon
- [ ] Side panel opens with `Alt+Shift+V`
- [ ] All screens accessible (Recording, History, Settings)
- [ ] "Recent Notes" section visible
- [ ] "View All History" button works

### Recording Flow (Placeholder)

- [ ] Click "Start Recording" button
- [ ] Microphone permission prompt appears
- [ ] After granting permission, button changes to "Stop Recording"
- [ ] Timer appears (00:00)
- [ ] Transcription container appears
- [ ] Click "Stop Recording"
- [ ] Destination chooser screen appears
- [ ] Transcription preview shows text

### Draft Storage

- [ ] Click "Save as Draft" destination
- [ ] Toast notification appears: "Draft saved!"
- [ ] Returns to recording screen
- [ ] Draft appears in "Recent Notes" section
- [ ] Click on draft in recent notes
- [ ] History screen opens
- [ ] Draft appears with 💾 icon

### Settings

- [ ] Click settings icon (⚙️)
- [ ] Settings screen opens
- [ ] GitHub token field visible
- [ ] Max duration field shows 300
- [ ] Click "Save Settings"
- [ ] Toast notification: "Settings saved!"
- [ ] Click "Reset to Defaults"
- [ ] Confirmation dialog appears
- [ ] After reset, fields return to defaults

## 🔍 Troubleshooting

### Extension Won't Load

**Error:** "Manifest file is missing or unreadable"
- **Solution:** Ensure you're selecting the `voice starter` folder, not a parent folder
- **Check:** `manifest.json` should be in the root of the selected folder

### Service Worker Errors

**Error:** "Uncaught (in promise) Error: Could not establish connection"
- **Solution:** Reload the extension from `chrome://extensions/`
- **Check:** Service worker status (should show "active")

### Microphone Permission Denied

**Error:** Recording doesn't start
- **Solution:** Grant microphone permission when prompted
- **Check:** Chrome settings → Privacy → Site Settings → Microphone

### Side Panel Blank

**Error:** Side panel opens but shows blank page
- **Solution:** Check console for JavaScript errors
- **Check:** Right-click inside panel → Inspect → Console tab

### Storage Not Persisting

**Error:** Drafts disappear after reload
- **Solution:** Check browser's storage quota
- **Check:** `chrome://settings/content/all` → Storage

## 📚 Documentation

- [PRD.md](PRD.md) - Full product requirements
- [PRD-CHANGELOG.md](PRD-CHANGELOG.md) - Recent changes and rationale
- [WORKFLOW-DIAGRAM.md](WORKFLOW-DIAGRAM.md) - User flow diagrams

## 🤝 Contributing

This is currently in active development (Phase 1 complete, Phase 2 starting).

Key files to understand:
1. `manifest.json` - Extension config
2. `src/service-worker/service-worker.js` - Background logic
3. `src/sidepanel/sidepanel.js` - Main UI controller
4. `src/lib/storage.js` - Data persistence

## 📄 License

TBD

## 🆘 Need Help?

1. Check the console logs (service worker + side panel)
2. Review the PRD for expected behavior
3. Check the GitHub issues (coming soon)
4. Contact the development team

---

**Current Version:** 0.1.0 (Phase 1 - Foundation Complete)

**Last Updated:** 2026-02-13
