import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * GET - 获取班级列表
 * 查询参数：
 * - page: 页码
 * - pageSize: 每页数量
 * - grade: 年级
 * - headTeacherId: 班主任ID
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const grade = searchParams.get('grade');
    const headTeacherId = searchParams.get('headTeacherId');
    const search = searchParams.get('search');

    let query = client
      .from('classes')
      .select('*', { count: 'exact' });

    if (grade) {
      query = query.eq('grade', parseInt(grade));
    }
    if (headTeacherId) {
      query = query.eq('head_teacher_id', headTeacherId);
    }
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    // 分页
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);
    query = query.order('grade', { ascending: true });
    query = query.order('name', { ascending: true });

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
      }, { status: 500 });
    }

    // 转换字段名以匹配前端类型
    const classes = (data || []).map(c => ({
      id: c.id,
      name: c.name,
      grade: c.grade,
      headTeacherId: c.head_teacher_id,
      headTeacherName: c.head_teacher_name,
      studentCount: c.student_count || 0,
      classroomId: c.classroom_id,
      classroomName: c.classroom_name,
      building: c.building,
      status: c.status,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    }));

    return NextResponse.json({
      success: true,
      data: {
        data: classes,
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    });
  } catch (error) {
    console.error('Failed to fetch classes:', error);
    return NextResponse.json({
      success: false,
      error: '获取班级列表失败',
    }, { status: 500 });
  }
}

/**
 * POST - 创建班级
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const { data, error } = await client
      .from('classes')
      .insert({
        name: body.name,
        grade: body.grade,
        head_teacher_id: body.headTeacherId,
        head_teacher_name: body.headTeacherName,
        student_count: body.studentCount || 0,
        classroom_id: body.classroomId,
        classroom_name: body.classroomName,
        building: body.building,
        status: body.status || 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
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
      data: {
        id: data.id,
        name: data.name,
        grade: data.grade,
        headTeacherId: data.head_teacher_id,
        headTeacherName: data.head_teacher_name,
        studentCount: data.student_count,
        status: data.status,
      },
      message: '班级创建成功',
    });
  } catch (error) {
    console.error('Failed to create class:', error);
    return NextResponse.json({
      success: false,
      error: '创建班级失败',
    }, { status: 500 });
  }
}
