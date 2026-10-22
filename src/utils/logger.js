/**
 * EOTC Media Studio — Structured Logger
 * ═══════════════════════════════════════════════════════════
 * Centralized logging with:
 *  - LOG_LEVEL filtering (TRACE → FATAL)
 *  - Structured JSON output in production
 *  - Pretty human-readable output in development
 *  - Child loggers with subsystem tags
 *  - Timestamps in ISO 8601
 *
 * Usage:
 *   import { logger, createChildLogger } from './utils/logger.js';
 *   const log = createChildLogger('calendar');
 *   log.info('Ethiopian date computed', { year: 2019, month: 2, day: 11 });
 *   log.error('Conversion failed', { input: date, error: err.message });
 */

const LOG_LEVELS = {
  TRACE: 10,
  DEBUG: 20,
  INFO:  30,
  WARN:  40,
  ERROR: 50,
  FATAL: 60
};

const LEVEL_LABELS = {
  10: 'TRACE',
  20: 'DEBUG',
  30: 'INFO',
  40: 'WARN',
  50: 'ERROR',
  60: 'FATAL'
};

const LEVEL_ICONS = {
  10: '🔬',
  20: '🐛',
  30: 'ℹ️',
  40: '⚠️',
  50: '❌',
  60: '💀'
};

// Parse LOG_LEVEL from environment (default: INFO)
function getLogLevel() {
  const envLevel = (process.env.LOG_LEVEL || 'INFO').toUpperCase();
  return LOG_LEVELS[envLevel] ?? LOG_LEVELS.INFO;
}

// Detect production vs. development mode
function isProduction() {
  return process.env.NODE_ENV === 'production' || process.env.CI === 'true';
}

/**
 * Core logging engine. Each log entry is structured as:
 * { timestamp, level, subsystem, msg, ...data }
 */
class Logger {
  constructor(subsystem = 'core') {
    this._subsystem = subsystem;
  }

  _emit(levelNum, msg, data) {
    if (levelNum < getLogLevel()) return;

    const payload = (data && typeof data === 'object') ? data : (data !== undefined && data !== null ? { value: data } : {});

    const entry = {
      timestamp: new Date().toISOString(),
      level: LEVEL_LABELS[levelNum],
      subsystem: this._subsystem,
      msg,
      ...payload
    };

    if (isProduction()) {
      // Structured JSON — parseable by Datadog, ELK, CloudWatch, etc.
      const stream = levelNum >= LOG_LEVELS.ERROR ? process.stderr : process.stdout;
      stream.write(JSON.stringify(entry) + '\n');
    } else {
      // Pretty human-readable output for local development
      const icon = LEVEL_ICONS[levelNum] || '';
      const tag = this._subsystem !== 'core' ? `[${this._subsystem}]` : '';
      const dataStr = Object.keys(payload).length > 0 ? ` ${JSON.stringify(payload)}` : '';
      const timestamp = entry.timestamp.slice(11, 23); // HH:mm:ss.SSS
      
      const stream = levelNum >= LOG_LEVELS.ERROR ? console.error : console.log;
      stream(`${timestamp} ${icon} ${entry.level.padEnd(5)} ${tag} ${msg}${dataStr}`);
    }
  }

  trace(msg, data) { this._emit(LOG_LEVELS.TRACE, msg, data); }
  debug(msg, data) { this._emit(LOG_LEVELS.DEBUG, msg, data); }
  info(msg, data)  { this._emit(LOG_LEVELS.INFO, msg, data); }
  warn(msg, data)  { this._emit(LOG_LEVELS.WARN, msg, data); }
  error(msg, data) { this._emit(LOG_LEVELS.ERROR, msg, data); }
  fatal(msg, data) { this._emit(LOG_LEVELS.FATAL, msg, data); }

  /**
   * Create a child logger with a different subsystem tag.
   * @param {string} subsystem 
   * @returns {Logger}
   */
  child(subsystem) {
    return new Logger(subsystem);
  }
}

/** Singleton root logger */
export const logger = new Logger('core');

/**
 * Factory to create tagged child loggers.
 * @param {string} subsystem — e.g. 'calendar', 'ai', 'render', 'telegram', 'db'
 * @returns {Logger}
 */
export function createChildLogger(subsystem) {
  return new Logger(subsystem);
}

export default logger;
