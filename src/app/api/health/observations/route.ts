/**
 * 家长每日观察 API
 * GET  /api/health/observations?studentId=xxx&parentId=xxx&days=30
 * POST /api/health/observations  创建/更新观察数据
 */
import { NextResponse } from 'next/server';
import { protectedRoute } from '@/lib/auth';
import { healthManagementService } from '@/services/health-management.service';
import type { CreateObservationDTO } from '@/types/health-management';

export const GET = protectedRoute(async (request) => {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId');
  const parentId = searchParams.get('parentId');
  const days = parseInt(searchParams.get('days') || '30', 10);

  if (studentId) {
    const result = await healthManagementService.getObservationsByStudentId(studentId, days);
    return NextResponse.json({ success: result.success, data: result.data });
  }

  if (parentId) {
    const result = await healthManagementService.getObservationsByParentId(parentId, days);
    return NextResponse.json({ success: result.success, data: result.data });
  }

  return NextResponse.json({ success: false, error: '需要 studentId 或 parentId 参数' }, { status: 400 });
});

export const POST = protectedRoute(async (request, { user }) => {
  const body: CreateObservationDTO & { parentId?: string; studentId: string } = await request.json();

  // 家长端：parentId 从用户信息中获取
  const parentId = body.parentId || user.id;
  const studentId = body.studentId;

  if (!studentId) {
    return NextResponse.json({ success: false, error: '缺少 studentId' }, { status: 400 });
  }

  const result = await healthManagementService.createOrUpdateObservation(parentId, studentId, {
    studentId,
    observationDate: body.observationDate,
    sleepQuality: body.sleepQuality,
    dietQuality: body.dietQuality,
    energyLevel: body.energyLevel,
    note: body.note,
  });

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  }
  return NextResponse.json({ success: true, data: result.data }, { status: 201 });
});
