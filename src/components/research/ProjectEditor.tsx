'use client';

/**
 * 项目式教学设计编辑组件
 * 
 * 设计理念：
 * - 清晰的阶段流程
 * - 任务驱动设计
 * - 团队协作支持
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Trash2,
  Save,
  Loader2,
  Lightbulb,
  Target,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { SUBJECTS, type ProjectDesign, type ProjectStage, type ProjectStageTask } from '@/types/research';

interface ProjectEditorProps {
  themeId: string;
  design?: ProjectDesign;
  onSave?: (data: Partial<ProjectDesign>) => void;
}

export default function ProjectEditor({ themeId, design, onSave }: ProjectEditorProps) {
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    projectName: design?.projectName || '',
    grade: design?.grade || 3,
    subject: design?.subject || design?.subjects?.[0] || '语文',
    drivingQuestion: design?.drivingQuestion || '',
    background: design?.background || '',
    realWorldConnection: design?.realWorldConnection || '',
    finalProduct: design?.finalProduct || '',
    presentationForm: design?.presentationForm || '',
    stages: (design?.stages as ProjectStage[] | undefined) || [],
  });
  
  useEffect(() => {
    if (design) {
      setFormData({
        projectName: design.projectName || '',
        grade: design.grade || 3,
        subject: design.subject || design.subjects?.[0] || '语文',
        drivingQuestion: design.drivingQuestion || '',
        background: design.background || '',
        realWorldConnection: design.realWorldConnection || '',
        finalProduct: design.finalProduct || '',
        presentationForm: design.presentationForm || '',
        stages: (design.stages as ProjectStage[] | undefined) || [],
      });
    }
  }, [design]);
  
  const handleSave = async () => {
    if (!formData.projectName) {
      toast.error('请填写项目名称');
      return;
    }
    if (!formData.drivingQuestion) {
      toast.error('请填写驱动问题');
      return;
    }
    
    setSaving(true);
    try {
      const payload = {
        themeId,
        projectName: formData.projectName,
        grade: formData.grade,
        subject: formData.subject,
        subjects: [formData.subject],
        drivingQuestion: formData.drivingQuestion,
        background: formData.background,
        realWorldConnection: formData.realWorldConnection,
        finalProduct: formData.finalProduct,
        presentationForm: formData.presentationForm,
        stages: formData.stages,
      };
      
      const res = await fetch('/api/research/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success('保存成功');
        onSave?.(payload);
      } else {
        toast.error(data.error || '保存失败');
      }
    } catch (err) {
      console.error('保存失败:', err);
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };
  
  const addStage = () => {
    const newStage: ProjectStage = {
      name: '',
      objectives: '',
      tasks: [],
      duration: 7,
    };
    setFormData({ ...formData, stages: [...formData.stages, newStage] });
  };
  
  const updateStage = (index: number, stage: ProjectStage) => {
    const newStages = formData.stages.map((s, i) => (i === index ? stage : s));
    setFormData({ ...formData, stages: newStages });
  };
  
  const deleteStage = (index: number) => {
    const newStages = formData.stages.filter((_, i) => i !== index);
    setFormData({ ...formData, stages: newStages });
  };

  return (
    <div className="space-y-6">
      {/* 项目基本信息 */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-orange-50/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500">
              <Lightbulb className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">项目基本信息</CardTitle>
              <CardDescription>填写项目式学习的基础信息</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2 space-y-2">
              <Label className="text-sm font-medium">项目名称 *</Label>
              <Input
                value={formData.projectName}
                onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                placeholder="例如：小小植物观察员"
                className="bg-white h-11"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">年级</Label>
                <Select 
                  value={String(formData.grade)} 
                  onValueChange={(v) => setFormData({ ...formData, grade: Number(v) })}
                >
                  <SelectTrigger className="bg-white h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5,6].map(g => (
                      <SelectItem key={g} value={String(g)}>{g}年级</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">学科</Label>
                <Select 
                  value={formData.subject} 
                  onValueChange={(v) => setFormData({ ...formData, subject: v })}
                >
                  <SelectTrigger className="bg-white h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              <span className="flex items-center gap-2">
                <Target className="h-4 w-4 text-amber-500" />
                驱动问题 *
              </span>
            </Label>
            <Textarea
              value={formData.drivingQuestion}
              onChange={(e) => setFormData({ ...formData, drivingQuestion: e.target.value })}
              placeholder="例如：如何通过观察和记录，制作一份植物生长日记？"
              rows={2}
              className="bg-white"
            />
            <p className="text-xs text-slate-500">驱动问题是项目的核心，应该是开放性的、能够激发学生探究欲望的问题</p>
          </div>
        </CardContent>
      </Card>
      
      {/* 项目背景与成果 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">项目背景</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.background}
              onChange={(e) => setFormData({ ...formData, background: e.target.value })}
              placeholder="描述项目背景、学生已有知识经验、学习需求等..."
              rows={4}
            />
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">真实世界联系</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.realWorldConnection}
              onChange={(e) => setFormData({ ...formData, realWorldConnection: e.target.value })}
              placeholder="描述项目与真实世界的联系，学生能够学以致用的场景..."
              rows={4}
            />
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">最终成果</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.finalProduct}
              onChange={(e) => setFormData({ ...formData, finalProduct: e.target.value })}
              placeholder="描述学生最终要产出的成果，如报告、作品、演示等..."
              rows={3}
            />
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">成果展示形式</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.presentationForm}
              onChange={(e) => setFormData({ ...formData, presentationForm: e.target.value })}
              placeholder="描述成果的展示方式，如展览、演讲、表演等..."
              rows={3}
            />
          </CardContent>
        </Card>
      </div>
      
      {/* 项目阶段 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900">项目阶段</h3>
            <p className="text-sm text-slate-500">规划项目的各个阶段和任务</p>
          </div>
          <Button variant="outline" onClick={addStage}>
            <Plus className="h-4 w-4 mr-2" />
            添加阶段
          </Button>
        </div>
        
        {formData.stages.length === 0 ? (
          <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
            <CardContent className="py-12 text-center">
              <div className="inline-flex p-4 rounded-2xl bg-amber-50 mb-4">
                <Calendar className="h-10 w-10 text-amber-400" />
              </div>
              <h4 className="font-medium text-slate-900 mb-1">暂无项目阶段</h4>
              <p className="text-sm text-slate-500 mb-4">点击上方按钮添加项目阶段</p>
              <Button variant="outline" size="sm" onClick={addStage}>
                <Plus className="h-4 w-4 mr-2" />
                添加第一个阶段
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {formData.stages.map((stage, idx) => (
              <StageCard
                key={idx}
                stage={stage}
                index={idx}
                onUpdate={(s: ProjectStage) => updateStage(idx, s)}
                onDelete={() => deleteStage(idx)}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* 保存按钮 */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
        <Button variant="outline" className="min-w-24">
          预览
        </Button>
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="min-w-24 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              保存中
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              保存设计
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function StageCard({ 
  stage, 
  index,
  onUpdate,
  onDelete 
}: { 
  stage: ProjectStage; 
  index: number;
  onUpdate: (stage: ProjectStage) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(index === 0);
  
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      <div 
        className="flex items-center gap-4 px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 cursor-pointer hover:from-amber-100 hover:to-orange-100 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-medium">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-slate-900">{stage.name || `阶段 ${index + 1}`}</h4>
          <p className="text-sm text-slate-500">{stage.tasks?.length || 0} 个任务</p>
        </div>
        <Badge variant="outline" className="text-amber-600 border-amber-200">
          {stage.duration || 0} 天
        </Badge>
      </div>
      
      {expanded && (
        <div className="p-4 space-y-4 border-t border-slate-100">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">阶段名称</Label>
              <Input
                value={stage.name}
                onChange={(e) => onUpdate({ ...stage, name: e.target.value })}
                placeholder="例如：入项准备"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">持续时间（天）</Label>
              <Input
                type="number"
                min={1}
                value={stage.duration}
                onChange={(e) => onUpdate({ ...stage, duration: Number(e.target.value) })}
                className="h-10"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium">阶段目标</Label>
            <Textarea
              value={stage.objectives}
              onChange={(e) => onUpdate({ ...stage, objectives: e.target.value })}
              placeholder="描述本阶段的学习目标和预期成果..."
              rows={2}
            />
          </div>
          
          {/* 任务列表 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">任务列表</Label>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const newTask: ProjectStageTask = {
                    title: '',
                    description: '',
                    assignee: '',
                    deadline: '',
                  };
                  onUpdate({ ...stage, tasks: [...(stage.tasks || []), newTask] });
                }}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                添加任务
              </Button>
            </div>
            
            {stage.tasks && stage.tasks.length > 0 ? (
              <div className="space-y-2">
                {stage.tasks.map((task, taskIdx) => (
                  <div 
                    key={taskIdx}
                    className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50"
                  >
                    <div className="flex-shrink-0 w-6 h-6 rounded bg-amber-100 flex items-center justify-center text-xs font-medium text-amber-600 mt-0.5">
                      {taskIdx + 1}
                    </div>
                    <div className="flex-1 space-y-2">
                      <Input
                        value={task.title}
                        onChange={(e) => {
                          const newTasks = stage.tasks!.map((t, i) => 
                            i === taskIdx ? { ...t, title: e.target.value } : t
                          );
                          onUpdate({ ...stage, tasks: newTasks });
                        }}
                        placeholder="任务标题"
                        className="h-9 bg-white"
                      />
                      <Textarea
                        value={task.description}
                        onChange={(e) => {
                          const newTasks = stage.tasks!.map((t, i) => 
                            i === taskIdx ? { ...t, description: e.target.value } : t
                          );
                          onUpdate({ ...stage, tasks: newTasks });
                        }}
                        placeholder="任务描述（可选）"
                        rows={2}
                        className="bg-white text-sm"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          value={task.assignee}
                          onChange={(e) => {
                            const newTasks = stage.tasks!.map((t, i) => 
                              i === taskIdx ? { ...t, assignee: e.target.value } : t
                            );
                            onUpdate({ ...stage, tasks: newTasks });
                          }}
                          placeholder="负责人"
                          className="h-9 bg-white text-sm"
                        />
                        <Input
                          type="date"
                          value={task.deadline}
                          onChange={(e) => {
                            const newTasks = stage.tasks!.map((t, i) => 
                              i === taskIdx ? { ...t, deadline: e.target.value } : t
                            );
                            onUpdate({ ...stage, tasks: newTasks });
                          }}
                          className="h-9 bg-white text-sm"
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => {
                        const newTasks = stage.tasks!.filter((_, i) => i !== taskIdx);
                        onUpdate({ ...stage, tasks: newTasks });
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-sm">
                暂无任务，点击上方按钮添加
              </div>
            )}
          </div>
          
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-500 hover:text-red-600 hover:bg-red-50">
              <Trash2 className="h-4 w-4 mr-2" />
              删除阶段
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
