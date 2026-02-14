/**
 * Generic OAuth 2.0 Service
 * Provides reusable OAuth flow functionality for all providers
 */

export class OAuthService {
  /**
   * Generate a random state parameter for CSRF protection
   * @returns {string} Random state string
   */
  static generateState() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Build OAuth authorization URL
   * @param {Object} config - OAuth configuration
   * @param {string} config.authUrl - Provider's authorization URL
   * @param {string} config.clientId - OAuth client ID
   * @param {string} config.redirectUri - Redirect URI after authorization
   * @param {string[]} config.scopes - Requested permission scopes
   * @param {string} config.state - CSRF state parameter
   * @returns {string} Complete authorization URL
   */
  static buildAuthUrl({ authUrl, clientId, redirectUri, scopes, state }) {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: scopes.join(' '),
      state: state,
      response_type: 'code'
    });
    return `${authUrl}?${params.toString()}`;
  }

  /**
   * Open OAuth popup window
   * @param {string} authUrl - Complete authorization URL
   * @returns {Promise<Window>} Popup window reference
   */
  static async openAuthPopup(authUrl) {
    return chrome.windows.create({
      url: authUrl,
      type: 'popup',
      width: 600,
      height: 700,
      focused: true
    });
  }

  /**
   * Exchange authorization code for access token
   * @param {Object} config - Token exchange configuration
   * @param {string} config.tokenUrl - Provider's token endpoint
   * @param {string} config.code - Authorization code
   * @param {string} config.clientId - OAuth client ID
   * @param {string} config.clientSecret - OAuth client secret
   * @param {string} config.redirectUri - Redirect URI (must match authorization)
   * @returns {Promise<Object>} Token response
   */
  static async exchangeCodeForToken({ tokenUrl, code, clientId, clientSecret, redirectUri }) {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token exchange failed: ${error}`);
    }

    return response.json();
  }

  /**
   * Refresh an expired access token
   * @param {Object} config - Token refresh configuration
   * @param {string} config.tokenUrl - Provider's token endpoint
   * @param {string} config.refreshToken - Refresh token
   * @param {string} config.clientId - OAuth client ID
   * @param {string} config.clientSecret - OAuth client secret
   * @returns {Promise<Object>} New token response
   */
  static async refreshToken({ tokenUrl, refreshToken, clientId, clientSecret }) {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token refresh failed: ${error}`);
    }

    return response.json();
  }

  /**
   * Store OAuth tokens securely in chrome.storage.local
   * @param {string} provider - Provider name (e.g., 'github', 'google')
   * @param {Object} tokenData - Token data to store
   */
  static async storeTokens(provider, tokenData) {
    const storageKey = `${provider}Token`;
    const data = {
      [storageKey]: tokenData.access_token,
      [`${provider}TokenExpiry`]: tokenData.expires_in
        ? Date.now() + (tokenData.expires_in * 1000)
        : null,
      [`${provider}RefreshToken`]: tokenData.refresh_token || null
    };

    await chrome.storage.local.set(data);
    console.log(`[OAuthService] Stored ${provider} tokens`);
  }

  /**
   * Retrieve OAuth tokens from storage
   * @param {string} provider - Provider name
   * @returns {Promise<Object>} Token data
   */
  static async getTokens(provider) {
    const keys = [
      `${provider}Token`,
      `${provider}TokenExpiry`,
      `${provider}RefreshToken`,
      `${provider}Username`
    ];
    return chrome.storage.local.get(keys);
  }

  /**
   * Clear OAuth tokens for a provider
   * @param {string} provider - Provider name
   */
  static async clearTokens(provider) {
    const keys = [
      `${provider}Token`,
      `${provider}TokenExpiry`,
      `${provider}RefreshToken`,
      `${provider}Username`
    ];
    await chrome.storage.local.remove(keys);
    console.log(`[OAuthService] Cleared ${provider} tokens`);
  }

  /**
   * Check if a token is expired or about to expire
   * @param {number} expiry - Token expiry timestamp
   * @param {number} bufferSeconds - Seconds before expiry to consider expired (default: 300)
   * @returns {boolean} True if token is expired or about to expire
   */
  static isTokenExpired(expiry, bufferSeconds = 300) {
    if (!expiry) return false;
    return Date.now() >= (expiry - (bufferSeconds * 1000));
  }
}
