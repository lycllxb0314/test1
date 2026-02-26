import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { 
  WorkflowNode, 
  ConditionBranch, 
  ConditionRule, 
  NodeHistory,
  WorkflowConfig as WorkflowConfigType 
} from '@/types';

// 评估条件规则
function evaluateRule(rule: ConditionRule, formData: Record<string, any>): boolean {
  const fieldValue = formData[rule.field];
  const ruleValue = rule.value;
  
  switch (rule.operator) {
    case 'eq':
      return fieldValue === ruleValue;
    case 'ne':
      return fieldValue !== ruleValue;
    case 'gt':
      return Number(fieldValue) > Number(ruleValue);
    case 'gte':
      return Number(fieldValue) >= Number(ruleValue);
    case 'lt':
      return Number(fieldValue) < Number(ruleValue);
    case 'lte':
      return Number(fieldValue) <= Number(ruleValue);
    case 'in':
      if (Array.isArray(ruleValue)) {
        return ruleValue.includes(fieldValue);
      }
      return String(ruleValue).split(',').includes(String(fieldValue));
    case 'not_in':
      if (Array.isArray(ruleValue)) {
        return !ruleValue.includes(fieldValue);
      }
      return !String(ruleValue).split(',').includes(String(fieldValue));
    default:
      return false;
  }
}

// 评估条件分支
function evaluateBranch(branch: ConditionBranch, formData: Record<string, any>): boolean {
  const results = branch.rules.map(rule => evaluateRule(rule, formData));
  
  if (branch.conditionType === 'all') {
    return results.every(r => r);
  } else if (branch.conditionType === 'any') {
    return results.some(r => r);
  }
  return false;
}

// 获取下一个节点ID
function getNextNodeId(
  currentNode: WorkflowNode, 
  formData: Record<string, any>
): string | null {
  if (currentNode.type === 'condition') {
    // 评估条件分支
    for (const branch of currentNode.branches || []) {
      if (evaluateBranch(branch, formData)) {
        return branch.nextNodeId;
      }
    }
    // 返回默认分支
    return currentNode.defaultBranchId || null;
  } else if (currentNode.type === 'parallel') {
    // 并行节点暂不实现，返回第一个并行节点
    return currentNode.parallelNodes?.[0] || currentNode.nextNodeId || null;
  } else {
    return currentNode.nextNodeId || null;
  }
}

// 获取退回节点ID
function getReturnNodeId(
  currentNode: WorkflowNode,
  nodes: WorkflowNode[],
  nodeHistory: NodeHistory[],
  formData: Record<string, any>
): string | null {
  switch (currentNode.rejectAction) {
    case 'return_to_applicant':
      // 找到开始节点
      const startNode = nodes.find(n => n.type === 'start');
      return startNode?.nextNodeId || null;
    
    case 'return_to_previous':
      // 返回上一个审批节点
      const prevApprovalNode = [...nodeHistory].reverse()
        .find(h => h.status === 'approved' && h.nodeId !== currentNode.id);
      return prevApprovalNode?.nodeId || null;
    
    case 'return_to_specific':
      return currentNode.rejectReturnNodeId || null;
    
    case 'end_process':
      return null; // 直接结束
    
    default:
      return null;
  }
}

