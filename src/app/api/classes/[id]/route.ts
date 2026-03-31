/**
 * 单个班级 API
 * 
 * GET - 获取班级详情
 * PATCH - 更新班级信息（包括科任）
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 * - 使用统一认证中间件
 */

import { NextRequest } from 'next/server';
import { getService, SERVICE_IDENTIFIERS } from '@/lib/di';
import { withAuthAndParams } from '@/lib/auth/middleware';
import { ok, fail, serverError, notFound } from '@/lib/api';
import type { ClassService } from '@/services/class.service';

/**
 * GET - 获取单个班级详情
 */
export const GET = withAuthAndParams(async (
  request: NextRequest,
  { params }
) => {
  const { id } = params;
  
  try {
    const classService = getService<ClassService>(SERVICE_IDENTIFIERS.ClassService);
    
    const result = await classService.getClass(id as string);
    
    if (!result.success || !result.data) {
      return notFound('班级不存在');
    }
    
    const data = result.data as unknown as Record<string, unknown>;
    
    // 转换为驼峰格式
    const formattedData = {
      id: data.id,
      name: data.name,
      grade: data.grade,
      gradeName: data.gradeName,
      classNumber: data.classNumber,
      headTeacherId: data.headTeacherId,
      headTeacherName: data.headTeacherName,
      subTeacherId: data.subTeacherId,
      subTeacherName: data.subTeacherName,
      classroomId: data.classroomId,
      classroomName: data.classroomName,
      building: data.building,
      studentCount: data.studentCount,
      status: data.status,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
    
    return ok(formattedData);
  } catch (err) {
    console.error('Failed to fetch class:', err);
    return serverError('获取班级失败');
  }
});

/**
 * PATCH - 更新班级信息
 */
export const PATCH = withAuthAndParams(async (
  request: NextRequest,
  { params }
) => {
  const { id } = params;
  
  try {
    const classService = getService<ClassService>(SERVICE_IDENTIFIERS.ClassService);
    const body = await request.json();
    
    // 构建更新参数
    const updateParams: Record<string, unknown> = {};
    
    // 科任（副班主任）
    if (body.subTeacherId !== undefined) {
      updateParams.subTeacherId = body.subTeacherId || null;
      updateParams.subTeacherName = body.subTeacherName || null;
    }
    
    // 班主任
    if (body.headTeacherId !== undefined) {
      updateParams.headTeacherId = body.headTeacherId;
      updateParams.headTeacherName = body.headTeacherName;
    }
    
    // 调用 Service 层更新
    const result = await classService.updateClass(id as string, updateParams);
    
    if (!result.success) {
      if (result.code === 'NOT_FOUND') {
        return notFound('班级不存在');
      }
      return fail(result.error || '更新失败');
    }
    
    const updatedData = result.data as unknown as Record<string, unknown>;
    
    return ok({
      id: updatedData?.id,
      subTeacherId: updatedData?.subTeacherId,
      subTeacherName: updatedData?.subTeacherName,
    });
  } catch (err) {
    console.error('Failed to update class:', err);
    return serverError('更新班级失败');
  }
});
