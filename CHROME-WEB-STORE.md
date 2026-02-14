# Chrome Web Store Submission Guide

## 📦 Package Information

**File:** `c:\Users\lmwat\extension\duly-noted-v1.0.0-chrome-store.zip` (1.6MB)
**Version:** 1.0.0
**Manifest Version:** 3
**Extension Name:** Duly Noted

## 📝 Store Listing Information

### Basic Information

**Name:** Duly Noted

**Summary (132 characters max):**
Capture voice notes with real-time transcription. Send to GitHub Issues, Projects, or Notion. Never lose a great idea again.

**Description (full):**
```
Duly Noted is a powerful Chrome extension that transforms your voice into actionable notes with real-time transcription. Perfect for developers, product managers, and knowledge workers who want to capture ideas instantly.

✨ KEY FEATURES

🎙️ Voice Recording & Transcription
• Real-time speech-to-text using Web Speech API
• Editable transcripts - fix any errors before sending
• Visual feedback with live recording timer
• High accuracy transcription in multiple languages

🐙 GitHub Integration
• Create GitHub Issues directly from voice notes
• Add items to GitHub Projects with custom fields
• OAuth 2.0 authentication - secure, no tokens to manage
• Repository and project selection
• Clickable history - links open issues/projects in new tabs

📓 Notion Integration
• Send notes to Notion databases or create child pages
• OAuth 2.0 authentication with workspace connection
• Auto-formatting - first line becomes title
• Smart detection of accessible databases and pages
• Clickable history - links open Notion pages in new tabs

📜 History & Organization
• Recent notes preview in sidebar
• Full history view with filtering
• Click to open - direct links to GitHub/Notion
• Persistent storage - never lose your notes
• Metadata tracking - timestamps, destinations, and more

🔒 PRIVACY & SECURITY

• Audio deleted immediately after transcription
• All data stored locally on your device
• No analytics or tracking
• No cloud servers - direct API calls only
• Open source code on GitHub

🚀 GETTING STARTED

1. Install the extension
2. Click the icon or press Alt+Shift+V to open
3. Grant microphone permission
4. Start recording and speak your note
5. Choose where to send it (Draft, GitHub, or Notion)

For GitHub and Notion integrations:
• Click Settings → Sign in with GitHub/Notion
• Authorize via OAuth (one-time setup)
• Start sending notes instantly!

💡 PERFECT FOR

• Developers capturing bugs and feature ideas
• Product managers documenting requirements
• Researchers collecting thoughts and references
• Anyone who thinks faster than they type

🌐 WEBSITE & SUPPORT

• Website: https://dulynoted.xyz
• Documentation: https://dulynoted.xyz/#features
• Privacy Policy: https://dulynoted.xyz/privacy.html
• GitHub: https://github.com/DavinciDreams/duly-noted
• Report Issues: https://github.com/DavinciDreams/duly-noted/issues

Made with ❤️ and Claude Code
```

**Category:** Productivity

**Language:** English

### Store Assets Required

#### Icons (Already included in zip)
- ✅ 16x16: `icons/icon-16.png`
- ✅ 48x48: `icons/icon-48.png`
- ✅ 128x128: `icons/icon-128.png`

#### Screenshots (To be added to assets/)
You need to provide **at least 1** screenshot (max 5):

**Required Screenshots:**
1. **Main Recording Screen** (1280x800 or 640x400)
   - Show the recording interface with live transcription
   - Filename: `screenshot-recording.png`

**Recommended Additional Screenshots:**
2. **Destination Chooser** (1280x800 or 640x400)
   - Show GitHub/Notion destination buttons
   - Filename: `screenshot-destinations.png`

3. **GitHub Integration** (1280x800 or 640x400)
   - Show GitHub Issue creation form
   - Filename: `screenshot-github.png`

4. **Notion Integration** (1280x800 or 640x400)
   - Show Notion connection and sending
   - Filename: `screenshot-notion.png`

5. **History View** (1280x800 or 640x400)
   - Show recent notes with clickable links
   - Filename: `screenshot-history.png`

**Screenshot Guidelines:**
- Minimum size: 640x400
- Maximum size: 1280x800
- Format: PNG or JPEG
- File size: Under 1 MB each
- No borders or device frames
- No promotional text overlays

#### Promotional Images (Optional but Recommended)

**Small Promo Tile (440x280):**
- Eye-catching graphic representing the extension
- Include icon and tagline: "Voice to Text, Ideas to Action"

**Large Promo Tile (920x680):**
- Showcase key features with visuals
- Include GitHub and Notion logos with permission

**Marquee Promo Tile (1400x560):**
- Hero image for featured placements
- Professional design with feature highlights

### Privacy Information

**Privacy Policy URL:** https://dulynoted.xyz/privacy.html

**Privacy Practices Declaration:**

**Does this extension handle user data?** Yes

**What user data does this extension handle?**
- Voice recordings (deleted immediately after transcription)
- Transcribed text (stored locally)
- OAuth tokens for GitHub and Notion (stored locally)
- User preferences and settings (stored locally)

