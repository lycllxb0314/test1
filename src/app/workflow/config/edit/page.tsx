'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Plus,
  Trash2,
  FileText,
  Wrench,
  ShoppingCart,
  User,
  GitBranch,
  ArrowRightLeft,
  Play,
  Square,
  Layers,
  Workflow,
  Sparkles,
  Save,
  Eye,
  Settings,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Clock,
  RotateCcw,
  CornerDownLeft,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { roleOptions } from '@/contexts/AuthContext';
import { 
  WorkflowConfig, 
  WorkflowNode, 
  NodeType, 
  ConditionBranch, 
  ConditionRule,
  RejectAction,
  WorkflowType,
  UserRole 
} from '@/types';

const workflowTypes = [
  { value: 'leave', label: '请假审批', icon: FileText, color: 'bg-blue-100 text-blue-600 border-blue-200' },
  { value: 'repair', label: '报修审批', icon: Wrench, color: 'bg-orange-100 text-orange-600 border-orange-200' },
  { value: 'purchase', label: '采购审批', icon: ShoppingCart, color: 'bg-green-100 text-green-600 border-green-200' },
];

const nodeTypeConfig: Record<NodeType, { label: string; icon: any; color: string; bgColor: string }> = {
  start: { label: '开始', icon: Play, color: 'text-white', bgColor: 'bg-emerald-500' },
  approval: { label: '审批', icon: User, color: 'text-white', bgColor: 'bg-blue-500' },
  condition: { label: '条件', icon: GitBranch, color: 'text-white', bgColor: 'bg-amber-500' },
  parallel: { label: '并行', icon: Layers, color: 'text-white', bgColor: 'bg-purple-500' },
  end: { label: '结束', icon: Square, color: 'text-white', bgColor: 'bg-gray-500' },
};

const rejectActions: { value: RejectAction; label: string; desc: string; icon: any }[] = [
  { value: 'return_to_applicant', label: '退回申请人', desc: '申请人修改后重新提交', icon: RotateCcw },
  { value: 'return_to_previous', label: '退回上一节点', desc: '退回到上一个审批节点', icon: CornerDownLeft },
  { value: 'return_to_specific', label: '退回指定节点', desc: '退回到指定的审批节点', icon: ArrowRightLeft },
  { value: 'end_process', label: '流程结束', desc: '直接结束流程，不可修改', icon: Square },
];

