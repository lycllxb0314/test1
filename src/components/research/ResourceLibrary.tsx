'use client';

/**
 * 教务端 - 主题资源库组件
 * 
 * 层级结构：
 * - 主题资源库（如"大单元教学"主题的资源库）
 *   ├── 活动资源库（来自各教研活动的资源）
 *   │   ├── 活动1的教学设计
 *   │   ├── 活动2的优秀课例
 *   │   └── ...
 *   └── 其他资源（教务直接上传到主题的资源）
 *       ├── 学术论文
 *       ├── 课件资源
 *       └── ...
 * 
 * 文件夹分类：
 * - 教学设计
 * - 优秀课例
 * - 学术论文
 * - 课件资源
 * - 其他资源
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  FolderOpen,
  FileText,
  Upload,
  Download,
  Trash2,
  File,
  FileImage,
  FileVideo,
  FileAudio,
  FileSpreadsheet,
  FileArchive,
  Search,
  Grid,
  List,
  Loader2,
  CheckCircle,
  X,
  Eye,
  BookOpen,
  Award,
  Video,
  Presentation,
  Activity,
  Folder,
  ChevronRight,
  ChevronDown,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ThemeType } from '@/types/research';

// ==================== 类型定义 ====================

interface ResourceFolder {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  description: string;
  count: number;
}

interface Resource {
  id: string;
  title: string;
  folderId: string;
  type: string;
  size?: number;
  fileKey?: string;
  fileUrl?: string;
  content?: unknown;
  sourceType: 'activity' | 'theme_direct'; // 来自活动 or 直接上传到主题
  activityId?: string;
  activityTitle?: string;
  teacherName?: string;
  createdAt: string;
}

interface ActivityGroup {
  id: string;
  title: string;
  type: string;
  scheduledAt?: string;
  resources: Resource[];
}

// ==================== 配置 ====================

const DEFAULT_FOLDERS: ResourceFolder[] = [
  { 
    id: 'lesson_design', 
    name: '教学设计', 
    icon: BookOpen, 
    color: 'text-blue-500 bg-blue-50', 
    description: '教研活动中的教学设计', 
    count: 0,
  },
  { 
    id: 'excellent_case', 
    name: '优秀课例', 
    icon: Video, 
    color: 'text-purple-500 bg-purple-50', 
    description: '优质课例视频', 
    count: 0,
  },
  { 
    id: 'academic_paper', 
    name: '学术论文', 
    icon: Award, 
    color: 'text-amber-500 bg-amber-50', 
    description: '教研论文', 
    count: 0,
  },
  { 
    id: 'courseware', 
    name: '课件资源', 
    icon: Presentation, 
    color: 'text-emerald-500 bg-emerald-50', 
    description: 'PPT、微课等', 
    count: 0,
  },
  { 
    id: 'other', 
    name: '其他资源', 
    icon: FolderOpen, 
    color: 'text-slate-500 bg-slate-50', 
    description: '其他文档', 
    count: 0,
  },
];

const FILE_TYPE_ICONS: Record<string, React.ElementType> = {
  'application/pdf': FileText,
  'image/': FileImage,
  'video/': FileVideo,
  'audio/': FileAudio,
  'application/vnd.ms-excel': FileSpreadsheet,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': FileSpreadsheet,
  'application/zip': FileArchive,
  'application/x-rar-compressed': FileArchive,
};

// ==================== 组件 ====================

interface ResourceLibraryProps {
  themeId: string;
  themeType: ThemeType;
  subject: string;
}

export default function ResourceLibrary({ themeId, themeType, subject }: ResourceLibraryProps) {
  const [folders, setFolders] = useState<ResourceFolder[]>(DEFAULT_FOLDERS);
  const [resources, setResources] = useState<Resource[]>([]);
  const [activityGroups, setActivityGroups] = useState<ActivityGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'folder' | 'activity'>('folder');
  const [displayMode, setDisplayMode] = useState<'grid' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // 活动分组展开状态
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(new Set());
  
  // 上传表单
  const [uploadForm, setUploadForm] = useState({
    title: '',
    folderId: 'other',
    file: null as File | null,
  });
  
  useEffect(() => {
    loadResources();
  }, [themeId]);
  
  const loadResources = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/research/resources?themeId=${themeId}`);
      const data = await res.json();
      
      if (data.success) {
        const resourceList = data.data || [];
        setResources(resourceList);
        
        // 更新文件夹计数
        const counts: Record<string, number> = {};
        resourceList.forEach((r: Resource) => {
          counts[r.folderId] = (counts[r.folderId] || 0) + 1;
        });
        
        setFolders(DEFAULT_FOLDERS.map(f => ({
          ...f,
          count: counts[f.id] || 0,
        })));
        
        // 按活动分组
        const groups: Map<string, ActivityGroup> = new Map();
        
        // 添加"教务上传"分组
        groups.set('theme_direct', {
          id: 'theme_direct',
          title: '其他资源',
          type: 'theme_direct',
          resources: [],
        });
        
        resourceList.forEach((r: Resource) => {
          if (r.sourceType === 'activity' && r.activityId) {
            if (!groups.has(r.activityId)) {
              groups.set(r.activityId, {
                id: r.activityId,
                title: r.activityTitle || '未知活动',
                type: 'activity',
                scheduledAt: r.createdAt,
                resources: [],
              });
            }
            groups.get(r.activityId)!.resources.push(r);
          } else {
            groups.get('theme_direct')!.resources.push(r);
          }
        });
        
        // 移除空分组
        if (groups.get('theme_direct')?.resources.length === 0) {
          groups.delete('theme_direct');
        }
        
        setActivityGroups(Array.from(groups.values()));
      }
    } catch (err) {
      console.error('加载资源失败:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadForm({
        ...uploadForm,
        file,
        title: uploadForm.title || file.name.replace(/\.[^/.]+$/, ''),
      });
    }
  };
  
  const handleUpload = async () => {
    if (!uploadForm.file || !uploadForm.title.trim()) {
      toast.error('请填写标题并选择文件');
      return;
    }
    
    setUploading(true);
    setUploadProgress(0);
    
    try {
      // 1. 上传文件到对象存储
      const formData = new FormData();
      formData.append('file', uploadForm.file);
      formData.append('folder', `research/${themeId}/${uploadForm.folderId}`);
      
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      const uploadData = await uploadRes.json();
      
      if (!uploadData.success) {
        throw new Error(uploadData.error || '上传失败');
      }
      
      setUploadProgress(50);
      
      // 2. 保存资源记录（标记为主题直接上传）
      const res = await fetch('/api/research/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          themeId,
          title: uploadForm.title,
          folderId: uploadForm.folderId,
          resourceType: uploadForm.folderId,
          type: uploadForm.file.type,
          size: uploadForm.file.size,
          fileKey: uploadData.key,
          fileUrl: uploadData.url,
          fileName: uploadForm.file.name,
          sourceType: 'theme_direct',
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success('上传成功');
        setUploadDialogOpen(false);
        setUploadForm({ title: '', folderId: 'other', file: null });
        loadResources();
      } else {
        throw new Error(data.error || '保存失败');
      }
    } catch (err: any) {
      console.error('上传失败:', err);
      toast.error(err.message || '上传失败');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };
  
  const handleDownload = async (resource: Resource) => {
    if (resource.fileKey) {
      try {
        const res = await fetch(`/api/download?key=${encodeURIComponent(resource.fileKey)}`);
        const data = await res.json();
        
        if (data.url) {
          const response = await fetch(data.url);
          const blob = await response.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = resource.title;
          link.click();
          window.URL.revokeObjectURL(blobUrl);
        }
      } catch (err) {
        toast.error('下载失败');
      }
    }
  };
  
  const handleDelete = async (resourceId: string) => {
    if (!confirm('确定要删除这个资源吗？')) return;
    
    try {
      const res = await fetch(`/api/research/resources/${resourceId}`, {
        method: 'DELETE',
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success('删除成功');
        loadResources();
      } else {
        toast.error(data.error || '删除失败');
      }
    } catch (err) {
      toast.error('删除失败');
    }
  };
  
  // 筛选资源（按文件夹视图）
  const filteredResources = resources.filter(r => {
    const matchesFolder = !selectedFolder || r.folderId === selectedFolder;
    const matchesSearch = !searchQuery || r.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFolder && matchesSearch;
  });
  
  // 统计信息
  const stats = {
    total: resources.length,
    activityCount: resources.filter(r => r.sourceType === 'activity').length,
    uploadCount: resources.filter(r => r.sourceType === 'theme_direct').length,
    activityGroups: activityGroups.filter(g => g.type === 'activity').length,
  };
  
  const getFileIcon = (type: string) => {
    for (const [key, icon] of Object.entries(FILE_TYPE_ICONS)) {
      if (type.startsWith(key) || type === key) {
        return icon;
      }
    }
    return File;
  };
  
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  const toggleActivity = (activityId: string) => {
    const newExpanded = new Set(expandedActivities);
    if (newExpanded.has(activityId)) {
      newExpanded.delete(activityId);
    } else {
      newExpanded.add(activityId);
    }
    setExpandedActivities(newExpanded);
  };

  return (
    <div className="space-y-6">
      {/* 资源库说明 */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-indigo-50 via-white to-purple-50">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Folder className="h-5 w-5 text-indigo-500" />
                <span className="font-semibold text-slate-800">主题资源库</span>
                <Badge variant="secondary" className="ml-1">{stats.total} 个资源</Badge>
              </div>
              <p className="text-sm text-slate-500">
                包含活动资源库（来自 {stats.activityGroups} 个教研活动）和教务直接上传的资源
              </p>
            </div>
            
            <Button onClick={() => setUploadDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              上传资源
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* 视图切换 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'folder' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('folder')}
          >
            <FolderOpen className="h-4 w-4 mr-2" />
            按文件夹
          </Button>
          <Button
            variant={viewMode === 'activity' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('activity')}
          >
            <Activity className="h-4 w-4 mr-2" />
            按活动
          </Button>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="搜索资源..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
          <div className="flex border border-slate-200 rounded-lg p-0.5 bg-white">
            <Button
              variant={displayMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setDisplayMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={displayMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setDisplayMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* 按文件夹视图 */}
      {viewMode === 'folder' && (
        <>
          {/* 文件夹列表 */}
          <div className="grid grid-cols-5 gap-3">
            {folders.map(folder => {
              const Icon = folder.icon;
              const isSelected = selectedFolder === folder.id;
              return (
                <Card 
                  key={folder.id}
                  className={`cursor-pointer transition-all border-0 shadow-sm ${
                    isSelected 
                      ? 'ring-2 ring-indigo-500 bg-indigo-50' 
                      : 'hover:shadow-md hover:bg-slate-50'
                  }`}
                  onClick={() => setSelectedFolder(isSelected ? null : folder.id)}
                >
                  <CardContent className="pt-4 pb-3 text-center">
                    <div className={`inline-flex p-2.5 rounded-xl ${folder.color} mb-2`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h4 className="font-medium text-slate-900 text-sm">{folder.name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{folder.count} 个文件</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          {/* 资源列表 */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : filteredResources.length === 0 ? (
            <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
              <CardContent className="py-12 text-center">
                <FolderOpen className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 mb-4">暂无资源</p>
                <Button onClick={() => setUploadDialogOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  上传第一个文件
                </Button>
              </CardContent>
            </Card>
          ) : displayMode === 'grid' ? (
            <div className="grid grid-cols-4 gap-4">
              {filteredResources.map(resource => {
                const FileIcon = getFileIcon(resource.type);
                const folder = folders.find(f => f.id === resource.folderId);
                return (
                  <Card key={resource.id} className="group border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="pt-4 pb-3">
                      <div className={`inline-flex p-3 rounded-xl ${folder?.color || 'bg-slate-100'} mb-3`}>
                        <FileIcon className="h-6 w-6" />
                      </div>
                      <h4 className="font-medium text-slate-900 text-sm truncate mb-1">{resource.title}</h4>
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                        <span>{formatFileSize(resource.size)}</span>
                      </div>
                      
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          resource.sourceType === 'activity' 
                            ? 'text-indigo-600 bg-indigo-50 border-indigo-200' 
                            : 'text-slate-600 bg-slate-50 border-slate-200'
                        }`}
                      >
                        {resource.sourceType === 'activity' ? (
                          <>
                            <Activity className="h-3 w-3 mr-1" />
                            {resource.activityTitle || '活动资源'}
                          </>
                        ) : (
                          <>
                            <Upload className="h-3 w-3 mr-1" />
                            教务上传
                          </>
                        )}
                      </Badge>
                      
                      {resource.teacherName && (
                        <p className="text-xs text-slate-400 mt-1.5">{resource.teacherName}</p>
                      )}
                      
                      <div className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleDownload(resource)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500" onClick={() => handleDelete(resource.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {filteredResources.map(resource => {
                    const FileIcon = getFileIcon(resource.type);
                    const folder = folders.find(f => f.id === resource.folderId);
                    return (
                      <div 
                        key={resource.id}
                        className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors group"
                      >
                        <div className={`p-2.5 rounded-xl ${folder?.color || 'bg-slate-100'}`}>
                          <FileIcon className="h-5 w-5" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h4 className="font-medium text-slate-900 truncate">{resource.title}</h4>
                            <Badge 
                              variant="outline" 
                              className={`text-xs shrink-0 ${
                                resource.sourceType === 'activity' 
                                  ? 'text-indigo-600 bg-indigo-50 border-indigo-200' 
                                  : 'text-slate-600 bg-slate-50 border-slate-200'
                              }`}
                            >
                              {resource.sourceType === 'activity' ? (
                                <>
                                  <Activity className="h-3 w-3 mr-1" />
                                  {resource.activityTitle || '活动资源'}
                                </>
                              ) : (
                                <>
                                  <Upload className="h-3 w-3 mr-1" />
                                  教务上传
                                </>
                              )}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <span>{folder?.name}</span>
                            {resource.size && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-slate-300" />
                                <span>{formatFileSize(resource.size)}</span>
                              </>
                            )}
                            {resource.teacherName && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-slate-300" />
                                <span>{resource.teacherName}</span>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          {new Date(resource.createdAt).toLocaleDateString()}
                        </div>
                        
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleDownload(resource)}>
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500" onClick={() => handleDelete(resource.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
      
      {/* 按活动视图 */}
      {viewMode === 'activity' && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : activityGroups.length === 0 ? (
            <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
              <CardContent className="py-12 text-center">
                <Activity className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400">暂无资源</p>
              </CardContent>
            </Card>
          ) : (
            activityGroups.map(group => {
              const isExpanded = expandedActivities.has(group.id);
              const filteredGroupResources = group.resources.filter(r => 
                !searchQuery || r.title.toLowerCase().includes(searchQuery.toLowerCase())
              );
              
              if (filteredGroupResources.length === 0) return null;
              
              return (
                <Card key={group.id} className="border-0 shadow-sm overflow-hidden">
                  <Collapsible open={isExpanded} onOpenChange={() => toggleActivity(group.id)}>
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            group.type === 'activity' 
                              ? 'bg-indigo-100 text-indigo-600' 
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {group.type === 'activity' ? (
                              <Activity className="h-5 w-5" />
                            ) : (
                              <Upload className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium text-slate-900">{group.title}</h4>
                            <p className="text-sm text-slate-500">
                              {group.resources.length} 个资源
                              {group.scheduledAt && (
                                <span className="ml-2">
                                  · {new Date(group.scheduledAt).toLocaleDateString()}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{filteredGroupResources.length}</Badge>
                          {isExpanded ? (
                            <ChevronDown className="h-5 w-5 text-slate-400" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-slate-400" />
                          )}
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="border-t border-slate-100 divide-y divide-slate-100">
                        {filteredGroupResources.map(resource => {
                          const FileIcon = getFileIcon(resource.type);
                          const folder = folders.find(f => f.id === resource.folderId);
                          return (
                            <div 
                              key={resource.id}
                              className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition-colors group"
                            >
                              <div className={`p-2 rounded-lg ${folder?.color || 'bg-slate-100'}`}>
                                <FileIcon className="h-4 w-4" />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <h5 className="font-medium text-slate-900 text-sm truncate">{resource.title}</h5>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                  <span>{folder?.name}</span>
                                  {resource.size && <span>· {formatFileSize(resource.size)}</span>}
                                  {resource.teacherName && <span>· {resource.teacherName}</span>}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleDownload(resource)}>
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => handleDelete(resource.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              );
            })
          )}
        </div>
      )}
      
      {/* 上传对话框 */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>上传资源到主题资源库</DialogTitle>
            <DialogDescription>
              上传的资源将归属于本主题资源库
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>文件标题 *</Label>
              <Input
                value={uploadForm.title}
                onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                placeholder="输入文件标题"
              />
            </div>
            
            <div className="space-y-2">
              <Label>所属文件夹</Label>
              <div className="grid grid-cols-3 gap-2">
                {folders.map(folder => {
                  const Icon = folder.icon;
                  const isSelected = uploadForm.folderId === folder.id;
                  return (
                    <div
                      key={folder.id}
                      onClick={() => setUploadForm({ ...uploadForm, folderId: folder.id })}
                      className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-indigo-500 bg-indigo-50' 
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <Icon className="h-4 w-4 text-slate-500" />
                      <span className="text-sm">{folder.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>选择文件 *</Label>
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:border-slate-300 transition-colors">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  {uploadForm.file ? (
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle className="h-5 w-5 text-emerald-500" />
                      <span className="text-sm text-slate-600">{uploadForm.file.name}</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">点击选择文件</p>
                    </>
                  )}
                </label>
              </div>
            </div>
            
            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>上传中...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)} disabled={uploading}>
              取消
            </Button>
            <Button onClick={handleUpload} disabled={uploading || !uploadForm.file}>
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  上传中
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  上传
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
