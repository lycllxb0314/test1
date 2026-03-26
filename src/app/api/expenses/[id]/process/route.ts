/**
 * 费用报销财务处理API路由
 * 
 * 数据源：Supabase 数据库（唯一数据源）
 * v3.0: 移除Mock依赖，数据库失败时返回错误响应
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { success, error, ErrorCode } from '@/lib/api-route-utils';

/**
 * POST - 财务处理报销申请
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, paymentNo, processorId, processorName } = body;
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

    let updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (action === 'process') {
      // 开始处理
      if (expense.status !== 'approved') {
        return NextResponse.json(
          error('该报销申请不在已批准状态', ErrorCode.VALIDATION_ERROR),
          { status: 400 }
        );
      }
      updateData = {
        ...updateData,
        status: 'processing',
        finance_handler_id: processorId,
        finance_handler_name: processorName,
      };
    } else if (action === 'complete') {
      // 完成处理
      if (expense.status !== 'processing') {
        return NextResponse.json(
          error('该报销申请不在处理中状态', ErrorCode.VALIDATION_ERROR),
          { status: 400 }
        );
      }
      updateData = {
        ...updateData,
        status: 'completed',
        payment_no: paymentNo,
        payment_date: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      };
    } else {
      return NextResponse.json(
        error('无效的操作', ErrorCode.VALIDATION_ERROR),
        { status: 400 }
      );
    }

    // 更新报销申请
    const { data, error: dbError } = await client
      .from('expense_reimbursements')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (dbError) {
      return NextResponse.json(
        error('处理失败: ' + dbError.message, ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }

    return NextResponse.json(success(data, 'database'));
  } catch (err) {
    console.error('Process expense error:', err);
    return NextResponse.json(
      error('处理失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}
