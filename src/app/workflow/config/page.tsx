'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Settings,
  Plus,
  Edit,
  Trash2,
  FileText,
  Wrench,
  ShoppingCart,
  Copy,
  AlertCircle,
  CheckCircle,
  User,
  Clock,
  Zap,
  GitBranch,
  ArrowRightLeft,
  Play,
  Square,
  ChevronRight,
  ChevronDown,
  GripVertical,
  Layers,
  Workflow,
  Sparkles,
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
  { value: 'leave', label: '请假审批', icon: FileText, color: 'bg-blue-100 text-blue-600' },
  { value: 'repair', label: '报修审批', icon: Wrench, color: 'bg-orange-100 text-orange-600' },
  { value: 'purchase', label: '采购审批', icon: ShoppingCart, color: 'bg-green-100 text-green-600' },
];

const nodeTypeConfig: Record<NodeType, { label: string; icon: any; color: string }> = {
  start: { label: '开始', icon: Play, color: 'bg-green-500 text-white' },
  approval: { label: '审批', icon: User, color: 'bg-blue-500 text-white' },
  condition: { label: '条件判断', icon: GitBranch, color: 'bg-amber-500 text-white' },
  parallel: { label: '并行审批', icon: Layers, color: 'bg-purple-500 text-white' },
  end: { label: '结束', icon: Square, color: 'bg-gray-500 text-white' },
};

const rejectActions: { value: RejectAction; label: string; desc: string }[] = [
  { value: 'return_to_applicant', label: '退回申请人', desc: '申请人修改后重新提交' },
  { value: 'return_to_previous', label: '退回上一节点', desc: '退回到上一个审批节点' },
  { value: 'return_to_specific', label: '退回指定节点', desc: '退回到指定的审批节点' },
  { value: 'end_process', label: '流程结束', desc: '直接结束流程，不可修改' },
];

// 预设的请假类型条件
const leaveTypeOptions = [
  { value: '病假', label: '病假' },
  { value: '事假', label: '事假' },
  { value: '公假', label: '公假' },
  { value: '婚假', label: '婚假' },
  { value: '产假', label: '产假' },
  { value: '陪产假', label: '陪产假' },
  { value: '丧假', label: '丧假' },
  { value: '调休', label: '调休' },
  { value: '年假', label: '年假' },
];

