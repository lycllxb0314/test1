/**
 * 教师详情 API
 * 
 * GET: 获取教师详情
 * PUT: 更新教师信息
 * DELETE: 删除教师
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 * - 使用统一认证中间件
 */

import { NextRequest } from 'next/server';
import { getService, SERVICE_IDENTIFIERS } from '@/lib/di';
import { withAuthAndParams } from '@/lib/auth/middleware';
import { ok, fail, notFound, serverError } from '@/lib/api';
import type { TeacherService } from '@/services/teacher.service';

/**
 * GET: 获取教师详情
 */
export const GET = withAuthAndParams(async (request: NextRequest, { params }) => {
  const { id } = params;
  
  try {
    const teacherService = getService<TeacherService>(SERVICE_IDENTIFIERS.TeacherService);
    
    const result = await teacherService.getTeacher(id as string);
    
    if (!result.success) {
      if (result.code === 'NOT_FOUND') {
        return notFound('教师不存在');
      }
      return fail(result.error || '获取教师详情失败');
    }
    
    const item = result.data as unknown as Record<string, unknown>;
    const subjects = item.subjects as string[] | undefined;
    
    return ok({
      id: item.id,
      name: item.name,
      gender: item.gender,
      subject: item.primary_subject || subjects?.[0] || '语文',
      title: item.title || '二级教师',
      department: item.department || '',
      phone: item.phone || '',
      email: item.email || '',
      status: item.status || 'active',
      avatar: item.avatar,
      employeeId: item.employee_id || item.employeeId,
      primaryRole: item.role,
      additionalRoles: item.administrative_roles || item.additionalRoles || [],
      primarySubject: item.primary_subject,
      subjects: subjects || [],
      weeklyHours: item.weekly_hours || 0,
      createdAt: item.created_at || item.createdAt,
      updatedAt: item.updated_at || item.updatedAt,
    });
  } catch (error) {
    console.error('获取教师详情失败:', error);
    return serverError('服务器错误');
  }
});

/**
 * PUT: 更新教师信息
 */
export const PUT = withAuthAndParams(async (request: NextRequest, { params }) => {
  const { id } = params;
  
  try {
    const teacherService = getService<TeacherService>(SERVICE_IDENTIFIERS.TeacherService);
    const body = await request.json();
    
    // 驼峰转下划线映射
    const updateData: Record<string, unknown> = {};
    
    if (body.name !== undefined) updateData.name = body.name;
    if (body.gender !== undefined) updateData.gender = body.gender;
    if (body.department !== undefined) updateData.department = body.department;
    if (body.title !== undefined) updateData.title = body.title;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.employeeId !== undefined) updateData.employee_id = body.employeeId;
    if (body.primarySubject !== undefined) updateData.primary_subject = body.primarySubject;
    if (body.subjects !== undefined) updateData.subjects = body.subjects;
    
    const result = await teacherService.updateTeacher(id as string, updateData);
    
    if (!result.success) {
      if (result.code === 'NOT_FOUND') {
        return notFound('教师不存在');
      }
      return fail(result.error || '更新失败');
    }
    
    return ok(result.data);
  } catch (error) {
    console.error('更新教师失败:', error);
    return serverError('服务器错误');
  }
});

/**
 * DELETE: 删除教师
 */
export const DELETE = withAuthAndParams(async (request: NextRequest, { params }) => {
  const { id } = params;
  
  try {
    const teacherService = getService<TeacherService>(SERVICE_IDENTIFIERS.TeacherService);
    
    const result = await teacherService.deleteTeacher(id as string);
    
    if (!result.success) {
      if (result.code === 'NOT_FOUND') {
        return notFound('教师不存在');
      }
      return fail(result.error || '删除失败');
    }
    
    return ok({ message: '删除成功' });
  } catch (error) {
    console.error('删除教师失败:', error);
    return serverError('服务器错误');
  }
});
