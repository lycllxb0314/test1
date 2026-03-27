/**
 * 用户登出 API
 */

import { NextRequest } from 'next/server';
import { clearAuthCookies } from '@/lib/auth/session';
import { ok, serverError } from '@/lib/api';

/**
 * POST - 用户登出
 * 
 * 清除认证 Cookie，使会话失效
 */
export async function POST(request: NextRequest) {
  try {
    const response = ok(null, { message: '登出成功' });

    // 清除认证 Cookie
    clearAuthCookies(response);

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return serverError('登出失败');
  }
}
