# Phase 2 Plan: GitHub Integration & Draft Enhancement

## Current State (Phase 1 Complete ✅)

### What's Working
- ✅ Real-time voice transcription with Web Speech API
- ✅ Microphone permission via popup window
- ✅ Draft storage in chrome.storage.local
- ✅ Recent notes and full history views
- ✅ Settings persistence
- ✅ Clean UI with screen routing

### Technical Architecture
```
Side Panel (UI)
    ↓
Permission Popup → getUserMedia() → Microphone Access
    ↓
TranscriptionService (Web Speech API)
    ↓
Storage Service (chrome.storage.local)
```

## Phase 2 Goals

### Primary Objectives

1. **GitHub Issues Integration** 🎯
   - Send transcribed notes directly to GitHub Issues
   - Create issues in user-specified repositories
   - Include metadata (labels, assignees, etc.)

2. **GitHub Projects Integration** 🎯
   - Add notes to GitHub Projects v2
   - Perfect for "half-baked ideas" without CI/CD triggers
   - Project board selection and column placement

3. **Draft Enhancement** ✨
   - Edit drafts before sending
   - Promote drafts to destinations
   - Delete/archive drafts

4. **Transcription Improvements** 📝
   - Better handling of long recordings
   - Punctuation and formatting
   - Language selection in settings

## Proposed Features

### 1. GitHub Issues Integration

#### User Flow
1. Record voice note
2. Stop recording → Destination chooser appears
3. Select "GitHub Issue"
4. **Repository Picker** appears:
   - Shows recently used repos at top
   - Search/filter by name
   - Can access all repos user has `repo` access to
5. Select repository → Issue form appears:
   - Title: Auto-generated from first line (editable)
   - Body: Full transcription (markdown formatted)
   - Labels: Multi-select from repo labels (optional)
   - Assignees: Multi-select (optional, defaults to self)
   - Milestone: Dropdown (optional)
6. Confirm → Issue created
7. Success notification with link to created issue
8. Repository added to "recently used" list for quick access next time

#### Technical Implementation
```javascript
// API Endpoint
POST https://api.github.com/repos/{owner}/{repo}/issues

// Required
- Authentication: GitHub Personal Access Token (PAT)
- Permissions: repo scope

// Payload
{
  title: string,
  body: string (markdown),
  labels: string[],
  assignees: string[],
  milestone: number
}
```

#### Dynamic Repository/Project Selection

**Repository List Caching:**
```javascript
// GET https://api.github.com/user/repos
// Returns all repos user has access to
// Cache for 24 hours in chrome.storage.local

{
  githubRepos: [
    { name: 'duly-noted', owner: 'DavinciDreams', full_name: 'DavinciDreams/duly-noted' },
    { name: 'my-project', owner: 'DavinciDreams', full_name: 'DavinciDreams/my-project' }
  ],
  githubReposCachedAt: 1707900000000,
  githubReposRecentlyUsed: ['DavinciDreams/duly-noted', 'DavinciDreams/my-project']
}
```

**Project List Caching:**
```graphql
# GitHub Projects v2 GraphQL query
query {
  viewer {
    projectsV2(first: 100) {
      nodes {
        id
        title
        url
      }
    }
  }
  organization(login: "orgname") {
    projectsV2(first: 100) {
      nodes {
        id
        title
        url
      }
    }
  }
}
```

**Settings Required:**
- GitHub OAuth token (with `repo` and `project` scopes)
- Optional: Default repository for quick create
- Optional: Default project for quick create
- Recently used repos/projects (auto-populated)

#### Files to Create/Modify
- `src/lib/oauth-service.js` (new) - Generic OAuth handler
- `src/lib/github-oauth.js` (new) - GitHub OAuth implementation
- `src/lib/github-service.js` (new) - GitHub API wrapper with:
  - `fetchRepositories()` - Get all repos, cache for 24h
  - `fetchProjects()` - Get all projects (GraphQL), cache for 24h
  - `createIssue(repo, data)` - Create issue in selected repo
  - `getRepoLabels(repo)` - Fetch labels for selected repo
  - `getRepoMilestones(repo)` - Fetch milestones for selected repo
