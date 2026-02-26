'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  Settings,
  Plus,
  Edit,
  Trash2,
  ChevronUp,
  ChevronDown,
  GripVertical,
  FileText,
  Wrench,
  ShoppingCart,
  Copy,
  AlertCircle,
  CheckCircle,
  User,
  Clock,
  Zap,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { roleOptions } from '@/contexts/AuthContext';

interface ApprovalStep {
  id: string;
  step: number;
  name: string;
  approverType: 'role' | 'specific';
  approverRole?: string;
  approverId?: string;
  approverName?: string;
  isRequired: boolean;
  timeout?: number;
  timeoutAction?: 'auto_approve' | 'auto_reject' | 'escalate';
  description?: string;
}

interface WorkflowConfig {
  id: number;
  type: string;
  name: string;
  description: string;
  isActive: boolean;
  steps: ApprovalStep[];
  conditions?: any[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

const workflowTypes = [
  { value: 'leave', label: '请假审批', icon: FileText, color: 'bg-blue-100 text-blue-600' },
  { value: 'repair', label: '报修审批', icon: Wrench, color: 'bg-orange-100 text-orange-600' },
  { value: 'purchase', label: '采购审批', icon: ShoppingCart, color: 'bg-green-100 text-green-600' },
];

const timeoutActions = [
  { value: 'auto_approve', label: '自动通过', icon: CheckCircle },
  { value: 'auto_reject', label: '自动拒绝', icon: AlertCircle },
  { value: 'escalate', label: '升级处理', icon: Zap },
];

export default function WorkflowConfigPage() {
  const { user } = useAuth();
  const [configs, setConfigs] = useState<WorkflowConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');

  // 编辑弹窗
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<WorkflowConfig | null>(null);
  const [formData, setFormData] = useState<{
    type: string;
    name: string;
    description: string;
    steps: ApprovalStep[];
  }>({
    type: '',
    name: '',
    description: '',
    steps: [],
  });

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
    setFormData({
      type: type || '',
      name: '',
      description: '',
      steps: [],
    });
    setDialogOpen(true);
  };

  const openEditDialog = (config: WorkflowConfig) => {
    setEditingConfig(config);
    setFormData({
      type: config.type,
      name: config.name,
      description: config.description || '',
      steps: config.steps || [],
    });
    setDialogOpen(true);
  };

  const addStep = () => {
    const newStep: ApprovalStep = {
      id: `step_${Date.now()}`,
      step: formData.steps.length + 1,
      name: `步骤 ${formData.steps.length + 1}`,
      approverType: 'role',
      approverRole: '',
      isRequired: true,
    };
    setFormData({
      ...formData,
      steps: [...formData.steps, newStep],
    });
  };

  const updateStep = (index: number, updates: Partial<ApprovalStep>) => {
    const newSteps = [...formData.steps];
    newSteps[index] = { ...newSteps[index], ...updates };
    setFormData({ ...formData, steps: newSteps });
  };

  const removeStep = (index: number) => {
    const newSteps = formData.steps.filter((_, i) => i !== index);
    // 重新编号
    newSteps.forEach((step, i) => {
      step.step = i + 1;
    });
    setFormData({ ...formData, steps: newSteps });
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const newSteps = [...formData.steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSteps.length) return;
    
    [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
    // 重新编号
    newSteps.forEach((step, i) => {
      step.step = i + 1;
    });
    setFormData({ ...formData, steps: newSteps });
  };

  const handleSubmit = async () => {
    if (!formData.type || !formData.name || formData.steps.length === 0) {
      alert('请填写完整信息并添加至少一个审批步骤');
      return;
    }

    try {
      const res = await fetch('/api/workflow/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingConfig?.id,
          ...formData,
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
          id: config.id,
          type: config.type,
          name: config.name,
          description: config.description,
          steps: config.steps,
          conditions: config.conditions,
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

  const handleDuplicate = async (config: WorkflowConfig) => {
    try {
      const res = await fetch('/api/workflow/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: config.type,
          name: `${config.name}（副本）`,
          description: config.description,
          steps: config.steps,
          createdBy: user?.name,
        }),
      });

      if (res.ok) {
        fetchConfigs();
      }
    } catch (error) {
      console.error('Failed to duplicate config:', error);
    }
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
          <p className="text-gray-500 mt-1">配置请假、报修、采购的标准化审批流程</p>
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
                      已启用: {activeConfig.name}
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
              <Settings className="h-12 w-12 mx-auto mb-2 text-gray-300" />
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
                          {config.steps.length} 个审批步骤
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(config.updatedAt).toLocaleDateString()}
                        </span>
                        {config.description && (
                          <span className="truncate max-w-[200px]">{config.description}</span>
                        )}
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
                        onClick={() => handleDuplicate(config)}
                        title="复制"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
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
                        onClick={() => handleDelete(config.id)}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingConfig ? '编辑流程配置' : '新建流程配置'}</DialogTitle>
            <DialogDescription>
              配置审批流程的各个步骤和审批人
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* 基本信息 */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">流程类型 *</label>
                  <Select
                    value={formData.type}
                    onValueChange={(v) => setFormData({ ...formData, type: v })}
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
            </div>

            {/* 审批步骤 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700">审批步骤 *</label>
                <Button variant="outline" size="sm" onClick={addStep}>
                  <Plus className="h-4 w-4 mr-1" />
                  添加步骤
                </Button>
              </div>
              
              {formData.steps.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed rounded-lg text-gray-500">
                  <Settings className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>点击上方按钮添加审批步骤</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.steps.map((step, index) => (
                    <div
                      key={step.id}
                      className="border rounded-lg p-4 bg-gray-50"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col gap-0.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0"
                              onClick={() => moveStep(index, 'up')}
                              disabled={index === 0}
                            >
                              <ChevronUp className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0"
                              onClick={() => moveStep(index, 'down')}
                              disabled={index === formData.steps.length - 1}
                            >
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                          </div>
                          <Badge variant="outline" className="bg-white">
                            步骤 {step.step}
                          </Badge>
                          <Input
                            value={step.name}
                            onChange={(e) => updateStep(index, { name: e.target.value })}
                            placeholder="步骤名称"
                            className="w-40"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeStep(index)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-500">审批人类型</label>
                          <Select
                            value={step.approverType}
                            onValueChange={(v: 'role' | 'specific') => 
                              updateStep(index, { approverType: v, approverRole: '', approverId: '', approverName: '' })
                            }
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
                        
                        {step.approverType === 'role' ? (
                          <div>
                            <label className="text-xs text-gray-500">审批角色</label>
                            <Select
                              value={step.approverRole || ''}
                              onValueChange={(v) => updateStep(index, { approverRole: v })}
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
                              value={step.approverName || ''}
                              onChange={(e) => updateStep(index, { 
                                approverName: e.target.value,
                                approverId: e.target.value, // 实际应用中应选择真实用户
                              })}
                              placeholder="输入人员姓名"
                              className="mt-1"
                            />
                          </div>
                        )}
                      </div>
                      
                      {/* 高级设置 */}
                      <div className="mt-3 pt-3 border-t grid grid-cols-3 gap-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={step.isRequired}
                            onChange={(e) => updateStep(index, { isRequired: e.target.checked })}
                            className="rounded"
                          />
                          <label className="text-xs text-gray-600">必须审批</label>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">超时时间(小时)</label>
                          <Input
                            type="number"
                            value={step.timeout || ''}
                            onChange={(e) => updateStep(index, { timeout: parseInt(e.target.value) || undefined })}
                            placeholder="如 24"
                            className="mt-1 h-8"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">超时动作</label>
                          <Select
                            value={step.timeoutAction || ''}
                            onValueChange={(v: any) => updateStep(index, { timeoutAction: v })}
                          >
                            <SelectTrigger className="mt-1 h-8">
                              <SelectValue placeholder="选择" />
                            </SelectTrigger>
                            <SelectContent>
                              {timeoutActions.map(action => (
                                <SelectItem key={action.value} value={action.value}>
                                  {action.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.type || !formData.name || formData.steps.length === 0}>
              {editingConfig ? '保存修改' : '创建流程'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
