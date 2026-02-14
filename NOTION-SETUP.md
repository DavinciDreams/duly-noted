# Notion Integration Setup Guide

This guide walks you through setting up the Notion integration for the Voice Starter extension.

## Prerequisites

- A Notion account (free or paid)
- Chrome browser with extension developer mode enabled
- The Voice Starter extension loaded in Chrome

## Step 1: Create a Notion Integration

1. **Go to Notion Integrations**
   - Visit: https://www.notion.so/my-integrations
   - Click "New integration" or "+ Create new integration"

2. **Configure the Integration**
   - **Integration type**: Select "Public" (for OAuth)
   - **Name**: "Voice Starter" or any name you prefer
   - **Logo**: (Optional) Upload a logo
   - **Organization/Workspace**: Select your workspace

3. **Set OAuth Configuration**
   - **Redirect URI**: This is CRITICAL and must match exactly
   - Format: `https://[YOUR_EXTENSION_ID].chromiumapp.org/`
   - Example: `https://mhichihooaoppodidfoipflnlljkjcpa.chromiumapp.org/`

   **How to find your Extension ID:**
   - Open Chrome and navigate to `chrome://extensions`
   - Enable "Developer mode" (toggle in top-right)
   - Find "Voice Starter" extension
   - Copy the ID (e.g., `mhichihooaoppodidfoipflnlljkjcpa`)

4. **Set Capabilities**
   Under "Capabilities", enable:
   - ✅ **Read content** - To search for pages and databases
   - ✅ **Update content** - To modify pages if needed
   - ✅ **Insert content** - To create new pages

5. **User information**
   (Optional) Enable if you want user profile access:
   - ☐ User information (email addresses)

6. **Submit Integration**
   - Click "Submit" or "Save changes"
   - You should now see your **Client ID** and **Client Secret**

## Step 2: Get OAuth Credentials

After creating the integration:

1. **Copy Client ID**
   - In the integration settings, find "OAuth Domain & URIs"
   - Copy the **Client ID** (looks like: `12345678-abcd-1234-abcd-123456789abc`)

2. **Copy Client Secret**
   - Click "Show" next to **Client Secret**
   - Copy the secret (starts with `secret_`)
   - ⚠️ **IMPORTANT**: Keep this secret safe! Never commit it to public repositories.

## Step 3: Configure the Extension

1. **Locate the Extension Directory**
   - Find where you cloned/downloaded the extension
   - Navigate to the `notion-integration` directory

2. **Create .env File**
   ```bash
   cd notion-integration
   cp .env.example .env
   ```

3. **Edit .env File**
   Open `.env` in a text editor and update:
   ```env
   NOTION_CLIENT_ID=your_actual_client_id_here
   NOTION_CLIENT_SECRET=your_actual_secret_here
   ```

4. **Build Configuration**
   Run the build script to generate runtime config:
   ```bash
   npm run build:config
   ```

   This creates `src/config/runtime-config.js` with your credentials.

## Step 4: Reload the Extension

1. **Open Chrome Extensions**
   - Navigate to `chrome://extensions`
   - Find "Voice Starter" extension

2. **Reload Extension**
   - Click the "Reload" icon (🔄) on the extension card
   - This loads the new OAuth configuration

## Step 5: Connect Your Notion Workspace

1. **Open Voice Starter Extension**
   - Click the extension icon in Chrome toolbar
   - Or use keyboard shortcut (if configured)

2. **Go to Settings**
   - Click the ⚙️ Settings button

3. **Sign in to Notion**
   - Scroll to "📝 Notion Integration" section
   - Click "Sign in with Notion" button

4. **Authorize the Extension**
   - A Notion OAuth popup will open
   - Select the workspace you want to connect
   - Click "Select pages" to choose which pages the integration can access
   - Click "Allow access"

5. **Verify Connection**
   - The popup should close automatically
   - You should see "Connected via OAuth" with your workspace name
   - The Notion destination button should now be enabled

## Step 6: Test the Integration

1. **Record a Voice Note**
   - Click "Start Recording" in the extension
   - Speak your note
   - Click "Stop & Send"

2. **Send to Notion**
   - Select "Notion" as the destination
   - The note will be sent to the first available database or page in your workspace

3. **Verify in Notion**
   - Open your Notion workspace
   - Check the database or page where the note was created
   - You should see a new page with your transcribed note

## Troubleshooting

### "Failed to sign in" Error

**Possible causes:**
1. **Incorrect Redirect URI**
   - Verify your redirect URI in Notion integration settings
   - Format: `https://[EXTENSION_ID].chromiumapp.org/`
   - Must end with trailing slash `/`

2. **OAuth Not Configured**
   - Make sure `.env` file exists with valid credentials
   - Run `npm run build:config` after updating `.env`
   - Reload extension in `chrome://extensions`

3. **Extension ID Changed**
   - If you reinstalled the extension, the ID might change
   - Update redirect URI in Notion integration settings
   - Update `.env` if needed

### "No databases or pages found" Error

**Solution:**
- Your Notion integration needs access to at least one page or database
- In Notion, go to any page → Click "..." → "Add connections" → Select your integration
- Or create a new database and grant access to the integration

### Notion Button Still Disabled

**Possible causes:**
1. **Not signed in**
   - Click "Sign in with Notion" in Settings

2. **OAuth credentials invalid**
   - Check `.env` file has correct credentials
   - Run `npm run build:config`
   - Reload extension

3. **Browser cache issue**
   - Clear extension storage:
     - Open Chrome DevTools (F12)
     - Go to Application → Storage → Clear site data
   - Reload extension

## Security Best Practices

1. **Never commit `.env` file**
   - The `.gitignore` already excludes it
   - Double-check before committing code

2. **Regenerate secrets if exposed**
   - If you accidentally commit secrets, regenerate them in Notion:
   - Go to integration settings → "Generate new secret"

3. **Use different credentials for dev/prod**
   - Create separate integrations for development and production
   - Never use production credentials in testing

## Advanced Configuration

### Changing Default Target

Currently, notes are sent to the first available database or page. To customize:

1. Edit `src/sidepanel/sidepanel.js`
2. Find `handleNotionDestination()` function
3. Modify the logic to select your preferred target

### Adding Database/Page Picker UI

For future enhancement, implement a picker UI:
1. Fetch databases/pages with `NotionService.getDatabases()` and `NotionService.searchPages()`
2. Display in a modal or dropdown
3. Let user select before sending

## API Documentation

For advanced customization, refer to:
- [Notion API Documentation](https://developers.notion.com/)
- [Notion OAuth Guide](https://developers.notion.com/docs/authorization)
- [Notion API Reference](https://developers.notion.com/reference/intro)

## Support

If you encounter issues:
1. Check this guide's troubleshooting section
2. Review the [Phase 2 Plan](PHASE-2-PLAN.md) for implementation details
3. Open an issue on GitHub with:
   - Error message
   - Steps to reproduce
   - Chrome version
   - Extension version

---

**Last Updated:** 2026-02-14
**Version:** 1.0
