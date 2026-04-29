'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X } from 'lucide-react';
import { SOPCategory, SOPTemplate, SOPStep, SOP_CATEGORY_LABELS } from '@/types/class-sop';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  template: SOPTemplate | null;
  onSuccess: () => void;
}

export const CreateTemplateDialog: React.FC<Props> = ({ open, onOpenChange, template, onSuccess }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<SOPCategory>('conflict');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState<Omit<SOPStep, 'order'>[]>([
    { title: '', description: '', isRequired: true, checkpoints: [] },
  ]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (template) {
      setName(template.name);
      setCategory(template.category);
      setDescription(template.description || '');
      setSteps(template.steps.map(s => ({
        title: s.title,
        description: s.description || '',
        isRequired: s.isRequired,
        checkpoints: s.checkpoints || [],
      })));
    } else {
      setName('');
      setCategory('conflict');
      setDescription('');
      setSteps([{ title: '', description: '', isRequired: true, checkpoints: [] }]);
    }
  }, [template, open]);

  const addStep = () => {
    setSteps([...steps, { title: '', description: '', isRequired: true, checkpoints: [] }]);
  };

  const removeStep = (index: number) => {
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== index));
    }
  };

  const updateStep = (index: number, field: string, value: unknown) => {
    setSteps(steps.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const handleSave = async () => {
    if (!name.trim() || steps.some(s => !s.title.trim())) {
      alert('请填写流程名称和所有步骤标题');
      return;
    }

    setSaving(true);
    try {
      const url = template
        ? `/api/class-sop/templates/${template.id}`
        : '/api/class-sop/templates';
      const method = template ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          category,
          description,
          steps: steps.map((s, i) => ({ ...s, order: i + 1 })),
        }),
      });

      if (res.ok) {
        onOpenChange(false);
        onSuccess();
      }
    } catch (e) {
      console.error('保存失败:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{template ? '编辑流程' : '创建新流程'}</DialogTitle>
          <DialogDescription>
            设计您自己的标准化操作流程，帮助规范工作、留存证据
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* 基本信息 */}
          <div className="space-y-4">
            <div>
              <Label>流程名称 *</Label>
              <Input
                placeholder="如：学生冲突处理流程"
                value={name}
                onChange={e => setName(e.target.value)}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label>类别</Label>
              <Select value={category} onValueChange={v => setCategory(v as SOPCategory)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SOP_CATEGORY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>描述</Label>
              <Textarea
                placeholder="简要描述这个流程的用途..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="mt-1.5"
                rows={2}
              />
            </div>
          </div>

          {/* 步骤 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>执行步骤</Label>
              <Button size="sm" variant="outline" onClick={addStep}>
                <Plus className="h-3 w-3 mr-1" />
                添加步骤
              </Button>
            </div>

            <div className="space-y-3">
              {steps.map((step, index) => (
                <div key={index} className="p-4 border rounded-xl bg-slate-50">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-medium shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 space-y-3">
                      <Input
                        placeholder="步骤标题 *"
                        value={step.title}
                        onChange={e => updateStep(index, 'title', e.target.value)}
                      />
                      <Textarea
                        placeholder="步骤说明（可选）"
                        value={step.description || ''}
                        onChange={e => updateStep(index, 'description', e.target.value)}
                        rows={2}
                      />
                    </div>
                    {steps.length > 1 && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeStep(index)}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
