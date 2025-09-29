'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, Button, Space, Typography } from 'antd';
import { ReloadOutlined, HomeOutlined } from '@ant-design/icons';

const { Paragraph } = Typography;

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class TenantErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('TenantErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isAuthError =
        this.state.error?.message?.includes('Authentication') ||
        this.state.error?.message?.includes('Unauthorized');
      const isTenantError =
        this.state.error?.message?.includes('tenant') ||
        this.state.error?.message?.includes('Tenant');

      return (
        <div style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>
          <Alert
            message={
              isAuthError
                ? 'Authentication Error'
                : isTenantError
                  ? 'Tenant Access Error'
                  : 'Something went wrong'
            }
            description={
              <Space
                direction="vertical"
                size="large"
                style={{ width: '100%' }}
              >
                <div>
                  {isAuthError && (
                    <Paragraph>
                      There was a problem with your authentication. Please try
                      signing in again.
                    </Paragraph>
                  )}
                  {isTenantError && !isAuthError && (
                    <Paragraph>
                      There was a problem accessing tenant information. This
                      might be a temporary issue.
                    </Paragraph>
                  )}
                  {!isAuthError && !isTenantError && (
                    <Paragraph>
                      We encountered an unexpected error. Please try refreshing
                      the page or contact support if the problem persists.
                    </Paragraph>
                  )}
                </div>

                {process.env.NODE_ENV === 'development' && (
                  <details style={{ marginTop: '16px' }}>
                    <summary style={{ cursor: 'pointer', marginBottom: '8px' }}>
                      Technical Details (Development Only)
                    </summary>
                    <pre
                      style={{
                        background: '#f5f5f5',
                        padding: '12px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        overflow: 'auto',
                      }}
                    >
                      {this.state.error?.toString()}
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </details>
                )}

                <Space wrap>
                  <Button
                    type="primary"
                    icon={<ReloadOutlined />}
                    onClick={this.handleRetry}
                  >
                    Try Again
                  </Button>
                  <Button icon={<ReloadOutlined />} onClick={this.handleReload}>
                    Reload Page
                  </Button>
                  <Button icon={<HomeOutlined />} onClick={this.handleGoHome}>
                    Go Home
                  </Button>
                </Space>
              </Space>
            }
            type="error"
            showIcon
          />
        </div>
      );
    }

    return this.props.children;
  }
}
