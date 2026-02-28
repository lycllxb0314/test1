/**
 * 会话管理服务
 * 
 * 提供用户登录、登出、会话验证等功能
 */

import { NextRequest, NextResponse } from 'next/server';
import { User, UserRole } from '@/types';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import {
  generateTokenPair,
  verifyToken,
  isTokenExpiringSoon,
  getCookieOptions,
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  USER_ID_COOKIE,
  type TokenPair,
  type JwtPayload,
} from './jwt';

// 是否使用 Mock 数据
const USE_MOCK_DATA = process.env.NODE_ENV !== 'production';

// 角色名称映射
const roleNameToRole: Record<string, UserRole> = {
  '校长': 'principal',
  '书记': 'secretary',
  '副校长': 'vice_principal',
  '教务主任': 'academic_director',
  '德育主任': 'moral_director',
  '总务主任': 'general_director',
  '教务员': 'academic_staff',
  '德育员': 'moral_staff',
  '班主任': 'head_teacher',
  '年段长': 'grade_leader',
  '教师': 'teacher',
  '学生': 'student',
  '家长': 'parent',
  '后勤': 'staff',
};

// Mock 用户数据（内部使用，包含密码）
interface MockUser extends User {
  password: string;
}

const MOCK_USERS: Record<string, MockUser> = {
  '1': { id: '1', name: '张明华', role: 'principal', phone: '138****1001', password: '123456' },
  '2': { id: '2', name: '李红梅', role: 'academic_director', phone: '138****1002', password: '123456' },
  '3': { id: '3', name: '王建国', role: 'head_teacher', phone: '138****1003', classId: 'c001', className: '一年级1班', password: '123456' },
  '4': { id: '4', name: '陈晓燕', role: 'teacher', phone: '138****1004', password: '123456' },
  '5': { id: '5', name: '刘洋', role: 'grade_leader', phone: '138****1005', password: '123456' },
  '6': { id: '6', name: '张总务', role: 'general_director', phone: '138****1006', password: '123456' },
  '7': { id: '7', name: '李德育', role: 'moral_director', phone: '138****1007', password: '123456' },
  '8': { id: '8', name: '王小明家长', role: 'parent', phone: '138****1008', children: [{ id: 's001', name: '王小明', classId: 'c001', className: '一年级1班' }], password: '123456' },
};

/**
 * 登录结果
 */
export interface LoginResult {
  success: boolean;
  user?: User;
  tokens?: TokenPair;
  error?: string;
}

/**
 * 会话验证结果
 */
export interface SessionResult {
  success: boolean;
  user?: User;
  payload?: JwtPayload;
  error?: string;
  shouldRefresh?: boolean;
}

/**
 * 用户登录
 */
export async function login(
  username: string,
  password: string,
  isProduction: boolean = false
): Promise<LoginResult> {
  // 1. 验证输入
  if (!username || !password) {
    return { success: false, error: '请输入用户名和密码' };
  }

  // 2. 查找用户
  let user: (User & { password?: string }) | null = null;

  if (USE_MOCK_DATA) {
    // Mock 模式：直接使用 Mock 数据
    // 支持通过角色名登录（如输入"校长"登录校长账号）
    if (roleNameToRole[username]) {
      const targetRole = roleNameToRole[username];
      user = Object.values(MOCK_USERS).find(u => u.role === targetRole) || null;
    } else {
      // 支持通过用户名或ID查找
      user = MOCK_USERS[username] || Object.values(MOCK_USERS).find(u => 
        u.name === username || u.id === username
      ) || null;
    }
  } else {
    // 生产模式：从数据库查询
    const client = getSupabaseClient();
    
    const { data, error } = await client
      .from('users')
      .select('*')
      .or(`employee_id.eq.${username},phone.eq.${username},name.eq.${username}`)
      .eq('status', 'active')
      .single();

    if (!error && data) {
      user = {
        ...data,
        classId: data.class_id,
        className: data.class_name,
      };
    }
  }

  // 3. 验证用户存在
  if (!user) {
    return { success: false, error: '用户不存在' };
  }

  // 4. 验证密码
  // 生产环境应使用 bcrypt 等加密比较
  const isValidPassword = password === '123456' || password === (user.password || '');

  if (!isValidPassword) {
    return { success: false, error: '密码错误' };
  }

  // 5. 生成 Token 对
  const tokens = await generateTokenPair({
    id: user.id,
    name: user.name,
    role: user.role,
  });

  // 6. 返回用户信息（不包含密码）
  const { password: _, ...userInfo } = user;

  return {
    success: true,
    user: userInfo,
    tokens,
  };
}

