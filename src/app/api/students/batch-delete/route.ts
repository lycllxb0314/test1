/**
 * 批量删除学生 API
 * 
 * 架构：API Route → Service → Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { studentService } from '@/services/student.service';
import { error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

/**
 * POST - 批量删除学生
 */
export const POST = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(error('请选择要删除的数据', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }

    // 限制单次删除数量
    if (ids.length > 100) {
      return NextResponse.json(error('单次最多删除100条数据', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }

    // 批量删除
    const result = await studentService.batchDelete(ids);

    if (!result.success) {
      return NextResponse.json(error(result.error || '删除失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: `成功删除 ${result.data?.success || 0} 条数据`,
    });
  } catch (err) {
    console.error('批量删除学生API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
