/**
 * 用户登录 API
 * 
 * 使用 JWT 会话管理
 * 包含限流保护（防暴力破解）
 */

import { NextRequest, NextResponse } from 'next/server';
import { login, setAuthCookies, type LoginResult } from '@/lib/auth/session';
import { loginRateLimiter, ok, fail, serverError } from '@/lib/api';

/**
 * POST - 用户登录
 * 
 * 请求体：
 * - username: 用户名/工号/手机号
 * - password: 密码
 * 
 * 返回：
 * - success: 是否成功
 * - data: 用户信息和 tokens
 * - message: 提示信息
 */
export async function POST(request: NextRequest) {
  // 限流检查（防暴力破解：15分钟内最多5次尝试）
  const rateLimitResult = await loginRateLimiter(request);
  if (rateLimitResult) {
    return rateLimitResult;
  }
  
  try {
    const body = await request.json();
    const { username, password } = body;

    // 判断是否为生产环境
    const isProduction = process.env.NODE_ENV === 'production';

    // 执行登录
    const result: LoginResult = await login(username, password, isProduction);

    if (!result.success) {
      return fail(result.error || '登录失败', undefined, 401);
    }

    // 创建响应 - 同时返回 accessToken 以便前端可以使用 Authorization header
    const response = ok({
      user: result.user,
      tokens: result.tokens ? {
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
        expiresIn: result.tokens.expiresIn,
        refreshExpiresIn: result.tokens.refreshExpiresIn,
      } : undefined,
    }, { message: '登录成功' });

    // 设置认证 Cookie
    if (result.tokens && result.user) {
      setAuthCookies(response, result.tokens, result.user.id, isProduction);
    }

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return serverError('登录失败，请稍后重试');
  }
}
