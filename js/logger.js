// logger.js

// Logger utility with configurable log levels
export const logger = {
  // Log levels: debug, info, warn, error
  level: 'debug', // Default level, can be changed to 'debug', 'info', 'warn', or 'error'

  debug(message, ...args) {
    if (this.level === 'debug') {
      console.log(`[${new Date().toISOString()}] DEBUG: ${message}`, ...args);
    }
  },

  info(message, ...args) {
    if (this.level === 'debug' || this.level === 'info') {
      console.log(`[${new Date().toISOString()}] INFO: ${message}`, ...args);
    }
  },

  warn(message, ...args) {
    if (this.level === 'debug' || this.level === 'info' || this.level === 'warn') {
      console.warn(`[${new Date().toISOString()}] WARN: ${message}`, ...args);
    }
  },

  error(message, ...args) {
    console.error(`[${new Date().toISOString()}] ERROR: ${message}`, ...args);
  },

  // Set log level dynamically
  setLevel(newLevel) {
    if (['debug', 'info', 'warn', 'error'].includes(newLevel)) {
      this.level = newLevel;
      console.log(`[${new Date().toISOString()}] Logger level set to: ${newLevel}`);
    } else {
      console.error(`[${new Date().toISOString()}] Invalid log level: ${newLevel}`);
    }
  }
};