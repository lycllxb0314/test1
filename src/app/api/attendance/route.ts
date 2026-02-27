import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// Mock考勤数据
const mockAttendance = [
  { id: 'a1', studentId: 's001', studentName: '张三', studentNumber: '2024001', grade: 6, className: '六年级1班', date: '2024-11-18', type: 'attendance', reason: null, recorderId: 't001', recorderName: '王芳', createdAt: '2024-11-18' },
  { id: 'a2', studentId: 's002', studentName: '李四', studentNumber: '2024002', grade: 6, className: '六年级1班', date: '2024-11-18', type: 'attendance', reason: null, recorderId: 't001', recorderName: '王芳', createdAt: '2024-11-18' },
  { id: 'a3', studentId: 's003', studentName: '王五', studentNumber: '2024003', grade: 6, className: '六年级1班', date: '2024-11-18', type: 'leave', reason: '病假', recorderId: 't001', recorderName: '王芳', createdAt: '2024-11-18' },
  { id: 'a4', studentId: 's004', studentName: '赵六', studentNumber: '2024004', grade: 6, className: '六年级1班', date: '2024-11-18', type: 'late', reason: '交通堵塞', recorderId: 't001', recorderName: '王芳', createdAt: '2024-11-18' },
  { id: 'a5', studentId: 's001', studentName: '张三', studentNumber: '2024001', grade: 6, className: '六年级1班', date: '2024-11-19', type: 'attendance', reason: null, recorderId: 't001', recorderName: '王芳', createdAt: '2024-11-19' },
];

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
      let filteredData = [...mockAttendance];
      if (studentId) filteredData = filteredData.filter(a => a.studentId === studentId);
      if (classId) filteredData = filteredData.filter(a => a.className.includes(classId));
      if (date) filteredData = filteredData.filter(a => a.date === date);
      if (startDate) filteredData = filteredData.filter(a => a.date >= startDate);
      if (endDate) filteredData = filteredData.filter(a => a.date <= endDate);
      if (type) filteredData = filteredData.filter(a => a.type === type);

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
      data: mockAttendance,
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
