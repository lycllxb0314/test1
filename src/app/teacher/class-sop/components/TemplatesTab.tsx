'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Plus, Star, Lightbulb, Eye, Edit3, Copy, Play } from 'lucide-react';
import { SOPCategory, SOPTemplate, SOP_CATEGORY_LABELS } from '@/types/class-sop';
import { categoryConfig } from '../lib/constants';
import { TemplateDetailDialog } from './TemplateDetailDialog';

// ==================== 分类筛选 ====================

const CategoryFilter: React.FC<{
  value: SOPCategory | 'all';
  onChange: (v: SOPCategory | 'all') => void;
}> = ({ value, onChange }) => (
  <div className="flex items-center gap-1.5 flex-wrap">
    <button
      onClick={() => onChange('all')}
      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
        value === 'all'
          ? 'bg-slate-900 text-white'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      }`}
    >
      全部
    </button>
    {Object.entries(SOP_CATEGORY_LABELS).map(([key, label]) => {
      const config = categoryConfig[key as SOPCategory];
      const Icon = config.icon;
      const isActive = value === key;

      return (
        <button
          key={key}
          onClick={() => onChange(key as SOPCategory)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
            isActive
              ? `${config.bg} ${config.color}`
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Icon className="h-3 w-3" />
          {label}
        </button>
      );
    })}
  </div>
);

// ==================== 模板卡片 ====================

const TemplateCard: React.FC<{
  template: SOPTemplate;
  onExecute: () => void;
  onView: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onCopy?: () => void;
  isSystem?: boolean;
}> = ({ template, onExecute, onView, onEdit, onDelete, onCopy, isSystem }) => {
  const config = categoryConfig[template.category];
  const Icon = config.icon;

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border-0 bg-white/80 backdrop-blur-sm">
      <CardContent className="p-5">
        {/* 头部 */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center`}>
              <Icon className={`h-5 w-5 ${config.color}`} />
            </div>
            <div>
              <h3 className="font-medium text-slate-900 line-clamp-1">{template.name}</h3>
              <p className="text-xs text-slate-500">{SOP_CATEGORY_LABELS[template.category]}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onView}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"
            >
              <Eye className="h-4 w-4" />
            </button>
            {!isSystem && onEdit && (
              <button
                onClick={onEdit}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <Edit3 className="h-4 w-4" />
              </button>
            )}
            {isSystem && onCopy && (
              <button
                onClick={onCopy}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <Copy className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* 描述 */}
        <p className="text-sm text-slate-500 line-clamp-2 mb-4 min-h-[40px]">
          {template.description}
        </p>

        {/* 底部 */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>{template.steps.length} 步骤</span>
            {template.usageCount > 0 && (
              <>
                <span>·</span>
                <span>使用 {template.usageCount} 次</span>
              </>
            )}
          </div>

          <Button size="sm" onClick={onExecute} className="gap-1">
            <Play className="h-3 w-3" />
            执行
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// ==================== 模板 Tab ====================

interface TemplatesTabProps {
  templates: SOPTemplate[];
  myTemplates: SOPTemplate[];
  systemTemplates: SOPTemplate[];
  loading: boolean;
  selectedCategory: SOPCategory | 'all';
  onCategoryChange: (c: SOPCategory | 'all') => void;
  onExecute: (t: SOPTemplate) => void;
  onView: (t: SOPTemplate) => void;
  onEdit: (t: SOPTemplate) => void;
  onDelete: (id: string) => void;
  onCreateNew: () => void;
}

export const TemplatesTab: React.FC<TemplatesTabProps> = ({
  templates, myTemplates, systemTemplates, loading,
  selectedCategory, onCategoryChange,
  onExecute, onView, onEdit, onDelete, onCreateNew,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<SOPTemplate | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const handleView = (t: SOPTemplate) => {
    setSelectedTemplate(t);
    setShowDetailDialog(true);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-5">
              <div className="h-5 bg-slate-200 rounded w-2/3 mb-3" />
              <div className="h-3 bg-slate-100 rounded w-full mb-2" />
              <div className="h-3 bg-slate-100 rounded w-4/5" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 分类筛选 */}
      <div className="flex items-center gap-2 flex-wrap">
        <CategoryFilter value={selectedCategory} onChange={onCategoryChange} />
      </div>

      {/* 我的模板 */}
      {myTemplates.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              我的流程
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myTemplates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                onExecute={() => onExecute(template)}
                onView={() => handleView(template)}
                onEdit={() => onEdit(template)}
                onDelete={() => onDelete(template.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* 系统模板 */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-slate-700 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-blue-500" />
            推荐模板
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {systemTemplates.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              onExecute={() => onExecute(template)}
              onView={() => handleView(template)}
              onCopy={() => { /* TODO */ }}
              isSystem
            />
          ))}
        </div>
      </section>

      {/* 空状态 */}
      {templates.length === 0 && (
        <Card className="py-16">
          <CardContent className="text-center">
            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 mb-4">暂无流程模板</p>
            <Button onClick={onCreateNew}>
              <Plus className="h-4 w-4 mr-1.5" />
              创建第一个流程
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 模板详情弹窗 */}
      <TemplateDetailDialog
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
        template={selectedTemplate}
        onExecute={onExecute}
      />
    </div>
  );
};
