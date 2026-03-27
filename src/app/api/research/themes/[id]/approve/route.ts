/**
 * 教研主题审核 API
 * 
 * 功能：
 * - POST: 提交审核
 * - PUT: 审核通过/驳回
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getUserFromSession } from '@/lib/auth/session';
import { success, error, ErrorCode } from '@/lib/api';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST - 提交审核
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = getSupabaseClient();
    const user = await getUserFromSession(request);
    
    if (!user) {
      return NextResponse.json(error('未登录', ErrorCode.UNAUTHORIZED), { status: 401 });
    }
    
    // 检查主题状态
    const { data: theme, error: fetchError } = await supabase
      .from('research_themes')
      .select('id, status, title')
      .eq('id', id)
      .single();
    
    if (fetchError || !theme) {
      return NextResponse.json(error('教研主题不存在', ErrorCode.NOT_FOUND), { status: 404 });
    }
    
    if (theme.status !== 'draft') {
      return NextResponse.json(
        error('只有草稿状态的主题可以提交审核', ErrorCode.VALIDATION_ERROR),
        { status: 400 }
      );
    }
    
    // 更新状态为待审核
    const { error: updateError } = await supabase
      .from('research_themes')
      .update({
        status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    
    if (updateError) {
      console.error('提交审核失败:', updateError);
      return NextResponse.json(error('提交审核失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: '已提交审核',
    });
  } catch (err) {
    console.error('提交审核API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}

/**
 * PUT - 审核通过/驳回
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
    
    // 验证参数
    if (body.approved === undefined) {
      return NextResponse.json(error('缺少审核结果', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    // 检查主题状态
    const { data: theme, error: fetchError } = await supabase
      .from('research_themes')
      .select('id, status')
      .eq('id', id)
      .single();
    
    if (fetchError || !theme) {
      return NextResponse.json(error('教研主题不存在', ErrorCode.NOT_FOUND), { status: 404 });
    }
    
    if (theme.status !== 'pending') {
      return NextResponse.json(
        error('只有待审核状态的主题可以审核', ErrorCode.VALIDATION_ERROR),
        { status: 400 }
      );
    }
    
    // 更新审核结果
    const newStatus = body.approved ? 'approved' : 'draft';
    const updateData: Record<string, unknown> = {
      status: newStatus,
      approver_id: user.id,
      approver_name: user.name,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    const { error: updateError } = await supabase
      .from('research_themes')
      .update(updateData)
      .eq('id', id);
    
    if (updateError) {
      console.error('审核失败:', updateError);
      return NextResponse.json(error('审核失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: body.approved ? '审核通过' : '审核驳回',
    });
  } catch (err) {
    console.error('审核API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}
