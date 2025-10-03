/**
 * Server-side logging utilities
 */
import { Request, Response, NextFunction } from 'express';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  metadata?: Record<string, any>;
  requestId?: string;
  userId?: string;
}

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;

  constructor() {
    this.logLevel = (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO;
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex <= currentLevelIndex;
  }

  private formatLog(entry: LogEntry): string {
    const { level, message, timestamp, context, metadata, requestId, userId } = entry;
    
    let logMessage = `[${timestamp}] ${level.toUpperCase()}`;
    if (context) logMessage += ` [${context}]`;
    if (requestId) logMessage += ` [${requestId}]`;
    if (userId) logMessage += ` [user:${userId}]`;
    logMessage += `: ${message}`;
    
    if (metadata && Object.keys(metadata).length > 0) {
      logMessage += ` | ${JSON.stringify(metadata)}`;
    }
    
    return logMessage;
  }

  private log(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;

    const formattedLog = this.formatLog(entry);
    
    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(formattedLog);
        break;
      case LogLevel.WARN:
        console.warn(formattedLog);
        break;
      case LogLevel.INFO:
        console.info(formattedLog);
        break;
      case LogLevel.DEBUG:
        console.debug(formattedLog);
        break;
    }
  }

  error(message: string, context?: string, metadata?: Record<string, any>): void {
    this.log({
      level: LogLevel.ERROR,
      message,
      timestamp: new Date().toISOString(),
      context,
      metadata,
    });
  }

  warn(message: string, context?: string, metadata?: Record<string, any>): void {
    this.log({
      level: LogLevel.WARN,
      message,
      timestamp: new Date().toISOString(),
      context,
      metadata,
    });
  }

  info(message: string, context?: string, metadata?: Record<string, any>): void {
    this.log({
      level: LogLevel.INFO,
      message,
      timestamp: new Date().toISOString(),
      context,
      metadata,
    });
  }

  debug(message: string, context?: string, metadata?: Record<string, any>): void {
    this.log({
      level: LogLevel.DEBUG,
      message,
      timestamp: new Date().toISOString(),
      context,
      metadata,
    });
  }

  // Request logging
  logRequest(req: Request, res: Response, next: NextFunction): void {
    try {
      const start = Date.now();
      const requestId = Math.random().toString(36).substr(2, 9);
      
      // Add request ID to response headers
      res.setHeader('X-Request-ID', requestId);
      
      // Log request
      this.info('Request started', 'HTTP', {
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        requestId,
      });

      // Log response when finished
      res.on('finish', () => {
        const duration = Date.now() - start;
        this.info('Request completed', 'HTTP', {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
          requestId,
        });
      });

      next();
    } catch (error) {
      console.error('Logger error:', error);
      next();
    }
  }

  // Error logging middleware
  logError(error: Error, req?: Request, context?: string): void {
    this.error(error.message, context || 'Express', {
      stack: error.stack,
      url: req?.url,
      method: req?.method,
      ip: req?.ip,
      userAgent: req?.get('User-Agent'),
    });
  }
}

// Create a fallback logger in case the main one fails
const createFallbackLogger = () => ({
  info: (message: string, context?: string, metadata?: any) => {
    console.log(`[INFO] ${context ? `[${context}] ` : ''}${message}`, metadata ? JSON.stringify(metadata) : '');
  },
  warn: (message: string, context?: string, metadata?: any) => {
    console.warn(`[WARN] ${context ? `[${context}] ` : ''}${message}`, metadata ? JSON.stringify(metadata) : '');
  },
  error: (message: string, context?: string, metadata?: any) => {
    console.error(`[ERROR] ${context ? `[${context}] ` : ''}${message}`, metadata ? JSON.stringify(metadata) : '');
  },
  debug: (message: string, context?: string, metadata?: any) => {
    console.debug(`[DEBUG] ${context ? `[${context}] ` : ''}${message}`, metadata ? JSON.stringify(metadata) : '');
  },
  logRequest: (req: any, res: any, next: any) => {
    console.log(`[HTTP] ${req.method} ${req.url}`);
    next();
  },
  logError: (error: Error, req?: any, context?: string) => {
    console.error(`[ERROR] ${context || 'Express'}: ${error.message}`);
  }
});

// Try to create the logger, fallback to simple logger if it fails
let logger: any;
try {
  logger = Logger.getInstance();
} catch (error) {
  console.warn('Failed to create logger, using fallback:', error);
  logger = createFallbackLogger();
}

export { logger };
