import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * GET - 获取习惯之星列表
 * 查询参数：
 * - page: 页码
 * - pageSize: 每页数量
 * - month: 月份
 * - grade: 年级
 * - classId: 班级ID
 * - level: 级别 (class/grade/school)
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const month = searchParams.get('month');
    const grade = searchParams.get('grade');
    const classId = searchParams.get('classId');
    const level = searchParams.get('level');

    let query = client
      .from('habit_stars')
      .select('*', { count: 'exact' });

    if (month) {
      query = query.eq('month', month);
    }
    if (grade) {
      query = query.eq('grade', parseInt(grade));
    }
    if (classId) {
      query = query.eq('class_id', classId);
    }
    if (level) {
      query = query.eq('level', level);
    }

    // 分页
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);
    query = query.order('created_at', { ascending: false });

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
    console.error('Failed to fetch habit stars:', error);
    return NextResponse.json({
      success: false,
      error: '获取习惯之星失败',
    }, { status: 500 });
  }
}

/**
 * POST - 评选习惯之星
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    // 检查该学生该月是否已评选
    const { data: existing } = await client
      .from('habit_stars')
      .select('id')
      .eq('student_id', body.student_id)
      .eq('month', body.month)
      .eq('level', body.level)
      .single();

    if (existing) {
      return NextResponse.json({
        success: false,
        error: '该学生本月已获评该级别习惯之星',
      }, { status: 400 });
    }

    const { data, error } = await client
      .from('habit_stars')
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
      message: '习惯之星评选成功',
    });
  } catch (error) {
    console.error('Failed to create habit star:', error);
    return NextResponse.json({
      success: false,
      error: '评选习惯之星失败',
    }, { status: 500 });
  }
}
