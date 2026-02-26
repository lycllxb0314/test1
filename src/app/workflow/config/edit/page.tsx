'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Settings,
  Clock,
  RotateCcw,
  CornerDownLeft,
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Copy,
  GripVertical,
  ChevronRight,
  AlertTriangle,
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
  UserRole,
  ConditionOperator
} from '@/types';

const workflowTypes = [
  { value: 'leave', label: '请假审批', icon: FileText },
  { value: 'repair', label: '报修审批', icon: Wrench },
  { value: 'purchase', label: '采购审批', icon: ShoppingCart },
];

const nodeTypeConfig: Record<NodeType, { label: string; icon: any; color: string; bgColor: string; borderColor: string }> = {
  start: { label: '开始', icon: Play, color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-300' },
  approval: { label: '审批', icon: User, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-300' },
  condition: { label: '条件', icon: GitBranch, color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-300' },
  parallel: { label: '并行', icon: Layers, color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-300' },
  end: { label: '结束', icon: Square, color: 'text-gray-600', bgColor: 'bg-gray-50', borderColor: 'border-gray-300' },
};

const rejectActions: { value: RejectAction; label: string; desc: string }[] = [
  { value: 'return_to_applicant', label: '退回申请人', desc: '申请人修改后重新提交' },
  { value: 'return_to_previous', label: '退回上一节点', desc: '退回到上一个审批节点' },
  { value: 'return_to_specific', label: '退回指定节点', desc: '退回到指定的审批节点' },
  { value: 'end_process', label: '流程结束', desc: '直接结束流程' },
];

// 预设流程模板
const workflowTemplates: Record<string, Partial<WorkflowConfig>> = {
  leave: {
    name: '教师请假审批流程',
    description: '根据请假类型和天数，走不同的审批路径',
    nodes: [
      { id: 'start', type: 'start', name: '开始', nextNodeId: 'approval_grade' },
      { id: 'approval_grade', type: 'approval', name: '年级组长审批', approverType: 'role', approverRole: 'head_teacher', rejectAction: 'return_to_applicant', nextNodeId: 'condition_type' },
      { id: 'condition_type', type: 'condition', name: '判断请假类型', branches: [
        { id: 'b1', name: '病假≤3天', conditionType: 'all', rules: [{ id: 'r1', field: 'type', operator: 'eq', value: '病假' }, { id: 'r2', field: 'duration', operator: 'lte', value: '3' }], nextNodeId: 'end' },
        { id: 'b2', name: '病假>3天', conditionType: 'all', rules: [{ id: 'r3', field: 'type', operator: 'eq', value: '病假' }, { id: 'r4', field: 'duration', operator: 'gt', value: '3' }], nextNodeId: 'approval_dean' },
        { id: 'b3', name: '事假≤3天', conditionType: 'all', rules: [{ id: 'r5', field: 'type', operator: 'eq', value: '事假' }, { id: 'r6', field: 'duration', operator: 'lte', value: '3' }], nextNodeId: 'end' },
        { id: 'b4', name: '事假>3天', conditionType: 'all', rules: [{ id: 'r7', field: 'type', operator: 'eq', value: '事假' }, { id: 'r8', field: 'duration', operator: 'gt', value: '3' }], nextNodeId: 'approval_dean' },
        { id: 'b5', name: '公假', conditionType: 'all', rules: [{ id: 'r9', field: 'type', operator: 'eq', value: '公假' }], nextNodeId: 'approval_dean' },
      ], defaultBranchId: 'b3' },
      { id: 'approval_dean', type: 'approval', name: '教务主任审批', approverType: 'role', approverRole: 'academic_director', rejectAction: 'return_to_previous', nextNodeId: 'end' },
      { id: 'end', type: 'end', name: '结束' },
    ],
  },
  repair: {
    name: '报修审批流程',
    description: '根据报修金额走不同审批路径',
    nodes: [
      { id: 'start', type: 'start', name: '开始', nextNodeId: 'condition_amount' },
      { id: 'condition_amount', type: 'condition', name: '判断金额', branches: [
        { id: 'b1', name: '≤500元', conditionType: 'all', rules: [{ id: 'r1', field: 'amount', operator: 'lte', value: '500' }], nextNodeId: 'approval_manager' },
        { id: 'b2', name: '>500元', conditionType: 'all', rules: [{ id: 'r2', field: 'amount', operator: 'gt', value: '500' }], nextNodeId: 'approval_principal' },
      ], defaultBranchId: 'b1' },
      { id: 'approval_manager', type: 'approval', name: '总务主任审批', approverType: 'role', approverRole: 'general_director', rejectAction: 'return_to_applicant', nextNodeId: 'end' },
      { id: 'approval_principal', type: 'approval', name: '校长审批', approverType: 'role', approverRole: 'principal', rejectAction: 'return_to_applicant', nextNodeId: 'end' },
      { id: 'end', type: 'end', name: '结束' },
    ],
  },
  purchase: {
    name: '采购审批流程',
    description: '根据采购金额走不同审批路径',
    nodes: [
      { id: 'start', type: 'start', name: '开始', nextNodeId: 'condition_amount' },
      { id: 'condition_amount', type: 'condition', name: '判断金额', branches: [
        { id: 'b1', name: '≤1000元', conditionType: 'all', rules: [{ id: 'r1', field: 'amount', operator: 'lte', value: '1000' }], nextNodeId: 'approval_manager' },
        { id: 'b2', name: '1000-5000元', conditionType: 'all', rules: [{ id: 'r2', field: 'amount', operator: 'lte', value: '5000' }], nextNodeId: 'approval_dean' },
        { id: 'b3', name: '>5000元', conditionType: 'all', rules: [{ id: 'r3', field: 'amount', operator: 'gt', value: '5000' }], nextNodeId: 'approval_principal' },
      ], defaultBranchId: 'b1' },
      { id: 'approval_manager', type: 'approval', name: '部门负责人审批', approverType: 'role', approverRole: 'head_teacher', rejectAction: 'return_to_applicant', nextNodeId: 'end' },
      { id: 'approval_dean', type: 'approval', name: '总务主任审批', approverType: 'role', approverRole: 'general_director', rejectAction: 'return_to_applicant', nextNodeId: 'end' },
      { id: 'approval_principal', type: 'approval', name: '校长审批', approverType: 'role', approverRole: 'principal', rejectAction: 'return_to_applicant', nextNodeId: 'end' },
      { id: 'end', type: 'end', name: '结束' },
    ],
  },
};

export default function WorkflowConfigEditPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const configId = searchParams.get('id');
  const typeParam = searchParams.get('type');
  const { user } = useAuth();

  const [formData, setFormData] = useState<WorkflowConfig>({
    id: '',
    type: (typeParam as WorkflowType) || 'leave',
    name: '',
    description: '',
    version: 1,
    nodes: [],
    startNodeId: '',
    endNodeId: '',
    isActive: true,
    createdBy: user?.id || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  
  const [saving, setSaving] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showNodePanel, setShowNodePanel] = useState(false);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // 连接线拖拽状态
  const [connectingFrom, setConnectingFrom] = useState<{ nodeId: string; branchId?: string } | null>(null);
  const [connectingTo, setConnectingTo] = useState<{ x: number; y: number } | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  
  // 节点位置 - 支持拖拽调整
  const [nodePositions, setNodePositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  
  const canvasRef = useRef<HTMLDivElement>(null);

  // 加载现有配置
  useEffect(() => {
    if (configId) {
      fetch(`/api/workflow/config?id=${configId}`)
        .then(res => res.json())
        .then(data => {
          if (data.config) {
            setFormData(data.config);
          }
        })
        .catch(console.error);
    }
  }, [configId]);

  // 自动布局节点
  const autoLayoutNodes = useCallback((nodes: WorkflowNode[]) => {
    const positions = new Map<string, { x: number; y: number }>();
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    
    const NODE_WIDTH = 180;
    const NODE_HEIGHT = 80;
    const GAP_X = 200;
    const BRANCH_GAP_Y = 150;
    
    const startNode = nodes.find(n => n.type === 'start');
    if (!startNode) return positions;
    
    const visited = new Set<string>();
    const queue: { nodeId: string; level: number; yOffset: number }[] = [{ nodeId: startNode.id, level: 0, yOffset: 0 }];
    
    while (queue.length > 0) {
      const { nodeId, level, yOffset } = queue.shift()!;
      
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);
      
      positions.set(nodeId, { x: 80 + level * (NODE_WIDTH + GAP_X), y: 100 + yOffset });
      
      const node = nodeMap.get(nodeId);
      if (!node) continue;
      
      if (node.type === 'condition' && node.branches) {
        const totalHeight = (node.branches.length - 1) * BRANCH_GAP_Y;
        let branchOffset = yOffset - totalHeight / 2;
        
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
    
    // 孤立节点
    let orphanY = 100;
    nodes.forEach(node => {
      if (!visited.has(node.id)) {
        const maxLevel = Math.max(...Array.from(positions.values()).map(p => Math.floor((p.x - 80) / GAP_X)), 0);
        positions.set(node.id, { x: 80 + (maxLevel + 1) * (NODE_WIDTH + GAP_X), y: orphanY });
        orphanY += NODE_HEIGHT + 50;
      }
    });
    
    return positions;
  }, []);

  // 当节点变化时自动布局
  useEffect(() => {
    if (formData.nodes && formData.nodes.length > 0) {
      const autoPositions = autoLayoutNodes(formData.nodes);
      // 合并自动布局和手动调整的位置
      setNodePositions(prev => {
        const newPositions = new Map(autoPositions);
        prev.forEach((pos, id) => {
          if (autoPositions.has(id)) {
            // 保留用户手动调整的位置
            newPositions.set(id, pos);
          }
        });
        return newPositions;
      });
    }
  }, [formData.nodes, autoLayoutNodes]);

  // 保存配置
  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('请输入流程名称');
      return;
    }
    
    if (!formData.nodes.find(n => n.type === 'start')) {
      alert('请添加开始节点');
      return;
    }
    
    if (!formData.nodes.find(n => n.type === 'end')) {
      alert('请添加结束节点');
      return;
    }
    
    setSaving(true);
    try {
      const res = await fetch('/api/workflow/config', {
        method: configId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, nodePositions: Object.fromEntries(nodePositions) }),
      });
      
      if (res.ok) {
        router.push('/workflow/config');
      } else {
        const data = await res.json();
        alert(data.error || '保存失败');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 使用模板
  const useTemplate = (type: WorkflowType) => {
    const template = workflowTemplates[type];
    if (template) {
      setFormData(prev => ({
        ...prev,
        ...template,
        type,
      }));
      setSelectedNodeId(null);
      setShowNodePanel(false);
    }
  };

  // 添加节点
  const addNode = (type: NodeType, afterNodeId?: string) => {
    const newNode: WorkflowNode = {
      id: `node_${Date.now()}`,
      type,
      name: nodeTypeConfig[type].label,
      ...(type === 'approval' ? { approverType: 'role', approverRole: undefined, rejectAction: 'return_to_applicant' } : {}),
      ...(type === 'condition' ? { branches: [], defaultBranchId: undefined } : {}),
    };
    
    setFormData(prev => {
      const newNodes = [...(prev.nodes || []), newNode];
      
      // 如果指定了前置节点，更新连接
      if (afterNodeId) {
        const afterNode = newNodes.find(n => n.id === afterNodeId);
        if (afterNode && afterNode.type !== 'condition') {
          afterNode.nextNodeId = newNode.id;
        }
      }
      
      return { ...prev, nodes: newNodes };
    });
    
    setSelectedNodeId(newNode.id);
    setShowNodePanel(true);
    return newNode.id;
  };

  // 更新节点
  const updateNode = (nodeId: string, updates: Partial<WorkflowNode>) => {
    setFormData(prev => ({
      ...prev,
      nodes: (prev.nodes || []).map(node => 
        node.id === nodeId ? { ...node, ...updates } : node
      ),
    }));
  };

  // 删除节点
  const deleteNode = (nodeId: string) => {
    const node = formData.nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    // 更新指向此节点的其他节点
    const newNodes = formData.nodes
      .filter(n => n.id !== nodeId)
      .map(n => {
        if (n.nextNodeId === nodeId) {
          return { ...n, nextNodeId: '' };
        }
        if (n.type === 'condition' && n.branches) {
          return {
            ...n,
            branches: n.branches.map(b => 
              b.nextNodeId === nodeId ? { ...b, nextNodeId: '' } : b
            ),
          };
        }
        return n;
      }) as WorkflowNode[];
    
    setFormData(prev => ({ ...prev, nodes: newNodes }));
    setNodePositions(prev => {
      const newPositions = new Map(prev);
      newPositions.delete(nodeId);
      return newPositions;
    });
    
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
      setShowNodePanel(false);
    }
  };

  // 添加条件分支
  const addBranch = (nodeId: string) => {
    const node = formData.nodes.find(n => n.id === nodeId);
    if (!node || node.type !== 'condition') return;
    
    const newBranch: ConditionBranch = {
      id: `branch_${Date.now()}`,
      name: `分支 ${(node.branches?.length || 0) + 1}`,
      conditionType: 'all',
      rules: [],
      nextNodeId: '',
    };
    
    updateNode(nodeId, { branches: [...(node.branches || []), newBranch] });
  };

  // 更新条件分支
  const updateBranch = (nodeId: string, branchId: string, updates: Partial<ConditionBranch>) => {
    const node = formData.nodes.find(n => n.id === nodeId);
    if (!node || node.type !== 'condition') return;
    
    const newBranches = (node.branches || []).map(branch =>
      branch.id === branchId ? { ...branch, ...updates } : branch
    );
    
    updateNode(nodeId, { branches: newBranches });
  };

  // 删除条件分支
  const deleteBranch = (nodeId: string, branchId: string) => {
    const node = formData.nodes.find(n => n.id === nodeId);
    if (!node || node.type !== 'condition') return;
    
    const newBranches = (node.branches || []).filter(b => b.id !== branchId);
    updateNode(nodeId, { branches: newBranches });
  };

  // 添加条件规则
  const addRule = (nodeId: string, branchId: string) => {
    const node = formData.nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    const branch = (node.branches || []).find(b => b.id === branchId);
    if (!branch) return;
    
    const newRule: ConditionRule = {
      id: `rule_${Date.now()}`,
      field: 'type',
      operator: 'eq',
      value: '',
    };
    
    updateBranch(nodeId, branchId, { rules: [...(branch.rules || []), newRule] });
  };

  // 更新条件规则
  const updateRule = (nodeId: string, branchId: string, ruleId: string, updates: Partial<ConditionRule>) => {
    const node = formData.nodes.find(n => n.id === nodeId);
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
    const node = formData.nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    const branch = (node.branches || []).find(b => b.id === branchId);
    if (!branch) return;
    
    const newRules = (branch.rules || []).filter(r => r.id !== ruleId);
    updateBranch(nodeId, branchId, { rules: newRules });
  };

  const nodes = formData.nodes || [];
  const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;

  // 拖拽处理
  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    const pos = nodePositions.get(nodeId);
    if (!pos) return;
    
    setDraggedNodeId(nodeId);
    setDragOffset({
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    });
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // 处理连接线拖拽
    if (connectingFrom) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        setConnectingTo({
          x: (e.clientX - rect.left) / zoom,
          y: (e.clientY - rect.top) / zoom,
        });
      }
      return;
    }
    
    // 处理节点拖拽
    if (!draggedNodeId) return;
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    setNodePositions(prev => {
      const newPositions = new Map(prev);
      newPositions.set(draggedNodeId, { x: Math.max(0, newX), y: Math.max(0, newY) });
      return newPositions;
    });
  }, [draggedNodeId, dragOffset, connectingFrom, zoom]);

  const handleMouseUp = useCallback(() => {
    // 只是清除拖拽状态，不清除连接状态
    // 连接状态在节点点击或画布点击时清除
    setDraggedNodeId(null);
  }, []);

  // 点击空白处取消选中
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      setSelectedNodeId(null);
      setShowNodePanel(false);
      // 取消连接
      setConnectingFrom(null);
      setConnectingTo(null);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* 顶部工具栏 */}
      <div className="bg-white border-b px-4 py-2 flex items-center justify-between flex-shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/workflow/config')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            返回
          </Button>
          <div className="h-5 w-px bg-gray-200" />
          
          {/* 流程类型 */}
          <Select
            value={formData.type}
            onValueChange={(v) => setFormData(prev => ({ ...prev, type: v as WorkflowType }))}
            disabled={!!configId}
          >
            <SelectTrigger className="w-32 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {workflowTypes.map(t => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* 流程名称 */}
          <Input
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="输入流程名称"
            className="w-48 h-8"
          />
        </div>
        
        <div className="flex items-center gap-2">
          {/* 模板按钮 */}
          {formData.type && !configId && nodes.length === 0 && (
            <Button variant="outline" size="sm" onClick={() => useTemplate(formData.type)} className="gap-1">
              <Sparkles className="h-4 w-4" />
              使用模板
            </Button>
          )}
          
          {/* 缩放控制 */}
          <div className="flex items-center gap-1 border rounded-lg px-2 py-1">
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-xs text-gray-600 w-12 text-center">{Math.round(zoom * 100)}%</span>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setZoom(Math.min(1.5, zoom + 0.1))}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setZoom(1)}>
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
          
          <Button onClick={handleSave} disabled={saving} size="sm" className="gap-1">
            {saving ? <Clock className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? '保存中...' : '保存'}
          </Button>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧工具栏 - 添加节点 */}
        <div className="w-16 bg-white border-r flex flex-col items-center py-4 gap-2 flex-shrink-0">
          <span className="text-xs text-gray-400 mb-2">节点</span>
          {(Object.keys(nodeTypeConfig) as NodeType[]).map(type => {
            const config = nodeTypeConfig[type];
            const Icon = config.icon;
            return (
              <Button
                key={type}
                variant="outline"
                size="sm"
                onClick={() => addNode(type)}
                className={`w-12 h-12 p-0 flex flex-col items-center justify-center gap-0.5 ${config.bgColor} ${config.borderColor} border-2 hover:scale-105 transition-transform`}
                title={`添加${config.label}节点`}
              >
                <Icon className={`h-5 w-5 ${config.color}`} />
                <span className="text-[10px] text-gray-600">{config.label}</span>
              </Button>
            );
          })}
        </div>

        {/* 画布区域 */}
        <div 
          ref={canvasRef}
          className="flex-1 overflow-auto relative"
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          onMouseUp={(e) => {
            // 如果在画布空白处释放，取消连接
            if (connectingFrom && e.target === canvasRef.current) {
              setConnectingFrom(null);
              setConnectingTo(null);
            }
            handleMouseUp();
          }}
          onMouseLeave={() => {
            // 鼠标离开画布时取消连接
            if (connectingFrom) {
              setConnectingFrom(null);
              setConnectingTo(null);
            }
            setDraggedNodeId(null);
          }}
          style={{ cursor: connectingFrom ? 'crosshair' : (draggedNodeId ? 'grabbing' : 'default') }}
        >
          {/* 网格背景 */}
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
              backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
              width: '200%',
              height: '200%',
            }}
          />
          
          {/* 流程图 */}
          <div 
            className="absolute inset-0"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
            }}
          >
            {nodes.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-400">
                  <Workflow className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">点击左侧按钮添加节点</p>
                  <p className="text-sm mt-2">或使用模板快速开始</p>
                </div>
              </div>
            ) : (
              <>
                {/* 连接线 SVG */}
                <svg className="absolute inset-0" style={{ width: '100%', height: '100%', pointerEvents: 'none' }}>
                  <defs>
                    <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                      <path d="M0,0 L0,6 L9,3 z" fill="#9ca3af" />
                    </marker>
                    <marker id="arrow-blue" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                      <path d="M0,0 L0,6 L9,3 z" fill="#3b82f6" />
                    </marker>
                  </defs>
                  
                  {/* 已有连接线 */}
                  {nodes.map(node => {
                    const pos = nodePositions.get(node.id);
                    if (!pos) return null;
                    
                    if (node.type === 'condition' && node.branches) {
                      return node.branches.map((branch, idx) => {
                        if (!branch.nextNodeId) return null;
                        const targetPos = nodePositions.get(branch.nextNodeId);
                        if (!targetPos) return null;
                        
                        // 分支连接点位置
                        const branchY = pos.y + 20 + idx * 24;
                        const x1 = pos.x + 176;
                        const y1 = branchY;
                        const x2 = targetPos.x;
                        const y2 = targetPos.y + 40;
                        
                        return (
                          <g key={branch.id}>
                            <path
                              d={`M ${x1} ${y1} C ${x1 + 50} ${y1}, ${x2 - 50} ${y2}, ${x2} ${y2}`}
                              fill="none"
                              stroke="#9ca3af"
                              strokeWidth={2}
                              markerEnd="url(#arrow)"
                              className="pointer-events-auto cursor-pointer hover:stroke-red-400"
                              onClick={(e) => {
                                e.stopPropagation();
                                // 点击连接线可以断开连接
                                if (confirm('是否断开此连接？')) {
                                  updateBranch(node.id, branch.id, { nextNodeId: '' });
                                }
                              }}
                            />
                            {/* 分支标签 */}
                            <g transform={`translate(${(x1 + x2) / 2}, ${(y1 + y2) / 2})`}>
                              <rect
                                x={-28}
                                y={-10}
                                width={56}
                                height={18}
                                fill="white"
                                stroke="#fbbf24"
                                strokeWidth={1}
                                rx={4}
                              />
                              <text
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill="#92400e"
                                fontSize="10"
                              >
                                {branch.name.length > 5 ? branch.name.slice(0, 5) + '..' : branch.name}
                              </text>
                            </g>
                          </g>
                        );
                      });
                    } else if (node.nextNodeId) {
                      const targetPos = nodePositions.get(node.nextNodeId);
                      if (!targetPos) return null;
                      
                      const x1 = pos.x + 176;
                      const y1 = pos.y + 40;
                      const x2 = targetPos.x;
                      const y2 = targetPos.y + 40;
                      
                      return (
                        <path
                          key={`${node.id}-${node.nextNodeId}`}
                          d={`M ${x1} ${y1} C ${x1 + 50} ${y1}, ${x2 - 50} ${y2}, ${x2} ${y2}`}
                          fill="none"
                          stroke="#9ca3af"
                          strokeWidth={2}
                          markerEnd="url(#arrow)"
                          className="pointer-events-auto cursor-pointer hover:stroke-red-400"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('是否断开此连接？')) {
                              updateNode(node.id, { nextNodeId: '' });
                            }
                          }}
                        />
                      );
                    }
                    return null;
                  })}
                  
                  {/* 正在拖拽的连接线 */}
                  {connectingFrom && connectingTo && (() => {
                    const fromPos = nodePositions.get(connectingFrom.nodeId);
                    if (!fromPos) return null;
                    
                    const fromNode = nodes.find(n => n.id === connectingFrom.nodeId);
                    let x1, y1;
                    
                    if (connectingFrom.branchId && fromNode?.type === 'condition') {
                      const branchIdx = fromNode.branches?.findIndex(b => b.id === connectingFrom.branchId) ?? 0;
                      x1 = fromPos.x + 176;
                      y1 = fromPos.y + 20 + branchIdx * 24;
                    } else {
                      x1 = fromPos.x + 176;
                      y1 = fromPos.y + 40;
                    }
                    
                    return (
                      <path
                        d={`M ${x1} ${y1} C ${x1 + 50} ${y1}, ${connectingTo.x - 50} ${connectingTo.y}, ${connectingTo.x} ${connectingTo.y}`}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        strokeDasharray="5,5"
                        markerEnd="url(#arrow-blue)"
                      />
                    );
                  })()}
                </svg>
                
                {/* 节点 */}
                {nodes.map(node => {
                  const pos = nodePositions.get(node.id);
                  if (!pos) return null;
                  
                  const config = nodeTypeConfig[node.type];
                  const Icon = config.icon;
                  const isSelected = selectedNodeId === node.id;
                  const isHovered = hoveredNodeId === node.id;
                  const canConnect = connectingFrom && connectingFrom.nodeId !== node.id;
                  
                  return (
                    <div
                      key={node.id}
                      data-node-id={node.id}
                      className={`absolute group transition-all ${
                        isSelected ? 'z-10' : 'z-0'
                      } ${canConnect ? 'cursor-pointer' : ''}`}
                      style={{ left: pos.x, top: pos.y }}
                      onClick={(e) => {
                        e.stopPropagation();
                        
                        // 如果正在连接且点击了目标节点
                        if (connectingFrom && connectingFrom.nodeId !== node.id) {
                          e.preventDefault();
                          // 建立连接
                          if (connectingFrom.branchId) {
                            updateBranch(connectingFrom.nodeId, connectingFrom.branchId, { nextNodeId: node.id });
                          } else {
                            updateNode(connectingFrom.nodeId, { nextNodeId: node.id });
                          }
                          setConnectingFrom(null);
                          setConnectingTo(null);
                          return;
                        }
                        
                        setSelectedNodeId(node.id);
                        setShowNodePanel(true);
                      }}
                      onMouseUp={(e) => {
                        // 鼠标释放时建立连接（替代onClick，更可靠）
                        if (connectingFrom && connectingFrom.nodeId !== node.id) {
                          e.stopPropagation();
                          // 建立连接
                          if (connectingFrom.branchId) {
                            updateBranch(connectingFrom.nodeId, connectingFrom.branchId, { nextNodeId: node.id });
                          } else {
                            updateNode(connectingFrom.nodeId, { nextNodeId: node.id });
                          }
                          setConnectingFrom(null);
                          setConnectingTo(null);
                        }
                      }}
                      onMouseEnter={() => setHoveredNodeId(node.id)}
                      onMouseLeave={() => setHoveredNodeId(null)}
                    >
                      {/* 左侧输入连接点 - 始终显示 */}
                      {node.type !== 'start' && (
                        <div
                          className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 bg-white transition-all ${
                            canConnect ? 'border-blue-500 scale-125 ring-2 ring-blue-200' : 'border-gray-400'
                          }`}
                          style={{ opacity: canConnect ? 1 : (isHovered || isSelected ? 1 : 0.7) }}
                        />
                      )}
                      
                      {/* 节点卡片 */}
                      <div
                        className={`w-44 rounded-lg border-2 shadow-sm transition-all ${
                          canConnect ? 'ring-2 ring-blue-300 ring-offset-1' : ''
                        } ${
                          isSelected 
                            ? `${config.bgColor} ${config.borderColor} shadow-lg ring-2 ring-offset-2 ring-blue-400` 
                            : `bg-white ${config.borderColor} hover:shadow-md`
                        }`}
                        onMouseDown={(e) => {
                          // 只有点击卡片本身（不是连接点）才拖拽
                          if ((e.target as HTMLElement).closest('.connection-handle')) return;
                          handleMouseDown(e, node.id);
                        }}
                      >
                        {/* 拖拽手柄 */}
                        <div className="flex items-center justify-center h-5 border-b cursor-grab active:cursor-grabbing">
                          <GripVertical className="h-3 w-3 text-gray-300" />
                        </div>
                        
                        {/* 节点内容 */}
                        <div className="p-3">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded ${config.bgColor}`}>
                              <Icon className={`h-4 w-4 ${config.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className={`font-medium text-sm truncate ${isSelected ? config.color : 'text-gray-900'}`}>
                                {node.name}
                              </div>
                              <div className="text-xs text-gray-400">{config.label}</div>
                            </div>
                          </div>
                          
                          {/* 审批节点显示审批人 */}
                          {node.type === 'approval' && node.approverRole && (
                            <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {roleOptions.find(r => r.value === node.approverRole)?.label}
                            </div>
                          )}
                          
                          {/* 条件节点显示分支数 */}
                          {node.type === 'condition' && (
                            <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                              <GitBranch className="h-3 w-3" />
                              {node.branches?.length || 0} 个分支
                            </div>
                          )}
                        </div>
                        
                        {/* 删除按钮 - 只有开始节点不能删除 */}
                        {node.type !== 'start' && (
                          <button
                            className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-20"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNode(node.id);
                            }}
                            title="删除节点"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      
                      {/* 右侧输出连接点 - 始终显示 */}
                      {node.type !== 'end' && (
                        node.type === 'condition' && node.branches ? (
                          // 条件节点：每个分支一个连接点
                          node.branches.map((branch, idx) => (
                            <div
                              key={branch.id}
                              className="connection-handle absolute right-0 flex items-center"
                              style={{ 
                                top: `${20 + idx * 24}px`,
                                transform: 'translateX(50%)'
                              }}
                            >
                              {/* 分支名称标签 */}
                              <div 
                                className="absolute right-5 whitespace-nowrap text-[10px] text-gray-600 bg-amber-50 border px-1.5 py-0.5 rounded"
                                title={branch.name}
                              >
                                {branch.name.length > 4 ? branch.name.slice(0, 4) + '..' : branch.name}
                              </div>
                              {/* 连接点 - 始终可见 */}
                              <div
                                className={`w-5 h-5 rounded-full border-2 cursor-crosshair transition-all flex items-center justify-center ${
                                  branch.nextNodeId 
                                    ? 'bg-green-100 border-green-500' 
                                    : 'bg-white border-blue-400 hover:bg-blue-50 hover:scale-110'
                                }`}
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  setConnectingFrom({ nodeId: node.id, branchId: branch.id });
                                }}
                                title="拖拽连接到目标节点"
                              >
                                {branch.nextNodeId && (
                                  <div className="w-2 h-2 rounded-full bg-green-500" />
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          // 普通节点：单个输出连接点 - 始终可见
                          <div
                            className="connection-handle absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2"
                          >
                            <div
                              className={`w-5 h-5 rounded-full border-2 cursor-crosshair transition-all flex items-center justify-center ${
                                node.nextNodeId 
                                  ? 'bg-green-100 border-green-500' 
                                  : 'bg-white border-blue-400 hover:bg-blue-50 hover:scale-110'
                              }`}
                              style={{ opacity: isHovered || isSelected ? 1 : 0.8 }}
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                setConnectingFrom({ nodeId: node.id });
                              }}
                              title="拖拽连接到目标节点"
                            >
                              {node.nextNodeId && (
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {/* 右侧节点编辑面板 */}
        {showNodePanel && selectedNode && (
          <div className="w-80 bg-white border-l flex-shrink-0 overflow-y-auto">
            <div className="p-4 border-b sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded ${nodeTypeConfig[selectedNode.type].bgColor}`}>
                    {React.createElement(nodeTypeConfig[selectedNode.type].icon, { 
                      className: `h-4 w-4 ${nodeTypeConfig[selectedNode.type].color}` 
                    })}
                  </div>
                  <span className="font-medium">编辑节点</span>
                </div>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowNodePanel(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="p-4 space-y-4">
              {/* 节点名称 */}
              <div>
                <Label className="text-sm text-gray-600">节点名称</Label>
                <Input
                  value={selectedNode.name}
                  onChange={(e) => updateNode(selectedNode.id, { name: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              
              {/* 审批节点配置 */}
              {selectedNode.type === 'approval' && (
                <>
                  <div>
                    <Label className="text-sm text-gray-600">审批人类型</Label>
                    <div className="flex gap-2 mt-1.5">
                      <Button
                        variant={(selectedNode.approverType || 'role') === 'role' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateNode(selectedNode.id, { approverType: 'role' })}
                        className="flex-1"
                      >
                        按角色
                      </Button>
                      <Button
                        variant={selectedNode.approverType === 'specific' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateNode(selectedNode.id, { approverType: 'specific' })}
                        className="flex-1"
                      >
                        指定人员
                      </Button>
                    </div>
                  </div>
                  
                  {selectedNode.approverType === 'role' ? (
                    <div>
                      <Label className="text-sm text-gray-600">选择角色</Label>
                      <Select
                        value={selectedNode.approverRole || ''}
                        onValueChange={(v) => updateNode(selectedNode.id, { approverRole: v as UserRole })}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="选择角色" />
                        </SelectTrigger>
                        <SelectContent>
                          {roleOptions.map(role => (
                            <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div>
                      <Label className="text-sm text-gray-600">指定人员</Label>
                      <Input
                        value={selectedNode.approverName || ''}
                        onChange={(e) => updateNode(selectedNode.id, { approverName: e.target.value })}
                        placeholder="输入人员姓名"
                        className="mt-1.5"
                      />
                    </div>
                  )}
                  
                  <div>
                    <Label className="text-sm text-gray-600">拒绝后处理</Label>
                    <Select
                      value={selectedNode.rejectAction || 'return_to_applicant'}
                      onValueChange={(v) => updateNode(selectedNode.id, { rejectAction: v as RejectAction })}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {rejectActions.map(action => (
                          <SelectItem key={action.value} value={action.value}>
                            <div>
                              <div>{action.label}</div>
                              <div className="text-xs text-gray-400">{action.desc}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-sm text-gray-600">下一个节点</Label>
                    <Select
                      value={selectedNode.nextNodeId || ''}
                      onValueChange={(v) => updateNode(selectedNode.id, { nextNodeId: v })}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="选择下一个节点" />
                      </SelectTrigger>
                      <SelectContent>
                        {nodes.filter(n => n.id !== selectedNode.id).map(n => (
                          <SelectItem key={n.id} value={n.id}>
                            {nodeTypeConfig[n.type].label} - {n.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              
              {/* 条件节点配置 */}
              {selectedNode.type === 'condition' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-gray-600">条件分支</Label>
                    <Button variant="outline" size="sm" onClick={() => addBranch(selectedNode.id)} className="h-7">
                      <Plus className="h-3 w-3 mr-1" />
                      添加
                    </Button>
                  </div>
                  
                  {(selectedNode.branches || []).map((branch, idx) => (
                    <Card key={branch.id} className="border-amber-200">
                      <CardHeader className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-amber-50">分支 {idx + 1}</Badge>
                          <Input
                            value={branch.name}
                            onChange={(e) => updateBranch(selectedNode.id, branch.id, { name: e.target.value })}
                            className="h-7 flex-1"
                            placeholder="分支名称"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteBranch(selectedNode.id, branch.id)}
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="py-2 px-3 space-y-2">
                        {/* 条件规则 */}
                        {(branch.rules || []).map((rule, ruleIdx) => (
                          <div key={rule.id} className="flex items-center gap-1 text-xs">
                            {ruleIdx > 0 && <Badge variant="secondary" className="h-5 text-[10px]">且</Badge>}
                            <Select
                              value={rule.field}
                              onValueChange={(v) => updateRule(selectedNode.id, branch.id, rule.id, { field: v })}
                            >
                              <SelectTrigger className="w-14 h-6 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="type">类型</SelectItem>
                                <SelectItem value="duration">天数</SelectItem>
                                <SelectItem value="amount">金额</SelectItem>
                              </SelectContent>
                            </Select>
                            <Select
                              value={rule.operator}
                              onValueChange={(v) => updateRule(selectedNode.id, branch.id, rule.id, { operator: v as ConditionOperator })}
                            >
                              <SelectTrigger className="w-12 h-6 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="eq">=</SelectItem>
                                <SelectItem value="neq">≠</SelectItem>
                                <SelectItem value="gt">&gt;</SelectItem>
                                <SelectItem value="gte">≥</SelectItem>
                                <SelectItem value="lt">&lt;</SelectItem>
                                <SelectItem value="lte">≤</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              value={rule.value}
                              onChange={(e) => updateRule(selectedNode.id, branch.id, rule.id, { value: e.target.value })}
                              className="w-16 h-6 text-xs"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteRule(selectedNode.id, branch.id, rule.id)}
                              className="h-5 w-5 p-0 text-gray-400 hover:text-red-500"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => addRule(selectedNode.id, branch.id)}
                          className="h-6 text-xs text-gray-500"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          添加条件
                        </Button>
                        
                        {/* 目标节点 */}
                        <div className="pt-2 border-t">
                          <Label className="text-xs text-gray-400">跳转到</Label>
                          <Select
                            value={branch.nextNodeId || ''}
                            onValueChange={(v) => updateBranch(selectedNode.id, branch.id, { nextNodeId: v })}
                          >
                            <SelectTrigger className="h-7 text-xs mt-1">
                              <SelectValue placeholder="选择目标节点" />
                            </SelectTrigger>
                            <SelectContent>
                              {nodes.filter(n => n.id !== selectedNode.id).map(n => (
                                <SelectItem key={n.id} value={n.id}>
                                  {nodeTypeConfig[n.type].label} - {n.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {(selectedNode.branches?.length || 0) > 0 && (
                    <div>
                      <Label className="text-sm text-gray-600">默认分支</Label>
                      <Select
                        value={selectedNode.defaultBranchId || ''}
                        onValueChange={(v) => updateNode(selectedNode.id, { defaultBranchId: v })}
                      >
                        <SelectTrigger className="mt-1.5">
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
              
              {/* 开始节点配置 */}
              {selectedNode.type === 'start' && (
                <div>
                  <Label className="text-sm text-gray-600">下一个节点</Label>
                  <Select
                    value={selectedNode.nextNodeId || ''}
                    onValueChange={(v) => updateNode(selectedNode.id, { nextNodeId: v })}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="选择第一个节点" />
                    </SelectTrigger>
                    <SelectContent>
                      {nodes.filter(n => n.id !== selectedNode.id).map(n => (
                        <SelectItem key={n.id} value={n.id}>
                          {nodeTypeConfig[n.type].label} - {n.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {/* 删除节点按钮 */}
              {selectedNode.type !== 'start' && selectedNode.type !== 'end' && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteNode(selectedNode.id)}
                  className="w-full gap-1 mt-4"
                >
                  <Trash2 className="h-4 w-4" />
                  删除此节点
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* 底部提示 */}
      <div className="bg-white border-t px-4 py-2 flex items-center justify-between text-xs text-gray-500 flex-shrink-0">
        <div className="flex items-center gap-4">
          <span>节点: {nodes.length}</span>
          <span>|</span>
          <span>从右侧圆点拖拽连接节点</span>
          <span>|</span>
          <span>点击连接线可断开</span>
        </div>
        <div className="flex items-center gap-2">
          {!nodes.find(n => n.type === 'start') && (
            <span className="text-red-500 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              缺少开始节点
            </span>
          )}
          {!nodes.find(n => n.type === 'end') && (
            <span className="text-red-500 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              缺少结束节点
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
