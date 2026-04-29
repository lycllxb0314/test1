/**
 * 教师列表 API
 *
 * GET: 获取教师列表（支持分页、筛选）
 */

import { withRoute } from '@/lib/api';
import { getService, SERVICE_IDENTIFIERS } from '@/lib/di';
import { ApiError } from '@/lib/api-error';
import type { TeacherService } from '@/services/teacher.service';
import type { ClassService } from '@/services/class.service';

export const GET = withRoute(
  async (req) => {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const search = searchParams.get('search') || undefined;
    const role = searchParams.get('role') || undefined;
    const department = searchParams.get('department') || undefined;
    const status = searchParams.get('status') || undefined;

    const teacherService = getService<TeacherService>(SERVICE_IDENTIFIERS.TeacherService);
    const classService = getService<ClassService>(SERVICE_IDENTIFIERS.ClassService);

    // 并行获取教师列表和班级列表
    const [result, classesResult] = await Promise.all([
      teacherService.listTeachers({ page, pageSize, search, role, department, status }),
      classService.listClasses({ pageSize: 1000 }),
    ]);

    if (!result.success) {
      throw ApiError.BadRequest(result.error || '获取教师列表失败');
    }

    const allClasses = classesResult.data || [];

    // 构建教师-班级映射
    const teacherClassMap = new Map<string, {
      isHeadTeacher: boolean;
      headTeacherClassId?: string;
      headTeacherClassName?: string;
      subTeacherClasses: Array<{ classId: string; className: string }>;
    }>();

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
    const formattedData = (result.data || []).map(t => {
      const item = t as unknown as Record<string, unknown>;
      const subjects = item.subjects as string[] | undefined;
      const employeeId = (item.employee_id || item.employeeId) as string;
      const classInfo = employeeId ? teacherClassMap.get(employeeId) || {
        isHeadTeacher: false,
        subTeacherClasses: [],
      } : {
        isHeadTeacher: false,
        subTeacherClasses: [],
      };

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
        employeeId,
        primaryRole: item.role,
        additionalRoles: item.administrative_roles || item.additionalRoles || [],
        primarySubject: item.primary_subject || subjects?.[0] || null,
        subjects: item.subjects || [],
        weeklyHours: item.weekly_hours || 0,
        isHeadTeacher: classInfo.isHeadTeacher,
        headTeacherClassId: classInfo.headTeacherClassId,
        headTeacherClassName: classInfo.headTeacherClassName,
        subTeacherClasses: classInfo.subTeacherClasses,
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
    });

    return {
      data: formattedData,
      pagination: {
        total: result.pagination?.total || 0,
        page,
        pageSize,
        totalPages: Math.ceil((result.pagination?.total || 0) / pageSize),
      },
    };
  },
  { requireAuth: true }
);
