/**
 * API 错误处理测试
 * 
 * 测试 API 错误处理模块的核心功能
 */

import {
  describe,
  test,
  runTests,
  assert,
  assertEqual,
  assertNotNull,
  assertThrows,
  createMock,
  randomId,
} from './lib/test-utils';
import {
  ApiError,
  isApiError,
  toApiError,
  errorResponse,
  successResponse,
  validateRequired,
  validateTypes,
  validateOrThrow,
  generateRequestId,
} from './lib/api-error';

// ============================================
// API 错误类测试
// ============================================

describe('ApiError 类', () => {
  test('创建 400 错误', () => {
    const error = ApiError.badRequest('参数错误');
    assertEqual(error.statusCode, 400);
    assertEqual(error.code, 'BAD_REQUEST');
    assertEqual(error.message, '参数错误');
    assert(error.isKnown, '应为已知错误');
  });

  test('创建 401 错误', () => {
    const error = ApiError.unauthorized();
    assertEqual(error.statusCode, 401);
    assertEqual(error.code, 'UNAUTHORIZED');
  });

  test('创建 404 错误', () => {
    const error = ApiError.notFound('用户');
    assertEqual(error.statusCode, 404);
    assertEqual(error.message, '用户不存在');
  });

  test('创建带详情的错误', () => {
    const details = { field: 'email', reason: 'invalid format' };
    const error = ApiError.badRequest('验证失败', details);
    assertEqual(error.details, details);
  });
});

// ============================================
// 错误转换测试
// ============================================

describe('错误转换', () => {
  test('转换普通错误为 ApiError', () => {
    const originalError = new Error('测试错误');
    const apiError = toApiError(originalError);
    
    assert(isApiError(apiError), '转换后应为 ApiError');
    assertEqual(apiError.statusCode, 500);
    assertEqual(apiError.message, '测试错误');
  });

  test('识别 ApiError', () => {
    const apiError = ApiError.badRequest('错误');
    const normalError = new Error('普通错误');
    
    assert(isApiError(apiError), '应识别为 ApiError');
    assert(!isApiError(normalError), '不应识别为 ApiError');
  });

  test('转换数据库错误', () => {
    const dbError = new Error('duplicate key value violates unique constraint');
    const apiError = toApiError(dbError);
    
    assertEqual(apiError.code, 'CONFLICT');
    assertEqual(apiError.statusCode, 409);
  });
});

// ============================================
// 响应生成测试
// ============================================

describe('响应生成', () => {
  test('创建成功响应', async () => {
    const response = successResponse({ id: 1, name: '测试' });
    const json = await response.json();
    
    assertEqual(json.success, true);
    assertNotNull(json.data);
    assertEqual(json.data.id, 1);
    assertEqual(json.data.name, '测试');
  });

  test('创建错误响应', async () => {
    const error = ApiError.notFound('资源');
    const response = errorResponse(error);
    
    assertEqual(response.status, 404);
    
    const json = await response.json();
    assertEqual(json.success, false);
    assertNotNull(json.error);
  });
});

// ============================================
// 输入验证测试
// ============================================

describe('输入验证', () => {
  test('验证必填字段 - 通过', () => {
    const result = validateRequired(
      { name: '测试', email: 'test@test.com' },
      ['name', 'email']
    );
    
    assert(result.valid, '验证应通过');
    assertEqual(Object.keys(result.errors).length, 0);
  });

  test('验证必填字段 - 失败', () => {
    const result = validateRequired(
      { name: '测试' },
      ['name', 'email']
    );
    
    assert(!result.valid, '验证应失败');
    assertNotNull(result.errors.email);
  });

  test('验证类型 - 通过', () => {
    const result = validateTypes(
      { name: '测试', age: 18, active: true },
      { name: 'string', age: 'number', active: 'boolean' }
    );
    
    assert(result.valid, '验证应通过');
  });

  test('验证类型 - 失败', () => {
    const result = validateTypes(
      { name: '测试', age: '18' },
      { name: 'string', age: 'number' }
    );
    
    assert(!result.valid, '验证应失败');
    assertNotNull(result.errors.age);
  });

  test('验证并抛出错误', async () => {
    await assertThrows(() => {
      validateOrThrow({}, { required: ['name'] });
    }, ApiError);
  });
});

// ============================================
// 工具函数测试
// ============================================

describe('工具函数', () => {
  test('生成请求 ID', () => {
    const id1 = generateRequestId();
    const id2 = generateRequestId();
    
    assert(id1.startsWith('req_'), 'ID 应以 req_ 开头');
    assert(id1 !== id2, 'ID 应唯一');
  });
});

// ============================================
// 运行测试
// ============================================

// 如果直接运行此文件
if (typeof require !== 'undefined' && require.main === module) {
  runTests().then((suites) => {
    const allPassed = suites.every((s) => s.failed === 0);
    process.exit(allPassed ? 0 : 1);
  });
}

export { runTests };
