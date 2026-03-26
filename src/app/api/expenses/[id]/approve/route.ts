/**
 * 费用报销审批API路由
 * 
 * 数据源：Supabase 数据库（唯一数据源）
 * v3.0: 移除Mock依赖，数据库失败时返回错误响应
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { success, error, ErrorCode } from '@/lib/api-route-utils';

/**
 * POST - 审批报销申请
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { approved, comment, approverId, approverName } = body;
    const client = getSupabaseClient();
    
    // 获取报销申请
    const { data: expense, error: fetchError } = await client
      .from('expense_reimbursements')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError || !expense) {
      return NextResponse.json(
        error('报销申请不存在', ErrorCode.NOT_FOUND),
        { status: 404 }
      );
    }
    
    if (expense.status !== 'pending') {
      return NextResponse.json(
        error('该报销申请不在待审批状态', ErrorCode.VALIDATION_ERROR),
        { status: 400 }
      );
    }

    let newStatus = expense.status;
    let newCurrentStep = expense.current_step;

    if (approved) {
      // 移动到下一步
      newCurrentStep = (expense.current_step || 0) + 1;
      
      // 检查是否完成所有审批步骤
      const totalSteps = expense.approval_flow?.length || 2;
      if (newCurrentStep >= totalSteps) {
        newStatus = 'approved';
      }
    } else {
      newStatus = 'rejected';
    }

    // 更新报销申请
    const { data, error: dbError } = await client
      .from('expense_reimbursements')
      .update({
        status: newStatus,
        current_step: newCurrentStep,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (dbError) {
      return NextResponse.json(
        error('审批失败: ' + dbError.message, ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }

    // 添加审批记录
    await client
      .from('approval_records')
      .insert({
        workflow_id: id,
        workflow_type: 'expense',
        node_id: `step-${expense.current_step}`,
        node_name: `审批节点${expense.current_step + 1}`,
        approver_id: approverId || 'unknown',
        approver_name: approverName || '审批人',
        action: approved ? 'approve' : 'reject',
        comment: comment,
        created_at: new Date().toISOString(),
      });

    return NextResponse.json(success(data, 'database'));
  } catch (err) {
    console.error('Approve expense error:', err);
    return NextResponse.json(
      error('审批失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}
