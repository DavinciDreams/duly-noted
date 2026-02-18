# Duly Noted - Project State Log

## Architecture Overview

Chrome Manifest V3 side panel extension. Captures voice notes via Web Speech API, transcribes in real-time, and sends to GitHub Issues, GitHub Projects, Notion, or saves as local drafts. Now includes **Page Context** features: screenshot capture, element selection, and console log interception that attach to GitHub Issues/Notion pages.

### Message Flow (Page Context)
```
Side Panel → chrome.tabs.captureVisibleTab() → Screenshot stored in memory
Side Panel → chrome.tabs.sendMessage() → Content Script (element selection / console logs)
Content Script → chrome.runtime.sendMessage() → Service Worker → Side Panel
Side Panel → GitHubService.uploadImage() → repo Contents API → raw.githubusercontent.com URL
Side Panel → NotionService.uploadImage() → Notion File Upload API → file_upload image block
Side Panel → Service Worker → Offscreen Doc → navigator.clipboard.write (screenshot to clipboard)
```

## File Inventory

### Core Files
- `manifest.json` - Chrome MV3 manifest, v1.2.0, permissions: tabs, activeTab, scripting, clipboardWrite
- `src/sidepanel/sidepanel.html` - Main side panel UI (6 screens, always-visible note box + Quick Capture toolbar)
- `src/sidepanel/sidepanel.css` - All styles (dark glassmorphic theme + attachment components)
- `src/sidepanel/sidepanel.js` - UI controller (recording, destinations, settings, history, page context capture)
- `src/permission/permission.html` - Microphone permission popup (inline styles)
- `src/permission/permission.js` - Permission request handler
- `src/service-worker/service-worker.js` - Background service worker (message forwarding, clipboard routing)
- `src/offscreen/offscreen.html` - Offscreen document for audio recording + clipboard write
- `src/offscreen/offscreen.js` - Offscreen handler (audio recording + COPY_IMAGE_TO_CLIPBOARD)
- `src/lib/storage.js` - Chrome storage abstraction
- `src/lib/transcription-service.js` - Web Speech API wrapper
- `src/lib/github-oauth.js` - GitHub OAuth flow
- `src/lib/github-service.js` - GitHub API client (+ uploadImage to repo)
- `src/lib/github-cache.js` - Recently used repos/projects cache
- `src/lib/notion-oauth.js` - Notion OAuth flow
- `src/lib/notion-service.js` - Notion API client (+ uploadImage via File Upload API, createImageBlock)
- `src/utils/helpers.js` - Utility functions (formatRelativeTime, getDestinationIcon, truncateText, generateUUID)

### Content Scripts (NEW - 2026-02-17)
- `src/content-scripts/namespace.js` - `window.DulyNoted = window.DulyNoted || {};`
- `src/content-scripts/element-inspector.js` - DOM inspection: getElementData, getXPath, getCssSelector, computedStyles
- `src/content-scripts/element-selector.js` - Hover highlight + click selection with overlay/tooltip/border
- `src/content-scripts/console-interceptor.js` - Console override, error/rejection capture, log categorization
- `src/content-scripts/main.js` - ContentScriptCoordinator: message handler for all content script operations

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
- Screenshot capture (captureVisibleTab → thumbnail preview → clipboard copy)
- Element selection (crosshair hover → click → element data badge)
- Console log interception (start monitoring → fetch logs → badge with counts)
- GitHub Issue attachments (screenshots uploaded to .github/screenshots/, element table, console code blocks)
- Notion attachments (screenshots via Notion File Upload API as image blocks, element info as code blocks)
- AI Summary system (Chrome Prompt API — description, suggested tags, source citation, console summary)
- AI auto-fill (populates note box when empty, shows in card when user has typed)
- AI tag suggestions (auto-populate GitHub Issue labels from real repo labels)
- Label autocomplete picker (fetches repo labels, colored pills, searchable dropdown, 24hr cache)
- Smart title auto-fill (AI title → element name + hostname → transcription first line → date fallback)
- Notion console log blocks (AI-summarized + raw log entries)

### Known Issues
- Element selector overlay uses position:absolute — breaks on pages with CSS transform on body
- Stack trace in console interceptor points to interceptor, not actual caller
- Tab closure during element selection leaves cursor:crosshair permanently
- Notion image content type hardcoded to image/png
- XPath breaks if element.id contains double quotes
- CSS selector breaks on Tailwind-style special characters in class names
- Dropdown keyboard navigation not implemented (arrow keys, Enter/Space)

### Recent Changes

#### 2026-02-17 - Label Autocomplete + AI Auto-Tagging from Repo Labels

**Goal**: Fetch real GitHub repo labels when a repository is selected, show them in an autocomplete dropdown with colored pills, and make Gemini Nano suggest tags from the user's actual repo labels instead of a hardcoded generic list.

**Files Modified (4):**

