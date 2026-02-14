# PRD Changelog - Addressing "No Home" Problem

## Summary of Changes (2026-02-13)

Based on user feedback about the "no home" problem for half-baked ideas and the need for a faster workflow, the PRD has been significantly revised.

---

## Key Problems Identified

### 1. **Half-Baked Ideas Have No Home**
- GitHub Issues trigger CI/CD automation
- Not all ideas are ready for production issue trackers
- Users need a place for rough thoughts that don't belong to a specific repo

### 2. **Ideas Span Multiple Projects**
- Cross-cutting concerns don't fit into a single repository
- Need a way to capture ideas without forcing them into a project structure

### 3. **Workflow Was Too Slow**
- Original design: Choose destination BEFORE recording
- Better design: **Record FIRST, decide destination AFTER**

---

## Major Changes to PRD

### ✅ New Core Workflow: "Record First, Decide Later"

**Old Workflow:**
1. Select destination (GitHub/Notion/etc.)
2. Configure settings
3. Record
4. Send

**New Workflow:**
1. **Open extension → Click "Record" → Start talking** (2 clicks max)
2. Stop recording
3. **THEN choose destination**
4. Done

This removes friction and allows users to capture fleeting ideas instantly.

---

### ✅ Three Solutions to the "No Home" Problem

#### 1. **Local Draft Storage** (NEW - Priority P0)
- Save notes as local drafts without choosing external destination
- Instant save (< 100ms, no API calls)
- Works offline
- Can promote to any destination later
- Perfect for "I'll figure out where this goes later" scenarios

**User Story Added:**
```
US-04: Save Drafts Locally (Ideas with No Home)

As a developer,
I want to save voice notes as local drafts when I don't know where they belong yet,
So that I can capture ideas without forcing them into a specific project or system.
```

#### 2. **GitHub Projects Integration** (NEW - Priority P0)
- Add voice notes to GitHub Projects (v2) as draft items
- **Does NOT trigger CI/CD** (unlike GitHub Issues)
- No repository association required initially
- Perfect for idea backlogs and cross-project thoughts
- Can promote to repository issue later via GitHub UI

**Feature Added:**
```
3.3 Feature: GitHub Projects Integration

Why This Matters:
- Ideas don't always belong to a specific repo
- Some notes are too rough for production issue trackers
- GitHub Projects provide an "idea backlog" without triggering automation
- Can promote project items to issues later when ready
```

#### 3. **OneNote Integration** (NEW - Priority P1)
- Reuses existing OneNote web clipper API
- Fast to implement (1-2 days vs 1-2 weeks for Notion)
- No custom database setup required
- Perfect for quick notes outside of GitHub ecosystem

**Feature Added:**
```
3.6 Feature: OneNote Integration

Why OneNote:
- You already have web clipper integration → reuse the API pattern
- Microsoft Graph API is well-documented
- Free tier with generous limits
- Fastest path to MVP
```

---

### ✅ Updated MVP Scope

**NEW Must-Have Features (P0):**
1. Audio recording with real-time transcription ✅
2. **Local draft storage** ✅ (NEW)
3. **GitHub Issues** ✅ (for production repos)
4. **GitHub Projects** ✅ (for idea backlog) (NEW)
5. **OneNote** ✅ (fast note-taking integration) (NEW)
6. Unified note history (drafts + sent notes) ✅
7. Destination chooser UI ✅ (NEW)
8. Settings page ✅

**Deferred to v1.1:**
- Notion integration (more complex than OneNote)
- Affine integration (niche user base)
- LLM chat for refinement (can add after core workflow validated)
- Advanced history filters

**Rationale:**
- **Local Drafts** → Solves "no home" problem instantly, zero setup
- **GitHub Projects** → Solves "no home" problem for GitHub users without CI/CD trigger
- **OneNote** → Fast to implement, reuses existing API patterns, familiar to Windows users
- **Defer Notion** → Similar value to OneNote but more complex to implement

---

### ✅ Updated User Interface

**New Destination Chooser Screen:**
```
┌─────────────────────────────────────┐
│   ✓ Recording Complete              │
│                                     │
│   📤 Where should this go?          │
│   ┌───────────────────────────┐   │
│   │ 🐙 GitHub Issue           │   │
│   │    (Triggers CI/CD)        │   │
│   ├───────────────────────────┤   │
│   │ 📋 GitHub Project         │   │
│   │    (Idea backlog)          │   │
│   ├───────────────────────────┤   │
│   │ 📘 OneNote                │   │
│   ├───────────────────────────┤   │
│   │ 💾 Save as Draft          │   │
│   │    (Decide later)          │   │
│   └───────────────────────────┘   │
└─────────────────────────────────────┘
```

**Key UI Changes:**
- Destination selection happens AFTER recording completes
- Clear distinction between GitHub Issues (CI/CD) and Projects (no CI/CD)
- "Save as Draft" prominently displayed as a first-class option
- Visual indicators for each destination type

---

### ✅ Updated Data Model

**New History Item Structure:**
```typescript
interface NoteHistoryItem {
  id: string;
  timestamp: number;
  transcription: string;
  destination: 'draft' | 'github-issue' | 'github-project' | 'onenote';
  status: 'draft' | 'sent';
  artifactUrl?: string;
  metadata: {
    github?: {
      type: 'issue' | 'project';
      repo?: string;
      projectName?: string;
      columnName?: string;
    };
    onenote?: {
      notebookName: string;
      sectionName: string;
      pageId: string;
    };
  };
}
```

