/**
 * 会话管理服务
 * 
 * 提供用户登录、登出、会话验证等功能
 * 
 * 统一身份角色来自教务系统：
 * - 主要角色：决定登录身份
 * - 兼任职务：只增加权限
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { User, UserRole, AdministrativeRole, UserGroupMembership, GROUP_CONFIGS } from '@/types';
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

// 角色名称映射（用于登录时的角色名转换）
const roleNameToRole: Record<string, UserRole> = {
  '校长': 'principal',
  '书记': 'secretary',
  '教学副校长': 'academic_vice_principal',
  '德育副校长': 'moral_vice_principal',
  '总务副校长': 'general_vice_principal',
  '班主任': 'head_teacher',
  '科任教师': 'subject_teacher',
  '技能课教师': 'skill_teacher',
  '家长': 'parent',
};

// 兼任职务名称映射
const adminRoleNameToRole: Record<string, AdministrativeRole> = {
  '教务主任': 'academic_director',
  '德育主任': 'moral_director',
  '总务主任': 'general_director',
  '年段长': 'grade_leader',
  '教研组组长': 'research_group_leader',
  '教研组副组长': 'research_group_deputy_leader',
  '少先队大队辅导员': 'young_pioneer_counselor',
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

  // 2. 从数据库查询用户
  const client = getSupabaseClient();
  
  // 支持多种登录方式：工号、手机号、姓名
  const { data: dbUser, error } = await client
    .from('users')
    .select('*')
    .or(`employee_id.eq.${username},phone.eq.${username},name.eq.${username}`)
    .eq('status', 'active')
    .single();

  if (error || !dbUser) {
    // 如果用户表为空，尝试从教师表迁移
    if (error?.code === 'PGRST116') {
      return { success: false, error: '用户不存在，请先运行用户迁移 /api/migrate/users' };
    }
    return { success: false, error: '用户不存在' };
  }

  // 3. 验证密码（使用 bcrypt）
  if (!dbUser.password_hash) {
    return { success: false, error: '用户密码未设置，请联系管理员' };
  }
  
  const isValidPassword = await bcrypt.compare(password, dbUser.password_hash);

  if (!isValidPassword) {
    return { success: false, error: '密码错误' };
  }

  // 4. 构建用户信息
  const user: User = {
    id: dbUser.id,
    name: dbUser.name,
    role: dbUser.role as UserRole,
    employeeId: dbUser.employee_id,
    phone: dbUser.phone,
    email: dbUser.email,
    department: dbUser.department,
    position: dbUser.position,
    classId: dbUser.class_id,
    className: dbUser.class_name,
    children: dbUser.children,
    additionalRoles: dbUser.additional_roles as AdministrativeRole[] | undefined,
  };

  // 5. 如果是科任教师，查询其负责的班级
  if (dbUser.role === 'subject_teacher' && dbUser.employee_id) {
    // 通过 employee_id 从 teachers 表获取教师 ID
    const { data: teacherData } = await client
      .from('teachers')
      .select('id')
      .eq('employee_id', dbUser.employee_id)
      .single();
    
    if (teacherData) {
      // 查询该教师作为科任负责的班级
      const { data: subTeacherClasses } = await client
        .from('classes')
        .select('id, name')
        .eq('sub_teacher_id', teacherData.id);
      
      if (subTeacherClasses && subTeacherClasses.length > 0) {
        user.subTeacherClasses = subTeacherClasses.map(cls => ({
          classId: cls.id,
          className: cls.name,
        }));
      }
    }
  }

  // 6. 查询用户所属群组（通过工号关联）
  const { data: groupMemberships } = await client
    .from('group_members')
    .select('group_id, group_type, is_admin, join_type')
    .eq('user_id', dbUser.employee_id);

  if (groupMemberships && groupMemberships.length > 0) {
    user.groups = groupMemberships.map((gm: { group_id: string; group_type: string; is_admin: boolean; join_type: string }) => ({
      groupId: gm.group_id,
      groupType: gm.group_type as UserGroupMembership['groupType'],
      groupName: GROUP_CONFIGS[gm.group_type as keyof typeof GROUP_CONFIGS]?.name || gm.group_type,
      isAdmin: gm.is_admin,
      joinType: gm.join_type as 'auto' | 'manual',
    }));
  }

  // 7. 生成 Token 对
  const tokens = await generateTokenPair({
    id: user.id,
    name: user.name,
    role: user.role,
  });

  return {
    success: true,
    user,
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
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('users')
    .select(`
      id, name, role, phone, email, department, position,
      class_id, class_name, subjects, avatar, children, status,
      additional_roles, employee_id
    `)
    .eq('id', payload.userId)
    .eq('status', 'active')
    .single();

  if (error || !data) {
    return { success: false, error: '用户不存在或已被禁用' };
  }

  const user: User = {
    ...data,
    classId: data.class_id,
    className: data.class_name,
    additionalRoles: data.additional_roles,
    employeeId: data.employee_id,
  };

  // 如果是科任教师，通过 employee_id 关联 teachers 表查询其负责的班级
  if (data.role === 'subject_teacher' && data.employee_id) {
    // 通过 employee_id 获取教师 ID
    const { data: teacherData } = await client
      .from('teachers')
      .select('id')
      .eq('employee_id', data.employee_id)
      .single();
    
    if (teacherData) {
      const { data: subTeacherClasses } = await client
        .from('classes')
        .select('id, name')
        .eq('sub_teacher_id', teacherData.id);
      
      if (subTeacherClasses && subTeacherClasses.length > 0) {
        user.subTeacherClasses = subTeacherClasses.map(cls => ({
          classId: cls.id,
          className: cls.name,
        }));
      }
    }
  }

  // 查询用户所属群组（通过工号关联）
  const { data: groupMemberships } = await client
    .from('group_members')
    .select('group_id, group_type, is_admin, join_type')
    .eq('user_id', data.employee_id);

  if (groupMemberships && groupMemberships.length > 0) {
    user.groups = groupMemberships.map((gm: { group_id: string; group_type: string; is_admin: boolean; join_type: string }) => ({
      groupId: gm.group_id,
      groupType: gm.group_type as UserGroupMembership['groupType'],
      groupName: GROUP_CONFIGS[gm.group_type as keyof typeof GROUP_CONFIGS]?.name || gm.group_type,
      isAdmin: gm.is_admin,
      joinType: gm.join_type as 'auto' | 'manual',
    }));
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

/**
 * 从请求中获取用户信息
 * 
 * 用于 API 路由中验证用户身份
 */
export async function getUserFromSession(request: NextRequest): Promise<User | null> {
  const { accessToken, refreshToken } = extractTokens(request);
  
  if (!accessToken) {
    return null;
  }
  
  const result = await validateSession(accessToken, refreshToken || undefined);
  
  if (!result.success || !result.user) {
    return null;
  }
  
  return result.user;
}