// 预设流程模板
const workflowTemplates: Record<string, Partial<WorkflowConfig>> = {
  leave: {
    name: '教师请假审批流程',
    description: '根据请假类型和天数，走不同的审批路径',
    nodes: [
      { id: 'start', type: 'start', name: '开始', nextNodeId: 'condition_type' },
      { 
        id: 'condition_type', 
        type: 'condition', 
        name: '判断请假类型',
        branches: [
          {
            id: 'branch_sick',
            name: '病假分支',
            conditionType: 'all',
            rules: [{ id: 'r1', field: 'type', operator: 'eq', value: '病假', label: '病假' }],
            nextNodeId: 'condition_sick_days',
          },
          {
            id: 'branch_personal',
            name: '事假分支',
            conditionType: 'all',
            rules: [{ id: 'r2', field: 'type', operator: 'eq', value: '事假', label: '事假' }],
            nextNodeId: 'condition_personal_days',
          },
          {
            id: 'branch_official',
            name: '公假分支',
            conditionType: 'all',
            rules: [{ id: 'r3', field: 'type', operator: 'eq', value: '公假', label: '公假' }],
            nextNodeId: 'approval_dean',
          },
        ],
        defaultBranchId: 'branch_personal',
      },
      {
        id: 'condition_sick_days',
        type: 'condition',
        name: '判断病假天数',
        branches: [
          {
            id: 'sick_short',
            name: '3天以内',
            conditionType: 'all',
            rules: [{ id: 's1', field: 'duration', operator: 'lte', value: 3, label: '≤3天' }],
            nextNodeId: 'approval_grade_head',
          },
          {
            id: 'sick_long',
            name: '3天以上',
            conditionType: 'all',
            rules: [{ id: 's2', field: 'duration', operator: 'gt', value: 3, label: '>3天' }],
            nextNodeId: 'approval_grade_head_2',
          },
        ],
        defaultBranchId: 'sick_short',
      },
      {
        id: 'condition_personal_days',
        type: 'condition',
        name: '判断事假天数',
        branches: [
          {
            id: 'personal_short',
            name: '1天以内',
            conditionType: 'all',
            rules: [{ id: 'p1', field: 'duration', operator: 'lte', value: 1, label: '≤1天' }],
            nextNodeId: 'approval_grade_head',
          },
          {
            id: 'personal_medium',
            name: '1-3天',
            conditionType: 'all',
            rules: [{ id: 'p2', field: 'duration', operator: 'lte', value: 3, label: '≤3天' }],
            nextNodeId: 'approval_grade_head_2',
          },
          {
            id: 'personal_long',
            name: '3天以上',
            conditionType: 'all',
            rules: [{ id: 'p3', field: 'duration', operator: 'gt', value: 3, label: '>3天' }],
            nextNodeId: 'approval_grade_head_3',
          },
        ],
        defaultBranchId: 'personal_short',
      },
      {
        id: 'approval_grade_head',
        type: 'approval',
        name: '年级组长审批',
        approverType: 'role',
        approverRole: 'head_teacher',
        rejectAction: 'return_to_applicant',
        nextNodeId: 'end',
      },
      {
        id: 'approval_grade_head_2',
        type: 'approval',
        name: '年级组长审批',
        approverType: 'role',
        approverRole: 'head_teacher',
        rejectAction: 'return_to_applicant',
        nextNodeId: 'approval_dean',
      },
      {
        id: 'approval_grade_head_3',
        type: 'approval',
        name: '年级组长审批',
        approverType: 'role',
        approverRole: 'head_teacher',
        rejectAction: 'return_to_applicant',
        nextNodeId: 'approval_dean_2',
      },
      {
        id: 'approval_dean',
        type: 'approval',
        name: '教务主任审批',
        approverType: 'role',
        approverRole: 'academic_director',
        rejectAction: 'return_to_previous',
        nextNodeId: 'end',
      },
      {
        id: 'approval_dean_2',
        type: 'approval',
        name: '教务主任审批',
        approverType: 'role',
        approverRole: 'academic_director',
        rejectAction: 'return_to_previous',
        nextNodeId: 'approval_vice',
      },
      {
        id: 'approval_vice',
        type: 'approval',
        name: '分管副校长审批',
        approverType: 'role',
        approverRole: 'vice_principal',
        rejectAction: 'return_to_previous',
        nextNodeId: 'end',
      },
      { id: 'end', type: 'end', name: '结束' },
    ],
    startNodeId: 'start',
    endNodeId: 'end',
  },
  repair: {
    name: '设施报修审批流程',
    description: '根据维修费用和紧急程度走不同审批路径',
    nodes: [
      { id: 'start', type: 'start', name: '开始', nextNodeId: 'condition_urgent' },
      {
        id: 'condition_urgent',
        type: 'condition',
        name: '判断紧急程度',
        branches: [
          {
            id: 'urgent',
            name: '紧急维修',
            conditionType: 'all',
            rules: [{ id: 'u1', field: 'priority', operator: 'eq', value: 'urgent', label: '紧急' }],
            nextNodeId: 'approval_general_fast',
          },
          {
            id: 'normal',
            name: '普通维修',
            conditionType: 'all',
            rules: [{ id: 'n1', field: 'priority', operator: 'ne', value: 'urgent', label: '非紧急' }],
            nextNodeId: 'condition_cost',
          },
        ],
        defaultBranchId: 'normal',
      },
      {
        id: 'condition_cost',
        type: 'condition',
        name: '判断维修费用',
        branches: [
          {
            id: 'low_cost',
            name: '500元以内',
            conditionType: 'all',
            rules: [{ id: 'c1', field: 'estimatedCost', operator: 'lte', value: 500, label: '≤500元' }],
            nextNodeId: 'approval_general',
          },
          {
            id: 'medium_cost',
            name: '500-2000元',
            conditionType: 'all',
            rules: [{ id: 'c2', field: 'estimatedCost', operator: 'lte', value: 2000, label: '≤2000元' }],
            nextNodeId: 'approval_general_2',
          },
          {
            id: 'high_cost',
            name: '2000元以上',
            conditionType: 'all',
            rules: [{ id: 'c3', field: 'estimatedCost', operator: 'gt', value: 2000, label: '>2000元' }],
            nextNodeId: 'approval_general_3',
          },
        ],
        defaultBranchId: 'low_cost',
      },
      {
        id: 'approval_general_fast',
        type: 'approval',
        name: '总务主任快速审批',
        approverType: 'role',
        approverRole: 'general_director',
        rejectAction: 'return_to_applicant',
        nextNodeId: 'end',
      },
      {
        id: 'approval_general',
        type: 'approval',
        name: '总务主任审批',
        approverType: 'role',
        approverRole: 'general_director',
        rejectAction: 'return_to_applicant',
        nextNodeId: 'end',
      },
      {
        id: 'approval_general_2',
        type: 'approval',
        name: '总务主任审批',
        approverType: 'role',
        approverRole: 'general_director',
        rejectAction: 'return_to_applicant',
        nextNodeId: 'approval_vice',
      },
      {
        id: 'approval_general_3',
        type: 'approval',
        name: '总务主任审批',
        approverType: 'role',
        approverRole: 'general_director',
        rejectAction: 'return_to_applicant',
        nextNodeId: 'approval_vice_2',
      },
      {
        id: 'approval_vice',
        type: 'approval',
        name: '分管副校长审批',
        approverType: 'role',
        approverRole: 'vice_principal',
        rejectAction: 'return_to_previous',
        nextNodeId: 'end',
      },
      {
        id: 'approval_vice_2',
        type: 'approval',
        name: '分管副校长审批',
        approverType: 'role',
        approverRole: 'vice_principal',
        rejectAction: 'return_to_previous',
        nextNodeId: 'approval_principal',
      },
      {
        id: 'approval_principal',
        type: 'approval',
        name: '校长审批',
        approverType: 'role',
        approverRole: 'principal',
        rejectAction: 'return_to_previous',
        nextNodeId: 'end',
      },
      { id: 'end', type: 'end', name: '结束' },
    ],
    startNodeId: 'start',
    endNodeId: 'end',
  },
  purchase: {
    name: '物资采购审批流程',
    description: '根据采购金额走不同审批路径',
    nodes: [
      { id: 'start', type: 'start', name: '开始', nextNodeId: 'condition_amount' },
      {
        id: 'condition_amount',
        type: 'condition',
        name: '判断采购金额',
        branches: [
          {
            id: 'small',
            name: '1000元以内',
            conditionType: 'all',
            rules: [{ id: 'a1', field: 'totalAmount', operator: 'lte', value: 1000, label: '≤1000元' }],
            nextNodeId: 'approval_director',
          },
          {
            id: 'medium',
            name: '1000-5000元',
            conditionType: 'all',
            rules: [{ id: 'a2', field: 'totalAmount', operator: 'lte', value: 5000, label: '≤5000元' }],
            nextNodeId: 'approval_director_2',
          },
          {
            id: 'large',
            name: '5000-20000元',
            conditionType: 'all',
            rules: [{ id: 'a3', field: 'totalAmount', operator: 'lte', value: 20000, label: '≤20000元' }],
            nextNodeId: 'approval_director_3',
          },
          {
            id: 'huge',
            name: '20000元以上',
            conditionType: 'all',
            rules: [{ id: 'a4', field: 'totalAmount', operator: 'gt', value: 20000, label: '>20000元' }],
            nextNodeId: 'approval_director_4',
          },
        ],
        defaultBranchId: 'small',
      },
      {
        id: 'approval_director',
        type: 'approval',
        name: '部门负责人审批',
        approverType: 'role',
        approverRole: 'general_director',
        rejectAction: 'return_to_applicant',
        nextNodeId: 'end',
      },
      {
        id: 'approval_director_2',
        type: 'approval',
        name: '部门负责人审批',
        approverType: 'role',
        approverRole: 'general_director',
        rejectAction: 'return_to_applicant',
        nextNodeId: 'approval_vice',
      },
      {
        id: 'approval_director_3',
        type: 'approval',
        name: '部门负责人审批',
        approverType: 'role',
        approverRole: 'general_director',
        rejectAction: 'return_to_applicant',
        nextNodeId: 'approval_vice_2',
      },
      {
        id: 'approval_director_4',
        type: 'approval',
        name: '部门负责人审批',
        approverType: 'role',
        approverRole: 'general_director',
        rejectAction: 'return_to_applicant',
        nextNodeId: 'approval_vice_3',
      },
      {
        id: 'approval_vice',
        type: 'approval',
        name: '分管副校长审批',
        approverType: 'role',
        approverRole: 'vice_principal',
        rejectAction: 'return_to_previous',
        nextNodeId: 'end',
      },
      {
        id: 'approval_vice_2',
        type: 'approval',
        name: '分管副校长审批',
        approverType: 'role',
        approverRole: 'vice_principal',
        rejectAction: 'return_to_previous',
        nextNodeId: 'approval_principal',
      },
      {
        id: 'approval_vice_3',
        type: 'approval',
        name: '分管副校长审批',
        approverType: 'role',
        approverRole: 'vice_principal',
        rejectAction: 'return_to_previous',
        nextNodeId: 'approval_principal_2',
      },
      {
        id: 'approval_principal',
        type: 'approval',
        name: '校长审批',
        approverType: 'role',
        approverRole: 'principal',
        rejectAction: 'return_to_previous',
        nextNodeId: 'end',
      },
      {
        id: 'approval_principal_2',
        type: 'approval',
        name: '校长审批',
        approverType: 'role',
        approverRole: 'principal',
        rejectAction: 'return_to_previous',
        nextNodeId: 'approval_secretary',
      },
      {
        id: 'approval_secretary',
        type: 'approval',
        name: '书记审批',
        approverType: 'role',
        approverRole: 'secretary',
        rejectAction: 'return_to_previous',
        nextNodeId: 'end',
      },
      { id: 'end', type: 'end', name: '结束' },
    ],
    startNodeId: 'start',
    endNodeId: 'end',
  },
};

