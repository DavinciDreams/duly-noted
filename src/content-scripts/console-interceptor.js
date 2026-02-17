/**
 * Console Interceptor
 * Intercepts and captures console logs, errors, and warnings.
 */

window.DulyNoted.ConsoleInterceptor = class ConsoleInterceptor {
  constructor() {
    this.logs = [];
    this.isMonitoring = false;
    this.maxLogs = 1000;
    this.originalConsole = {};
    this.isInitialized = false;
    this.errorEventListeners = [];
    this.rejectionEventListeners = [];
  }

  init() {
    if (this.isInitialized) {
      return;
    }
    this.isInitialized = true;
  }

  startMonitoring() {
    if (this.isMonitoring) {
      return;
    }

    this.originalConsole = {
      log: console.log.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
      info: console.info.bind(console)
    };

    this.overrideConsole();
    this.isMonitoring = true;
  }

  overrideConsole() {
    const self = this;

    console.log = function (...args) {
      self.captureLog('log', args);
      self.originalConsole.log.apply(console, args);
    };

    console.warn = function (...args) {
      self.captureLog('warn', args);
      self.originalConsole.warn.apply(console, args);
    };

    console.error = function (...args) {
      self.captureLog('error', args);
      self.originalConsole.error.apply(console, args);
    };

    console.info = function (...args) {
      self.captureLog('info', args);
      self.originalConsole.info.apply(console, args);
    };

    const errorHandler = (event) => {
      self.captureLog('error', [event.message], {
        source: {
          file: event.filename,
          line: event.lineno,
          column: event.colno
        },
        stackTrace: event.error?.stack,
        type: 'unhandled'
      });
    };
    window.addEventListener('error', errorHandler);
    this.errorEventListeners.push({ target: window, handler: errorHandler });

    const rejectionHandler = (event) => {
      self.captureLog('error', [event.reason], {
        stackTrace: event.reason?.stack,
        type: 'unhandledRejection'
      });
    };
    window.addEventListener('unhandledrejection', rejectionHandler);
    this.rejectionEventListeners.push({ target: window, handler: rejectionHandler });
  }

  stopMonitoring() {
    if (!this.isMonitoring) {
      return;
    }

    if (this.originalConsole.log) {
      console.log = this.originalConsole.log;
    }
    if (this.originalConsole.warn) {
      console.warn = this.originalConsole.warn;
    }
    if (this.originalConsole.error) {
      console.error = this.originalConsole.error;
    }
    if (this.originalConsole.info) {
      console.info = this.originalConsole.info;
    }

    this.errorEventListeners.forEach(({ target, handler }) => {
      target.removeEventListener('error', handler);
    });
    this.errorEventListeners = [];

    this.rejectionEventListeners.forEach(({ target, handler }) => {
      target.removeEventListener('unhandledrejection', handler);
    });
    this.rejectionEventListeners = [];

    this.isMonitoring = false;
  }

  captureLog(level, args, metadata = {}) {
    const logEntry = {
      id: this.generateId(),
      type: level,
      level: level,
      message: this.formatMessage(args),
      timestamp: Date.now(),
      url: window.location.href,
      args: this.serializeArgs(args),
      ...metadata
    };

    if (!metadata.source) {
      const stack = new Error().stack;
      logEntry.source = this.parseStackTrace(stack);
    }

    if (level === 'error') {
      logEntry.category = this.categorizeError(logEntry);
    }

    this.logs.push(logEntry);

    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    chrome.runtime.sendMessage({
      type: 'NEW_CONSOLE_LOG',
      log: logEntry
    }).catch(() => {});
  }

  formatMessage(args) {
    return args.map(arg => {
      if (typeof arg === 'string') return arg;
      if (arg instanceof Error) return arg.message;
      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    }).join(' ');
  }

  serializeArgs(args) {
    return args.map(arg => {
      if (typeof arg === 'string' || typeof arg === 'number' || typeof arg === 'boolean') {
        return arg;
      }
      if (arg instanceof Error) {
        return { message: arg.message, stack: arg.stack };
      }
      if (typeof arg === 'object' && arg !== null) {
        try {
          return JSON.parse(JSON.stringify(arg));
        } catch {
          return { '[unserializable]': typeof arg };
        }
      }
      return String(arg);
    });
  }

  parseStackTrace(stack) {
    if (!stack) return null;

    const lines = stack.split('\n');
    for (const line of lines) {
      const match = line.match(/at\s+.*?\((.*?):(\d+):(\d+)\)/) ||
                    line.match(/at\s+(.*?):(\d+):(\d+)/);

      if (match) {
        return {
          file: match[1],
          line: parseInt(match[2]),
          column: parseInt(match[3])
        };
      }
    }

    return null;
  }

  categorizeError(logEntry) {
    const message = logEntry.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch') || message.includes('xhr')) {
      return 'network';
    }

    if (message.includes('undefined') || message.includes('null')) {
      return 'reference';
    }

    if (message.includes('syntax')) {
      return 'syntax';
    }

    if (message.includes('type error') || message.includes('is not a')) {
      return 'type';
    }

    if (logEntry.type === 'unhandledRejection') {
      return 'promise';
    }

    const stack = logEntry.stackTrace?.toLowerCase() || '';
    if (stack.includes('api') || message.includes('api')) {
      return 'api';
    }

    if (message.includes('404') || message.includes('not found')) {
      return 'resource';
    }

    return 'unknown';
  }

  getLogs(filter = {}) {
    let filteredLogs = this.logs;

    if (filter.level) {
      filteredLogs = filteredLogs.filter(log => log.level === filter.level);
    }

    if (filter.category) {
      filteredLogs = filteredLogs.filter(log => log.category === filter.category);
    }

    if (filter.since) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= filter.since);
    }

    if (filter.until) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= filter.until);
    }

    if (filter.search) {
      const searchTerm = filter.search.toLowerCase();
      filteredLogs = filteredLogs.filter(log =>
        log.message.toLowerCase().includes(searchTerm)
      );
    }

    filteredLogs.sort((a, b) => b.timestamp - a.timestamp);

    return filteredLogs;
  }

  clearLogs() {
    this.logs = [];
  }

  generateId() {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getStatistics() {
    return {
      total: this.logs.length,
      errors: this.logs.filter(l => l.level === 'error').length,
      warnings: this.logs.filter(l => l.level === 'warn').length,
      info: this.logs.filter(l => l.level === 'info').length,
      logs: this.logs.filter(l => l.level === 'log').length,
      categories: this.getCategoryBreakdown()
    };
  }

  getCategoryBreakdown() {
    const categories = {};
    this.logs
      .filter(l => l.level === 'error' && l.category)
      .forEach(log => {
        categories[log.category] = (categories[log.category] || 0) + 1;
      });
    return categories;
  }
};
