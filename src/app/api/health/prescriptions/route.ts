/**
 * 健康处方 API
 * GET    /api/health/prescriptions?studentId=xxx&status=active
 * POST   /api/health/prescriptions  创建处方
 * PATCH  /api/health/prescriptions  确认处方
 */
import { NextResponse } from 'next/server';
import { protectedRoute } from '@/lib/auth';
import { healthManagementService } from '@/services/health-management.service';
import type { CreateHealthPrescriptionDTO } from '@/types/health-management';

export const GET = protectedRoute(async (request) => {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId');
  const status = searchParams.get('status') || undefined;

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
