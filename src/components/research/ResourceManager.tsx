'use client';

/**
 * 教研资源管理组件
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  FileText,
  Download,
  Eye,
  Plus,
  Search,
  Filter,
  Loader2,
  ExternalLink,
  File,
  Video,
  BookOpen,
  Wrench,
  FileQuestion,
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  RESOURCE_TYPE_LABELS, 
  THEME_TYPE_LABELS, 
  SUBJECTS,
  type ResearchResource,
  type ResourceType,
  type ThemeType
} from '@/types/research';

interface ResourceManagerProps {
  themeType?: ThemeType;
  subject?: string;
}

const RESOURCE_TYPE_ICONS: Record<ResourceType, React.ElementType> = {
  template: FileText,
  lesson_case: BookOpen,
  tool: Wrench,
  guide: FileQuestion,
  video: Video,
  document: File,
};

export default function ResourceManager({ themeType, subject }: ResourceManagerProps) {
  const [resources, setResources] = useState<ResearchResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'document' as ResourceType,
    themeType: themeType || '',
    subject: subject || '',
    tags: '',
    fileUrl: '',
    fileName: '',
    content: '',
  });
  
  useEffect(() => {
    loadResources();
  }, [themeType, subject]);
  
  const loadResources = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (themeType) params.append('themeType', themeType);
      if (subject) params.append('subject', subject);
      
      const res = await fetch(`/api/research/resources?${params.toString()}`);
      const data = await res.json();
      
      if (data.success) {
        setResources(data.data || []);
      }
    } catch (err) {
      console.error('加载资源失败:', err);
      toast.error('加载资源失败');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreate = async () => {
    if (!formData.title || !formData.type) {
      toast.error('请填写必填字段');
      return;
    }
    
    setSubmitting(true);
    try {
      const res = await fetch('/api/research/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          type: formData.type,
          themeType: formData.themeType || undefined,
          subject: formData.subject || undefined,
          tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
          fileUrl: formData.fileUrl || undefined,
          fileName: formData.fileName || undefined,
          content: formData.content || undefined,
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success('资源创建成功');
        setCreateDialogOpen(false);
        setFormData({
          title: '',
          description: '',
          type: 'document',
          themeType: themeType || '',
          subject: subject || '',
          tags: '',
          fileUrl: '',
          fileName: '',
          content: '',
        });
        loadResources();
      } else {
        toast.error(data.error || '创建失败');
      }
    } catch (err) {
      console.error('创建资源失败:', err);
      toast.error('创建失败');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleView = (resource: ResearchResource) => {
    if (resource.fileUrl) {
      window.open(resource.fileUrl, '_blank');
    }
  };
  
  const filteredResources = resources.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesType = filterType === 'all' || r.type === filterType;
    return matchesSearch && matchesType;
  });
  
  return (
    <div className="space-y-4">
      {/* 工具栏 */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="搜索资源..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-32">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              {Object.entries(RESOURCE_TYPE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              上传资源
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>上传教研资源</DialogTitle>
              <DialogDescription>
                上传教学设计、课件、工具等教研资源
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">资源名称 *</Label>
                <Input
                  id="title"
                  placeholder="输入资源名称"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>资源类型</Label>
                  <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as ResourceType })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(RESOURCE_TYPE_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>关联学科</Label>
                  <Select value={formData.subject} onValueChange={(v) => setFormData({ ...formData, subject: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择学科" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBJECTS.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label>关联主题类型</Label>
                <Select value={formData.themeType} onValueChange={(v) => setFormData({ ...formData, themeType: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择主题类型" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(THEME_TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label>资源描述</Label>
                <Textarea
                  placeholder="描述资源内容、用途等"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>
              
              <div className="grid gap-2">
                <Label>标签（用逗号分隔）</Label>
                <Input
                  placeholder="如：教学设计, 语文, 三年级"
                  value={formData.tags}
                  onChange={e => setFormData({ ...formData, tags: e.target.value })}
                />
              </div>
              
              <div className="grid gap-2">
                <Label>文件链接</Label>
                <Input
                  placeholder="输入文件URL或上传后的链接"
                  value={formData.fileUrl}
                  onChange={e => setFormData({ ...formData, fileUrl: e.target.value })}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>取消</Button>
              <Button onClick={handleCreate} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                创建
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* 资源列表 */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : filteredResources.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">暂无资源</h3>
            <p className="text-gray-500 mt-1">点击"上传资源"添加教研资源</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources.map(resource => {
            const TypeIcon = RESOURCE_TYPE_ICONS[resource.type] || File;
            return (
              <Card key={resource.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <TypeIcon className="h-5 w-5 text-gray-400 mt-1" />
                    <Badge variant="outline">{resource.typeLabel}</Badge>
                  </div>
                  <CardTitle className="text-base line-clamp-1">{resource.title}</CardTitle>
                  {resource.subject && (
                    <CardDescription className="text-xs">{resource.subject}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {resource.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">{resource.description}</p>
                  )}
                  {resource.tags && resource.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {resource.tags.slice(0, 3).map((tag, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {resource.viewCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <Download className="h-3 w-3" />
                        {resource.downloadCount}
                      </span>
                    </div>
                    {resource.fileUrl && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 px-2"
                        onClick={() => handleView(resource)}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        查看
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
