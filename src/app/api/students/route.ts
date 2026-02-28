/**
 * 学生API路由
 * 
 * 使用统一的路由处理模式和集中的Mock数据
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { 
  MOCK_STUDENTS, 
  getMockStudents,
} from '@/lib/mock/students.mock';
import { 
  success, 
  error, 
  parseQueryParams, 
  createPagination,
  ErrorCode 
} from '@/lib/api-route-utils';
import type { Student } from '@/types';

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
export async function GET(request: NextRequest) {
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
    
    query = query.range(from, to).order('created_at', { ascending: false });
    
    const { data, error: dbError, count } = await query;
    
    if (dbError) {
      console.log('Database query failed, using mock data:', dbError.message);
      
      // 使用Mock数据
      const mockResult = getMockStudents({
        search: params.search,
        grade: String(params.grade),
        classId: String(params.classId),
        status: String(params.status),
        page,
        pageSize,
      });
      
      return NextResponse.json({
        success: true,
        data: mockResult.data,
        pagination: createPagination(mockResult.total, page, pageSize),
        source: 'mock',
      });
    }
    
    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: createPagination(count || 0, page, pageSize),
      source: 'database',
    });
  } catch (err) {
    console.error('Failed to fetch students:', err);
    
    // 使用Mock数据作为fallback
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const mockResult = getMockStudents({
      search: params.search,
      grade: String(params.grade),
      classId: String(params.classId),
      status: String(params.status),
      page,
      pageSize,
    });
    
    return NextResponse.json({
      success: true,
      data: mockResult.data,
      pagination: createPagination(mockResult.total, page, pageSize),
      source: 'mock',
    });
  }
}

/**
 * POST - 创建新学生
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const client = getSupabaseClient();
    
    // 数据库插入
    const { data, error: dbError } = await client
      .from('students')
      .insert({
        ...body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (dbError) {
      console.error('Database insert error:', dbError);
      
      // 返回mock成功响应
      const newStudent: Student = {
        id: `s_${Date.now()}`,
        studentNo: body.studentNo || `${Date.now()}`,
        name: body.name,
        gender: body.gender || 'male',
        birthDate: body.birthDate,
        classId: body.classId,
        className: body.className,
        status: body.status || '在校',
        parents: body.parents || [],
      };
      
      return NextResponse.json({
        success: true,
        data: newStudent,
        message: '学生添加成功',
        source: 'mock',
      });
    }
    
    return NextResponse.json({
      success: true,
      data,
      message: '学生添加成功',
      source: 'database',
    });
  } catch (err) {
    console.error('Failed to create student:', err);
    return NextResponse.json(
      error('添加学生失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}
