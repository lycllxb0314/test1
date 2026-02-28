/**
 * 班级管理 API
 * 
 * 使用统一的路由处理模式和集中的Mock数据
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { 
  MOCK_CLASSES, 
  getMockClasses,
  getMockClassesByGrade,
} from '@/lib/mock/classes.mock';
import { 
  success, 
  error, 
  parseQueryParams, 
  createPagination,
  ErrorCode 
} from '@/lib/api-route-utils';
import type { ClassInfo } from '@/types';

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
      const grouped = getMockClassesByGrade();
      return NextResponse.json(success(grouped, 'mock'));
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
      console.log('Database query failed, using mock data:', dbError.message);
      
      // 使用Mock数据
      const mockData = getMockClasses({
        grade: String(params.grade),
        search: params.search,
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
    console.error('Failed to fetch classes:', err);
    
    // 使用Mock数据作为fallback
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const mockData = getMockClasses({
      grade: String(params.grade),
      search: params.search,
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
        console.error('Database update error:', dbError);
        return NextResponse.json(success({ id: body.classId, ...body.data }, 'mock'));
      }
      
      return NextResponse.json(success(data, 'database'));
    }
    
    // 创建新班级
    const { data, error: dbError } = await client
      .from('classes')
      .insert({
        ...body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (dbError) {
      console.error('Database insert error:', dbError);
      
      const newClass: Partial<ClassInfo> = {
        id: `c_${Date.now()}`,
        name: body.name,
        grade: body.grade,
        classNumber: body.classNumber,
        headTeacherId: body.headTeacherId,
        headTeacherName: body.headTeacherName,
        studentCount: 0,
        maleCount: 0,
        femaleCount: 0,
        status: 'active',
      };
      
      return NextResponse.json({
        success: true,
        data: newClass,
        message: '班级添加成功',
        source: 'mock',
      });
    }
    
    return NextResponse.json({
      success: true,
      data,
      message: '班级添加成功',
      source: 'database',
    });
  } catch (err) {
    console.error('Failed to create/update class:', err);
    return NextResponse.json(
      error('操作失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}
