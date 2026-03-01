import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getMockStudentAttendance } from '@/lib/mock/moral.mock';

/**
 * GET - 获取考勤记录
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const classId = searchParams.get('classId');
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const type = searchParams.get('type');

    // 尝试数据库查询
    const client = getSupabaseClient();
    
    let query = client
      .from('attendance')
      .select('id, student_id, date, type, reason, recorder_id, recorder_name, created_at')
      .order('date', { ascending: false });

    if (studentId) query = query.eq('student_id', studentId);
    if (date) query = query.eq('date', date);
    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);
    if (type) query = query.eq('type', type);

    const { data, error } = await query;

    if (error) {
      // 数据库失败，使用Mock数据
      const filteredData = getMockStudentAttendance({
        studentId: studentId || undefined,
        classId: classId || undefined,
        date: date || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        type: type || undefined,
      });

      return NextResponse.json({
        success: true,
        data: filteredData,
        source: 'mock',
      });
    }

    const formattedData = (data || []).map((record: Record<string, unknown>) => ({
      id: record.id,
      studentId: record.student_id,
      studentName: '',
      studentNumber: '',
      grade: 0,
      className: '',
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
      source: 'database',
    });
  } catch (error) {
    console.error('Failed to fetch attendance:', error);
    // 异常情况也返回Mock数据
    return NextResponse.json({
      success: true,
      data: getMockStudentAttendance(),
      source: 'mock',
    });
  }
}

/**
 * POST - 创建考勤记录
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    const { studentId, date, type, reason, recorderId, recorderName } = body;

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
      return NextResponse.json({
        success: true,
        data: { id: `a-${Date.now()}`, studentId, date, type, reason, recorderId, recorderName },
        source: 'mock',
      });
    }

    return NextResponse.json({ success: true, data, source: 'database' });
  } catch (error) {
    console.error('Failed to create attendance:', error);
    return NextResponse.json({ success: false, error: '创建考勤记录失败' }, { status: 500 });
  }
}
