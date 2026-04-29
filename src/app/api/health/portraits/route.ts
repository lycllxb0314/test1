/**
 * 健康画像 API
 * GET /api/health/portraits?studentId=xxx&page=1&pageSize=20&status=xxx&classId=xxx
 * POST /api/health/portraits/compute?studentId=xxx  手动触发画像计算
 */
import { NextResponse } from 'next/server';
import { protectedRoute } from '@/lib/auth';
import { healthManagementService } from '@/services/health-management.service';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export const GET = protectedRoute(async (request) => {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
  const status = searchParams.get('status') || undefined;
  const classId = searchParams.get('classId');

  if (studentId) {
    const result = await healthManagementService.getPortraitByStudentId(studentId);
    return NextResponse.json({ success: result.success, data: result.data });
  }

  // 按 classId 转换为 studentIds 列表
  let filterStudentIds: string[] | undefined;
  if (classId && classId !== 'all') {
    const client = getSupabaseClient();
    const { data: students } = await client
      .from('students')
      .select('id')
      .eq('class_id', classId);
    filterStudentIds = (students || []).map((s: Record<string, unknown>) => s.id as string);
  }

  // status 或 filterStudentIds 传给 repository
  const filterParam: string | string[] | null = filterStudentIds
    ? filterStudentIds
    : status || null;

  const result = await healthManagementService.getAllPortraits(page, pageSize, filterParam);
  return NextResponse.json({ success: result.success, data: result.data });
});

export const POST = protectedRoute(async (request) => {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId');

  if (!studentId) {
    return NextResponse.json({ success: false, error: '缺少 studentId' }, { status: 400 });
  }

  const result = await healthManagementService.computePortrait(studentId);
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  }
  return NextResponse.json({ success: true, data: result.data });
});
