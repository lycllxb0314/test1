'use client';

/**
 * 教研阶段管理组件
 * 
 * 功能：
 * - 查看教研阶段列表
 * - 添加新阶段
 * - 编辑阶段信息
 * - 删除阶段
 * - 调整阶段顺序
 * - 更新阶段状态
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Target,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  ChevronUp,
  ChevronDown,
  CheckCircle,
  Clock,
  Circle,
  GripVertical,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ResearchStage } from '@/types/research';

// ==================== 类型定义 ====================

interface StageManagerProps {
  themeId: string;
  stages: ResearchStage[];
  onUpdate: () => void;
}

type StageStatus = 'pending' | 'in_progress' | 'completed';

// ==================== 组件 ====================

export default function StageManager({ themeId, stages, onUpdate }: StageManagerProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<ResearchStage | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
  });
  
  const openCreateDialog = () => {
    setEditingStage(null);
    setFormData({ name: '', description: '', startDate: '', endDate: '' });
    setDialogOpen(true);
  };
  
  const openEditDialog = (stage: ResearchStage) => {
    setEditingStage(stage);
    setFormData({
      name: stage.name,
      description: stage.description || '',
      startDate: stage.startDate || '',
      endDate: stage.endDate || '',
    });
    setDialogOpen(true);
  };
  
  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('请输入阶段名称');
      return;
    }
    
    setSubmitting(true);
    try {
      if (editingStage) {
        // 更新阶段
        const res = await fetch(`/api/research/stages/${editingStage.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description,
            startDate: formData.startDate || null,
            endDate: formData.endDate || null,
          }),
        });
        
        const data = await res.json();
        
        if (data.success) {
          toast.success('阶段更新成功');
          setDialogOpen(false);
          onUpdate();
        } else {
          toast.error(data.error || '更新失败');
        }
      } else {
        // 创建阶段
        const res = await fetch('/api/research/stages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            themeId,
            name: formData.name,
            description: formData.description,
            startDate: formData.startDate || null,
            endDate: formData.endDate || null,
            orderNum: stages.length,
          }),
        });
        
        const data = await res.json();
        
        if (data.success) {
          toast.success('阶段创建成功');
          setDialogOpen(false);
          onUpdate();
        } else {
          toast.error(data.error || '创建失败');
        }
      }
    } catch (err) {
      console.error('操作失败:', err);
      toast.error('操作失败');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleDelete = async (stageId: string) => {
    if (!confirm('确定要删除这个阶段吗？')) return;
    
    try {
      const res = await fetch(`/api/research/stages/${stageId}`, {
        method: 'DELETE',
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success('阶段删除成功');
        onUpdate();
      } else {
        toast.error(data.error || '删除失败');
      }
    } catch (err) {
      toast.error('删除失败');
    }
  };
  
  const handleStatusChange = async (stageId: string, newStatus: StageStatus) => {
    try {
      const res = await fetch(`/api/research/stages/${stageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success('状态更新成功');
        onUpdate();
      } else {
        toast.error(data.error || '更新失败');
      }
    } catch (err) {
      toast.error('更新失败');
    }
  };
  
  const handleMoveUp = async (stage: ResearchStage, index: number) => {
    if (index === 0) return;
    
    try {
      // 交换顺序
      const prevStage = stages[index - 1];
      
      await Promise.all([
        fetch(`/api/research/stages/${stage.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderNum: index - 1 }),
        }),
        fetch(`/api/research/stages/${prevStage.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderNum: index }),
        }),
      ]);
      
      onUpdate();
    } catch (err) {
      toast.error('移动失败');
    }
  };
  
  const handleMoveDown = async (stage: ResearchStage, index: number) => {
    if (index === stages.length - 1) return;
    
    try {
      const nextStage = stages[index + 1];
      
      await Promise.all([
        fetch(`/api/research/stages/${stage.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderNum: index + 1 }),
        }),
        fetch(`/api/research/stages/${nextStage.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderNum: index }),
        }),
      ]);
      
      onUpdate();
    } catch (err) {
      toast.error('移动失败');
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Circle className="h-4 w-4 text-slate-300" />;
    }
  };
  
  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      completed: { label: '已完成', className: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
      in_progress: { label: '进行中', className: 'text-blue-600 bg-blue-50 border-blue-200' },
      pending: { label: '待开始', className: 'text-slate-500 bg-slate-50 border-slate-200' },
    };
    const { label, className } = config[status] || config.pending;
    return <Badge variant="outline" className={className}>{label}</Badge>;
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-5 w-5 text-indigo-500" />
            教研阶段
          </CardTitle>
          <Button size="sm" onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            添加阶段
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {stages.length === 0 ? (
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 mb-4">暂无教研阶段</p>
            <Button variant="outline" size="sm" onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              添加第一个阶段
            </Button>
          </div>
        ) : (
          <div className="relative">
            {/* 时间线 */}
            <div className="absolute left-6 top-3 bottom-3 w-0.5 bg-slate-200" />
            
            <div className="space-y-3">
              {stages.map((stage, index) => (
                <div key={stage.id} className="relative flex items-start gap-4 pl-2 group">
                  {/* 拖拽手柄 */}
                  <div className="flex flex-col items-center pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0"
                      onClick={() => handleMoveUp(stage, index)}
                      disabled={index === 0}
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0"
                      onClick={() => handleMoveDown(stage, index)}
                      disabled={index === stages.length - 1}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  {/* 状态圆点 */}
                  <div className="relative z-10 mt-1.5">
                    {getStatusIcon(stage.status)}
                  </div>
                  
                  {/* 阶段内容 */}
                  <div className="flex-1 bg-slate-50 hover:bg-slate-100 rounded-lg p-4 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-slate-900">{stage.name}</h4>
                          {getStatusBadge(stage.status)}
                        </div>
                        
                        {stage.description && (
                          <p className="text-sm text-slate-500 mb-2">{stage.description}</p>
                        )}
                        
                        {(stage.startDate || stage.endDate) && (
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Clock className="h-3 w-3" />
                            <span>
                              {stage.startDate || '未设定'} ~ {stage.endDate || '未设定'}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* 操作菜单 */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => openEditDialog(stage)}>
                            <Edit className="h-4 w-4 mr-2" />
                            编辑阶段
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleStatusChange(stage.id, 'in_progress')}
                            disabled={stage.status === 'in_progress'}
                          >
                            <Clock className="h-4 w-4 mr-2" />
                            标记进行中
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleStatusChange(stage.id, 'completed')}
                            disabled={stage.status === 'completed'}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            标记已完成
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDelete(stage.id)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            删除阶段
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      
      {/* 添加/编辑阶段对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingStage ? '编辑阶段' : '添加教研阶段'}</DialogTitle>
            <DialogDescription>
              {editingStage ? '修改阶段信息' : '为教研主题添加一个新的阶段'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>阶段名称 *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例如：第一阶段：理论学习"
              />
            </div>
            
            <div className="space-y-2">
              <Label>阶段描述</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="描述本阶段的主要任务和目标..."
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>开始日期</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>结束日期</Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingStage ? '保存' : '添加'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
