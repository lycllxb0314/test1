/**
 * 健康管理统计概览 API
 * GET /api/health/stats?classId=xxx&grade=xxx
 */
import { NextResponse } from 'next/server';
import { protectedRoute } from '@/lib/auth';
import { healthManagementService } from '@/services/health-management.service';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export const GET = protectedRoute(async (request) => {
  const { searchParams } = new URL(request.url);
  const classId = searchParams.get('classId');
  const grade = searchParams.get('grade');

  // 如果有 classId 或 grade 筛选，按筛选范围统计
  let filterStudentIds: string[] | null = null;

  if (classId && classId !== 'all') {
    const client = getSupabaseClient();
    const { data: students } = await client
      .from('students')
      .select('id')
      .eq('class_id', classId);
    filterStudentIds = (students || []).map((s: Record<string, unknown>) => s.id as string);
  } else if (grade && grade !== 'all') {
    const client = getSupabaseClient();
    const gradeNum = Number(grade);
    // 查找对应年级的班级
    const { data: classes } = await client
      .from('classes')
      .select('id')
      .eq('grade_number', gradeNum);
    const classIds = (classes || []).map((c: Record<string, unknown>) => c.id as string);
    if (classIds.length > 0) {
      const { data: students } = await client
        .from('students')
        .select('id')
        .in('class_id', classIds);
      filterStudentIds = (students || []).map((s: Record<string, unknown>) => s.id as string);
    }
  }

  const result = await healthManagementService.getStatsOverview(filterStudentIds);
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  }
  return NextResponse.json({ success: true, data: result.data });
});