1. `src/lib/github-cache.js`
   - Added `cacheLabels(repoFullName, labels)` — per-repo label caching with 24hr TTL
   - Added `getLabels(repoFullName)` — returns cached labels or null
   - Updated `clearAll()` — dynamically finds and removes all `githubLabels_*` keys

2. `src/sidepanel/sidepanel.html`
   - Replaced plain `#issueLabels` text input with label picker: `#selectedLabelsContainer` (pills) + `#labelSearchInput` (autocomplete) + `#labelDropdown` (dropdown list)

3. `src/sidepanel/sidepanel.css`
   - Added `.label-picker`, `.selected-labels`, `.label-pill` (with color dot, name, X remove)
   - Added `.label-item` (dropdown item with color swatch + name + description)
   - Added `.label-empty`, `.label-add-custom` (custom label option)

4. `src/sidepanel/sidepanel.js`
   - Added state: `repoLabels`, `selectedLabels`
   - Added element refs: `labelSearchInput`, `labelDropdown`, `selectedLabelsContainer`
   - Added `fetchRepoLabels(owner, repo)` — fetches/caches labels, matches AI tags against real labels
   - Added `showLabelDropdown()`, `hideLabelDropdown()`, `handleLabelSearch()`, `renderLabelDropdown()`
   - Added `addSelectedLabel(name, color)` — creates colored pill with remove button
   - Added label search event listeners (input, focus, blur, Enter key for custom labels)
   - Updated `handleRepoSelected()` — calls `fetchRepoLabels()` after repo selection
   - Updated `handleCreateIssue()` — uses `selectedLabels` array instead of parsing comma text
   - Updated `resetIssueForm()` — clears label state, pills, and dropdown
   - Updated `showGitHubIssueForm()` — pre-fills AI tags as pills via `addSelectedLabel()`
   - Updated `generateAISummary()` — prompt uses `repoLabels` names when available, falls back to hardcoded list

**Status:** Code complete, needs manual verification.

---

#### 2026-02-17 - AI Summary System

**Goal**: Replace limited AI title-only generation with comprehensive AI Summary that analyzes all captures, generates descriptions, suggests tags, cites sources, and summarizes console logs.

**Files Modified (4):**

1. `src/lib/storage.js`
   - Added `aiSummaryEnabled: true` to `DEFAULT_SETTINGS`

2. `src/sidepanel/sidepanel.html`
   - Added `#aiSummaryCard` div (glass card with header, content, tags areas) after `#attachmentsPreview`
   - Added AI Summary settings toggle (checkbox) before Recording section

3. `src/sidepanel/sidepanel.css`
   - Added `.ai-summary-card`, `.ai-summary-header`, `.ai-summary-label`, `.ai-summary-content`
   - Added `.ai-summary-tags`, `.ai-tag` (pill-shaped tag badges)
   - Added `.ai-summary-source` (citation link style)
   - Added `.ai-loading` with `.spinner` animation + `@keyframes spin`

4. `src/sidepanel/sidepanel.js`
   - Added state: `aiSummary`, `aiSummaryDebounceTimer`
   - Added element refs: `aiSummaryToggle`, `aiSummaryCard`, `aiSummaryContent`, `aiSummaryTags`
   - Replaced `tryAIDescription()` with `generateAISummary()` — sends all context (screenshot, element, console, transcription, URL) to Gemini Nano, returns structured JSON
   - Added `triggerAISummary()` — 800ms debounce wrapper
   - Added `renderAISummaryUI()` — renders loading/done/error states in AI Summary card
   - Added `applyAISummaryAutoFill()` — fills note box if empty, otherwise shows in card only
   - Added `escapeHtml()` — XSS prevention for AI output
   - Added dismiss button handler
   - Updated capture handlers: screenshot, element, console all call `triggerAISummary()`
   - Updated `loadSettings()` and `handleSaveSettings()` for `aiSummaryEnabled` toggle
   - Updated `showGitHubIssueForm()` — AI title + AI suggested tags pre-fill labels
   - Updated `handleCreateIssue()` — appends source citation to body
   - Updated `showGitHubProjectForm()` — AI title pre-fill
   - Updated `sendToNotion()` — AI title fallback, console log blocks added
   - Updated `resetRecordingUI()` — clears AI state and debounce timer

**Status:** Code complete, needs manual verification.

---

#### 2026-02-17 - Home Screen Reorganization

**Goal**: Make all capture tools (voice, screenshot, element, console) accessible from home screen without recording first. Allow typed notes. Move history to its own screen.

**Files Modified (3):**

1. `src/sidepanel/sidepanel.html`
   - Added `.header-actions` wrapper with history (clock) icon button + settings gear
   - Replaced transcription container with always-visible, always-editable `#noteBox`
   - Renamed "Page Context" to "Quick Capture", removed `display:none`
   - Added always-visible `#sendBtn` + `#discardBtn` (disabled until content exists)
   - Removed: `.recent-notes` section, `#viewAllHistoryBtn`, `#editTranscriptionBtn`, `#postRecordingActions`

