'use client';

/**
 * 学科实践活动编辑组件
 * 
 * 设计理念：
 * - 活动流程可视化
 * - 材料准备清单
 * - 反思记录
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  FlaskConical,
  Target,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { SUBJECTS, type PracticeActivity, type Material, type ActivityProcedure } from '@/types/research';

interface PracticeEditorProps {
  themeId: string;
  activity?: PracticeActivity;
  onSave?: (data: Partial<PracticeActivity>) => void;
}

export default function PracticeEditor({ themeId, activity, onSave }: PracticeEditorProps) {
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    activityName: activity?.activityName || '',
    grade: activity?.grade || 3,
    subject: activity?.subject || '科学',
    objectives: activity?.objectives || [''],
    materials: (activity?.materials as Material[] | undefined) || [],
    procedure: (activity?.procedure as ActivityProcedure[] | undefined) || [],
    description: activity?.description || '',
    reflection: activity?.reflection || '',
  });
  
  useEffect(() => {
    if (activity) {
      setFormData({
        activityName: activity.activityName || '',
        grade: activity.grade || 3,
        subject: activity.subject || '科学',
        objectives: activity.objectives?.length ? activity.objectives : [''],
        materials: (activity.materials as Material[] | undefined) || [],
        procedure: (activity.procedure as ActivityProcedure[] | undefined) || [],
        description: activity.description || '',
        reflection: activity.reflection || '',
      });
    }
  }, [activity]);
  
  const handleSave = async () => {
    if (!formData.activityName) {
      toast.error('请填写活动名称');
      return;
    }
    
    setSaving(true);
    try {
      const payload = {
        themeId,
        activityName: formData.activityName,
        grade: formData.grade,
        subject: formData.subject,
        objectives: formData.objectives.filter((o: string) => o.trim()),
        materials: formData.materials.filter((m: Material) => m.name.trim()),
        procedure: formData.procedure.filter((p: ActivityProcedure) => p.content.trim()),
        description: formData.description,
        reflection: formData.reflection,
      };
      
      const res = await fetch('/api/research/practices', {
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
  
  return (
    <div className="space-y-6">
      {/* 基本信息 */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-teal-50/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500">
              <FlaskConical className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">活动基本信息</CardTitle>
              <CardDescription>填写学科实践活动的基础信息</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2 space-y-2">
              <Label className="text-sm font-medium">活动名称 *</Label>
              <Input
                value={formData.activityName}
                onChange={(e) => setFormData({ ...formData, activityName: e.target.value })}
                placeholder="例如：种子发芽条件探究实验"
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
            <Label className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-emerald-500" />
              活动目标
            </Label>
            <div className="space-y-2">
              {formData.objectives.map((obj: string, idx: number) => (
                <div key={idx} className="flex gap-2">
                  <div className="flex-shrink-0 w-6 h-6 rounded bg-emerald-100 flex items-center justify-center text-xs font-medium text-emerald-600 mt-2">
                    {idx + 1}
                  </div>
                  <Textarea
                    value={obj}
                    onChange={(e) => {
                      const newObjs = formData.objectives.map((o: string, i: number) => i === idx ? e.target.value : o);
                      setFormData({ ...formData, objectives: newObjs });
                    }}
                    placeholder="例如：学生能够通过实验探究种子发芽的条件..."
                    className="flex-1 min-h-[50px] bg-white"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 mt-1"
                    onClick={() => {
                      if (formData.objectives.length > 1) {
                        const newObjs = formData.objectives.filter((_: string, i: number) => i !== idx);
                        setFormData({ ...formData, objectives: newObjs });
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-slate-400" />
                  </Button>
                </div>
              ))}
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full border-dashed"
                onClick={() => setFormData({ ...formData, objectives: [...formData.objectives, ''] })}
              >
                <Plus className="h-4 w-4 mr-2" />
                添加目标
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium">活动描述</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="描述活动的背景、意义和预期效果..."
              rows={3}
              className="bg-white"
            />
          </div>
        </CardContent>
      </Card>
      
      {/* 材料准备 */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">材料准备</CardTitle>
              <CardDescription>列出活动所需的材料和工具</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {formData.materials.map((mat: Material, idx: number) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50">
                <div className="flex-shrink-0 w-6 h-6 rounded bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-600 mt-1.5">
                  {idx + 1}
                </div>
                <div className="flex-1 grid gap-2 md:grid-cols-3">
                  <Input
                    value={mat.name}
                    onChange={(e) => {
                      const newMats = formData.materials.map((m: Material, i: number) => 
                        i === idx ? { ...m, name: e.target.value } : m
                      );
                      setFormData({ ...formData, materials: newMats });
                    }}
                    placeholder="材料名称"
                    className="bg-white h-9"
                  />
                  <Input
                    type="number"
                    value={mat.quantity}
                    onChange={(e) => {
                      const newMats = formData.materials.map((m: Material, i: number) => 
                        i === idx ? { ...m, quantity: Number(e.target.value) } : m
                      );
                      setFormData({ ...formData, materials: newMats });
                    }}
                    placeholder="数量"
                    className="bg-white h-9"
                  />
                  <Input
                    value={mat.unit}
                    onChange={(e) => {
                      const newMats = formData.materials.map((m: Material, i: number) => 
                        i === idx ? { ...m, unit: e.target.value } : m
                      );
                      setFormData({ ...formData, materials: newMats });
                    }}
                    placeholder="单位"
                    className="bg-white h-9"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    const newMats = formData.materials.filter((_: Material, i: number) => i !== idx);
                    setFormData({ ...formData, materials: newMats });
                  }}
                >
                  <Trash2 className="h-4 w-4 text-slate-400" />
                </Button>
              </div>
            ))}
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full border-dashed"
              onClick={() => setFormData({ 
                ...formData, 
                materials: [...formData.materials, { name: '', quantity: 0, unit: '' }] 
              })}
            >
              <Plus className="h-4 w-4 mr-2" />
              添加材料
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* 活动流程 */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">活动流程</CardTitle>
              <CardDescription>规划活动的各个步骤</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200" />
            <div className="space-y-4">
              {formData.procedure.map((step: ActivityProcedure, idx: number) => (
                <div key={idx} className="relative flex items-start gap-4 pl-2">
                  <div className="relative z-10 flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white font-medium text-sm">
                    {idx + 1}
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input
                      value={step.title}
                      onChange={(e) => {
                        const newProc = formData.procedure.map((p: ActivityProcedure, i: number) => 
                          i === idx ? { ...p, title: e.target.value } : p
                        );
                        setFormData({ ...formData, procedure: newProc });
                      }}
                      placeholder={`第${idx + 1}步标题`}
                      className="bg-white h-9"
                    />
                    <Textarea
                      value={step.content}
                      onChange={(e) => {
                        const newProc = formData.procedure.map((p: ActivityProcedure, i: number) => 
                          i === idx ? { ...p, content: e.target.value } : p
                        );
                        setFormData({ ...formData, procedure: newProc });
                      }}
                      placeholder="描述活动内容..."
                      className="min-h-[60px] bg-white"
                    />
                    <Input
                      type="number"
                      value={step.duration}
                      onChange={(e) => {
                        const newProc = formData.procedure.map((p: ActivityProcedure, i: number) => 
                          i === idx ? { ...p, duration: Number(e.target.value) } : p
                        );
                        setFormData({ ...formData, procedure: newProc });
                      }}
                      placeholder="预计时间（分钟）"
                      className="w-40 bg-white h-9"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      const newProc = formData.procedure.filter((_: ActivityProcedure, i: number) => i !== idx);
                      setFormData({ ...formData, procedure: newProc });
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-slate-400" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-4 border-dashed"
            onClick={() => setFormData({ 
              ...formData, 
              procedure: [...formData.procedure, { step: formData.procedure.length + 1, title: '', content: '', duration: 0 }] 
            })}
          >
            <Plus className="h-4 w-4 mr-2" />
            添加步骤
          </Button>
        </CardContent>
      </Card>
      
      {/* 教学反思 */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">教学反思</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.reflection}
            onChange={(e) => setFormData({ ...formData, reflection: e.target.value })}
            placeholder="记录教学过程中的心得体会和改进建议..."
            rows={4}
          />
        </CardContent>
      </Card>
      
      {/* 保存按钮 */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
        <Button variant="outline" className="min-w-24">
          预览
        </Button>
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="min-w-24 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
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
