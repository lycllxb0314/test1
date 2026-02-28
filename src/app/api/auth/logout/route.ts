/**
 * 用户登出 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookies } from '@/lib/auth/session';

/**
 * POST - 用户登出
 * 
 * 清除认证 Cookie，使会话失效
 */
export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: '登出成功',
    });

    // 清除认证 Cookie
    clearAuthCookies(response);

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({
      success: false,
      error: '登出失败',
    }, { status: 500 });
  }
}
