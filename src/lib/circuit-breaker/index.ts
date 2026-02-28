/**
 * 熔断器实现
 * 
 * 防止级联故障，当服务失败率达到阈值时自动熔断
 * 支持：CLOSED（正常）、OPEN（熔断）、HALF_OPEN（半开）三种状态
 * 
 * @module lib/circuit-breaker
 */

import { NextResponse } from 'next/server';

// ============================================
// 类型定义
// ============================================

/**
 * 熔断器状态
 */
export enum CircuitState {
  /** 正常状态 - 请求正常通过 */
  CLOSED = 'CLOSED',
  /** 熔断状态 - 请求直接返回降级响应 */
  OPEN = 'OPEN',
  /** 半开状态 - 试探性恢复，允许部分请求通过 */
  HALF_OPEN = 'HALF_OPEN',
}

/**
 * 熔断器配置
 */
export interface CircuitBreakerConfig {
  /** 服务名称 */
  name: string;
  /** 失败次数阈值 */
  failureThreshold: number;
  /** 成功次数阈值（半开状态下需要连续成功的次数） */
  successThreshold: number;
  /** 熔断超时时间（毫秒）- 请求超时时间 */
  timeout: number;
  /** 熔断恢复时间（毫秒）- 熔断后多久尝试恢复 */
  resetTimeout: number;
  /** 降级处理函数 */
  fallback?: () => Promise<NextResponse> | NextResponse;
  /** 状态变更回调 */
  onStateChange?: (name: string, from: CircuitState, to: CircuitState) => void;
  /** 失败回调 */
  onFailure?: (name: string, error: Error) => void;
}

/**
 * 熔断器统计信息
 */
export interface CircuitStats {
  /** 当前状态 */
  state: CircuitState;
  /** 失败次数 */
  failureCount: number;
  /** 成功次数（半开状态下） */
  successCount: number;
  /** 最后一次失败时间 */
  lastFailureTime: number | null;
  /** 最后一次状态变更时间 */
  lastStateChangeTime: number;
  /** 总请求数 */
  totalRequests: number;
  /** 总失败数 */
  totalFailures: number;
  /** 总成功数 */
  totalSuccesses: number;
}

