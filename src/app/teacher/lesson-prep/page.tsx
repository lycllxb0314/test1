/**
 * 教师空间 - 备课中心页面
 * 
 * 功能：
 * - 学科选择与学科特色功能
 * - 备课文档管理（文本解读、教学设计、课堂策略）
 * - 语文学科：王崧舟"诗意语文"教学理念支持
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BookOpen,
  Calculator,
  Languages,
  FlaskConical,
  Heart,
  Music,
  Palette,
  Trophy,
  Plus,
  FileText,
  Target,
  Lightbulb,
  Eye,
  Edit,
  Trash2,
  ChevronRight,
  Clock,
  Loader2,
  Search,
  FolderOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  SubjectType,
  SubjectConfig,
  PrepDocument,
  PrepDocType,
} from '@/types/lesson-prep';
import { SUBJECT_CONFIGS } from '@/types/lesson-prep';

// ==================== 图标映射 ====================

const SUBJECT_ICONS: Record<string, React.ElementType> = {
  BookOpen,
  Calculator,
  Languages,
  FlaskConical,
  Heart,
  Music,
  Palette,
  Trophy,
};

const DOC_TYPE_LABELS: Record<PrepDocType, string> = {
  text_interpretation: '文本解读',
  lesson_design: '教学设计',
  teaching_reflection: '教学反思',
  resource_material: '教学素材',
  classroom_strategy: '课堂策略',
};

const STATUS_LABELS: Record<string, string> = {
  draft: '草稿',
  reviewing: '审核中',
  published: '已发布',
  archived: '已归档',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  reviewing: 'bg-blue-100 text-blue-600',
  published: 'bg-green-100 text-green-600',
  archived: 'bg-yellow-100 text-yellow-600',
};

// ==================== 主组件 ====================

export default function LessonPrepPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  // 状态
  const [selectedSubject, setSelectedSubject] = useState<SubjectType>('chinese');
  const [documents, setDocuments] = useState<PrepDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    totalDocs: number;
    bySubject: Record<string, number>;
    byDocType: Record<string, number>;
  } | null>(null);
  
  // 对话框状态
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createType, setCreateType] = useState<PrepDocType>('text_interpretation');
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocTextTitle, setNewDocTextTitle] = useState('');
  const [newDocGrade, setNewDocGrade] = useState<number>(1);
  const [creating, setCreating] = useState(false);
  
  // 搜索
  const [searchKeyword, setSearchKeyword] = useState('');
  
  // 获取统计数据
  const fetchStats = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const res = await fetch(`/api/lesson-prep?action=statistics&teacherId=${user.id}`);
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (e) {
      console.error('获取统计失败:', e);
    }
  }, [user?.id]);
  
  // 获取文档列表
  const fetchDocuments = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        teacherId: user.id,
        subject: selectedSubject,
        pageSize: '50',
      });
      if (searchKeyword) {
        params.append('keyword', searchKeyword);
      }
      
      const res = await fetch(`/api/lesson-prep?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setDocuments(data.data || []);
      }
    } catch (e) {
      console.error('获取文档失败:', e);
    } finally {
      setLoading(false);
    }
  }, [user?.id, selectedSubject, searchKeyword]);
  
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);
  
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);
  
  // 创建文档
  const handleCreate = async () => {
    if (!user?.id || !newDocTitle.trim()) return;
    
    setCreating(true);
    try {
      const actionMap: Record<PrepDocType, string> = {
        text_interpretation: 'createTextInterpretation',
        lesson_design: 'createLessonDesign',
        classroom_strategy: 'createClassroomStrategy',
        teaching_reflection: 'create',
        resource_material: 'create',
      };
      
      const body: Record<string, unknown> = {
        action: actionMap[createType] || 'create',
        teacherId: user.id,
        teacherName: user.name || '教师',
        subject: selectedSubject,
        title: newDocTitle,
        grade: newDocGrade,
      };
      
      if (createType === 'text_interpretation') {
        body.textTitle = newDocTextTitle || newDocTitle;
      } else if (createType === 'lesson_design') {
        body.lessonTitle = newDocTitle;
      }
      
      const res = await fetch('/api/lesson-prep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      const data = await res.json();
      if (data.success) {
        setCreateDialogOpen(false);
        setNewDocTitle('');
        setNewDocTextTitle('');
        fetchDocuments();
        fetchStats();
      } else {
        alert(data.error || '创建失败');
      }
    } catch (e) {
      console.error('创建失败:', e);
      alert('创建失败');
    } finally {
      setCreating(false);
    }
  };
  
  // 删除文档
  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个备课文档吗？')) return;
    
    try {
      const res = await fetch(`/api/lesson-prep/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchDocuments();
        fetchStats();
      }
    } catch (e) {
      console.error('删除失败:', e);
    }
  };
  
  // 获取当前学科配置
  const currentSubjectConfig = SUBJECT_CONFIGS.find(s => s.type === selectedSubject);
  
  // 渲染学科卡片
  const renderSubjectCard = (config: SubjectConfig) => {
    const Icon = SUBJECT_ICONS[config.icon] || BookOpen;
    const isSelected = selectedSubject === config.type;
    const docCount = stats?.bySubject[config.type] || 0;
    
    return (
      <Card
        key={config.type}
        className={cn(
          'cursor-pointer transition-all hover:shadow-md',
          isSelected && 'ring-2 ring-primary border-primary'
        )}
        onClick={() => setSelectedSubject(config.type)}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              'p-2 rounded-lg',
              isSelected ? 'bg-primary/10' : 'bg-muted'
            )}>
              <Icon className={cn(
                'h-5 w-5',
                isSelected ? 'text-primary' : 'text-muted-foreground'
              )} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium">{config.name}</div>
              <div className="text-xs text-muted-foreground truncate">
                {config.description}
              </div>
            </div>
            {docCount > 0 && (
              <Badge variant="secondary">{docCount}</Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };
  
  // 渲染功能卡片
  const renderFeatureCard = (feature: { id: string; name: string; description: string; category: string }) => {
    return (
      <Card
        key={feature.id}
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => {
          setCreateType(feature.id as PrepDocType);
          setCreateDialogOpen(true);
        }}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">{feature.name}</div>
              <div className="text-sm text-muted-foreground">
                {feature.description}
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  };
  
  // 渲染文档卡片
  const renderDocumentCard = (doc: PrepDocument) => {
    return (
      <Card key={doc.id} className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium truncate">{doc.title}</h3>
                <Badge className={STATUS_COLORS[doc.status]}>
                  {STATUS_LABELS[doc.status]}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                <span>{DOC_TYPE_LABELS[doc.docType]}</span>
                {doc.metadata.grade && (
                  <span>· {doc.metadata.grade}年级</span>
                )}
                <span>· {new Date(doc.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => router.push(`/teacher/lesson-prep/${doc.id}`)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(doc.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">备课中心</h1>
          <p className="text-muted-foreground">
            精准赋能每个学科，助力高效备课
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索备课文档..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
        </div>
      </div>

      {/* 学科选择 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {SUBJECT_CONFIGS.map(renderSubjectCard)}
      </div>

      {/* 主内容区 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：学科功能 */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                {currentSubjectConfig && (
                  <>
                    {React.createElement(SUBJECT_ICONS[currentSubjectConfig.icon] || BookOpen, { className: 'h-5 w-5' })}
                    {currentSubjectConfig.name}备课
                  </>
                )}
              </CardTitle>
              <CardDescription>
                {currentSubjectConfig?.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentSubjectConfig?.features.map(renderFeatureCard)}
            </CardContent>
          </Card>

          {/* 语文学科：显示王崧舟教学理念摘要 */}
          {selectedSubject === 'chinese' && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  诗意语文理念
                </CardTitle>
                <CardDescription>
                  王崧舟老师教学智慧
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="p-2 bg-white rounded border">
                  <div className="font-medium text-primary">文本解读六法</div>
                  <div className="text-muted-foreground text-xs mt-1">
                    规避套板 · 深度解读 · 三重角色 · 四系统 · 敏感度 · 教学价值
                  </div>
                </div>
                <div className="p-2 bg-white rounded border">
                  <div className="font-medium text-primary">课堂状态设计</div>
                  <div className="text-muted-foreground text-xs mt-1">
                    沉静启动 · 深度探究 · 想象体验 · 表达沉淀 · 沉浸体验
                  </div>
                </div>
                <div className="p-2 bg-white rounded border">
                  <div className="font-medium text-primary">课堂结构</div>
                  <div className="text-muted-foreground text-xs mt-1">
                    点面相成 · 双层聚焦 · 取舍智慧 · 回归整体
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 右侧：文档列表 */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">我的备课文档</CardTitle>
                <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  新建
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>暂无备课文档</p>
                  <p className="text-sm">点击左侧功能卡片开始备课</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map(renderDocumentCard)}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 创建文档对话框 */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>新建备课文档</DialogTitle>
            <DialogDescription>
              选择文档类型，创建新的备课文档
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">文档类型</label>
              <Select value={createType} onValueChange={(v) => setCreateType(v as PrepDocType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text_interpretation">文本解读</SelectItem>
                  <SelectItem value="lesson_design">教学设计</SelectItem>
                  <SelectItem value="classroom_strategy">课堂策略</SelectItem>
                  <SelectItem value="teaching_reflection">教学反思</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">文档标题</label>
              <Input
                value={newDocTitle}
                onChange={(e) => setNewDocTitle(e.target.value)}
                placeholder="请输入文档标题"
              />
            </div>
            
            {createType === 'text_interpretation' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">课文标题</label>
                <Input
                  value={newDocTextTitle}
                  onChange={(e) => setNewDocTextTitle(e.target.value)}
                  placeholder="请输入课文标题"
                />
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium">适用年级</label>
              <Select value={String(newDocGrade)} onValueChange={(v) => setNewDocGrade(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6].map(g => (
                    <SelectItem key={g} value={String(g)}>{g}年级</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreate} disabled={creating || !newDocTitle.trim()}>
              {creating && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              创建
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
