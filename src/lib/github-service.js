/**
 * GitHub API Service
 * Provides wrappers for GitHub REST and GraphQL APIs
 */

import { GitHubOAuth } from './github-oauth.js';
import { GitHubCache } from './github-cache.js';

const GITHUB_API_URL = 'https://api.github.com';

export class GitHubService {
  /**
   * Make an authenticated API request to GitHub
   * @param {string} endpoint - API endpoint (without base URL)
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} API response
   */
  static async apiRequest(endpoint, options = {}) {
    const token = await GitHubOAuth.getAccessToken();
    if (!token) {
      throw new Error('Not authenticated with GitHub');
    }

    const url = endpoint.startsWith('http') ? endpoint : `${GITHUB_API_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `GitHub API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Make a GraphQL query to GitHub
   * @param {string} query - GraphQL query
   * @param {Object} variables - Query variables
   * @returns {Promise<Object>} Query result
   */
  static async graphqlRequest(query, variables = {}) {
    const token = await GitHubOAuth.getAccessToken();
    if (!token) {
      throw new Error('Not authenticated with GitHub');
    }

    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query, variables })
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.statusText}`);
    }

    const result = await response.json();
    if (result.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    return result.data;
  }

  /**
   * Fetch all repositories for the authenticated user
   * Uses cache if available and not expired
   * @param {boolean} forceRefresh - Force refresh from API
   * @returns {Promise<Array>} List of repositories
   */
  static async fetchRepositories(forceRefresh = false) {
    // Check cache first
    if (!forceRefresh) {
      const cached = await GitHubCache.getRepositories();
      if (cached) {
        console.log('[GitHubService] Using cached repositories');
        return cached;
      }
    }

    console.log('[GitHubService] Fetching repositories from API');
    const repos = await this.apiRequest('/user/repos?per_page=100&sort=updated');

    // Cache the results
    await GitHubCache.cacheRepositories(repos);

    return repos;
  }

  /**
   * Fetch all projects for the authenticated user (using GraphQL)
   * @param {boolean} forceRefresh - Force refresh from API
   * @returns {Promise<Array>} List of projects
   */
  static async fetchProjects(forceRefresh = false) {
    // Check cache first
    if (!forceRefresh) {
      const cached = await GitHubCache.getProjects();
      if (cached) {
        console.log('[GitHubService] Using cached projects');
        return cached;
      }
    }

    console.log('[GitHubService] Fetching projects from API');

    const query = `
      query {
        viewer {
          projectsV2(first: 100, orderBy: {field: UPDATED_AT, direction: DESC}) {
            nodes {
              id
              title
              url
              shortDescription
              public
            }
          }
        }
      }
    `;

    const data = await this.graphqlRequest(query);
    const projects = data.viewer.projectsV2.nodes.map(project => ({
      id: project.id,
      title: project.title,
      url: project.url,
      description: project.shortDescription,
      public: project.public,
      owner: 'user' // Personal projects
    }));

    // Cache the results
    await GitHubCache.cacheProjects(projects);

    return projects;
  }

  /**
   * Get labels for a specific repository
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @returns {Promise<Array>} List of labels
   */
  static async getRepoLabels(owner, repo) {
    return this.apiRequest(`/repos/${owner}/${repo}/labels`);
  }

  /**
   * Get milestones for a specific repository
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @returns {Promise<Array>} List of milestones
   */
  static async getRepoMilestones(owner, repo) {
    return this.apiRequest(`/repos/${owner}/${repo}/milestones`);
  }

  /**
   * Get assignable users (collaborators) for a repository
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @returns {Promise<Array>} List of assignable users
   */
  static async getRepoAssignees(owner, repo) {
    return this.apiRequest(`/repos/${owner}/${repo}/assignees`);
  }

  /**
   * Create a new issue in a repository
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {Object} issueData - Issue data
   * @param {string} issueData.title - Issue title
   * @param {string} issueData.body - Issue body (markdown)
   * @param {string[]} issueData.labels - Label names
   * @param {string[]} issueData.assignees - Assignee usernames
   * @param {number} issueData.milestone - Milestone number
   * @returns {Promise<Object>} Created issue
   */
  static async createIssue(owner, repo, issueData) {
    console.log(`[GitHubService] Creating issue in ${owner}/${repo}`);

    const issue = await this.apiRequest(`/repos/${owner}/${repo}/issues`, {
      method: 'POST',
      body: JSON.stringify(issueData)
    });

    // Add repository to recently used
    await GitHubCache.addRecentlyUsedRepo(`${owner}/${repo}`);

    return issue;
  }

  /**
   * Create a draft issue in a GitHub Project v2
   * @param {string} projectId - Project ID
   * @param {Object} itemData - Draft issue data
   * @param {string} itemData.title - Issue title
   * @param {string} itemData.body - Issue body (markdown)
   * @returns {Promise<Object>} Created draft issue
   */
  static async createProjectDraftIssue(projectId, itemData) {
    console.log(`[GitHubService] Creating draft issue in project ${projectId}`);

    const mutation = `
      mutation($projectId: ID!, $title: String!, $body: String) {
        addProjectV2DraftIssue(input: {
          projectId: $projectId,
          title: $title,
          body: $body
        }) {
          projectItem {
            id
            content {
              ... on DraftIssue {
                title
                body
              }
            }
          }
        }
      }
    `;

    const data = await this.graphqlRequest(mutation, {
      projectId,
      title: itemData.title,
      body: itemData.body
    });

    // Add project to recently used
    await GitHubCache.addRecentlyUsedProject(projectId);

    return data.addProjectV2DraftIssue.projectItem;
  }

  /**
   * Search repositories by name
   * @param {string} query - Search query
   * @param {Array} repositories - Repository list to search within
   * @returns {Array} Filtered repositories
   */
  static searchRepositories(query, repositories) {
    if (!query) return repositories;

    const lowerQuery = query.toLowerCase();
    return repositories.filter(repo =>
      repo.full_name.toLowerCase().includes(lowerQuery) ||
      repo.name.toLowerCase().includes(lowerQuery) ||
      (repo.description && repo.description.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Search projects by name
   * @param {string} query - Search query
   * @param {Array} projects - Project list to search within
   * @returns {Array} Filtered projects
   */
  static searchProjects(query, projects) {
    if (!query) return projects;

    const lowerQuery = query.toLowerCase();
    return projects.filter(project =>
      project.title.toLowerCase().includes(lowerQuery) ||
      (project.description && project.description.toLowerCase().includes(lowerQuery))
    );
  }
}
