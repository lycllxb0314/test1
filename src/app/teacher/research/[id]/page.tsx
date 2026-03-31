'use client';

/**
 * 教师空间 - 教研活动详情页面
 * 
 * 功能：
 * - 查看教研活动基本信息
 * - 访问主题资源库（只读）
 * - 访问活动资源库（可上传、下载）
 */

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  FolderOpen,
  BookOpen,
  Upload,
  Download,
  Eye,
  FileText,
  Video,
  Image,
  File,
  Clock,
  CheckCircle,
  Loader2,
  Plus,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ==================== 类型定义 ====================

interface ActivityDetail {
  id: string;
  title: string;
  type: string;
  typeLabel: string;
  description?: string;
  location?: string;
  scheduledAt?: string;
  status: string;
  statusLabel: string;
  themeId: string;
  themeTitle: string;
  themeType: string;
  themeTypeLabel: string;
  subject: string;
  participants: Array<{ id: string; name: string; subject: string }>;
  createdAt: string;
}

interface Resource {
  id: string;
  title: string;
  type: string;
  resourceType: string; // 教学设计、优秀课例、学术论文、课件资源、其他资源
  size?: number;
  fileUrl?: string;
  fileName?: string;
  fileKey?: string;
  teacherName?: string;
  activityTitle?: string;
  folderId?: string;
  sourceType: 'theme' | 'activity'; // 主题资源库 or 活动资源库
  createdAt: string;
}

interface ResourceFromApi {
  id: string;
  title: string;
  type: string;
  resourceType: string;
  size?: number;
  fileUrl?: string;
  fileName?: string;
  fileKey?: string;
  teacherName?: string;
  activityTitle?: string;
  folderId?: string;
  createdAt: string;
}

// ==================== 配置 ====================

const RESOURCE_TYPE_LABELS: Record<string, string> = {
  lesson_design: '教学设计',
  excellent_case: '优秀课例',
  academic_paper: '学术论文',
  courseware: '课件资源',
  other: '其他资源',
};

const RESOURCE_TYPE_COLORS: Record<string, string> = {
  lesson_design: 'text-blue-600 bg-blue-50',
  excellent_case: 'text-green-600 bg-green-50',
  academic_paper: 'text-purple-600 bg-purple-50',
  courseware: 'text-orange-600 bg-orange-50',
  other: 'text-gray-600 bg-gray-50',
};

// ==================== 组件 ====================

