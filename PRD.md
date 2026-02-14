# Product Requirements Document (PRD)
## Voice Note Capture & Task Dispatcher Chrome Extension

**Project Name:** Voice Starter
**Version:** 1.0
**Date:** February 13, 2026
**Document Owner:** Extension Development Team

---

## 1. Executive Summary

### 1.1 Vision
A Chrome extension that enables users to quickly capture voice notes with real-time transcription and seamlessly dispatch them as tasks to GitHub Issues, Notion, or Affine. The extension includes an integrated LLM chat interface to refine and clarify ideas before creating tasks.

### 1.2 Problem Statement
Good ideas are fleeting. Developers and knowledge workers lose valuable thoughts because:
- Context switching to open note-taking apps breaks flow
- Manual transcription is slow and error-prone
- Converting rough ideas into actionable tasks requires friction
- No quick way to capture, refine, and dispatch thoughts in one workflow
- **Half-baked ideas have no home** - GitHub Issues trigger CI/CD, but ideas aren't always ready for that
- **Ideas span multiple projects** - Not all thoughts belong to a single repository
- **Too many steps** - Need to record first, decide destination later

### 1.3 Solution
A persistent side panel Chrome extension that:
1. **Record first, decide later** - Capture voice with streaming transcription, then choose destination
2. **Flexible destinations** - Send to GitHub Issues, GitHub Projects, Notion, Affine, or OneNote
3. **Smart GitHub integration** - Choose between:
   - **GitHub Issues** (production repos with CI/CD)
   - **GitHub Projects** (idea backlog, no CI/CD trigger)
   - **Draft mode** (save locally for later processing)
4. **LLM-powered refinement** - Chat to clarify ideas before dispatching
5. **Unified history** - Track all notes regardless of destination

---

## 2. User Stories

### 2.1 Primary User Stories

**US-01: Quick Voice Capture with Streaming Transcription**
```
As a developer,
I want to record voice notes FIRST and decide where to send them AFTER,
So that I can quickly capture fleeting ideas without breaking my flow.

Acceptance Criteria:
- Open extension → Click "Record" → Start talking (2 clicks max)
- See transcription appear word-by-word as I speak
- Stop recording when done
- THEN choose destination (GitHub Issue/Project, Notion, Affine, OneNote, or Draft)
- Support for continuous recording (up to 5 minutes)
- Clear visual indicator when recording is active
- Ability to pause/resume recording
- No pre-configuration required to start recording
```

**US-02: Flexible GitHub Integration**
```
As a developer,
I want to send my transcribed note to GitHub Issues OR GitHub Projects,
So that I can choose between production-ready issues and idea backlog.

Acceptance Criteria:
- After recording, choose destination: "GitHub Issue" or "GitHub Project"
- For GitHub Issues:
  - Select target repository from configured list
  - Preview generated issue title and body
  - Optionally add labels/assignees before creating
  - Issue triggers CI/CD in repos with automation
- For GitHub Projects:
  - Select target project board from configured list
  - Add to specific column (e.g., "Ideas", "Backlog")
  - Does NOT trigger CI/CD
  - Perfect for half-baked ideas
- Receive confirmation with direct link to created issue/project card
- Both types stored in history with clickable links
```

**US-03: Dispatch to Note-Taking Apps**
```
As a knowledge worker,
I want to send notes to Notion, Affine, or OneNote,
So that my ideas are captured in my personal knowledge base without triggering automation.

Acceptance Criteria:
- Choose between Notion, Affine, or OneNote as destination
- For Notion:
  - Select target database from configured list
  - Preview note before sending
  - Uses existing Notion API integration
- For Affine:
  - Select target workspace/page
  - Preview note before sending
- For OneNote:
  - Leverage web clipper API (same as existing web clipper)
  - Select notebook and section
  - Quick send without preview (speed priority)
- Receive confirmation with link to created note
- Note stored in history with clickable link
- Perfect for cross-project ideas with no specific repo home
```

**US-04: Save Drafts Locally (Ideas with No Home)**
```
As a developer,
I want to save voice notes as local drafts when I don't know where they belong yet,
So that I can capture ideas without forcing them into a specific project or system.

Acceptance Criteria:
- After recording, "Save as Draft" option available
- Drafts stored locally in extension storage
- Drafts appear in history with "Draft" badge
- Can later "promote" draft to GitHub Issue/Project/Notion/etc.
- Can edit draft transcription before promoting
- Perfect for cross-project ideas or half-baked thoughts
- No external API calls (instant save)
```

**US-05: View Note History (All Destinations)**
```
As a user,
I want to see all my previously captured notes (sent and draft),
So that I can track what I've captured and access the artifacts I created.

Acceptance Criteria:
- Display list of all notes with timestamps
- Show destination with icon:
  - 📝 Draft (local)
  - 🐙 GitHub Issue
  - 📋 GitHub Project
  - 📓 Notion
  - 📄 Affine
  - 📘 OneNote
- Click note to:
  - Open created artifact in new tab (for sent notes)
  - Edit and promote draft (for local drafts)
- Filter/search through history
- Filter by destination type
- Delete notes from history
```

**US-06: LLM Chat for Refinement**
```
As a user,
I want to chat with an LLM about my voice note,
So that I can clarify, expand, or refine my idea before dispatching.

Acceptance Criteria:
- Chat interface available after transcription completes
- Support for OpenRouter, ZAI, and Claude Code providers
- Conversation context includes the transcribed note
- LLM can suggest:
  - Better wording for GitHub issues
  - Which destination is most appropriate
  - Breakdown of complex ideas into multiple tasks
- Ability to edit transcription based on LLM suggestions
- Can chat BEFORE deciding destination
- Copy refined text back to note before dispatching
```

### 2.2 Secondary User Stories

**US-07: Multi-Provider LLM Support**
```
As a user,
I want to choose between different LLM providers,
So that I can use my preferred AI service.

Providers:
- OpenRouter (access to multiple models)
- ZAI
- Claude Code (local/remote)
```

**US-08: Configuration Management**
```
As a user,
I want to configure API keys and integration settings,
So that the extension can connect to my services.

Settings to configure:
- GitHub token and default repository
- Notion API key and database ID
- Affine workspace credentials
- LLM provider API keys
- Default transcription language
```

---

## 3. Core Features

### 3.1 Feature: Real-Time Voice Recording & Transcription

**Priority:** P0 (Critical)

**Description:**
Capture audio from the user's microphone and display streaming transcription as the user speaks.