- `src/lib/github-cache.js` (new) - Repository/project caching logic
- `src/oauth/oauth-callback.html` (new) - OAuth redirect page
- `src/oauth/oauth-callback.js` (new) - Token handling
- `src/sidepanel/sidepanel.js` - Add GitHub destination handler
- `src/sidepanel/sidepanel.html` - Repository picker + Issue form UI + OAuth buttons
- `src/components/repo-picker.js` (new) - Reusable repo picker component
- `src/components/project-picker.js` (new) - Reusable project picker component
- `manifest.json` - Update permissions:
  ```json
  {
    "permissions": [
      "storage",
      "sidePanel",
      "windows",
      "identity"  // NEW: For chrome.identity API (optional, for easier OAuth)
    ],
    "host_permissions": [
      "https://api.github.com/*",
      "https://github.com/login/oauth/*",  // NEW: OAuth endpoints
      "https://graph.microsoft.com/*",
      "https://api.notion.com/*"  // NEW: Notion API
    ],
    "oauth2": {  // NEW: Chrome Identity API config (optional)
      "client_id": "YOUR_CLIENT_ID",
      "scopes": ["repo", "project", "read:user"]
    }
  }
  ```

### 2. GitHub Projects Integration

#### User Flow
1. Record voice note
2. Select "GitHub Project"
3. **Project Picker** appears:
   - Shows recently used projects at top
   - Search/filter by name
   - Can access all projects user has access to (org + personal)
4. Select project → Project form appears:
   - Title: Auto-generated from first line (editable)
   - Body: Full transcription (markdown formatted)
   - Status: Dropdown (Todo, In Progress, Done, etc.)
   - Priority: Dropdown (optional, if project has priority field)
   - Custom fields: Based on project configuration (optional)
5. Confirm → Draft issue added to project
6. Success notification with link to project item
7. Project added to "recently used" list

#### Technical Implementation
```graphql
# GitHub Projects v2 uses GraphQL
mutation {
  addProjectV2DraftIssue(input: {
    projectId: "PROJECT_ID",
    title: "Title",
    body: "Body"
  }) {
    projectItem {
      id
    }
  }
}
```

#### Settings Required
- GitHub PAT (with `project` scope)
- Default project ID
- Column/status preferences

#### Files to Modify
- `src/lib/github-projects-service.js` (new) - GraphQL API wrapper
- `src/sidepanel/sidepanel.js` - Add Projects destination
- `src/sidepanel/sidepanel.html` - Projects selection UI

### 3. Draft Enhancement

#### Features
- **Edit Draft**: Click draft → Edit transcription text
- **Promote Draft**: Choose destination for existing draft
- **Delete Draft**: Remove unwanted drafts
- **Archive Draft**: Move to archive for later

#### UI Changes
- Draft card actions (Edit, Promote, Delete)
- Draft detail view with full text
- Edit mode with contenteditable
- Confirmation dialogs

#### Files to Modify
- `src/sidepanel/sidepanel.js` - Draft action handlers
- `src/sidepanel/sidepanel.html` - Draft card UI with actions
- `src/sidepanel/sidepanel.css` - Action button styles
- `src/lib/storage.js` - Add updateDraft(), deleteDraft(), archiveDraft()

### 4. Transcription Improvements

#### Features
- **Language Selection**: Dropdown in settings for transcription language
- **Better Formatting**: Auto-capitalize sentences, basic punctuation
- **Confidence Display**: Show confidence level during recording
- **Recording Controls**: Pause/resume (if supported)

#### Settings UI
```
Transcription Settings:
- Language: [Dropdown: English (US), English (UK), Spanish, etc.]
- Auto-punctuation: [Toggle]
- Show confidence: [Toggle]
- Max duration: [Input: 300 seconds]
```

#### Files to Modify
- `src/lib/transcription-service.js` - Add formatting logic
- `src/sidepanel/sidepanel.html` - Settings UI
- `src/sidepanel/sidepanel.js` - Settings handlers

## Implementation Plan

### Week 1: OAuth Infrastructure & GitHub Integration
**Tasks:**
1. Implement OAuth service wrapper (reusable for all providers)
2. Create GitHub OAuth flow
3. Add "Sign in with GitHub" button to settings
4. Implement repository selection (with caching)
5. Create issue creation form
6. Test OAuth flow end-to-end
7. Error handling and token refresh

**Deliverables:**
- Working OAuth infrastructure
- GitHub OAuth integration ("Sign in with GitHub")
- Repository picker UI
- Issue creation flow
- Developer mode fallback for manual tokens

