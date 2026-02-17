# Duly Noted - Project State Log

## Architecture Overview

Chrome Manifest V3 side panel extension. Captures voice notes via Web Speech API, transcribes in real-time, and sends to GitHub Issues, GitHub Projects, Notion, or saves as local drafts.

## File Inventory

### Core Files
- `manifest.json` - Chrome MV3 manifest, v1.1.0
- `src/sidepanel/sidepanel.html` - Main side panel UI (6 screens)
- `src/sidepanel/sidepanel.css` - All styles (dark glassmorphic theme)
- `src/sidepanel/sidepanel.js` - UI controller (recording, destinations, settings, history)
- `src/permission/permission.html` - Microphone permission popup (inline styles)
- `src/permission/permission.js` - Permission request handler
- `src/service-worker/service-worker.js` - Background service worker
- `src/lib/storage.js` - Chrome storage abstraction
- `src/lib/transcription-service.js` - Web Speech API wrapper
- `src/lib/github-oauth.js` - GitHub OAuth flow
- `src/lib/github-service.js` - GitHub API client
- `src/lib/github-cache.js` - Recently used repos/projects cache
- `src/lib/notion-oauth.js` - Notion OAuth flow
- `src/lib/notion-service.js` - Notion API client
- `src/utils/helpers.js` - Utility functions (formatRelativeTime, getDestinationIcon, truncateText, generateUUID)

## Current Status

### Working Features
- Recording & transcription via Web Speech API
- GitHub Issue creation with repo picker
- GitHub Project draft issue creation
- Notion page/database entry creation
- Draft saving to local storage
- History list with detail modal
- Settings (GitHub OAuth, Notion OAuth, developer mode token, max duration)
- Toast notification system

### Recent Changes

#### 2026-02-16 - Dark Glassmorphic Redesign

**Files Changed:**

1. `src/sidepanel/sidepanel.css` - **Complete rewrite**
   - Dark-first theme: `--bg-primary: #0a0e14`, glass variables (`--glass-bg`, `--glass-border`, `--glass-blur`)
   - Light theme override via `@media (prefers-color-scheme: light)`
   - Glassmorphic components: glass cards, destination buttons, settings sections, modals, toasts, dropdowns
   - New animations: `record-pulse-ring`, `waveform-bar` (staggered 15 bars), spring-eased toasts, `modalScaleIn`, `shimmer` loading
   - Brand gradient: `linear-gradient(135deg, #0097b2, #7ed952)` on header and primary CTAs
   - Accessibility: `focus-visible` with outline + box-shadow, `prefers-reduced-motion: reduce`, `--text-secondary: #a8b5c8` (4.5:1+ contrast)
   - CSS variable `--input-bg` replaces all hardcoded `rgba(10, 14, 20, 0.6)`
   - Modal responsive: `max-width: min(500px, 90vw)`

2. `src/sidepanel/sidepanel.html` - **Structural additions**
   - Added `<div class="glass-card recording-card">` wrapper around recording area
   - Added 15-bar waveform visualization (`aria-hidden="true"`)
   - Added `record-btn-glow` class to record button
   - Added `glass-card` class to transcriptionContainer
   - Changed recording timer `aria-live="off"` to `aria-live="polite"`
   - All element IDs preserved

3. `src/sidepanel/sidepanel.js` - **Minimal changes**
   - `is-recording` class toggle on `.recording-card` (start/stop recording)
   - Toast exit animation: `classList.add('exiting')` before removal
   - ARIA updates: `aria-label` on record button, `aria-readonly` on transcription text, `aria-expanded` on dropdowns
   - Replaced hardcoded `#9ca3af` with `var(--text-secondary)`

4. `src/permission/permission.html` - **Inline style update**
   - Dark background: `radial-gradient(ellipse at top, rgba(0, 151, 178, 0.05), transparent 60%), #0a0e14`
   - Glassmorphic tip-box and denied-help sections
   - Brand-aligned button with hover transform

**Design Review Findings (addressed):**
- Color contrast: `--text-secondary` bumped from `#94a3b8` to `#a8b5c8`
- Focus styles: Added `outline: 2px solid var(--color-primary)` alongside box-shadow
- Reduced motion: Changed from `animation-duration: 0.01ms` to `animation: none !important`
- Header blur: Changed from hardcoded `blur(8px)` to `var(--glass-blur)`
- OAuth status: Changed from `rgba(20, 30, 45, 0.5)` to `var(--glass-bg)`
- Modal width: Changed from `max-width: 500px` to `min(500px, 90vw)`

**Remaining items from review (not addressed - lower priority):**
- Dropdown keyboard navigation (arrow keys, Enter/Space)
- Icon button touch targets (currently 36px, recommended 44px)
- Throttled timer announcements for screen readers
- `role="option"` and `aria-selected` on dropdown items

## Development Notes
- No build tools - vanilla HTML/CSS/JS
- ~60+ element IDs referenced by JS; all must be preserved during HTML changes
- Local fonts in `src/fonts/` directory
- OAuth flows use `chrome.identity.launchWebAuthFlow`
