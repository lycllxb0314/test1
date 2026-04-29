/**
 * 学生列表 API
 *
 * GET /api/students - 获取学生列表（支持分页、筛选）
 */

import { withRoute } from '@/lib/api';
import { getService, SERVICE_IDENTIFIERS } from '@/lib/di';
import { ApiError } from '@/lib/api-error';
import type { StudentService } from '@/services/student.service';

// 年级名称映射
const GRADE_NAMES = ['', '一年级', '二年级', '三年级', '四年级', '五年级', '六年级'];

export const GET = withRoute(
  async (req) => {
    const studentService = getService<StudentService>(SERVICE_IDENTIFIERS.StudentService);
    const { searchParams } = new URL(req.url);

    // 分页参数
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '500');

    // 筛选参数
    const search = searchParams.get('search') || undefined;
    const grade = searchParams.get('grade') || undefined;
    const classId = searchParams.get('classId') || undefined;
    const status = searchParams.get('status') || undefined;

    // 调用 Service 层
    const result = await studentService.listStudents({
      classId,
      grade,
      status,
      search,
      page,
      pageSize,
    });

    if (!result.success) {
      throw ApiError.BadRequest(result.error || '获取学生列表失败');
    }

    // 转换数据格式
    const formattedData = result.data?.map(s => {
      const item = s as unknown as Record<string, unknown>;
      return {
        id: item.id as string,
        studentNo: item.studentNo || '',
        name: item.name as string,
        gender: item.gender,
        birthDate: item.birthDate,
        avatar: item.avatar,
        grade: item.grade,
        gradeName: GRADE_NAMES[item.grade as number] || '',
        classId: item.classId,
        className: item.className,
        enrollmentDate: item.enrollmentDate,
        studentType: item.studentType,
        idCard: item.idCard,
        ethnicity: item.ethnicity,
        nativePlace: item.nativePlace,
        politicalStatus: item.politicalStatus,
        phone: item.phone,
        address: item.address,
        homeAddress: item.homeAddress,
        familyType: item.familyType,
        parents: item.parents || [],
        emergencyContact: item.emergencyContact,
        emergencyPhone: item.emergencyPhone,
        headTeacherId: item.headTeacherId,
        headTeacherName: item.headTeacherName,
        status: item.status || '在校',
        habitStars: item.habitStars,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };
    }) || [];

    // 计算统计数据
    const statistics = {
      total: result.pagination?.total || 0,
      maleCount: formattedData.filter(s => s.gender === 'male').length,
      femaleCount: formattedData.filter(s => s.gender === 'female').length,
      classCount: new Set(formattedData.map(s => s.classId)).size,
    };

    return {
      data: formattedData,
      pagination: {
        total: result.pagination?.total || 0,
        page: result.pagination?.page || 1,
        pageSize: result.pagination?.pageSize || 20,
        totalPages: Math.ceil((result.pagination?.total || 0) / (result.pagination?.pageSize || 20)),
      },
      statistics,
    };
  },
  { requireAuth: true }
);
