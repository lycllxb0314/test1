/**
 * 获取当前用户信息 API
 * 
 * 使用 JWT 验证会话
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateSession, extractTokens, setAuthCookies } from '@/lib/auth/session';

/**
 * GET - 获取当前用户信息
 * 
 * 通过 JWT Token 验证用户身份并返回用户信息
 */
export async function GET(request: NextRequest) {
  try {
    // 提取 Token
    const { accessToken, refreshToken: refreshTokenValue } = extractTokens(request);

    if (!accessToken) {
      return NextResponse.json({
        success: false,
        error: '未登录，请先登录',
        code: 'AUTH_FAILED',
      }, { status: 401 });
    }

    // 验证会话
    const result = await validateSession(accessToken, refreshTokenValue || undefined);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || '会话已过期，请重新登录',
        code: 'AUTH_FAILED',
      }, { status: 401 });
    }

    // 如果需要刷新 Token，生成新的 Token 对
    let newAccessToken: string | undefined;
    let refreshTokens: Awaited<ReturnType<typeof import('@/lib/auth/session').refreshToken>>['tokens'] | undefined;
    
    if (result.shouldRefresh && result.payload && refreshTokenValue) {
      const { refreshToken: doRefreshToken } = await import('@/lib/auth/session');
      const refreshResult = await doRefreshToken(refreshTokenValue, process.env.NODE_ENV === 'production');
      
      if (refreshResult.success && refreshResult.tokens) {
        newAccessToken = refreshResult.tokens.accessToken;
        refreshTokens = refreshResult.tokens;
      }
    }

    // 创建响应
    const response = NextResponse.json({
      success: true,
      data: result.user,
      shouldRefresh: result.shouldRefresh,
      newAccessToken, // 返回新的 access_token
    });

    // 设置新的 Cookie
    if (refreshTokens && result.payload) {
      setAuthCookies(response, refreshTokens, result.payload.userId, process.env.NODE_ENV === 'production');
    }

    return response;
  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json({
      success: false,
      error: '获取用户信息失败',
    }, { status: 500 });
  }
}
