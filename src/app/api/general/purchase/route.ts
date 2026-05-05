import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute } from '@/lib/auth/route-protection';
import { purchaseService } from '@/services/purchase.service';
import { success, error, ErrorCode } from '@/lib/api';

export const GET = protectedRoute(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || undefined;
  const status = searchParams.get('status') || undefined;
  const urgency = searchParams.get('urgency') || undefined;
  const applicantId = searchParams.get('applicantId') || undefined;

  const result = await purchaseService.getPurchases({
    type: type as 'office_supplies' | 'equipment' | 'maintenance' | 'other' | 'all' | undefined,
    status: status as any,
    urgency: urgency as any,
    applicantId,
  });

  if (!result.success) {
    return NextResponse.json(error(result.error || '获取采购列表失败', ErrorCode.NOT_FOUND), { status: 404 });
  }

  return NextResponse.json(success(result.data, 'database'));
});

export const POST = protectedRoute(async (request: NextRequest) => {
  const body = await request.json();
  const user = (request as any).user;

  if (!user) {
    return NextResponse.json(error('未授权', ErrorCode.UNAUTHORIZED), { status: 401 });
  }

  const result = await purchaseService.createPurchase({
    title: body.title,
    type: body.type,
    items: body.items,
    totalAmount: body.totalAmount,
    reason: body.reason,
    urgency: body.urgency,
    images: body.images,
    applicantId: user.id,
    applicantName: user.name,
    department: body.department,
    budgetSource: body.budgetSource,
  });

  if (!result.success) {
    return NextResponse.json(error(result.error || '创建采购申请失败', ErrorCode.BAD_REQUEST), { status: 400 });
  }

  return NextResponse.json(success(result.data, 'database'));
});
