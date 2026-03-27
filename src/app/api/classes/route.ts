/**
 * 班级列表 API
 * 
 * GET /api/classes - 获取班级列表（支持分页、筛选）
 */

import { NextRequest } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { paginated, fail, serverError } from '@/lib/api';

// 年级名称映射
const GRADE_NAMES = ['', '一年级', '二年级', '三年级', '四年级', '五年级', '六年级'];

export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    // 分页参数
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '200');
    
    // 筛选参数
    const search = searchParams.get('search');
    const grade = searchParams.get('grade');
    const status = searchParams.get('status');
    
    // 构建查询
    let query = client
      .from('classes')
      .select('*', { count: 'exact' });
    
    // 应用筛选
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    if (grade && grade !== 'all') {
      query = query.eq('grade', parseInt(grade));
    }
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    
    // 排序
    query = query.order('grade').order('class_number');
    
    // 分页
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);
    
    const { data, error, count } = await query;
    
    if (error) {
      return fail(error.message, undefined, 500);
    }
    
    // 转换数据格式（下划线转驼峰）
    const formattedData = (data || []).map(c => ({
      id: c.id,
      name: c.name,
      grade: c.grade,
      gradeName: c.grade_name || GRADE_NAMES[c.grade] || '',
      classNumber: c.class_number,
      
      // 班主任
      headTeacherId: c.head_teacher_id,
      headTeacherName: c.head_teacher_name,
      
      // 科任（副班主任）
      subTeacherId: c.sub_teacher_id,
      subTeacherName: c.sub_teacher_name,
      
      // 学生统计
      studentCount: c.student_count || 0,
      maleStudentCount: c.male_student_count || 0,
      femaleStudentCount: c.female_student_count || 0,
      
      // 教室信息
      classroomId: c.classroom_id,
      classroomName: c.classroom_name,
      building: c.building,
      floor: c.floor,
      
      // 状态
      status: c.status || 'active',
      
      // 班级特色
      motto: c.motto,
      features: c.features,
      
      // 时间戳
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    }));
    
    // 计算统计数据
    const statistics = {
      totalClasses: count || 0,
      activeClasses: formattedData.filter(c => c.status === 'active').length,
      inactiveClasses: formattedData.filter(c => c.status !== 'active').length,
      totalStudents: formattedData.reduce((sum, c) => sum + c.studentCount, 0),
      classesWithSubTeacher: formattedData.filter(c => c.subTeacherId).length,
      classesWithoutSubTeacher: formattedData.filter(c => !c.subTeacherId).length,
      gradeDistribution: formattedData.reduce((acc, c) => {
        acc[c.grade] = (acc[c.grade] || 0) + 1;
        return acc;
      }, {} as Record<number, number>),
      avgStudentsPerClass: count ? Math.round(formattedData.reduce((sum, c) => sum + c.studentCount, 0) / count) : 0,
    };
    
    return paginated(formattedData, count || 0, page, pageSize, { statistics });
  } catch (error) {
    console.error('Failed to fetch classes:', error);
    return serverError('获取班级列表失败');
  }
}
