'use client';

/**
 * 教研成果管理组件
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
  Trophy,
  Plus,
  Search,
  Filter,
  Loader2,
  ExternalLink,
  FileText,
  BookOpen,
  FileVideo,
  Users,
  Presentation,
  FileCheck,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  ACHIEVEMENT_TYPE_LABELS, 
  SUBJECTS,
  type ResearchAchievement,
  type AchievementType,
  type AchievementStatus
} from '@/types/research';

interface AchievementManagerProps {
  themeId?: string;
}

const ACHIEVEMENT_TYPE_ICONS: Record<AchievementType, React.ElementType> = {
  lesson_plan: FileText,
  lesson_case: BookOpen,
  paper: FileCheck,
  student_work: Users,
  report: Presentation,
  video: FileVideo,
};

const ACHIEVEMENT_STATUS_COLORS: Record<AchievementStatus, string> = {
  draft: 'bg-gray-100 text-gray-600',
  pending: 'bg-yellow-100 text-yellow-600',
  published: 'bg-green-100 text-green-600',
};

export default function AchievementManager({ themeId }: AchievementManagerProps) {
  const [achievements, setAchievements] = useState<ResearchAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    type: 'lesson_plan' as AchievementType,
    subject: '',
    description: '',
    fileUrl: '',
    fileName: '',
    authorNames: '',
    isPublic: false,
  });
  
  useEffect(() => {
    loadAchievements();
  }, [themeId]);
  
  const loadAchievements = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (themeId) params.append('themeId', themeId);
      
      const res = await fetch(`/api/research/achievements?${params.toString()}`);
      const data = await res.json();
      
      if (data.success) {
        setAchievements(data.data || []);
      }
    } catch (err) {
      console.error('加载成果失败:', err);
      toast.error('加载成果失败');
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
      const res = await fetch('/api/research/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          type: formData.type,
          subject: formData.subject || undefined,
          themeId: themeId || undefined,
          description: formData.description,
          fileUrl: formData.fileUrl || undefined,
          fileName: formData.fileName || undefined,
          authorNames: formData.authorNames ? formData.authorNames.split(',').map(s => s.trim()) : undefined,
          isPublic: formData.isPublic,
          status: 'draft',
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success('成果创建成功');
        setCreateDialogOpen(false);
        setFormData({
          title: '',
          type: 'lesson_plan',
          subject: '',
          description: '',
          fileUrl: '',
          fileName: '',
          authorNames: '',
          isPublic: false,
        });
        loadAchievements();
      } else {
        toast.error(data.error || '创建失败');
      }
    } catch (err) {
      console.error('创建成果失败:', err);
      toast.error('创建失败');
    } finally {
      setSubmitting(false);
    }
  };
  
  const filteredAchievements = achievements.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || a.type === filterType;
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
              placeholder="搜索成果..."
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
              {Object.entries(ACHIEVEMENT_TYPE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              添加成果
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>添加教研成果</DialogTitle>
              <DialogDescription>
                记录教研过程中产出的教案、课例、论文等成果
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">成果名称 *</Label>
                <Input
                  id="title"
                  placeholder="输入成果名称"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>成果类型</Label>
                  <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as AchievementType })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ACHIEVEMENT_TYPE_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>学科</Label>
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
                <Label>成果描述</Label>
                <Textarea
                  placeholder="描述成果内容、创新点等"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              
              <div className="grid gap-2">
                <Label>作者（用逗号分隔）</Label>
                <Input
                  placeholder="如：张老师, 李老师"
                  value={formData.authorNames}
                  onChange={e => setFormData({ ...formData, authorNames: e.target.value })}
                />
              </div>
              
              <div className="grid gap-2">
                <Label>文件链接</Label>
                <Input
                  placeholder="输入文件URL"
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
      
      {/* 成果列表 */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : filteredAchievements.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">暂无成果</h3>
            <p className="text-gray-500 mt-1">点击"添加成果"记录教研产出</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredAchievements.map(achievement => {
            const TypeIcon = ACHIEVEMENT_TYPE_ICONS[achievement.type] || Trophy;
            return (
              <Card key={achievement.id} className="hover:shadow-md transition-shadow">
                <CardContent className="py-4">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-gray-50">
                      <TypeIcon className="h-6 w-6 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">{achievement.title}</h3>
                        <Badge className={ACHIEVEMENT_STATUS_COLORS[achievement.status]}>
                          {achievement.status === 'draft' ? '草稿' : achievement.status === 'pending' ? '待发布' : '已发布'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                        <span>{achievement.typeLabel}</span>
                        {achievement.subject && (
                          <>
                            <span>·</span>
                            <span>{achievement.subject}</span>
                          </>
                        )}
                      </div>
                      {achievement.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">{achievement.description}</p>
                      )}
                      {achievement.authorNames && achievement.authorNames.length > 0 && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                          <Users className="h-3 w-3" />
                          {achievement.authorNames.join(', ')}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {achievement.viewCount}
                      </span>
                      {achievement.fileUrl && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => window.open(achievement.fileUrl, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
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