// ============================================
// 熔断器实现
// ============================================

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: number | null = null;
  private lastStateChangeTime: number = Date.now();
  private totalRequests: number = 0;
  private totalFailures: number = 0;
  private totalSuccesses: number = 0;

  constructor(private config: CircuitBreakerConfig) {}

  /**
   * 获取当前状态
   */
  getState(): CircuitState {
    this.checkStateTransition();
    return this.state;
  }

  /**
   * 获取统计信息
   */
  getStats(): CircuitStats {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      lastStateChangeTime: this.lastStateChangeTime,
      totalRequests: this.totalRequests,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses,
    };
  }

  /**
   * 执行请求（带熔断保护）
   */
  async execute<T>(
    fn: () => Promise<T>
  ): Promise<T | NextResponse> {
    this.totalRequests++;
    
    // 检查状态转换
    this.checkStateTransition();
    
    switch (this.state) {
      case CircuitState.OPEN:
        // 熔断状态，返回降级响应
        return this.handleFallback();
        
      case CircuitState.HALF_OPEN:
        // 半开状态，允许试探性请求
        return this.executeHalfOpen(fn);
        
      case CircuitState.CLOSED:
      default:
        // 正常状态，执行请求
        return this.executeClosed(fn);
    }
  }

  /**
   * 手动打开熔断器
   */
  trip(): void {
    this.transitionTo(CircuitState.OPEN);
  }

  /**
   * 手动重置熔断器
   */
  reset(): void {
    this.failureCount = 0;
    this.successCount = 0;
    this.transitionTo(CircuitState.CLOSED);
  }

  // ============================================
  // 私有方法
  // ============================================

  /**
   * 检查状态转换（OPEN -> HALF_OPEN）
   */
  private checkStateTransition(): void {
    if (
      this.state === CircuitState.OPEN &&
      this.lastFailureTime &&
      Date.now() - this.lastFailureTime >= this.config.resetTimeout
    ) {
      this.transitionTo(CircuitState.HALF_OPEN);
    }
  }

  /**
   * 正常状态执行
   */
  private async executeClosed<T>(fn: () => Promise<T>): Promise<T | NextResponse> {
    try {
      // 添加超时保护
      const result = await this.withTimeout(fn);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error as Error);
      
      // 如果失败次数达到阈值，打开熔断器
      if (this.failureCount >= this.config.failureThreshold) {
        this.transitionTo(CircuitState.OPEN);
      }
      
      throw error;
    }
  }

  /**
   * 半开状态执行
   */
  private async executeHalfOpen<T>(fn: () => Promise<T>): Promise<T | NextResponse> {
    try {
      const result = await this.withTimeout(fn);
      this.onSuccessInHalfOpen();
      return result;
    } catch (error) {
      this.onFailureInHalfOpen();
      return this.handleFallback();
    }
  }

  /**
   * 添加超时保护
   */
  private async withTimeout<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Circuit breaker timeout after ${this.config.timeout}ms`));
      }, this.config.timeout);
      
      fn()
        .then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  /**
   * 成功处理
   */
  private onSuccess(): void {
    this.failureCount = 0;
    this.totalSuccesses++;
  }

  /**
   * 失败处理
   */
  private onFailure(error: Error): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    this.totalFailures++;
    this.config.onFailure?.(this.config.name, error);
  }

  /**
   * 半开状态成功处理
   */
  private onSuccessInHalfOpen(): void {
    this.successCount++;
    this.totalSuccesses++;
    
    // 连续成功达到阈值，恢复到正常状态
    if (this.successCount >= this.config.successThreshold) {
      this.failureCount = 0;
      this.successCount = 0;
      this.transitionTo(CircuitState.CLOSED);
    }
  }

  /**
   * 半开状态失败处理
   */
  private onFailureInHalfOpen(): void {
    this.failureCount++;
    this.successCount = 0;
    this.totalFailures++;
    // 半开状态失败，立即回到熔断状态
    this.transitionTo(CircuitState.OPEN);
  }

  /**
   * 状态转换
   */
  private transitionTo(newState: CircuitState): void {
    const oldState = this.state;
    if (oldState === newState) return;
    
    this.state = newState;
    this.lastStateChangeTime = Date.now();
    
    this.config.onStateChange?.(this.config.name, oldState, newState);
    
    console.log(`[CircuitBreaker] ${this.config.name}: ${oldState} -> ${newState}`);
  }

  /**
   * 降级处理
   */
  private async handleFallback(): Promise<NextResponse> {
    if (this.config.fallback) {
      const result = this.config.fallback();
      // 处理 Promise 情况
      if (result instanceof Promise) {
        return result;
      }
      return result;
    }
    
    // 默认降级响应
    return NextResponse.json(
      {
        success: false,
        error: '服务暂时不可用，请稍后再试',
        errorCode: 'SERVICE_UNAVAILABLE',
        circuitBreaker: {
          name: this.config.name,
          state: this.state,
        },
      },
      { status: 503 }
    );
  }
}

// ============================================
// 熔断器管理器
// ============================================

/**
 * 熔断器管理器
 * 管理多个服务的熔断器实例
 */
export class CircuitBreakerManager {
  private breakers = new Map<string, CircuitBreaker>();
  
  /**
   * 获取或创建熔断器
   */
  getBreaker(config: CircuitBreakerConfig): CircuitBreaker {
    let breaker = this.breakers.get(config.name);
    
    if (!breaker) {
      breaker = new CircuitBreaker(config);
      this.breakers.set(config.name, breaker);
    }
    
    return breaker;
  }

  /**
   * 获取所有熔断器状态
   */
  getAllStats(): Record<string, CircuitStats> {
    const stats: Record<string, CircuitStats> = {};
    
    for (const [name, breaker] of this.breakers.entries()) {
      stats[name] = breaker.getStats();
    }
    
    return stats;
  }

  /**
   * 重置所有熔断器
   */
  resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }

  /**
   * 重置指定熔断器
   */
  reset(name: string): void {
    const breaker = this.breakers.get(name);
    if (breaker) {
      breaker.reset();
    }
  }
}

// ============================================
// 预定义服务熔断配置
// ============================================

export const circuitBreakerConfigs: Record<string, Partial<CircuitBreakerConfig>> = {
  database: {
    name: 'database',
    failureThreshold: 5,
    successThreshold: 3,
    timeout: 30000,
    resetTimeout: 60000,
  },
  storage: {
    name: 'storage',
    failureThreshold: 3,
    successThreshold: 2,
    timeout: 10000,
    resetTimeout: 30000,
  },
  cache: {
    name: 'cache',
    failureThreshold: 5,
    successThreshold: 2,
    timeout: 5000,
    resetTimeout: 15000,
  },
  search: {
    name: 'search',
    failureThreshold: 3,
    successThreshold: 2,
    timeout: 5000,
    resetTimeout: 30000,
  },
};

// ============================================
// 全局熔断器管理器实例
// ============================================

export const circuitBreakerManager = new CircuitBreakerManager();

// ============================================
// 装饰器/高阶函数
// ============================================

/**
 * 为函数添加熔断保护
 */
export function withCircuitBreaker<T extends (...args: unknown[]) => Promise<unknown>>(
  config: CircuitBreakerConfig
) {
  const breaker = circuitBreakerManager.getBreaker(config);
  
  return function (fn: T): T {
    return (async (...args: Parameters<T>) => {
      return breaker.execute(() => fn(...args));
    }) as T;
  };
}

// ============================================
// 导出
// ============================================

export default CircuitBreaker;
