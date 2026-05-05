/**
 * 设备管理 API - 单个设备操作
 * GET: 获取设备详情
 * PUT: 更新设备
 * DELETE: 删除设备
 */

import { NextRequest, NextResponse } from 'next/server';
import { success, error, ErrorCode } from '@/lib/api';
import { deviceService } from '@/services/device.service';
import { protectedRoute } from '@/lib/auth';

export const GET = protectedRoute(async (request, { params }) => {
  try {
    const resolvedParams = await params;
    const id = resolvedParams?.id;

    if (!id) {
      return NextResponse.json(error('缺少设备ID', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    const result = await deviceService.getDevice(id);

    if (!result.success) {
      return NextResponse.json(error(result.error || '设备不存在', ErrorCode.NOT_FOUND), { status: 404 });
    }

    return NextResponse.json(success(result.data, 'database'));
  } catch (err) {
    console.error('[Device API] GET error:', err);
    return NextResponse.json(error('获取设备详情失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

export const PUT = protectedRoute(async (request, { params }) => {
  try {
    const resolvedParams = await params;
    const id = resolvedParams?.id;

    if (!id) {
      return NextResponse.json(error('缺少设备ID', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    const body = await request.json();

    const result = await deviceService.updateDevice(id, body);

    if (!result.success) {
      return NextResponse.json(error(result.error || '更新设备失败', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    return NextResponse.json(success(result.data, 'database'));
  } catch (err) {
    console.error('[Device API] PUT error:', err);
    return NextResponse.json(error('更新设备失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

export const DELETE = protectedRoute(async (request, { params }) => {
  try {
    const resolvedParams = await params;
    const id = resolvedParams?.id;

    if (!id) {
      return NextResponse.json(error('缺少设备ID', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    const result = await deviceService.deleteDevice(id);

    if (!result.success) {
      return NextResponse.json(error(result.error || '删除设备失败', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    return NextResponse.json(success(null, 'database'));
  } catch (err) {
    console.error('[Device API] DELETE error:', err);
    return NextResponse.json(error('删除设备失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