**Technical Implementation:**
- Use `navigator.mediaDevices.getUserMedia()` for audio capture
- Implement `MediaRecorder` API in offscreen document (service worker can't access DOM APIs)
- Stream audio chunks to transcription service (Whisper API, Gemini Audio, or Web Speech API)
- Display transcription results in real-time using streaming response pattern

**Key Components:**
- **Service Worker:** Manages offscreen document lifecycle
- **Offscreen Document:** Handles MediaRecorder and audio capture
- **Side Panel:** Displays streaming transcription UI
- **Storage:** Persists recordings and transcriptions

**Reference Examples:**
- `ai.gemini-on-device-audio-scribe` - Streaming transcription pattern
- `sample.tabcapture-recorder` - Offscreen MediaRecorder pattern

**Success Metrics:**
- Transcription latency < 500ms per word
- Transcription accuracy > 90%
- Support for recordings up to 5 minutes
- Works in all Chrome contexts (active tabs, background)

---

### 3.2 Feature: GitHub Issues Integration

**Priority:** P0 (Critical)

**Description:**
Create GitHub Issues directly from transcribed notes with customizable templates. **Best for production repos with CI/CD automation.**

**Technical Implementation:**
- Use GitHub REST API v3 (`POST /repos/{owner}/{repo}/issues`)
- OAuth flow for authentication (or personal access token)
- Template system for issue formatting
- Support for labels, assignees, and milestones

**API Endpoint:**
```
POST https://api.github.com/repos/{owner}/{repo}/issues
Authorization: Bearer {token}

{
  "title": "Generated from voice note: [first 50 chars]",
  "body": "[Full transcription]\n\n---\n*Created via Voice Starter Extension*",
  "labels": ["voice-note", "triage"],
  "assignees": ["{username}"]
}
```

**Configuration Required:**
- GitHub personal access token with `repo` scope
- List of repositories (fetched from user's GitHub account)
- Optional: Default labels, assignees per repo
- **Warning indicator:** Flag repos with CI/CD (webhooks detected)

**Success Metrics:**
- Issue creation success rate > 99%
- Average creation time < 2 seconds
- Support for private and public repositories

---

### 3.3 Feature: GitHub Projects Integration

**Priority:** P0 (Critical - **SOLVES THE "NO HOME" PROBLEM**)

**Description:**
Add voice notes to GitHub Projects (v2) as draft items. **Perfect for half-baked ideas, cross-project thoughts, and avoiding CI/CD triggers.**

**Why This Matters:**
- Ideas don't always belong to a specific repo
- Some notes are too rough for production issue trackers
- GitHub Projects provide an "idea backlog" without triggering automation
- Can promote project items to issues later when ready

**Technical Implementation:**
- Use GitHub GraphQL API for Projects v2
- Create draft issue in project
- Add to specific column (e.g., "Ideas", "Backlog", "To Triage")
- No repository association required initially
- Can convert to repository issue later via GitHub UI

**API Endpoint (GraphQL):**
```graphql
mutation {
  addProjectV2DraftIssue(input: {
    projectId: "PROJECT_ID"
    title: "Voice note title"
    body: "Full transcription content"
    assigneeIds: []
  }) {
    projectItem {
      id
      content {
        ... on DraftIssue {
          title
          body
        }
      }
    }
  }
}
```

**Configuration Required:**
- GitHub personal access token with `project` scope
- List of accessible projects (fetched from user's GitHub account)
- Default project selection
- Default column mapping (e.g., new notes → "Ideas" column)

**User Workflow:**
1. Record voice note
2. Choose "GitHub Project"
3. Select project (e.g., "Personal Ideas")
4. Select column (e.g., "💡 Ideas")
5. Create draft issue (no repo required!)
6. Later in GitHub UI: Promote to repository issue when ready

**Success Metrics:**
- Draft creation success rate > 99%
- Average creation time < 2 seconds
- 40% of users prefer Projects over Issues for initial capture

**Key Advantages:**
- ✅ No CI/CD trigger
- ✅ No repo selection required
- ✅ Cross-project idea collection
- ✅ Flexible categorization (columns)
- ✅ Can add to multiple projects simultaneously

---

### 3.4 Feature: Notion Integration

**Priority:** P1 (High - **GOOD FOR CROSS-PROJECT IDEAS**)

**Description:**
Send notes to Notion databases with support for properties and rich text formatting. **Best for personal knowledge management and ideas that don't fit into specific projects.**

**Technical Implementation:**
- Use Notion API v1 (`POST /v1/pages`)
- OAuth 2.0 flow for workspace authorization
- Support for database selection via search API
- Rich text formatting for transcription content

**API Endpoint:**
```
POST https://api.notion.com/v1/pages
Authorization: Bearer {token}
Notion-Version: 2022-06-28

{
  "parent": { "database_id": "{database_id}" },
  "properties": {
    "Name": {
      "title": [{ "text": { "content": "[Title from voice note]" } }]
    },
    "Content": {
      "rich_text": [{ "text": { "content": "[Transcription]" } }]
    },
    "Created": {
      "date": { "start": "2026-02-13T19:00:00.000Z" }
    },
    "Source": {
      "select": { "name": "Voice Note" }
    }
  }
}
```

**Configuration Required:**
- Notion integration token
- Target database ID
- Property mapping (customizable)

**Success Metrics:**
- Note creation success rate > 99%
- Support for formatted text (bold, italic, code)
- Average creation time < 3 seconds

---

### 3.5 Feature: Affine Integration

**Priority:** P2 (Medium)

**Description:**
Send notes to Affine workspace with support for blocks and pages. **Open-source alternative to Notion for privacy-focused users.**

**Technical Implementation:**
- Use Affine API (check latest documentation)
- Authentication via API token or OAuth
- Support for workspace/page selection
- Block-based content structure

**Note:** Affine API specifics will need to be researched during implementation phase.

**Configuration Required:**
- Affine API token or OAuth credentials
- Target workspace ID
- Default page or collection

---

### 3.6 Feature: OneNote Integration

**Priority:** P1 (High - **FASTEST PATH TO MVP**)

**Description:**
Send notes to OneNote using the existing OneNote API. **Leverages the same web clipper API you already use, so minimal integration effort.**

**Why OneNote:**
- You already have web clipper integration → reuse the API pattern
- Microsoft Graph API is well-documented
- Free tier with generous limits
- Cross-platform sync (Windows, Mac, iOS, Android, Web)
- Perfect for quick capture without setup complexity

**Technical Implementation:**
- Use Microsoft Graph API (`POST /me/onenote/pages`)
- OAuth 2.0 flow with Microsoft account
- Simple HTML content submission
- Support for notebook and section selection

**API Endpoint:**
```
POST https://graph.microsoft.com/v1.0/me/onenote/sections/{section_id}/pages
Authorization: Bearer {access_token}
Content-Type: application/xhtml+xml

<!DOCTYPE html>
<html>
  <head>
    <title>Voice Note: [First line of transcription]</title>
  </head>
  <body>
    <p><strong>Recorded:</strong> 2026-02-13 19:30</p>
    <p>[Full transcription content]</p>
    <p><em>Created via Voice Starter Extension</em></p>
  </body>
</html>
```

**Configuration Required:**
- Microsoft account OAuth token
- List of notebooks and sections (fetched via Graph API)
- Default notebook/section selection
- **Minimal setup** - reuse existing web clipper auth

**Success Metrics:**
- Note creation success rate > 99%
- Average creation time < 2 seconds (faster than Notion)
- Leverage existing user authentication

**Key Advantages:**
- ✅ Reuses your existing OneNote web clipper pattern
- ✅ Fast integration (1-2 days vs 1-2 weeks for Notion)
- ✅ No custom database setup required
- ✅ Familiar for Windows users
- ✅ Free tier sufficient for most users

---

### 3.7 Feature: Local Draft Storage

**Priority:** P0 (Critical - **SOLVES "NO HOME" PROBLEM INSTANTLY**)

**Description:**
Save voice notes as local drafts when the user doesn't know where they belong yet. **Zero external dependencies, instant save.**

**Why This Matters:**
- Fastest possible workflow: Record → Save as Draft → Done (2 clicks)
- No API calls = instant save
- No network required
- Can promote to any destination later
- Perfect for "I'll figure out where this goes later" scenarios

**Technical Implementation:**
- Store drafts in `chrome.storage.local`
- Each draft has UUID, timestamp, transcription, optional LLM conversation
- Drafts appear in history with "💾 Draft" badge
- "Promote draft" action opens destination chooser

**Data Model:**
```typescript
interface Draft {
  id: string;                    // UUID
  timestamp: number;              // Unix timestamp
  transcription: string;          // Original transcribed text
  refinedText?: string;           // LLM-refined version
  conversation?: Message[];       // LLM chat history
  tags?: string[];                // User-added tags
}
```

**User Workflows:**
1. **Quick capture:** Record → "Save as Draft" → Done
2. **Later promotion:** History → Click draft → Choose destination → Send
3. **Batch processing:** Filter drafts → Bulk promote to GitHub Project

**Success Metrics:**
- 60% of users use drafts for initial capture
- Average time to save draft: < 100ms
- 70% of drafts eventually promoted to external system
- 30% remain as drafts (ephemeral notes)

**Key Advantages:**
- ✅ Zero latency (no network calls)
- ✅ Works offline
- ✅ No external service setup required
- ✅ Perfect for indecision
- ✅ Enables "capture everything" mindset

---

### 3.8 Feature: Multi-Provider LLM Chat

**Priority:** P0 (Critical)

**Description:**
Integrated chat interface for refining voice notes using multiple LLM providers.

**Technical Implementation:**
- Unified interface for OpenRouter, ZAI, and Claude Code
- Streaming response support for real-time feedback
- Context management (include transcription in system prompt)
- Conversation persistence in `chrome.storage.local`

**Provider Integration:**

**A. OpenRouter**
```
POST https://openrouter.ai/api/v1/chat/completions
Authorization: Bearer {api_key}

{
  "model": "anthropic/claude-3.5-sonnet",
  "messages": [
    {
      "role": "system",
      "content": "You are helping refine a voice note. Original transcription: [transcription]"
    },
    {
      "role": "user",
      "content": "Help me clarify this idea..."
    }
  ],
  "stream": true
}
```

**B. ZAI**
```
POST https://api.zai.ai/v1/chat
Authorization: Bearer {api_key}

{
  "messages": [...],
  "stream": true
}
```

**C. Claude Code**
```
Local API endpoint or message passing to Claude Code CLI
Details to be determined based on Claude Code integration patterns
```

**UI Components:**
- Chat message list with user/assistant bubbles
- Input field with send button
- Provider selector dropdown
- Model selector (per provider)
- "Apply suggestion" button to update transcription

**Success Metrics:**
- Response streaming latency < 100ms per token
- Support for conversations up to 20 messages
- Conversation context properly maintained

---

### 3.9 Feature: Unified Note History

**Priority:** P1 (High)

**Description:**
Persistent list of all captured notes (sent and drafts) with metadata and deep links to created artifacts.

**Data Model:**
```typescript
interface NoteHistoryItem {
  id: string;                    // UUID
  timestamp: number;              // Unix timestamp
  transcription: string;          // Original transcribed text
  refinedText?: string;           // LLM-refined version
  destination: 'draft' | 'github-issue' | 'github-project' | 'notion' | 'affine' | 'onenote';
  status: 'draft' | 'sent';       // Draft or sent to destination
  artifactUrl?: string;           // Link to created issue/note (if sent)
  artifactTitle?: string;         // Title of created artifact (if sent)
  metadata: {
    github?: {
      type: 'issue' | 'project';
      repo?: string;              // For issues
      issueNumber?: number;       // For issues
      projectName?: string;       // For projects
      columnName?: string;        // For projects
      labels?: string[];
    };
    notion?: {
      databaseId: string;
      pageId: string;
    };
    affine?: {
      workspaceId: string;
      pageId: string;
    };
    onenote?: {
      notebookName: string;
      sectionName: string;
      pageId: string;
    };
  };
}
```

**Storage:**
- Use `chrome.storage.local` for persistence
- Implement pagination (show 50 items per page)
- Total storage limit: ~5MB (Chrome storage quota)

**UI Features:**
- List view with cards showing:
  - Transcription preview (first 100 chars)
  - Destination icon:
    - 💾 Draft (local)
    - 🐙 GitHub Issue
    - 📋 GitHub Project
    - 📓 Notion
    - 📄 Affine
    - 📘 OneNote
  - Timestamp (relative: "2 hours ago")
  - Click to open artifact in new tab
- Search/filter by destination or date range
- Delete individual items
- Export all history as JSON

**Success Metrics:**
- History loads in < 200ms
- Support for up to 1000 notes
- Search results appear in < 100ms

---

## 4. User Interface Design

### 4.1 Side Panel Layout

**Primary Screen: Recording Interface**
```
┌─────────────────────────────────────┐
│  Voice Starter                  [⚙] │
├─────────────────────────────────────┤
│                                     │
│   ┌───────────────────────────┐   │
│   │   🎤  Ready to Record     │   │
│   │                           │   │
│   │   [  Start Recording  ]   │   │
│   └───────────────────────────┘   │
│                                     │
│   Recent Notes:                     │
│   ┌───────────────────────────┐   │
│   │ 📝 Fix login bug          │   │
│   │ → GitHub #123             │   │
│   │ 2 hours ago               │   │
│   └───────────────────────────┘   │
│   ┌───────────────────────────┐   │
│   │ 📝 Meeting notes          │   │
│   │ → Notion                  │   │
│   │ Yesterday                 │   │
│   └───────────────────────────┘   │
│                                     │
│   [View All History]                │
│                                     │
└─────────────────────────────────────┘
```

**Recording Active Screen**
```
┌─────────────────────────────────────┐
│  Voice Starter                  [⚙] │
├─────────────────────────────────────┤
│                                     │
│   🔴 Recording... 00:45             │
│   ────────────────────────────      │
│                                     │
│   Transcription:                    │
│   ┌───────────────────────────┐   │
│   │ I need to fix the login   │   │
│   │ bug where users can't     │   │
│   │ sign in with Google...█   │   │
│   │                           │   │
│   └───────────────────────────┘   │
│                                     │
│   [  Pause  ]  [  Stop & Send  ]   │
│                                     │
└─────────────────────────────────────┘
```

**Post-Recording: Choose Destination Screen**
```
┌─────────────────────────────────────┐
│  Voice Starter                  [⚙] │
├─────────────────────────────────────┤
│   ✓ Recording Complete              │
│                                     │
│   Transcription:                    │
│   ┌───────────────────────────┐   │
│   │ I need to fix the login   │   │
│   │ bug where users can't     │   │
│   │ sign in with Google auth  │   │
│   │                     [Edit]│   │
│   └───────────────────────────┘   │
│                                     │
│   💬 Chat to Refine (Optional)      │
│   [  Ask AI for Help  ]             │
│                                     │
│   📤 Where should this go?          │
│   ┌───────────────────────────┐   │
│   │ 🐙 GitHub Issue           │   │
│   │    (Triggers CI/CD)        │   │
│   ├───────────────────────────┤   │
│   │ 📋 GitHub Project         │   │
│   │    (Idea backlog)          │   │
│   ├───────────────────────────┤   │
│   │ 📓 Notion                 │   │
│   ├───────────────────────────┤   │
│   │ 📄 Affine                 │   │
│   ├───────────────────────────┤   │
│   │ 📘 OneNote                │   │
│   ├───────────────────────────┤   │
│   │ 💾 Save as Draft          │   │
│   │    (Decide later)          │   │
│   └───────────────────────────┘   │
│                                     │
│   [  Start New Recording  ]         │
│                                     │
└─────────────────────────────────────┘
```

**After Selecting GitHub Issue:**
```
┌─────────────────────────────────────┐
│  ← Back to Destinations             │
├─────────────────────────────────────┤
│   🐙 Send to GitHub Issue           │
│                                     │
│   Repository:                       │
│   [my-org/production-app ▼]        │
│                                     │
│   Labels (optional):                │
│   [bug, voice-note]  [+ Add]       │
│                                     │
│   Assignee (optional):              │
│   [@me ▼]                           │
│                                     │
│   Preview:                          │
│   ┌───────────────────────────┐   │
│   │ Title: Fix login bug with │   │
│   │ Google auth               │   │
│   │                           │   │
│   │ Body:                     │   │
│   │ I need to fix the login   │   │
│   │ bug where users can't...  │   │
│   │                           │   │
│   │ ---                       │   │
│   │ Via Voice Starter         │   │
│   └───────────────────────────┘   │
│                                     │
│   ⚠️  This repo has CI/CD enabled   │
│                                     │
│   [  Create Issue  ]  [  Cancel  ]  │
│                                     │
└─────────────────────────────────────┘
```

**After Selecting GitHub Project:**
```
┌─────────────────────────────────────┐
│  ← Back to Destinations             │
├─────────────────────────────────────┤
│   📋 Send to GitHub Project         │
│                                     │
│   Project:                          │
│   [Ideas & Research ▼]             │
│                                     │
│   Column:                           │
│   [💡 Ideas ▼]                      │
│                                     │
│   Preview:                          │
│   ┌───────────────────────────┐   │
│   │ Fix login bug with Google │   │
│   │ auth                      │   │
│   │                           │   │
│   │ I need to fix the login   │   │
│   │ bug where users can't...  │   │
│   └───────────────────────────┘   │
│                                     │
│   ✅ No CI/CD trigger               │
│   Perfect for half-baked ideas      │
│                                     │
│   [  Add to Project  ]  [  Cancel  ]│
│                                     │
└─────────────────────────────────────┘
```

**After Selecting "Save as Draft":**
```
┌─────────────────────────────────────┐
│  Voice Starter                  [⚙] │
├─────────────────────────────────────┤
│   ✓ Saved as Draft                  │
│                                     │
│   You can send this later from      │
│   the History view.                 │
│                                     │
│   [  View in History  ]             │
│   [  Start New Recording  ]         │
│                                     │
└─────────────────────────────────────┘
```

**Settings Screen**
```
┌─────────────────────────────────────┐
│  ← Settings                         │
├─────────────────────────────────────┤
│                                     │
│   🎤 Recording                      │
│   Language: [English ▼]             │
│   Max Duration: [5 min ▼]           │
│                                     │
│   🤖 LLM Provider                   │
│   Provider: [OpenRouter ▼]          │
│   Model: [claude-3.5-sonnet ▼]     │
│   API Key: [••••••••••] [Test]     │
│                                     │
│   📝 GitHub Integration             │
│   Token: [••••••••••] [Test]        │
│   Default Repo: [owner/repo]       │
│   Default Labels: [voice-note]     │
│                                     │
│   📓 Notion Integration             │
│   Token: [••••••••••] [Test]        │
│   Database: [Select... ▼]          │
│                                     │
│   📋 Affine Integration             │
│   Token: [••••••••••] [Test]        │
│   Workspace: [Select... ▼]         │
│                                     │
│   [  Save Settings  ]               │
│                                     │
└─────────────────────────────────────┘
```

### 4.2 Design System

**Colors:**
- Primary: `#2563eb` (Blue)
- Success: `#16a34a` (Green)
- Danger: `#dc2626` (Red)
- Recording Active: `#ef4444` (Bright Red)
- Background: `#ffffff` / `#1f2937` (Light/Dark mode)
- Text: `#111827` / `#f9fafb` (Light/Dark mode)

**Typography:**
- Font: System UI (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto`)
- Heading: 16px Bold
- Body: 14px Regular
- Caption: 12px Regular

**Spacing:**
- Base unit: 8px
- Padding: 16px
- Gap between elements: 12px

**Animations:**
- Recording pulse: 1.5s ease-in-out infinite
- Transcription typing: Smooth scroll to bottom
- Page transitions: 200ms ease-in-out

---

## 5. Technical Architecture

### 5.1 Component Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Chrome Extension                      │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────┐         ┌──────────────────────┐      │
│  │   Popup      │         │    Side Panel        │      │
│  │  (Action)    │────────▶│   (Main UI)          │      │
│  │              │  Opens  │                      │      │
│  └──────────────┘         │  - Recording Screen  │      │
│                           │  - Chat Interface    │      │
│                           │  - History View      │      │
│                           │  - Settings          │      │
│                           └──────────┬───────────┘      │
│                                      │                   │
│                                      │ chrome.runtime    │
│                                      │ .sendMessage()    │
│                                      │                   │
│  ┌───────────────────────────────────▼────────────────┐ │
│  │           Service Worker (Background)              │ │
│  │                                                     │ │
│  │  - Manage offscreen document lifecycle            │ │
│  │  - Handle API requests (GitHub/Notion/Affine)     │ │
│  │  - Orchestrate transcription flow                 │ │
│  │  - Store notes in chrome.storage                  │ │
│  │  - Manage LLM streaming responses                 │ │
│  └───────────┬────────────────────────┬───────────────┘ │
│              │                        │                  │
│              │ chrome.offscreen       │ chrome.storage   │
│              │ .createDocument()      │ .local / .session│
│              │                        │                  │
│  ┌───────────▼──────────┐   ┌─────────▼────────────┐   │
│  │ Offscreen Document   │   │  Chrome Storage       │   │
│  │                      │   │                       │   │
│  │ - MediaRecorder      │   │ - Settings            │   │
│  │ - Audio capture      │   │ - Note history        │   │
│  │ - Audio chunks       │   │ - API tokens          │   │
│  │   aggregation        │   │ - Conversations       │   │
│  └──────────────────────┘   └───────────────────────┘   │
│                                                           │
└─────────────────────────────────────────────────────────┘
                              │
                              │ HTTP Requests (fetch)
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   ┌────▼─────┐      ┌────────▼──────┐     ┌───────▼──────┐
   │ GitHub   │      │ Notion API    │     │ Affine API   │
   │ REST API │      │               │     │              │
   └──────────┘      └───────────────┘     └──────────────┘

   ┌────────────────────────────────────────────────────────┐
   │          LLM Provider APIs                             │
   │  ┌──────────────┐  ┌─────────┐  ┌─────────────────┐  │
   │  │ OpenRouter   │  │   ZAI   │  │  Claude Code    │  │
   │  └──────────────┘  └─────────┘  └─────────────────┘  │
   └────────────────────────────────────────────────────────┘

   ┌────────────────────────────────────────────────────────┐
   │     Transcription Service (Choose One)                 │
   │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
   │  │ OpenAI       │  │ Gemini Audio │  │ Web Speech  │ │
   │  │ Whisper API  │  │ (On-device)  │  │ API         │ │
   │  └──────────────┘  └──────────────┘  └─────────────┘ │
   └────────────────────────────────────────────────────────┘
```

### 5.2 Data Flow

**Recording Flow:**
```
User clicks "Record"
  → Side Panel sends message to Service Worker
  → Service Worker creates Offscreen Document
  → Offscreen Document requests microphone access
  → User grants permission
  → MediaRecorder starts capturing audio
  → Audio chunks collected every 1 second
  → Chunks sent to Service Worker via postMessage
  → Service Worker sends chunks to transcription API
  → Streaming transcription results returned
  → Service Worker stores in chrome.storage.session
  → Side Panel listens to storage changes
  → UI updates with new transcribed text in real-time
```

**Send to GitHub Flow:**
```
User clicks "Send to GitHub"
  → Side Panel sends message to Service Worker with:
      - Transcription text
      - Selected repository
      - Optional labels/assignees
  → Service Worker validates GitHub token
  → Service Worker makes POST request to GitHub API
  → GitHub API returns created issue data
  → Service Worker stores note in history (chrome.storage.local)
  → Service Worker returns success + issue URL to Side Panel
  → Side Panel shows confirmation toast
  → Side Panel updates history list
  → User can click to open issue in new tab
```

**LLM Chat Flow:**
```
User types message in chat
  → Side Panel sends message to Service Worker with:
      - User message
      - Conversation history
      - Selected provider
      - Context (transcription)
  → Service Worker makes streaming API request to LLM provider
  → For each chunk received:
      → Service Worker stores in chrome.storage.session
      → Side Panel listens to storage changes
      → UI appends chunk to assistant message
  → When stream completes:
      → Service Worker saves full conversation to chrome.storage.local
      → Side Panel enables input field
```

### 5.3 File Structure

```
voice-starter/
├── manifest.json                  # Extension manifest (Manifest V3)
├── icons/
│   ├── icon-16.png
│   ├── icon-48.png
│   └── icon-128.png
├── src/
│   ├── service-worker.js          # Background service worker
│   ├── offscreen/
│   │   ├── offscreen.html         # Offscreen document for recording
│   │   └── offscreen.js           # MediaRecorder implementation
│   ├── sidepanel/
│   │   ├── sidepanel.html         # Side panel UI
│   │   ├── sidepanel.js           # Side panel logic
│   │   └── sidepanel.css          # Side panel styles
│   ├── popup/
│   │   ├── popup.html             # Quick access popup (optional)
│   │   ├── popup.js
│   │   └── popup.css
│   ├── lib/
│   │   ├── storage.js             # Chrome storage wrappers
│   │   ├── github-api.js          # GitHub API client
│   │   ├── notion-api.js          # Notion API client
│   │   ├── affine-api.js          # Affine API client
│   │   ├── llm-providers.js       # LLM provider abstraction
│   │   └── transcription.js       # Transcription service abstraction
│   └── utils/
│       ├── message-passing.js     # Message passing helpers
│       ├── audio-utils.js         # Audio format conversion
│       └── ui-helpers.js          # Shared UI utilities
├── package.json                   # npm dependencies (if using bundler)
├── webpack.config.js              # Webpack config (if using bundler)
└── README.md                      # Developer documentation
```

### 5.4 Manifest Configuration

```json
{
  "manifest_version": 3,
  "name": "Voice Starter",
  "description": "Capture voice notes, transcribe with AI, and dispatch to GitHub, Notion, or Affine",
  "version": "1.0.0",
  "permissions": [
    "storage",
    "sidePanel",
    "offscreen"
  ],
  "host_permissions": [
    "https://api.github.com/*",
    "https://api.notion.com/*",
    "https://api.openrouter.ai/*",
    "https://api.openai.com/*"
  ],
  "background": {
    "service_worker": "src/service-worker.js"
  },
  "side_panel": {
    "default_path": "src/sidepanel/sidepanel.html"
  },
  "action": {
    "default_title": "Voice Starter",
    "default_popup": "src/popup/popup.html"
  },
  "icons": {
    "16": "icons/icon-16.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  }
}
```

---

## 6. API Integration Specifications

### 6.1 GitHub API

**Authentication:** Personal Access Token (PAT) or OAuth App

**Required Scopes:**
- `repo` (full control of private repositories)
- `public_repo` (access to public repositories only - if limiting to public)

**Endpoints:**

**Create Issue:**
```
POST https://api.github.com/repos/{owner}/{repo}/issues
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "string (max 256 chars)",
  "body": "string (markdown supported)",
  "labels": ["string"],
  "assignees": ["username"],
  "milestone": number
}

Response 201 Created:
{
  "id": 123456789,
  "number": 123,
  "html_url": "https://github.com/owner/repo/issues/123",
  "title": "...",
  "body": "...",
  "state": "open",
  "created_at": "2026-02-13T19:00:00Z"
}
```

**List User Repositories:**
```
GET https://api.github.com/user/repos?sort=updated&per_page=100
Authorization: Bearer {token}

Response 200 OK:
[
  {
    "id": 123,
    "name": "repo-name",
    "full_name": "owner/repo-name",
    "private": true
  }
]
```

**Error Handling:**
- 401: Invalid token → Show "Re-authenticate with GitHub"
- 403: Rate limit exceeded → Show "Try again in {X} minutes"
- 404: Repository not found → Show "Repository not accessible"
- 422: Validation failed → Show specific field errors

**Rate Limits:**
- Authenticated: 5,000 requests/hour
- Implementation: Cache repository list, avoid unnecessary calls

---

### 6.2 Notion API

**Authentication:** OAuth 2.0 or Internal Integration Token

**Required Capabilities:**
- Read content
- Update content
- Insert content

**Endpoints:**

**Create Page:**
```
POST https://api.notion.com/v1/pages
Authorization: Bearer {token}
Notion-Version: 2022-06-28
Content-Type: application/json

{
  "parent": {
    "database_id": "string"
  },
  "properties": {
    "Title": {
      "title": [
        {
          "text": {
            "content": "string"
          }
        }
      ]
    },
    "Tags": {
      "multi_select": [
        { "name": "voice-note" }
      ]
    }
  },
  "children": [
    {
      "object": "block",
      "type": "paragraph",
      "paragraph": {
        "rich_text": [
          {
            "text": {
              "content": "Transcribed content here..."
            }
          }
        ]
      }
    }
  ]
}

Response 200 OK:
{
  "id": "page-uuid",
  "url": "https://notion.so/...",
  "properties": {...}
}
```

**Search Databases:**
```
POST https://api.notion.com/v1/search
Authorization: Bearer {token}
Notion-Version: 2022-06-28
Content-Type: application/json

{
  "filter": {
    "value": "database",
    "property": "object"
  }
}

Response 200 OK:
{
  "results": [
    {
      "id": "database-uuid",
      "title": [{ "plain_text": "My Database" }]
    }
  ]
}
```

**Error Handling:**
- 401: Invalid token → Show "Re-authenticate with Notion"
- 400: Invalid request → Show validation errors
- 404: Database not found → Show "Database not accessible"

**Rate Limits:**
- 3 requests per second (average)
- Implementation: Queue requests, add 350ms delay between calls

---

### 6.3 Affine API

**Note:** Affine is an open-source alternative to Notion. API details may vary based on deployment (cloud vs self-hosted).

**Authentication:** API Token (to be confirmed)

**Endpoints (Tentative - verify during implementation):**

**Create Page:**
```
POST https://api.affine.pro/api/workspaces/{workspace}/pages
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "string",
  "blocks": [
    {
      "type": "text",
      "content": "Transcribed content..."
    }
  ]
}
```

**Implementation Note:**
- Research Affine's official API documentation during development
- If no official API, consider using their GraphQL endpoint or export/import mechanisms
- Self-hosted instances may have different endpoints

---

### 6.4 LLM Provider APIs

**A. OpenRouter**

**Endpoint:**
```
POST https://openrouter.ai/api/v1/chat/completions
Authorization: Bearer {api_key}
Content-Type: application/json

{
  "model": "anthropic/claude-3.5-sonnet",
  "messages": [
    {
      "role": "system",
      "content": "You are helping refine a voice note transcription. Original: {transcription}"
    },
    {
      "role": "user",
      "content": "Help me turn this into a clear GitHub issue"
    }
  ],
  "stream": true
}

Response (Server-Sent Events):
data: {"id":"gen-123","choices":[{"delta":{"content":"Sure"}}]}
data: {"id":"gen-123","choices":[{"delta":{"content":", I"}}]}
data: [DONE]
```

**Supported Models:**
- `anthropic/claude-3.5-sonnet`
- `openai/gpt-4-turbo`
- `meta-llama/llama-3.1-70b`
- Full list: https://openrouter.ai/models

**Rate Limits:** Varies by model (typically 200 requests/minute)

---

**B. ZAI**

**Note:** ZAI API details to be confirmed during implementation.

**Expected Endpoint:**
```
POST https://api.zai.ai/v1/chat
Authorization: Bearer {api_key}
Content-Type: application/json

{
  "messages": [...],
  "stream": true
}
```

---

**C. Claude Code (Local/Remote)**

**Integration Approach:**
- If Claude Code exposes a local API endpoint, use `fetch()` from service worker
- If message-passing protocol, use Chrome's native messaging API
- If no API, fallback to OpenRouter with Claude models

**To Research:**
- Claude Code's extension API
- Message passing protocol
- Authentication mechanism

---

### 6.5 Transcription Services

**Option 1: OpenAI Whisper API**

**Endpoint:**
```
POST https://api.openai.com/v1/audio/transcriptions
Authorization: Bearer {api_key}
Content-Type: multipart/form-data

{
  "file": <audio blob>,
  "model": "whisper-1",
  "language": "en",
  "response_format": "verbose_json",
  "timestamp_granularities": ["word"]
}

Response 200 OK:
{
  "text": "Full transcription",
  "words": [
    {
      "word": "Hello",
      "start": 0.0,
      "end": 0.5
    }
  ]
}
```

**Pros:**
- High accuracy (industry-leading)
- Supports 90+ languages
- Word-level timestamps for streaming simulation

**Cons:**
- Not true streaming (batch processing)
- Requires sending full audio file
- Cost: $0.006 per minute

**Streaming Simulation:**
- Split audio into 2-second chunks
- Send chunks sequentially
- Display results as they arrive

---

**Option 2: Gemini Audio API (On-Device)**

**Implementation:**
```javascript
const session = await window.ai.languageModel.create({
  expectedInputs: [{ type: 'audio' }]
});

const stream = session.promptStreaming([
  {
    role: 'user',
    content: [
      { type: 'text', value: 'Transcribe this audio:' },
      { type: 'audio', value: audioBlobOrArrayBuffer }
    ]
  }
]);

for await (const chunk of stream) {
  // True streaming transcription
  console.log(chunk);
}
```

**Pros:**
- True streaming support
- On-device processing (privacy)
- No API costs
- Low latency

**Cons:**
- Requires Chrome 127+ with Gemini Nano enabled
- Limited language support (English primarily)
- Accuracy may be lower than Whisper

**Recommended for MVP:** This approach for best UX

---

**Option 3: Web Speech API**

**Implementation:**
```javascript
const recognition = new webkitSpeechRecognition();
recognition.continuous = true;
recognition.interimResults = true;

recognition.onresult = (event) => {
  const transcript = event.results[event.results.length - 1][0].transcript;
  // Display in real-time
};

recognition.start();
```

**Pros:**
- Built into Chrome
- True real-time streaming
- No API costs
- Zero latency

**Cons:**
- Requires active internet connection
- Privacy concerns (sends audio to Google)
- Less accurate than Whisper
- Limited language support

**Recommended for:** Quick prototype/demo

---

**Recommendation for MVP:**
1. **Primary:** Gemini Audio API (on-device) for best UX
2. **Fallback:** Web Speech API if Gemini unavailable
3. **Future:** OpenAI Whisper for production (higher accuracy)

---

## 7. Security & Privacy

### 7.1 API Key Storage

**Requirements:**
- Never store API keys in plaintext in `chrome.storage.sync` (synced across devices)
- Use `chrome.storage.local` for sensitive credentials
- Encrypt keys before storage (optional enhancement)

**Implementation:**
```javascript
// Store encrypted token
await chrome.storage.local.set({
  github_token: btoa(token) // Basic obfuscation (upgrade to real encryption)
});

// Retrieve and decrypt
const { github_token } = await chrome.storage.local.get('github_token');
const token = atob(github_token);
```

**Best Practice:**
- Prompt user to re-enter tokens if extension detects unusual activity
- Provide "Clear all tokens" button in settings
- Warn user before syncing sensitive data

---

### 7.2 Audio Privacy

**Principles:**
- Audio data should never be stored longer than necessary
- User must explicitly consent to microphone access
- Transcription data should be deletable

**Implementation:**
- Delete audio blobs immediately after transcription
- Store only transcribed text, not audio
- Provide "Delete all recordings" option
- Show microphone indicator when recording

**Permissions:**
```json
{
  "permissions": [
    "storage"
    // Note: "microphone" is NOT needed in manifest
    // getUserMedia() triggers browser-native permission prompt
  ]
}
```

**User Consent Flow:**
1. User clicks "Record"
2. Browser shows native microphone permission prompt
3. User grants/denies
4. Extension stores consent state in chrome.storage
5. Subsequent recordings use granted permission

---

### 7.3 Data Retention

**Policy:**
- Transcriptions: Stored indefinitely (user can delete)
- Audio recordings: Deleted immediately after transcription
- LLM conversations: Stored for 30 days, then auto-deleted
- API tokens: Stored until user manually removes

**User Controls:**
- "Delete this note" button on each history item
- "Clear all history" button in settings
- "Revoke API access" button for each integration
- Export history as JSON before deletion

---

### 7.4 Network Security

**Requirements:**
- All API requests over HTTPS only
- Validate SSL certificates
- Implement request timeout (10 seconds)
- Sanitize user input before sending to APIs

**Implementation:**
```javascript
async function makeAPIRequest(url, options) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - please try again');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
```

---

## 8. Performance Requirements

### 8.1 Latency Targets

| Action | Target | Maximum |
|--------|--------|---------|
| Open side panel | < 100ms | 200ms |
| Start recording | < 200ms | 500ms |
| First transcription word | < 500ms | 1000ms |
| Subsequent words | < 100ms | 300ms |
| Send to GitHub | < 2s | 5s |
| Send to Notion | < 3s | 7s |
| LLM first token | < 500ms | 1500ms |
| LLM subsequent tokens | < 50ms | 150ms |
| Load history (50 items) | < 200ms | 500ms |
| Search history | < 100ms | 300ms |

### 8.2 Resource Limits

**Memory:**
- Service worker: < 50MB
- Side panel: < 100MB
- Offscreen document: < 30MB

**Storage:**
- Total chrome.storage.local: < 5MB
- Individual note: < 50KB
- Conversation history: < 500KB per conversation

**Network:**
- Audio chunk size: 64KB (1 second at 64kbps)
- Max concurrent API requests: 3
- Request retry limit: 3 attempts with exponential backoff

### 8.3 Optimization Strategies

**Lazy Loading:**
- Load history in batches of 50
- Virtualize long lists (only render visible items)
- Load LLM providers on-demand

**Caching:**
- Cache GitHub repository list for 1 hour
- Cache Notion database list for 1 hour
- Cache user settings in memory (service worker)

**Debouncing:**
- Search input: 300ms debounce
- Auto-save: 1000ms debounce

**Compression:**
- Compress large transcriptions before storage
- Use IndexedDB for large datasets (future enhancement)

---

## 9. Error Handling

### 9.1 Error Categories

**User Errors:**
- Microphone permission denied
- Invalid API token
- Network offline
- Repository not found

**System Errors:**
- Service worker crash
- Storage quota exceeded
- API rate limit exceeded
- Transcription service unavailable

**Developer Errors:**
- Invalid API response format
- Missing required fields
- Type mismatches

### 9.2 Error Messages

**Pattern:** Clear, actionable, friendly

**Examples:**

| Error | User Message | Action |
|-------|-------------|--------|
| Mic permission denied | "Microphone access denied. Please enable it in Chrome settings." | [Open Settings] |
| Invalid GitHub token | "GitHub token is invalid. Please check your settings." | [Open Settings] |
| Network offline | "No internet connection. Check your network and try again." | [Retry] |
| Rate limit exceeded | "GitHub rate limit reached. Try again in 15 minutes." | [OK] |
| Storage full | "Storage is full. Please delete old notes." | [View History] |

### 9.3 Error Logging

**Client-Side Logging:**
```javascript
class ErrorLogger {
  static log(error, context) {
    console.error(`[Voice Starter] ${context}:`, error);

    // Store recent errors in chrome.storage for debugging
    chrome.storage.local.get('error_log', (data) => {
      const log = data.error_log || [];
      log.push({
        timestamp: Date.now(),
        context,
        message: error.message,
        stack: error.stack
      });

      // Keep only last 50 errors
      chrome.storage.local.set({ error_log: log.slice(-50) });
    });
  }
}
```

**User Opt-In Telemetry (Future Enhancement):**
- Anonymous error reporting to Sentry or similar
- Requires explicit user consent
- No PII included in reports

---

## 10. Testing Strategy

### 10.1 Unit Tests

**Tools:** Jest + Chrome Extension Test Utils

**Coverage Areas:**
- API client functions (GitHub, Notion, Affine)
- LLM provider adapters
- Storage wrappers
- Audio utilities
- Message passing helpers

**Example:**
```javascript
describe('GitHub API Client', () => {
  test('creates issue with valid token', async () => {
    const client = new GitHubClient('valid-token');
    const issue = await client.createIssue('owner/repo', {
      title: 'Test issue',
      body: 'Test body'
    });

    expect(issue).toHaveProperty('number');
    expect(issue).toHaveProperty('html_url');
  });

  test('throws on invalid token', async () => {
    const client = new GitHubClient('invalid-token');
    await expect(client.createIssue('owner/repo', {}))
      .rejects.toThrow('Invalid token');
  });
});
```

### 10.2 Integration Tests

**Tools:** Puppeteer + Chrome Extension Testing Library

**Test Scenarios:**
1. **End-to-End Recording Flow:**
   - Open side panel → Click record → Grant mic permission → Speak → Stop → Verify transcription appears

2. **Send to GitHub Flow:**
   - Complete recording → Select repository → Click send → Verify issue created → Check history

3. **LLM Chat Flow:**
   - Complete recording → Type message → Verify streaming response → Apply suggestion

4. **Settings Persistence:**
   - Configure API tokens → Reload extension → Verify settings persisted

### 10.3 Manual Testing Checklist

**Pre-Release Checklist:**
- [ ] Test on Windows, macOS, Linux
- [ ] Test on Chrome Stable, Beta, Canary
- [ ] Test with slow network (throttle to 3G)
- [ ] Test with microphone disabled
- [ ] Test with all API integrations (GitHub, Notion, Affine)
- [ ] Test with each LLM provider (OpenRouter, ZAI, Claude Code)
- [ ] Test history with 100+ notes
- [ ] Test storage quota limits
- [ ] Test extension update flow
- [ ] Test keyboard shortcuts and accessibility

---

## 11. Accessibility

### 11.1 WCAG 2.1 Compliance

**Target:** WCAG 2.1 Level AA

**Requirements:**
- Keyboard navigation for all controls
- Screen reader support (ARIA labels)
- Sufficient color contrast (4.5:1 for text)
- Focus indicators visible
- Error messages announced to screen readers

### 11.2 Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open side panel | `Alt+Shift+V` |
| Start/stop recording | `Ctrl+R` (when panel open) |
| Send to GitHub | `Ctrl+Enter` (when ready) |
| Focus chat input | `Ctrl+/` |
| Navigate history | `↑` / `↓` |
| Open selected note | `Enter` |

### 11.3 Screen Reader Support

**Implementation:**
```html
<!-- Recording button -->
<button
  aria-label="Start recording voice note"
  aria-pressed="false"
  id="record-btn">
  🎤 Record
</button>

<!-- Transcription display -->
<div
  role="log"
  aria-live="polite"
  aria-atomic="false"
  aria-label="Transcription output">
  <!-- Transcribed text appears here -->
</div>

<!-- History list -->
<ul role="list" aria-label="Voice note history">
  <li role="listitem">
    <a href="#" aria-label="Open GitHub issue 123: Fix login bug">
      Fix login bug
    </a>
  </li>
</ul>
```

### 11.4 Visual Accessibility

**Color Blindness:**
- Never rely on color alone to convey information
- Use icons + color (e.g., red X icon for error, not just red text)
- Test with color blindness simulators

**High Contrast Mode:**
- Support Windows High Contrast Mode
- Test with `prefers-contrast: high` media query

**Font Scaling:**
- Support browser font size adjustments
- Use relative units (`rem`, `em`) not `px`

---

## 12. Internationalization (i18n)

### 12.1 Supported Languages (MVP)

**Phase 1:**
- English (US) - Primary

**Phase 2 (Future):**
- Spanish (ES)
- French (FR)
- German (DE)
- Japanese (JP)
- Chinese Simplified (ZH-CN)

### 12.2 Implementation

**Use Chrome's i18n API:**
```json
// _locales/en/messages.json
{
  "extensionName": {
    "message": "Voice Starter"
  },
  "recordButton": {
    "message": "Start Recording"
  },
  "sendToGitHub": {
    "message": "Send to GitHub"
  }
}
```

```javascript
// In JavaScript
const recordLabel = chrome.i18n.getMessage('recordButton');
```

```html
<!-- In HTML -->
<button data-i18n="recordButton"></button>
```

### 12.3 Transcription Language Support

**Supported Languages:**
- Depends on chosen transcription service
- OpenAI Whisper: 90+ languages
- Gemini Audio: Primarily English
- Web Speech API: 50+ languages

**Implementation:**
- Language selector in settings
- Auto-detect language (future enhancement)
- Pass language code to transcription API

---

## 13. Release Plan

### 13.1 MVP Scope (Version 1.0) - **REVISED FOR "NO HOME" PROBLEM**

**Core Workflow (2-Click Capture):**
1. Open side panel → Click "Record" → Start talking
2. Stop recording → Choose destination → Done

**Must-Have Features (P0 - Critical):**
- ✅ Audio recording with microphone access
- ✅ Real-time transcription (Gemini Audio or Web Speech API)
- ✅ **Local draft storage** (save without choosing destination)
- ✅ **GitHub Issues** (for production repos)
- ✅ **GitHub Projects** (for idea backlog - NO CI/CD trigger)
- ✅ **OneNote** (fastest note-taking integration - reuse web clipper API)
- ✅ Unified note history view (drafts + sent notes)
- ✅ Settings page for API tokens
- ✅ Side panel UI with destination chooser

**Rationale for MVP Destinations:**
- **Local Drafts** → Instant save, zero setup (addresses "no home" problem)
- **GitHub Issues** → Production-ready tasks (your primary use case)
- **GitHub Projects** → Half-baked ideas without CI/CD (addresses "no home" problem)
- **OneNote** → Quick notes (reuses your existing web clipper API = fast to implement)

**Defer to v1.1:**
- ⏸ Notion integration (more complex than OneNote, similar value)
- ⏸ Affine integration (niche user base)
- ⏸ LLM chat for refinement (can add after core workflow validated)
- ⏸ Advanced history filters (search/tag system)
- ⏸ Export history as JSON
- ⏸ Bulk draft promotion

### 13.2 Development Phases (REVISED)

**Phase 1: Foundation (Week 1)**
- Set up project structure (manifest.json, service-worker.js, sidepanel/)
- Implement chrome.storage wrappers
- Create side panel UI skeleton
- Basic routing between screens (recording, destination chooser, history)

**Phase 2: Recording & Transcription (Week 2)**
- Implement offscreen document for audio capture
- Integrate MediaRecorder API
- Integrate Web Speech API (simplest for MVP)
- Display streaming transcription in UI
- Add basic editing of transcription

**Phase 3: Local Drafts (Week 3)**
- Implement draft storage in chrome.storage.local
- "Save as Draft" button and workflow
- Draft list in history view
- Edit and promote draft functionality
- **Milestone:** Users can capture and save notes locally (zero external dependencies)

**Phase 4: GitHub Issues Integration (Week 4)**
- Implement GitHub REST API client
- OAuth token configuration
- Repository list fetching
- Issue creation flow with preview
- Error handling and rate limiting

**Phase 5: GitHub Projects Integration (Week 5)**
- Implement GitHub GraphQL API client
- Projects list fetching
- Draft issue creation in projects
- Column selection
- **Milestone:** Users can dispatch to GitHub (Issues or Projects)

**Phase 6: OneNote Integration (Week 6)**
- Implement Microsoft Graph API client (reuse web clipper pattern)
- OAuth token configuration
- Notebook/section fetching
- Page creation flow
- **Milestone:** Users can send to note-taking app

**Phase 7: History & Destination Chooser UI (Week 7)**
- Unified history view (drafts + sent notes)
- Destination chooser screen
- Click to open artifacts
- Filter by destination type
- Polish UI/UX

**Phase 8: Testing & Polish (Week 8)**
- Integration testing (all workflows)
- Accessibility improvements
- Error handling polish
- Performance optimization
- User documentation

**Phase 9: Beta Testing (Week 9)**
- Internal dogfooding
- External beta with 20-50 users
- Collect feedback
- Fix critical bugs

**Phase 10: Public Release (Week 10)**
- Chrome Web Store submission
- Documentation and onboarding
- Marketing materials
- Launch announcement

### 13.3 Chrome Web Store Listing

**Title:** Voice Starter - Quick Voice Notes to GitHub & Notion

**Short Description (132 chars max):**
Record voice notes with AI transcription. Send to GitHub Issues, Notion, or Affine in seconds. Never lose a great idea again.

**Detailed Description:**
```
Voice Starter helps developers and knowledge workers capture fleeting ideas instantly.

🎤 RECORD WITH REAL-TIME TRANSCRIPTION
- One-click recording from Chrome's side panel
- See your words transcribed as you speak
- Powered by AI for accurate transcription

📝 SEND TO YOUR TOOLS
- Create GitHub Issues directly from voice notes
- Add to Notion databases with one click
- Integration with Affine (coming soon)

💬 REFINE WITH AI (Coming Soon)
- Chat with AI to clarify your thoughts
- Generate structured tasks from rough ideas
- Support for multiple LLM providers

📜 NEVER LOSE A NOTE
- Automatic history of all sent notes
- Click to open GitHub issues or Notion pages
- Search through your captured ideas

Perfect for:
- Developers capturing bug reports on the go
- Product managers logging feature ideas
- Researchers saving insights during reading
- Anyone who thinks faster than they type

Privacy-focused: Audio is transcribed locally or via secure APIs and immediately deleted. Only text is stored.

Get started in 60 seconds:
1. Install the extension
2. Grant microphone permission
3. Click record and start talking
4. Send to GitHub or Notion
```

**Screenshots:**
1. Side panel recording interface
2. Real-time transcription in action
3. Sending to GitHub with preview
4. Note history view
5. Settings page

**Category:** Productivity

**Tags:** voice notes, transcription, github, notion, productivity, developer tools, AI

---

## 14. Success Metrics

### 14.1 User Engagement Metrics

**Primary Metrics:**
- Daily Active Users (DAU)
- Weekly Active Users (WAU)
- Notes recorded per user per week
- Notes sent (GitHub/Notion/Affine) per user per week
- Retention rate (D1, D7, D30)

**Targets (6 months post-launch):**
- 10,000 total installs
- 2,000 weekly active users
- 70% D1 retention
- 40% D7 retention
- 25% D30 retention

### 14.2 Feature Usage Metrics

**Track:**
- Recording duration (average)
- Transcription accuracy (user feedback)
- Destination breakdown (GitHub vs Notion vs Affine)
- LLM chat usage rate
- Settings changes frequency

**Targets:**
- Average recording duration: 30-90 seconds
- GitHub as primary destination: 60% of sends
- LLM chat usage: 30% of notes
- Settings configured within first session: 80%

### 14.3 Performance Metrics

**Track:**
- Time to first transcription word
- API request success rate
- Extension crash rate
- Service worker restart rate

**Targets:**
- First word latency: < 500ms (95th percentile)
- API success rate: > 99%
- Crash rate: < 0.1% of sessions
- Service worker restarts: < 1 per session

### 14.4 User Satisfaction Metrics

**Track:**
- Chrome Web Store rating
- User reviews sentiment
- Support ticket volume
- Feature request frequency

**Targets:**
- 4.5+ star rating on Chrome Web Store
- < 5 support tickets per 1000 users per month
- Top 3 feature requests documented for roadmap

---

## 15. Future Enhancements (Post-MVP)

### 15.1 Version 1.1 (Q2 2026)

- **Notion Integration:** Full implementation
- **Affine Integration:** Full implementation
- **LLM Chat:** Multi-provider support (OpenRouter, ZAI, Claude Code)
- **Conversation History:** Store and resume LLM conversations
- **Keyboard Shortcuts:** Customizable hotkeys
- **Dark Mode:** Full UI support

### 15.2 Version 1.2 (Q3 2026)

- **Offline Mode:** Record and transcribe offline, sync when online
- **Custom Templates:** User-defined templates for GitHub issues and notes
- **Tags & Categories:** Organize notes with custom tags
- **Advanced Search:** Full-text search with filters
- **Bulk Operations:** Send multiple notes at once
- **Browser Extension:** Support for Firefox and Edge

### 15.3 Version 2.0 (Q4 2026)

- **Mobile App:** Companion iOS/Android app
- **Team Features:** Shared note repositories
- **Integrations:** Slack, Linear, Jira, Asana
- **Voice Commands:** Control extension with voice
- **Multi-Language:** Support for 10+ languages
- **Analytics Dashboard:** Personal productivity insights

---

## 16. Open Questions & Decisions Needed

### 16.1 Technical Decisions

**Q1: Transcription Service for MVP?**
- **Option A:** Gemini Audio API (on-device, streaming, privacy-focused)
- **Option B:** OpenAI Whisper API (higher accuracy, batch processing)
- **Option C:** Web Speech API (built-in, free, lower accuracy)

**Recommendation:** Start with Gemini Audio API, fallback to Web Speech API

---

**Q2: LLM Provider Priority?**
- **Option A:** OpenRouter only (simplest, access to many models)
- **Option B:** OpenRouter + Claude Code (requires integration research)
- **Option C:** All three (OpenRouter, ZAI, Claude Code)

**Recommendation:** Start with OpenRouter only for MVP

---

**Q3: Storage Strategy?**
- **Option A:** chrome.storage.local only (5MB limit)
- **Option B:** chrome.storage.local + IndexedDB for large data
- **Option C:** Cloud storage (requires backend)

**Recommendation:** chrome.storage.local for MVP, migrate to IndexedDB in v1.1

---

### 16.2 Product Decisions

**Q4: Should we support audio playback?**
- User can replay original recordings
- Requires storing audio blobs (large storage)
- Privacy implications

**Recommendation:** No for MVP (delete audio immediately)

---

**Q5: Should we support editing transcriptions?**
- User can manually correct transcription errors
- Adds complexity to UI
- Improves accuracy for low-confidence words

**Recommendation:** Yes - simple textarea edit before sending

---

**Q6: Should we support collaborative features?**
- Share notes with team members
- Requires backend and user accounts
- Out of scope for MVP

**Recommendation:** No for v1.0, consider for v2.0

---

## 17. Dependencies

### 17.1 Third-Party Libraries

**Required:**
- None (pure JavaScript + Chrome APIs)

**Optional (for future):**
- **Marked.js:** Markdown rendering for previews
- **Recharts:** Analytics dashboard (v2.0)
- **Fuse.js:** Fuzzy search for history

### 17.2 External Services

**Required:**
- GitHub API (free tier: 5000 requests/hour)
- LLM provider (OpenRouter, ZAI, or Claude Code)
- Transcription service (Gemini/Whisper/Web Speech)

**Optional:**
- Notion API (free tier available)
- Affine API (open-source, self-hostable)

### 17.3 Chrome APIs

**Used:**
- `chrome.storage` (local, session, sync)
- `chrome.sidePanel`
- `chrome.offscreen`
- `chrome.runtime` (messaging)
- `navigator.mediaDevices.getUserMedia()`
- `MediaRecorder` API
- `fetch()` API

---

## 18. Risks & Mitigations

### 18.1 Technical Risks

**Risk:** Chrome API deprecation
- **Likelihood:** Low
- **Impact:** High
- **Mitigation:** Monitor Chrome release notes, participate in Chrome Extensions community

**Risk:** Transcription service unavailable
- **Likelihood:** Medium
- **Impact:** High
- **Mitigation:** Implement multiple transcription backends with automatic fallback

**Risk:** API rate limits exceeded
- **Likelihood:** Medium
- **Impact:** Medium
- **Mitigation:** Implement request queuing, show rate limit status to user

**Risk:** Storage quota exceeded
- **Likelihood:** Medium
- **Impact:** Medium
- **Mitigation:** Warn user at 80% quota, auto-delete old conversations

### 18.2 Product Risks

**Risk:** Low user adoption
- **Likelihood:** Medium
- **Impact:** High
- **Mitigation:** Focus on developer communities (Reddit, Hacker News), create demo videos

**Risk:** Poor transcription accuracy
- **Likelihood:** Medium
- **Impact:** High
- **Mitigation:** Allow manual editing, provide feedback mechanism

**Risk:** Complex setup process
- **Likelihood:** Low
- **Impact:** Medium
- **Mitigation:** Guided onboarding flow, pre-populate common settings

### 18.3 Business Risks

**Risk:** API cost scaling
- **Likelihood:** High (if using paid APIs)
- **Impact:** Medium
- **Mitigation:** Use free tiers where possible, consider freemium model

**Risk:** API provider policy changes
- **Likelihood:** Medium
- **Impact:** Medium
- **Mitigation:** Multi-provider support, monitor ToS changes

---

## 19. Compliance & Legal

### 19.1 Privacy Policy

**Required Disclosures:**
- What data is collected (audio, transcriptions, API tokens)
- How data is used (transcription, API requests)
- How data is stored (chrome.storage.local, encrypted)
- Third-party services used (GitHub, Notion, Affine, LLM providers)
- User rights (delete data, export data)

**Template:** [Privacy Policy Generator](https://www.privacypolicygenerator.info/)

### 19.2 Terms of Service

**Key Clauses:**
- User must have rights to content they record
- No liability for third-party API failures
- User responsible for API key security
- No warranty on transcription accuracy

### 19.3 Chrome Web Store Policies

**Compliance Checklist:**
- [ ] No deceptive installation tactics
- [ ] No obfuscated code
- [ ] Minimal permissions requested
- [ ] Privacy policy linked in store listing
- [ ] Contact email provided
- [ ] No copyright infringement in assets/code

### 19.4 API Provider Terms

**GitHub:**
- Comply with GitHub Terms of Service
- Attribute GitHub in UI ("Created via Voice Starter for GitHub")

**Notion:**
- Comply with Notion API Terms
- Display "Made with Notion" if required

**OpenAI (Whisper):**
- Comply with OpenAI Usage Policies
- No use for surveillance or restricted use cases

---

## 20. Documentation

### 20.1 User Documentation

**Help Center Articles:**
1. Getting Started with Voice Starter
2. Connecting to GitHub
3. Connecting to Notion
4. Using the LLM Chat
5. Managing Your Note History
6. Keyboard Shortcuts
7. Troubleshooting Common Issues

**In-App Help:**
- Tooltips on hover for all buttons
- "?" icon in toolbar linking to help center
- Onboarding tour on first launch

### 20.2 Developer Documentation

**README.md:**
- Project overview
- Setup instructions
- Build commands
- Testing instructions
- Contributing guidelines

**Architecture Documentation:**
- Component diagram
- Data flow diagrams
- API integration patterns
- State management approach

**API Documentation:**
- Internal APIs (lib/storage.js, lib/github-api.js, etc.)
- Message passing protocol
- Storage schema

---

## 21. Appendix

### 21.1 Glossary

- **Service Worker:** Background script that runs in extension context (replaces background page in Manifest V3)
- **Offscreen Document:** Hidden page that can access DOM APIs (used for MediaRecorder)
- **Side Panel:** Persistent UI panel that opens alongside web content (Chrome 114+)
- **chrome.storage.local:** Local storage API for extension data (quota: ~5MB)
- **chrome.storage.session:** Temporary storage cleared when browser closes
- **MediaRecorder:** Web API for recording audio/video streams
- **SSE (Server-Sent Events):** HTTP streaming protocol used by LLMs for streaming responses

### 21.2 References

**Chrome Extension Documentation:**
- [Manifest V3 Overview](https://developer.chrome.com/docs/extensions/mv3/)
- [Side Panel API](https://developer.chrome.com/docs/extensions/reference/sidePanel/)
- [Offscreen Documents](https://developer.chrome.com/docs/extensions/reference/offscreen/)
- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)

**Chrome Extension Examples:**
- `ai.gemini-on-device-audio-scribe` - Audio transcription pattern
- `sample.tabcapture-recorder` - MediaRecorder in offscreen document
- `sample.sidepanel-dictionary` - Side panel with storage sync

**API Documentation:**
- [GitHub REST API](https://docs.github.com/en/rest)
- [Notion API](https://developers.notion.com/)
- [OpenRouter API](https://openrouter.ai/docs)
- [OpenAI Whisper API](https://platform.openai.com/docs/guides/speech-to-text)

### 21.3 Contact & Support

**Project Owner:** [Your Name/Team]
**Email:** support@voicestarter.dev
**GitHub:** https://github.com/your-org/voice-starter
**Discord:** https://discord.gg/voice-starter

---

## 22. Changelog

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2026-02-13 | Initial PRD draft |

---

**Document Status:** ✅ Ready for Review

**Next Steps:**
1. Review PRD with stakeholders
2. Prioritize features for MVP
3. Create technical architecture document
4. Set up development environment
5. Begin Phase 1 implementation

---

*This PRD is a living document and will be updated as the project evolves.*
