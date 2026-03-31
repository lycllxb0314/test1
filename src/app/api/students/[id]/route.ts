/**
 * 单个学生 API
 * 
 * GET - 获取学生详情
 * PUT - 更新学生信息
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 * - 使用统一认证中间件
 */

import { NextRequest, NextResponse } from 'next/server';
import { getService, SERVICE_IDENTIFIERS } from '@/lib/di';
import { withAuthAndParams } from '@/lib/auth/middleware';
import { ok, fail, notFound, serverError } from '@/lib/api';
import type { StudentService } from '@/services/student.service';

/**
 * GET - 获取学生详情
 */
export const GET = withAuthAndParams(async (
  request: NextRequest,
  { params }
) => {
  try {
    const studentService = getService<StudentService>(SERVICE_IDENTIFIERS.StudentService);
    const { id } = params;

    const result = await studentService.getStudent(id as string);

    if (!result.success) {
      if (result.code === 'NOT_FOUND') {
        return notFound('学生不存在');
      }
      return fail(result.error || '获取学生详情失败');
    }

    const data = result.data as unknown as Record<string, unknown>;

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Failed to fetch student:', error);
    return serverError('获取学生详情失败');
  }
});

/**
 * PUT - 更新学生信息
 */
export const PUT = withAuthAndParams(async (
  request: NextRequest,
  { params }
) => {
  try {
    const studentService = getService<StudentService>(SERVICE_IDENTIFIERS.StudentService);
    const { id } = params;
    const body = await request.json();

    const result = await studentService.updateStudent(id as string, body);

    if (!result.success) {
      if (result.code === 'NOT_FOUND') {
        return notFound('学生不存在');
      }
      return fail(result.error || '更新学生信息失败');
    }

    const data = result.data as unknown as Record<string, unknown>;

    return ok({
      ...data,
      message: '学生信息更新成功',
    });
  } catch (error) {
    console.error('Failed to update student:', error);
    return serverError('更新学生信息失败');
  }
});
