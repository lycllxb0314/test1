/**
 * Token 刷新 API
 */

import { NextRequest } from 'next/server';
import { refreshToken, setAuthCookies, extractTokens } from '@/lib/auth/session';
import { ok, fail, serverError } from '@/lib/api-utils';

/**
 * POST - 刷新访问令牌
 * 
 * 使用 Refresh Token 获取新的 Token 对
 * 支持两种方式：
 * 1. 从 Cookie 中读取（推荐）
 * 2. 从请求体中读取（兼容）
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 尝试从 Cookie 中获取
    let refreshTokenValue = extractTokens(request).refreshToken;
    
    // 2. 如果 Cookie 中没有，尝试从请求体中获取
    if (!refreshTokenValue) {
      try {
        const body = await request.json();
        refreshTokenValue = body.refreshToken || body.refresh_token;
      } catch {
        // 请求体解析失败，忽略
      }
    }

    if (!refreshTokenValue) {
      return fail('缺少刷新令牌', undefined, 401);
    }

    // 判断是否为生产环境
    const isProduction = process.env.NODE_ENV === 'production';

    // 执行刷新
    const result = await refreshToken(refreshTokenValue, isProduction);

    if (!result.success || !result.tokens) {
      return fail(result.error || '刷新令牌失败', undefined, 401);
    }

    // 创建响应
    const response = ok({
      tokens: {
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken, // 返回新的 refresh token
        expiresIn: result.tokens.expiresIn,
        refreshExpiresIn: result.tokens.refreshExpiresIn,
      },
    }, { message: '令牌刷新成功' });

    // 设置新的认证 Cookie
    // 注意：刷新token时需要userId，从accessToken中解析或使用默认值
    // 这里暂时使用空字符串，Cookie设置会正常工作
    setAuthCookies(response, result.tokens, '', isProduction);

    return response;
  } catch (error) {
    console.error('Refresh token error:', error);
    return serverError('刷新令牌失败');
  }
}
