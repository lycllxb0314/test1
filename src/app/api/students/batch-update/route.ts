/**
 * 批量更新学生 API
 * 
 * 架构：API Route → Service → Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { studentService } from '@/services/student.service';
import { error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

/**
 * POST - 批量更新学生
 */
export const POST = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const body = await request.json();
    const { ids, updates } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(error('请选择要更新的数据', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json(error('请提供更新内容', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }

    // 限制单次更新数量
    if (ids.length > 100) {
      return NextResponse.json(error('单次最多更新100条数据', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }

    // 过滤不允许批量更新的字段
    const allowedFields = ['status', 'classId', 'className'];
    const filteredUpdates: Record<string, unknown> = {};
    for (const key of Object.keys(updates)) {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json(error('没有可更新的字段', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }

    // 批量更新
    let successCount = 0;
    for (const id of ids) {
      const result = await studentService.updateStudent(id, filteredUpdates);
      if (result.success) {
        successCount++;
      }
    }

    return NextResponse.json({
      success: true,
      data: { count: successCount },
      message: `成功更新 ${successCount} 条数据`,
    });
  } catch (err) {
    console.error('批量更新学生API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
