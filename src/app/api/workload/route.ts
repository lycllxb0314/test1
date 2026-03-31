/**
 * 工作量统计 API
 * 
 * GET: 获取工作量统计
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 */

import { NextRequest, NextResponse } from 'next/server';
import { workloadService } from '@/services/misc.service';
import { success, error, ErrorCode } from '@/lib/api';

/**
 * GET - 获取工作量统计
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const teacherId = searchParams.get('teacherId');
  const semester = searchParams.get('semester') || undefined;

  if (!teacherId) {
    return NextResponse.json(
      error('缺少教师ID', ErrorCode.VALIDATION_ERROR),
      { status: 400 }
    );
  }

  const result = await workloadService.getByTeacher(teacherId, semester);

  if (!result.success || !result.data) {
    return NextResponse.json(
      error(result.error || '获取工作量统计失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  const formattedData = result.data.map((workload: any) => ({
    id: workload.id,
    teacherId: workload.teacher_id,
    teacherName: workload.teacher_name,
    semester: workload.semester,
    teachingHours: workload.teaching_hours,
    overtimeHours: workload.overtime_hours,
    dutyCount: workload.duty_count,
    activityCount: workload.activity_count,
    totalScore: workload.total_score,
    createdAt: workload.created_at,
  }));

  return NextResponse.json(success(formattedData));
}