// 获取工作流实例列表
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const applicantId = searchParams.get('applicantId');
    const approverRole = searchParams.get('approverRole');
    
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
    
    // 如果查询待审批的，需要根据当前节点筛选
    let result = data || [];
    if (approverRole && data) {
      // 获取所有配置
      const configIds = [...new Set(data.map(d => d.config_id))];
      const { data: configs } = await client
        .from('workflow_configs')
        .select('*')
        .in('id', configIds);
      
      const configMap = new Map((configs || []).map(c => [c.id, c]));
      
      result = data.filter(instance => {
        const config = configMap.get(instance.config_id);
        if (!config) return false;
        
        const nodes = config.nodes || config.steps || [];
        const currentNode = nodes.find((n: WorkflowNode) => n.id === instance.current_node_id);
        
        if (!currentNode || currentNode.type !== 'approval') return false;
        
        // 检查审批人
        if (currentNode.approverType === 'role') {
          return currentNode.approverRole === approverRole;
        }
        // TODO: 检查指定人员
        
        return false;
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
    
    const nodes = config.nodes || config.steps || [];
    const startNode = nodes.find((n: WorkflowNode) => n.type === 'start');
    
    if (!startNode) {
      return NextResponse.json({
        success: false,
        error: '流程配置缺少开始节点',
      }, { status: 400 });
    }
    
    // 获取第一个实际节点（开始节点的下一个）
    const firstNodeId = getNextNodeId(startNode, content);
    const firstNode = nodes.find((n: WorkflowNode) => n.id === firstNodeId);
    
    // 初始化节点历史
    const nodeHistory: NodeHistory[] = [
      {
        nodeId: startNode.id,
        nodeName: startNode.name,
        status: 'approved',
        enteredAt: new Date().toISOString(),
        exitedAt: new Date().toISOString(),
      }
    ];
    
    if (firstNode) {
      nodeHistory.push({
        nodeId: firstNode.id,
        nodeName: firstNode.name,
        status: 'pending',
        enteredAt: new Date().toISOString(),
      });
    }
    
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
        current_node_id: firstNodeId,
        node_history: nodeHistory,
        current_step: 0, // 兼容旧版
        steps: nodes, // 兼容旧版
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
    const { instanceId, action, comment, approverId, approverName, approverRole, returnToNodeId } = body;
    
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
    
    // 获取流程配置
    const { data: config } = await client
      .from('workflow_configs')
      .select('*')
      .eq('id', instance.config_id)
      .single();
    
    const nodes = config?.nodes || config?.steps || [];
    const currentNodeId = instance.current_node_id;
    const currentNode = nodes.find((n: WorkflowNode) => n.id === currentNodeId);
    
    if (!currentNode) {
      return NextResponse.json({
        success: false,
        error: '当前节点不存在',
      }, { status: 400 });
    }
    
    // 验证审批人
    if (currentNode.type === 'approval') {
      if (currentNode.approverType === 'role' && currentNode.approverRole !== approverRole) {
        return NextResponse.json({
          success: false,
          error: '您不是当前步骤的审批人',
        }, { status: 403 });
      }
      // TODO: 验证指定人员
    }
    
    // 更新节点历史
    const nodeHistory: NodeHistory[] = instance.node_history || [];
    const currentHistoryIndex = nodeHistory.findIndex(h => h.nodeId === currentNodeId);
    
    let newStatus = instance.status;
    let newCurrentNodeId = currentNodeId;
    let completedAt = instance.completed_at;
    
    // 创建审批记录
    const approvalRecord = {
      instance_id: instanceId,
      workflow_type: instance.type,
      node_id: currentNodeId,
      node_name: currentNode.name,
      approver_id: approverId,
      approver_name: approverName,
      approver_role: approverRole,
      action,
      comment,
      return_to_node_id: null as string | null,
      created_at: new Date().toISOString(),
    };
    
    if (action === 'approve') {
      // 更新当前节点历史为已通过
      if (currentHistoryIndex >= 0) {
        nodeHistory[currentHistoryIndex] = {
          ...nodeHistory[currentHistoryIndex],
          status: 'approved',
          exitedAt: new Date().toISOString(),
          approverId,
          approverName,
          comment,
        };
      }
      
      // 获取下一个节点
      const nextNodeId = getNextNodeId(currentNode, instance.content);
      
      if (nextNodeId) {
        const nextNode = nodes.find((n: WorkflowNode) => n.id === nextNodeId);
        
        if (nextNode?.type === 'end') {
          // 流程结束
          newStatus = 'approved';
          newCurrentNodeId = nextNodeId;
          completedAt = new Date().toISOString();
          
          nodeHistory.push({
            nodeId: nextNode.id,
            nodeName: nextNode.name,
            status: 'approved',
            enteredAt: new Date().toISOString(),
            exitedAt: new Date().toISOString(),
          });
        } else {
          // 进入下一个节点
          newCurrentNodeId = nextNodeId;
          
          nodeHistory.push({
            nodeId: nextNode!.id,
            nodeName: nextNode!.name,
            status: 'pending',
            enteredAt: new Date().toISOString(),
          });
        }
      } else {
        // 没有下一个节点，流程结束
        newStatus = 'approved';
        completedAt = new Date().toISOString();
      }
    } else if (action === 'reject') {
      // 更新当前节点历史为已拒绝
      if (currentHistoryIndex >= 0) {
        nodeHistory[currentHistoryIndex] = {
          ...nodeHistory[currentHistoryIndex],
          status: 'rejected',
          exitedAt: new Date().toISOString(),
          approverId,
          approverName,
          comment,
        };
      }
      
      // 获取退回节点
      const returnNodeId = returnToNodeId || getReturnNodeId(currentNode, nodes, nodeHistory, instance.content);
      
      if (returnNodeId) {
        newStatus = 'returned';
        newCurrentNodeId = returnNodeId;
        
        const returnNode = nodes.find((n: WorkflowNode) => n.id === returnNodeId);
        
        // 添加退回节点历史
        nodeHistory.push({
          nodeId: returnNodeId,
          nodeName: returnNode?.name || '退回节点',
          status: 'pending',
          enteredAt: new Date().toISOString(),
        });
        
        approvalRecord.return_to_node_id = returnNodeId;
      } else {
        // 流程结束
        newStatus = 'rejected';
        completedAt = new Date().toISOString();
      }
    } else if (action === 'return') {
      // 主动退回（申请人修改后重新提交）
      const returnNodeId = returnToNodeId;
      
      if (returnNodeId) {
        newStatus = 'returned';
        newCurrentNodeId = returnNodeId;
        
        // 更新当前节点历史
        if (currentHistoryIndex >= 0) {
          nodeHistory[currentHistoryIndex].status = 'approved';
          nodeHistory[currentHistoryIndex].exitedAt = new Date().toISOString();
        }
        
        const returnNode = nodes.find((n: WorkflowNode) => n.id === returnNodeId);
        nodeHistory.push({
          nodeId: returnNodeId,
          nodeName: returnNode?.name || '退回节点',
          status: 'pending',
          enteredAt: new Date().toISOString(),
        });
        
        approvalRecord.return_to_node_id = returnNodeId;
      }
    }
    
    // 更新实例
    const { error: updateError } = await client
      .from('workflow_instances')
      .update({
        status: newStatus,
        current_node_id: newCurrentNodeId,
        node_history: nodeHistory,
        current_step: 0, // 兼容旧版
        completed_at: completedAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', instanceId);
    
    if (updateError) {
      return NextResponse.json({
        success: false,
        error: updateError.message,
      }, { status: 500 });
    }
    
    // 记录审批操作
    await client
      .from('approval_records')
      .insert(approvalRecord);
    
    return NextResponse.json({
      success: true,
      message: action === 'approve' ? '审批通过' : action === 'reject' ? '已拒绝' : '已退回',
      data: {
        newStatus,
        newCurrentNodeId,
        completedAt,
      },
    });
  } catch (error) {
    console.error('Failed to process approval:', error);
    return NextResponse.json({
      success: false,
      error: '审批操作失败',
    }, { status: 500 });
  }
}
