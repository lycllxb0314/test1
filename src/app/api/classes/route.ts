/**
 * 班级管理 API
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

/**
 * GET - 获取班级列表
 * 
 * 查询参数：
 * - grade: 年级筛选
 * - search: 搜索关键词
 * - page: 页码
 * - pageSize: 每页数量
 * - groupByGrade: 是否按年级分组
 */
export async function GET(request: NextRequest) {
  const params = parseQueryParams(request);
  
  try {
    const client = getSupabaseClient();
    
    // 检查是否需要按年级分组
    if (params.groupByGrade) {
      const { data: allClasses, error: dbError } = await client
        .from('classes')
        .select('*')
        .order('grade', { ascending: true })
        .order('class_number', { ascending: true });
      
      if (dbError) {
        return NextResponse.json(error('数据库查询失败', ErrorCode.DATABASE_ERROR), { status: 500 });
      }
      
      // 按年级分组
      const grouped: Record<string, typeof allClasses> = {};
      allClasses?.forEach(cls => {
        const gradeName = cls.grade_name || `${cls.grade}年级`;
        if (!grouped[gradeName]) {
          grouped[gradeName] = [];
        }
        grouped[gradeName].push(cls);
      });
      
      return NextResponse.json(success(grouped));
    }
    
    // 构建查询
    let query = client
      .from('classes')
      .select('*', { count: 'exact' });
    
    // 应用筛选
    if (params.grade && params.grade !== 'all') {
      const gradeValue = typeof params.grade === 'number' ? params.grade : parseInt(String(params.grade));
      if (!isNaN(gradeValue)) {
        query = query.eq('grade', gradeValue);
      }
    }
    
    // 应用搜索
    if (params.search) {
      query = query.or(`name.ilike.%${params.search}%,head_teacher_name.ilike.%${params.search}%`);
    }
    
    // 分页
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    query = query.range(from, to).order('grade', { ascending: true }).order('class_number', { ascending: true });
    
    const { data, error: dbError, count } = await query;
    
    if (dbError) {
      return NextResponse.json(error('数据库查询失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    // 转换下划线格式为驼峰格式
    const formattedData = (data || []).map(cls => ({
      id: cls.id,
      name: cls.name,
      grade: cls.grade,
      gradeName: cls.grade_name,
      classNumber: cls.class_number,
      headTeacherId: cls.head_teacher_id,
      headTeacherName: cls.head_teacher_name,
      classroomId: cls.classroom_id,
      classroomName: cls.classroom_name,
      building: cls.building,
      studentCount: cls.student_count || 0,
      status: cls.status,
      createdAt: cls.created_at,
      updatedAt: cls.updated_at,
    }));
    
    return NextResponse.json({
      success: true,
      data: formattedData,
      pagination: createPagination(count || 0, page, pageSize),
    });
  } catch (err) {
    console.error('Failed to fetch classes:', err);
    return NextResponse.json(error('获取班级列表失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}

/**
 * POST - 创建/更新班级
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const client = getSupabaseClient();
    
    if (body.action === 'update' && body.classId) {
      // 更新班级
      const { data, error: dbError } = await client
        .from('classes')
        .update({
          ...body.data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', body.classId)
        .select()
        .single();
      
      if (dbError) {
        return NextResponse.json(error('更新班级失败', ErrorCode.DATABASE_ERROR), { status: 500 });
      }
      
      return NextResponse.json(success(data));
    }
    
    // 创建班级
    const { data, error: dbError } = await client
      .from('classes')
      .insert({
        id: body.id || `c${Date.now()}`,
        name: body.name,
        grade: body.grade,
        grade_name: body.gradeName || `${body.grade}年级`,
        class_number: body.classNumber,
        head_teacher_id: body.headTeacherId,
        head_teacher_name: body.headTeacherName,
        classroom_id: body.classroomId,
        classroom_name: body.classroomName,
        building: body.building,
      })
      .select()
      .single();
    
    if (dbError) {
      return NextResponse.json(error('创建班级失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    return NextResponse.json(success(data));
  } catch (err) {
    console.error('Failed to create/update class:', err);
    return NextResponse.json(error('操作失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}
