import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 类型定义
interface RepairRequestRow {
  id: string;
  applicant_id: string;
  applicant_name: string;
  applicant_department: string | null;
  type: string;
  location: string;
  description: string | null;
  images: string[] | null;
  urgency: string;
  status: string;
  assigned_to: string | null;
  assigned_name: string | null;
  estimated_cost: number | null;
  actual_cost: number | null;
  started_at: string | null;
  completed_at: string | null;
  feedback: string | null;
  rating: number | null;
  created_at: string;
}

interface RepairUpdateData {
  status?: string;
  assigned_to?: string;
  assigned_name?: string;
  estimated_cost?: number;
  actual_cost?: number;
  started_at?: string;
  completed_at?: string;
  feedback?: string;
  rating?: number;
}

/**
 * GET - 获取维修申请列表
 * 查询参数：
 * - applicantId: 申请人ID
 * - status: 状态
 * - type: 维修类型
 * - urgency: 紧急程度
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const applicantId = searchParams.get('applicantId');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const urgency = searchParams.get('urgency');

    // 构建查询
    let query = client
      .from('repair_requests')
      .select('*')
      .order('created_at', { ascending: false });

    // 应用筛选条件
    if (applicantId) {
      query = query.eq('applicant_id', applicantId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (type) {
      query = query.eq('type', type);
    }

    if (urgency) {
      query = query.eq('urgency', urgency);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // 格式化返回数据
    const formattedData = (data || []).map((repair: RepairRequestRow) => ({
      id: repair.id,
      applicantId: repair.applicant_id,
      applicantName: repair.applicant_name,
      applicantDepartment: repair.applicant_department,
      type: repair.type,
      location: repair.location,
      description: repair.description,
      images: repair.images || [],
      urgency: repair.urgency,
      status: repair.status,
      assignedTo: repair.assigned_to,
      assignedName: repair.assigned_name,
      estimatedCost: repair.estimated_cost,
      actualCost: repair.actual_cost,
      startedAt: repair.started_at,
      completedAt: repair.completed_at,
      feedback: repair.feedback,
      rating: repair.rating,
      createdAt: repair.created_at,
    }));

    return NextResponse.json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error('Failed to fetch repair requests:', error);
    return NextResponse.json({
      success: false,
      error: '获取维修申请列表失败',
    }, { status: 500 });
  }
}

/**
 * POST - 创建维修申请
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const {
      applicantId,
      applicantName,
      applicantDepartment,
      type,
      location,
      description,
      images,
      urgency,
    } = body;

    const { data, error } = await client
      .from('repair_requests')
      .insert({
        applicant_id: applicantId,
        applicant_name: applicantName,
        applicant_department: applicantDepartment,
        type,
        location,
        description,
        images: images || [],
        urgency: urgency || 'normal',
        status: 'pending',
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
    console.error('Failed to create repair request:', error);
    return NextResponse.json({
      success: false,
      error: '创建维修申请失败',
    }, { status: 500 });
  }
}

/**
 * PUT - 更新维修申请状态
 */
export async function PUT(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const { id, ...updates } = body;

    const updateData: RepairUpdateData = {};
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.assignedTo !== undefined) updateData.assigned_to = updates.assignedTo;
    if (updates.assignedName !== undefined) updateData.assigned_name = updates.assignedName;
    if (updates.estimatedCost !== undefined) updateData.estimated_cost = updates.estimatedCost;
    if (updates.actualCost !== undefined) updateData.actual_cost = updates.actualCost;
    if (updates.startedAt !== undefined) updateData.started_at = updates.startedAt;
    if (updates.completedAt !== undefined) updateData.completed_at = updates.completedAt;
    if (updates.feedback !== undefined) updateData.feedback = updates.feedback;
    if (updates.rating !== undefined) updateData.rating = updates.rating;

    const { data, error } = await client
      .from('repair_requests')
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
    console.error('Failed to update repair request:', error);
    return NextResponse.json({
      success: false,
      error: '更新维修申请失败',
    }, { status: 500 });
  }
}
