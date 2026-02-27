import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * GET - 获取习惯评价记录列表
 * 查询参数：
 * - page: 页码
 * - pageSize: 每页数量
 * - studentId: 学生ID
 * - classId: 班级ID
 * - category: 习惯类别
 * - type: 评价类型 (praise/improve)
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const studentId = searchParams.get('studentId');
    const classId = searchParams.get('classId');
    const category = searchParams.get('category');
    const type = searchParams.get('type');

    let query = client
      .from('habit_assessments')
      .select('*', { count: 'exact' });

    if (studentId) {
      query = query.eq('student_id', studentId);
    }
    if (classId) {
      query = query.eq('class_id', classId);
    }
    if (category) {
      query = query.eq('category', category);
    }
    if (type) {
      query = query.eq('type', type);
    }

    // 分页
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);
    query = query.order('occurred_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        data: data || [],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    });
  } catch (error) {
    console.error('Failed to fetch habit assessments:', error);
    return NextResponse.json({
      success: false,
      error: '获取习惯评价记录失败',
    }, { status: 500 });
  }
}

/**
 * POST - 创建习惯评价记录
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const { data, error } = await client
      .from('habit_assessments')
      .insert({
        ...body,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
      message: '评价记录创建成功',
    });
  } catch (error) {
    console.error('Failed to create habit assessment:', error);
    return NextResponse.json({
      success: false,
      error: '创建评价记录失败',
    }, { status: 500 });
  }
}
