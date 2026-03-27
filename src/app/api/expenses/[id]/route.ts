/**
 * 费用报销详情API路由
 * 
 * 数据源：Supabase 数据库（唯一数据源）
 * v3.0: 移除Mock依赖，数据库失败时返回错误响应
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { success, error, ErrorCode } from '@/lib/api';
import type { ExpenseReimbursement, ExpenseItem } from '@/types';

/**
 * GET - 获取单个报销详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getSupabaseClient();
    
    const { data, error: dbError } = await client
      .from('expense_reimbursements')
      .select(`
        *,
        items:expense_items(*)
      `)
      .eq('id', id)
      .single();

    if (dbError || !data) {
      return NextResponse.json(
        error('报销申请不存在', ErrorCode.NOT_FOUND),
        { status: 404 }
      );
    }

    return NextResponse.json(success(data, 'database'));
  } catch (err) {
    console.error('Get expense error:', err);
    return NextResponse.json(
      error('获取报销详情失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

/**
 * PUT - 更新报销申请
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const client = getSupabaseClient();
    
    // 检查是否存在且为草稿状态
    const { data: existing, error: fetchError } = await client
      .from('expense_reimbursements')
      .select('id, status')
      .eq('id', id)
      .single();
    
    if (fetchError || !existing) {
      return NextResponse.json(
        error('报销申请不存在', ErrorCode.NOT_FOUND),
        { status: 404 }
      );
    }
    
    if (existing.status !== 'draft') {
      return NextResponse.json(
        error('只有草稿状态的报销申请才能修改', ErrorCode.VALIDATION_ERROR),
        { status: 400 }
      );
    }

    // 计算总金额
    let totalAmount = body.totalAmount;
    if (body.items && Array.isArray(body.items)) {
      totalAmount = body.items.reduce((sum: number, item: ExpenseItem) => sum + item.amount, 0);
    }

    // 更新报销申请
    const { data, error: dbError } = await client
      .from('expense_reimbursements')
      .update({
        ...body,
        total_amount: totalAmount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (dbError) {
      return NextResponse.json(
        error('更新报销申请失败: ' + dbError.message, ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }

    return NextResponse.json(success(data, 'database'));
  } catch (err) {
    console.error('Update expense error:', err);
    return NextResponse.json(
      error('更新报销申请失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

/**
 * DELETE - 删除报销申请
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getSupabaseClient();
    
    // 检查是否存在且状态允许删除
    const { data: existing, error: fetchError } = await client
      .from('expense_reimbursements')
      .select('id, status')
      .eq('id', id)
      .single();
    
    if (fetchError || !existing) {
      return NextResponse.json(
        error('报销申请不存在', ErrorCode.NOT_FOUND),
        { status: 404 }
      );
    }
    
    if (existing.status !== 'draft' && existing.status !== 'rejected') {
      return NextResponse.json(
        error('该状态的报销申请不能删除', ErrorCode.VALIDATION_ERROR),
        { status: 400 }
      );
    }

    // 删除报销申请（级联删除明细）
    const { error: dbError } = await client
      .from('expense_reimbursements')
      .delete()
      .eq('id', id);

    if (dbError) {
      return NextResponse.json(
        error('删除报销申请失败: ' + dbError.message, ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }

    return NextResponse.json(success(null, 'database'));
  } catch (err) {
    console.error('Delete expense error:', err);
    return NextResponse.json(
      error('删除报销申请失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

/**
 * POST - 提交报销申请
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getSupabaseClient();
    
    // 检查是否存在且为草稿状态
    const { data: existing, error: fetchError } = await client
      .from('expense_reimbursements')
      .select('id, status')
      .eq('id', id)
      .single();
    
    if (fetchError || !existing) {
      return NextResponse.json(
        error('报销申请不存在', ErrorCode.NOT_FOUND),
        { status: 404 }
      );
    }
    
    if (existing.status !== 'draft') {
      return NextResponse.json(
        error('只有草稿状态的报销申请才能提交', ErrorCode.VALIDATION_ERROR),
        { status: 400 }
      );
    }

    // 更新状态为待审批
    const { data, error: dbError } = await client
      .from('expense_reimbursements')
      .update({
        status: 'pending',
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (dbError) {
      return NextResponse.json(
        error('提交报销申请失败: ' + dbError.message, ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }

    return NextResponse.json(success(data, 'database'));
  } catch (err) {
    console.error('Submit expense error:', err);
    return NextResponse.json(
      error('提交报销申请失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}
