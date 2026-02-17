/**
 * Duly Noted OAuth Proxy Worker
 * Proxies OAuth token exchanges with secrets injected server-side.
 *
 * Environment variables (set via `wrangler secret put`):
 *   GITHUB_CLIENT_ID
 *   GITHUB_CLIENT_SECRET
 *   NOTION_CLIENT_ID
 *   NOTION_CLIENT_SECRET
 *   ALLOWED_EXTENSION_IDS   (comma-separated list of Chrome extension IDs)
 */

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return handleCors(request);
    }

    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    // Validate origin when present (extensions send chrome-extension:// origin)
    const origin = request.headers.get('Origin') || '';
    if (origin && !origin.startsWith('chrome-extension://')) {
      return jsonResponse({ error: 'Forbidden' }, 403);
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON body' }, 400);
    }

    // Validate redirect_uri against allowed extension IDs
    if (body.redirect_uri) {
      if (!validateRedirectUri(body.redirect_uri, env.ALLOWED_EXTENSION_IDS)) {
        return jsonResponse({ error: 'Invalid redirect_uri' }, 403);
      }
    }

    // Route to handler
    const url = new URL(request.url);
    try {
      switch (url.pathname) {
        case '/api/github/token':
          return await handleGitHubToken(body, env);
        case '/api/github/refresh':
          return await handleGitHubRefresh(body, env);
        case '/api/notion/token':
          return await handleNotionToken(body, env);
        default:
          return jsonResponse({ error: 'Not found' }, 404);
      }
    } catch (err) {
      console.error('Worker error:', err);
      return jsonResponse({ error: 'Internal server error' }, 500);
    }
  }
};

/**
 * Validate that redirect_uri belongs to an allowed extension ID
 */
function validateRedirectUri(redirectUri, allowedIds) {
  if (!allowedIds) return false;
  const ids = allowedIds.split(',').map(id => id.trim());
  return ids.some(id => redirectUri === `https://${id}.chromiumapp.org/`);
}

/**
 * GitHub: Exchange authorization code for access token
 */
async function handleGitHubToken(body, env) {
  if (!body.code) {
    return jsonResponse({ error: 'Missing code' }, 400);
  }

  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code: body.code,
      redirect_uri: body.redirect_uri,
      grant_type: 'authorization_code'
    })
  });

  const data = await response.json();
  return jsonResponse(data, response.ok ? 200 : response.status);
}

/**
 * GitHub: Refresh an expired access token
 */
async function handleGitHubRefresh(body, env) {
  if (!body.refresh_token) {
    return jsonResponse({ error: 'Missing refresh_token' }, 400);
  }

  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      refresh_token: body.refresh_token,
      grant_type: 'refresh_token'
    })
  });

  const data = await response.json();
  return jsonResponse(data, response.ok ? 200 : response.status);
}

/**
 * Notion: Exchange authorization code for access token
 * Notion uses Basic Auth: base64(client_id:client_secret)
 */
async function handleNotionToken(body, env) {
  if (!body.code) {
    return jsonResponse({ error: 'Missing code' }, 400);
  }

  const credentials = btoa(`${env.NOTION_CLIENT_ID}:${env.NOTION_CLIENT_SECRET}`);

  const response = await fetch('https://api.notion.com/v1/oauth/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code: body.code,
      redirect_uri: body.redirect_uri
    })
  });

  const data = await response.json();
  return jsonResponse(data, response.ok ? 200 : response.status);
}

/**
 * Handle CORS preflight for extension fetch requests
 */
function handleCors(request) {
  const origin = request.headers.get('Origin') || '';
  const headers = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
  };
  if (origin.startsWith('chrome-extension://')) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return new Response(null, { status: 204, headers });
}

/**
 * Create a JSON response with CORS headers
 */
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
