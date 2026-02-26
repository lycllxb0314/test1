import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 获取工作流实例列表
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const applicantId = searchParams.get('applicantId');
    const approverId = searchParams.get('approverId');
    
    let query = client
      .from('workflow_instances')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (type) {
      query = query.eq('type', type);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (applicantId) {
      query = query.eq('applicant_id', applicantId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
      }, { status: 500 });
    }
    
    // 如果查询待审批的，需要根据当前步骤筛选
    let result = data || [];
    if (approverId && data) {
      result = data.filter(instance => {
        const currentStepData = instance.steps[instance.current_step];
        if (!currentStepData) return false;
        return currentStepData.approverId === approverId || 
               currentStepData.approverRole === approverId;
      });
    }
    
    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Failed to fetch workflow instances:', error);
    return NextResponse.json({
      success: false,
      error: '获取工作流实例失败',
    }, { status: 500 });
  }
}

// 创建工作流实例（提交申请）
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    const { type, applicantId, applicantName, applicantRole, title, content } = body;
    
    if (!type || !applicantId || !title || !content) {
      return NextResponse.json({
        success: false,
        error: '缺少必要参数',
      }, { status: 400 });
    }
    
    // 获取当前激活的流程配置
    const { data: config, error: configError } = await client
      .from('workflow_configs')
      .select('*')
      .eq('type', type)
      .eq('is_active', true)
      .single();
    
    if (configError || !config) {
      return NextResponse.json({
        success: false,
        error: '未找到激活的审批流程配置',
      }, { status: 400 });
    }
    
    // 初始化步骤状态
    const steps = config.steps.map((step: any) => ({
      id: step.id,
      step: step.step,
      name: step.name,
      approverType: step.approverType,
      approverRole: step.approverRole,
      approverId: step.approverId,
      approverName: step.approverName,
      status: 'pending',
      comment: null,
      approvedAt: null,
    }));
    
    // 创建工作流实例
    const { data: instance, error: instanceError } = await client
      .from('workflow_instances')
      .insert({
        type,
        config_id: config.id,
        applicant_id: applicantId,
        applicant_name: applicantName,
        applicant_role: applicantRole,
        title,
        content,
        status: 'pending',
        current_step: 0,
        steps,
      })
      .select()
      .single();
    
    if (instanceError) {
      return NextResponse.json({
        success: false,
        error: instanceError.message,
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data: instance,
      message: '申请已提交',
    });
  } catch (error) {
    console.error('Failed to create workflow instance:', error);
    return NextResponse.json({
      success: false,
      error: '创建工作流实例失败',
    }, { status: 500 });
  }
}

// 审批操作
export async function PUT(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    const { instanceId, action, comment, approverId, approverName, approverRole } = body;
    
    if (!instanceId || !action || !approverId) {
      return NextResponse.json({
        success: false,
        error: '缺少必要参数',
      }, { status: 400 });
    }
    
    // 获取当前实例
    const { data: instance, error: fetchError } = await client
      .from('workflow_instances')
      .select('*')
      .eq('id', instanceId)
      .single();
    
    if (fetchError || !instance) {
      return NextResponse.json({
        success: false,
        error: '未找到申请记录',
      }, { status: 404 });
    }
    
    const steps = [...instance.steps];
    const currentStep = instance.current_step;
    const currentStepData = steps[currentStep];
    
    // 验证审批人
    if (currentStepData.approverId !== approverId && 
        currentStepData.approverRole !== approverRole) {
      return NextResponse.json({
        success: false,
        error: '您不是当前步骤的审批人',
      }, { status: 403 });
    }
    
    // 更新当前步骤状态
    steps[currentStep] = {
      ...currentStepData,
      status: action === 'approve' ? 'approved' : 'rejected',
      comment,
      approvedAt: new Date().toISOString(),
    };
    
    let newStatus = instance.status;
    let newCurrentStep = currentStep;
    let completedAt = null;
    
    if (action === 'approve') {
      // 如果还有下一步
      if (currentStep < steps.length - 1) {
        newCurrentStep = currentStep + 1;
      } else {
        // 全部通过
        newStatus = 'approved';
        completedAt = new Date().toISOString();
      }
    } else if (action === 'reject') {
      newStatus = 'rejected';
      completedAt = new Date().toISOString();
    }
    
    // 更新实例
    const { data: updated, error: updateError } = await client
      .from('workflow_instances')
      .update({
        status: newStatus,
        current_step: newCurrentStep,
        steps,
        completed_at: completedAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', instanceId)
      .select()
      .single();
    
    if (updateError) {
      return NextResponse.json({
        success: false,
        error: updateError.message,
      }, { status: 500 });
    }
    
    // 记录审批历史
    await client
      .from('approval_records')
      .insert({
        instance_id: instanceId,
        workflow_type: instance.type,
        step_id: currentStepData.id,
        step_name: currentStepData.name,
        approver_id: approverId,
        approver_name: approverName,
        approver_role: approverRole,
        action,
        comment,
      });
    
    return NextResponse.json({
      success: true,
      data: updated,
      message: action === 'approve' ? '已通过' : '已拒绝',
    });
  } catch (error) {
    console.error('Failed to approve workflow:', error);
    return NextResponse.json({
      success: false,
      error: '审批操作失败',
    }, { status: 500 });
  }
}
