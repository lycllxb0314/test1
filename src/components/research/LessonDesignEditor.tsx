'use client';

/**
 * 教学设计编辑器组件
 * 
 * 功能：
 * - 根据主题类型显示不同的编辑器
 * - 保存教学设计
 * - 自动同步到资源库
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Save, Eye } from 'lucide-react';
import { toast } from 'sonner';

import BigUnitEditor from './BigUnitEditor';
import ProjectEditor from './ProjectEditor';
import PracticeEditor from './PracticeEditor';
import AITeachingEditor from './AITeachingEditor';

import type { ThemeType } from '@/types/research';

interface LessonDesignEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  themeId: string;
  themeType: ThemeType;
  activityId: string;
  design?: {
    id: string;
    title: string;
    teacherName: string;
    content: any;
  };
  onSave: () => void;
}

export default function LessonDesignEditor({
  open,
  onOpenChange,
  themeId,
  themeType,
  activityId,
  design,
  onSave,
}: LessonDesignEditorProps) {
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState<any>(design?.content || null);
  
  useEffect(() => {
    if (design) {
      setContent(design.content);
    } else {
      setContent(null);
    }
  }, [design]);
  
  const handleSave = async (data: any) => {
    setSaving(true);
    try {
      const payload = {
        activityId,
        themeId,
        teacherName: design?.teacherName || '',
        title: design?.title || '',
        designType: themeType,
        content: data,
      };
      
      if (design?.id) {
        // 更新
        const res = await fetch(`/api/research/designs/${design.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: data }),
        });
        const result = await res.json();
        
        if (result.success) {
          toast.success('保存成功');
          onSave();
        } else {
          toast.error(result.error || '保存失败');
        }
      } else {
        // 创建
        const res = await fetch('/api/research/designs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const result = await res.json();
        
        if (result.success) {
          toast.success('保存成功');
          onSave();
        } else {
          toast.error(result.error || '保存失败');
        }
      }
    } catch (err) {
      console.error('保存失败:', err);
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };
  
  const getEditorTitle = () => {
    switch (themeType) {
      case 'big_unit': return '大单元教学设计';
      case 'project': return '项目式教学设计';
      case 'practice': return '学科实践活动设计';
      case 'ai_enabled': return 'AI赋能教学设计';
      default: return '教学设计';
    }
  };
  
  const renderEditor = () => {
    const props = {
      themeId,
      design: content,
      onSave: handleSave,
    };
    
    switch (themeType) {
      case 'big_unit':
        return <BigUnitEditor {...props} />;
      case 'project':
        return <ProjectEditor {...props} />;
      case 'practice':
        return <PracticeEditor {...props} />;
      case 'ai_enabled':
        return <AITeachingEditor {...props} />;
      default:
        return (
          <div className="text-center py-12 text-slate-400">
            自定义主题暂无专用编辑器
          </div>
        );
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{getEditorTitle()}</DialogTitle>
          {design && (
            <DialogDescription>
              {design.teacherName} - {design.title}
            </DialogDescription>
          )}
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto py-4">
          {renderEditor()}
        </div>
        
        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
