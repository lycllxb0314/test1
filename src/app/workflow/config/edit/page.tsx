'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  ChevronUp,
  AlertCircle,
  CheckCircle,
  Clock,
  RotateCcw,
  CornerDownLeft,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
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
      { id: 'start', type: 'start', name: '开始', nextNodeId: 'approval_grade_head' },
      {
        id: 'approval_grade_head',
        type: 'approval',
        name: '年级组长审批',
        approverType: 'role',
        approverRole: 'head_teacher',
        rejectAction: 'return_to_applicant',
        nextNodeId: 'condition_type',
      },
      { 
        id: 'condition_type', 
        type: 'condition', 
        name: '判断请假类型',
        branches: [
          {
            id: 'branch_sick_short',
            name: '病假≤3天',
            conditionType: 'all',
            rules: [
              { id: 'r1', field: 'type', operator: 'eq', value: '病假', label: '病假' },
              { id: 'r2', field: 'duration', operator: 'lte', value: 3, label: '≤3天' },
            ],
            nextNodeId: 'end',
          },
          {
            id: 'branch_sick_long',
            name: '病假>3天',
            conditionType: 'all',
            rules: [
              { id: 'r3', field: 'type', operator: 'eq', value: '病假', label: '病假' },
              { id: 'r4', field: 'duration', operator: 'gt', value: 3, label: '>3天' },
            ],
            nextNodeId: 'approval_dean',
          },
          {
            id: 'branch_personal_short',
            name: '事假≤1天',
            conditionType: 'all',
            rules: [
              { id: 'r5', field: 'type', operator: 'eq', value: '事假', label: '事假' },
              { id: 'r6', field: 'duration', operator: 'lte', value: 1, label: '≤1天' },
            ],
            nextNodeId: 'end',
          },
          {
            id: 'branch_personal_medium',
            name: '事假1-3天',
            conditionType: 'all',
            rules: [
              { id: 'r7', field: 'type', operator: 'eq', value: '事假', label: '事假' },
              { id: 'r8', field: 'duration', operator: 'lte', value: 3, label: '≤3天' },
            ],
            nextNodeId: 'approval_dean',
          },
          {
            id: 'branch_personal_long',
            name: '事假>3天',
            conditionType: 'all',
            rules: [
              { id: 'r9', field: 'type', operator: 'eq', value: '事假', label: '事假' },
              { id: 'r10', field: 'duration', operator: 'gt', value: 3, label: '>3天' },
            ],
            nextNodeId: 'approval_dean',
          },
          {
            id: 'branch_official',
            name: '公假',
            conditionType: 'all',
            rules: [{ id: 'r11', field: 'type', operator: 'eq', value: '公假', label: '公假' }],
            nextNodeId: 'approval_dean',
          },
        ],
        defaultBranchId: 'branch_personal_short',
      },
      {
        id: 'approval_dean',
        type: 'approval',
        name: '教务主任审批',
        approverType: 'role',
        approverRole: 'academic_director',
        rejectAction: 'return_to_previous',
        nextNodeId: 'condition_need_vice',
      },
      {
        id: 'condition_need_vice',
        type: 'condition',
        name: '是否需副校长审批',
        branches: [
          {
            id: 'need_vice',
            name: '事假>3天需副校长',
            conditionType: 'all',
            rules: [
              { id: 'c1', field: 'type', operator: 'eq', value: '事假', label: '事假' },
              { id: 'c2', field: 'duration', operator: 'gt', value: 3, label: '>3天' },
            ],
            nextNodeId: 'approval_vice',
          },
          {
            id: 'no_vice',
            name: '其他情况结束',
            conditionType: 'all',
            rules: [],
            nextNodeId: 'end',
          },
        ],
        defaultBranchId: 'no_vice',
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
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [previewWidth, setPreviewWidth] = useState(500); // 预览窗口宽度
  const [isDragging, setIsDragging] = useState(false); // 是否正在拖拽
  
  // 拖拽处理
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      // 计算新的宽度（从窗口右侧往左计算）
      const newWidth = window.innerWidth - e.clientX;
      // 限制最小和最大宽度
      const minWidth = 300;
      const maxWidth = 800;
      const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      setPreviewWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);
  
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
      setSelectedNodeId(null);
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
    
    setSelectedNodeId(newNode.id);
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
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
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

  const nodes = formData.nodes || [];
  const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 顶部工具栏 */}
      <div className="bg-white border-b px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/workflow/config')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <div className="h-6 w-px bg-gray-200" />
          <h1 className="text-lg font-bold text-gray-900">
            {configId ? '编辑流程' : '新建流程'}
          </h1>
          {formData.name && (
            <Badge variant="secondary">{formData.name}</Badge>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowPreview(!showPreview)}
            className="gap-1"
          >
            {showPreview ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
            {showPreview ? '隐藏预览' : '显示预览'}
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Clock className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? '保存中...' : '保存配置'}
          </Button>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧：节点列表 */}
        <div className={`${showPreview ? 'w-80' : 'w-96'} bg-white border-r flex flex-col overflow-hidden flex-shrink-0`}>
          {/* 基本信息 */}
          <div className="p-4 border-b flex-shrink-0">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-gray-500">流程类型</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v) => setFormData({ ...formData, type: v as WorkflowType })}
                    disabled={!!configId}
                  >
                    <SelectTrigger className="mt-1 h-8">
                      <SelectValue placeholder="选择" />
                    </SelectTrigger>
                    <SelectContent>
                      {workflowTypes.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">流程名称</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="例如：请假审批"
                    className="mt-1 h-8"
                  />
                </div>
              </div>

              {formData.type && !configId && (
                <div className="flex items-center gap-2 p-2 rounded bg-blue-50 border border-blue-200">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  <span className="text-xs text-blue-700">使用模板：</span>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => useTemplate(formData.type!)}
                    className="p-0 h-auto text-xs text-blue-600 underline"
                  >
                    点击加载
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* 添加节点 */}
          <div className="p-3 border-b flex-shrink-0">
            <Label className="text-xs text-gray-500 mb-2 block">添加节点</Label>
            <div className="flex gap-1.5 flex-wrap">
              {(Object.keys(nodeTypeConfig) as NodeType[]).map(type => {
                const config = nodeTypeConfig[type];
                const Icon = config.icon;
                return (
                  <Button
                    key={type}
                    variant="outline"
                    size="sm"
                    onClick={() => addNode(type)}
                    className="gap-1 h-7 px-2"
                  >
                    <div className={`p-0.5 rounded ${config.bgColor}`}>
                      <Icon className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-xs">{config.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* 节点列表 */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {nodes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Workflow className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">点击上方按钮添加节点</p>
              </div>
            ) : (
              nodes.map((node) => {
                const config = nodeTypeConfig[node.type];
                const Icon = config.icon;
                const isSelected = selectedNodeId === node.id;
                
                return (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-all border ${
                      isSelected 
                        ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200' 
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`p-1.5 rounded ${config.bgColor}`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                        {node.name}
                      </p>
                      {node.type === 'approval' && node.approverRole && (
                        <p className="text-xs text-gray-500 truncate">
                          {roleOptions.find(r => r.value === node.approverRole)?.label || node.approverRole}
                        </p>
                      )}
                      {node.type === 'condition' && (
                        <p className="text-xs text-gray-500">
                          {node.branches?.length || 0} 个分支
                        </p>
                      )}
                    </div>
                    {node.type !== 'start' && node.type !== 'end' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNode(node.id);
                        }}
                        className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 中间：节点详细编辑区 */}
        <div className="flex-1 overflow-y-auto bg-gray-100 p-6">
          {selectedNode ? (
            <Card className="border-0 shadow-lg max-w-3xl mx-auto">
              <CardHeader className="border-b bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${nodeTypeConfig[selectedNode.type].bgColor}`}>
                      {React.createElement(nodeTypeConfig[selectedNode.type].icon, { className: 'h-5 w-5 text-white' })}
                    </div>
                    <div>
                      <CardTitle className="text-lg">编辑节点</CardTitle>
                      <CardDescription>
                        {nodeTypeConfig[selectedNode.type].label}节点
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedNodeId(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="p-6 space-y-6">
                {/* 节点名称 */}
                <div>
                  <Label className="text-sm font-medium">节点名称</Label>
                  <Input
                    value={selectedNode.name}
                    onChange={(e) => updateNode(selectedNode.id, { name: e.target.value })}
                    className="mt-2"
                    placeholder="输入节点名称"
                  />
                </div>

                {/* 审批节点配置 */}
                {selectedNode.type === 'approval' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">审批人类型</Label>
                        <Select
                          value={selectedNode.approverType || 'role'}
                          onValueChange={(v) => updateNode(selectedNode.id, { 
                            approverType: v as 'role' | 'specific',
                          })}
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="role">按角色审批</SelectItem>
                            <SelectItem value="specific">指定人员</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {selectedNode.approverType === 'role' ? (
                        <div>
                          <Label className="text-sm font-medium">审批角色</Label>
                          <Select
                            value={selectedNode.approverRole || ''}
                            onValueChange={(v) => updateNode(selectedNode.id, { approverRole: v as UserRole })}
                          >
                            <SelectTrigger className="mt-2">
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
                          <Label className="text-sm font-medium">指定人员姓名</Label>
                          <Input
                            value={selectedNode.approverName || ''}
                            onChange={(e) => updateNode(selectedNode.id, { 
                              approverName: e.target.value,
                              approverId: e.target.value,
                            })}
                            placeholder="输入人员姓名"
                            className="mt-2"
                          />
                        </div>
                      )}
                    </div>

                    {/* 拒绝处理 */}
                    <div>
                      <Label className="text-sm font-medium mb-3 block">拒绝后处理</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {rejectActions.map(action => {
                          const ActionIcon = action.icon;
                          const isSelected = selectedNode.rejectAction === action.value;
                          return (
                            <div
                              key={action.value}
                              onClick={() => updateNode(selectedNode.id, { rejectAction: action.value })}
                              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                isSelected 
                                  ? 'border-blue-500 bg-blue-50' 
                                  : 'border-gray-200 hover:border-gray-300 bg-white'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <ActionIcon className={`h-5 w-5 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                                <span className={`font-medium ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
                                  {action.label}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500">{action.desc}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}

                {/* 条件分支节点配置 */}
                {selectedNode.type === 'condition' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">条件分支</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addBranch(selectedNode.id)}
                        className="gap-1"
                      >
                        <Plus className="h-4 w-4" />
                        添加分支
                      </Button>
                    </div>
                    
                    {selectedNode.branches?.map((branch, branchIndex) => (
                      <Card key={branch.id} className="border-amber-200 bg-amber-50/30">
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-amber-100">
                              <GitBranch className="h-4 w-4 text-amber-600" />
                            </div>
                            <Input
                              value={branch.name}
                              onChange={(e) => updateBranch(selectedNode.id, branch.id, { name: e.target.value })}
                              className="h-8 w-40"
                              placeholder="分支名称"
                            />
                            <Badge variant="outline" className="bg-white">分支 {branchIndex + 1}</Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteBranch(selectedNode.id, branch.id)}
                              className="ml-auto h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* 条件规则 */}
                          <div>
                            <Label className="text-xs text-gray-500 mb-2 block">条件规则</Label>
                            <div className="space-y-2">
                              {branch.rules?.map((rule, ruleIndex) => (
                                <div key={rule.id} className="flex items-center gap-2 flex-wrap bg-white p-2 rounded-lg border">
                                  {ruleIndex > 0 && (
                                    <Badge variant="secondary" className="text-xs">且</Badge>
                                  )}
                                  <Select
                                    value={rule.field}
                                    onValueChange={(v) => updateRule(selectedNode.id, branch.id, rule.id, { field: v })}
                                  >
                                    <SelectTrigger className="w-24 h-8">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="type">类型</SelectItem>
                                      <SelectItem value="duration">天数</SelectItem>
                                      <SelectItem value="amount">金额</SelectItem>
                                      <SelectItem value="priority">紧急度</SelectItem>
                                      <SelectItem value="estimatedCost">预估费用</SelectItem>
                                      <SelectItem value="totalAmount">总金额</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  
                                  <Select
                                    value={rule.operator}
                                    onValueChange={(v) => updateRule(selectedNode.id, branch.id, rule.id, { operator: v as any })}
                                  >
                                    <SelectTrigger className="w-20 h-8">
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
                                    onChange={(e) => updateRule(selectedNode.id, branch.id, rule.id, { 
                                      value: isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value) 
                                    })}
                                    className="w-28 h-8"
                                    placeholder="比较值"
                                  />
                                  
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteRule(selectedNode.id, branch.id, rule.id)}
                                    className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => addRule(selectedNode.id, branch.id)}
                              className="mt-2 text-xs gap-1"
                            >
                              <Plus className="h-3 w-3" />
                              添加条件
                            </Button>
                          </div>
                          
                          {/* 跳转目标 */}
                          <div className="flex items-center gap-2 pt-2 border-t border-amber-200">
                            <ArrowRightLeft className="h-4 w-4 text-amber-600" />
                            <Label className="text-xs text-gray-600">满足条件后跳转到：</Label>
                            <Select
                              value={branch.nextNodeId || ''}
                              onValueChange={(v) => updateBranch(selectedNode.id, branch.id, { nextNodeId: v })}
                            >
                              <SelectTrigger className="flex-1 h-8">
                                <SelectValue placeholder="选择目标节点" />
                              </SelectTrigger>
                              <SelectContent>
                                {nodes.filter(n => n.id !== selectedNode.id).map(n => (
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
                        </CardContent>
                      </Card>
                    ))}
                    
                    {(!selectedNode.branches || selectedNode.branches.length === 0) && (
                      <div className="text-center py-8 text-gray-400 border-2 border-dashed rounded-xl">
                        <GitBranch className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                        <p>添加条件分支来定义不同情况下的审批路径</p>
                      </div>
                    )}
                    
                    {/* 默认分支 */}
                    {(selectedNode.branches?.length || 0) > 0 && (
                      <div className="flex items-center gap-3 p-4 bg-gray-100 rounded-xl">
                        <Label className="text-sm font-medium text-gray-600 whitespace-nowrap">默认分支（其他情况）：</Label>
                        <Select
                          value={selectedNode.defaultBranchId || ''}
                          onValueChange={(v) => updateNode(selectedNode.id, { defaultBranchId: v })}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="选择默认分支" />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedNode.branches?.map(b => (
                              <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                )}

                {/* 下一个节点（非条件节点） */}
                {selectedNode.type !== 'condition' && selectedNode.type !== 'end' && (
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <ArrowRightLeft className="h-5 w-5 text-gray-400" />
                    <Label className="text-sm font-medium text-gray-600">下一节点：</Label>
                    <Select
                      value={selectedNode.nextNodeId || ''}
                      onValueChange={(v) => updateNode(selectedNode.id, { nextNodeId: v })}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="选择" />
                      </SelectTrigger>
                      <SelectContent>
                        {nodes.filter(n => n.id !== selectedNode.id).map(n => (
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

                {/* 操作按钮 */}
                {selectedNode.type !== 'start' && selectedNode.type !== 'end' && (
                  <div className="flex items-center gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => duplicateNode(selectedNode)}
                      className="gap-1"
                    >
                      复制此节点
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteNode(selectedNode.id)}
                      className="gap-1"
                    >
                      <Trash2 className="h-4 w-4" />
                      删除此节点
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-gray-400">
                <Settings className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">请选择一个节点进行编辑</p>
                <p className="text-sm mt-1">在左侧列表中点击节点，或添加新节点</p>
              </div>
            </div>
          )}
        </div>

        {/* 右侧：流程图预览 */}
        {showPreview && (
          <>
            {/* 可拖拽分隔条 */}
            <div
              className={`w-1 bg-gray-200 hover:bg-blue-400 cursor-col-resize transition-colors flex-shrink-0 ${
                isDragging ? 'bg-blue-500' : ''
              }`}
              onMouseDown={handleMouseDown}
            />
            
            <div 
              className="bg-white border-l flex flex-col overflow-hidden flex-shrink-0"
              style={{ width: `${previewWidth}px` }}
            >
              <div className="p-3 border-b bg-gray-50 flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 flex items-center gap-2">
                    <Eye className="h-4 w-4 text-gray-400" />
                    流程图预览
                  </h3>
                  <p className="text-xs text-gray-500">横向流程图 · 拖拽左侧边栏调整宽度</p>
                </div>
              </div>
              <div className="flex-1 overflow-auto">
                {nodes.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <Workflow className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">暂无节点</p>
                    </div>
                  </div>
                ) : (
                  <HorizontalFlowDiagram 
                    nodes={nodes} 
                    selectedNodeId={selectedNodeId} 
                    onSelectNode={setSelectedNodeId} 
                  />
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// 横向流程图组件
function HorizontalFlowDiagram({ nodes, selectedNodeId, onSelectNode }: { 
  nodes: WorkflowNode[]; 
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
}) {
  const [zoom, setZoom] = useState(1); // 缩放比例
  
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  
  // 节点尺寸
  const NODE_WIDTH = 140;
  const NODE_HEIGHT = 60;
  const GAP_X = 100;  // 水平间距
  const GAP_Y = 100;  // 垂直间距
  const BRANCH_GAP_Y = 80; // 分支垂直间距
  
  // 计算节点位置
  const nodePositions = new Map<string, { x: number; y: number; level: number }>();
  
  // BFS 计算层级
  const startNode = nodes.find(n => n.type === 'start');
  if (!startNode) {
    return (
      <div className="p-4 text-center text-gray-500">
        请添加开始节点
      </div>
    );
  }
  
  const visited = new Set<string>();
  const queue: { nodeId: string; level: number; yOffset: number }[] = [{ nodeId: startNode.id, level: 0, yOffset: 0 }];
  
  // 记录每个层级的节点数量，用于垂直分布
  const levelNodes: Map<number, string[]> = new Map();
  
  while (queue.length > 0) {
    const { nodeId, level, yOffset } = queue.shift()!;
    
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);
    
    const node = nodeMap.get(nodeId);
    if (!node) continue;
    
    // 记录层级节点
    if (!levelNodes.has(level)) levelNodes.set(level, []);
    levelNodes.get(level)!.push(nodeId);
    
    // 处理后续节点
    if (node.type === 'condition' && node.branches) {
      let branchOffset = yOffset - ((node.branches.length - 1) * BRANCH_GAP_Y) / 2;
      node.branches.forEach((branch, idx) => {
        if (branch.nextNodeId && !visited.has(branch.nextNodeId)) {
          queue.push({ 
            nodeId: branch.nextNodeId, 
            level: level + 1,
            yOffset: branchOffset + idx * BRANCH_GAP_Y
          });
        }
      });
    } else if (node.nextNodeId && !visited.has(node.nextNodeId)) {
      queue.push({ nodeId: node.nextNodeId, level: level + 1, yOffset });
    }
  }
  
  // 处理未访问的节点
  nodes.forEach(node => {
    if (!visited.has(node.id)) {
      const maxLevel = Math.max(...Array.from(levelNodes.keys()), 0);
      if (!levelNodes.has(maxLevel + 1)) levelNodes.set(maxLevel + 1, []);
      levelNodes.get(maxLevel + 1)!.push(node.id);
    }
  });
  
  // 计算每个节点的位置
  const maxLevel = Math.max(...Array.from(levelNodes.keys()), 0);
  const centerX = 50; // 起始X
  
  levelNodes.forEach((nodeIds, level) => {
    const totalHeight = (nodeIds.length - 1) * GAP_Y;
    const startY = -totalHeight / 2 + 150; // 居中，加150作为基础偏移
    
    nodeIds.forEach((nodeId, index) => {
      nodePositions.set(nodeId, {
        x: centerX + level * (NODE_WIDTH + GAP_X),
        y: startY + index * GAP_Y,
        level
      });
    });
  });
  
  // 计算SVG画布大小
  let maxX = 0, maxY = 0;
  nodePositions.forEach(pos => {
    maxX = Math.max(maxX, pos.x + NODE_WIDTH + 50);
    maxY = Math.max(maxY, pos.y + NODE_HEIGHT + 50);
  });
  
  // 构建连接线数据
  const connections: { from: string; to: string; label: string }[] = [];
  nodes.forEach(node => {
    if (node.type === 'condition' && node.branches) {
      node.branches.forEach(branch => {
        if (branch.nextNodeId) {
          const conditionLabel = branch.rules?.map(r => r.label || `${r.value}`).join(',') || branch.name;
          connections.push({ from: node.id, to: branch.nextNodeId, label: conditionLabel });
        }
      });
    } else if (node.nextNodeId) {
      connections.push({ from: node.id, to: node.nextNodeId, label: '' });
    }
  });

  // 渲染节点
  const renderNode = (node: WorkflowNode) => {
    const pos = nodePositions.get(node.id);
    if (!pos) return null;
    
    const config = nodeTypeConfig[node.type];
    const isSelected = selectedNodeId === node.id;
    
    // 节点形状
    if (node.type === 'start' || node.type === 'end') {
      // 圆角胶囊形
      return (
        <g key={node.id} onClick={() => onSelectNode(node.id)} style={{ cursor: 'pointer' }}>
          <rect
            x={pos.x}
            y={pos.y}
            width={NODE_WIDTH}
            height={NODE_HEIGHT}
            rx={30}
            ry={30}
            fill={isSelected ? '#dbeafe' : 'white'}
            stroke={config.bgColor.replace('bg-', '').includes('emerald') ? '#10b981' : '#6b7280'}
            strokeWidth={isSelected ? 3 : 2}
          />
          <text
            x={pos.x + NODE_WIDTH / 2}
            y={pos.y + NODE_HEIGHT / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={config.bgColor.includes('emerald') ? '#059669' : '#374151'}
            fontSize="14"
            fontWeight="600"
          >
            {node.name}
          </text>
        </g>
      );
    } else if (node.type === 'condition') {
      // 菱形
      const cx = pos.x + NODE_WIDTH / 2;
      const cy = pos.y + NODE_HEIGHT / 2;
      const hw = NODE_WIDTH / 2;
      const hh = NODE_HEIGHT / 2;
      
      return (
        <g key={node.id} onClick={() => onSelectNode(node.id)} style={{ cursor: 'pointer' }}>
          <polygon
            points={`${cx},${pos.y} ${pos.x + NODE_WIDTH},${cy} ${cx},${pos.y + NODE_HEIGHT} ${pos.x},${cy}`}
            fill={isSelected ? '#fef3c7' : 'white'}
            stroke="#f59e0b"
            strokeWidth={isSelected ? 3 : 2}
          />
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#b45309"
            fontSize="12"
            fontWeight="600"
          >
            {node.name.length > 6 ? node.name.slice(0, 6) + '..' : node.name}
          </text>
        </g>
      );
    } else {
      // 矩形（审批节点）
      return (
        <g key={node.id} onClick={() => onSelectNode(node.id)} style={{ cursor: 'pointer' }}>
          <rect
            x={pos.x}
            y={pos.y}
            width={NODE_WIDTH}
            height={NODE_HEIGHT}
            rx={8}
            ry={8}
            fill={isSelected ? '#dbeafe' : 'white'}
            stroke="#3b82f6"
            strokeWidth={isSelected ? 3 : 2}
          />
          <text
            x={pos.x + NODE_WIDTH / 2}
            y={pos.y + 20}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#1e40af"
            fontSize="13"
            fontWeight="600"
          >
            {node.name.length > 8 ? node.name.slice(0, 8) + '..' : node.name}
          </text>
          {node.approverRole && (
            <text
              x={pos.x + NODE_WIDTH / 2}
              y={pos.y + 40}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#6b7280"
              fontSize="10"
            >
              {roleOptions.find(r => r.value === node.approverRole)?.label || node.approverRole}
            </text>
          )}
        </g>
      );
    }
  };

  // 渲染连接线
  const renderConnection = (conn: { from: string; to: string; label: string }) => {
    const fromPos = nodePositions.get(conn.from);
    const toPos = nodePositions.get(conn.to);
    
    if (!fromPos || !toPos) return null;
    
    const fromNode = nodeMap.get(conn.from);
    const isCondition = fromNode?.type === 'condition';
    
    // 计算起点和终点
    let x1 = fromPos.x + NODE_WIDTH;
    let y1 = fromPos.y + NODE_HEIGHT / 2;
    let x2 = toPos.x;
    let y2 = toPos.y + NODE_HEIGHT / 2;
    
    // 条件节点的起点在菱形右侧
    if (isCondition) {
      x1 = fromPos.x + NODE_WIDTH;
      y1 = fromPos.y + NODE_HEIGHT / 2;
    }
    
    // 如果目标在右侧，调整连接
    const midX = (x1 + x2) / 2;
    
    return (
      <g key={`${conn.from}-${conn.to}`}>
        {/* 连接线 */}
        <path
          d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
          fill="none"
          stroke="#9ca3af"
          strokeWidth={2}
          markerEnd="url(#arrowhead)"
        />
        {/* 标签 */}
        {conn.label && (
          <text
            x={(x1 + x2) / 2}
            y={(y1 + y2) / 2 - 8}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#f59e0b"
            fontSize="11"
            fontWeight="500"
            style={{ backgroundColor: 'white' }}
          >
            {conn.label}
          </text>
        )}
      </g>
    );
  };

  return (
    <div className="p-2 h-full flex flex-col">
      {/* 图例和缩放控制 */}
      <div className="flex items-center justify-between mb-3 px-2 py-2 bg-gray-50 rounded-lg text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-4 rounded-full bg-emerald-500" />
            <span className="text-gray-600">开始</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-4 rounded bg-blue-500" />
            <span className="text-gray-600">审批</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 bg-amber-500" style={{ transform: 'rotate(45deg)', marginLeft: 2, marginRight: 2 }} />
            <span className="text-gray-600">条件</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-4 rounded-full bg-gray-500" />
            <span className="text-gray-600">结束</span>
          </div>
        </div>
        
        {/* 缩放控制 */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title="缩小"
          >
            <ZoomOut className="h-4 w-4 text-gray-600" />
          </button>
          <div className="flex items-center gap-1 min-w-[80px]">
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-16 h-1 accent-blue-500"
            />
            <span className="text-gray-600 font-medium">{Math.round(zoom * 100)}%</span>
          </div>
          <button
            onClick={() => setZoom(Math.min(1.5, zoom + 0.1))}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title="放大"
          >
            <ZoomIn className="h-4 w-4 text-gray-600" />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="p-1 hover:bg-gray-200 rounded transition-colors text-gray-500"
            title="重置缩放"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      {/* SVG 流程图 */}
      <div className="flex-1 overflow-auto border border-gray-100 rounded-lg bg-gray-50/50">
        <svg 
          width={Math.max(maxX, 600) * zoom} 
          height={Math.max(maxY, 300) * zoom}
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
        >
          {/* 箭头定义 */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#9ca3af" />
            </marker>
          </defs>
          
          {/* 连接线 */}
          {connections.map(renderConnection)}
          
          {/* 节点 */}
          {nodes.map(renderNode)}
        </svg>
      </div>
      
      {/* 点击提示 */}
      <p className="text-xs text-gray-400 mt-2 text-center">点击节点可编辑</p>
    </div>
  );
}