#### OAuth Implementation Details

**New Files:**
- `src/lib/oauth-service.js` - Generic OAuth handler
- `src/lib/github-oauth.js` - GitHub-specific OAuth
- `src/oauth/oauth-callback.html` - OAuth redirect handler
- `src/oauth/oauth-callback.js` - Token extraction and storage

**OAuth Flow:**
1. User clicks "Sign in with GitHub" in settings
2. Extension opens OAuth URL in new window:
   ```
   https://github.com/login/oauth/authorize?
     client_id={CLIENT_ID}&
     redirect_uri=https://{extension-id}.chromiumapp.org/oauth-callback&
     scope=repo,project,read:user&
     state={RANDOM_STATE}
   ```
3. User authorizes on GitHub
4. GitHub redirects to `oauth-callback.html` with `code`
5. Callback page exchanges code for access token
6. Token stored in chrome.storage.local
7. Callback page closes, settings page updates to show "Connected as @username"

**Token Management:**
- Store: `{ githubToken, githubUsername, githubTokenExpiry, githubRefreshToken }`
- Auto-refresh before expiry
- Handle token revocation gracefully
- Clear tokens on sign-out

### Week 2: Draft Enhancement
**Tasks:**
1. Add edit mode to draft cards
2. Implement draft promotion flow
3. Add delete/archive functionality
4. Create draft detail view
5. Add confirmation dialogs

**Deliverables:**
- Editable drafts
- Draft promotion to any destination
- Delete/archive capabilities

### Week 3: GitHub Projects Integration
**Tasks:**
1. Research GitHub Projects v2 GraphQL API
2. Create Projects service wrapper
3. Implement project selection UI
4. Add column/status selection
5. Test with real projects

**Deliverables:**
- Working GitHub Projects integration
- Project picker UI
- Status column selection

### Week 4: Transcription Improvements
**Tasks:**
1. Add language selection to settings
2. Implement auto-formatting logic
3. Add confidence display
4. Polish UI/UX
5. End-to-end testing

**Deliverables:**
- Multi-language support
- Better transcription formatting
- Confidence indicators

## Data Model Updates

### Draft Object (Enhanced)
```javascript
{
  id: string,           // UUID
  timestamp: number,    // Unix timestamp
  transcription: string,
  confidence?: number,  // NEW: Average confidence
  language?: string,    // NEW: Language used
  duration?: number,    // NEW: Recording duration (seconds)
  editedAt?: number,    // NEW: Last edit timestamp
  archived?: boolean    // NEW: Archive flag
}
```

### History Object (Enhanced)
```javascript
{
  id: string,
  timestamp: number,
  transcription: string,
  destination: 'draft' | 'github-issue' | 'github-project' | 'onenote' | 'notion',
  status: 'pending' | 'success' | 'failed',
  artifactUrl?: string, // Link to created issue/project item
  metadata?: {          // NEW: Destination-specific data
    repository?: string,
    issueNumber?: number,
    projectId?: string,
    labels?: string[],
    error?: string
  }
}
```

### Settings Object (Enhanced)
```javascript
{
  // Developer Mode
  developerMode: boolean,         // NEW: Toggle for token inputs vs OAuth

  // GitHub (OAuth)
  githubToken: string,                    // OAuth access token
  githubUsername: string,                 // NEW: Display name
  githubTokenExpiry: number,              // NEW: Token expiration timestamp
  githubRefreshToken: string,             // NEW: For token refresh

  // Repository/Project Cache & Preferences
  githubRepos: Array<{                    // NEW: Cached repository list
    name: string,
    owner: string,
    full_name: string,
    private: boolean
  }>,
  githubReposCachedAt: number,            // NEW: Cache timestamp
  githubReposRecentlyUsed: string[],      // NEW: ['owner/repo', ...]

  githubProjects: Array<{                 // NEW: Cached project list
    id: string,
    title: string,
    url: string,
    owner: string  // 'user' or org name
  }>,
  githubProjectsCachedAt: number,         // NEW: Cache timestamp
  githubProjectsRecentlyUsed: string[],   // NEW: [projectId, ...]

  // Quick Create Defaults (optional)
  githubDefaultRepo: string,              // Optional: Quick create default
  githubDefaultProject: string,           // Optional: Quick create default
  githubDefaultLabels: string[],          // NEW: Default labels for quick create

  // Google/OneNote (OAuth)
  googleToken: string,            // NEW: OAuth access token
  googleEmail: string,            // NEW: User email
  googleTokenExpiry: number,      // NEW
  googleRefreshToken: string,     // NEW

  // Notion (OAuth)
  notionToken: string,            // NEW: OAuth access token
  notionWorkspace: string,        // NEW: Workspace name
  notionDefaultDatabase: string,  // NEW: Database ID

  // Transcription
  transcriptionLanguage: string,  // e.g., "en-US"
  transcriptionAutoPunctuation: boolean, // NEW
  transcriptionShowConfidence: boolean,  // NEW
  maxRecordingDuration: number,

  // LLM (API key - not OAuth)
  llmProvider: 'openrouter' | 'zai' | 'claude-code',
  llmApiKey: string
}
```

