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
        error: '未登录',
      }, { status: 401 });
    }

    // 验证会话
    const result = await validateSession(accessToken, refreshTokenValue || undefined);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || '会话已过期',
      }, { status: 401 });
    }

    // 创建响应
    const response = NextResponse.json({
      success: true,
      data: result.user,
      shouldRefresh: result.shouldRefresh,
    });

    // 如果需要刷新 Token，生成新的 Token 对
    if (result.shouldRefresh && result.payload && refreshTokenValue) {
      const { refreshToken: doRefreshToken } = await import('@/lib/auth/session');
      const refreshResult = await doRefreshToken(refreshTokenValue, process.env.NODE_ENV === 'production');
      
      if (refreshResult.success && refreshResult.tokens) {
        setAuthCookies(response, refreshResult.tokens, result.payload.userId, process.env.NODE_ENV === 'production');
      }
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
