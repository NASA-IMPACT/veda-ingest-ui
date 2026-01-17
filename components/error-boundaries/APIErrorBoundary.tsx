'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, Button, Space, Spin } from 'antd';
import { ReloadOutlined, BugOutlined } from '@ant-design/icons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  showRetry?: boolean;
  retryText?: string;
  onRetry?: () => void;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isRetrying: boolean;
}

/**
 * Error boundary for API-related operations
 * Provides user-friendly error messages and retry functionality
 */
export class APIErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      isRetrying: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      isRetrying: false,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('APIErrorBoundary caught an error:', error, errorInfo);

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleRetry = async () => {
    this.setState({ isRetrying: true });

    try {
      if (this.props.onRetry) {
        this.props.onRetry();
      }

      setTimeout(() => {
        this.setState({
          hasError: false,
          error: null,
          isRetrying: false,
        });
      }, 500);
    } catch (retryError) {
      console.error('Retry failed:', retryError);
      this.setState({ isRetrying: false });
    }
  };

  private getErrorMessage = (error: Error): string => {
    if (error.message.includes('fetch')) {
      return 'Network connection error.';
    }
    if (
      error.message.includes('401') ||
      error.message.includes('Unauthorized')
    ) {
      return 'Authentication required. Please sign in again.';
    }
    if (error.message.includes('403') || error.message.includes('Forbidden')) {
      return 'Access denied. You may not have permission for this action.';
    }
    if (error.message.includes('404')) {
      return 'The requested resource was not found.';
    }
    if (error.message.includes('500')) {
      return 'Server error. Please try again later.';
    }
    if (error.message.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }
    return 'An unexpected error occurred. Please try again.';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      if (this.state.isRetrying) {
        return (
          <Alert
            title="Retrying..."
            description="Please wait while we attempt to recover."
            type="info"
            showIcon
            icon={<Spin />}
          />
        );
      }

      return (
        <Alert
          title="Operation Failed"
          description={
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>{this.getErrorMessage(this.state.error!)}</div>

              {this.props.showRetry !== false && (
                <Space>
                  <Button
                    type="primary"
                    icon={<ReloadOutlined />}
                    onClick={this.handleRetry}
                    loading={this.state.isRetrying}
                  >
                    {this.props.retryText || 'Try Again'}
                  </Button>
                </Space>
              )}

              {process.env.NODE_ENV === 'development' && (
                <details>
                  <summary style={{ cursor: 'pointer' }}>
                    <BugOutlined /> Technical Details
                  </summary>
                  <pre
                    style={{
                      background: '#f5f5f5',
                      padding: '8px',
                      marginTop: '8px',
                      fontSize: '12px',
                      overflow: 'auto',
                    }}
                  >
                    {this.state.error?.stack}
                  </pre>
                </details>
              )}
            </Space>
          }
          type="error"
          showIcon
          style={{ margin: '16px 0' }}
        />
      );
    }

    return this.props.children;
  }
}