## Technical Decisions

### Authentication Strategy
**Decision**: Use OAuth 2.0 for all integrations
- **Why**: Better UX, no manual token copying, more secure, proper permission scopes
- **User Flow**: Click "Sign in with GitHub" → OAuth popup → Permissions granted → Token stored
- **Fallback**: Developer mode with manual token input for testing

#### OAuth Implementation for Each Service

**GitHub OAuth**:
- Flow: OAuth 2.0 with PKCE (Proof Key for Code Exchange)
- Scopes: `repo` (for issues), `project` (for projects), `read:user` (for user info)
- Redirect: `chrome-extension://{extension-id}/oauth-callback.html`
- Token Storage: chrome.storage.local (encrypted recommended)

**Google OAuth** (for OneNote via Microsoft Graph):
- Flow: OAuth 2.0 with PKCE
- Scopes: `Notes.ReadWrite`, `User.Read`
- Redirect: `chrome-extension://{extension-id}/oauth-callback.html`

**Notion OAuth**:
- Flow: OAuth 2.0
- Scopes: Workspace integration permissions
- Redirect: `chrome-extension://{extension-id}/oauth-callback.html`

#### Developer Mode
For developers who prefer tokens:
- Toggle in settings: "Developer Mode"
- When enabled, show token input fields
- When disabled, show "Sign in with X" buttons

### GraphQL vs REST
**Decision**: Use GraphQL for Projects, REST for Issues
- **Why**: Projects v2 only supports GraphQL, Issues support both
- **Benefit**: GraphQL allows complex project queries
- **Challenge**: Need to handle both API types

### Draft Editing
**Decision**: Use contenteditable for in-place editing
- **Why**: Lightweight, no additional libraries
- **Alternative**: Textarea with modal (more complex)
- **UX**: Inline editing feels natural

### Storage Strategy
**Decision**: Continue using chrome.storage.local
- **Why**: Fast, reliable, no external dependencies
- **Limit**: 10MB total (should be plenty for text notes)
- **Future**: Consider IndexedDB if we add audio storage

## OAuth Setup Requirements

### GitHub OAuth App Registration
1. Create OAuth App at: https://github.com/settings/developers
2. Application name: "Duly Noted"
3. Homepage URL: `https://github.com/DavinciDreams/duly-noted`
4. Authorization callback URL: `https://{extension-id}.chromiumapp.org/oauth-callback`
5. Store `CLIENT_ID` and `CLIENT_SECRET` securely

### Google Cloud Project (for OneNote)
1. Create project at: https://console.cloud.google.com
2. Enable Microsoft Graph API
3. Create OAuth 2.0 credentials
4. Add authorized redirect URI: `https://{extension-id}.chromiumapp.org/oauth-callback`
5. Store credentials

### Notion Integration
1. Create integration at: https://www.notion.so/my-integrations
2. Configure OAuth settings
3. Add redirect URI: `https://{extension-id}.chromiumapp.org/oauth-callback`
4. Store credentials

### Security Considerations
- **Client Secret Storage**: Store in extension (not ideal but necessary)
- **Alternative**: Use serverless function as OAuth proxy for better security
- **Token Encryption**: Consider encrypting tokens before storing in chrome.storage
- **Token Scopes**: Request minimum necessary scopes
- **Token Revocation**: Provide "Sign Out" to revoke tokens

