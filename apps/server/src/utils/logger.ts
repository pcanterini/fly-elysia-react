/**
 * Simple logging utility with structured logging for production
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private isProduction = process.env.NODE_ENV === 'production';

  private formatMessage(level: LogLevel, message: string, context?: any): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message
    };

    if (context && typeof context === 'object') {
      if (context instanceof Error) {
        entry.error = {
          name: context.name,
          message: context.message,
          stack: context.stack
        };
      } else {
        entry.context = context;
      }
    }

    return entry;
  }

  private output(entry: LogEntry): void {
    if (this.isProduction) {
      // Structured JSON logging for production
      console.log(JSON.stringify(entry));
    } else {
      // Human-readable logging for development
      const color = this.getColor(entry.level);
      const reset = '\x1b[0m';
      const timestamp = entry.timestamp;
      
      let output = `${color}[${entry.level.toUpperCase()}]${reset} ${timestamp} - ${entry.message}`;
      
      if (entry.context) {
        output += `\n  Context: ${JSON.stringify(entry.context, null, 2)}`;
      }
      
      if (entry.error) {
        output += `\n  Error: ${entry.error.name}: ${entry.error.message}`;
        if (entry.error.stack) {
          output += `\n  Stack: ${entry.error.stack}`;
        }
      }
      
      console.log(output);
    }
  }

  private getColor(level: LogLevel): string {
    switch (level) {
      case 'debug': return '\x1b[36m'; // Cyan
      case 'info': return '\x1b[32m';  // Green
      case 'warn': return '\x1b[33m';  // Yellow
      case 'error': return '\x1b[31m'; // Red
      default: return '\x1b[0m';       // Reset
    }
  }

  debug(message: string, context?: any): void {
    if (!this.isProduction) {
      this.output(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: any): void {
    this.output(this.formatMessage('info', message, context));
  }

  warn(message: string, context?: any): void {
    this.output(this.formatMessage('warn', message, context));
  }

  error(message: string, context?: any): void {
    this.output(this.formatMessage('error', message, context));
  }

  // HTTP request logging
  http(method: string, path: string, statusCode: number, responseTime?: number, context?: any): void {
    const message = `${method} ${path} ${statusCode}${responseTime ? ` (${responseTime}ms)` : ''}`;
    const logContext = {
      method,
      path,
      statusCode,
      responseTime,
      ...context
    };

    if (statusCode >= 500) {
      this.error(message, logContext);
    } else if (statusCode >= 400) {
      this.warn(message, logContext);
    } else {
      this.info(message, logContext);
    }
  }

  // Database operation logging
  db(operation: string, table?: string, duration?: number, context?: any): void {
    const message = `DB ${operation}${table ? ` on ${table}` : ''}${duration ? ` (${duration}ms)` : ''}`;
    this.debug(message, context);
  }

  // Auth operation logging
  auth(operation: string, userId?: string, context?: any): void {
    const message = `Auth ${operation}${userId ? ` for user ${userId}` : ''}`;
    this.info(message, context);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export types for external use
export type { LogLevel, LogEntry };