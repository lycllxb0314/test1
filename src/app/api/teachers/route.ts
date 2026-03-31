/**
 * 教师列表 API
 * 
 * GET: 获取教师列表（支持分页、筛选）
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 * - 使用统一认证中间件
 */

import { NextRequest } from 'next/server';
import { getService, SERVICE_IDENTIFIERS } from '@/lib/di';
import { withAuth } from '@/lib/auth/middleware';
import { paginated, fail, serverError } from '@/lib/api';
import type { TeacherService } from '@/services/teacher.service';

/**
 * GET: 获取教师列表
 */
export const GET = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');
  const search = searchParams.get('search') || undefined;
  const role = searchParams.get('role') || undefined;
  const department = searchParams.get('department') || undefined;
  const status = searchParams.get('status') || undefined;

  try {
    const teacherService = getService<TeacherService>(SERVICE_IDENTIFIERS.TeacherService);
    
    const result = await teacherService.listTeachers({
      page,
      pageSize,
      search,
      role,
      department,
      status,
    });
    
    if (!result.success) {
      return fail(result.error || '获取教师列表失败');
    }
    
    // 格式化数据
    const formattedData = (result.data || []).map(t => {
      const item = t as unknown as Record<string, unknown>;
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
        subjects: item.subjects || [],
        weeklyHours: item.weekly_hours || 0,
        createdAt: item.created_at || item.createdAt,
        updatedAt: item.updated_at || item.updatedAt,
      };
    });
    
    return paginated(formattedData, result.pagination?.total || 0, page, pageSize);
  } catch (error) {
    console.error('获取教师列表失败:', error);
    return serverError('服务器错误');
  }
});
