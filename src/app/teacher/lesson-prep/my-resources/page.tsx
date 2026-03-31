/**
 * 我的教学资源库
 * 
 * 教师个人教学资源管理页面，支持上传和管理局部教学资源
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  FolderOpen, 
  BookOpen, 
  Trash2, 
  Eye, 
  Clock,
  Filter,
  Search,
  FileText,
  Mic2,
  PenTool,
  MessageCircle,
  Calculator,
  Upload,
  X,
  File,
  Video,
  Presentation,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import type { ResourceListItem, ResourceStatistics, ResourceCategory } from '@/types/teaching-resource';

// 分类名称映射
const CATEGORY_NAMES: Record<ResourceCategory, string> = {
  chinese_character: '语文·生字专项',
  chinese_reading: '语文·朗读教学',
  chinese_writing: '语文·习作专项',
  chinese_chat: '语文·备课智能体',
  math: '数学·备课中心',
  math_concept: '数学·概念教学',
  math_problem: '数学·问题设计',
  lesson_plan: '教案',
  courseware: '课件',
  video: '视频',
  other: '其他',
};

// 分类图标映射
const CATEGORY_ICONS: Record<ResourceCategory, React.ElementType> = {
  chinese_character: FileText,
  chinese_reading: Mic2,
  chinese_writing: PenTool,
  chinese_chat: MessageCircle,
  math: Calculator,
  math_concept: Calculator,
  math_problem: Calculator,
  lesson_plan: FileText,
  courseware: Presentation,
  video: Video,
  other: FolderOpen,
};

// 分类颜色映射
const CATEGORY_COLORS: Record<ResourceCategory, string> = {
  chinese_character: 'bg-blue-500',
  chinese_reading: 'bg-green-500',
  chinese_writing: 'bg-purple-500',
  chinese_chat: 'bg-red-500',
  math: 'bg-indigo-500',
  math_concept: 'bg-indigo-500',
  math_problem: 'bg-cyan-500',
  lesson_plan: 'bg-amber-500',
  courseware: 'bg-orange-500',
  video: 'bg-rose-500',
  other: 'bg-gray-500',
};

// 文件类型配置
const FILE_TYPE_CONFIG: Record<ResourceCategory, { accept: string; label: string; hint: string }> = {
  lesson_plan: {
    accept: '.pdf,.doc,.docx',
    label: '教案文件',
    hint: '支持 PDF、Word 文档',
  },
  courseware: {
    accept: '.ppt,.pptx',
    label: '课件文件',
    hint: '支持 PowerPoint 演示文稿',
  },
  video: {
    accept: '.mp4,.mov,.avi,.webm',
    label: '视频文件',
    hint: '支持 MP4、MOV、AVI、WebM',
  },
  chinese_character: {
    accept: '*',
    label: '生字资源',
    hint: '支持所有文件类型',
  },
  chinese_reading: {
    accept: '.mp3,.wav,.m4a',
    label: '朗读资源',
    hint: '支持音频和文档文件',
  },
  chinese_writing: {
    accept: '*',
    label: '写作资源',
    hint: '支持所有文件类型',
  },
  chinese_chat: {
    accept: '*',
    label: '备课资源',
    hint: '支持所有文件类型',
  },
  math: {
    accept: '*',
    label: '数学资源',
    hint: '支持所有文件类型',
  },
  math_concept: {
    accept: '*',
    label: '概念教学资源',
    hint: '支持所有文件类型',
  },
  math_problem: {
    accept: '*',
    label: '问题设计资源',
    hint: '支持所有文件类型',
  },
  other: {
    accept: '*',
    label: '任意文件',
    hint: '支持所有文件类型',
  },
};

export default function MyResourcesPage() {
  const [resources, setResources] = useState<ResourceListItem[]>([]);
  const [statistics, setStatistics] = useState<ResourceStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  
  // 上传相关状态
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    category: 'lesson_plan' as ResourceCategory,
    subject: '',
    grade: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, [category, search]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 并行加载列表和统计
      const [listRes, statsRes] = await Promise.all([
        fetch(`/api/teaching-resources?category=${category}&search=${encodeURIComponent(search)}&pageSize=50`),
        fetch('/api/teaching-resources/statistics'),
      ]);

      const listData = await listRes.json();
      const statsData = await statsRes.json();

      if (listData.success) {
        setResources(listData.data || []);
      }
      if (statsData.success) {
        setStatistics(statsData.data);
      }
    } catch (error) {
      console.error('加载资源失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个资源吗？')) return;

    try {
      const res = await fetch(`/api/teaching-resources/${id}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        loadData();
      }
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  // 选择文件
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // 自动填充文件名作为标题（移除扩展名）
      const fileName = file.name.replace(/\.[^/.]+$/, '');
      setUploadForm(prev => ({ ...prev, title: fileName }));
    }
  };

  // 上传文件
  const handleUpload = async () => {
    if (!selectedFile) {
      alert('请选择文件');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', uploadForm.title);
      formData.append('description', uploadForm.description);
      formData.append('category', uploadForm.category);
      if (uploadForm.subject) formData.append('subject', uploadForm.subject);
      if (uploadForm.grade) formData.append('grade', uploadForm.grade);

      const res = await fetch('/api/teaching-resources/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setUploadDialogOpen(false);
        setSelectedFile(null);
        setUploadForm({
          title: '',
          description: '',
          category: 'lesson_plan',
          subject: '',
          grade: '',
        });
        loadData();
      } else {
        alert(data.message || '上传失败');
      }
    } catch (error) {
      console.error('上传失败:', error);
      alert('上传失败，请稍后重试');
    } finally {
      setUploading(false);
    }
  };

  // 重置上传表单
  const resetUploadForm = () => {
    setSelectedFile(null);
    setUploadForm({
      title: '',
      description: '',
      category: 'lesson_plan',
      subject: '',
      grade: '',
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/teacher/lesson-prep">
              <Button variant="ghost" size="sm" className="hover:bg-white/60">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                我的教学资源库
              </h1>
              <p className="text-sm text-gray-500 mt-1">保存和管理您的教学素材，随时调用</p>
            </div>
          </div>
          <Button
            onClick={() => setUploadDialogOpen(true)}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            <Upload className="w-4 h-4 mr-2" />
            上传资源
          </Button>
        </div>

        {/* 统计卡片 */}
        {statistics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-md bg-white/80">
              <CardContent className="p-4">
                <div className="text-sm text-gray-500">资源总数</div>
                <div className="text-3xl font-bold text-indigo-600">{statistics.total}</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md bg-white/80">
              <CardContent className="p-4">
                <div className="text-sm text-gray-500">近7天新增</div>
                <div className="text-3xl font-bold text-green-600">{statistics.recentCount}</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md bg-white/80">
              <CardContent className="p-4">
                <div className="text-sm text-gray-500">语文资源</div>
                <div className="text-3xl font-bold text-blue-600">
                  {statistics.byCategory['chinese_character'] || 0}
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md bg-white/80">
              <CardContent className="p-4">
                <div className="text-sm text-gray-500">其他学科</div>
                <div className="text-3xl font-bold text-purple-600">
                  {statistics.total - (statistics.byCategory['chinese_character'] || 0)}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 筛选栏 */}
        <Card className="border-0 shadow-md bg-white/80">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">筛选：</span>
              </div>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="资源分类" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部分类</SelectItem>
                  <SelectItem value="chinese_character">语文·生字专项</SelectItem>
                  <SelectItem value="chinese_reading">语文·朗读教学</SelectItem>
                  <SelectItem value="chinese_writing">语文·习作专项</SelectItem>
                  <SelectItem value="chinese_chat">语文·备课智能体</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索资源标题..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 资源列表 */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : resources.length === 0 ? (
          <Card className="border-0 shadow-md bg-white/80">
            <CardContent className="p-12 text-center">
              <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">暂无资源</h3>
              <p className="text-sm text-gray-400 mb-4">
                在各学科专项工具中生成素材后，点击"保存到资源库"即可在此查看
              </p>
              <Link href="/teacher/lesson-prep/chinese/character">
                <Button className="bg-gradient-to-r from-indigo-600 to-purple-600">
                  去生成教学素材
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resources.map((resource) => {
              const Icon = CATEGORY_ICONS[resource.category] || FolderOpen;
              const colorClass = CATEGORY_COLORS[resource.category] || 'bg-gray-500';
              
              return (
                <Link key={resource.id} href={`/teacher/lesson-prep/my-resources/${resource.id}`} className="block">
                  <Card className="border-0 shadow-md bg-white/90 hover:shadow-lg transition-shadow overflow-hidden group cursor-pointer h-full">
                    <div className={`${colorClass} p-3`}>
                      <div className="flex items-center justify-between text-white">
                        <div className="flex items-center gap-2">
                          <Icon className="w-5 h-5" />
                          <span className="text-sm font-medium">
                            {CATEGORY_NAMES[resource.category]}
                          </span>
                        </div>
                        {resource.grade && (
                          <Badge className="bg-white/20 text-white border-0">
                            {resource.grade}年级
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-medium text-gray-800 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                        {resource.title}
                      </h3>
                      {resource.description && (
                        <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                          {resource.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" />
                            {resource.viewCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(resource.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDelete(resource.id);
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* 上传对话框 */}
      <Dialog open={uploadDialogOpen} onOpenChange={(open) => {
        setUploadDialogOpen(open);
        if (!open) resetUploadForm();
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-600" />
              上传教学资源
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* 文件选择 */}
            <div className="space-y-2">
              <Label>选择文件</Label>
              <div className="relative border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-indigo-400 transition-colors cursor-pointer">
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <File className="w-8 h-8 text-indigo-600" />
                    <div className="text-left">
                      <p className="font-medium text-gray-800">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="pointer-events-none">
                    <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 mb-2">点击或拖拽文件到此处上传</p>
                    <p className="text-xs text-gray-400">
                      支持教案、课件、视频等常见格式
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={FILE_TYPE_CONFIG[uploadForm.category]?.accept || '*'}
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>

            {/* 资源分类 */}
            <div className="space-y-2">
              <Label>资源分类</Label>
              <Select
                value={uploadForm.category}
                onValueChange={(value) => setUploadForm(prev => ({ ...prev, category: value as ResourceCategory }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lesson_plan">教案</SelectItem>
                  <SelectItem value="courseware">课件</SelectItem>
                  <SelectItem value="video">视频</SelectItem>
                  <SelectItem value="other">其他</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                {FILE_TYPE_CONFIG[uploadForm.category]?.hint}
              </p>
            </div>

            {/* 标题 */}
            <div className="space-y-2">
              <Label>资源标题</Label>
              <Input
                value={uploadForm.title}
                onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="输入资源标题"
              />
            </div>

            {/* 描述 */}
            <div className="space-y-2">
              <Label>资源描述（可选）</Label>
              <Textarea
                value={uploadForm.description}
                onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="简要描述资源内容"
                rows={3}
              />
            </div>

            {/* 学科和年级 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>学科（可选）</Label>
                <Select
                  value={uploadForm.subject}
                  onValueChange={(value) => setUploadForm(prev => ({ ...prev, subject: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择学科" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chinese">语文</SelectItem>
                    <SelectItem value="math">数学</SelectItem>
                    <SelectItem value="english">英语</SelectItem>
                    <SelectItem value="other">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>年级（可选）</Label>
                <Select
                  value={uploadForm.grade}
                  onValueChange={(value) => setUploadForm(prev => ({ ...prev, grade: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择年级" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map(g => (
                      <SelectItem key={g} value={String(g)}>{g}年级</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setUploadDialogOpen(false);
              resetUploadForm();
            }}>
              取消
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="bg-gradient-to-r from-indigo-600 to-purple-600"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  上传中...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  确认上传
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
