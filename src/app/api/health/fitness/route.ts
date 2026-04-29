/**
 * 体质测评 API
 * GET  /api/health/fitness?studentId=xxx&academicYear=xxx&semester=xxx
 * POST /api/health/fitness  创建/批量导入
 */
import { NextResponse } from 'next/server';
import { protectedRoute } from '@/lib/auth';
import { healthManagementService } from '@/services/health-management.service';
import type { CreateFitnessAssessmentDTO } from '@/types/health-management';

export const GET = protectedRoute(async (request) => {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId');
  const academicYear = searchParams.get('academicYear');
  const semester = searchParams.get('semester');

  if (studentId) {
    const result = await healthManagementService.getFitnessByStudentId(studentId);
    return NextResponse.json({ success: result.success, data: result.data });
  }

  if (academicYear && semester) {
    const result = await healthManagementService.getFitnessByYearSemester(academicYear, semester);
    return NextResponse.json({ success: result.success, data: result.data });
  }

  return NextResponse.json({ success: false, error: '需要 studentId 或 academicYear+semester 参数' }, { status: 400 });
});

export const POST = protectedRoute(async (request, { user }) => {
  const body = await request.json();

  if (Array.isArray(body)) {
    // 批量导入
    const records = body.map((item: CreateFitnessAssessmentDTO) => ({
      ...item,
      importedBy: user.employeeId || user.id,
    }));
    const result = await healthManagementService.bulkImportFitness(records);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: result.data });
  }

  // 单条创建
  const result = await healthManagementService.createFitnessAssessment({
    ...body,
    importedBy: user.employeeId || user.id,
  });
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  }
  return NextResponse.json({ success: true, data: result.data }, { status: 201 });
});
