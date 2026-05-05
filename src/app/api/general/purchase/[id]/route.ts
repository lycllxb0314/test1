import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute } from '@/lib/auth';
import { purchaseService } from '@/services/purchase.service';
import { success, error, ErrorCode } from '@/lib/api';

export const GET = protectedRoute(async (request, { params }) => {
  try {
    const resolvedParams = await params;
    const id = resolvedParams?.id;

    if (!id) {
      return NextResponse.json(error('缺少采购记录ID', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    const result = await purchaseService.getPurchase(id);

    if (!result.success) {
      return NextResponse.json(error(result.error || '采购记录不存在', ErrorCode.NOT_FOUND), { status: 404 });
    }

    return NextResponse.json(success(result.data, 'database'));
  } catch (err) {
    console.error('[Purchase API] GET error:', err);
    return NextResponse.json(error('获取采购记录失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

export const PUT = protectedRoute(async (request, { params }) => {
  try {
    const resolvedParams = await params;
    const id = resolvedParams?.id;

    if (!id) {
      return NextResponse.json(error('缺少采购记录ID', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    const body = await request.json();

    // 如果是状态更新
    if (body.status) {
      const result = await purchaseService.updateStatus(id, body.status, {
        approverId: body.approverId,
        approverName: body.approverName,
        approvedAmount: body.approvedAmount,
        supplier: body.supplier,
        orderDate: body.orderDate,
        receivedDate: body.receivedDate,
        note: body.note,
      });

      if (!result.success) {
        return NextResponse.json(error(result.error || '更新状态失败', ErrorCode.BAD_REQUEST), { status: 400 });
      }

      return NextResponse.json(success(result.data, 'database'));
    }

    // 普通更新
    const result = await purchaseService.updatePurchase(id, body);

    if (!result.success) {
      return NextResponse.json(error(result.error || '更新采购记录失败', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    return NextResponse.json(success(result.data, 'database'));
  } catch (err) {
    console.error('[Purchase API] PUT error:', err);
    return NextResponse.json(error('更新采购记录失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

export const DELETE = protectedRoute(async (request, { params }) => {
  try {
    const resolvedParams = await params;
    const id = resolvedParams?.id;

    if (!id) {
      return NextResponse.json(error('缺少采购记录ID', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    const result = await purchaseService.deletePurchase(id);

    if (!result.success) {
      return NextResponse.json(error(result.error || '删除采购记录失败', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    return NextResponse.json(success(null, 'database'));
  } catch (err) {
    console.error('[Purchase API] DELETE error:', err);
    return NextResponse.json(error('删除采购记录失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
