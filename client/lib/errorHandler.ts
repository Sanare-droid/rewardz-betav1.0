/**
 * Global error handling utilities
 */
import { AppError } from '@/shared/types';

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: AppError[] = [];

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle and log errors
   */
  handleError(error: Error | AppError, context?: string): AppError {
    const appError: AppError = {
      code: 'code' in error ? error.code : 'UNKNOWN_ERROR',
      message: error.message || 'An unknown error occurred',
      details: {
        context,
        timestamp: new Date().toISOString(),
        stack: error.stack,
        userAgent: navigator.userAgent,
        url: window.location.href,
      },
    };

    this.errorLog.push(appError);
    this.logError(appError);
    
    return appError;
  }

  /**
   * Log error to console and external service
   */
  private logError(error: AppError): void {
    console.error('Error:', error);
    
    // Send to external monitoring service (e.g., Sentry)
    if (import.meta.env.VITE_SENTRY_DSN) {
      this.sendToSentry(error);
    }
  }

  /**
   * Send error to Sentry
   */
  private sendToSentry(error: AppError): void {
    // This would integrate with Sentry SDK
    console.log('Sending to Sentry:', error);
  }

  /**
   * Get error log
   */
  getErrorLog(): AppError[] {
    return [...this.errorLog];
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }
}

/**
 * React Error Boundary Component
 */
import React, { Component, ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    const errorHandler = ErrorHandler.getInstance();
    errorHandler.handleError(error, 'React Error Boundary');
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-600 mb-4">
            We're sorry, but something unexpected happened.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook for error handling
 */
import { useCallback } from 'react';

export function useErrorHandler() {
  const errorHandler = ErrorHandler.getInstance();

  const handleError = useCallback((error: Error | AppError, context?: string) => {
    return errorHandler.handleError(error, context);
  }, [errorHandler]);

  return { handleError };
}
