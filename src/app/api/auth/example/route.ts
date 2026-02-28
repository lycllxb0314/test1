/**
 * 认证示例 API 路由
 * 展示如何使用认证中间件保护 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute, adminOnlyRoute, teacherOnlyRoute, academicRoute } from '@/lib/auth';

/**
 * GET - 获取当前用户信息（需要登录）
 * 使用 protectedRoute 基本认证保护
 */
export const GET = protectedRoute(
  async (request, { user }) => {
    return NextResponse.json({
      success: true,
      data: {
        message: '您已登录',
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
        },
      },
    });
  }
);

/**
 * POST - 仅管理员可访问的接口
 * 使用 adminOnlyRoute 保护
 */
export const POST = adminOnlyRoute(
  async (request, { user }) => {
    return NextResponse.json({
      success: true,
      data: {
        message: '管理员专属数据',
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
        },
      },
    });
  }
);

/**
 * PUT - 教务相关接口（需要教务模块权限）
 * 使用 academicRoute 保护
 * 
 * 注意：Next.js 不支持多个相同 HTTP 方法的导出
 * 这里只是示例，实际使用时需要分开文件
 */
// export const PUT = academicRoute(
//   async (request, { user }) => {
//     return NextResponse.json({
//       success: true,
//       data: {
//         message: '教务管理数据',
//       },
//     });
//   },
//   'manage' // 需要 manage 权限
// );
