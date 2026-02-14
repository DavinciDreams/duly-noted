/**
 * OAuth Callback Handler
 * Processes OAuth redirect and exchanges code for token
 */

import { GitHubOAuth } from '../lib/github-oauth.js';

// UI elements
const spinner = document.getElementById('spinner');
const icon = document.getElementById('icon');
const title = document.getElementById('title');
const message = document.getElementById('message');
const errorDetails = document.getElementById('error-details');

/**
 * Show success UI
 */
function showSuccess(username) {
  spinner.style.display = 'none';
  icon.style.display = 'block';
  icon.textContent = '✓';
  icon.className = 'icon success';
  title.textContent = 'Authorization Successful!';
  message.textContent = `Connected as @${username}`;
}

/**
 * Show error UI
 */
function showError(errorMessage) {
  spinner.style.display = 'none';
  icon.style.display = 'block';
  icon.textContent = '✗';
  icon.className = 'icon error';
  title.textContent = 'Authorization Failed';
  message.textContent = 'Something went wrong during authorization.';
  errorDetails.style.display = 'block';
  errorDetails.textContent = errorMessage;
}

/**
 * Parse URL parameters
 */
function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    code: params.get('code'),
    state: params.get('state'),
    error: params.get('error'),
    error_description: params.get('error_description')
  };
}

/**
 * Main callback handler
 */
async function handleCallback() {
  try {
    const params = getUrlParams();

    // Check for OAuth errors
    if (params.error) {
      throw new Error(params.error_description || params.error);
    }

    // Validate required parameters
    if (!params.code || !params.state) {
      throw new Error('Missing authorization code or state parameter');
    }

    console.log('[OAuthCallback] Processing authorization code');

    // Exchange code for token via GitHub OAuth service
    const result = await GitHubOAuth.handleCallback(params.code, params.state);

    // Show success
    showSuccess(result.user.login);

    // Notify the extension that authorization is complete
    chrome.runtime.sendMessage({
      type: 'GITHUB_AUTH_SUCCESS',
      username: result.user.login
    });

    // Auto-close after 2 seconds
    setTimeout(() => {
      window.close();
    }, 2000);

  } catch (error) {
    console.error('[OAuthCallback] Error:', error);
    showError(error.message);

    // Notify the extension of the error
    chrome.runtime.sendMessage({
      type: 'GITHUB_AUTH_ERROR',
      error: error.message
    });

    // Auto-close after 5 seconds on error
    setTimeout(() => {
      window.close();
    }, 5000);
  }
}

// Run callback handler when page loads
handleCallback();
