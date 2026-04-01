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
import type { ClassService } from '@/services/class.service';

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
    const classService = getService<ClassService>(SERVICE_IDENTIFIERS.ClassService);
    
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
    
    // 获取所有班级用于关联教师班级信息
    const classesResult = await classService.listClasses({ pageSize: 1000 });
    const allClasses = classesResult.data || [];
    
    // 构建教师-班级映射
    const teacherClassMap = new Map<string, {
      isHeadTeacher: boolean;
      headTeacherClassId?: string;
      headTeacherClassName?: string;
      subTeacherClasses: Array<{ classId: string; className: string }>;
    }>();
    
    // 遍历班级，构建教师班级关系
    for (const cls of allClasses) {
      const classItem = cls as unknown as Record<string, unknown>;
      const classId = classItem.id as string;
      const className = classItem.name as string;
      
      // 班主任
      if (classItem.head_teacher_id) {
        const existing = teacherClassMap.get(classItem.head_teacher_id as string) || {
          isHeadTeacher: false,
          subTeacherClasses: [],
        };
        teacherClassMap.set(classItem.head_teacher_id as string, {
          ...existing,
          isHeadTeacher: true,
          headTeacherClassId: classId,
          headTeacherClassName: className,
        });
      }
      
      // 科任教师（从 subject_teachers JSONB 字段）
      if (classItem.subject_teachers && Array.isArray(classItem.subject_teachers)) {
        for (const st of classItem.subject_teachers as Array<{ teacherId?: string; teacher_id?: string }>) {
          const teacherId = st.teacherId || st.teacher_id;
          if (teacherId) {
            const existing = teacherClassMap.get(teacherId) || {
              isHeadTeacher: false,
              subTeacherClasses: [],
            };
            // 避免重复添加
            if (!existing.subTeacherClasses.find(c => c.classId === classId)) {
              existing.subTeacherClasses.push({ classId, className });
            }
            teacherClassMap.set(teacherId, existing);
          }
        }
      }
      
      // 科任教师（旧字段 sub_teacher_id）
      if (classItem.sub_teacher_id) {
        const existing = teacherClassMap.get(classItem.sub_teacher_id as string) || {
          isHeadTeacher: false,
          subTeacherClasses: [],
        };
        if (!existing.subTeacherClasses.find(c => c.classId === classId)) {
          existing.subTeacherClasses.push({ classId, className });
        }
        teacherClassMap.set(classItem.sub_teacher_id as string, existing);
      }
    }
    
    // 格式化数据
    let isFirst = true;
    const formattedData = (result.data || []).map(t => {
      const item = t as unknown as Record<string, unknown>;
      const subjects = item.subjects as string[] | undefined;
      const employeeId = (item.employee_id || item.employeeId) as string;
      // 使用工号查找班级信息
      const classInfo = employeeId ? teacherClassMap.get(employeeId) || {
        isHeadTeacher: false,
        subTeacherClasses: [],
      } : {
        isHeadTeacher: false,
        subTeacherClasses: [],
      };
      
      // 调试：输出第一个教师的数据
      if (isFirst) {
        console.log('[teachers API] 第一个教师数据:', {
          id: item.id,
          employee_id: item.employee_id,
          name: item.name,
          primary_subject: item.primary_subject,
          allKeys: Object.keys(item),
        });
        isFirst = false;
      }
      
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
        employeeId: employeeId,
        primaryRole: item.role,
        additionalRoles: item.administrative_roles || item.additionalRoles || [],
        primarySubject: item.primary_subject,
        subjects: item.subjects || [],
        weeklyHours: item.weekly_hours || 0,
        // 班级信息
        isHeadTeacher: classInfo.isHeadTeacher,
        headTeacherClassId: classInfo.headTeacherClassId,
        headTeacherClassName: classInfo.headTeacherClassName,
        subTeacherClasses: classInfo.subTeacherClasses,
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
