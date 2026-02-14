/**
 * GitHub OAuth Implementation
 * Handles GitHub-specific OAuth 2.0 flow
 */

import { OAuthService } from './oauth-service.js';
import { GITHUB_OAUTH_CONFIG as GITHUB_CONFIG, validateOAuthConfig } from '../config/oauth-config.js';

export class GitHubOAuth {
  /**
   * Get redirect URI for OAuth callback
   * @returns {string} Redirect URI
   */
  static getRedirectUri() {
    return chrome.runtime.getURL('src/oauth/oauth-callback.html');
  }

  /**
   * Initiate GitHub OAuth flow
   * Uses chrome.identity.launchWebAuthFlow for proper OAuth handling
   * @returns {Promise<Object>} User data with token
   */
  static async authorize() {
    try {
      // Validate OAuth configuration
      if (!validateOAuthConfig('github')) {
        throw new Error('GitHub OAuth is not configured. Please add credentials to .env file.');
      }

      // Generate and store state for CSRF protection
      const state = OAuthService.generateState();
      await chrome.storage.local.set({ githubOAuthState: state });

      // Build authorization URL
      const authUrl = OAuthService.buildAuthUrl({
        authUrl: GITHUB_CONFIG.authUrl,
        clientId: GITHUB_CONFIG.clientId,
        redirectUri: this.getRedirectUri(),
        scopes: GITHUB_CONFIG.scopes,
        state: state
      });

      console.log('[GitHubOAuth] Launching web auth flow');

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

      console.log('[GitHubOAuth] Authorization successful');
      return result;
    } catch (error) {
      console.error('[GitHubOAuth] Authorization failed:', error);
      throw error;
    }
  }

  /**
   * Handle OAuth callback with authorization code
   * @param {string} code - Authorization code from GitHub
   * @param {string} state - State parameter for CSRF validation
   * @returns {Promise<Object>} User data with token
   */
  static async handleCallback(code, state) {
    try {
      // Verify state to prevent CSRF
      const { githubOAuthState } = await chrome.storage.local.get('githubOAuthState');
      if (state !== githubOAuthState) {
        throw new Error('Invalid state parameter - possible CSRF attack');
      }

      // Exchange code for token
      const tokenData = await OAuthService.exchangeCodeForToken({
        tokenUrl: GITHUB_CONFIG.tokenUrl,
        code: code,
        clientId: GITHUB_CONFIG.clientId,
        clientSecret: GITHUB_CONFIG.clientSecret,
        redirectUri: this.getRedirectUri()
      });

      // Store tokens
      await OAuthService.storeTokens('github', tokenData);

      // Fetch user info
      const userData = await this.getUserInfo(tokenData.access_token);

      // Store username
      await chrome.storage.local.set({
        githubUsername: userData.login
      });

      // Clean up state
      await chrome.storage.local.remove('githubOAuthState');

      console.log('[GitHubOAuth] Authentication successful:', userData.login);
      return { token: tokenData.access_token, user: userData };
    } catch (error) {
      console.error('[GitHubOAuth] Callback handling failed:', error);
      throw error;
    }
  }

  /**
   * Get authenticated user information
   * @param {string} token - Access token
   * @returns {Promise<Object>} User data
   */
  static async getUserInfo(token) {
    const response = await fetch(`${GITHUB_CONFIG.apiUrl}/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user info: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Check if user is currently authenticated
   * @returns {Promise<boolean>} True if authenticated with valid token
   */
  static async isAuthenticated() {
    const { githubToken, githubTokenExpiry } = await OAuthService.getTokens('github');

    if (!githubToken) return false;

    // Check if token is expired
    if (OAuthService.isTokenExpired(githubTokenExpiry)) {
      // Try to refresh token
      const refreshed = await this.refreshTokenIfNeeded();
      return refreshed;
    }

    return true;
  }

  /**
   * Refresh GitHub token if needed
   * @returns {Promise<boolean>} True if token is valid after refresh
   */
  static async refreshTokenIfNeeded() {
    const { githubToken, githubTokenExpiry, githubRefreshToken } =
      await OAuthService.getTokens('github');

    // If no token, not authenticated
    if (!githubToken) return false;

    // If not expired, token is still valid
    if (!OAuthService.isTokenExpired(githubTokenExpiry)) return true;

    // If no refresh token, cannot refresh
    if (!githubRefreshToken) {
      console.warn('[GitHubOAuth] Token expired but no refresh token available');
      return false;
    }

    try {
      // Refresh the token
      const tokenData = await OAuthService.refreshToken({
        tokenUrl: GITHUB_CONFIG.tokenUrl,
        refreshToken: githubRefreshToken,
        clientId: GITHUB_CONFIG.clientId,
        clientSecret: GITHUB_CONFIG.clientSecret
      });

      // Store new tokens
      await OAuthService.storeTokens('github', tokenData);
      console.log('[GitHubOAuth] Token refreshed successfully');
      return true;
    } catch (error) {
      console.error('[GitHubOAuth] Token refresh failed:', error);
      return false;
    }
  }

  /**
   * Sign out - clear all GitHub tokens and data
   * @returns {Promise<void>}
   */
  static async signOut() {
    await OAuthService.clearTokens('github');
    // Also clear cached repositories and projects
    await chrome.storage.local.remove([
      'githubRepos',
      'githubReposCachedAt',
      'githubReposRecentlyUsed',
      'githubProjects',
      'githubProjectsCachedAt',
      'githubProjectsRecentlyUsed'
    ]);
    console.log('[GitHubOAuth] Signed out successfully');
  }

  /**
   * Get current access token (refreshes if needed)
   * @returns {Promise<string|null>} Access token or null if not authenticated
   */
  static async getAccessToken() {
    const isAuth = await this.isAuthenticated();
    if (!isAuth) return null;

    const { githubToken } = await OAuthService.getTokens('github');
    return githubToken;
  }
}
