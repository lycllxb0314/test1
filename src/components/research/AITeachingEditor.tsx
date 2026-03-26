'use client';

/**
 * AI赋能教学应用编辑组件
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
  Cpu,
  Target,
  FileText,
  Sparkles,
  Video,
  BarChart,
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  SUBJECTS, 
  AI_TOOL_TYPE_LABELS,
  type AITeachingApp,
  type AIToolType,
  type OperationStep,
  type PromptTemplate
} from '@/types/research';

interface AITeachingEditorProps {
  themeId: string;
  app?: AITeachingApp;
  onSave?: (data: Partial<AITeachingApp>) => void;
}

export default function AITeachingEditor({ themeId, app, onSave }: AITeachingEditorProps) {
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    appName: app?.appName || '',
    subject: app?.subject || '语文',
    aiToolType: app?.aiToolType || 'lesson_prep' as AIToolType,
    aiToolName: app?.aiToolName || '',
    description: app?.description || '',
    useCase: app?.useCase || '',
    operationSteps: app?.operationSteps || [] as OperationStep[],
    prompts: app?.prompts || [] as PromptTemplate[],
    classroomIntegration: app?.classroomIntegration || '',
    videoUrl: app?.videoUrl || '',
  });
  
  useEffect(() => {
    if (app) {
      setFormData({
        appName: app.appName || '',
        subject: app.subject || '语文',
        aiToolType: app.aiToolType || 'lesson_prep',
        aiToolName: app.aiToolName || '',
        description: app.description || '',
        useCase: app.useCase || '',
        operationSteps: app.operationSteps || [],
        prompts: app.prompts || [],
        classroomIntegration: app.classroomIntegration || '',
        videoUrl: app.videoUrl || '',
      });
    }
  }, [app]);
  
  const handleSave = async () => {
    if (!formData.appName || !formData.subject) {
      toast.error('请填写应用名称和学科');
      return;
    }
    
    setSaving(true);
    try {
      const payload = {
        themeId,
        appName: formData.appName,
        subject: formData.subject,
        aiToolType: formData.aiToolType,
        aiToolName: formData.aiToolName,
        description: formData.description,
        useCase: formData.useCase,
        operationSteps: formData.operationSteps.filter(s => s.title.trim()),
        prompts: formData.prompts.filter(p => p.name.trim() && p.prompt.trim()),
        classroomIntegration: formData.classroomIntegration,
        videoUrl: formData.videoUrl,
      };
      
      const res = await fetch('/api/research/ai-teaching', {
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
            <Cpu className="h-5 w-5" />
            AI应用基本信息
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>应用名称 *</Label>
              <Input
                placeholder="如：AI辅助作文批改"
                value={formData.appName}
                onChange={e => setFormData({ ...formData, appName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>AI工具名称</Label>
              <Input
                placeholder="如：ChatGPT、文心一言"
                value={formData.aiToolName}
                onChange={e => setFormData({ ...formData, aiToolName: e.target.value })}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
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
              <Label>AI工具类型</Label>
              <Select 
                value={formData.aiToolType} 
                onValueChange={v => setFormData({ ...formData, aiToolType: v as AIToolType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(AI_TOOL_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>应用描述</Label>
            <Textarea
              placeholder="描述该AI应用的教学场景和目标"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>
          
          <div className="space-y-2">
            <Label>使用场景</Label>
            <Textarea
              placeholder="描述具体的教学场景，如备课、课堂互动、作业批改等"
              value={formData.useCase}
              onChange={e => setFormData({ ...formData, useCase: e.target.value })}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* 详细设计 */}
      <Tabs defaultValue="steps">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="steps">
            <Target className="h-4 w-4 mr-1" />
            操作步骤
          </TabsTrigger>
          <TabsTrigger value="prompts">
            <Sparkles className="h-4 w-4 mr-1" />
            提示词模板
          </TabsTrigger>
          <TabsTrigger value="integration">
            <FileText className="h-4 w-4 mr-1" />
            课堂融合
          </TabsTrigger>
          <TabsTrigger value="video">
            <Video className="h-4 w-4 mr-1" />
            课堂实录
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="steps" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">操作步骤</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      operationSteps: [
                        ...prev.operationSteps,
                        { step: prev.operationSteps.length + 1, title: '', description: '' }
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
              {formData.operationSteps.length === 0 ? (
                <p className="text-center text-gray-400 py-4">暂无操作步骤</p>
              ) : (
                <div className="space-y-4">
                  {formData.operationSteps.map((step, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-2">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">步骤{step.step}</Badge>
                        <Input
                          placeholder="步骤标题"
                          value={step.title}
                          onChange={e => {
                            const newSteps = [...formData.operationSteps];
                            newSteps[index] = { ...newSteps[index], title: e.target.value };
                            setFormData({ ...formData, operationSteps: newSteps });
                          }}
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              operationSteps: prev.operationSteps.filter((_, i) => i !== index),
                            }));
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-gray-400" />
                        </Button>
                      </div>
                      <Textarea
                        placeholder="详细描述操作内容"
                        value={step.description}
                        onChange={e => {
                          const newSteps = [...formData.operationSteps];
                          newSteps[index] = { ...newSteps[index], description: e.target.value };
                          setFormData({ ...formData, operationSteps: newSteps });
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
        
        <TabsContent value="prompts" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">提示词模板</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      prompts: [...prev.prompts, { name: '', prompt: '', description: '' }],
                    }));
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  添加模板
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {formData.prompts.length === 0 ? (
                <p className="text-center text-gray-400 py-4">暂无提示词模板</p>
              ) : (
                <div className="space-y-4">
                  {formData.prompts.map((prompt, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center gap-3">
                        <Input
                          placeholder="模板名称"
                          value={prompt.name}
                          onChange={e => {
                            const newPrompts = [...formData.prompts];
                            newPrompts[index] = { ...newPrompts[index], name: e.target.value };
                            setFormData({ ...formData, prompts: newPrompts });
                          }}
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              prompts: prev.prompts.filter((_, i) => i !== index),
                            }));
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-gray-400" />
                        </Button>
                      </div>
                      <Textarea
                        placeholder="输入提示词内容"
                        value={prompt.prompt}
                        onChange={e => {
                          const newPrompts = [...formData.prompts];
                          newPrompts[index] = { ...newPrompts[index], prompt: e.target.value };
                          setFormData({ ...formData, prompts: newPrompts });
                        }}
                        rows={4}
                        className="font-mono text-sm"
                      />
                      <Input
                        placeholder="模板说明（可选）"
                        value={prompt.description}
                        onChange={e => {
                          const newPrompts = [...formData.prompts];
                          newPrompts[index] = { ...newPrompts[index], description: e.target.value };
                          setFormData({ ...formData, prompts: newPrompts });
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="integration" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Label>课堂融合方式</Label>
                <Textarea
                  placeholder="描述如何将该AI工具融入课堂教学，包括使用时机、学生互动方式等"
                  value={formData.classroomIntegration}
                  onChange={e => setFormData({ ...formData, classroomIntegration: e.target.value })}
                  rows={6}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="video" className="mt-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label>课堂实录视频链接</Label>
                <Input
                  placeholder="输入视频URL"
                  value={formData.videoUrl}
                  onChange={e => setFormData({ ...formData, videoUrl: e.target.value })}
                />
              </div>
              {formData.videoUrl && (
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                  <p className="text-gray-400">视频预览区域</p>
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
