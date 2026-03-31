/**
 * 访客管理 API
 * 
 * GET: 获取访客列表
 * POST: 创建访客预约
 * PUT: 更新访客状态（审批/签到/签退）
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 */

import { NextRequest, NextResponse } from 'next/server';
import { visitorService } from '@/services/visitor.service';

/**
 * GET - 获取访客列表
 * 查询参数：
 * - status: 状态
 * - startDate: 开始日期
 * - endDate: 结束日期
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const result = await visitorService.getList({
      status: status || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || '获取访客列表失败',
      }, { status: 500 });
    }

    // 格式化数据
    const formattedData = (result.data || []).map(visitor => ({
      id: visitor.id,
      name: visitor.name,
      phone: visitor.phone,
      idCard: visitor.id_card,
      purpose: visitor.purpose,
      hostId: visitor.host_id,
      hostName: visitor.host_name,
      hostDepartment: visitor.host_department,
      expectedArrivalTime: visitor.expected_arrival_time,
      actualArrivalTime: visitor.actual_arrival_time,
      actualLeaveTime: visitor.actual_leave_time,
      status: visitor.status,
      temperature: visitor.temperature,
      remark: visitor.remark,
      createdAt: visitor.created_at,
    }));

    return NextResponse.json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error('Failed to fetch visitors:', error);
    return NextResponse.json({
      success: false,
      error: '获取访客列表失败',
    }, { status: 500 });
  }
}

/**
 * POST - 创建访客预约
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      name,
      phone,
      idCard,
      purpose,
      hostId,
      hostName,
      hostDepartment,
      expectedArrivalTime,
      remark,
    } = body;

    const result = await visitorService.create({
      name,
      phone,
      id_card: idCard,
      purpose,
      host_id: hostId,
      host_name: hostName,
      host_department: hostDepartment,
      expected_arrival_time: expectedArrivalTime,
      remark,
    });

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || '创建访客预约失败',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Failed to create visitor:', error);
    return NextResponse.json({
      success: false,
      error: '创建访客预约失败',
    }, { status: 500 });
  }
}

/**
 * PUT - 更新访客状态（审批/签到/签退）
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const { id, action, temperature, remark, approverId, approverName } = body;

    let result;

    switch (action) {
      case 'approve':
        result = await visitorService.approve(id, approverId, approverName);
        break;
      case 'reject':
        result = await visitorService.reject(id, approverId, approverName, remark);
        break;
      case 'checkin':
        result = await visitorService.checkin(id, temperature);
        break;
      case 'checkout':
        result = await visitorService.checkout(id);
        break;
      default:
        return NextResponse.json({
          success: false,
          error: '未知操作',
        }, { status: 400 });
    }

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || '更新访客状态失败',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Failed to update visitor:', error);
    return NextResponse.json({
      success: false,
      error: '更新访客状态失败',
    }, { status: 500 });
  }
}
