/**
 * 单元测试工具
 * 
 * 提供轻量级的测试运行器和断言库
 * 
 * @module lib/test-utils
 */

// ============================================
// 类型定义
// ============================================

export interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

export interface TestSuite {
  name: string;
  tests: TestResult[];
  passed: number;
  failed: number;
  duration: number;
}

export interface TestRunnerOptions {
  /** 是否在控制台输出 */
  verbose?: boolean;
  /** 超时时间（毫秒） */
  timeout?: number;
}

type TestFn = () => Promise<void> | void;

interface TestCase {
  name: string;
  fn: TestFn;
}

// ============================================
// 断言库
// ============================================

export class AssertionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AssertionError';
  }
}

/**
 * 断言条件为真
 */
export function assert(condition: boolean, message?: string): asserts condition {
  if (!condition) {
    throw new AssertionError(message || '断言失败');
  }
}

/**
 * 断言两个值相等
 */
export function assertEqual<T>(actual: T, expected: T, message?: string): void {
  if (actual !== expected) {
    throw new AssertionError(
      message || `期望 ${JSON.stringify(expected)}，实际 ${JSON.stringify(actual)}`
    );
  }
}

/**
 * 断言两个值深度相等
 */
export function assertDeepEqual<T>(actual: T, expected: T, message?: string): void {
  const actualStr = JSON.stringify(actual, Object.keys(actual as object).sort());
  const expectedStr = JSON.stringify(expected, Object.keys(expected as object).sort());
  
  if (actualStr !== expectedStr) {
    throw new AssertionError(
      message || `深度比较失败\n期望: ${expectedStr}\n实际: ${actualStr}`
    );
  }
}

/**
 * 断言值不为空
 */
export function assertNotNull<T>(value: T, message?: string): asserts value is NonNullable<T> {
  if (value === null || value === undefined) {
    throw new AssertionError(message || '值不应为空');
  }
}

/**
 * 断言值为空
 */
export function assertNull<T>(value: T, message?: string): void {
  if (value !== null && value !== undefined) {
    throw new AssertionError(message || `值应为空，实际为 ${JSON.stringify(value)}`);
  }
}

/**
 * 断言数组包含元素
 */
export function assertContains<T>(array: T[], item: T, message?: string): void {
  if (!array.includes(item)) {
    throw new AssertionError(
      message || `数组不包含元素 ${JSON.stringify(item)}`
    );
  }
}

/**
 * 断言数组长度
 */
export function assertLength<T>(array: T[], length: number, message?: string): void {
  if (array.length !== length) {
    throw new AssertionError(
      message || `数组长度应为 ${length}，实际为 ${array.length}`
    );
  }
}

/**
 * 断言抛出错误
 */
export async function assertThrows(
  fn: () => Promise<void> | void,
  errorType?: new (...args: unknown[]) => Error,
  message?: string
): Promise<Error> {
  try {
    await fn();
    throw new AssertionError(message || '期望抛出错误，但没有抛出');
  } catch (error) {
    if (error instanceof AssertionError) {
      throw error;
    }
    if (errorType && !(error instanceof errorType)) {
      throw new AssertionError(
        message || `期望抛出 ${errorType.name}，实际抛出 ${(error as Error).name}`
      );
    }
    return error as Error;
  }
}

/**
 * 断言类型
 */
export function assertType<T>(value: unknown, message?: string): asserts value is T {
  // 类型断言占位符，实际类型检查由 TypeScript 编译时完成
  if (message) {
    // 如果提供了消息，至少验证值不是 undefined
    if (value === undefined) {
      throw new AssertionError(message);
    }
  }
}

/**
 * 断言字符串匹配正则
 */
export function assertMatch(value: string, pattern: RegExp, message?: string): void {
  if (!pattern.test(value)) {
    throw new AssertionError(
      message || `字符串 "${value}" 不匹配模式 ${pattern}`
    );
  }
}

/**
 * 断言数值在范围内
 */
export function assertInRange(
  value: number,
  min: number,
  max: number,
  message?: string
): void {
  if (value < min || value > max) {
    throw new AssertionError(
      message || `值 ${value} 不在范围 [${min}, ${max}] 内`
    );
  }
}

// ============================================
// 测试运行器
// ============================================

class TestRunner {
  private suites: Map<string, TestCase[]> = new Map();
  private currentSuite: string = 'default';
  private options: TestRunnerOptions;

  constructor(options: TestRunnerOptions = {}) {
    this.options = {
      verbose: true,
      timeout: 5000,
      ...options,
    };
  }

  /**
   * 定义测试套件
   */
  describe(name: string, fn: () => void): void {
    const previousSuite = this.currentSuite;
    this.currentSuite = name;
    
    if (!this.suites.has(name)) {
      this.suites.set(name, []);
    }
    
    fn();
    
    this.currentSuite = previousSuite;
  }

  /**
   * 定义测试用例
   */
  test(name: string, fn: TestFn): void {
    const suite = this.suites.get(this.currentSuite);
    if (suite) {
      suite.push({ name, fn });
    }
  }

