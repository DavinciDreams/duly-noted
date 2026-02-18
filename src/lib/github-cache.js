/**
 * GitHub Cache Service
 * Handles caching of repositories, projects, and recently used items
 */

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const MAX_RECENTLY_USED = 5;

export class GitHubCache {
  /**
   * Cache repositories
   * @param {Array} repositories - List of repositories to cache
   */
  static async cacheRepositories(repositories) {
    await chrome.storage.local.set({
      githubRepos: repositories,
      githubReposCachedAt: Date.now()
    });
    console.log(`[GitHubCache] Cached ${repositories.length} repositories`);
  }

  /**
   * Get cached repositories if not expired
   * @returns {Promise<Array|null>} Cached repositories or null if expired/not found
   */
  static async getRepositories() {
    const { githubRepos, githubReposCachedAt } = await chrome.storage.local.get([
      'githubRepos',
      'githubReposCachedAt'
    ]);

    if (!githubRepos || !githubReposCachedAt) {
      return null;
    }

    // Check if cache is expired
    if (Date.now() - githubReposCachedAt > CACHE_TTL) {
      console.log('[GitHubCache] Repository cache expired');
      return null;
    }

    return githubRepos;
  }

  /**
   * Cache projects
   * @param {Array} projects - List of projects to cache
   */
  static async cacheProjects(projects) {
    await chrome.storage.local.set({
      githubProjects: projects,
      githubProjectsCachedAt: Date.now()
    });
    console.log(`[GitHubCache] Cached ${projects.length} projects`);
  }

  /**
   * Get cached projects if not expired
   * @returns {Promise<Array|null>} Cached projects or null if expired/not found
   */
  static async getProjects() {
    const { githubProjects, githubProjectsCachedAt } = await chrome.storage.local.get([
      'githubProjects',
      'githubProjectsCachedAt'
    ]);

    if (!githubProjects || !githubProjectsCachedAt) {
      return null;
    }

    // Check if cache is expired
    if (Date.now() - githubProjectsCachedAt > CACHE_TTL) {
      console.log('[GitHubCache] Project cache expired');
      return null;
    }

    return githubProjects;
  }

  /**
   * Add a repository to recently used list
   * @param {string} repoFullName - Full repository name (owner/repo)
   */
  static async addRecentlyUsedRepo(repoFullName) {
    const { githubReposRecentlyUsed = [] } = await chrome.storage.local.get('githubReposRecentlyUsed');

    // Remove if already exists (to move to front)
    const filtered = githubReposRecentlyUsed.filter(name => name !== repoFullName);

    // Add to front
    const updated = [repoFullName, ...filtered].slice(0, MAX_RECENTLY_USED);

    await chrome.storage.local.set({ githubReposRecentlyUsed: updated });
    console.log(`[GitHubCache] Added ${repoFullName} to recently used repos`);
  }

  /**
   * Get recently used repositories
   * @returns {Promise<Array>} List of recently used repository names
   */
  static async getRecentlyUsedRepos() {
    const { githubReposRecentlyUsed = [] } = await chrome.storage.local.get('githubReposRecentlyUsed');
    return githubReposRecentlyUsed;
  }

  /**
   * Add a project to recently used list
   * @param {string} projectId - Project ID
   */
  static async addRecentlyUsedProject(projectId) {
    const { githubProjectsRecentlyUsed = [] } = await chrome.storage.local.get('githubProjectsRecentlyUsed');

    // Remove if already exists (to move to front)
    const filtered = githubProjectsRecentlyUsed.filter(id => id !== projectId);

    // Add to front
    const updated = [projectId, ...filtered].slice(0, MAX_RECENTLY_USED);

    await chrome.storage.local.set({ githubProjectsRecentlyUsed: updated });
    console.log(`[GitHubCache] Added project ${projectId} to recently used`);
  }

  /**
   * Get recently used projects
   * @returns {Promise<Array>} List of recently used project IDs
   */
  static async getRecentlyUsedProjects() {
    const { githubProjectsRecentlyUsed = [] } = await chrome.storage.local.get('githubProjectsRecentlyUsed');
    return githubProjectsRecentlyUsed;
  }

  /**
   * Cache labels for a specific repository
   * @param {string} repoFullName - Full repository name (owner/repo)
   * @param {Array} labels - List of labels from GitHub API
   */
  static async cacheLabels(repoFullName, labels) {
    const key = `githubLabels_${repoFullName}`;
    const timeKey = `${key}_cachedAt`;
    await chrome.storage.local.set({
      [key]: labels,
      [timeKey]: Date.now()
    });
    console.log(`[GitHubCache] Cached ${labels.length} labels for ${repoFullName}`);
  }

  /**
   * Get cached labels for a specific repository if not expired
   * @param {string} repoFullName - Full repository name (owner/repo)
   * @returns {Promise<Array|null>} Cached labels or null if expired/not found
   */
  static async getLabels(repoFullName) {
    const key = `githubLabels_${repoFullName}`;
    const timeKey = `${key}_cachedAt`;
    const result = await chrome.storage.local.get([key, timeKey]);

    const labels = result[key];
    const cachedAt = result[timeKey];

    if (!labels || !cachedAt) {
      return null;
    }

    if (Date.now() - cachedAt > CACHE_TTL) {
      console.log(`[GitHubCache] Label cache expired for ${repoFullName}`);
      return null;
    }

    return labels;
  }

  /**
   * Clear all GitHub caches (including all label caches)
   */
  static async clearAll() {
    // Get all storage keys to find label caches
    const allStorage = await chrome.storage.local.get(null);
    const labelKeys = Object.keys(allStorage).filter(k => k.startsWith('githubLabels_'));

    await chrome.storage.local.remove([
      'githubRepos',
      'githubReposCachedAt',
      'githubReposRecentlyUsed',
      'githubProjects',
      'githubProjectsCachedAt',
      'githubProjectsRecentlyUsed',
      ...labelKeys
    ]);
    console.log('[GitHubCache] Cleared all GitHub caches');
  }

  /**
   * Force refresh repositories (clear cache and refetch)
   */
  static async refreshRepositories() {
    await chrome.storage.local.remove(['githubRepos', 'githubReposCachedAt']);
    console.log('[GitHubCache] Cleared repository cache for refresh');
  }

  /**
   * Force refresh projects (clear cache and refetch)
   */
  static async refreshProjects() {
    await chrome.storage.local.remove(['githubProjects', 'githubProjectsCachedAt']);
    console.log('[GitHubCache] Cleared project cache for refresh');
  }
}
