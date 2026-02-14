# Testing Notion Integration - Quick Guide

## ✅ Merge Complete + Bug Fixed!

The Notion integration has been successfully merged into the master branch.

**Status:**
- ✅ Merged locally to master
- ✅ Bug fixed: Token storage mismatch (OAuth was storing tokens with wrong property names)
- ❌ NOT pushed to GitHub yet (waiting for your testing)
- 📍 Extension ID: `mhichihooaoppodidfoipflnlljkjcpa` (the one beginning with 'm')

**⚠️ IMPORTANT: You need to re-authenticate with Notion after reloading**
The bug was in how tokens were stored. Your previous OAuth session stored the token incorrectly, so you'll need to sign in again.

---

## Step 1: Reload the Extension

1. Go to `chrome://extensions`
2. Find "Voice Starter" with path: `C:\Users\lmwat\extension\voice starter`
3. Click the **reload button** 🔄
4. Verify extension ID is still: `mhichihooaoppodidfoipflnlljkjcpa`

---

## Step 2: Re-Authenticate with Notion (REQUIRED)

⚠️ **Due to the bug fix, you MUST re-authenticate:**

1. Open Voice Starter extension
2. Click Settings ⚙️
3. Scroll to "📝 Notion Integration"
4. You will see "Not connected" (this is expected due to the bug fix)
5. Click **"Sign in with Notion"**
6. Authorize in the popup window
7. You should now see: **"Connected via OAuth"** with your workspace name

---

## Step 3: Test Note Sending to Notion

### Prerequisites:
- ✅ Notion OAuth connected
- ✅ At least ONE database or page exists in your workspace
- ✅ Integration has access to the database/page

### Testing Steps:

1. **Record a voice note:**
   - Click "Start Recording"
   - Say something like: "This is a test note for Notion integration"
   - Click "Stop & Send"

2. **Select Notion destination:**
   - Click the **"Notion"** button
   - Should show: "📓 Notion - Knowledge base"
   - Button should be ENABLED (not grayed out)

3. **Watch for success:**
   - Should see toast: "Note sent to Notion (Database Name)!"
   - Extension should return to recording screen
   - Recent notes should update

4. **Verify in Notion:**
   - Open your Notion workspace
   - Check the database (or page)
   - You should see a new page with:
     - Title: "This is a test note for Notion integration" (first line)
     - Content: Full transcription

5. **Check History:**
   - In extension, go to "View All History"
   - Should see the note with Notion icon 📓
   - Click on it → should open the Notion page in new tab

---

## Expected Behavior

### ✅ Success Case:
```
1. Select "Notion" → Processing...
2. Toast: "Note sent to Notion (Your Database)!"
3. Returns to recording screen
4. Note appears in Notion workspace
5. Note appears in history with clickable link
```

### ❌ If No Databases Found:
```
Toast: "No databases or pages found in your Notion workspace.
Please create a database or page first."
```

**Solution:**
- Create a database in Notion
- OR grant integration access to existing pages:
  - In Notion, go to page → "..." → "Add connections" → Select your integration

### ❌ If OAuth Not Connected:
```
Button is grayed out with badge: "Not configured"
```

**Solution:**
- Go to Settings
- Click "Sign in with Notion"
- Authorize workspace

---

## What to Test

### Test Case 1: Send to Database
- [ ] Note creates page in database
- [ ] Title matches first line
- [ ] Content is full transcription
- [ ] Page has correct formatting

### Test Case 2: Send to Page (if no database)
- [ ] Note creates child page
- [ ] Title and content correct
- [ ] Shows up under parent page

### Test Case 3: History Tracking
- [ ] Note appears in "Recent Notes"
- [ ] Note appears in "View All History"
- [ ] Shows Notion icon 📓
- [ ] Clicking opens Notion page in new tab
- [ ] Shows destination info in history

### Test Case 4: Multiple Notes
- [ ] Send 3-5 notes in a row
- [ ] All appear in Notion
- [ ] All appear in history
- [ ] No duplicates or errors

### Test Case 5: Long Content
- [ ] Record a long note (30+ seconds)
- [ ] Send to Notion
- [ ] Full content preserved
- [ ] No truncation issues

### Test Case 6: Special Characters
- [ ] Record note with: "Test! @mention #hashtag $dollar 100%"
- [ ] Send to Notion
- [ ] Special characters preserved correctly

---

## Common Issues & Solutions

### Issue 1: "No databases or pages found"

**Cause:** Integration doesn't have access to any pages/databases

**Solution:**
1. In Notion, create a new database
2. OR: Go to existing page → "..." → "Add connections" → Select your integration

### Issue 2: Notion button is disabled

**Cause:** Not authenticated

**Solution:**
1. Go to Settings
2. Click "Sign in with Notion"
3. Complete OAuth flow

### Issue 3: "Failed to send to Notion: [error]"

**Possible causes:**
- Network issue
- Notion API down
- Invalid token (re-authenticate)

**Debug:**
1. Open DevTools (F12)
2. Check Console for error messages
3. Look for network requests to `api.notion.com`

### Issue 4: Note doesn't appear in Notion

**Check:**
1. Wait 10 seconds and refresh Notion
2. Check the correct database/page
3. Check if integration has access
4. Look at DevTools Console for errors

---

## If Everything Works

### Next Step: Push to GitHub

Once you've verified everything works:

```bash
cd "voice starter"
git push origin master
```

This will push both:
- The GitHub integration merge (commit `284bec7`)
- The Notion integration merge (commit `07809bf`)
- And 10 other commits from the notion branch

---

## If Something Breaks

### Rollback Option 1: Undo the Merge (Keep Changes)

```bash
cd "voice starter"
git reset --soft HEAD~1
```

This undoes the merge commit but keeps all the changes.

### Rollback Option 2: Complete Undo

```bash
cd "voice starter"
git reset --hard HEAD~1
```

This completely removes the merge and all changes.

### Rollback Option 3: Keep Working, Fix Later

Just don't push yet. Keep testing and fixing issues.

---

## Extension Information

**Directory:** `C:\Users\lmwat\extension\voice starter`
**Extension ID:** `mhichihooaoppodidfoipflnlljkjcpa`
**Redirect URI:** `https://mhichihooaoppodidfoipflnlljkjcpa.chromiumapp.org/`

**Current State:**
- Branch: `master`
- Commits ahead of origin: 12
- Last commit: `07809bf` (Notion merge)
- Ready to test: ✅
- Ready to push: ⏳ (waiting for your testing)

---

## Quick Test Checklist

- [ ] Extension reloaded
- [ ] Notion OAuth connected
- [ ] Can record voice note
- [ ] Notion button is enabled
- [ ] Can send to Notion
- [ ] Success toast appears
- [ ] Note appears in Notion
- [ ] Note appears in history
- [ ] Clicking history opens Notion page
- [ ] Multiple notes work
- [ ] No errors in DevTools Console

---

**Once all checkboxes are checked, you're ready to push!** 🚀
