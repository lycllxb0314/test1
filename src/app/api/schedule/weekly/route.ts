/**
 * 周课表 API
 * 
 * GET: 获取周课表
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { success, error, ErrorCode } from '@/lib/api';

/**
 * GET - 获取周课表
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const classId = searchParams.get('classId') || undefined;
  const teacherId = searchParams.get('teacherId') || undefined;
  const grade = searchParams.get('grade') ? parseInt(searchParams.get('grade')!) : undefined;
  const weekNumber = searchParams.get('weekNumber') ? parseInt(searchParams.get('weekNumber')!) : undefined;

  if (!classId && !teacherId && !grade) {
    return NextResponse.json(
      error('需要提供班级ID、教师ID或年级', ErrorCode.VALIDATION_ERROR),
      { status: 400 }
    );
  }

  const client = getSupabaseClient();
  let query = client.from('schedules').select('*');

  if (classId) query = query.eq('class_id', classId);
  if (teacherId) query = query.eq('teacher_id', teacherId);
  if (grade) query = query.eq('grade', grade);
  if (weekNumber) query = query.eq('week_number', weekNumber);

  const { data, error: dbError } = await query.order('week_day').order('period_index');

  if (dbError) {
    return NextResponse.json(
      error('获取周课表失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  return NextResponse.json(success(data || []));
}
