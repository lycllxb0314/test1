'use client';

import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play } from 'lucide-react';
import { SOPTemplate, SOP_CATEGORY_LABELS } from '@/types/class-sop';
import { categoryConfig } from '../lib/constants';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  template: SOPTemplate | null;
  onExecute: (t: SOPTemplate) => void;
}

export const TemplateDetailDialog: React.FC<Props> = ({ open, onOpenChange, template, onExecute }) => {
  if (!template) return null;

  const config = categoryConfig[template.category];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl ${config.bg} flex items-center justify-center`}>
              <config.icon className={`h-6 w-6 ${config.color}`} />
            </div>
            <div>
              <DialogTitle>{template.name}</DialogTitle>
              <DialogDescription>{template.description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <Badge variant="secondary">{SOP_CATEGORY_LABELS[template.category]}</Badge>
            <span>{template.steps.length} 个步骤</span>
            {template.usageCount > 0 && <span>已使用 {template.usageCount} 次</span>}
          </div>

          <div className="space-y-3">
            {template.steps.map((step, index) => (
              <div key={index} className="flex gap-3 p-4 bg-slate-50 rounded-xl">
                <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-medium shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-slate-900">{step.title}</div>
                  {step.description && (
                    <p className="text-sm text-slate-500 mt-1">{step.description}</p>
                  )}
                  {step.checkpoints && step.checkpoints.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {step.checkpoints.map((cp, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{cp}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>关闭</Button>
          <Button onClick={() => { onOpenChange(false); onExecute(template); }}>
            <Play className="h-4 w-4 mr-1.5" />
            开始执行
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