export default function WorkflowEditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const configId = searchParams.get('id');
  const configType = searchParams.get('type');
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  
  const [formData, setFormData] = useState<Partial<WorkflowConfig>>({
    type: configType as WorkflowType || undefined,
    name: '',
    description: '',
    nodes: [],
  });

  // 加载已有配置
  useEffect(() => {
    if (configId) {
      setLoading(true);
      fetch(`/api/workflow/config?id=${configId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            const config = Array.isArray(data.data) ? data.data[0] : data.data;
            setFormData({
              id: config.id,
              type: config.type,
              name: config.name,
              description: config.description,
              nodes: config.nodes || [],
              startNodeId: config.startNodeId,
              endNodeId: config.endNodeId,
            });
          }
        })
        .finally(() => setLoading(false));
    } else if (configType && workflowTemplates[configType]) {
      // 新建时使用模板
      const template = workflowTemplates[configType];
      setFormData({
        type: configType as WorkflowType,
        ...template,
      });
    }
  }, [configId, configType]);

  // 使用模板
  const useTemplate = (type: string) => {
    const template = workflowTemplates[type];
    if (template) {
      setFormData({
        ...template,
        type: type as WorkflowType,
      });
    }
  };

  // 保存配置
  const handleSave = async () => {
    if (!formData.type || !formData.name) {
      alert('请填写流程名称');
      return;
    }
    
    const nodes = formData.nodes || [];
    const startNode = nodes.find(n => n.type === 'start');
    const endNode = nodes.find(n => n.type === 'end');
    
    if (!startNode || !endNode) {
      alert('流程必须包含开始和结束节点');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/workflow/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: formData.id,
          ...formData,
          startNodeId: startNode.id,
          endNodeId: endNode.id,
          createdBy: user?.name,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert('保存成功');
        router.push('/workflow/config');
      } else {
        alert(data.error || '保存失败');
      }
    } catch (error) {
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 添加节点
  const addNode = (type: NodeType) => {
    const newNode: WorkflowNode = {
      id: `node_${Date.now()}`,
      type,
      name: nodeTypeConfig[type].label,
      nextNodeId: undefined,
    };
    
    if (type === 'approval') {
      newNode.approverType = 'role';
      newNode.rejectAction = 'return_to_applicant';
    } else if (type === 'condition') {
      newNode.branches = [];
    }
    
    setFormData({
      ...formData,
      nodes: [...(formData.nodes || []), newNode],
    });
    
    // 展开新节点
    setExpandedNodes(prev => new Set([...prev, newNode.id]));
  };

  // 更新节点
  const updateNode = (nodeId: string, updates: Partial<WorkflowNode>) => {
    const newNodes = (formData.nodes || []).map(node => 
      node.id === nodeId ? { ...node, ...updates } : node
    );
    setFormData({ ...formData, nodes: newNodes });
  };

  // 删除节点
  const deleteNode = (nodeId: string) => {
    const newNodes = (formData.nodes || []).filter(n => n.id !== nodeId);
    setFormData({ ...formData, nodes: newNodes });
  };

  // 复制节点
  const duplicateNode = (node: WorkflowNode) => {
    const newNode: WorkflowNode = {
      ...node,
      id: `node_${Date.now()}`,
      name: `${node.name}（副本）`,
    };
    setFormData({
      ...formData,
      nodes: [...(formData.nodes || []), newNode],
    });
  };

  // 添加条件分支
  const addBranch = (nodeId: string) => {
    const node = (formData.nodes || []).find(n => n.id === nodeId);
    if (!node || node.type !== 'condition') return;
    
    const newBranch: ConditionBranch = {
      id: `branch_${Date.now()}`,
      name: `分支 ${(node.branches?.length || 0) + 1}`,
      conditionType: 'all',
      rules: [],
      nextNodeId: '',
    };
    
    updateNode(nodeId, {
      branches: [...(node.branches || []), newBranch],
    });
  };

  // 更新条件分支
  const updateBranch = (nodeId: string, branchId: string, updates: Partial<ConditionBranch>) => {
    const node = (formData.nodes || []).find(n => n.id === nodeId);
    if (!node || node.type !== 'condition') return;
    
    const newBranches = (node.branches || []).map(branch =>
      branch.id === branchId ? { ...branch, ...updates } : branch
    );
    
    updateNode(nodeId, { branches: newBranches });
  };

  // 删除条件分支
  const deleteBranch = (nodeId: string, branchId: string) => {
    const node = (formData.nodes || []).find(n => n.id === nodeId);
    if (!node || node.type !== 'condition') return;
    
    const newBranches = (node.branches || []).filter(b => b.id !== branchId);
    updateNode(nodeId, { branches: newBranches });
  };

  // 添加条件规则
  const addRule = (nodeId: string, branchId: string) => {
    const node = (formData.nodes || []).find(n => n.id === nodeId);
    if (!node) return;
    
    const branch = (node.branches || []).find(b => b.id === branchId);
    if (!branch) return;
    
    const newRule: ConditionRule = {
      id: `rule_${Date.now()}`,
      field: 'type',
      operator: 'eq',
      value: '',
    };
    
    const newRules = [...(branch.rules || []), newRule];
    updateBranch(nodeId, branchId, { rules: newRules });
  };

  // 更新条件规则
  const updateRule = (nodeId: string, branchId: string, ruleId: string, updates: Partial<ConditionRule>) => {
    const node = (formData.nodes || []).find(n => n.id === nodeId);
    if (!node) return;
    
    const branch = (node.branches || []).find(b => b.id === branchId);
    if (!branch) return;
    
    const newRules = (branch.rules || []).map(rule =>
      rule.id === ruleId ? { ...rule, ...updates } : rule
    );
    
    updateBranch(nodeId, branchId, { rules: newRules });
  };

  // 删除条件规则
  const deleteRule = (nodeId: string, branchId: string, ruleId: string) => {
    const node = (formData.nodes || []).find(n => n.id === nodeId);
    if (!node) return;
    
    const branch = (node.branches || []).find(b => b.id === branchId);
    if (!branch) return;
    
    const newRules = (branch.rules || []).filter(r => r.id !== ruleId);
    updateBranch(nodeId, branchId, { rules: newRules });
  };

  // 切换节点展开状态
  const toggleNodeExpand = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  // 全部展开/收起
  const toggleAllNodes = (expand: boolean) => {
    if (expand) {
      setExpandedNodes(new Set((formData.nodes || []).map(n => n.id)));
    } else {
      setExpandedNodes(new Set());
    }
  };

  const nodes = formData.nodes || [];
  const nodeCount = nodes.length;
  const approvalCount = nodes.filter(n => n.type === 'approval').length;
  const conditionCount = nodes.filter(n => n.type === 'condition').length;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 顶部工具栏 */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/workflow/config')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回列表
          </Button>
          <div className="h-6 w-px bg-gray-200" />
          <h1 className="text-lg font-bold text-gray-900">
            {configId ? '编辑流程配置' : '新建流程配置'}
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Badge variant="outline">{nodeCount} 个节点</Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {approvalCount} 个审批
            </Badge>
            {conditionCount > 0 && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                {conditionCount} 个条件
              </Badge>
            )}
          </div>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? (
              <>
                <Clock className="h-4 w-4 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                保存配置
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧：配置面板 */}
        <div className="w-[480px] bg-white border-r flex flex-col overflow-hidden">
          {/* 基本信息 */}
          <div className="p-4 border-b flex-shrink-0">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500">流程类型 *</label>
                  <Select
                    value={formData.type}
                    onValueChange={(v) => setFormData({ ...formData, type: v as WorkflowType })}
                    disabled={!!configId}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="选择类型" />
                    </SelectTrigger>
                    <SelectContent>
                      {workflowTypes.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">流程名称 *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="例如：教师请假审批流程"
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-500">流程描述</label>
                <Textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="描述这个流程的适用范围和特点"
                  rows={2}
                  className="mt-1"
                />
              </div>

              {/* 快速使用模板 */}
              {formData.type && !configId && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 border border-blue-200">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-700">系统提供预设模板，</span>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => useTemplate(formData.type!)}
                    className="p-0 h-auto text-blue-600 underline"
                  >
                    点击使用
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* 添加节点按钮组 */}
          <div className="p-4 border-b flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">添加节点</span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleAllNodes(true)}
                  className="text-xs h-7"
                >
                  全部展开
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleAllNodes(false)}
                  className="text-xs h-7"
                >
                  全部收起
                </Button>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {(Object.keys(nodeTypeConfig) as NodeType[]).map(type => {
                const config = nodeTypeConfig[type];
                const Icon = config.icon;
                return (
                  <Button
                    key={type}
                    variant="outline"
                    size="sm"
                    onClick={() => addNode(type)}
                    className="gap-1.5"
                  >
                    <div className={`p-1 rounded ${config.bgColor}`}>
                      <Icon className="h-3 w-3 text-white" />
                    </div>
                    {config.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* 节点列表 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {nodes.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Workflow className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">暂无节点</p>
                <p className="text-sm mt-1">点击上方按钮添加节点，或使用模板快速创建</p>
              </div>
            ) : (
              nodes.map((node) => {
                const config = nodeTypeConfig[node.type];
                const Icon = config.icon;
                const isExpanded = expandedNodes.has(node.id);
                
                return (
                  <Card key={node.id} className={`border shadow-sm ${node.type === 'start' ? 'border-emerald-200' : node.type === 'end' ? 'border-gray-300' : ''}`}>
                    {/* 节点头部 */}
                    <div 
                      className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleNodeExpand(node.id)}
                    >
                      <div className={`p-2 rounded-lg ${config.bgColor}`}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 truncate">{node.name}</p>
                          <Badge variant="outline" className="text-xs">{config.label}</Badge>
                        </div>
                        {node.type === 'approval' && node.approverRole && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            审批角色：{roleOptions.find(r => r.value === node.approverRole)?.label || node.approverRole}
                          </p>
                        )}
                        {node.type === 'condition' && (node.branches?.length || 0) > 0 && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {node.branches?.length} 个分支
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {node.type !== 'start' && node.type !== 'end' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              duplicateNode(node);
                            }}
                            className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </Button>
                        )}
                        {node.type !== 'start' && node.type !== 'end' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNode(node.id);
                            }}
                            className="h-7 w-7 p-0 text-red-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {/* 节点详细配置 */}
                    {isExpanded && (
                      <CardContent className="pt-0 pb-3 border-t">
                        <div className="space-y-4 pt-3">
                          {/* 节点名称 */}
                          <div>
                            <label className="text-xs font-medium text-gray-500">节点名称</label>
                            <Input
                              value={node.name}
                              onChange={(e) => updateNode(node.id, { name: e.target.value })}
                              className="mt-1"
                            />
                          </div>

                          {/* 审批节点配置 */}
                          {node.type === 'approval' && (
                            <>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-xs font-medium text-gray-500">审批人类型</label>
                                  <Select
                                    value={node.approverType || 'role'}
                                    onValueChange={(v) => updateNode(node.id, { 
                                      approverType: v as 'role' | 'specific',
                                    })}
                                  >
                                    <SelectTrigger className="mt-1">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="role">按角色审批</SelectItem>
                                      <SelectItem value="specific">指定人员</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                {node.approverType === 'role' ? (
                                  <div>
                                    <label className="text-xs font-medium text-gray-500">审批角色</label>
                                    <Select
                                      value={node.approverRole || ''}
                                      onValueChange={(v) => updateNode(node.id, { approverRole: v as UserRole })}
                                    >
                                      <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="选择角色" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {roleOptions.map(role => (
                                          <SelectItem key={role.value} value={role.value}>
                                            {role.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                ) : (
                                  <div>
                                    <label className="text-xs font-medium text-gray-500">指定人员</label>
                                    <Input
                                      value={node.approverName || ''}
                                      onChange={(e) => updateNode(node.id, { 
                                        approverName: e.target.value,
                                        approverId: e.target.value,
                                      })}
                                      placeholder="输入人员姓名"
                                      className="mt-1"
                                    />
                                  </div>
                                )}
                              </div>

                              {/* 拒绝处理 */}
                              <div>
                                <label className="text-xs font-medium text-gray-500">拒绝后处理</label>
                                <div className="grid grid-cols-2 gap-2 mt-1">
                                  {rejectActions.map(action => {
                                    const ActionIcon = action.icon;
                                    const isSelected = node.rejectAction === action.value;
                                    return (
                                      <div
                                        key={action.value}
                                        onClick={() => updateNode(node.id, { rejectAction: action.value })}
                                        className={`p-2 rounded-lg border cursor-pointer transition-all ${
                                          isSelected 
                                            ? 'border-blue-500 bg-blue-50' 
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                      >
                                        <div className="flex items-center gap-2">
                                          <ActionIcon className={`h-4 w-4 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                                          <span className={`text-sm font-medium ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
                                            {action.label}
                                          </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">{action.desc}</p>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </>
                          )}

                          {/* 条件分支节点配置 */}
                          {node.type === 'condition' && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-gray-500">条件分支</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addBranch(node.id)}
                                  className="h-7"
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  添加分支
                                </Button>
                              </div>
                              
                              {node.branches?.map((branch) => (
                                <div key={branch.id} className="border rounded-lg p-3 bg-amber-50/50">
                                  <div className="flex items-center gap-2 mb-2">
                                    <GitBranch className="h-4 w-4 text-amber-600" />
                                    <Input
                                      value={branch.name}
                                      onChange={(e) => updateBranch(node.id, branch.id, { name: e.target.value })}
                                      className="h-7 w-28"
                                      placeholder="分支名称"
                                    />
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => deleteBranch(node.id, branch.id)}
                                      className="h-7 w-7 p-0 text-red-500"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                  
                                  {/* 条件规则 */}
                                  <div className="space-y-2 mb-3">
                                    {branch.rules?.map((rule) => (
                                      <div key={rule.id} className="flex items-center gap-1.5 flex-wrap">
                                        <Select
                                          value={rule.field}
                                          onValueChange={(v) => updateRule(node.id, branch.id, rule.id, { field: v })}
                                        >
                                          <SelectTrigger className="w-20 h-6 text-xs">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="type">类型</SelectItem>
                                            <SelectItem value="duration">天数</SelectItem>
                                            <SelectItem value="amount">金额</SelectItem>
                                            <SelectItem value="priority">紧急</SelectItem>
                                            <SelectItem value="estimatedCost">费用</SelectItem>
                                            <SelectItem value="totalAmount">总额</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        
                                        <Select
                                          value={rule.operator}
                                          onValueChange={(v) => updateRule(node.id, branch.id, rule.id, { operator: v as any })}
                                        >
                                          <SelectTrigger className="w-16 h-6 text-xs">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="eq">等于</SelectItem>
                                            <SelectItem value="ne">不等</SelectItem>
                                            <SelectItem value="gt">大于</SelectItem>
                                            <SelectItem value="gte">≥</SelectItem>
                                            <SelectItem value="lt">小于</SelectItem>
                                            <SelectItem value="lte">≤</SelectItem>
                                            <SelectItem value="in">包含</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        
                                        <Input
                                          value={String(rule.value)}
                                          onChange={(e) => updateRule(node.id, branch.id, rule.id, { 
                                            value: isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value) 
                                          })}
                                          className="w-20 h-6 text-xs"
                                          placeholder="值"
                                        />
                                        
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => deleteRule(node.id, branch.id, rule.id)}
                                          className="h-6 w-6 p-0"
                                        >
                                          <Trash2 className="h-3 w-3 text-red-400" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => addRule(node.id, branch.id)}
                                      className="h-6 text-xs"
                                    >
                                      <Plus className="h-3 w-3 mr-1" />
                                      添加条件
                                    </Button>
                                  </div>
                                  
                                  {/* 下一节点 */}
                                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-amber-200">
                                    <ArrowRightLeft className="h-3 w-3 text-gray-400" />
                                    <span className="text-xs text-gray-500">跳转到：</span>
                                    <Select
                                      value={branch.nextNodeId || ''}
                                      onValueChange={(v) => updateBranch(node.id, branch.id, { nextNodeId: v })}
                                    >
                                      <SelectTrigger className="flex-1 h-7">
                                        <SelectValue placeholder="选择下一节点" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {nodes.filter(n => n.id !== node.id).map(n => (
                                          <SelectItem key={n.id} value={n.id}>
                                            <span className="flex items-center gap-1">
                                              <span className={`inline-block w-2 h-2 rounded-full ${nodeTypeConfig[n.type].bgColor}`} />
                                              {n.name}
                                            </span>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              ))}
                              
                              {(!node.branches || node.branches.length === 0) && (
                                <div className="text-center py-4 text-gray-400 text-sm border border-dashed rounded-lg">
                                  添加条件分支来定义不同情况下的审批路径
                                </div>
                              )}
                              
                              {/* 默认分支 */}
                              {(node.branches?.length || 0) > 0 && (
                                <div className="flex items-center gap-2 p-2 bg-gray-100 rounded">
                                  <span className="text-xs text-gray-600">默认分支（其他情况）：</span>
                                  <Select
                                    value={node.defaultBranchId || ''}
                                    onValueChange={(v) => updateNode(node.id, { defaultBranchId: v })}
                                  >
                                    <SelectTrigger className="flex-1 h-7">
                                      <SelectValue placeholder="选择默认分支" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {node.branches?.map(b => (
                                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}
                            </div>
                          )}

                          {/* 下一个节点（非条件节点） */}
                          {node.type !== 'condition' && node.type !== 'end' && (
                            <div className="flex items-center gap-2">
                              <ArrowRightLeft className="h-4 w-4 text-gray-400" />
                              <span className="text-xs font-medium text-gray-500">下一节点：</span>
                              <Select
                                value={node.nextNodeId || ''}
                                onValueChange={(v) => updateNode(node.id, { nextNodeId: v })}
                              >
                                <SelectTrigger className="flex-1">
                                  <SelectValue placeholder="选择" />
                                </SelectTrigger>
                                <SelectContent>
                                  {nodes.filter(n => n.id !== node.id).map(n => (
                                    <SelectItem key={n.id} value={n.id}>
                                      <span className="flex items-center gap-2">
                                        <span className={`inline-block w-2 h-2 rounded-full ${nodeTypeConfig[n.type].bgColor}`} />
                                        {n.name}
                                      </span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {/* 右侧：流程图预览 */}
        <div className="flex-1 p-6 overflow-auto">
          <Card className="h-full border-0 shadow-lg">
            <CardHeader className="border-b bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Eye className="h-5 w-5 text-gray-400" />
                    流程图预览
                  </CardTitle>
                  <CardDescription>实时展示流程走向，方便判断逻辑是否正确</CardDescription>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span>开始</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span>审批</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span>条件</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-gray-500" />
                    <span>结束</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {nodes.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <Workflow className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">暂无流程节点</p>
                    <p className="text-sm mt-1">在左侧添加节点后，流程图将实时显示</p>
                  </div>
                </div>
              ) : (
                <FlowDiagram nodes={nodes} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// 流程图组件
function FlowDiagram({ nodes }: { nodes: WorkflowNode[] }) {
  // 构建节点图
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  
  // 按层级排列节点
  const levels: WorkflowNode[][] = [];
  const visited = new Set<string>();
  
  // 从开始节点开始
  const startNode = nodes.find(n => n.type === 'start');
  if (!startNode) {
    // 如果没有开始节点，按顺序显示
    return (
      <div className="flex flex-wrap gap-4 justify-center">
        {nodes.map(node => (
          <FlowNodeCard key={node.id} node={node} allNodes={nodeMap} />
        ))}
      </div>
    );
  }
  
  // BFS构建层级
  const queue: { node: WorkflowNode; level: number }[] = [{ node: startNode, level: 0 }];
  
  while (queue.length > 0) {
    const { node, level } = queue.shift()!;
    
    if (visited.has(node.id)) continue;
    visited.add(node.id);
    
    if (!levels[level]) levels[level] = [];
    levels[level].push(node);
    
    // 添加下一个节点
    if (node.type === 'condition' && node.branches) {
      node.branches.forEach(branch => {
        const nextNode = nodeMap.get(branch.nextNodeId);
        if (nextNode && !visited.has(nextNode.id)) {
          queue.push({ node: nextNode, level: level + 1 });
        }
      });
      // 默认分支
      if (node.defaultBranchId) {
        const defaultNode = nodeMap.get(node.defaultBranchId);
        if (defaultNode && !visited.has(defaultNode.id)) {
          queue.push({ node: defaultNode, level: level + 1 });
        }
      }
    } else if (node.nextNodeId) {
      const nextNode = nodeMap.get(node.nextNodeId);
      if (nextNode && !visited.has(nextNode.id)) {
        queue.push({ node: nextNode, level: level + 1 });
      }
    }
  }
  
  // 添加未访问的节点
  nodes.forEach(node => {
    if (!visited.has(node.id)) {
      if (!levels[levels.length]) levels[levels.length] = [];
      levels[levels.length].push(node);
    }
  });

  return (
    <div className="space-y-6">
      {levels.map((levelNodes, levelIndex) => (
        <div key={levelIndex}>
          {/* 层级标签 */}
          {levelIndex > 0 && (
            <div className="flex items-center justify-center mb-3">
              <div className="flex items-center gap-2 text-gray-400">
                <div className="h-px w-12 bg-gray-200" />
                <ChevronDown className="h-4 w-4" />
                <span className="text-xs">第 {levelIndex + 1} 步</span>
                <div className="h-px w-12 bg-gray-200" />
              </div>
            </div>
          )}
          
          {/* 节点 */}
          <div className="flex flex-wrap gap-6 justify-center">
            {levelNodes.map(node => (
              <FlowNodeCard key={node.id} node={node} allNodes={nodeMap} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// 流程节点卡片
function FlowNodeCard({ node, allNodes }: { node: WorkflowNode; allNodes: Map<string, WorkflowNode> }) {
  const config = nodeTypeConfig[node.type];
  const Icon = config.icon;
  
  // 获取下一个节点信息
  const nextNodes: { name: string; condition?: string }[] = [];
  
  if (node.type === 'condition' && node.branches) {
    node.branches.forEach(branch => {
      const nextNode = allNodes.get(branch.nextNodeId);
      if (nextNode) {
        const conditionLabels = branch.rules.map(r => r.label || `${r.field}${r.operator}${r.value}`).join(' 且 ');
        nextNodes.push({ 
          name: nextNode.name, 
          condition: `${branch.name}: ${conditionLabels}` 
        });
      }
    });
  } else if (node.nextNodeId) {
    const nextNode = allNodes.get(node.nextNodeId);
    if (nextNode) {
      nextNodes.push({ name: nextNode.name });
    }
  }

  return (
    <div className="flex flex-col items-center">
      {/* 节点卡片 */}
      <div className={`relative px-6 py-4 rounded-xl ${config.bgColor} shadow-lg min-w-[160px]`}>
        <div className="flex items-center justify-center gap-2 text-white">
          <Icon className="h-5 w-5" />
          <span className="font-medium">{node.name}</span>
        </div>
        
        {/* 审批角色标签 */}
        {node.type === 'approval' && node.approverRole && (
          <div className="mt-2 text-center">
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs">
              {roleOptions.find(r => r.value === node.approverRole)?.label || node.approverRole}
            </Badge>
          </div>
        )}
        
        {/* 拒绝处理标签 */}
        {node.type === 'approval' && node.rejectAction && (
          <div className="mt-1.5 text-center">
            <span className="text-xs text-white/70">
              拒绝: {rejectActions.find(a => a.value === node.rejectAction)?.label}
            </span>
          </div>
        )}
      </div>
      
      {/* 下一步指示 */}
      {nextNodes.length > 0 && (
        <div className="mt-3 space-y-1 text-center">
          {nextNodes.map((next, idx) => (
            <div key={idx} className="text-xs text-gray-500">
              {next.condition && (
                <span className="text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded mr-1">
                  {next.condition}
                </span>
              )}
              <ArrowRightLeft className="inline h-3 w-3 mx-1" />
              <span className="font-medium">{next.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
