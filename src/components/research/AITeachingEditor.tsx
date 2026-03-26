'use client';

/**
 * AI赋能教学应用编辑组件
 * 
 * 设计理念：
 * - AI工具应用场景
 * - 提示词设计
 * - 效果评估
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
  Cpu,
  Target,
  MessageSquare,
  Lightbulb,
  Zap,
  CheckCircle2,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';
import { SUBJECTS, AI_TOOL_OPTIONS, type AITeachingApp, type PromptTemplate } from '@/types/research';

interface AITeachingEditorProps {
  themeId: string;
  app?: AITeachingApp;
  onSave?: (data: Partial<AITeachingApp>) => void;
}

export default function AITeachingEditor({ themeId, app, onSave }: AITeachingEditorProps) {
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    appName: app?.appName || app?.name || '',
    grade: app?.grade || 3,
    subject: app?.subject || '语文',
    scenario: app?.scenario || '',
    aiTools: app?.aiTools || [],
    objectives: app?.objectives || [''],
    prompts: (app?.prompts as (PromptTemplate & { purpose?: string; notes?: string })[] | undefined) || [],
    integrationSteps: app?.integrationSteps || [''],
    effects: app?.effects || '',
    challenges: app?.challenges || '',
    suggestions: app?.suggestions || '',
  });
  
  useEffect(() => {
    if (app) {
      setFormData({
        appName: app.appName || app.name || '',
        grade: app.grade || 3,
        subject: app.subject || '语文',
        scenario: app.scenario || '',
        aiTools: app.aiTools || [],
        objectives: app.objectives?.length ? app.objectives : [''],
        prompts: (app.prompts as (PromptTemplate & { purpose?: string; notes?: string })[] | undefined) || [],
        integrationSteps: app.integrationSteps?.length ? app.integrationSteps : [''],
        effects: app.effects || '',
        challenges: app.challenges || '',
        suggestions: app.suggestions || '',
      });
    }
  }, [app]);
  
  const handleSave = async () => {
    if (!formData.appName) {
      toast.error('请填写应用名称');
      return;
    }
    
    setSaving(true);
    try {
      const payload = {
        themeId,
        appName: formData.appName,
        name: formData.appName,
        grade: formData.grade,
        subject: formData.subject,
        scenario: formData.scenario,
        aiTools: formData.aiTools,
        objectives: formData.objectives.filter((o: string) => o.trim()),
        prompts: formData.prompts.filter((p: PromptTemplate) => p.prompt.trim()),
        integrationSteps: formData.integrationSteps.filter((s: string) => s.trim()),
        effects: formData.effects,
        challenges: formData.challenges,
        suggestions: formData.suggestions,
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
  
  const copyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    toast.success('已复制到剪贴板');
  };

  return (
    <div className="space-y-6">
      {/* 基本信息 */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-violet-50 to-purple-50/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500">
              <Cpu className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">AI教学应用基本信息</CardTitle>
              <CardDescription>填写AI赋能教学应用的基础信息</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2 space-y-2">
              <Label className="text-sm font-medium">应用名称 *</Label>
              <Input
                value={formData.appName}
                onChange={(e) => setFormData({ ...formData, appName: e.target.value })}
                placeholder="例如：AI辅助作文批改"
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
            <Label className="text-sm font-medium">应用场景</Label>
            <Select 
              value={formData.scenario} 
              onValueChange={(v) => setFormData({ ...formData, scenario: v })}
            >
              <SelectTrigger className="bg-white h-11">
                <SelectValue placeholder="选择AI应用场景" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lesson_planning">教案设计</SelectItem>
                <SelectItem value="content_generation">内容生成</SelectItem>
                <SelectItem value="homework_grading">作业批改</SelectItem>
                <SelectItem value="student_evaluation">学情分析</SelectItem>
                <SelectItem value="teaching_assistant">课堂助手</SelectItem>
                <SelectItem value="resource_creation">资源制作</SelectItem>
                <SelectItem value="other">其他</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-violet-500" />
              应用目标
            </Label>
            <div className="space-y-2">
              {formData.objectives.map((obj: string, idx: number) => (
                <div key={idx} className="flex gap-2">
                  <div className="flex-shrink-0 w-6 h-6 rounded bg-violet-100 flex items-center justify-center text-xs font-medium text-violet-600 mt-2">
                    {idx + 1}
                  </div>
                  <Textarea
                    value={obj}
                    onChange={(e) => {
                      const newObjs = formData.objectives.map((o: string, i: number) => i === idx ? e.target.value : o);
                      setFormData({ ...formData, objectives: newObjs });
                    }}
                    placeholder="例如：提高作文批改效率，为学生提供个性化反馈..."
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
        </CardContent>
      </Card>
      
      {/* AI工具选择 */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">AI工具</CardTitle>
              <CardDescription>选择使用的AI工具</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {AI_TOOL_OPTIONS.map(tool => {
              const isSelected = formData.aiTools.includes(tool.value);
              return (
                <Badge
                  key={tool.value}
                  variant={isSelected ? 'default' : 'outline'}
                  className={`px-3 py-1.5 cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-violet-500 hover:bg-violet-600 text-white' 
                      : 'hover:bg-slate-100'
                  }`}
                  onClick={() => {
                    if (isSelected) {
                      setFormData({ 
                        ...formData, 
                        aiTools: formData.aiTools.filter((t: string) => t !== tool.value) 
                      });
                    } else {
                      setFormData({ 
                        ...formData, 
                        aiTools: [...formData.aiTools, tool.value] 
                      });
                    }
                  }}
                >
                  {tool.label}
                </Badge>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      {/* 提示词设计 */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">提示词设计</CardTitle>
              <CardDescription>设计有效的AI提示词</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {formData.prompts.map((p, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-pink-50 text-pink-600 border-pink-200">
                      提示词 {idx + 1}
                    </Badge>
                    {p.name && <span className="text-sm font-medium">{p.name}</span>}
                  </div>
                  <div className="flex gap-2">
                    {p.prompt && (
                      <Button variant="ghost" size="sm" onClick={() => copyPrompt(p.prompt)}>
                        <Copy className="h-4 w-4 mr-1" />
                        复制
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => {
                        if (formData.prompts.length > 1) {
                          const newPrompts = formData.prompts.filter((_, i) => i !== idx);
                          setFormData({ ...formData, prompts: newPrompts });
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-slate-400" />
                    </Button>
                  </div>
                </div>
                
                <div className="grid gap-3">
                  <Input
                    value={p.name}
                    onChange={(e) => {
                      const newPrompts = formData.prompts.map((pr, i) => 
                        i === idx ? { ...pr, name: e.target.value } : pr
                      );
                      setFormData({ ...formData, prompts: newPrompts });
                    }}
                    placeholder="提示词名称，如：作文批改提示词"
                    className="bg-white h-10"
                  />
                  
                  <Textarea
                    value={p.prompt}
                    onChange={(e) => {
                      const newPrompts = formData.prompts.map((pr, i) => 
                        i === idx ? { ...pr, prompt: e.target.value } : pr
                      );
                      setFormData({ ...formData, prompts: newPrompts });
                    }}
                    placeholder="你是一位经验丰富的语文教师，请帮我批改以下学生作文..."
                    rows={4}
                    className="bg-white font-mono text-sm"
                  />
                  
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-500">使用目的</Label>
                      <Input
                        value={p.purpose || ''}
                        onChange={(e) => {
                          const newPrompts = formData.prompts.map((pr, i) => 
                            i === idx ? { ...pr, purpose: e.target.value } : pr
                          );
                          setFormData({ ...formData, prompts: newPrompts });
                        }}
                        placeholder="这个提示词的用途"
                        className="bg-white h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-500">使用心得</Label>
                      <Input
                        value={p.notes || ''}
                        onChange={(e) => {
                          const newPrompts = formData.prompts.map((pr, i) => 
                            i === idx ? { ...pr, notes: e.target.value } : pr
                          );
                          setFormData({ ...formData, prompts: newPrompts });
                        }}
                        placeholder="使用技巧或注意事项"
                        className="bg-white h-9"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full border-dashed"
              onClick={() => setFormData({ 
                ...formData, 
                prompts: [...formData.prompts, { name: '', prompt: '', purpose: '', notes: '' }] 
              })}
            >
              <Plus className="h-4 w-4 mr-2" />
              添加提示词
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* 课堂融合步骤 */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500">
              <Lightbulb className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">课堂融合步骤</CardTitle>
              <CardDescription>如何将AI工具融入教学过程</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {formData.integrationSteps.map((step: string, idx: number) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-sm font-medium text-amber-600 mt-1">
                  {idx + 1}
                </div>
                <Textarea
                  value={step}
                  onChange={(e) => {
                    const newSteps = formData.integrationSteps.map((s: string, i: number) => i === idx ? e.target.value : s);
                    setFormData({ ...formData, integrationSteps: newSteps });
                  }}
                  placeholder={`第${idx + 1}步：描述如何将AI工具融入教学...`}
                  className="flex-1 min-h-[60px] bg-white"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 mt-1"
                  onClick={() => {
                    if (formData.integrationSteps.length > 1) {
                      const newSteps = formData.integrationSteps.filter((_: string, i: number) => i !== idx);
                      setFormData({ ...formData, integrationSteps: newSteps });
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
              onClick={() => setFormData({ ...formData, integrationSteps: [...formData.integrationSteps, ''] })}
            >
              <Plus className="h-4 w-4 mr-2" />
              添加步骤
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* 效果评估与反思 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">应用效果</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.effects}
              onChange={(e) => setFormData({ ...formData, effects: e.target.value })}
              placeholder="描述AI工具应用后的效果，如效率提升、学生反馈等..."
              rows={4}
            />
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">遇到的问题</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.challenges}
              onChange={(e) => setFormData({ ...formData, challenges: e.target.value })}
              placeholder="记录使用过程中遇到的问题和困难..."
              rows={4}
            />
          </CardContent>
        </Card>
      </div>
      
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">改进建议</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.suggestions}
            onChange={(e) => setFormData({ ...formData, suggestions: e.target.value })}
            placeholder="总结经验教训，提出改进建议..."
            rows={3}
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
          className="min-w-24 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
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
