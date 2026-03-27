import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 类型定义
interface VisitorRow {
  id: string;
  name: string;
  phone: string | null;
  id_card: string | null;
  purpose: string;
  host_id: string;
  host_name: string;
  host_department: string | null;
  expected_arrival_time: string;
  actual_arrival_time: string | null;
  actual_leave_time: string | null;
  status: string;
  temperature: number | null;
  remark: string | null;
  created_at: string;
}

interface VisitorUpdateData {
  status?: string;
  approver_id?: string;
  approver_name?: string;
  approved_at?: string;
  actual_arrival_time?: string;
  actual_leave_time?: string;
  temperature?: number;
  remark?: string;
}

/**
 * GET - 获取访客列表
 * 查询参数：
 * - status: 状态
 * - startDate: 开始日期
 * - endDate: 结束日期
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let query = client
      .from('visitors')
      .select(`
        id,
        name,
        phone,
        id_card,
        purpose,
        host_id,
        host_name,
        host_department,
        expected_arrival_time,
        actual_arrival_time,
        actual_leave_time,
        status,
        temperature,
        remark,
        created_at
      `)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (startDate) {
      query = query.gte('expected_arrival_time', startDate);
    }

    if (endDate) {
      query = query.lte('expected_arrival_time', endDate);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const formattedData = (data || []).map((visitor: VisitorRow) => ({
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
    const client = getSupabaseClient();
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

    const { data, error } = await client
      .from('visitors')
      .insert({
        name,
        phone,
        id_card: idCard,
        purpose,
        host_id: hostId,
        host_name: hostName,
        host_department: hostDepartment,
        expected_arrival_time: expectedArrivalTime,
        status: 'pending',
        remark,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
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
    const client = getSupabaseClient();
    const body = await request.json();

    const { id, action, temperature, remark, approverId, approverName } = body;

    const updateData: VisitorUpdateData = {};

    switch (action) {
      case 'approve':
        updateData.status = 'approved';
        updateData.approver_id = approverId;
        updateData.approver_name = approverName;
        updateData.approved_at = new Date().toISOString();
        break;
      case 'reject':
        updateData.status = 'rejected';
        updateData.approver_id = approverId;
        updateData.approver_name = approverName;
        updateData.approved_at = new Date().toISOString();
        break;
      case 'checkin':
        updateData.status = 'visiting';
        updateData.actual_arrival_time = new Date().toISOString();
        if (temperature) updateData.temperature = temperature;
        break;
      case 'checkout':
        updateData.status = 'left';
        updateData.actual_leave_time = new Date().toISOString();
        break;
    }

    if (remark) updateData.remark = remark;

    const { data, error } = await client
      .from('visitors')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Failed to update visitor:', error);
    return NextResponse.json({
      success: false,
      error: '更新访客状态失败',
    }, { status: 500 });
  }
}
