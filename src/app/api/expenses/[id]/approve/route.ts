import { NextRequest, NextResponse } from 'next/server';
import { mockExpenses } from '@/lib/expense-data';
import type { ExpenseReimbursement, ApprovalNodeRecord } from '@/types';

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

    const expenseIndex = mockExpenses.findIndex((e: ExpenseReimbursement) => e.id === id);
    if (expenseIndex === -1) {
      return NextResponse.json({
        success: false,
        error: '报销申请不存在',
      }, { status: 404 });
    }

    const expense = mockExpenses[expenseIndex];
    
    if (expense.status !== 'pending') {
      return NextResponse.json({
        success: false,
        error: '该报销申请不在待审批状态',
      }, { status: 400 });
    }

    // 更新状态
    if (approved) {
      // 更新当前审批节点状态
      const currentStep = expense.currentStep;
      if (expense.approvalFlow[currentStep]) {
        expense.approvalFlow[currentStep].status = 'approved';
        expense.approvalFlow[currentStep].approvedAt = new Date().toISOString();
      }

      // 添加审批记录
      const record: ApprovalNodeRecord = {
        id: `rec-${Date.now()}`,
        nodeId: expense.approvalFlow[currentStep]?.id || '',
        nodeName: expense.approvalFlow[currentStep]?.name || '',
        nodeOrder: currentStep,
        status: 'approved',
        approverId: approverId || 'unknown',
        approverName: approverName || '审批人',
        approverRole: 'subject_teacher',
        action: 'approve',
        comment: comment,
        actionAt: new Date().toISOString(),
      };
      expense.approvalRecords.push(record);

      // 移动到下一步
      const nextStep = currentStep + 1;
      if (nextStep >= expense.approvalFlow.length) {
        // 流程完成，进入财务处理阶段
        expense.status = 'approved';
        expense.currentStep = expense.approvalFlow.length - 1;
      } else {
        expense.currentStep = nextStep;
      }
    } else {
      // 拒绝
      const currentStep = expense.currentStep;
      if (expense.approvalFlow[currentStep]) {
        expense.approvalFlow[currentStep].status = 'rejected';
      }

      // 添加拒绝记录
      const record: ApprovalNodeRecord = {
        id: `rec-${Date.now()}`,
        nodeId: expense.approvalFlow[currentStep]?.id || '',
        nodeName: expense.approvalFlow[currentStep]?.name || '',
        nodeOrder: currentStep,
        status: 'rejected',
        approverId: approverId || 'unknown',
        approverName: approverName || '审批人',
        approverRole: 'subject_teacher',
        action: 'reject',
        comment: comment,
        actionAt: new Date().toISOString(),
      };
      expense.approvalRecords.push(record);

      expense.status = 'rejected';
    }

    expense.updatedAt = new Date().toISOString();

    return NextResponse.json({
      success: true,
      data: expense,
      source: 'mock',
    });
  } catch (error) {
    console.error('Approve expense error:', error);
    return NextResponse.json({
      success: false,
      error: '审批失败',
    }, { status: 500 });
  }
}
