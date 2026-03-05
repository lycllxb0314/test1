/**
 * Token 刷新 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { refreshToken, setAuthCookies, extractTokens } from '@/lib/auth/session';

/**
 * POST - 刷新访问令牌
 * 
 * 使用 Refresh Token 获取新的 Token 对
 */
export async function POST(request: NextRequest) {
  try {
    const { refreshToken: refreshTokenValue } = extractTokens(request);

    if (!refreshTokenValue) {
      return NextResponse.json({
        success: false,
        error: '缺少刷新令牌',
      }, { status: 401 });
    }

    // 判断是否为生产环境
    const isProduction = process.env.NODE_ENV === 'production';

    // 执行刷新
    const result = await refreshToken(refreshTokenValue, isProduction);

    if (!result.success || !result.tokens) {
      return NextResponse.json({
        success: false,
        error: result.error || '刷新令牌失败',
      }, { status: 401 });
    }

    // 创建响应
    const response = NextResponse.json({
      success: true,
      data: {
        tokens: {
          accessToken: result.tokens.accessToken, // 返回新的 access_token
          expiresIn: result.tokens.expiresIn,
          refreshExpiresIn: result.tokens.refreshExpiresIn,
        },
      },
      message: '令牌刷新成功',
    });

    // 设置新的认证 Cookie
    setAuthCookies(response, result.tokens, result.tokens.accessToken, isProduction);

    return response;
  } catch (error) {
    console.error('Refresh token error:', error);
    return NextResponse.json({
      success: false,
      error: '刷新令牌失败',
    }, { status: 500 });
  }
}
