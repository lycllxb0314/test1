/**
 * 教师API路由
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
 * GET - 获取教师列表
 * 
 * 查询参数：
 * - search: 搜索关键词（姓名、工号、邮箱）
 * - subject: 学科筛选
 * - department: 部门筛选
 * - isHeadTeacher: 是否班主任
 * - page: 页码
 * - pageSize: 每页数量
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
      query = query.or(`name.ilike.%${params.search}%,id.ilike.%${params.search}%`);
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
    
    query = query.range(from, to).order('id', { ascending: true });
    
    const { data, error: dbError, count } = await query;
    
    if (dbError) {
      return NextResponse.json(error('数据库查询失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    // 从classes表获取班主任和科任信息
    const { data: classesData } = await client
      .from('classes')
      .select('id, name, head_teacher_id, sub_teacher_id');
    
    // 构建班主任和科任映射
    const headTeacherClassMap: Record<string, { classId: string; className: string }> = {};
    const subTeacherClassesMap: Record<string, Array<{ classId: string; className: string }>> = {};
    
    (classesData || []).forEach(c => {
      if (c.head_teacher_id) {
        headTeacherClassMap[c.head_teacher_id] = { classId: c.id, className: c.name };
      }
      if (c.sub_teacher_id) {
        if (!subTeacherClassesMap[c.sub_teacher_id]) {
          subTeacherClassesMap[c.sub_teacher_id] = [];
        }
        subTeacherClassesMap[c.sub_teacher_id].push({ classId: c.id, className: c.name });
      }
    });
    
    // 转换下划线格式为驼峰格式
    const formattedData = (data || []).map(t => {
      const headTeacherInfo = headTeacherClassMap[t.id];
      const subTeacherClasses = subTeacherClassesMap[t.id] || [];
      
      return {
        id: t.id,
        name: t.name,
        gender: t.gender,
        subjects: t.subjects || [],
        isHeadTeacher: !!headTeacherInfo,
        headTeacherClassId: headTeacherInfo?.classId,
        headTeacherClassName: headTeacherInfo?.className,
        subTeacherClasses: subTeacherClasses,
        department: t.department,
        title: t.title,
        phone: t.phone,
        email: t.email,
        status: t.status,
        createdAt: t.created_at,
        updatedAt: t.updated_at,
      };
    });
    
    return NextResponse.json({
      success: true,
      data: formattedData,
      pagination: createPagination(count || 0, page, pageSize),
      statistics: {
        total: count || 0,
        headTeachers: Object.keys(headTeacherClassMap).length,
        subTeachers: Object.keys(subTeacherClassesMap).length,
        departments: [...new Set((data || []).map(t => t.department))].length,
        senior: (data || []).filter(t => t.title === '高级教师' || t.title === '正高级教师').length,
      },
    });
  } catch (err) {
    console.error('Failed to fetch teachers:', err);
    return NextResponse.json(error('获取教师列表失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
};

/**
 * POST - 创建新教师
 */
const handleCreateTeacher = async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const body = await request.json();
    const client = getSupabaseClient();
    
    const { data, error: dbError } = await client
      .from('teachers')
      .insert({
        id: body.id || `t${Date.now()}`,
        name: body.name,
        gender: body.gender,
        subjects: body.subjects || [],
        is_head_teacher: body.isHeadTeacher || false,
        head_teacher_class_ids: body.headTeacherClassIds || [],
        department: body.department,
        title: body.title,
        phone: body.phone,
        email: body.email,
        status: 'active',
      })
      .select()
      .single();
    
    if (dbError) {
      return NextResponse.json(error('创建教师失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    return NextResponse.json(success(data));
  } catch (err) {
    console.error('Failed to create teacher:', err);
    return NextResponse.json(error('操作失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
};

// 导出受保护的路由处理器
export const GET = protectedRoute(handleGetTeachers, { 
  module: 'teacher', 
  permission: 'view',
  optional: true,
});

export const POST = protectedRoute(handleCreateTeacher, { 
  module: 'teacher', 
  permission: 'manage',
});
