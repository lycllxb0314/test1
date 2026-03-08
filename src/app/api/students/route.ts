/**
 * 学生列表 API
 * 
 * GET /api/students - 获取学生列表（支持分页、筛选）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

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
    
    // 构建查询
    let query = client
      .from('students')
      .select('*', { count: 'exact' });
    
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
    
    // 排序（按年级、班级名称、学号）
    query = query.order('grade').order('class_name').order('student_no');
    
    // 分页
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);
    
    const { data, error, count } = await query;
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
      }, { status: 500 });
    }
    
    // 转换数据格式（下划线转驼峰）
    const formattedData = (data || []).map(s => ({
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
      
      // 班主任信息
      headTeacherId: s.head_teacher_id,
      headTeacherName: s.head_teacher_name,
      
      // 状态
      status: s.status || '在校',
      
      // 习惯养成
      habitStars: s.habit_stars,
      
      // 时间戳
      createdAt: s.created_at,
      updatedAt: s.updated_at,
    }));
    
    // 计算统计数据
    const statistics = {
      total: count || 0,
      maleCount: formattedData.filter(s => s.gender === 'male').length,
      femaleCount: formattedData.filter(s => s.gender === 'female').length,
      classCount: new Set(formattedData.map(s => s.classId)).size,
    };
    
    return NextResponse.json({
      success: true,
      data: formattedData,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
      statistics,
    });
  } catch (error) {
    console.error('Failed to fetch students:', error);
    return NextResponse.json({
      success: false,
      error: '获取学生列表失败',
    }, { status: 500 });
  }
}
