/**
 * 报销申请 API
 * 
 * 数据源：Supabase 数据库（唯一数据源）
 * v3.0: 移除Mock fallback，数据库失败时返回错误响应
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { 
  success, 
  error, 
  parseQueryParams, 
  createPagination,
  ErrorCode 
} from '@/lib/api-route-utils';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';
import type { ExpenseItem } from '@/types';

/**
 * GET - 获取报销列表
 */
const handleGetExpenses = async (request: NextRequest, { user }: ExtendedRouteContext) => {
  const params = parseQueryParams(request);
  
  try {
    const client = getSupabaseClient();
    
    let query = client
      .from('expenses')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });
    
    if (params.status && params.status !== 'all') {
      query = query.eq('status', params.status);
    }
    if (params.category && params.category !== 'all') {
      query = query.eq('category', params.category);
    }
    if (params.applicantId) {
      query = query.eq('applicant_id', params.applicantId);
    }
    if (params.department) {
      query = query.eq('department', params.department);
    }
    
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    query = query.range(from, to);
    
    const { data, error: dbError, count } = await query;
    
    if (dbError) {
      return NextResponse.json(
        error('数据库查询失败', ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: createPagination(count || 0, page as number, pageSize as number),
    });
  } catch (err) {
    console.error('Failed to fetch expenses:', err);
    return NextResponse.json(
      error('获取报销列表失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
};

/**
 * POST - 创建报销申请
 */
const handleCreateExpense = async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const body = await request.json();
    const client = getSupabaseClient();
    
    const expenseNo = `BX${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${String(Date.now()).slice(-6)}`;
    
    const totalAmount = body.items?.reduce((sum: number, item: ExpenseItem) => sum + item.amount, 0) || 0;
    
    const { data, error: dbError } = await client
      .from('expenses')
      .insert({
        id: `exp_${Date.now()}`,
        expense_no: expenseNo,
        title: body.title,
        applicant_id: body.applicantId || user.id,
        applicant_name: body.applicantName || user.name,
        applicant_role: body.applicantRole || user.role,
        department: body.department,
        phone: body.phone,
        category: body.category,
        items: body.items,
        total_amount: totalAmount,
        description: body.description,
        attachments: body.attachments,
        status: 'draft',
        approval_flow: body.approvalFlow || [],
        current_step: 0,
        approval_records: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (dbError) {
      return NextResponse.json(
        error('创建报销申请失败: ' + dbError.message, ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }
    
    return NextResponse.json(success(data));
  } catch (err) {
    console.error('Failed to create expense:', err);
    return NextResponse.json(
      error('创建报销申请失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
};

// 导出受保护的路由处理器
export const GET = protectedRoute(handleGetExpenses, { 
  module: 'general', 
  permission: 'view',
  optional: true,
});

export const POST = protectedRoute(handleCreateExpense, { 
  module: 'general', 
  permission: 'edit' 
});
