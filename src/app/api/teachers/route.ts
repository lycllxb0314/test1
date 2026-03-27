/**
 * 教师列表 API
 * 
 * GET /api/teachers - 获取教师列表（支持分页、筛选）
 * 
 * 使用统一的 API 工具：
 * - ok() / paginated() - 成功响应
 * - fail() / serverError() - 错误响应
 * - getQueryParams() - 解析查询参数
 */

import { NextRequest } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { ok, paginated, serverError, getQueryParams, withApi } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { page, pageSize, search, filters } = getQueryParams(request);
    
    // 筛选参数
    const role = filters.role as string | undefined;
    const department = filters.department as string | undefined;
    const status = filters.status as string | undefined;
    
    // 构建查询
    let query = client
      .from('teachers')
      .select('*', { count: 'exact' });
    
    // 应用筛选
    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,employee_id.ilike.%${search}%`);
    }
    if (role && role !== 'all') {
      query = query.eq('role', role);
    }
    if (department && department !== 'all') {
      query = query.eq('department', department);
    }
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    
    // 排序
    query = query.order('created_at', { ascending: false });
    
    // 分页
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);
    
    const { data, error, count } = await query;
    
    if (error) {
      return serverError(error.message);
    }
    
    // 转换数据格式（下划线转驼峰）
    const formattedData = (data || []).map(t => ({
      id: t.id,
      name: t.name,
      gender: t.gender,
      subject: t.primary_subject || (t.subjects?.[0]) || '语文',
      title: t.title || '二级教师',
      department: t.department || `${t.subjects?.[0] || '语文'}组`,
      phone: t.phone || '',
      email: t.email || '',
      status: t.status || 'active',
      avatar: t.avatar,
      
      // 工号
      employeeId: t.employee_id,
      
      // 角色信息
      primaryRole: t.role,
      additionalRoles: t.administrative_roles || [],
      
      // 学科信息
      primarySubject: t.primary_subject,
      subjects: t.subjects || [],
      secondarySubjects: t.secondary_subjects || [],
      teachableSubjects: t.teachable_subjects || [],
      
      // 班级关联
      headTeacherClassId: t.head_teacher_class_id,
      headTeacherClassIds: t.head_teacher_class_ids || [],
      subTeacherClassIds: t.sub_teacher_class_ids || [],
      
      // 个人信息扩展
      birthDate: t.birth_date,
      idCard: t.id_card,
      ethnicity: t.ethnicity,
      politicalStatus: t.political_status,
      nativePlace: t.native_place,
      
      // 联系信息
      emergencyContact: t.emergency_contact,
      emergencyPhone: t.emergency_phone,
      address: t.address,
      
      // 学历信息
      education: t.education,
      school: t.school,
      major: t.major,
      graduationDate: t.graduation_date,
      
      // 工作信息
      joinDate: t.join_date,
      titleDate: t.title_date,
      teachYears: t.teach_years || 0,
      
      // 课时相关
      weeklyHours: t.weekly_hours || 0,
      maxWeeklyHours: t.max_weekly_hours || 20,
      
      // 可任教年级
      teachableGrades: t.teachable_grades || [1, 2, 3, 4, 5, 6],
      
      // 时间戳
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    }));
    
    // 计算统计数据
    const departmentStats: Record<string, number> = {};
    const titleStats: Record<string, number> = {};
    
    formattedData.forEach(t => {
      // 按部门统计
      if (t.department) {
        departmentStats[t.department] = (departmentStats[t.department] || 0) + 1;
      }
      // 按职称统计
      if (t.title) {
        titleStats[t.title] = (titleStats[t.title] || 0) + 1;
      }
    });
    
    const statistics = {
      total: count || 0,
      leaders: formattedData.filter(t => 
        ['principal', 'secretary', 'academic_vice_principal', 'moral_vice_principal', 'general_vice_principal'].includes(t.primaryRole || '')
      ).length,
      headTeachers: formattedData.filter(t => t.primaryRole === 'head_teacher').length,
      subjectTeachers: formattedData.filter(t => t.primaryRole === 'subject_teacher').length,
      skillTeachers: formattedData.filter(t => ['skill_teacher', 'subject_head'].includes(t.primaryRole || '')).length,
      gradeLeaders: formattedData.filter(t => t.additionalRoles?.includes('grade_leader')).length,
      researchGroupLeaders: formattedData.filter(t => t.additionalRoles?.includes('research_group_leader')).length,
      youngPioneerCounselors: formattedData.filter(t => t.additionalRoles?.includes('young_pioneer_counselor')).length,
      departments: Object.keys(departmentStats).length,
      byDepartment: departmentStats,
      byTitle: titleStats,
    };
    
    return paginated(formattedData, count || 0, page, pageSize, { statistics });
  } catch (error) {
    console.error('Failed to fetch teachers:', error);
    return serverError('获取教师列表失败');
  }
}
