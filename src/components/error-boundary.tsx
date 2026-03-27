/**
 * 全局错误边界组件
 * 
 * 捕获 React 组件树中的 JavaScript 错误，记录错误并显示回退 UI
 * 
 * @module components/error-boundary
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

// ============================================
// 类型定义
// ============================================

export interface ErrorBoundaryProps {
  /** 子组件 */
  children: ReactNode;
  /** 自定义回退 UI */
  fallback?: ReactNode;
  /** 错误回调 */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** 重置回调 */
  onReset?: () => void;
  /** 重置按钮文本 */
  resetButtonText?: string;
  /** 是否显示错误详情（开发环境） */
  showErrorDetails?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// ============================================
// 错误边界组件
// ============================================

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // 调用自定义错误处理
    this.props.onError?.(error, errorInfo);

    // 记录错误到控制台
    console.error('[ErrorBoundary] 捕获到错误:', error);
    console.error('[ErrorBoundary] 组件堆栈:', errorInfo.componentStack);

    // 在生产环境可以发送到错误监控服务
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo);
    }
  }

  /**
   * 记录错误到监控服务
   */
  private logErrorToService(error: Error, errorInfo: ErrorInfo): void {
    // TODO: 集成错误监控服务（如 Sentry）
    fetch('/api/log-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      }),
    }).catch(console.error);
  }

  /**
   * 重置错误状态
   */
  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    this.props.onReset?.();
  };

  /**
   * 返回首页
   */
  handleGoHome = (): void => {
    window.location.href = '/';
  };

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const {
      children,
      fallback,
      resetButtonText = '重试',
      showErrorDetails = process.env.NODE_ENV === 'development',
    } = this.props;

    if (hasError) {
      // 使用自定义回退 UI
      if (fallback) {
        return fallback;
      }

      // 默认错误 UI
      return (
        <div className="flex min-h-[400px] items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-xl">出错了</CardTitle>
              <CardDescription>
                页面遇到了一些问题，请尝试刷新或返回首页
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* 错误信息 */}
              {error && (
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    错误类型: {error.name}
                  </p>
                  <p className="mt-1 text-sm text-foreground">
                    {error.message}
                  </p>
                </div>
              )}

              {/* 开发环境显示详细错误 */}
              {showErrorDetails && error?.stack && (
                <details className="group">
                  <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                    <Bug className="mr-1 inline h-4 w-4" />
                    查看错误详情
                  </summary>
                  <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-muted p-3 text-xs">
                    {error.stack}
                    {errorInfo?.componentStack && (
                      <>
                        {'\n\n组件堆栈:'}
                        {errorInfo.componentStack}
                      </>
                    )}
                  </pre>
                </details>
              )}
            </CardContent>

            <CardFooter className="flex justify-center gap-3">
              <Button variant="outline" onClick={this.handleGoHome}>
                <Home className="mr-2 h-4 w-4" />
                返回首页
              </Button>
              <Button onClick={this.handleReset}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {resetButtonText}
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return children;
  }
}

// ============================================
// 异步错误边界（用于捕获 async 错误）
// ============================================

export interface AsyncErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error) => void;
}

export function AsyncErrorBoundary({
  children,
  fallback,
  onError,
}: AsyncErrorBoundaryProps): ReactNode {
  return (
    <ErrorBoundary
      fallback={fallback}
      onError={(error) => onError?.(error)}
    >
      {children}
    </ErrorBoundary>
  );
}

// ============================================
// 页面级错误边界
// ============================================

export interface PageErrorBoundaryProps {
  children: ReactNode;
  pageName?: string;
}

export function PageErrorBoundary({
  children,
  pageName = '页面',
}: PageErrorBoundaryProps): ReactNode {
  return (
    <ErrorBoundary
      resetButtonText={`重新加载${pageName}`}
      onError={(error, errorInfo) => {
        console.error(`[${pageName}] 页面错误:`, error);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

// ============================================
// 组件级错误边界
// ============================================

export interface ComponentErrorBoundaryProps {
  children: ReactNode;
  componentName: string;
  fallback?: ReactNode;
}

export function ComponentErrorBoundary({
  children,
  componentName,
  fallback,
}: ComponentErrorBoundaryProps): ReactNode {
  const defaultFallback = (
    <div className="flex items-center justify-center rounded-lg border border-dashed p-8 text-center">
      <div>
        <AlertTriangle className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          {componentName} 加载失败
        </p>
      </div>
    </div>
  );

  return (
    <ErrorBoundary
      fallback={fallback || defaultFallback}
      onError={(error) => {
        console.error(`[${componentName}] 组件错误:`, error);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

// ============================================
// HOC: withErrorBoundary
// ============================================

export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: Omit<ErrorBoundaryProps, 'children'> = {}
): React.FC<P> {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
  
  const ComponentWithErrorBoundary: React.FC<P> = (props) => (
    <ErrorBoundary {...options}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;

  return ComponentWithErrorBoundary;
}

export default ErrorBoundary;
