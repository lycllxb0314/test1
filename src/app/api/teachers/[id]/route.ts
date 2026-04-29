/**
 * 教师详情 API
 *
 * GET: 获取教师详情
 * PUT: 更新教师信息
 * DELETE: 删除教师
 * PATCH: 部分更新教师信息
 */

import { withRoute } from '@/lib/api';
import { getService, SERVICE_IDENTIFIERS } from '@/lib/di';
import { ApiError } from '@/lib/api-error';
import type { TeacherService } from '@/services/teacher.service';

function throwIfFailed(result: { success: boolean; error?: string; code?: string }, defaultMsg: string) {
  if (!result.success) {
    if (result.code === 'NOT_FOUND') throw ApiError.NotFound('教师');
    throw ApiError.Internal(result.error || defaultMsg);
  }
}

/** 教师详情格式化（GET 复用） */
function formatTeacher(item: Record<string, unknown>) {
  const subjects = item.subjects as string[] | undefined;
  return {
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
    birthDate: item.birth_date,
    ethnicity: item.ethnicity,
    politicalStatus: item.political_status,
    nativePlace: item.native_place,
    idCard: item.id_card,
    emergencyContact: item.emergency_contact,
    emergencyPhone: item.emergency_phone,
    address: item.address,
    education: item.education,
    school: item.school,
    major: item.major,
    graduationDate: item.graduation_date,
    titleDate: item.title_date,
    joinDate: item.join_date,
    teachYears: item.teach_years,
    teachableSubjects: item.teachable_subjects || subjects || [],
    teachableGrades: item.teachable_grades || [1, 2, 3, 4, 5, 6],
    secondarySubjects: item.secondary_subjects || [],
    createdAt: item.created_at || item.createdAt,
    updatedAt: item.updated_at || item.updatedAt,
  };
}

/** 驼峰→下划线字段映射（PUT/PATCH 复用） */
function mapUpdateFields(body: Record<string, unknown>): Record<string, unknown> {
  const d: Record<string, unknown> = {};
  if (body.name !== undefined) d.name = body.name;
  if (body.gender !== undefined) d.gender = body.gender;
  if (body.department !== undefined) d.department = body.department;
  if (body.title !== undefined) d.title = body.title;
  if (body.phone !== undefined) d.phone = body.phone;
  if (body.email !== undefined) d.email = body.email;
  if (body.status !== undefined) d.status = body.status;
  if (body.employeeId !== undefined) d.employee_id = body.employeeId;
  if (body.primarySubject !== undefined) d.primary_subject = body.primarySubject;
  if (body.primary_subject !== undefined) d.primary_subject = body.primary_subject;
  if (body.subjects !== undefined) d.subjects = body.subjects;
  if (body.secondary_subjects !== undefined) d.secondary_subjects = body.secondary_subjects;
  if (body.additional_roles !== undefined) d.additional_roles = body.additional_roles;
  if (body.total_weekly_hours !== undefined) d.weekly_hours = body.total_weekly_hours;
  if (body.teachable_grades !== undefined) d.teachable_grades = body.teachable_grades;
  if (body.is_head_teacher !== undefined) d.is_head_teacher = body.is_head_teacher;
  // 角色字段映射
  if (body.primaryRole !== undefined) d.role = body.primaryRole;
  if (body.role !== undefined) d.role = body.role;
  // PATCH 额外字段
  if (body.birthDate !== undefined) d.birth_date = body.birthDate;
  if (body.ethnicity !== undefined) d.ethnicity = body.ethnicity;
  if (body.politicalStatus !== undefined) d.political_status = body.politicalStatus;
  if (body.nativePlace !== undefined) d.native_place = body.nativePlace;
  if (body.emergencyContact !== undefined) d.emergency_contact = body.emergencyContact;
  if (body.emergencyPhone !== undefined) d.emergency_phone = body.emergencyPhone;
  if (body.address !== undefined) d.address = body.address;
  if (body.education !== undefined) d.education = body.education;
  if (body.school !== undefined) d.school = body.school;
  if (body.major !== undefined) d.major = body.major;
  if (body.graduationDate !== undefined) d.graduation_date = body.graduationDate;
  if (body.titleDate !== undefined) d.title_date = body.titleDate;
  if (body.teachableSubjects !== undefined) d.teachable_subjects = body.teachableSubjects;
  if (body.additionalRoles !== undefined) d.additional_roles = body.additionalRoles;
  if (body.managedGrades !== undefined) d.managed_grades = body.managedGrades;
  return d;
}

/**
 * GET: 获取教师详情
 */
export const GET = withRoute(
  async (req, ctx) => {
    const { id } = ctx.params;
    const teacherService = getService<TeacherService>(SERVICE_IDENTIFIERS.TeacherService);

    const result = await teacherService.getTeacher(id as string);
    throwIfFailed(result, '获取教师详情失败');

    return formatTeacher(result.data as unknown as Record<string, unknown>);
  },
  { requireAuth: true }
);

/**
 * PUT: 更新教师信息
 */
export const PUT = withRoute(
  async (req, ctx) => {
    const { id } = ctx.params;
    const teacherService = getService<TeacherService>(SERVICE_IDENTIFIERS.TeacherService);
    const body = await req.json();

    const updateData = mapUpdateFields(body);
    const result = await teacherService.updateTeacher(id as string, updateData);
    throwIfFailed(result, '更新失败');

    return result.data;
  },
  { requireAuth: true }
);

/**
 * DELETE: 删除教师
 */
export const DELETE = withRoute(
  async (req, ctx) => {
    const { id } = ctx.params;
    const teacherService = getService<TeacherService>(SERVICE_IDENTIFIERS.TeacherService);

    const result = await teacherService.deleteTeacher(id as string);
    throwIfFailed(result, '删除失败');

    return { message: '删除成功' };
  },
  { requireAuth: true }
);

/**
 * PATCH: 部分更新教师信息
 */
export const PATCH = withRoute(
  async (req, ctx) => {
    const { id } = ctx.params;
    const teacherService = getService<TeacherService>(SERVICE_IDENTIFIERS.TeacherService);
    const body = await req.json();

    const updateData = mapUpdateFields(body);
    const result = await teacherService.updateTeacher(id as string, updateData);
    throwIfFailed(result, '更新失败');

    return result.data;
  },
  { requireAuth: true }
);
