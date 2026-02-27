import { NextRequest, NextResponse } from 'next/server';
import { mockExpenses } from '@/lib/expense-data';
import type { ExpenseReimbursement, ExpenseItem } from '@/types';

/**
 * GET - 获取报销列表
 * 查询参数：
 * - status: 状态筛选
 * - category: 类别筛选
 * - applicantId: 申请人ID筛选
 * - department: 部门筛选
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const applicantId = searchParams.get('applicantId');
    const department = searchParams.get('department');

    let filteredData = [...mockExpenses];

    // 状态筛选
    if (status && status !== 'all') {
      filteredData = filteredData.filter(e => e.status === status);
    }

    // 类别筛选
    if (category && category !== 'all') {
      filteredData = filteredData.filter(e => e.category === category);
    }

    // 申请人筛选
    if (applicantId) {
      filteredData = filteredData.filter(e => e.applicantId === applicantId);
    }

    // 部门筛选
    if (department) {
      filteredData = filteredData.filter(e => e.department === department);
    }

    return NextResponse.json({
      success: true,
      data: filteredData,
      source: 'mock',
    });
  } catch (error) {
    console.error('Get expenses error:', error);
    return NextResponse.json({
      success: false,
      error: '获取报销列表失败',
    }, { status: 500 });
  }
}

/**
 * POST - 创建报销申请
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 生成报销单号
    const expenseNo = `BX${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${String(mockExpenses.length + 1).padStart(3, '0')}`;
    
    const newExpense: ExpenseReimbursement = {
      id: `EXP-${Date.now()}`,
      expenseNo,
      title: body.title,
      applicantId: body.applicantId,
      applicantName: body.applicantName,
      applicantRole: body.applicantRole,
      department: body.department,
      phone: body.phone,
      category: body.category,
      items: body.items.map((item: ExpenseItem, index: number) => ({
        ...item,
        id: `item-${Date.now()}-${index}`,
      })),
      totalAmount: body.items.reduce((sum: number, item: ExpenseItem) => sum + item.amount, 0),
      description: body.description,
      attachments: body.attachments,
      status: 'draft',
      approvalFlow: [
        { id: 'node-1', name: '部门负责人', approverRole: 'academic_director', status: 'pending' },
        { id: 'node-2', name: '总务主任', approverRole: 'general_director', status: 'pending' },
      ],
      currentStep: 0,
      approvalRecords: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockExpenses.push(newExpense);

    return NextResponse.json({
      success: true,
      data: newExpense,
      source: 'mock',
    });
  } catch (error) {
    console.error('Create expense error:', error);
    return NextResponse.json({
      success: false,
      error: '创建报销申请失败',
    }, { status: 500 });
  }
}
