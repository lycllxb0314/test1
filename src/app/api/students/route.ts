/**
 * 学生列表 API
 * 
 * GET /api/students - 获取学生列表（支持分页、筛选）
 */

import { NextRequest } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { ok, paginated, fail, serverError, getQueryParams } from '@/lib/api-utils';

// 年级名称映射
const GRADE_NAMES = ['', '一年级', '二年级', '三年级', '四年级', '五年级', '六年级'];

export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    // 分页参数
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '500');
    
    // 筛选参数
    const search = searchParams.get('search');
    const grade = searchParams.get('grade');
    const classId = searchParams.get('classId');
    const status = searchParams.get('status');
    const teacherId = searchParams.get('teacherId');
    
    // 构建查询
    // 注意：Supabase 默认最多返回 1000 行，需要显式设置 limit
    let query = client
      .from('students')
      .select('*', { count: 'exact' })
      .limit(pageSize);
    
    // 应用筛选
    if (search) {
      query = query.or(`name.ilike.%${search}%,student_no.ilike.%${search}%`);
    }
    if (grade && grade !== 'all') {
      query = query.eq('grade', parseInt(grade));
    }
    if (classId && classId !== 'all') {
      query = query.eq('class_id', classId);
    }
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    
    // 按班主任筛选：需要处理多种ID格式
    if (teacherId && teacherId !== 'all') {
      // 先尝试直接用 teacherId 查询班级（格式如 t008）
      let teacherClassIds: string[] = [];
      
      const { data: directClasses } = await client
        .from('classes')
        .select('id')
        .eq('head_teacher_id', teacherId);
      
      if (directClasses && directClasses.length > 0) {
        teacherClassIds = directClasses.map(c => c.id);
      } else {
        // 如果直接查询不到，尝试通过 users 表关联
        // teacherId 可能是 users 表的 UUID，需要通过 employee_id 关联 teachers 表
        const { data: userRecord } = await client
          .from('users')
          .select('employee_id')
          .eq('id', teacherId)
          .single();
        
        if (userRecord?.employee_id) {
          // 通过 employee_id 找到 teachers 表中的记录
          const { data: teacherRecord } = await client
            .from('teachers')
            .select('id')
            .eq('employee_id', userRecord.employee_id)
            .single();
          
          if (teacherRecord) {
            // 用 teachers.id 查询班级
            const { data: teacherClasses } = await client
              .from('classes')
              .select('id')
              .eq('head_teacher_id', teacherRecord.id);
            
            teacherClassIds = (teacherClasses || []).map(c => c.id);
          }
        }
      }
      
      if (teacherClassIds.length > 0) {
        query = query.in('class_id', teacherClassIds);
      } else {
        // 如果该教师没有管理的班级，返回空数据
        return paginated([], 0, page, pageSize, {
          statistics: {
            total: 0,
            maleCount: 0,
            femaleCount: 0,
            classCount: 0,
          },
        });
      }
    }
    
    // 排序（按年级、班级名称、学号）
    query = query.order('grade').order('class_name').order('student_no');
    
    // 分页
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);
    
    const { data, error, count } = await query;
    
    if (error) {
      return fail(error.message, undefined, 500);
    }
    
    // 获取所有学生的班级ID
    const classIds = [...new Set((data || []).map(s => s.class_id).filter(Boolean))];
    
    // 批量查询班级信息获取班主任
    const classesMap: Record<string, { headTeacherId: string; headTeacherName: string }> = {};
    if (classIds.length > 0) {
      const { data: classesData } = await client
        .from('classes')
        .select('id, head_teacher_id, head_teacher_name')
        .in('id', classIds);
      
      (classesData || []).forEach(c => {
        classesMap[c.id] = {
          headTeacherId: c.head_teacher_id,
          headTeacherName: c.head_teacher_name,
        };
      });
    }
    
    // 转换数据格式（下划线转驼峰）
    const formattedData = (data || []).map(s => {
      const classInfo = classesMap[s.class_id] || {};
      return {
        id: s.id,
        studentNo: s.student_no || '',
        name: s.name,
        gender: s.gender,
        birthDate: s.birth_date,
        avatar: s.avatar,
        
        // 学籍信息
        grade: s.grade,
        gradeName: GRADE_NAMES[s.grade] || '',
        classId: s.class_id,
        className: s.class_name,
        enrollmentDate: s.enrollment_date,
        studentType: s.student_type,
        
        // 身份信息
        idCard: s.id_card,
        ethnicity: s.ethnicity,
        nativePlace: s.native_place,
        politicalStatus: s.political_status,
        
        // 联系信息
        phone: s.phone,
        address: s.address,
        homeAddress: s.home_address,
        
        // 家庭信息
        familyType: s.family_type,
        parents: s.parents || [],
        emergencyContact: s.emergency_contact,
        emergencyPhone: s.emergency_phone,
        
        // 班主任信息（从班级表获取）
        headTeacherId: classInfo.headTeacherId || s.head_teacher_id,
        headTeacherName: classInfo.headTeacherName || s.head_teacher_name,
        
        // 状态
        status: s.status || '在校',
        
        // 习惯养成
        habitStars: s.habit_stars,
        
        // 时间戳
        createdAt: s.created_at,
        updatedAt: s.updated_at,
      };
    });
    
    // 计算统计数据
    const statistics = {
      total: count || 0,
      maleCount: formattedData.filter(s => s.gender === 'male').length,
      femaleCount: formattedData.filter(s => s.gender === 'female').length,
      classCount: new Set(formattedData.map(s => s.classId)).size,
    };
    
    return paginated(formattedData, count || 0, page, pageSize, { statistics });
  } catch (error) {
    console.error('Failed to fetch students:', error);
    return serverError('获取学生列表失败');
  }
}
