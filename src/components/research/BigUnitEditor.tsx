'use client';

/**
 * 大单元教学设计编辑组件
 * 
 * 设计理念：
 * - 模块化卡片布局
 * - 清晰的视觉层次
 * - 友好的编辑体验
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  BarChart3,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { SUBJECTS, type BigUnitDesign, type LessonDesign, type HomeworkDesign } from '@/types/research';

interface BigUnitEditorProps {
  themeId: string;
  design?: BigUnitDesign;
  onSave?: (data: Partial<BigUnitDesign>) => void;
}

// ==================== 配置 ====================

const GRADES = [
  { value: 1, label: '一年级' },
  { value: 2, label: '二年级' },
  { value: 3, label: '三年级' },
  { value: 4, label: '四年级' },
  { value: 5, label: '五年级' },
  { value: 6, label: '六年级' },
];

// ==================== 子组件 ====================

function ArrayFieldEditor({
  label,
  description,
  items,
  onChange,
  onAdd,
  onRemove,
  placeholder,
  icon: Icon,
}: {
  label: string;
  description?: string;
  items: string[];
  onChange: (index: number, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  placeholder?: string;
  icon?: React.ElementType;
}) {
  const [expanded, setExpanded] = useState(true);
  
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <div 
        className="flex items-center justify-between px-4 py-3 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon className="h-4 w-4 text-slate-500" />}
          <div>
            <h4 className="font-medium text-slate-900">{label}</h4>
            {description && <p className="text-xs text-slate-500">{description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="font-normal">
            {items.filter(i => i.trim()).length} 项
          </Badge>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </div>
      </div>
      
      {expanded && (
        <div className="p-4 space-y-3 bg-white">
          {items.map((item, index) => (
            <div key={index} className="flex items-start gap-2 group">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-xs font-medium text-blue-600 mt-2">
                {index + 1}
              </div>
              <Textarea
                value={item}
                onChange={(e) => onChange(index, e.target.value)}
                placeholder={placeholder}
                className="flex-1 min-h-[60px] resize-none"
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity mt-1"
                onClick={() => onRemove(index)}
              >
                <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-500" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={onAdd} className="w-full border-dashed">
            <Plus className="h-4 w-4 mr-2" />
            添加条目
          </Button>
        </div>
      )}
    </div>
  );
}

// ==================== 主组件 ====================

export default function BigUnitEditor({ themeId, design, onSave }: BigUnitEditorProps) {
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    unitName: design?.unitName || '',
    grade: design?.grade || 3,
    subject: design?.subject || '语文',
    unitGoals: design?.unitGoals?.length ? design.unitGoals : [''],
    coreKnowledge: design?.coreKnowledge?.length ? design.coreKnowledge : [''],
    keyCompetencies: design?.keyCompetencies?.length ? design.keyCompetencies : [''],
    difficultPoints: design?.difficultPoints?.length ? design.difficultPoints : [''],
    errorPronePoints: design?.errorPronePoints?.length ? design.errorPronePoints : [''],
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
  
  return (
    <div className="space-y-6">
      {/* 基本信息 */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-cyan-50/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">单元基本信息</CardTitle>
              <CardDescription>填写大单元的基础信息</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2 space-y-2">
              <Label className="text-sm font-medium">单元名称 *</Label>
              <Input
                value={formData.unitName}
                onChange={(e) => setFormData({ ...formData, unitName: e.target.value })}
                placeholder="例如：第三单元·大自然的秘密"
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
                    {GRADES.map(g => (
                      <SelectItem key={g.value} value={String(g.value)}>{g.label}</SelectItem>
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
          
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-2 md:col-span-1 space-y-2">
              <Label className="text-sm font-medium">课时数</Label>
              <Input
                type="number"
                min={0}
                value={formData.lessonCount}
                onChange={(e) => setFormData({ ...formData, lessonCount: Number(e.target.value) })}
                className="bg-white h-11"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 教学设计 */}
      <div className="grid gap-4 md:grid-cols-2">
        <ArrayFieldEditor
          label="单元目标"
          description="本单元要达成的教学目标"
          items={formData.unitGoals}
          onChange={(i, v) => handleArrayFieldChange('unitGoals', i, v)}
          onAdd={() => addArrayItem('unitGoals')}
          onRemove={(i) => removeArrayItem('unitGoals', i)}
          placeholder="例如：学生能够理解并运用本单元重点词汇..."
          icon={Target}
        />
        
        <ArrayFieldEditor
          label="核心知识"
          description="本单元的核心知识点"
          items={formData.coreKnowledge}
          onChange={(i, v) => handleArrayFieldChange('coreKnowledge', i, v)}
          onAdd={() => addArrayItem('coreKnowledge')}
          onRemove={(i) => removeArrayItem('coreKnowledge', i)}
          placeholder="例如：认识自然景物描写的修辞手法..."
          icon={Lightbulb}
        />
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <ArrayFieldEditor
          label="核心素养"
          description="本单元培养的核心素养"
          items={formData.keyCompetencies}
          onChange={(i, v) => handleArrayFieldChange('keyCompetencies', i, v)}
          onAdd={() => addArrayItem('keyCompetencies')}
          onRemove={(i) => removeArrayItem('keyCompetencies', i)}
          placeholder="例如：语言建构与运用、思维发展与提升..."
          icon={Sparkles}
        />
        
        <ArrayFieldEditor
          label="教学难点"
          description="学生理解掌握的难点"
          items={formData.difficultPoints}
          onChange={(i, v) => handleArrayFieldChange('difficultPoints', i, v)}
          onAdd={() => addArrayItem('difficultPoints')}
          onRemove={(i) => removeArrayItem('difficultPoints', i)}
          placeholder="例如：比喻与拟人手法的区别与运用..."
          icon={AlertTriangle}
        />
      </div>
      
      <ArrayFieldEditor
        label="易错点"
        description="学生容易犯错的知识点"
        items={formData.errorPronePoints}
        onChange={(i, v) => handleArrayFieldChange('errorPronePoints', i, v)}
        onAdd={() => addArrayItem('errorPronePoints')}
        onRemove={(i) => removeArrayItem('errorPronePoints', i)}
        placeholder="例如：'的、地、得'的正确使用..."
        icon={AlertTriangle}
      />
      
      {/* 课时设计 */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">课时设计</CardTitle>
              <CardDescription>规划每个课时的教学内容</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {formData.lessonDesigns.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-10 w-10 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 text-sm mb-3">暂无课时设计</p>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                添加课时
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {formData.lessonDesigns.map((lesson, idx) => (
                <div 
                  key={idx}
                  className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center font-medium text-indigo-600">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-slate-900">{lesson.title || `第${idx + 1}课时`}</h4>
                    <p className="text-sm text-slate-500 truncate">{lesson.keyPoints?.join('、') || lesson.objectives?.join('、') || '暂无内容'}</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    编辑
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* 作业设计 */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500">
              <ClipboardList className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">作业设计</CardTitle>
              <CardDescription>设计单元作业与练习</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {formData.homeworkDesigns.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardList className="h-10 w-10 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 text-sm mb-3">暂无作业设计</p>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                添加作业
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {formData.homeworkDesigns.map((hw, idx) => (
                <div 
                  key={idx}
                  className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <ClipboardList className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-slate-900">{hw.type}</h4>
                    <p className="text-sm text-slate-500 truncate">{hw.content?.slice(0, 50)} · 预计用时{hw.estimatedTime}分钟</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    编辑
                  </Button>
                </div>
              ))}
            </div>
          )}
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
          className="min-w-24 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
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
