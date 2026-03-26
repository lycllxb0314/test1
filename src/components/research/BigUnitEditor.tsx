'use client';

/**
 * 大单元教学设计编辑组件
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Trash2,
  Save,
  Loader2,
  BookOpen,
  Target,
  Lightbulb,
  AlertTriangle,
  FileText,
  ClipboardList,
  BarChart,
} from 'lucide-react';
import { toast } from 'sonner';
import { SUBJECTS, type BigUnitDesign, type LessonDesign, type HomeworkDesign } from '@/types/research';

interface BigUnitEditorProps {
  themeId: string;
  design?: BigUnitDesign;
  onSave?: (data: Partial<BigUnitDesign>) => void;
}

export default function BigUnitEditor({ themeId, design, onSave }: BigUnitEditorProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    unitName: design?.unitName || '',
    grade: design?.grade || 3,
    subject: design?.subject || '语文',
    unitGoals: design?.unitGoals || [''],
    coreKnowledge: design?.coreKnowledge || [''],
    keyCompetencies: design?.keyCompetencies || [''],
    difficultPoints: design?.difficultPoints || [''],
    errorPronePoints: design?.errorPronePoints || [''],
    lessonCount: design?.lessonCount || 0,
    lessonDesigns: design?.lessonDesigns || [] as LessonDesign[],
    homeworkDesigns: design?.homeworkDesigns || [] as HomeworkDesign[],
  });
  
  useEffect(() => {
    if (design) {
      setFormData({
        unitName: design.unitName || '',
        grade: design.grade || 3,
        subject: design.subject || '语文',
        unitGoals: design.unitGoals?.length ? design.unitGoals : [''],
        coreKnowledge: design.coreKnowledge?.length ? design.coreKnowledge : [''],
        keyCompetencies: design.keyCompetencies?.length ? design.keyCompetencies : [''],
        difficultPoints: design.difficultPoints?.length ? design.difficultPoints : [''],
        errorPronePoints: design.errorPronePoints?.length ? design.errorPronePoints : [''],
        lessonCount: design.lessonCount || 0,
        lessonDesigns: design.lessonDesigns || [],
        homeworkDesigns: design.homeworkDesigns || [],
      });
    }
  }, [design]);
  
  const handleArrayFieldChange = (
    field: keyof Pick<typeof formData, 'unitGoals' | 'coreKnowledge' | 'keyCompetencies' | 'difficultPoints' | 'errorPronePoints'>,
    index: number,
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => (i === index ? value : item)),
    }));
  };
  
  const addArrayItem = (
    field: keyof Pick<typeof formData, 'unitGoals' | 'coreKnowledge' | 'keyCompetencies' | 'difficultPoints' | 'errorPronePoints'>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], ''],
    }));
  };
  
  const removeArrayItem = (
    field: keyof Pick<typeof formData, 'unitGoals' | 'coreKnowledge' | 'keyCompetencies' | 'difficultPoints' | 'errorPronePoints'>,
    index: number
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };
  
  const handleSave = async () => {
    if (!formData.unitName) {
      toast.error('请填写单元名称');
      return;
    }
    
    setSaving(true);
    try {
      const payload = {
        themeId,
        unitName: formData.unitName,
        grade: formData.grade,
        subject: formData.subject,
        unitGoals: formData.unitGoals.filter(g => g.trim()),
        coreKnowledge: formData.coreKnowledge.filter(k => k.trim()),
        keyCompetencies: formData.keyCompetencies.filter(c => c.trim()),
        difficultPoints: formData.difficultPoints.filter(p => p.trim()),
        errorPronePoints: formData.errorPronePoints.filter(p => p.trim()),
        lessonCount: formData.lessonCount,
        lessonDesigns: formData.lessonDesigns,
        homeworkDesigns: formData.homeworkDesigns,
      };
      
      const res = await fetch('/api/research/big-units', {
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
  
  const renderArrayField = (
    label: string,
    field: keyof Pick<typeof formData, 'unitGoals' | 'coreKnowledge' | 'keyCompetencies' | 'difficultPoints' | 'errorPronePoints'>,
    placeholder: string
  ) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="space-y-2">
        {formData[field].map((item, index) => (
          <div key={index} className="flex gap-2">
            <Input
              placeholder={placeholder}
              value={item}
              onChange={e => handleArrayFieldChange(field, index, e.target.value)}
            />
            {formData[field].length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeArrayItem(field, index)}
              >
                <Trash2 className="h-4 w-4 text-gray-400" />
              </Button>
            )}
          </div>
        ))}
      </div>
      <Button variant="outline" size="sm" onClick={() => addArrayItem(field)}>
        <Plus className="h-4 w-4 mr-1" />
        添加
      </Button>
    </div>
  );
  
  return (
    <div className="space-y-6">
      {/* 基本信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            单元基本信息
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>单元名称 *</Label>
              <Input
                placeholder="如：第三单元 观察与发现"
                value={formData.unitName}
                onChange={e => setFormData({ ...formData, unitName: e.target.value })}
              />
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
          </div>
          <div className="flex items-center gap-2">
            <Label>课时数</Label>
            <Input
              type="number"
              className="w-24"
              value={formData.lessonCount}
              onChange={e => setFormData({ ...formData, lessonCount: parseInt(e.target.value) || 0 })}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* 设计内容 */}
      <Tabs defaultValue="goals">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="goals">
            <Target className="h-4 w-4 mr-1" />
            单元目标
          </TabsTrigger>
          <TabsTrigger value="knowledge">
            <Lightbulb className="h-4 w-4 mr-1" />
            知识素养
          </TabsTrigger>
          <TabsTrigger value="difficult">
            <AlertTriangle className="h-4 w-4 mr-1" />
            重难点
          </TabsTrigger>
          <TabsTrigger value="lessons">
            <FileText className="h-4 w-4 mr-1" />
            课时设计
          </TabsTrigger>
          <TabsTrigger value="homework">
            <ClipboardList className="h-4 w-4 mr-1" />
            作业设计
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="goals" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {renderArrayField('单元教学目标', 'unitGoals', '输入教学目标')}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="knowledge" className="mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                {renderArrayField('核心知识点', 'coreKnowledge', '输入核心知识点')}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                {renderArrayField('能力素养点', 'keyCompetencies', '输入能力素养点')}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="difficult" className="mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                {renderArrayField('教学重点', 'difficultPoints', '输入教学重点')}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                {renderArrayField('易错点', 'errorPronePoints', '输入易错点')}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="lessons" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">课时安排</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      lessonDesigns: [
                        ...prev.lessonDesigns,
                        { order: prev.lessonDesigns.length + 1, title: '', duration: 40 }
                      ],
                    }));
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  添加课时
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {formData.lessonDesigns.length === 0 ? (
                <p className="text-center text-gray-400 py-4">暂无课时设计，点击"添加课时"开始</p>
              ) : (
                <div className="space-y-3">
                  {formData.lessonDesigns.map((lesson, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                      <Badge variant="outline">第{lesson.order}课时</Badge>
                      <Input
                        placeholder="课时标题"
                        value={lesson.title}
                        onChange={e => {
                          const newLessons = [...formData.lessonDesigns];
                          newLessons[index] = { ...newLessons[index], title: e.target.value };
                          setFormData({ ...formData, lessonDesigns: newLessons });
                        }}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        placeholder="分钟"
                        value={lesson.duration}
                        onChange={e => {
                          const newLessons = [...formData.lessonDesigns];
                          newLessons[index] = { ...newLessons[index], duration: parseInt(e.target.value) || 40 };
                          setFormData({ ...formData, lessonDesigns: newLessons });
                        }}
                        className="w-20"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            lessonDesigns: prev.lessonDesigns.filter((_, i) => i !== index),
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
        
        <TabsContent value="homework" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">作业设计</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      homeworkDesigns: [
                        ...prev.homeworkDesigns,
                        { type: '基础练习', content: '', difficulty: 'medium' as const, estimatedTime: 20 }
                      ],
                    }));
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  添加作业
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {formData.homeworkDesigns.length === 0 ? (
                <p className="text-center text-gray-400 py-4">暂无作业设计</p>
              ) : (
                <div className="space-y-3">
                  {formData.homeworkDesigns.map((hw, index) => (
                    <div key={index} className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-center gap-3">
                        <Input
                          placeholder="作业类型"
                          value={hw.type}
                          onChange={e => {
                            const newHW = [...formData.homeworkDesigns];
                            newHW[index] = { ...newHW[index], type: e.target.value };
                            setFormData({ ...formData, homeworkDesigns: newHW });
                          }}
                          className="w-32"
                        />
                        <Select
                          value={hw.difficulty}
                          onValueChange={v => {
                            const newHW = [...formData.homeworkDesigns];
                            newHW[index] = { ...newHW[index], difficulty: v as 'easy' | 'medium' | 'hard' };
                            setFormData({ ...formData, homeworkDesigns: newHW });
                          }}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="easy">简单</SelectItem>
                            <SelectItem value="medium">中等</SelectItem>
                            <SelectItem value="hard">困难</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          placeholder="预计时间(分钟)"
                          value={hw.estimatedTime}
                          onChange={e => {
                            const newHW = [...formData.homeworkDesigns];
                            newHW[index] = { ...newHW[index], estimatedTime: parseInt(e.target.value) || 20 };
                            setFormData({ ...formData, homeworkDesigns: newHW });
                          }}
                          className="w-32"
                        />
                      </div>
                      <Textarea
                        placeholder="作业内容描述"
                        value={hw.content}
                        onChange={e => {
                          const newHW = [...formData.homeworkDesigns];
                          newHW[index] = { ...newHW[index], content: e.target.value };
                          setFormData({ ...formData, homeworkDesigns: newHW });
                        }}
                        rows={2}
                      />
                    </div>
                  ))}
                </div>
              )}
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
