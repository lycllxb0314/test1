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
      // 扩展个人信息
      birthDate: item.birth_date,
      ethnicity: item.ethnicity,
      politicalStatus: item.political_status,
      nativePlace: item.native_place,
      idCard: item.id_card,
      // 扩展联系信息
      emergencyContact: item.emergency_contact,
      emergencyPhone: item.emergency_phone,
      address: item.address,
      // 扩展学历信息
      education: item.education,
      school: item.school,
      major: item.major,
      graduationDate: item.graduation_date,
      // 扩展工作信息
      titleDate: item.title_date,
      joinDate: item.join_date,
      teachYears: item.teach_years,
      // 可任教信息
      teachableSubjects: item.teachable_subjects || subjects || [],
      teachableGrades: item.teachable_grades || [1, 2, 3, 4, 5, 6],
      secondarySubjects: item.secondary_subjects || [],
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
    // 角色字段映射：支持 primaryRole 和 role 两种格式
    if (body.primaryRole !== undefined) updateData.role = body.primaryRole;
    if (body.role !== undefined) updateData.role = body.role;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.employeeId !== undefined) updateData.employee_id = body.employeeId;
    if (body.primarySubject !== undefined) updateData.primary_subject = body.primarySubject;
    if (body.primary_subject !== undefined) updateData.primary_subject = body.primary_subject;
    if (body.subjects !== undefined) updateData.subjects = body.subjects;
    if (body.secondary_subjects !== undefined) updateData.secondary_subjects = body.secondary_subjects;
    if (body.additional_roles !== undefined) updateData.additional_roles = body.additional_roles;
    if (body.total_weekly_hours !== undefined) updateData.weekly_hours = body.total_weekly_hours;
    if (body.teachable_grades !== undefined) updateData.teachable_grades = body.teachable_grades;
    if (body.is_head_teacher !== undefined) updateData.is_head_teacher = body.is_head_teacher;
    
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

/**
 * PATCH: 部分更新教师信息
 */
export const PATCH = withAuthAndParams(async (request: NextRequest, { params }) => {
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
    if (body.birthDate !== undefined) updateData.birth_date = body.birthDate;
    if (body.ethnicity !== undefined) updateData.ethnicity = body.ethnicity;
    if (body.politicalStatus !== undefined) updateData.political_status = body.politicalStatus;
    if (body.nativePlace !== undefined) updateData.native_place = body.nativePlace;
    if (body.emergencyContact !== undefined) updateData.emergency_contact = body.emergencyContact;
    if (body.emergencyPhone !== undefined) updateData.emergency_phone = body.emergencyPhone;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.education !== undefined) updateData.education = body.education;
    if (body.school !== undefined) updateData.school = body.school;
    if (body.major !== undefined) updateData.major = body.major;
    if (body.graduationDate !== undefined) updateData.graduation_date = body.graduationDate;
    if (body.titleDate !== undefined) updateData.title_date = body.titleDate;
    if (body.teachableSubjects !== undefined) updateData.teachable_subjects = body.teachableSubjects;
    if (body.primaryRole !== undefined) updateData.role = body.primaryRole;
    if (body.teachableGrades !== undefined) updateData.teachable_grades = body.teachableGrades;
    if (body.additionalRoles !== undefined) updateData.additional_roles = body.additionalRoles;
    if (body.secondarySubjects !== undefined) updateData.secondary_subjects = body.secondarySubjects;
    if (body.managedGrades !== undefined) updateData.managed_grades = body.managedGrades;
    
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