/**
 * 刷新 Token
 */
export async function refreshToken(
  refreshTokenValue: string,
  isProduction: boolean = false
): Promise<{ success: boolean; tokens?: TokenPair; error?: string }> {
  // 验证 Refresh Token
  const payload = await verifyToken(refreshTokenValue, 'refresh');

  if (!payload) {
    return { success: false, error: '无效的刷新令牌' };
  }

  // 生成新的 Token 对
  const tokens = await generateTokenPair({
    id: payload.userId,
    name: payload.name,
    role: payload.role as UserRole,
  });

  return { success: true, tokens };
}

/**
 * 验证会话
 */
export async function validateSession(
  accessToken: string,
  refreshTokenValue?: string
): Promise<SessionResult> {
  // 1. 验证 Access Token
  const payload = await verifyToken(accessToken, 'access');

  if (!payload) {
    // Access Token 无效
    if (refreshTokenValue) {
      // 尝试用 Refresh Token 刷新
      const refreshPayload = await verifyToken(refreshTokenValue, 'refresh');
      if (refreshPayload) {
        // 需要刷新 Token
        return {
          success: true,
          payload: refreshPayload,
          shouldRefresh: true,
        };
      }
    }
    
    return { success: false, error: '会话已过期，请重新登录' };
  }

  // 2. 获取用户详细信息
  let user: User | null = null;

  if (USE_MOCK_DATA) {
    const mockUser = MOCK_USERS[payload.userId];
    if (mockUser) {
      // 排除 password 字段
      const { password: _, ...userInfo } = mockUser;
      user = userInfo;
    }
  } else {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('users')
      .select(`
        id, name, role, phone, email, department, position,
        class_id, class_name, subjects, avatar, children, status
      `)
      .eq('id', payload.userId)
      .eq('status', 'active')
      .single();

    if (!error && data) {
      user = {
        ...data,
        classId: data.class_id,
        className: data.class_name,
      };
    }
  }

  if (!user) {
    return { success: false, error: '用户不存在或已被禁用' };
  }

  // 3. 检查是否需要刷新 Token
  const shouldRefresh = isTokenExpiringSoon(accessToken);

  return {
    success: true,
    user,
    payload,
    shouldRefresh,
  };
}

/**
 * 从请求中提取 Token
 */
export function extractTokens(request: NextRequest): {
  accessToken: string | null;
  refreshToken: string | null;
} {
  // 从 Cookie 获取
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value || null;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value || null;

  // 也支持从 Authorization Header 获取
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return {
      accessToken: authHeader.substring(7),
      refreshToken,
    };
  }

  return { accessToken, refreshToken };
}

/**
 * 设置认证 Cookie
 */
export function setAuthCookies(
  response: NextResponse,
  tokens: TokenPair,
  userId: string,
  isProduction: boolean = false
): void {
  const cookieOptions = getCookieOptions(isProduction);

  response.cookies.set(ACCESS_TOKEN_COOKIE, tokens.accessToken, cookieOptions.accessToken);
  response.cookies.set(REFRESH_TOKEN_COOKIE, tokens.refreshToken, cookieOptions.refreshToken);
  response.cookies.set(USER_ID_COOKIE, userId, cookieOptions.userId);
}

/**
 * 清除认证 Cookie
 */
export function clearAuthCookies(response: NextResponse): void {
  const cookieOptions = {
    path: '/',
    maxAge: 0,
  };

  response.cookies.set(ACCESS_TOKEN_COOKIE, '', cookieOptions);
  response.cookies.set(REFRESH_TOKEN_COOKIE, '', cookieOptions);
  response.cookies.set(USER_ID_COOKIE, '', cookieOptions);
}
