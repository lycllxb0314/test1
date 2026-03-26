'use client';

/**
 * 教研活动创建对话框
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ACTIVITY_TYPE_LABELS, type ActivityType } from '@/types/research';

interface ActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  themeId: string;
  stageId?: string;
  onSuccess?: () => void;
}

export default function ActivityDialog({ 
  open, 
  onOpenChange, 
  themeId, 
  stageId,
  onSuccess 
}: ActivityDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    type: 'seminar' as ActivityType,
    description: '',
    location: '',
    scheduledAt: '',
    duration: 60,
    participantIds: '',
  });
  
  const handleSubmit = async () => {
    if (!formData.title || !formData.type) {
      toast.error('请填写必填字段');
      return;
    }
    
    setSubmitting(true);
    try {
      const res = await fetch('/api/research/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          themeId,
          stageId,
          title: formData.title,
          type: formData.type,
          description: formData.description,
          location: formData.location,
          scheduledAt: formData.scheduledAt || null,
          duration: formData.duration,
          participantIds: formData.participantIds 
            ? formData.participantIds.split(',').map(s => s.trim()) 
            : [],
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success('教研活动创建成功');
        setFormData({
          title: '',
          type: 'seminar',
          description: '',
          location: '',
          scheduledAt: '',
          duration: 60,
          participantIds: '',
        });
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(data.error || '创建失败');
      }
    } catch (err) {
      console.error('创建活动失败:', err);
      toast.error('创建失败');
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>创建教研活动</DialogTitle>
          <DialogDescription>
            安排一次教研活动，支持研讨会、听课评课等多种形式
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">活动名称 *</Label>
            <Input
              id="title"
              placeholder="输入活动名称"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>活动类型</Label>
              <Select 
                value={formData.type} 
                onValueChange={v => setFormData({ ...formData, type: v as ActivityType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ACTIVITY_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>时长(分钟)</Label>
              <Input
                type="number"
                value={formData.duration}
                onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) || 60 })}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>活动地点</Label>
              <Input
                placeholder="如：三楼会议室"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>计划时间</Label>
              <Input
                type="datetime-local"
                value={formData.scheduledAt}
                onChange={e => setFormData({ ...formData, scheduledAt: e.target.value })}
              />
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label>活动描述</Label>
            <Textarea
              placeholder="描述活动内容、议程等"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
          
          <div className="grid gap-2">
            <Label>参与教师ID（用逗号分隔）</Label>
            <Input
              placeholder="如：t001, t002, t003"
              value={formData.participantIds}
              onChange={e => setFormData({ ...formData, participantIds: e.target.value })}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            创建
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
