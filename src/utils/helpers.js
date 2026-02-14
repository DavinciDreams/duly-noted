/**
 * Utility Helper Functions
 */

/**
 * Generate a UUID v4
 * @returns {string} UUID
 */
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Format timestamp as relative time (e.g., "2 hours ago")
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} Relative time string
 */
export function formatRelativeTime(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) {
    return 'just now';
  } else if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else if (hours < 24) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else if (days < 7) {
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  } else if (weeks < 4) {
    return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
  } else if (months < 12) {
    return `${months} month${months !== 1 ? 's' : ''} ago`;
  } else {
    return `${years} year${years !== 1 ? 's' : ''} ago`;
  }
}

/**
 * Format duration in MM:SS format
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration
 */
export function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Truncate text to max length with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength = 100) {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Extract title from transcription (first line or first 50 chars)
 * @param {string} transcription - Full transcription text
 * @returns {string} Extracted title
 */
export function extractTitle(transcription) {
  if (!transcription) return 'Untitled note';

  // Try first line
  const firstLine = transcription.split('\n')[0].trim();
  if (firstLine) {
    return truncateText(firstLine, 50);
  }

  // Fallback to first 50 chars
  return truncateText(transcription, 50);
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function
 * @param {Function} func - Function to throttle
 * @param {number} limit - Limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit = 300) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Get destination icon emoji
 * @param {string} destination - Destination type
 * @returns {string} Icon emoji
 */
export function getDestinationIcon(destination) {
  const icons = {
    'draft': '💾',
    'github-issue': '🐙',
    'github-project': '📋',
    'notion': '📓',
    'affine': '📄',
    'onenote': '📘',
  };
  return icons[destination] || '📝';
}

/**
 * Get destination label
 * @param {string} destination - Destination type
 * @returns {string} Human-readable label
 */
export function getDestinationLabel(destination) {
  const labels = {
    'draft': 'Draft',
    'github-issue': 'GitHub Issue',
    'github-project': 'GitHub Project',
    'notion': 'Notion',
    'affine': 'Affine',
    'onenote': 'OneNote',
  };
  return labels[destination] || 'Unknown';
}

/**
 * Validate URL
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid URL
 */
export function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sleep/delay function
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise<any>} Result of function
 */
export async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) {
        throw error;
      }
      const delay = baseDelay * Math.pow(2, i);
      console.warn(`Retry ${i + 1}/${maxRetries} after ${delay}ms:`, error.message);
      await sleep(delay);
    }
  }
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Download data as JSON file
 * @param {any} data - Data to download
 * @param {string} filename - Filename
 */
export function downloadJSON(data, filename = 'voice-starter-export.json') {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Parse error message from various error types
 * @param {any} error - Error object or message
 * @returns {string} User-friendly error message
 */
export function parseErrorMessage(error) {
  if (typeof error === 'string') {
    return error;
  }

  if (error?.message) {
    return error.message;
  }

  if (error?.error) {
    return parseErrorMessage(error.error);
  }

  return 'An unknown error occurred';
}
