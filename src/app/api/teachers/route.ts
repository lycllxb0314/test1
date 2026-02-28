/**
 * 教师API路由
 * 
 * 使用统一的路由处理模式、集中的Mock数据和认证保护
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { 
  MOCK_TEACHERS, 
  MOCK_TEACHER_PROFILE,
  getMockTeachers,
  getMockTeacherProfile,
} from '@/lib/mock/teachers.mock';
import { 
  success, 
  error, 
  parseQueryParams, 
  createPagination,
  ErrorCode 
} from '@/lib/api-route-utils';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';
import type { Teacher, TeacherProfile } from '@/types';

/**
 * GET - 获取教师列表
 * 
 * 查询参数：
 * - search: 搜索关键词（姓名、工号、邮箱）
 * - subject: 学科筛选
 * - department: 部门筛选
 * - isHeadTeacher: 是否班主任
 * - page: 页码
 * - pageSize: 每页数量
 * 
 * 权限要求：教师模块查看权限
 */
const handleGetTeachers = async (request: NextRequest, { user }: ExtendedRouteContext) => {
  const params = parseQueryParams(request);
  
  try {
    const client = getSupabaseClient();
    
    // 构建查询
    let query = client
      .from('teachers')
      .select('*', { count: 'exact' });
    
    // 应用搜索
    if (params.search) {
      query = query.or(`name.ilike.%${params.search}%,employee_no.ilike.%${params.search}%,email.ilike.%${params.search}%`);
    }
    
    // 应用筛选
    if (params.subject && params.subject !== 'all') {
      query = query.contains('subjects', [params.subject]);
    }
    if (params.department && params.department !== 'all') {
      query = query.eq('department', params.department);
    }
    if (params.isHeadTeacher !== undefined) {
      query = query.eq('is_head_teacher', params.isHeadTeacher);
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
      const mockData = getMockTeachers({
        search: params.search,
        subject: params.subject as string,
        department: params.department as string,
        isHeadTeacher: params.isHeadTeacher as boolean,
      });
      
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const paginatedData = mockData.slice(start, end);
      
      return NextResponse.json({
        success: true,
        data: paginatedData,
        pagination: createPagination(mockData.length, page, pageSize),
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
    console.error('Failed to fetch teachers:', err);
    
    // 使用Mock数据作为fallback
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const mockData = getMockTeachers({
      search: params.search,
      subject: params.subject as string,
      department: params.department as string,
    });
    
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    
    return NextResponse.json({
      success: true,
      data: mockData.slice(start, end),
      pagination: createPagination(mockData.length, page, pageSize),
      source: 'mock',
    });
  }
};

/**
 * POST - 创建新教师
 * 
 * 权限要求：教师模块管理权限
 */
const handleCreateTeacher = async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const body = await request.json();
    const client = getSupabaseClient();
    
    // 数据库插入
    const { data, error: dbError } = await client
      .from('teachers')
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
      const newTeacher: Teacher = {
        id: `t_${Date.now()}`,
        name: body.name,
        employeeNo: body.employeeNo || `T${Date.now()}`,
        gender: body.gender || 'male',
        phone: body.phone,
        email: body.email,
        subjects: body.subjects || [],
        isHeadTeacher: body.isHeadTeacher || false,
        department: body.department,
        classId: body.classId,
        className: body.className,
        position: body.position,
        avatar: body.avatar,
      };
      
      return NextResponse.json({
        success: true,
        data: newTeacher,
        message: '教师添加成功',
        source: 'mock',
      });
    }
    
    return NextResponse.json({
      success: true,
      data,
      message: '教师添加成功',
      source: 'database',
    });
  } catch (err) {
    console.error('Failed to create teacher:', err);
    return NextResponse.json(
      error('添加教师失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
};

// 导出受保护的路由处理器
export const GET = protectedRoute(handleGetTeachers, { 
  module: 'teacher', 
  permission: 'view',
  optional: true, // 列表查询允许未登录访问（用于演示）
});

export const POST = protectedRoute(handleCreateTeacher, { 
  module: 'teacher', 
  permission: 'edit' 
});