### Recommended Architecture (More Secure)
```
Extension → OAuth Proxy (Cloudflare Worker/Vercel Function)
         ↓
OAuth Proxy ↔ GitHub/Google/Notion OAuth
         ↓
OAuth Proxy → Extension (returns token)
```

**Why OAuth Proxy?**
- CLIENT_SECRET stays server-side (not exposed in extension)
- Can implement rate limiting
- Can add analytics/logging
- Can handle token refresh automatically
- More secure for production

**Implementation Options:**
1. **Cloudflare Worker** - Free tier, edge computing, fast
2. **Vercel Serverless Function** - Free tier, easy deployment
3. **AWS Lambda** - More complex but scalable

**Proxy Endpoints:**
```
POST /oauth/github/authorize
  → Returns OAuth URL for popup

POST /oauth/github/callback
  Body: { code, state }
  → Exchanges code for token
  → Returns: { access_token, username, expires_in }

POST /oauth/github/refresh
  Body: { refresh_token }
  → Returns new access token
```

**Extension Flow with Proxy:**
1. Extension → GET `/oauth/github/authorize`
2. Extension opens returned URL in popup
3. User authorizes, GitHub redirects to proxy
4. Proxy exchanges code for token
5. Proxy redirects to `chrome-extension://{id}/oauth-success?token={encrypted_token}`
6. Extension decrypts and stores token

This approach is **strongly recommended for production** but requires hosting the proxy service.

## Open Questions / User Input Needed

### UI Mockups

#### Settings Screen with OAuth
```
┌─────────────────────────────────────────┐
│ ⚙️  Settings                            │
├─────────────────────────────────────────┤
│                                         │
│ GitHub Integration                      │
│ ┌─────────────────────────────────────┐ │
│ │ ✓ Connected as @DavinciDreams       │ │
│ │                                     │ │
│ │ [Sign Out]                          │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Default Repository:                     │
│ [DavinciDreams/duly-noted      ▼]       │
│                                         │
│ Default Labels:                         │
│ [voice-note, idea          ]            │
│                                         │
│ ─────────────────────────────────────   │
│                                         │
│ Google/OneNote Integration              │
│ ┌─────────────────────────────────────┐ │
│ │ [🔐 Sign in with Google]            │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ─────────────────────────────────────   │
│                                         │
│ Notion Integration                      │
│ ┌─────────────────────────────────────┐ │
│ │ [🔐 Sign in with Notion]            │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ─────────────────────────────────────   │
│                                         │
│ Developer Mode                          │
│ [ ] Enable developer mode               │
│     (Show manual token inputs)          │
│                                         │
│ [Save Settings]  [Reset to Defaults]   │
└─────────────────────────────────────────┘
```

#### OAuth Popup Flow
```
1. User clicks "Sign in with GitHub"
   ↓
2. Popup window opens (400x600px)
   ┌────────────────────────────┐
   │ GitHub Authorization       │
   ├────────────────────────────┤
   │ Duly Noted wants to:       │
   │                            │
   │ ✓ Access your repositories │
   │ ✓ Create issues            │
   │ ✓ Access projects          │
   │                            │
   │ [Authorize DavinciDreams]  │
   │ [Cancel]                   │
   └────────────────────────────┘
   ↓
3. After authorization, popup shows:
   ┌────────────────────────────┐
   │ ✓ Authorization Successful │
   │                            │
   │ Redirecting...             │
   └────────────────────────────┘
   ↓
4. Popup closes automatically
   Settings page updates to show "Connected"
```

