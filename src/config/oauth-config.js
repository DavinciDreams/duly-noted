/**
 * OAuth Configuration
 * Client IDs are public (used in authorization URLs).
 * Client secrets are stored server-side in the Cloudflare Worker proxy.
 */

// OAuth proxy worker URL — handles token exchange with secrets injected server-side
// TODO: Update this after deploying the worker
export const OAUTH_WORKER_URL = 'https://duly-noted-auth.agentstarter.workers.dev';

// GitHub OAuth Configuration
export const GITHUB_OAUTH_CONFIG = {
  clientId: '7113cf472be91f945d03',
  authUrl: 'https://github.com/login/oauth/authorize',
  apiUrl: 'https://api.github.com',
  scopes: ['repo', 'project', 'read:user']
};

// Google OAuth Configuration (future)
export const GOOGLE_OAUTH_CONFIG = {
  clientId: '',
  authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  scopes: ['https://www.googleapis.com/auth/userinfo.email']
};

// Notion OAuth Configuration
export const NOTION_OAUTH_CONFIG = {
  clientId: '307d872b-594c-80ef-ae04-0037a61b9472',
  authUrl: 'https://api.notion.com/v1/oauth/authorize',
  scopes: []
};

/**
 * Validate that required OAuth config is present
 * @param {string} provider - Provider name (github, google, notion)
 * @returns {boolean} True if config is valid
 */
export function validateOAuthConfig(provider) {
  const configs = {
    github: GITHUB_OAUTH_CONFIG,
    google: GOOGLE_OAUTH_CONFIG,
    notion: NOTION_OAUTH_CONFIG
  };

  const config = configs[provider];
  if (!config) {
    console.error(`[OAuth Config] Unknown provider: ${provider}`);
    return false;
  }

  if (!config.clientId || config.clientId.startsWith('YOUR_')) {
    console.error(`[OAuth Config] Missing ${provider} client ID`);
    return false;
  }

  return true;
}
