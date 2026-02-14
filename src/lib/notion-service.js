/**
 * Notion API Service
 * Wrapper for Notion API operations
 */

import { OAuthService } from './oauth-service.js';

export class NotionService {
  /**
   * Make authenticated request to Notion API
   * @param {string} endpoint - API endpoint (e.g., '/v1/pages')
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} API response
   */
  static async request(endpoint, options = {}) {
    const { notionToken } = await OAuthService.getTokens('notion');

    if (!notionToken) {
      throw new Error('Not authenticated with Notion. Please sign in first.');
    }

    const url = endpoint.startsWith('http')
      ? endpoint
      : `https://api.notion.com${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${notionToken}`,
        'Notion-Version': '2022-06-28', // Required Notion API version header
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Notion API error: ${response.status} - ${errorData.message || errorData.code || 'Unknown error'}`
      );
    }

    return response.json();
  }

  /**
   * Search for pages in the workspace
   * @param {string} query - Search query (optional)
   * @param {Object} filter - Filter options
   * @returns {Promise<Array>} Array of pages
   */
  static async searchPages(query = '', filter = {}) {
    const body = {
      filter: {
        property: 'object',
        value: 'page',
        ...filter
      }
    };

    if (query) {
      body.query = query;
    }

    const response = await this.request('/v1/search', {
      method: 'POST',
      body: JSON.stringify(body)
    });

    return response.results || [];
  }

  /**
   * Get list of databases in the workspace
   * @returns {Promise<Array>} Array of databases
   */
  static async getDatabases() {
    const response = await this.request('/v1/search', {
      method: 'POST',
      body: JSON.stringify({
        filter: {
          property: 'object',
          value: 'database'
        }
      })
    });

    return response.results || [];
  }

  /**
   * Create a new page in Notion
   * @param {Object} pageData - Page data
   * @param {string} pageData.parent - Parent page/database ID or object
   * @param {Object} pageData.properties - Page properties
   * @param {Array} pageData.children - Page content blocks (optional)
   * @returns {Promise<Object>} Created page object
   */
  static async createPage(pageData) {
    const { parent, properties, children } = pageData;

    const body = {
      parent: typeof parent === 'string'
        ? { page_id: parent }
        : parent,
      properties: properties || {}
    };

    // Add content blocks if provided
    if (children && children.length > 0) {
      body.children = children;
    }

    return this.request('/v1/pages', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  /**
   * Create a page with text content
   * @param {string} parentId - Parent page or database ID
   * @param {string} title - Page title
   * @param {string} content - Page content (plain text)
   * @returns {Promise<Object>} Created page object
   */
  static async createTextPage(parentId, title, content) {
    const pageData = {
      parent: { page_id: parentId },
      properties: {
        title: {
          title: [
            {
              text: {
                content: title
              }
            }
          ]
        }
      },
      children: [
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: content
                }
              }
            ]
          }
        }
      ]
    };

    return this.createPage(pageData);
  }

  /**
   * Create a database entry (for databases with custom properties)
   * @param {string} databaseId - Database ID
   * @param {Object} properties - Entry properties
   * @param {Array} children - Entry content blocks (optional)
   * @returns {Promise<Object>} Created database entry
   */
  static async createDatabaseEntry(databaseId, properties, children = []) {
    const pageData = {
      parent: { database_id: databaseId },
      properties: properties
    };

    if (children.length > 0) {
      pageData.children = children;
    }

    return this.createPage(pageData);
  }

  /**
   * Append blocks to a page
   * @param {string} pageId - Page ID
   * @param {Array} blocks - Array of block objects
   * @returns {Promise<Object>} Response with appended blocks
   */
  static async appendBlocks(pageId, blocks) {
    return this.request(`/v1/blocks/${pageId}/children`, {
      method: 'PATCH',
      body: JSON.stringify({ children: blocks })
    });
  }

  /**
   * Get user info (bot user)
   * @returns {Promise<Object>} User object
   */
  static async getUser() {
    const { notionWorkspace } = await chrome.storage.local.get('notionWorkspace');
    if (!notionWorkspace?.botId) {
      throw new Error('No bot ID found in workspace info');
    }

    return this.request(`/v1/users/${notionWorkspace.botId}`);
  }
}