#### Repository/Project Picker UI
```
┌─────────────────────────────────────────┐
│ 📝 Create GitHub Issue                  │
├─────────────────────────────────────────┤
│                                         │
│ Select Repository                       │
│ ┌─────────────────────────────────────┐ │
│ │ 🔍 Search repositories...           │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Recently Used:                          │
│ ┌─────────────────────────────────────┐ │
│ │ ⭐ DavinciDreams/duly-noted          │ │
│ │ ⭐ DavinciDreams/atlas-agents        │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ All Repositories:                       │
│ ┌─────────────────────────────────────┐ │
│ │ □ DavinciDreams/another-project     │ │
│ │ □ OrgName/team-project              │ │
│ │ □ DavinciDreams/old-project         │ │
│ │ ...                                 │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [🔄 Refresh List]        [Cancel] [Next]│
└─────────────────────────────────────────┘

After selecting repo:
┌─────────────────────────────────────────┐
│ 📝 Create Issue in duly-noted           │
├─────────────────────────────────────────┤
│                                         │
│ Title:                                  │
│ [Add voice transcription feature    ]  │
│                                         │
│ Description: (Markdown)                 │
│ ┌─────────────────────────────────────┐ │
│ │ We should add voice transcription   │ │
│ │ to make capturing notes faster.     │ │
│ │ This would use Web Speech API...    │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Labels: (Multi-select)                  │
│ [enhancement ▼] [voice ▼] [+ Add]      │
│                                         │
│ Assignees: (Optional)                   │
│ [@DavinciDreams ▼] [+ Add]             │
│                                         │
│ Milestone: (Optional)                   │
│ [v1.0 ▼]                                │
│                                         │
│          [Back] [Cancel] [Create Issue] │
└─────────────────────────────────────────┘
```

### 1. GitHub Integration Scope ✅ ANSWERED
**Decision**: Support **multiple repositories and projects** with dynamic selection
- User can choose any repository/project at the time of note creation
- **Recently used** repos/projects appear at top of picker
- **Quick Create Mode**: If user sets a default repo, show "Quick Create" button
  - Clicking "Quick Create" skips picker, uses default repo + labels
  - Clicking "Choose Repository" opens full picker
- Cache repository/project lists for performance (refresh every 24h or on demand)
- Search/filter functionality in pickers for large repo lists

**UI Enhancement - Destination Chooser with Quick Create:**
```
┌─────────────────────────────────────────┐
│ 📝 Where should this note go?           │
├─────────────────────────────────────────┤
│                                         │
│ GitHub                                  │
│ ┌─────────────────────────────────────┐ │
│ │ ⚡ Quick Create Issue                │ │
│ │    in DavinciDreams/duly-noted      │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ 📂 Choose Different Repository...   │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 📊 Create Project Item...           │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Other Destinations                      │
│ ┌─────────────────────────────────────┐ │
│ │ 💾 Save as Draft                    │ │
│ │ 📝 OneNote                          │ │
│ │ 🗒️  Notion                           │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### 2. Draft Management
- Should archived drafts be **hidden by default** or shown in a separate section?
- Should there be a **bulk delete** option?
- Should drafts have **expiration** (auto-delete after X days)?

### 3. Transcription Features
- Which **languages** should we prioritize? (Top 5-10)
- Should we add **custom voice commands** (e.g., "period", "comma")?
- Should we support **recording pause/resume**?

### 4. UI/UX Preferences
- Should GitHub destination show **repo picker** or **quick create** with default repo?
- Should we add **keyboard shortcuts** for common actions?
- Should destination chooser be **modal** or **screen** (current approach)?

### 5. Future Integrations Priority
After GitHub, what's next?
- OneNote integration?
- LLM chat for note refinement?
- Export to markdown/text file?
- Sync across devices?

## Success Criteria

Phase 2 is complete when:
- ✅ User can create GitHub Issues from voice notes
- ✅ User can add items to GitHub Projects
- ✅ Drafts can be edited and promoted
- ✅ All features work reliably with error handling
- ✅ Settings persist correctly
- ✅ Documentation updated
- ✅ No regressions in Phase 1 features

## Risk Assessment

### Technical Risks
1. **GitHub API Rate Limits**: 5000 requests/hour (authenticated)
   - Mitigation: Cache repository/project lists

2. **Token Security**: PAT stored in chrome.storage.local
   - Mitigation: Warn users, consider encryption

3. **GraphQL Complexity**: Projects v2 API is complex
   - Mitigation: Start with basic features, iterate

### UX Risks
1. **Too Many Steps**: Creating an issue might feel slow
   - Mitigation: Smart defaults, quick create option

2. **Permission Confusion**: GitHub scopes can be confusing
   - Mitigation: Clear instructions, error messages

## Next Steps

**Ready to proceed?** Please review and provide feedback on:

1. **Open Questions** - Your preferences for scope and features
2. **Implementation Order** - Should we adjust the week-by-week plan?
3. **Any Additional Features** - What am I missing?
4. **Potential Changes** - You mentioned you have some - let's discuss!

---

**Document Version**: 1.0
**Created**: 2026-02-14
**Status**: Draft - Awaiting User Input