// 预设的天数条件
const durationOptions = [
  { value: '1', label: '1天以内' },
  { value: '3', label: '3天以内' },
  { value: '7', label: '7天以内' },
  { value: '15', label: '15天以内' },
  { value: '30', label: '30天以内' },
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

export default function WorkflowConfigPage() {
  const { user } = useAuth();
  const [configs, setConfigs] = useState<WorkflowConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');

  // 编辑弹窗
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<WorkflowConfig | null>(null);
  const [formData, setFormData] = useState<Partial<WorkflowConfig>>({
    type: undefined,
    name: '',
    description: '',
    nodes: [],
  });
  
  // 节点编辑
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [nodeDialogOpen, setNodeDialogOpen] = useState(false);

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const params = selectedType !== 'all' ? `?type=${selectedType}` : '';
      const res = await fetch(`/api/workflow/config${params}`);
      const data = await res.json();
      setConfigs(data.data || []);
    } catch (error) {
      console.error('Failed to fetch configs:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedType]);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const openCreateDialog = (type?: string) => {
    setEditingConfig(null);
    const template = type && workflowTemplates[type] ? workflowTemplates[type] : null;
    setFormData({
      type: type as WorkflowType | undefined,
      name: template?.name || '',
      description: template?.description || '',
      nodes: template?.nodes || [],
      startNodeId: template?.startNodeId,
      endNodeId: template?.endNodeId,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (config: WorkflowConfig) => {
    setEditingConfig(config);
    setFormData({
      type: config.type,
      name: config.name,
      description: config.description || '',
      nodes: config.nodes || [],
      startNodeId: config.startNodeId,
      endNodeId: config.endNodeId,
    });
    setDialogOpen(true);
  };

  const useTemplate = (type: string) => {
    const template = workflowTemplates[type];
    if (template) {
      setFormData({
        ...formData,
        ...template,
        type: type as WorkflowType,
      });
    }
  };

  const handleSubmit = async () => {
    if (!formData.type || !formData.name) {
      alert('请填写流程名称');
      return;
    }

    try {
      const res = await fetch('/api/workflow/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingConfig?.id,
          ...formData,
          nodes: formData.nodes || [],
          createdBy: user?.name,
        }),
      });

      if (res.ok) {
        setDialogOpen(false);
        fetchConfigs();
      }
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个审批流程配置吗？')) return;

    try {
      await fetch(`/api/workflow/config?id=${id}`, { method: 'DELETE' });
      fetchConfigs();
    } catch (error) {
      console.error('Failed to delete config:', error);
    }
  };

  const handleSetActive = async (config: WorkflowConfig) => {
    try {
      const res = await fetch('/api/workflow/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...config,
          isActive: true,
          createdBy: user?.name,
        }),
      });

      if (res.ok) {
        fetchConfigs();
      }
    } catch (error) {
      console.error('Failed to activate config:', error);
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

  const getTypeStyle = (type: string) => {
    return workflowTypes.find(t => t.value === type) || workflowTypes[0];
  };

  // 检查用户是否有权限配置流程
  const canConfig = ['principal', 'secretary', 'vice_principal'].includes(user?.role || '');

  if (!canConfig) {
    return (
      <div className="p-6 lg:p-8">
        <Card className="border-0 shadow-md">
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">无访问权限</h2>
            <p className="text-gray-500">只有校长、书记、分管副校长可以配置审批流程</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">审批流程配置</h1>
          <p className="text-gray-500 mt-1">配置请假、报修、采购的标准化审批流程，支持条件分支</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="全部类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              {workflowTypes.map(t => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => openCreateDialog()} className="gap-2">
            <Plus className="h-4 w-4" />
            新建流程
          </Button>
        </div>
      </div>

      {/* 流程类型卡片 */}
      <div className="grid gap-4 md:grid-cols-3">
        {workflowTypes.map(type => {
          const Icon = type.icon;
          const typeConfigs = configs.filter(c => c.type === type.value);
          const activeConfig = typeConfigs.find(c => c.isActive);
          
          return (
            <Card 
              key={type.value} 
              className={`border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer ${
                selectedType === type.value ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedType(type.value)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${type.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{type.label}</h3>
                    <p className="text-xs text-gray-500">{typeConfigs.length} 个配置</p>
                  </div>
                </div>
                {activeConfig ? (
                  <div className="flex items-center justify-between">
                    <Badge className="bg-green-100 text-green-700">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      启用: {activeConfig.name}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditDialog(activeConfig);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-gray-500">未配置</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openCreateDialog(type.value);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 使用说明 */}
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-2">流程配置说明</p>
              <ul className="list-disc list-inside space-y-1 text-amber-700">
                <li><strong>条件分支</strong>：根据申请类型、天数、金额等条件，走不同的审批路径</li>
                <li><strong>拒绝处理</strong>：可设置拒绝后退回到哪个节点（申请人修改/上一节点/指定节点）</li>
                <li><strong>预设模板</strong>：系统提供标准流程模板，可根据实际情况调整</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 配置列表 */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">流程配置列表</CardTitle>
          <CardDescription>
            {selectedType === 'all' ? '显示所有类型的审批流程配置' : `显示「${getTypeStyle(selectedType).label}」的配置`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : configs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Workflow className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>暂无流程配置</p>
              <Button onClick={() => openCreateDialog()} className="mt-3">
                <Plus className="h-4 w-4 mr-2" />
                创建流程配置
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {configs.map((config) => {
                const typeStyle = getTypeStyle(config.type);
                const Icon = typeStyle.icon;
                
                // 统计节点数量
                const approvalCount = config.nodes?.filter(n => n.type === 'approval').length || 0;
                const conditionCount = config.nodes?.filter(n => n.type === 'condition').length || 0;
                
                return (
                  <div
                    key={config.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                      config.isActive ? 'border-green-200 bg-green-50/50' : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${typeStyle.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900">{config.name}</p>
                        {config.isActive && (
                          <Badge className="bg-green-100 text-green-700 text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            启用中
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {approvalCount} 个审批节点
                        </span>
                        {conditionCount > 0 && (
                          <span className="flex items-center gap-1">
                            <GitBranch className="h-3 w-3" />
                            {conditionCount} 个条件分支
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(config.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!config.isActive && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetActive(config)}
                          className="text-green-600"
                        >
                          启用
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(config)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(config.id as any)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 编辑弹窗 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingConfig ? '编辑流程配置' : '新建流程配置'}</DialogTitle>
            <DialogDescription>
              配置审批流程的节点、条件分支和拒绝处理逻辑
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* 基本信息 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">流程类型 *</label>
                <Select
                  value={formData.type}
                  onValueChange={(v) => setFormData({ ...formData, type: v as WorkflowType })}
                  disabled={!!editingConfig}
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
                <label className="text-sm font-medium text-gray-700">流程名称 *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例如：教师请假审批流程"
                  className="mt-1"
                />
              </div>
            </div>
            
            {/* 快速使用模板 */}
            {formData.type && !editingConfig && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-700">
                  系统提供预设模板，
                </span>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => useTemplate(formData.type!)}
                  className="p-0 h-auto text-blue-600 underline"
                >
                  点击使用模板
                </Button>
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium text-gray-700">流程描述</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="描述这个流程的适用范围和特点"
                rows={2}
                className="mt-1"
              />
            </div>

            {/* 流程节点配置 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700">流程节点</label>
                <div className="flex items-center gap-2">
                  <Select onValueChange={(v) => addNode(v as NodeType)}>
                    <SelectTrigger className="w-32 h-8">
                      <Plus className="h-4 w-4 mr-1" />
                      添加节点
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="start">开始节点</SelectItem>
                      <SelectItem value="approval">审批节点</SelectItem>
                      <SelectItem value="condition">条件分支</SelectItem>
                      <SelectItem value="parallel">并行审批</SelectItem>
                      <SelectItem value="end">结束节点</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {(!formData.nodes || formData.nodes.length === 0) ? (
                <div className="text-center py-8 border-2 border-dashed rounded-lg text-gray-500">
                  <Workflow className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>添加节点构建审批流程</p>
                  <p className="text-xs mt-1">或使用上方预设模板快速创建</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.nodes.map((node, index) => {
                    const nodeConfig = nodeTypeConfig[node.type];
                    const NodeIcon = nodeConfig.icon;
                    
                    return (
                      <Card key={node.id} className="border shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            {/* 节点头部 */}
                            <div className={`p-2 rounded-lg ${nodeConfig.color}`}>
                              <NodeIcon className="h-4 w-4" />
                            </div>
                            
                            <div className="flex-1 space-y-3">
                              {/* 节点基本信息 */}
                              <div className="flex items-center gap-3">
                                <Input
                                  value={node.name}
                                  onChange={(e) => updateNode(node.id, { name: e.target.value })}
                                  className="w-48"
                                  placeholder="节点名称"
                                />
                                <Badge variant="outline">{nodeConfig.label}</Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteNode(node.id)}
                                  className="ml-auto text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              
                              {/* 审批节点配置 */}
                              {node.type === 'approval' && (
                                <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                                  <div>
                                    <label className="text-xs text-gray-500">审批人类型</label>
                                    <Select
                                      value={node.approverType || 'role'}
                                      onValueChange={(v) => updateNode(node.id, { 
                                        approverType: v as 'role' | 'specific',
                                        approverRole: v === 'role' ? node.approverRole : undefined,
                                        approverId: v === 'specific' ? node.approverId : undefined,
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
                                      <label className="text-xs text-gray-500">审批角色</label>
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
                                      <label className="text-xs text-gray-500">指定人员</label>
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
                                  
                                  {/* 拒绝处理 */}
                                  <div className="col-span-2">
                                    <label className="text-xs text-gray-500">拒绝后处理</label>
                                    <Select
                                      value={node.rejectAction || 'return_to_applicant'}
                                      onValueChange={(v) => updateNode(node.id, { 
                                        rejectAction: v as RejectAction 
                                      })}
                                    >
                                      <SelectTrigger className="mt-1">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {rejectActions.map(action => (
                                          <SelectItem key={action.value} value={action.value}>
                                            <div>
                                              <span>{action.label}</span>
                                              <span className="text-xs text-gray-500 ml-2">{action.desc}</span>
                                            </div>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              )}
                              
                              {/* 条件分支节点配置 */}
                              {node.type === 'condition' && (
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-gray-600">条件分支</span>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => addBranch(node.id)}
                                    >
                                      <Plus className="h-3 w-3 mr-1" />
                                      添加分支
                                    </Button>
                                  </div>
                                  
                                  {node.branches?.map((branch, branchIndex) => (
                                    <div key={branch.id} className="border rounded-lg p-3 bg-amber-50/50">
                                      <div className="flex items-center gap-2 mb-2">
                                        <GitBranch className="h-4 w-4 text-amber-600" />
                                        <Input
                                          value={branch.name}
                                          onChange={(e) => updateBranch(node.id, branch.id, { name: e.target.value })}
                                          className="w-32 h-7"
                                          placeholder="分支名称"
                                        />
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => deleteBranch(node.id, branch.id)}
                                          className="text-red-600 ml-auto"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                      
                                      {/* 条件规则 */}
                                      <div className="space-y-2 mb-2">
                                        {branch.rules?.map((rule) => (
                                          <div key={rule.id} className="flex items-center gap-2">
                                            <Select
                                              value={rule.field}
                                              onValueChange={(v) => updateRule(node.id, branch.id, rule.id, { field: v })}
                                            >
                                              <SelectTrigger className="w-24 h-7">
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="type">请假类型</SelectItem>
                                                <SelectItem value="duration">天数</SelectItem>
                                                <SelectItem value="amount">金额</SelectItem>
                                                <SelectItem value="priority">紧急程度</SelectItem>
                                              </SelectContent>
                                            </Select>
                                            
                                            <Select
                                              value={rule.operator}
                                              onValueChange={(v) => updateRule(node.id, branch.id, rule.id, { operator: v as any })}
                                            >
                                              <SelectTrigger className="w-20 h-7">
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="eq">等于</SelectItem>
                                                <SelectItem value="ne">不等于</SelectItem>
                                                <SelectItem value="gt">大于</SelectItem>
                                                <SelectItem value="gte">≥</SelectItem>
                                                <SelectItem value="lt">小于</SelectItem>
                                                <SelectItem value="lte">≤</SelectItem>
                                                <SelectItem value="in">包含</SelectItem>
                                              </SelectContent>
                                            </Select>
                                            
                                            {rule.field === 'type' && formData.type === 'leave' ? (
                                              <Select
                                                value={String(rule.value)}
                                                onValueChange={(v) => updateRule(node.id, branch.id, rule.id, { value: v })}
                                              >
                                                <SelectTrigger className="w-28 h-7">
                                                  <SelectValue placeholder="选择" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  {leaveTypeOptions.map(opt => (
                                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                                  ))}
                                                </SelectContent>
                                              </Select>
                                            ) : (
                                              <Input
                                                value={String(rule.value)}
                                                onChange={(e) => updateRule(node.id, branch.id, rule.id, { 
                                                  value: isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value) 
                                                })}
                                                className="w-24 h-7"
                                                placeholder="值"
                                              />
                                            )}
                                            
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => deleteRule(node.id, branch.id, rule.id)}
                                              className="h-7 w-7 p-0"
                                            >
                                              <Trash2 className="h-3 w-3 text-red-500" />
                                            </Button>
                                          </div>
                                        ))}
                                      </div>
                                      
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => addRule(node.id, branch.id)}
                                        className="h-7 text-xs"
                                      >
                                        <Plus className="h-3 w-3 mr-1" />
                                        添加条件
                                      </Button>
                                      
                                      {/* 下一节点 */}
                                      <div className="flex items-center gap-2 mt-2">
                                        <ArrowRightLeft className="h-3 w-3 text-gray-400" />
                                        <span className="text-xs text-gray-500">跳转到：</span>
                                        <Select
                                          value={branch.nextNodeId || ''}
                                          onValueChange={(v) => updateBranch(node.id, branch.id, { nextNodeId: v })}
                                        >
                                          <SelectTrigger className="w-40 h-7">
                                            <SelectValue placeholder="选择下一节点" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {formData.nodes?.filter(n => n.id !== node.id).map(n => (
                                              <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>
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
                                  <div className="flex items-center gap-2 mt-3 p-2 bg-gray-100 rounded">
                                    <span className="text-xs text-gray-600">默认分支（其他情况）：</span>
                                    <Select
                                      value={node.defaultBranchId || ''}
                                      onValueChange={(v) => updateNode(node.id, { defaultBranchId: v })}
                                    >
                                      <SelectTrigger className="w-40 h-7">
                                        <SelectValue placeholder="选择默认分支" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {node.branches?.map(b => (
                                          <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              )}
                              
                              {/* 下一个节点（非条件节点） */}
                              {node.type !== 'condition' && node.type !== 'end' && (
                                <div className="flex items-center gap-2 mt-2">
                                  <ArrowRightLeft className="h-3 w-3 text-gray-400" />
                                  <span className="text-xs text-gray-500">下一节点：</span>
                                  <Select
                                    value={node.nextNodeId || ''}
                                    onValueChange={(v) => updateNode(node.id, { nextNodeId: v })}
                                  >
                                    <SelectTrigger className="w-40 h-7">
                                      <SelectValue placeholder="选择" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {formData.nodes?.filter(n => n.id !== node.id).map(n => (
                                        <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.type || !formData.name}>
              {editingConfig ? '保存修改' : '创建流程'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
