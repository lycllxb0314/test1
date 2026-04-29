/**
 * 班级列表 API
 *
 * GET /api/classes - 获取班级列表（支持分页、筛选）
 *
 * 🏗️ 使用 withRoute 包装器，自动处理：鉴权、异常捕获、统一响应格式
 * handler 只需专注业务逻辑，直接 return 数据即可
 */

import { withRoute } from '@/lib/api/route-wrapper';
import { getService, SERVICE_IDENTIFIERS } from '@/lib/di';
import { calculatePagination } from '@/lib/api';
import type { ClassService } from '@/services/class.service';

// 年级名称映射
const GRADE_NAMES = ['', '一年级', '二年级', '三年级', '四年级', '五年级', '六年级'];

/**
 * GET 处理器 - 获取班级列表
 */
export const GET = withRoute(
  async (req, _ctx, _user) => {
    const classService = getService<ClassService>(SERVICE_IDENTIFIERS.ClassService);
    const { searchParams } = new URL(req.url);

    // 分页参数
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '200');

    // 筛选参数
    const search = searchParams.get('search') || undefined;
    const grade = searchParams.get('grade');
    const status = searchParams.get('status');

    // 调用 Service 层
    const result = await classService.listClasses({
      grade: grade ? parseInt(grade) : undefined,
      status: status || undefined,
      search,
      page,
      pageSize,
    });

    if (!result.success) {
      throw new Error(result.error || '获取班级列表失败');
    }

    // 转换数据格式（数据库返回蛇形格式，转换为驼峰格式）
    const formattedData = result.data?.map(c => {
      const item = c as unknown as Record<string, unknown>;
      return {
        id: item.id as string,
        name: item.name as string,
        grade: item.grade as number,
        gradeName: GRADE_NAMES[item.grade as number] || '',
        classNumber: item.class_number,
        headTeacherId: item.head_teacher_id as string,
        headTeacherName: item.head_teacher_name as string,
        subTeacherId: item.sub_teacher_id,
        subTeacherName: item.sub_teacher_name,
        subjectTeachers: item.subject_teachers,
        studentCount: (item.student_count as number) || 0,
        maleStudentCount: item.male_student_count || 0,
        femaleStudentCount: item.female_student_count || 0,
        classroomId: item.classroom_id,
        classroomName: item.classroom_name,
        building: item.building,
        floor: item.floor,
        status: item.status || 'active',
        motto: item.motto,
        features: item.features,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      };
    }) || [];

    // 计算统计数据
    const total = result.pagination?.total || 0;
    const statistics = {
      totalClasses: total,
      activeClasses: formattedData.filter(c => c.status === 'active').length,
      inactiveClasses: formattedData.filter(c => c.status !== 'active').length,
      totalStudents: formattedData.reduce((sum, c) => sum + c.studentCount, 0),
      classesWithSubTeacher: formattedData.filter(c => c.subTeacherId).length,
      classesWithoutSubTeacher: formattedData.filter(c => !c.subTeacherId).length,
      gradeDistribution: formattedData.reduce((acc, c) => {
        acc[c.grade] = (acc[c.grade] || 0) + 1;
        return acc;
      }, {} as Record<number, number>),
      avgStudentsPerClass: total ? Math.round(formattedData.reduce((sum, c) => sum + c.studentCount, 0) / total) : 0,
    };

    // 返回分页结构 → withRoute 自动展开为 { success, data, pagination, statistics }
    return {
      data: formattedData,
      pagination: calculatePagination(total, result.pagination?.page || 1, result.pagination?.pageSize || 20),
      statistics,
    };
  },
  { requireAuth: true }
);
