/**
 * 预警管理 API
 * 
 * GET: 获取预警列表或统计
 * POST: 处理预警
 */

import { NextRequest, NextResponse } from 'next/server';
import { success, error, getQueryParams } from '@/lib/api';
import { psychologyAlertService } from '@/services/psychology.service';
import type { AlertStatus } from '@/types/psychology';

export const runtime = 'nodejs';

/**
 * GET /api/psychology/alerts
 * 
 * 查询参数：
 * - action: 'list' | 'statistics' (默认 list)
 * - status?: string (预警状态过滤)
 * - limit?: number
 */
export async function GET(request: NextRequest) {
  try {
    const params = getQueryParams(request);
    const action = (params.filters.action as string) || 'list';

    if (action === 'statistics') {
      // 获取统计数据
      const result = await psychologyAlertService.getStatistics();
      
      if (!result.success) {
        return NextResponse.json(error(result.error || '获取统计失败'), { status: 400 });
      }

      return NextResponse.json(success(result.data));
    }

    // 获取预警列表
    const status = params.filters.status as AlertStatus | undefined;
    
    let result;
    if (status === 'pending') {
      result = await psychologyAlertService.getPendingAlerts(params.pageSize || 50);
    } else {
      result = await psychologyAlertService.getRecentAlerts(params.pageSize || 20);
    }

    if (!result.success) {
      return NextResponse.json(error(result.error || '获取预警列表失败'), { status: 400 });
    }

    return NextResponse.json(success(result.data));
  } catch (err) {
    console.error('[Alerts API] GET error:', err);
    return NextResponse.json(error('获取预警列表失败'), { status: 500 });
  }
}

/**
 * POST /api/psychology/alerts
 * 
 * 请求体：
 * - action: 'handle' (处理预警)
 * - alertId: string
 * - handlerId: string
 * - handlerName: string
 * - status: AlertStatus
 * - handleNotes?: string
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, alertId, handlerId, handlerName, status, handleNotes } = body;

    if (action === 'handle') {
      if (!alertId || !handlerId || !handlerName || !status) {
        return NextResponse.json(
          error('缺少必要参数'),
          { status: 400 }
        );
      }

      const result = await psychologyAlertService.handleAlert(alertId, {
        handlerId,
        handlerName,
        status,
        handleNotes,
      });

      if (!result.success) {
        return NextResponse.json(error(result.error || '处理预警失败'), { status: 400 });
      }

      return NextResponse.json(success(result.data));
    }

    return NextResponse.json(
      error('未知操作类型'),
      { status: 400 }
    );
  } catch (err) {
    console.error('[Alerts API] POST error:', err);
    return NextResponse.json(error('处理预警失败'), { status: 500 });
  }
}
