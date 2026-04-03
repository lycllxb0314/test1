/**
 * 认证中间件核心
 * 提供用户认证、会话验证和权限检查功能
 * 
 * 支持 JWT 会话验证
 */

import { NextRequest, NextResponse } from 'next/server';
import { User, UserRole, ModuleType, Permission, GROUP_CONFIGS, UserGroupMembership } from '@/types';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { ROLE_PERMISSIONS, getRoleModules, hasPermission, canAccessModule } from './permissions';
import { validateSession as validateJwtSession, extractTokens } from './session';

// 是否使用 Mock 数据（开发环境）
const USE_MOCK_DATA = process.env.NODE_ENV !== 'production';

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
 * 认证中间件
 * 验证请求中的用户身份（支持 JWT 和传统方式）
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  // 1. 优先尝试 JWT 认证
  const { accessToken, refreshToken } = extractTokens(request);
  
  if (accessToken) {
    const sessionResult = await validateJwtSession(accessToken, refreshToken || undefined);
    
    if (sessionResult.success && sessionResult.user) {
      // 支持前端临时角色切换（仅用于演示）
      const overrideRole = request.headers.get('x-user-role') as UserRole | null;
      if (overrideRole && sessionResult.user.role !== overrideRole) {
        sessionResult.user.role = overrideRole;
      }
      return {
        success: true,
        user: sessionResult.user,
      };
    }
    
    // JWT 认证失败，不直接返回错误，而是尝试降级到传统认证
  }

  // 2. 降级到传统认证方式（向后兼容）
  const userId = extractUserIdLegacy(request);

  if (!userId) {
    return {
      success: false,
      error: '未登录，请先登录',
      statusCode: 401,
    };
  }

  const result = await validateSessionLegacy(userId);
  
  // 支持前端临时角色切换（仅用于演示）
  if (result.success && result.user) {
    const overrideRole = request.headers.get('x-user-role') as UserRole | null;
    if (overrideRole && result.user.role !== overrideRole) {
      result.user.role = overrideRole;
    }
  }
  
  return result;
}

/**
 * 从请求中获取用户ID（传统方式，向后兼容）
 * 支持多种方式：
 * 1. Header: x-user-id
 * 2. Query: userId
 * 3. Cookie: smart_campus_user_id
 */
export function extractUserIdLegacy(request: NextRequest): string | null {
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
 * 验证用户会话（传统方式）
 */
export async function validateSessionLegacy(userId: string): Promise<AuthResult> {
  // 生产模式：从数据库验证
  // userId 可能是工号（employee_id）或 UUID，优先用工号查询
  try {
    const client = getSupabaseClient();
    
    // 判断是否是 UUID 格式
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    
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
        status,
        employee_id,
        additional_roles
      `)
      .eq(isUUID ? 'id' : 'employee_id', userId)
      .eq('status', 'active')
      .single();

    if (error || !user) {
      return {
        success: false,
        error: '用户不存在或已被禁用',
        statusCode: 401,
      };
    }

    // 查询用户所属群组
    const userEmployeeId = user.employee_id;
    let groups: UserGroupMembership[] = [];
    
    if (userEmployeeId) {
      const { data: groupMemberships } = await client
        .from('group_members')
        .select('group_id, group_type, is_admin, join_type')
        .eq('user_id', userEmployeeId);

      if (groupMemberships && groupMemberships.length > 0) {
        groups = groupMemberships.map((gm) => ({
          groupId: gm.group_id,
          groupType: gm.group_type as UserGroupMembership['groupType'],
          groupName: GROUP_CONFIGS[gm.group_type as keyof typeof GROUP_CONFIGS]?.name || gm.group_type,
          isAdmin: gm.is_admin,
          joinType: gm.join_type as 'auto' | 'manual',
        }));
      }
    }

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        employeeId: user.employee_id,
        phone: user.phone,
        email: user.email,
        department: user.department,
        position: user.position,
        classId: user.class_id,
        className: user.class_name,
        subjects: user.subjects,
        avatar: user.avatar,
        children: user.children,
        additionalRoles: user.additional_roles,
        groups, // 添加群组成员信息
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
export function withRole(role: UserRole | UserRole[]) {
  const roles = Array.isArray(role) ? role : [role];
  
  return (
    handler: (request: NextRequest, context: { user: User }) => Promise<NextResponse>
  ) => {
    return async (request: NextRequest) => {
      const authResult = await authenticateRequest(request);
      
      if (!authResult.success || !authResult.user) {
        return createAuthErrorResponse(authResult);
      }

      if (!roles.includes(authResult.user.role)) {
        return NextResponse.json(
          {
            success: false,
            error: '权限不足',
            code: 'FORBIDDEN',
          },
          { status: 403 }
        );
      }

      return handler(request, { user: authResult.user });
    };
  };
}

/**
 * 要求模块访问权限的高阶函数
 */
export function withModuleAccess(module: ModuleType) {
  return (
    handler: (request: NextRequest, context: { user: User }) => Promise<NextResponse>
  ) => {
    return async (request: NextRequest) => {
      const authResult = await authenticateRequest(request);
      
      if (!authResult.success || !authResult.user) {
        return createAuthErrorResponse(authResult);
      }

      if (!checkModuleAccess(authResult.user, module)) {
        return NextResponse.json(
          {
            success: false,
            error: '无权访问此模块',
            code: 'MODULE_FORBIDDEN',
          },
          { status: 403 }
        );
      }

      return handler(request, { user: authResult.user });
    };
  };
}

/**
 * 要求特定权限的高阶函数
 */
export function withPermission(module: ModuleType, permission: Permission) {
  return (
    handler: (request: NextRequest, context: { user: User }) => Promise<NextResponse>
  ) => {
    return async (request: NextRequest) => {
      const authResult = await authenticateRequest(request);
      
      if (!authResult.success || !authResult.user) {
        return createAuthErrorResponse(authResult);
      }

      if (!checkPermission(authResult.user, module, permission)) {
        return NextResponse.json(
          {
            success: false,
            error: '权限不足',
            code: 'PERMISSION_DENIED',
          },
          { status: 403 }
        );
      }

      return handler(request, { user: authResult.user });
    };
  };
}

// 向后兼容的导出
export const extractUserId = extractUserIdLegacy;
export const validateSession = validateSessionLegacy;
