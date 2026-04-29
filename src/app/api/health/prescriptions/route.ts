/**
 * 健康处方 API
 * GET    /api/health/prescriptions?studentId=xxx&status=active        单个学生处方
 * GET    /api/health/prescriptions?mode=admin&page=1&pageSize=20      管理端列表
 * POST   /api/health/prescriptions                                    创建处方
 * POST   /api/health/prescriptions?mode=regenerate                    批量刷新处方
 * POST   /api/health/prescriptions?mode=generate&studentId=xxx        单个学生生成处方
 * PATCH  /api/health/prescriptions                                    确认处方
 */
import { NextResponse } from 'next/server';
import { protectedRoute } from '@/lib/auth';
import { healthManagementService } from '@/services/health-management.service';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { CreateHealthPrescriptionDTO } from '@/types/health-management';

export const GET = protectedRoute(async (request) => {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode');
  const studentId = searchParams.get('studentId');
  const status = searchParams.get('status') || undefined;
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
  const classId = searchParams.get('classId');

  if (mode === 'admin') {
    // 管理端列表查询
    let filterStudentIds: string[] | undefined;
    if (classId && classId !== 'all') {
      const client = getSupabaseClient();
      const { data: students } = await client
        .from('students')
        .select('id')
        .eq('class_id', classId);
      filterStudentIds = (students || []).map((s: Record<string, unknown>) => s.id as string);
    }

    const result = await healthManagementService.getAllPrescriptions(page, pageSize, filterStudentIds, status || null);
    return NextResponse.json({ success: result.success, data: result.data });
  }

  if (!studentId) {
    return NextResponse.json({ success: false, error: '缺少 studentId' }, { status: 400 });
  }

  if (status === 'active') {
    const result = await healthManagementService.getActivePrescription(studentId);
    return NextResponse.json({ success: result.success, data: result.data });
  }

  const result = await healthManagementService.getPrescriptionsByStudentId(studentId, status);
  return NextResponse.json({ success: result.success, data: result.data });
});

export const POST = protectedRoute(async (request) => {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode');

  // 批量刷新处方
  if (mode === 'regenerate') {
    const classId = searchParams.get('classId');
    let filterStudentIds: string[] | undefined;
    if (classId && classId !== 'all') {
      const client = getSupabaseClient();
      const { data: students } = await client
        .from('students')
        .select('id')
        .eq('class_id', classId);
      filterStudentIds = (students || []).map((s: Record<string, unknown>) => s.id as string);
    }

    const result = await healthManagementService.batchRegeneratePrescriptions(filterStudentIds);
    return NextResponse.json({ success: result.success, data: result.data });
  }

  // 单个学生生成处方
  if (mode === 'generate') {
    const studentId = searchParams.get('studentId');
    if (!studentId) {
      return NextResponse.json({ success: false, error: '缺少 studentId' }, { status: 400 });
    }
    const result = await healthManagementService.generatePrescriptionFromPortrait(studentId);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: result.data });
  }

  // 手动创建处方
  const body: CreateHealthPrescriptionDTO = await request.json();
  if (!body.studentId) {
    return NextResponse.json({ success: false, error: '缺少 studentId' }, { status: 400 });
  }

  const result = await healthManagementService.createPrescription(body);
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  }
  return NextResponse.json({ success: true, data: result.data }, { status: 201 });
});

export const PATCH = protectedRoute(async (request, { user }) => {
  const body = await request.json();
  const { prescriptionId } = body;

  if (!prescriptionId) {
    return NextResponse.json({ success: false, error: '缺少 prescriptionId' }, { status: 400 });
  }

  const result = await healthManagementService.confirmPrescription(
    prescriptionId,
    user.employeeId || user.id
  );
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  }
  return NextResponse.json({ success: true, data: result.data });
});
