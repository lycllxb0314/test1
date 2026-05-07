import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/auth-middleware';
import { homeSchoolRepository } from '@/repositories/home-school.repository';
import { success, error, ErrorCode } from '@/lib/api';

// GET: 获取预警列表
export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (!authResult.success || !authResult.user) {
    return NextResponse.json(error('请先登录', ErrorCode.UNAUTHORIZED), { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const isHandled = searchParams.get('isHandled');
  const riskLevel = searchParams.get('riskLevel') as 'high' | 'medium' | null;

  const filters: Record<string, unknown> = {};
  if (isHandled !== null) filters.isHandled = isHandled === 'true';
  if (riskLevel) filters.riskLevel = riskLevel;

  const warnings = await homeSchoolRepository.getWarnings(filters);

  return NextResponse.json(success(warnings, 'database'));
}

// POST: 处理预警
export async function POST(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (!authResult.success || !authResult.user) {
    return NextResponse.json(error('请先登录', ErrorCode.UNAUTHORIZED), { status: 401 });
  }

  try {
    const body = await request.json();
    const { warningId, handleNote } = body;

    if (!warningId) {
      return NextResponse.json(error('缺少预警ID', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    const handlerId = authResult.user.id || '';
    const handlerName = authResult.user.name || '';

    await homeSchoolRepository.handleWarning(warningId, handlerId, handlerName, handleNote || '');

    return NextResponse.json(success(null, 'database'));
  } catch (err) {
    console.error('[HomeSchool Warnings API] POST error:', err);
    return NextResponse.json(error('处理失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}
