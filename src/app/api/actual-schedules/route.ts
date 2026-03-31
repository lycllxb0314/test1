/**
 * 实际课表 API
 * 
 * GET: 获取实际课表
 * POST: 创建实际课表条目
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { success, error, ErrorCode } from '@/lib/api';

/**
 * GET - 获取实际课表
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const classId = searchParams.get('classId') || undefined;
  const teacherId = searchParams.get('teacherId') || undefined;
  const weekNumber = searchParams.get('weekNumber') ? parseInt(searchParams.get('weekNumber')!) : undefined;

  if (!classId && !teacherId) {
    return NextResponse.json(
      error('需要提供班级ID或教师ID', ErrorCode.VALIDATION_ERROR),
      { status: 400 }
    );
  }

  const client = getSupabaseClient();
  let query = client.from('actual_schedules').select('*');

  if (classId) query = query.eq('class_id', classId);
  if (teacherId) query = query.eq('teacher_id', teacherId);
  if (weekNumber) query = query.eq('week_number', weekNumber);

  const { data, error: dbError } = await query.order('week_day').order('period_index');

  if (dbError) {
    return NextResponse.json(
      error('获取实际课表失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  return NextResponse.json(success(data || []));
}

/**
 * POST - 创建实际课表条目
 */
export async function POST(request: NextRequest) {
  const body = await request.json();

  const client = getSupabaseClient();
  const { data, error: dbError } = await client
    .from('actual_schedules')
    .insert({
      id: `as-${Date.now()}`,
      class_id: body.classId,
      class_name: body.className,
      grade: body.grade,
      week_day: body.weekDay,
      period_index: body.periodIndex,
      subject: body.subject,
      teacher_id: body.teacherId,
      teacher_name: body.teacherName,
      week_number: body.weekNumber,
      week_start_date: body.weekStartDate,
      notes: body.notes,
    })
    .select()
    .single();

  if (dbError || !data) {
    return NextResponse.json(
      error('创建实际课表条目失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  return NextResponse.json(success(data));
}