2. `src/sidepanel/sidepanel.css`
   - Added: `.header-actions`, `.note-container`, `.note-box` (with `:empty::before` placeholder), `.action-buttons`
   - Added: `#recordingScreen` flex column layout
   - Removed: `.recent-notes`, `.post-recording-actions`, `.transcription-container` styles
   - Modified: `.page-tools-bar` width and margin

3. `src/sidepanel/sidepanel.js`
   - Added: `historyBtn`, `noteBox`, `sendBtn`, `discardBtn` references
   - Added: `updateActionButtons()` — enables send/discard when note text OR attachments exist
   - Added: `noteBox` input listener to sync `currentTranscription` and update buttons
   - Removed: `loadRecentNotes()`, `viewAllHistoryBtn`, `editTranscriptionBtn`, `postRecordingActions`, `transcriptionContainer`, `pageToolsBar` references
   - Modified: `stopRecording()` writes to `noteBox` instead of transcriptionText, calls `updateActionButtons()`
   - Modified: `resetRecordingUI()` clears noteBox, calls `updateActionButtons()`

**Status:** Code complete, needs manual verification.

---

#### 2026-02-17 - Page Context Features (Screenshot, Element Selection, Console Logs)

**Files Created (5):**
- `src/content-scripts/namespace.js` - DulyNoted namespace initialization
- `src/content-scripts/element-inspector.js` - DOM element inspection class
- `src/content-scripts/element-selector.js` - Hover/click element selection with overlay UI
- `src/content-scripts/console-interceptor.js` - Console method override + error capture
- `src/content-scripts/main.js` - ContentScriptCoordinator message handler

**Files Modified (7):**

1. `manifest.json`
   - Added permissions: `tabs`, `activeTab`, `scripting`, `clipboardWrite`
   - Added `<all_urls>` to host_permissions
   - Added `content_scripts` section loading all 5 files at `document_end`

2. `src/service-worker/service-worker.js`
   - Added message forwarding: ELEMENT_SELECTED, ELEMENT_SELECTION_CANCELLED, NEW_CONSOLE_LOG, CONTENT_SCRIPT_INITIALIZED
   - Added COPY_IMAGE_TO_CLIPBOARD handler → ensureOffscreenDocument → forward to offscreen
   - Changed offscreen reasons from `['USER_MEDIA']` to `['USER_MEDIA', 'CLIPBOARD']`

3. `src/offscreen/offscreen.js`
   - Added COPY_IMAGE_TO_CLIPBOARD case → handleCopyImageToClipboard()
   - Uses navigator.clipboard.write with ClipboardItem

4. `src/lib/github-service.js`
   - Added `uploadImage(owner, repo, imageDataUrl, filename)` static method
   - PUTs base64 content to `/repos/:owner/:repo/contents/.github/screenshots/{filename}`
   - Returns `raw.githubusercontent.com` URL

5. `src/lib/notion-service.js`
   - Added `uploadImage(imageDataUrl, filename)` → Notion File Upload API (POST create → POST send binary)
   - Added `createImageBlock(fileUploadId)` → returns Notion image block object

6. `src/sidepanel/sidepanel.html`
   - Added Page Context toolbar (#pageToolsBar) with Screenshot, Element, Console buttons
   - Added #attachmentsPreview area
   - Added #issueAttachments section in GitHub Issue form

7. `src/sidepanel/sidepanel.css`
   - Added styles: .page-tools-bar, .page-tools-actions, .attachments-preview, .attachment-item, .attachment-badge, .attachments-readonly

8. `src/sidepanel/sidepanel.js` (largest change)
   - New state: capturedScreenshots[], capturedElement, capturedConsoleLogs[], consoleMonitoringTabId
   - New functions: handleCaptureScreenshot, handleSelectElement, handleCaptureConsole, ensureContentScriptInjected, copyScreenshotToClipboard, tryAIDescription, generateSmartTitle, uploadScreenshotsToRepo, buildAttachmentMarkdown, updateAttachmentsPreview, renderAttachmentsInto
   - Modified: resetRecordingUI (clears attachments), post-recording flow (shows pageToolsBar), showGitHubIssueForm (pre-fills title, shows attachments), handleCreateIssue (uploads screenshots, builds enriched body), sendToNotion (uploads via Notion API, adds image/code blocks)
   - Added chrome.runtime.onMessage listener for ELEMENT_SELECTED and ELEMENT_SELECTION_CANCELLED

**QA Bugs Found & Fixed:**
- CRIT-1: COPY_IMAGE_TO_CLIPBOARD was not routed from service worker to offscreen document → Added handler
- IMP-2: Screenshots stored full dataUrl in chrome.storage.local (quota risk) → Changed to metadata only
- IMP-4: GET_CONSOLE_LOGS missing chrome.runtime.lastError check → Added error handling
- IMP-6: Backticks in element outerHTML break markdown code fences → Replaced with single quotes

**Status:** Code complete, not yet tested in Chrome. Needs manual verification per plan step 12.

---

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
