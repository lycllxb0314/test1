/**
 * 审批实例 API - 重构版
 * 
 * 使用 Service 层和 Repository 层，实现关注点分离
 * 
 * GET: 获取审批列表（我发起的/待我审批的/我已处理的）
 * POST: 提交新的审批申请
 */

import { NextRequest } from 'next/server';
import { getUserFromSession } from '@/lib/auth/session';
import { ok, fail, serverError, paginated, unauthorized } from '@/lib/api';
import { approvalService, SubmitApprovalParams } from '@/services';
import { ApprovalInstance } from '@/types/approval';

// ==================== 辅助函数（保持原有逻辑）====================

/** 业务类型到部门的映射 */
function getBusinessDepartment(businessType: string, applicantDepartment?: string): string | null {
  const businessDeptMap: Record<string, string> = {
    'room_booking': 'academic',
    'activity_approval': 'moral',
    'repair_approval': 'general',
    'asset_approval': 'general',
  };
  
  if (businessDeptMap[businessType]) {
    return businessDeptMap[businessType];
  }
  
  if (businessType === 'announcement' || businessType === 'news') {
    if (applicantDepartment?.includes('教务')) return 'academic';
    if (applicantDepartment?.includes('德育')) return 'moral';
    if (applicantDepartment?.includes('总务')) return 'general';
  }
  
  if (businessType === 'leave_request') {
    return null;
  }
  
  return null;
}

// ==================== API 处理器 ====================

/**
 * GET /api/approvals
 * 
 * 查询参数：
 * - type: 'my' (我发起的) | 'pending' (待我审批的) | 'processed' (我已处理的)
 * - status: 筛选状态
 * - page: 页码
 * - pageSize: 每页数量
 * - department: 部门过滤
 */
export async function GET(request: NextRequest) {
  try {
    // 1. 身份验证
    const user = await getUserFromSession(request);
    if (!user) {
      return unauthorized('未登录，请先登录');
    }

    // 2. 解析查询参数
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'pending';
    const status = searchParams.get('status') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const department = searchParams.get('department') || undefined;

    // 3. 根据类型调用对应的 Service 方法
    let result;
    
    switch (type) {
      case 'my':
        // 我发起的审批
        result = await approvalService.getMyApplications(user.id, {
          status: status || undefined,
          page,
          pageSize,
        });
        break;
        
      case 'pending':
        // 待我审批的
        result = await approvalService.getPendingApprovals(user.id, {
          page,
          pageSize,
        });
        break;
        
      case 'processed':
        // 我已处理的
        result = await approvalService.getProcessedApprovals(user.id, {
          page,
          pageSize,
        });
        break;
        
      default:
        return fail(`无效的查询类型: ${type}`, 'INVALID_TYPE' as any);
    }

    // 4. 处理部门过滤（可选）
    let data = result.data || [];
    if (department && type === 'pending') {
      data = data.filter((item: any) => {
        const itemDept = getBusinessDepartment(
          item.business_type,
          item.applicant_department
        );
        return itemDept === department;
      });
    }

    // 5. 返回结果
    if (!result.success) {
      return fail(result.error || '查询失败', 'QUERY_FAILED' as any);
    }

    return paginated(
      data,
      result.pagination?.total || 0,
      result.pagination?.page || 1,
      result.pagination?.pageSize || 10
    );
    
  } catch (error) {
    console.error('[Approvals API] GET error:', error);
    return serverError('获取审批列表失败');
  }
}

/**
 * POST /api/approvals
 * 
 * 提交新的审批申请
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 身份验证
    const user = await getUserFromSession(request);
    if (!user) {
      return unauthorized('未登录，请先登录');
    }

    // 2. 解析请求体
    const body = await request.json();
    
    // 3. 构建审批参数
    const params: SubmitApprovalParams = {
      flowId: body.flowId,
      flowName: body.flowName,
      businessType: body.businessType,
      businessId: body.businessId,
      title: body.title,
      applicantId: user.id,
      applicantName: (user as any).name || user.id,
      applicantDepartment: (user as any).department,
      nodes: body.nodes || [],
    };

    // 4. 调用 Service 提交审批
    const result = await approvalService.submitApproval(params);

    if (!result.success) {
      return fail(result.error || '提交失败', 'SUBMIT_FAILED' as any);
    }

    return ok(result.data, { message: '提交成功' });
    
  } catch (error) {
    console.error('[Approvals API] POST error:', error);
    return serverError('提交审批失败');
  }
}

/**
 * 对比原版和重构版：
 * 
 * 原版 (1136行):
 * - 直接操作数据库
 * - 业务逻辑混在路由中
 * - 数据映射散落各处
 * - 难以测试和维护
 * 
 * 重构版 (~100行):
 * - 使用 Service 层处理业务逻辑
 * - 路由只负责请求解析和响应格式化
 * - 业务逻辑可复用
 * - 易于测试和维护
 * - 关注点分离，代码更清晰
 */
