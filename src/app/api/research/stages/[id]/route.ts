/**
 * 教研阶段详情 API
 * 
 * 功能：
 * - GET: 获取教研阶段详情
 * - PUT: 更新教研阶段
 * - DELETE: 删除教研阶段
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getUserFromSession } from '@/lib/auth/session';
import { error, ErrorCode } from '@/lib/api';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET - 获取教研阶段详情
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = getSupabaseClient();
    
    const { data: stage, error: fetchError } = await supabase
      .from('research_stages')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError || !stage) {
      return NextResponse.json(error('教研阶段不存在', ErrorCode.NOT_FOUND), { status: 404 });
    }
    
    // 获取阶段下的活动
    const { data: activities } = await supabase
      .from('research_activities')
      .select('id, title, type, status, scheduled_at')
      .eq('stage_id', id)
      .order('scheduled_at', { ascending: true });
    
    return NextResponse.json({
      success: true,
      data: {
        ...stage,
        tasks: stage.tasks ? (typeof stage.tasks === 'string' ? JSON.parse(stage.tasks) : stage.tasks) : [],
        activities: activities || [],
      },
    });
  } catch (err) {
    console.error('获取教研阶段详情失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}

/**
 * PUT - 更新教研阶段
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = getSupabaseClient();
    const user = await getUserFromSession(request);
    
    if (!user) {
      return NextResponse.json(error('未登录', ErrorCode.UNAUTHORIZED), { status: 401 });
    }
    
    const body = await request.json();
    
    // 检查阶段是否存在
    const { data: existingStage, error: fetchError } = await supabase
      .from('research_stages')
      .select('id')
      .eq('id', id)
      .single();
    
    if (fetchError || !existingStage) {
      return NextResponse.json(error('教研阶段不存在', ErrorCode.NOT_FOUND), { status: 404 });
    }
    
    // 构建更新数据
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.orderNum !== undefined) updateData.order_num = body.orderNum;
    if (body.startDate !== undefined) updateData.start_date = body.startDate;
    if (body.endDate !== undefined) updateData.end_date = body.endDate;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.tasks !== undefined) updateData.tasks = body.tasks;
    if (body.responsibleIds !== undefined) updateData.responsible_ids = body.responsibleIds;
    
    const { data, error: updateError } = await supabase
      .from('research_stages')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (updateError) {
      console.error('更新教研阶段失败:', updateError);
      return NextResponse.json(error('更新教研阶段失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        ...data,
        tasks: data.tasks ? (typeof data.tasks === 'string' ? JSON.parse(data.tasks) : data.tasks) : [],
      },
    });
  } catch (err) {
    console.error('更新教研阶段API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}

/**
 * DELETE - 删除教研阶段
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = getSupabaseClient();
    const user = await getUserFromSession(request);
    
    if (!user) {
      return NextResponse.json(error('未登录', ErrorCode.UNAUTHORIZED), { status: 401 });
    }
    
    // 检查阶段下是否有活动
    const { data: activities } = await supabase
      .from('research_activities')
      .select('id')
      .eq('stage_id', id)
      .limit(1);
    
    if (activities && activities.length > 0) {
      return NextResponse.json(
        error('该阶段下有教研活动，无法删除', ErrorCode.VALIDATION_ERROR),
        { status: 400 }
      );
    }
    
    const { error: deleteError } = await supabase
      .from('research_stages')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      console.error('删除教研阶段失败:', deleteError);
      return NextResponse.json(error('删除教研阶段失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    return NextResponse.json({ success: true, message: '删除成功' });
  } catch (err) {
    console.error('删除教研阶段API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}
