/**
 * Notion OAuth Implementation
 * Handles Notion-specific OAuth 2.0 flow
 */

import { OAuthService } from './oauth-service.js';
import { NOTION_OAUTH_CONFIG as NOTION_CONFIG, validateOAuthConfig } from '../config/oauth-config.js';

export class NotionOAuth {
  /**
   * Get redirect URI for OAuth callback
   * For chrome.identity.launchWebAuthFlow, use the chromiumapp.org format
   * @returns {string} Redirect URI
   */
  static getRedirectUri() {
    // Get the extension ID
    const extensionId = chrome.runtime.id;
    // Use the chromiumapp.org format required by launchWebAuthFlow
    return `https://${extensionId}.chromiumapp.org/`;
  }

  /**
   * Initiate Notion OAuth flow
   * Uses chrome.identity.launchWebAuthFlow for proper OAuth handling
   * @returns {Promise<Object>} User data with token
   */
  static async authorize() {
    try {
      // Validate OAuth configuration
      if (!validateOAuthConfig('notion')) {
        throw new Error('Notion OAuth is not configured. Please add credentials to .env file.');
      }

      // Generate and store state for CSRF protection
      const state = OAuthService.generateState();
      await chrome.storage.local.set({ notionOAuthState: state });

      // Build authorization URL with Notion-specific parameters
      const params = new URLSearchParams({
        client_id: NOTION_CONFIG.clientId,
        redirect_uri: this.getRedirectUri(),
        response_type: 'code',
        owner: 'user',
        state: state
      });

      const authUrl = `${NOTION_CONFIG.authUrl}?${params.toString()}`;

      console.log('[NotionOAuth] Launching web auth flow');

      // Launch OAuth flow using Chrome Identity API
      const redirectUrl = await OAuthService.launchWebAuthFlow(authUrl);

      // Parse the redirect URL to extract code and state
      const url = new URL(redirectUrl);
      const code = url.searchParams.get('code');
      const returnedState = url.searchParams.get('state');
      const error = url.searchParams.get('error');

      if (error) {
        throw new Error(`OAuth error: ${error}`);
      }

      if (!code || !returnedState) {
        throw new Error('Missing authorization code or state in redirect URL');
      }

      // Handle the callback (exchange code for token)
      const result = await this.handleCallback(code, returnedState);

      console.log('[NotionOAuth] Authorization successful');
      return result;
    } catch (error) {
      console.error('[NotionOAuth] Authorization failed:', error);
      throw error;
    }
  }

  /**
   * Handle OAuth callback with authorization code
   * @param {string} code - Authorization code from Notion
   * @param {string} state - State parameter for CSRF validation
   * @returns {Promise<Object>} User data and token
   */
  static async handleCallback(code, state) {
    try {
      // Verify state
      const { notionOAuthState } = await chrome.storage.local.get('notionOAuthState');
      if (state !== notionOAuthState) {
        throw new Error('Invalid state parameter - possible CSRF attack');
      }

      // Exchange code for access token using Basic Auth
      // Notion requires base64(client_id:client_secret) in Authorization header
      const credentials = btoa(`${NOTION_CONFIG.clientId}:${NOTION_CONFIG.clientSecret}`);

      const response = await fetch(NOTION_CONFIG.tokenUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: this.getRedirectUri()
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Token exchange failed: ${response.status} ${errorData.error || ''}`);
      }

      const tokenData = await response.json();

      // Notion returns: access_token, bot_id, workspace_id, workspace_name, workspace_icon, owner
      const {
        access_token,
        bot_id,
        workspace_id,
        workspace_name,
        workspace_icon,
        owner
      } = tokenData;

      // Store token
      await OAuthService.storeTokens('notion', {
        accessToken: access_token,
        tokenExpiry: null, // Notion tokens don't expire
        refreshToken: null,
        botId: bot_id,
        workspaceId: workspace_id
      });

      // Store workspace info
      await chrome.storage.local.set({
        notionWorkspace: {
          id: workspace_id,
          name: workspace_name,
          icon: workspace_icon,
          botId: bot_id
        }
      });

      console.log('[NotionOAuth] Token stored successfully');

      // Return user/workspace data
      return {
        workspace: {
          id: workspace_id,
          name: workspace_name,
          icon: workspace_icon
        },
        owner: owner,
        botId: bot_id
      };
    } catch (error) {
      console.error('[NotionOAuth] Callback handling failed:', error);
      throw error;
    }
  }

  /**
   * Check if user is currently authenticated
   * @returns {Promise<boolean>} True if authenticated with valid token
   */
  static async isAuthenticated() {
    const { notionToken } = await OAuthService.getTokens('notion');
    // Notion tokens don't expire, so just check if token exists
    return !!notionToken;
  }

  /**
   * Sign out and clear stored tokens
   * @returns {Promise<void>}
   */
  static async signOut() {
    await OAuthService.clearTokens('notion');
    await chrome.storage.local.remove(['notionOAuthState', 'notionWorkspace']);
    console.log('[NotionOAuth] User signed out');
  }

  /**
   * Get current workspace info
   * @returns {Promise<Object|null>} Workspace data or null if not authenticated
   */
  static async getWorkspaceInfo() {
    const isAuth = await this.isAuthenticated();
    if (!isAuth) return null;

    const { notionWorkspace } = await chrome.storage.local.get('notionWorkspace');
    return notionWorkspace || null;
  }
}