export default function TeacherResearchDetailPage() {
  const router = useRouter();
  const params = useParams();
  const activityId = params.id as string;
  const { user } = useAuth();
  
  const [activity, setActivity] = useState<ActivityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  
  // 资源数据
  const [themeResources, setThemeResources] = useState<Resource[]>([]);
  const [activityResources, setActivityResources] = useState<Resource[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  
  // 上传状态
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  useEffect(() => {
    loadActivityDetail();
  }, [activityId]);
  
  useEffect(() => {
    if (activity) {
      loadResources();
    }
  }, [activity]);
  
  const loadActivityDetail = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/teacher/research/${activityId}`);
      const data = await res.json();
      
      if (data.success) {
        setActivity(data.data);
      } else {
        toast.error('加载失败');
        router.push('/teacher/research');
      }
    } catch (err) {
      console.error('加载活动详情失败:', err);
      toast.error('加载失败');
    } finally {
      setLoading(false);
    }
  };
  
  const loadResources = async () => {
    if (!activity) return;
    
    setResourcesLoading(true);
    try {
      // 加载主题资源库
      const themeRes = await fetch(`/api/research/resources?themeId=${activity.themeId}`);
      const themeData = await themeRes.json();
      if (themeData.success) {
        setThemeResources((themeData.data || []).map((r: ResourceFromApi) => ({
          ...r,
          sourceType: 'theme' as const,
        })));
      }
      
      // 加载活动资源库
      const activityRes = await fetch(`/api/research/resources?activityId=${activityId}`);
      const activityData = await activityRes.json();
      if (activityData.success) {
        setActivityResources((activityData.data || []).map((r: ResourceFromApi) => ({
          ...r,
          sourceType: 'activity' as const,
        })));
      }
    } catch (err) {
      console.error('加载资源失败:', err);
    } finally {
      setResourcesLoading(false);
    }
  };
  
  const handleDownload = async (resource: Resource) => {
    if (!resource.fileKey) {
      toast.error('文件不存在');
      return;
    }
    
    try {
      const res = await fetch(`/api/download?fileKey=${resource.fileKey}`);
      const data = await res.json();
      
      if (data.success && data.url) {
        window.open(data.url, '_blank');
      } else {
        toast.error('获取下载链接失败');
      }
    } catch (err) {
      console.error('下载失败:', err);
      toast.error('下载失败');
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }
  
  if (!activity) {
    return null;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50">
      <div className="p-6 lg:p-8 space-y-6">
        {/* 返回按钮 */}
        <Button
          variant="ghost"
          onClick={() => router.push('/teacher/research')}
          className="mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回列表
        </Button>
        
        {/* 活动标题卡片 */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{activity.title}</CardTitle>
                <CardDescription className="flex items-center gap-3 mt-2">
                  <span>{activity.themeTitle}</span>
                  <span className="text-slate-300">|</span>
                  <span>{activity.typeLabel}</span>
                  <span className="text-slate-300">|</span>
                  <span>{activity.subject}</span>
                </CardDescription>
              </div>
              <Badge className={cn(
                activity.status === 'in_progress' ? 'text-green-600 bg-green-50' :
                activity.status === 'completed' ? 'text-emerald-600 bg-emerald-50' :
                'text-blue-600 bg-blue-50'
              )}>
                {activity.statusLabel}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              {activity.location && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span>{activity.location}</span>
                </div>
              )}
              {activity.scheduledAt && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span>{new Date(activity.scheduledAt).toLocaleString()}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Users className="h-4 w-4 text-slate-400" />
                <span>{activity.participants?.length || 0} 人参与</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <FolderOpen className="h-4 w-4 text-slate-400" />
                <span>{activityResources.length} 个资源</span>
              </div>
            </div>
            
            {activity.description && (
              <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                <p className="text-slate-600">{activity.description}</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* 内容区域 */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white/80 backdrop-blur-sm">
            <TabsTrigger value="info">活动信息</TabsTrigger>
            <TabsTrigger value="theme-resources">
              主题资源库
              <Badge variant="secondary" className="ml-2">{themeResources.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="activity-resources">
              活动资源库
              <Badge variant="secondary" className="ml-2">{activityResources.length}</Badge>
            </TabsTrigger>
          </TabsList>
          
          {/* 活动信息 */}
          <TabsContent value="info" className="mt-4">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>参与教师</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-3">
                  {activity.participants?.map(p => (
                    <div
                      key={p.id}
                      className="flex items-center gap-2 p-3 rounded-lg border border-slate-100"
                    >
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium">
                        {p.name.slice(0, 1)}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{p.name}</div>
                        <div className="text-xs text-slate-500">{p.subject}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* 主题资源库（只读） */}
          <TabsContent value="theme-resources" className="mt-4">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-indigo-500" />
                      主题资源库
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {activity.themeTitle} 的资源库 · 只读
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {resourcesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                  </div>
                ) : themeResources.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <FolderOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p>暂无资源</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {themeResources.map(resource => (
                      <ResourceItem
                        key={resource.id}
                        resource={resource}
                        readonly
                        onDownload={handleDownload}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* 活动资源库（可读写） */}
          <TabsContent value="activity-resources" className="mt-4">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FolderOpen className="h-5 w-5 text-green-500" />
                      活动资源库
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {activity.title} 的资源库 · 可上传下载
                    </CardDescription>
                  </div>
                  <Button onClick={() => setUploadDialogOpen(true)}>
                    <Upload className="h-4 w-4 mr-2" />
                    上传资源
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {resourcesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-green-500" />
                  </div>
                ) : activityResources.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <FolderOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <p>暂无资源</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setUploadDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      上传第一个资源
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activityResources.map(resource => (
                      <ResourceItem
                        key={resource.id}
                        resource={resource}
                        onDownload={handleDownload}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* 上传对话框 */}
        {uploadDialogOpen && (
          <UploadDialog
            open={uploadDialogOpen}
            onOpenChange={setUploadDialogOpen}
            activityId={activityId}
            themeId={activity.themeId}
            teacherName={user?.name || ''}
            activityTitle={activity.title}
            onSuccess={() => {
              loadResources();
              setUploadDialogOpen(false);
            }}
          />
        )}
      </div>
    </div>
  );
}

// ==================== 资源项组件 ====================

function ResourceItem({
  resource,
  readonly,
  onDownload,
}: {
  resource: Resource;
  readonly?: boolean;
  onDownload: (resource: Resource) => void;
}) {
  const [copying, setCopying] = useState(false);
  
  const typeColor = RESOURCE_TYPE_COLORS[resource.resourceType] || RESOURCE_TYPE_COLORS.other;
  const typeLabel = RESOURCE_TYPE_LABELS[resource.resourceType] || '其他资源';
  
  const getFileIcon = () => {
    const type = resource.type || '';
    if (type.includes('image')) return <Image className="h-5 w-5 text-blue-500" />;
    if (type.includes('video')) return <Video className="h-5 w-5 text-purple-500" />;
    if (type.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
    return <File className="h-5 w-5 text-gray-500" />;
  };
  
  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  // 复制到备课中心
  const handleCopyToLessonPrep = async () => {
    setCopying(true);
    try {
      const res = await fetch('/api/teaching-resources/copy-from-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          researchResourceId: resource.id,
          category: resource.resourceType === 'lesson_design' ? 'lesson_plan' :
                    resource.resourceType === 'courseware' ? 'courseware' : 'other',
          activityId: resource.sourceType === 'activity' ? resource.id : undefined,
        }),
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success('已添加到备课中心资源库');
      } else {
        toast.error(data.message || '添加失败');
      }
    } catch (err) {
      console.error('复制失败:', err);
      toast.error('添加失败，请稍后重试');
    } finally {
      setCopying(false);
    }
  };
  
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-slate-100">
          {getFileIcon()}
        </div>
        <div>
          <div className="font-medium text-slate-900">{resource.title}</div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
            <Badge className={cn('text-xs', typeColor)}>{typeLabel}</Badge>
            {resource.size && <span>{formatSize(resource.size)}</span>}
            {resource.teacherName && (
              <>
                <span className="text-slate-300">·</span>
                <span>{resource.teacherName}</span>
              </>
            )}
            <span className="text-slate-300">·</span>
            <span>{new Date(resource.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={cn(
          'text-xs',
          resource.sourceType === 'theme' ? 'text-indigo-600 border-indigo-200' : 'text-green-600 border-green-200'
        )}>
          {resource.sourceType === 'theme' ? '主题库' : '活动库'}
        </Badge>
        {/* 添加到备课中心按钮 */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyToLessonPrep}
          disabled={copying}
          className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
        >
          {copying ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <BookOpen className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDownload(resource)}
          disabled={!resource.fileKey}
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ==================== 上传对话框组件 ====================

function UploadDialog({
  open,
  onOpenChange,
  activityId,
  themeId,
  teacherName,
  activityTitle,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activityId: string;
  themeId: string;
  teacherName: string;
  activityTitle: string;
  onSuccess: () => void;
}) {
  const [title, setTitle] = useState('');
  const [resourceType, setResourceType] = useState('lesson_design');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const handleUpload = async () => {
    if (!title.trim() || !file) {
      toast.error('请填写标题并选择文件');
      return;
    }
    
    setUploading(true);
    try {
      // 1. 上传文件
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const uploadData = await uploadRes.json();
      
      if (!uploadData.success) {
        toast.error(uploadData.error || '上传失败');
        return;
      }
      
      // 2. 创建资源记录
      const resourceRes = await fetch('/api/research/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          themeId,
          activityId,
          title,
          resourceType,
          fileKey: uploadData.fileKey,
          fileUrl: uploadData.url,
          fileName: file.name,
          type: file.type,
          size: file.size,
          teacherName,
          activityTitle,
          sourceType: 'activity',
        }),
      });
      const resourceData = await resourceRes.json();
      
      if (resourceData.success) {
        toast.success('上传成功');
        setTitle('');
        setFile(null);
        onSuccess();
      } else {
        toast.error(resourceData.error || '创建资源失败');
      }
    } catch (err) {
      console.error('上传失败:', err);
      toast.error('上传失败');
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold mb-4">上传资源</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">资源标题 *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="输入资源标题"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">资源类型</label>
            <select
              value={resourceType}
              onChange={e => setResourceType(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              <option value="lesson_design">教学设计</option>
              <option value="excellent_case">优秀课例</option>
              <option value="academic_paper">学术论文</option>
              <option value="courseware">课件资源</option>
              <option value="other">其他资源</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">选择文件 *</label>
            <input
              type="file"
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
            {file && (
              <p className="text-xs text-slate-500 mt-1">
                {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>
        </div>
        
        <div className="flex justify-end gap-2 mt-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={uploading}
          >
            取消
          </Button>
          <Button onClick={handleUpload} disabled={uploading}>
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                上传中...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                上传
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
