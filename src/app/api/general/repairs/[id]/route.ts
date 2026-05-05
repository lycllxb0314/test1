import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute } from '@/lib/auth';
import { success, error, ErrorCode } from '@/lib/api';
import { repairService } from '@/services/repair.service';
import type { RepairStatus } from '@/types/general';

export const GET = protectedRoute(async (request, { params }) => {
  try {
    const resolvedParams = await params;
    const id = resolvedParams?.id;

    if (!id) {
      return NextResponse.json(error('缺少报修ID', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    const result = await repairService.getRepair(id);

    if (!result.success) {
      return NextResponse.json(error(result.error || '报修记录不存在', ErrorCode.NOT_FOUND), { status: 404 });
    }

    return NextResponse.json(success(result.data, 'database'));
  } catch (err) {
    console.error('[Repair API] GET error:', err);
    return NextResponse.json(error('获取报修详情失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

export const PUT = protectedRoute(async (request, { params }) => {
  try {
    const resolvedParams = await params;
    const id = resolvedParams?.id;

    if (!id) {
      return NextResponse.json(error('缺少报修ID', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    const body = await request.json();
    const { status, assigneeId, assigneeName, estimatedCost, actualCost, scheduledDate, note } = body;

    // 如果是更新状态
    if (status) {
      const result = await repairService.updateStatus(id, status as RepairStatus, {
        assigneeId,
        assigneeName,
        estimatedCost,
        actualCost,
        scheduledDate,
        note,
      });

      if (!result.success) {
        return NextResponse.json(error(result.error || '更新状态失败', ErrorCode.BAD_REQUEST), { status: 400 });
      }

      return NextResponse.json(success(result.data, 'database'));
    }

    // 普通更新
    const result = await repairService.updateRepair(id, body);

    if (!result.success) {
      return NextResponse.json(error(result.error || '更新报修记录失败', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    return NextResponse.json(success(result.data, 'database'));
  } catch (err) {
    console.error('[Repair API] PUT error:', err);
    return NextResponse.json(error('更新报修记录失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

export const DELETE = protectedRoute(async (request, { params }) => {
  try {
    const resolvedParams = await params;
    const id = resolvedParams?.id;

    if (!id) {
      return NextResponse.json(error('缺少报修ID', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    const result = await repairService.deleteRepair(id);

    if (!result.success) {
      return NextResponse.json(error(result.error || '删除报修记录失败', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    return NextResponse.json(success(null, 'database'));
  } catch (err) {
    console.error('[Repair API] DELETE error:', err);
    return NextResponse.json(error('删除报修记录失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
