'use client';

/**
 * 学科实践活动编辑组件
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Trash2,
  Save,
  Loader2,
  FlaskConical,
  Target,
  Clock,
  AlertCircle,
  Lightbulb,
  Image as ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  SUBJECTS, 
  PRACTICE_ACTIVITY_TYPE_LABELS,
  type PracticeActivity,
  type PracticeActivityType,
  type Material,
  type ActivityProcedure
} from '@/types/research';

interface PracticeEditorProps {
  themeId: string;
  activity?: PracticeActivity;
  onSave?: (data: Partial<PracticeActivity>) => void;
}

export default function PracticeEditor({ themeId, activity, onSave }: PracticeEditorProps) {
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    activityName: activity?.activityName || '',
    subject: activity?.subject || '科学',
    grade: activity?.grade || 3,
    activityType: activity?.activityType || 'experiment' as PracticeActivityType,
    description: activity?.description || '',
    objectives: activity?.objectives || [''],
    materials: activity?.materials || [] as Material[],
    procedure: activity?.procedure || [] as ActivityProcedure[],
    timeRequired: activity?.timeRequired || 40,
    difficultyLevel: activity?.difficultyLevel || 'medium',
    classManagement: activity?.classManagement || '',
    reflection: activity?.reflection || '',
  });
  
  useEffect(() => {
    if (activity) {
      setFormData({
        activityName: activity.activityName || '',
        subject: activity.subject || '科学',
        grade: activity.grade || 3,
        activityType: activity.activityType || 'experiment',
        description: activity.description || '',
        objectives: activity.objectives?.length ? activity.objectives : [''],
        materials: activity.materials || [],
        procedure: activity.procedure || [],
        timeRequired: activity.timeRequired || 40,
        difficultyLevel: activity.difficultyLevel || 'medium',
        classManagement: activity.classManagement || '',
        reflection: activity.reflection || '',
      });
    }
  }, [activity]);
  
  const handleSave = async () => {
    if (!formData.activityName || !formData.subject) {
      toast.error('请填写活动名称和学科');
      return;
    }
    
    setSaving(true);
    try {
      const payload = {
        themeId,
        activityName: formData.activityName,
        subject: formData.subject,
        grade: formData.grade,
        activityType: formData.activityType,
        description: formData.description,
        objectives: formData.objectives.filter(o => o.trim()),
        materials: formData.materials.filter(m => m.name.trim()),
        procedure: formData.procedure.filter(p => p.title.trim()),
        timeRequired: formData.timeRequired,
        difficultyLevel: formData.difficultyLevel,
        classManagement: formData.classManagement,
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
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            活动基本信息
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>活动名称 *</Label>
              <Input
                placeholder="如：种子发芽实验"
                value={formData.activityName}
                onChange={e => setFormData({ ...formData, activityName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>活动类型</Label>
              <Select 
                value={formData.activityType} 
                onValueChange={v => setFormData({ ...formData, activityType: v as PracticeActivityType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRACTICE_ACTIVITY_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>学科</Label>
              <Select 
                value={formData.subject} 
                onValueChange={v => setFormData({ ...formData, subject: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>年级</Label>
              <Select 
                value={String(formData.grade)} 
                onValueChange={v => setFormData({ ...formData, grade: parseInt(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6].map(g => (
                    <SelectItem key={g} value={String(g)}>{g}年级</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>所需时间(分钟)</Label>
              <Input
                type="number"
                value={formData.timeRequired}
                onChange={e => setFormData({ ...formData, timeRequired: parseInt(e.target.value) || 40 })}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>难度等级</Label>
              <Select 
                value={formData.difficultyLevel} 
                onValueChange={v => setFormData({ ...formData, difficultyLevel: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">简单</SelectItem>
                  <SelectItem value="medium">中等</SelectItem>
                  <SelectItem value="hard">困难</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>活动描述</Label>
            <Textarea
              placeholder="简要描述活动内容和目的"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* 详细设计 */}
      <Tabs defaultValue="objectives">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="objectives">
            <Target className="h-4 w-4 mr-1" />
            活动目标
          </TabsTrigger>
          <TabsTrigger value="materials">
            <Clock className="h-4 w-4 mr-1" />
            材料准备
          </TabsTrigger>
          <TabsTrigger value="procedure">
            <AlertCircle className="h-4 w-4 mr-1" />
            活动流程
          </TabsTrigger>
          <TabsTrigger value="reflection">
            <Lightbulb className="h-4 w-4 mr-1" />
            教学反思
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="objectives" className="mt-4">
          <Card>
            <CardContent className="pt-6 space-y-3">
              <Label>活动目标</Label>
              {formData.objectives.map((obj, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="输入活动目标"
                    value={obj}
                    onChange={e => {
                      const newObjs = [...formData.objectives];
                      newObjs[index] = e.target.value;
                      setFormData({ ...formData, objectives: newObjs });
                    }}
                  />
                  {formData.objectives.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          objectives: prev.objectives.filter((_, i) => i !== index),
                        }));
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-gray-400" />
                    </Button>
                  )}
                </div>
              ))}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setFormData(prev => ({ ...prev, objectives: [...prev.objectives, ''] }))}
              >
                <Plus className="h-4 w-4 mr-1" />
                添加目标
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="materials" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">所需材料</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      materials: [...prev.materials, { name: '', quantity: 1, unit: '个' }],
                    }));
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  添加材料
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {formData.materials.length === 0 ? (
                <p className="text-center text-gray-400 py-4">暂无材料</p>
              ) : (
                <div className="space-y-2">
                  {formData.materials.map((mat, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        placeholder="材料名称"
                        value={mat.name}
                        onChange={e => {
                          const newMats = [...formData.materials];
                          newMats[index] = { ...newMats[index], name: e.target.value };
                          setFormData({ ...formData, materials: newMats });
                        }}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        placeholder="数量"
                        value={mat.quantity}
                        onChange={e => {
                          const newMats = [...formData.materials];
                          newMats[index] = { ...newMats[index], quantity: parseInt(e.target.value) || 1 };
                          setFormData({ ...formData, materials: newMats });
                        }}
                        className="w-20"
                      />
                      <Input
                        placeholder="单位"
                        value={mat.unit}
                        onChange={e => {
                          const newMats = [...formData.materials];
                          newMats[index] = { ...newMats[index], unit: e.target.value };
                          setFormData({ ...formData, materials: newMats });
                        }}
                        className="w-16"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            materials: prev.materials.filter((_, i) => i !== index),
                          }));
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-gray-400" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="procedure" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">活动流程</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      procedure: [
                        ...prev.procedure,
                        { step: prev.procedure.length + 1, title: '', content: '', duration: 10 }
                      ],
                    }));
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  添加步骤
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {formData.procedure.length === 0 ? (
                <p className="text-center text-gray-400 py-4">暂无流程步骤</p>
              ) : (
                <div className="space-y-4">
                  {formData.procedure.map((proc, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-2">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">步骤{proc.step}</Badge>
                        <Input
                          placeholder="步骤标题"
                          value={proc.title}
                          onChange={e => {
                            const newProcs = [...formData.procedure];
                            newProcs[index] = { ...newProcs[index], title: e.target.value };
                            setFormData({ ...formData, procedure: newProcs });
                          }}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          placeholder="分钟"
                          value={proc.duration}
                          onChange={e => {
                            const newProcs = [...formData.procedure];
                            newProcs[index] = { ...newProcs[index], duration: parseInt(e.target.value) || 10 };
                            setFormData({ ...formData, procedure: newProcs });
                          }}
                          className="w-20"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              procedure: prev.procedure.filter((_, i) => i !== index),
                            }));
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-gray-400" />
                        </Button>
                      </div>
                      <Textarea
                        placeholder="详细描述这一步骤的操作内容"
                        value={proc.content}
                        onChange={e => {
                          const newProcs = [...formData.procedure];
                          newProcs[index] = { ...newProcs[index], content: e.target.value };
                          setFormData({ ...formData, procedure: newProcs });
                        }}
                        rows={2}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="mt-4">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Label>课堂管理要点</Label>
                <Textarea
                  placeholder="记录课堂纪律管理、安全注意事项等"
                  value={formData.classManagement}
                  onChange={e => setFormData({ ...formData, classManagement: e.target.value })}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="reflection" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Label>教学反思</Label>
                <Textarea
                  placeholder="记录活动实施过程中的经验、问题和改进建议"
                  value={formData.reflection}
                  onChange={e => setFormData({ ...formData, reflection: e.target.value })}
                  rows={8}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* 保存按钮 */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          <Save className="h-4 w-4 mr-2" />
          保存设计
        </Button>
      </div>
    </div>
  );
}
