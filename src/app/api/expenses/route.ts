/**
 * 报销申请 API
 * 
 * 架构：API Route → Service → Repository
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 * - 使用统一认证中间件
 */

import { NextRequest, NextResponse } from 'next/server';
import { getService, SERVICE_IDENTIFIERS } from '@/lib/di';
import { withAuth } from '@/lib/auth/middleware';
import { paginated, fail, serverError, ok } from '@/lib/api';
import type { ExpenseService } from '@/services/expense.service';

/**
 * GET - 获取报销列表
 */
export const GET = withAuth(async (request: NextRequest) => {
  try {
    const expenseService = getService<ExpenseService>(SERVICE_IDENTIFIERS.ExpenseService);
    const { searchParams } = new URL(request.url);
    
    // 分页参数
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    
    // 筛选参数
    const classId = searchParams.get('classId') || undefined;
    const type = searchParams.get('type') || undefined;
    const status = searchParams.get('status') || undefined;
    const applicantId = searchParams.get('applicantId') || undefined;
    const department = searchParams.get('department') || undefined;
    
    // 调用 Service 层
    const result = await expenseService.getList({
      classId,
      type,
      status,
      applicantId,
      department,
      page,
      pageSize,
    });
    
    if (!result.success) {
      return fail(result.error || '获取报销列表失败');
    }
    
    // 转换数据格式（下划线转驼峰）
    const formattedData = (result.data || []).map(e => {
      const item = e as unknown as Record<string, unknown>;
      return {
        id: item.id,
        expenseNo: item.expense_no,
        title: item.title,
        type: item.type,
        classId: item.class_id,
        amount: item.amount,
        totalAmount: item.total_amount,
        description: item.description,
        applicantId: item.applicant_id,
        applicantName: item.applicant_name,
        department: item.department,
        phone: item.phone,
        category: item.category,
        items: item.items,
        attachments: item.attachments,
        status: item.status,
        approvalFlow: item.approval_flow,
        currentStep: item.current_step,
        approvalRecords: item.approval_records,
        approverId: item.approver_id,
        approverName: item.approver_name,
        approvalComment: item.approval_comment,
        approvedAt: item.approved_at,
        processorId: item.processor_id,
        processorName: item.processor_name,
        processNote: item.process_note,
        processedAt: item.processed_at,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      };
    });
    
    return paginated(formattedData, result.pagination?.total || 0, page, pageSize);
  } catch (error) {
    console.error('Failed to fetch expenses:', error);
    return serverError('获取报销列表失败');
  }
});

/**
 * POST - 创建报销申请
 */
export const POST = withAuth(async (request: NextRequest) => {
  try {
    const expenseService = getService<ExpenseService>(SERVICE_IDENTIFIERS.ExpenseService);
    const body = await request.json();
    
    if (!body.classId || !body.type || !body.amount) {
      return fail('缺少必填字段');
    }
    
    const result = await expenseService.create({
      classId: body.classId,
      type: body.type,
      amount: body.amount,
      description: body.description,
      applicantId: body.applicantId,
      applicantName: body.applicantName,
    });
    
    if (!result.success) {
      return fail(result.error || '创建报销申请失败');
    }
    
    return ok(result.data);
  } catch (error) {
    console.error('Failed to create expense:', error);
    return serverError('创建报销申请失败');
  }
});
