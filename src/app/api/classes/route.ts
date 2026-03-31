/**
 * 班级列表 API
 * 
 * GET /api/classes - 获取班级列表（支持分页、筛选）
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 * - 使用统一认证中间件
 */

import { NextRequest } from 'next/server';
import { getService, SERVICE_IDENTIFIERS } from '@/lib/di';
import { withAuth } from '@/lib/auth/middleware';
import { paginated, fail, serverError } from '@/lib/api';
import type { ClassService } from '@/services/class.service';

// 年级名称映射
const GRADE_NAMES = ['', '一年级', '二年级', '三年级', '四年级', '五年级', '六年级'];

/**
 * GET 处理器 - 获取班级列表
 */
export const GET = withAuth(async (request: NextRequest) => {
  try {
    const classService = getService<ClassService>(SERVICE_IDENTIFIERS.ClassService);
    const { searchParams } = new URL(request.url);
    
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
      return fail(result.error || '获取班级列表失败');
    }
    
    // 转换数据格式
    const formattedData = result.data?.map(c => {
      const item = c as unknown as Record<string, unknown>;
      return {
        id: item.id as string,
        name: item.name as string,
        grade: item.grade as number,
        gradeName: item.gradeName as string || GRADE_NAMES[item.grade as number] || '',
        classNumber: item.classNumber,
        headTeacherId: item.headTeacherId as string,
        headTeacherName: item.headTeacherName as string,
        subTeacherId: item.subTeacherId,
        subTeacherName: item.subTeacherName,
        studentCount: (item.studentCount as number) || 0,
        maleStudentCount: item.maleStudentCount || 0,
        femaleStudentCount: item.femaleStudentCount || 0,
        classroomId: item.classroomId,
        classroomName: item.classroomName,
        building: item.building,
        floor: item.floor,
        status: item.status || 'active',
        motto: item.motto,
        features: item.features,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
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
    
    return paginated(
      formattedData,
      total,
      result.pagination?.page || 1,
      result.pagination?.pageSize || 20,
      { statistics }
    );
  } catch (error) {
    console.error('Failed to fetch classes:', error);
    return serverError('获取班级列表失败');
  }
});
