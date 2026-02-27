import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * GET - 获取考勤记录
 * 查询参数：
 * - studentId: 学生ID
 * - classId: 班级ID
 * - date: 日期
 * - startDate: 开始日期
 * - endDate: 结束日期
 * - type: 考勤类型 (attendance/leave/late/early_leave)
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const classId = searchParams.get('classId');
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const type = searchParams.get('type');

    // 构建查询
    let query = client
      .from('attendance')
      .select(`
        id,
        student_id,
        date,
        type,
        reason,
        recorder_id,
        recorder_name,
        created_at,
        students (
          id,
          name,
          student_number,
          grade,
          class_id,
          classes (
            id,
            name
          )
        )
      `)
      .order('date', { ascending: false });

    // 应用筛选条件
    if (studentId) {
      query = query.eq('student_id', studentId);
    }

    if (classId) {
      const { data: studentIds } = await client
        .from('students')
        .select('id')
        .eq('class_id', classId);

      const ids = (studentIds || []).map(s => s.id);
      if (ids.length > 0) {
        query = query.in('student_id', ids);
      } else {
        return NextResponse.json({
          success: true,
          data: [],
        });
      }
    }

    if (date) {
      query = query.eq('date', date);
    }

    if (startDate) {
      query = query.gte('date', startDate);
    }

    if (endDate) {
      query = query.lte('date', endDate);
    }

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // 格式化返回数据
    const formattedData = (data || []).map((record: any) => ({
      id: record.id,
      studentId: record.student_id,
      studentName: record.students?.name || '',
      studentNumber: record.students?.student_number || '',
      grade: record.students?.grade || 0,
      className: record.students?.classes?.name || '',
      date: record.date,
      type: record.type,
      reason: record.reason,
      recorderId: record.recorder_id,
      recorderName: record.recorder_name,
      createdAt: record.created_at,
    }));

    return NextResponse.json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error('Failed to fetch attendance:', error);
    return NextResponse.json({
      success: false,
      error: '获取考勤记录失败',
    }, { status: 500 });
  }
}

/**
 * POST - 创建考勤记录
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const {
      studentId,
      date,
      type,
      reason,
      recorderId,
      recorderName,
    } = body;

    const { data, error } = await client
      .from('attendance')
      .insert({
        student_id: studentId,
        date,
        type,
        reason,
        recorder_id: recorderId,
        recorder_name: recorderName,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Failed to create attendance:', error);
    return NextResponse.json({
      success: false,
      error: '创建考勤记录失败',
    }, { status: 500 });
  }
}

/**
 * PUT - 更新考勤记录
 */
export async function PUT(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const { id, type, reason } = body;

    const { data, error } = await client
      .from('attendance')
      .update({
        type,
        reason,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Failed to update attendance:', error);
    return NextResponse.json({
      success: false,
      error: '更新考勤记录失败',
    }, { status: 500 });
  }
}
