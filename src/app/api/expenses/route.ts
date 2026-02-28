/**
 * 报销申请 API
 * 
 * 使用统一的路由处理模式、集中的Mock数据和认证保护
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { 
  MOCK_EXPENSES,
  getMockExpenses,
} from '@/lib/mock/general.mock';
import { 
  success, 
  error, 
  parseQueryParams, 
  createPagination,
  ErrorCode 
} from '@/lib/api-route-utils';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';
import type { ExpenseReimbursement, ExpenseItem } from '@/types';

/**
 * GET - 获取报销列表
 * 
 * 查询参数：
 * - status: 状态筛选
 * - category: 类别筛选
 * - applicantId: 申请人ID筛选
 * - department: 部门筛选
 * - page: 页码
 * - pageSize: 每页数量
 * 
 * 权限要求：总务模块查看权限
 */
const handleGetExpenses = async (request: NextRequest, { user }: ExtendedRouteContext) => {
  const params = parseQueryParams(request);
  
  try {
    const client = getSupabaseClient();
    
    // 构建查询
    let query = client
      .from('expenses')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });
    
    // 应用筛选
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
    
    // 分页
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    query = query.range(from, to);
    
    const { data, error: dbError, count } = await query;
    
    if (dbError) {
      console.log('Database query failed, using mock data:', dbError.message);
      
      // 使用Mock数据
      const mockData = getMockExpenses({
        status: params.status as string,
        category: params.category as string,
        applicantId: params.applicantId as string,
      });
      
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      
      return NextResponse.json({
        success: true,
        data: mockData.slice(start, end),
        pagination: createPagination(mockData.length, page, pageSize),
        source: 'mock',
      });
    }
    
    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: createPagination(count || 0, page, pageSize),
      source: 'database',
    });
  } catch (err) {
    console.error('Failed to fetch expenses:', err);
    
    // 使用Mock数据作为fallback
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const mockData = getMockExpenses({
      status: params.status as string,
      category: params.category as string,
      applicantId: params.applicantId as string,
    });
    
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    
    return NextResponse.json({
      success: true,
      data: mockData.slice(start, end),
      pagination: createPagination(mockData.length, page, pageSize),
      source: 'mock',
    });
  }
};

/**
 * POST - 创建报销申请
 * 
 * 权限要求：总务模块编辑权限
 */
const handleCreateExpense = async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const body = await request.json();
    const client = getSupabaseClient();
    
    // 生成报销单号
    const expenseNo = `BX${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${String(MOCK_EXPENSES.length + 1).padStart(3, '0')}`;
    
    // 计算总金额
    const totalAmount = body.items?.reduce((sum: number, item: ExpenseItem) => sum + item.amount, 0) || 0;
    
    const { data, error: dbError } = await client
      .from('expenses')
      .insert({
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
      console.error('Database insert error:', dbError);
      
      // 返回mock成功响应
      const newExpense: ExpenseReimbursement = {
        id: `exp_${Date.now()}`,
        expenseNo,
        title: body.title,
        applicantId: body.applicantId || user.id,
        applicantName: body.applicantName || user.name,
        applicantRole: body.applicantRole || user.role,
        department: body.department,
        category: body.category,
        items: body.items?.map((item: ExpenseItem, index: number) => ({
          ...item,
          id: `item_${Date.now()}_${index}`,
        })) || [],
        totalAmount,
        description: body.description || '',
        status: 'draft',
        approvalFlow: [
          { id: 'node_1', name: '部门负责人', approverRole: 'academic_director', status: 'pending' },
          { id: 'node_2', name: '总务主任', approverRole: 'general_director', status: 'pending' },
        ],
        currentStep: 0,
        approvalRecords: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      return NextResponse.json({
        success: true,
        data: newExpense,
        source: 'mock',
      });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        expenseNo: data.expense_no,
        title: data.title,
        applicantId: data.applicant_id,
        applicantName: data.applicant_name,
        status: data.status,
      },
      source: 'database',
    });
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
  optional: true, // 列表查询允许未登录访问（用于演示）
});

export const POST = protectedRoute(handleCreateExpense, { 
  module: 'general', 
  permission: 'edit' 
});