**Key Changes:**
- Added `status` field (draft vs sent)
- Added `github.type` to distinguish Issues from Projects
- Added `onenote` metadata
- Made `artifactUrl` optional (drafts don't have external links)

---

### ✅ Updated Development Timeline

**Original:** 12 weeks (11-12 phases)
**Revised:** 10 weeks (more focused scope)

**Key Phase Changes:**
- **Week 3:** Local draft storage (NEW)
- **Week 5:** GitHub Projects integration (NEW)
- **Week 6:** OneNote integration (NEW)
- **Week 7:** Destination chooser UI polish (NEW)
- Removed Notion/Affine from MVP phases

---

## API Integration Changes

### New API: GitHub GraphQL (for Projects)

**Added Endpoint:**
```graphql
mutation {
  addProjectV2DraftIssue(input: {
    projectId: "PROJECT_ID"
    title: "Voice note title"
    body: "Full transcription content"
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

**Token Scopes Required:**
- `repo` (for Issues)
- `project` (for Projects) - NEW

### New API: Microsoft Graph (for OneNote)

**Added Endpoint:**
```
POST https://graph.microsoft.com/v1.0/me/onenote/sections/{section_id}/pages
Authorization: Bearer {access_token}
Content-Type: application/xhtml+xml
```

**OAuth Scopes Required:**
- `Notes.Create`
- `Notes.ReadWrite`

---

## Success Metrics Changes

### New Metrics to Track:

**Draft Usage:**
- 60% of users expected to use drafts for initial capture
- 70% of drafts eventually promoted to external system
- 30% remain as drafts (ephemeral notes)

**Destination Breakdown:**
- GitHub Issues: 30% (production tasks)
- GitHub Projects: 40% (idea backlog - PRIMARY for half-baked ideas)
- OneNote: 20% (quick notes)
- Drafts: 10% (never promoted)

**Workflow Speed:**
- Target: Record → Save as Draft → Done in < 5 seconds
- 90% of users complete workflow in < 10 seconds

---

## User Stories Added/Modified

### NEW User Stories:
1. **US-04:** Save Drafts Locally (Ideas with No Home)
2. **US-02 (Modified):** Flexible GitHub Integration (Issues vs Projects)

### Modified User Stories:
1. **US-01:** Now emphasizes "record FIRST, decide AFTER"
2. **US-03:** Added OneNote as primary note-taking destination
3. **US-05:** Renamed from US-04, updated to show all destination types in history

---

## Questions Resolved

### Q1: How to handle ideas without a specific repo home?
**Answer:** Three-pronged approach:
1. Local drafts (instant save, decide later)
2. GitHub Projects (idea backlog without CI/CD)
3. OneNote (general note-taking)

### Q2: How to avoid triggering CI/CD for half-baked ideas?
**Answer:**
1. Use GitHub Projects instead of Issues
2. Clearly label in UI: "GitHub Issue (Triggers CI/CD)" vs "GitHub Project (Idea backlog)"
3. Make Projects the default for new users

### Q3: Which note-taking app to prioritize?
**Answer:** OneNote (instead of Notion) because:
- Reuses existing web clipper API patterns
- Faster to implement (1-2 days vs 1-2 weeks)
- Familiar to Windows users
- Free tier sufficient for most users

### Q4: Should we support editing transcriptions?
**Answer:** Yes - simple textarea edit before choosing destination

---

## Technical Decisions Made

### 1. Transcription Service
- **MVP:** Web Speech API (built-in, zero cost, good enough)
- **Future:** Gemini Audio API (better UX) or OpenAI Whisper (higher accuracy)

### 2. Storage Strategy
- **MVP:** chrome.storage.local only (5MB limit sufficient for 1000+ notes)
- **v1.1:** Migrate to IndexedDB if needed

### 3. LLM Chat
- **MVP:** Defer to v1.1 (focus on core workflow first)
- **v1.1:** OpenRouter only (simplest, access to many models)

---

## Impact Summary

### Problems Solved ✅
1. **"No home" problem** → Local drafts + GitHub Projects
2. **CI/CD trigger issue** → GitHub Projects (no automation trigger)
3. **Slow workflow** → "Record first, decide later"
4. **Cross-project ideas** → GitHub Projects + OneNote
5. **Implementation timeline** → OneNote faster than Notion

### User Benefits ✅
1. **Faster capture** → 2 clicks to start recording
2. **More flexibility** → 5 destination options (including drafts)
3. **Less pressure** → Don't need to decide destination immediately
4. **Better organization** → Separate production tasks (Issues) from ideas (Projects)
5. **Works offline** → Local drafts don't require network

### Developer Benefits ✅
1. **Faster MVP** → 10 weeks instead of 12
2. **Reuse existing patterns** → OneNote web clipper API
3. **Simpler scope** → Defer Notion/Affine/LLM to v1.1
4. **Clear priorities** → Focus on "no home" problem first

---

## Next Steps

1. ✅ **Review revised PRD** with stakeholders
2. ✅ **Confirm MVP scope** (Drafts + GitHub Issues/Projects + OneNote)
3. ⏩ **Begin Phase 1** (Foundation - Week 1)
4. ⏩ **Set up GitHub Projects API** research and testing
5. ⏩ **Set up OneNote API** research and testing

---

**Document Version:** 1.1
**Last Updated:** 2026-02-13
**Status:** ✅ Ready for Implementation
