/**
 * 认证中间件核心
 * 提供用户认证、会话验证和权限检查功能
 */

import { NextRequest, NextResponse } from 'next/server';
import { User, UserRole, ModuleType, Permission } from '@/types';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { ROLE_PERMISSIONS, getRoleModules, hasPermission, canAccessModule } from './permissions';

// 是否使用 Mock 数据（开发环境）
const USE_MOCK_DATA = process.env.NODE_ENV !== 'production';

// Mock 用户数据
const MOCK_USERS: Record<string, User> = {
  '1': { id: '1', name: '张明华', role: 'principal', phone: '138****1001' },
  '2': { id: '2', name: '李红梅', role: 'academic_director', phone: '138****1002' },
  '3': { id: '3', name: '王建国', role: 'head_teacher', phone: '138****1003', classId: 'c6-1', className: '六年级1班' },
  '4': { id: '4', name: '陈晓燕', role: 'teacher', phone: '138****1004' },
  '5': { id: '5', name: '刘洋', role: 'grade_leader', phone: '138****1005' },
};

// Session 配置
const SESSION_HEADER = 'x-session-token';
const USER_ID_HEADER = 'x-user-id';

/**
 * 认证结果
 */
export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
  statusCode?: number;
}

/**
 * 从请求中获取用户ID
 * 支持多种方式：
 * 1. Header: x-user-id
 * 2. Query: userId
 * 3. Cookie: smart_campus_user_id
 */
export function extractUserId(request: NextRequest): string | null {
  // 1. 从 Header 获取
  const headerUserId = request.headers.get(USER_ID_HEADER);
  if (headerUserId) return headerUserId;

  // 2. 从 Query 参数获取
  const { searchParams } = new URL(request.url);
  const queryUserId = searchParams.get('userId');
  if (queryUserId) return queryUserId;

  // 3. 从 Cookie 获取
  const cookieUserId = request.cookies.get('smart_campus_user_id')?.value;
  if (cookieUserId) return cookieUserId;

  return null;
}

/**
 * 验证用户会话
 * 从数据库获取用户信息并验证状态
 */
export async function validateSession(userId: string): Promise<AuthResult> {
  // Mock 模式：使用 Mock 数据
  if (USE_MOCK_DATA) {
    const user = MOCK_USERS[userId];
    if (!user) {
      return {
        success: false,
        error: '用户不存在或已被禁用',
        statusCode: 401,
      };
    }
    return {
      success: true,
      user,
    };
  }

  // 生产模式：从数据库验证
  try {
    const client = getSupabaseClient();
    
    const { data: user, error } = await client
      .from('users')
      .select(`
        id,
        name,
        role,
        phone,
        email,
        department,
        position,
        class_id,
        class_name,
        subjects,
        avatar,
        children,
        status
      `)
      .eq('id', userId)
      .eq('status', 'active')
      .single();

    if (error || !user) {
      return {
        success: false,
        error: '用户不存在或已被禁用',
        statusCode: 401,
      };
    }

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        phone: user.phone,
        email: user.email,
        department: user.department,
        position: user.position,
        classId: user.class_id,
        className: user.class_name,
        subjects: user.subjects,
        avatar: user.avatar,
        children: user.children,
      },
    };
  } catch (error) {
    console.error('Session validation error:', error);
    return {
      success: false,
      error: '会话验证失败',
      statusCode: 500,
    };
  }
}

/**
 * 认证中间件
 * 验证请求中的用户身份
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  const userId = extractUserId(request);

  if (!userId) {
    return {
      success: false,
      error: '未登录，请先登录',
      statusCode: 401,
    };
  }

  return validateSession(userId);
}

/**
 * 创建认证失败的响应
 */
export function createAuthErrorResponse(result: AuthResult): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: result.error || '认证失败',
      code: 'AUTH_FAILED',
    },
    { status: result.statusCode || 401 }
  );
}

/**
 * 检查用户是否有指定模块的访问权限
 */
export function checkModuleAccess(user: User, module: ModuleType): boolean {
  return canAccessModule(user.role, module);
}

/**
 * 检查用户是否有指定权限
 */
export function checkPermission(user: User, module: ModuleType, permission: Permission): boolean {
  return hasPermission(user.role, module, permission);
}

/**
 * 要求用户认证的高阶函数
 * 用于包装 API 路由处理器
 */
export function withAuth(
  handler: (request: NextRequest, context: { user: User }) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const authResult = await authenticateRequest(request);
    
    if (!authResult.success || !authResult.user) {
      return createAuthErrorResponse(authResult);
    }

    return handler(request, { user: authResult.user });
  };
}

/**
 * 要求特定角色的高阶函数
 */
export function withRole(
  allowedRoles: UserRole | UserRole[],
  handler: (request: NextRequest, context: { user: User }) => Promise<NextResponse>
) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
  return withAuth(async (request, context) => {
    if (!roles.includes(context.user.role)) {
      return NextResponse.json(
        {
          success: false,
          error: '权限不足，无法访问此资源',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }
    
    return handler(request, context);
  });
}

/**
 * 要求特定模块访问权限的高阶函数
 */
export function withModuleAccess(
  module: ModuleType,
  handler: (request: NextRequest, context: { user: User }) => Promise<NextResponse>
) {
  return withAuth(async (request, context) => {
    if (!checkModuleAccess(context.user, module)) {
      return NextResponse.json(
        {
          success: false,
          error: '您没有访问此模块的权限',
          code: 'MODULE_FORBIDDEN',
        },
        { status: 403 }
      );
    }
    
    return handler(request, context);
  });
}

/**
 * 要求特定权限的高阶函数
 */
export function withPermission(
  module: ModuleType,
  permission: Permission,
  handler: (request: NextRequest, context: { user: User }) => Promise<NextResponse>
) {
  return withAuth(async (request, context) => {
    if (!checkPermission(context.user, module, permission)) {
      return NextResponse.json(
        {
          success: false,
          error: '您没有执行此操作的权限',
          code: 'PERMISSION_DENIED',
        },
        { status: 403 }
      );
    }
    
    return handler(request, context);
  });
}

// 注意：isAdminRole, isTeacherRole, isDirectorRole 函数已在 permissions.ts 中定义