**Does this extension collect or transmit user data?** Yes (to third-party services only when user explicitly sends notes)

**Data transmitted to:**
- GitHub API (when user sends note to GitHub)
- Notion API (when user sends note to Notion)
- No other third-party services

**Is the user data being sold?** No

**Is the user data being used for purposes unrelated to the item's single purpose?** No

**Is the user data being transferred to third parties?** Only when user explicitly sends notes to GitHub/Notion

**Certified compliance with Privacy Policy:** Yes

### Permissions Justification

**Permissions requested:**
1. **storage** - Store voice notes, settings, and OAuth tokens locally
2. **sidePanel** - Display the extension UI in Chrome's side panel
3. **windows** - Manage side panel window state
4. **identity** - OAuth authentication flow for GitHub and Notion

**Host Permissions:**
1. **https://api.github.com/*** - GitHub API for creating issues and projects
2. **https://github.com/login/oauth/*** - GitHub OAuth authentication
3. **https://api.notion.com/*** - Notion API for creating pages
4. **https://openrouter.ai/*** - AI transcription service (future feature)
5. **https://graph.microsoft.com/*** - Microsoft Graph API (future OneNote integration)

**Why each permission is needed:**
- `storage`: Essential for saving notes, history, settings, and OAuth tokens
- `sidePanel`: Core UI functionality - extension lives in side panel
- `windows`: Required to properly show/hide side panel
- `identity`: Required for OAuth 2.0 authentication with GitHub and Notion
- `api.github.com`: Required to create GitHub Issues and Project items
- `api.notion.com`: Required to create Notion pages and database entries

### Distribution Settings

**Visibility:** Public (or Unlisted for beta testing)

**Regions:** All regions (worldwide)

**Mature Content:** No

## 🚀 Submission Checklist

### Before Submission
- [x] Manifest version updated to 1.0.0
- [x] All bugs fixed and tested
- [x] Console warnings removed
- [x] README updated
- [x] Privacy policy created and hosted
- [x] Zip file created (excludes .env, .git, docs)
- [ ] Screenshots created and added to assets/
- [ ] Privacy practices form filled out
- [ ] Store description finalized

### During Submission
- [ ] Upload zip file
- [ ] Fill in store listing information
- [ ] Upload screenshots (minimum 1, max 5)
- [ ] Upload promotional images (optional)
- [ ] Declare privacy practices
- [ ] Justify permissions
- [ ] Select category (Productivity)
- [ ] Set visibility (Public or Unlisted)
- [ ] Submit for review

### After Submission
- [ ] Wait for review (typically 1-3 days)
- [ ] Address any review feedback
- [ ] Announce launch on social media / GitHub
- [ ] Monitor user feedback and reviews

## 📊 Post-Launch

### Update Process
1. Make changes to code
2. Update `manifest.json` version (e.g., 1.0.1)
3. Test thoroughly
4. Create new zip file
5. Upload to Chrome Web Store Developer Dashboard
6. Submit for review (1-3 days typically)
7. Users receive automatic updates

### Version Numbering
- **Major (1.x.x)**: Breaking changes or major new features
- **Minor (x.1.x)**: New features, backwards compatible
- **Patch (x.x.1)**: Bug fixes, small improvements

### Monitoring
- Check Chrome Web Store reviews regularly
- Monitor GitHub issues for bug reports
- Track user feedback and feature requests
- Update privacy policy if data handling changes

## 🔗 Important Links

- **Developer Dashboard:** https://chrome.google.com/webstore/devconsole
- **Extension ID:** (Will be assigned after first upload)
- **Store Listing:** (Will be available after approval)
- **Privacy Policy:** https://dulynoted.xyz/privacy.html
- **Terms of Service:** https://dulynoted.xyz/terms.html
- **GitHub Repository:** https://github.com/DavinciDreams/duly-noted
- **Website:** https://dulynoted.xyz

## 📧 Support Email

Set up before launch:
- **General Support:** support@dulynoted.xyz
- **Privacy Inquiries:** privacy@dulynoted.xyz
- **Legal Inquiries:** legal@dulynoted.xyz

## 💡 Tips for Approval

1. **Justify Permissions:** Clearly explain why each permission is needed
2. **Privacy First:** Emphasize local storage and no tracking
3. **Professional Screenshots:** High quality, clean UI screenshots
4. **Clear Description:** Focus on benefits, not just features
5. **Responsive Support:** Be ready to address reviewer questions quickly
6. **Test Thoroughly:** Ensure no bugs or console errors
7. **Follow Guidelines:** Review [Chrome Web Store Program Policies](https://developer.chrome.com/docs/webstore/program-policies/)

## ⚠️ Common Rejection Reasons

- Missing or unclear privacy policy
- Excessive permissions without justification
- Poor quality screenshots
- Misleading description or screenshots
- Bugs or crashes during review
- Security vulnerabilities
- Violation of program policies

---

**Ready to Submit!** 🎉

Once screenshots are ready, the extension is ready for Chrome Web Store submission.