  /**
   * 定义仅运行的测试
   */
  only(name: string, fn: TestFn): void {
    // 清除其他测试，只运行此测试
    this.suites.clear();
    this.suites.set(this.currentSuite, [{ name, fn }]);
  }

  /**
   * 跳过测试
   */
  skip(name: string, _fn: TestFn): void {
    if (this.options.verbose) {
      console.log(`  ⊘ 跳过: ${name}`);
    }
  }

  /**
   * 运行所有测试
   */
  async run(): Promise<TestSuite[]> {
    const results: TestSuite[] = [];

    for (const [suiteName, tests] of this.suites) {
      if (this.options.verbose) {
        console.log(`\n📋 ${suiteName}`);
        console.log('─'.repeat(50));
      }

      const suite: TestSuite = {
        name: suiteName,
        tests: [],
        passed: 0,
        failed: 0,
        duration: 0,
      };

      const suiteStart = Date.now();

      for (const test of tests) {
        const testStart = Date.now();
        const result: TestResult = {
          name: test.name,
          passed: false,
          duration: 0,
        };

        try {
          // 运行测试，带超时
          await this.runWithTimeout(test.fn, this.options.timeout!);
          result.passed = true;
          suite.passed++;

          if (this.options.verbose) {
            console.log(`  ✅ ${test.name} (${Date.now() - testStart}ms)`);
          }
        } catch (error) {
          result.passed = false;
          result.error = error instanceof Error ? error.message : String(error);
          suite.failed++;

          if (this.options.verbose) {
            console.log(`  ❌ ${test.name}`);
            console.log(`     错误: ${result.error}`);
          }
        }

        result.duration = Date.now() - testStart;
        suite.tests.push(result);
      }

      suite.duration = Date.now() - suiteStart;
      results.push(suite);

      if (this.options.verbose) {
        console.log(
          `\n  结果: ${suite.passed} 通过 / ${suite.failed} 失败 / ${suite.duration}ms`
        );
      }
    }

    return results;
  }

  /**
   * 带超时运行测试
   */
  private async runWithTimeout(fn: TestFn, timeout: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`测试超时（${timeout}ms）`));
      }, timeout);

      Promise.resolve(fn())
        .then(() => {
          clearTimeout(timer);
          resolve();
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }
}

// 全局测试运行器实例
const globalRunner = new TestRunner();

// ============================================
// 导出测试 API
// ============================================

/**
 * 定义测试套件
 */
export function describe(name: string, fn: () => void): void {
  globalRunner.describe(name, fn);
}

/**
 * 定义测试用例
 */
export function test(name: string, fn: TestFn): void {
  globalRunner.test(name, fn);
}

/**
 * 定义仅运行的测试
 */
export function only(name: string, fn: TestFn): void {
  globalRunner.only(name, fn);
}

/**
 * 跳过测试
 */
export function skip(name: string, fn: TestFn): void {
  globalRunner.skip(name, fn);
}

/**
 * 运行所有测试
 */
export async function runTests(): Promise<TestSuite[]> {
  return globalRunner.run();
}

/**
 * 创建新的测试运行器
 */
export function createTestRunner(options?: TestRunnerOptions): TestRunner {
  return new TestRunner(options);
}

// ============================================
// Mock 工具
// ============================================

/**
 * 创建 Mock 函数
 */
export function createMock<T extends (...args: unknown[]) => unknown>(
  implementation?: T
): {
  mock: T;
  calls: unknown[][];
  results: unknown[];
  clear: () => void;
} {
  const calls: unknown[][] = [];
  const results: unknown[] = [];

  const mock = ((...args: unknown[]) => {
    calls.push(args);
    const result = implementation ? implementation(...args) : undefined;
    results.push(result);
    return result;
  }) as T;

  return {
    mock,
    calls,
    results,
    clear: () => {
      calls.length = 0;
      results.length = 0;
    },
  };
}

/**
 * 创建 Mock 对象
 */
export function createMockObject<T extends object>(
  overrides: Partial<T> = {}
): T {
  const handler: ProxyHandler<T> = {
    get(target, prop) {
      if (prop in overrides) {
        return overrides[prop as keyof T];
      }
      // 返回一个 Mock 函数
      return createMock().mock;
    },
  };

  return new Proxy({} as T, handler);
}

// ============================================
// 测试数据生成器
// ============================================

/**
 * 生成随机 ID
 */
export function randomId(): string {
  return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 生成随机整数
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 生成随机字符串
 */
export function randomString(length: number = 10): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

/**
 * 生成随机邮箱
 */
export function randomEmail(): string {
  return `${randomString(8).toLowerCase()}@test.com`;
}

/**
 * 生成随机日期
 */
export function randomDate(start?: Date, end?: Date): Date {
  const startTime = start?.getTime() || new Date(2020, 0, 1).getTime();
  const endTime = end?.getTime() || Date.now();
  return new Date(startTime + Math.random() * (endTime - startTime));
}

// ============================================
// 导出简写
// ============================================

export { test as it };
