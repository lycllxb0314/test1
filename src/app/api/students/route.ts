/**
 * 学生API路由
 * 
 * 数据源：Supabase 数据库（唯一数据源）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { 
  success, 
  error, 
  parseQueryParams, 
  createPagination,
  ErrorCode 
} from '@/lib/api-route-utils';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

/**
 * GET - 获取学生列表
 * 
 * 查询参数：
 * - search: 搜索关键词（姓名、学号）
 * - grade: 年级筛选
 * - classId: 班级筛选
 * - status: 状态筛选
 * - page: 页码
 * - pageSize: 每页数量
 */
const handleGetStudents = async (request: NextRequest, { user }: ExtendedRouteContext) => {
  const params = parseQueryParams(request);
  
  try {
    const client = getSupabaseClient();
    
    // 构建查询
    let query = client
      .from('students')
      .select('*', { count: 'exact' });
    
    // 应用搜索
    if (params.search) {
      query = query.or(`name.ilike.%${params.search}%,student_no.ilike.%${params.search}%`);
    }
    
    // 应用筛选
    if (params.grade && params.grade !== 'all') {
      query = query.eq('grade', params.grade);
    }
    if (params.classId && params.classId !== 'all') {
      query = query.eq('class_id', params.classId);
    }
    if (params.status && params.status !== 'all') {
      query = query.eq('status', params.status);
    }
    
    // 分页
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    query = query.range(from, to).order('student_no', { ascending: true });
    
    const { data, error: dbError, count } = await query;
    
    if (dbError) {
      return NextResponse.json(error('获取学生列表失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: createPagination(count || 0, page, pageSize),
    });
  } catch (err) {
    console.error('Failed to fetch students:', err);
    return NextResponse.json(error('获取学生列表失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
};

/**
 * POST - 创建新学生
 */
const handleCreateStudent = async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const body = await request.json();
    const client = getSupabaseClient();
    
    // 获取班级信息
    const { data: classData } = await client
      .from('classes')
      .select('*')
      .eq('id', body.class_id || body.classId)
      .single();
    
    const { data, error: dbError } = await client
      .from('students')
      .insert({
        id: body.id || `s${Date.now()}`,
        student_no: body.student_no || body.studentNo || `${Date.now()}`,
        name: body.name,
        gender: body.gender,
        birth_date: body.birth_date || body.birthDate,
        class_id: body.class_id || body.classId,
        class_name: classData?.name || body.class_name || body.className,
        grade: classData?.grade || body.grade,
        parent_name: body.parent_name || body.parentName,
        parent_phone: body.parent_phone || body.parentPhone,
        address: body.address,
        status: body.status || '在校',
      })
      .select()
      .single();
    
    if (dbError) {
      return NextResponse.json(error('创建学生失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    // 更新班级学生数量
    if (classData) {
      await client
        .from('classes')
        .update({ student_count: (classData.student_count || 0) + 1 })
        .eq('id', classData.id);
    }
    
    return NextResponse.json(success(data));
  } catch (err) {
    console.error('Failed to create student:', err);
    return NextResponse.json(error('操作失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
};

// 导出受保护的路由处理器
export const GET = protectedRoute(handleGetStudents, { 
  module: 'teacher', 
  permission: 'view',
  optional: true,
});

export const POST = protectedRoute(handleCreateStudent, { 
  module: 'academic', 
  permission: 'manage' 
});
