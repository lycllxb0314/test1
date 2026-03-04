'use client';

/**
 * 发布通知组件
 * 
 * 支持：
 * - 发布通知给指定对象（教师、部门群组、家长等）
 * - 选择是否同时发布到外部学校主页
 * - 根据部门自动判断是否需要审批
 * - 自定义审批流程（跳过部门主任、或签/会签）
 */

import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertCircle,
  Send,
  Users,
  Building2,
  GraduationCap,
  UserCheck,
  ChevronRight,
  Info,
  Image as ImageIcon,
  FileText,
  X,
  Upload,
  Calendar,
  Clock,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { 
  DEPARTMENTS, 
  type SubmitApprovalRequest, 
  type AnnouncementType, 
  type AnnouncementCategory, 
  type NewsCategory, 
  type InternalNoticeCategory,
  type MediaLevel 
} from '@/types/approval';
import { useTeachers } from '@/hooks/useTeachers';
import { useClasses } from '@/hooks/useClasses';
import { useGroups } from '@/hooks/useGroups';

// ==================== 分类选项配置 ====================

/** 根据类型获取分类选项 */
const CATEGORY_OPTIONS: Record<AnnouncementType, { value: string; label: string }[]> = {
  announcement: [
    { value: '重要通知', label: '重要通知' },
    { value: '活动预告', label: '活动预告' },
    { value: '规章制度', label: '规章制度' },
    { value: '招生信息', label: '招生信息' },
    { value: '放假通知', label: '放假通知' },
  ],
  news: [
    { value: '校园新闻', label: '校园新闻' },
    { value: '荣誉喜报', label: '荣誉喜报' },
    { value: '教育教学', label: '教育教学' },
    { value: '媒体附小', label: '媒体附小' },
  ],
  internal_notice: [
    { value: '会议通知', label: '会议通知' },
    { value: '工作安排', label: '工作安排' },
    { value: '通知公告', label: '通知公告' },
    { value: '培训学习', label: '培训学习' },
    { value: '其他通知', label: '其他通知' },
  ],
};

/** 媒体级别选项（新闻动态-媒体附小分类下使用） */
const MEDIA_LEVEL_OPTIONS = [
  { value: '国家级', label: '国家级' },
  { value: '省级', label: '省级' },
  { value: '市级', label: '市级' },
];

// ==================== 类型定义 ====================

export interface PublishNotificationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (request: SubmitApprovalRequest) => Promise<{ success: boolean; error?: string }>;
  /** 发布者部门 */
  department: string;
  /** 是否显示审批流程选择 */
  showApprovalFlow?: boolean;
  /** 通知对象类型限制 */
  recipientTypes?: ('all' | 'role' | 'class' | 'individual' | 'group')[];
}

interface RecipientConfig {
  type: 'all' | 'role' | 'class' | 'individual' | 'group';
  roles?: string[];
  classIds?: string[];
  userIds?: string[];
  groupIds?: string[];
}

// ==================== 组件实现 ====================

export function PublishNotificationDialog({
  open,
  onOpenChange,
  onSubmit,
  department,
  showApprovalFlow = true,
  recipientTypes = ['all', 'role', 'class', 'individual', 'group'],
}: PublishNotificationProps) {
  const { user } = useAuth();
  const { allTeachers } = useTeachers();
  const { allClasses } = useClasses();
  const { groups } = useGroups();

  // === 表单状态 ===
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<AnnouncementType>('announcement');
  const [category, setCategory] = useState<AnnouncementCategory | NewsCategory | InternalNoticeCategory | ''>('');
  const [mediaLevel, setMediaLevel] = useState<MediaLevel | ''>('');
  const [recipientConfig, setRecipientConfig] = useState<RecipientConfig>({ type: 'all' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // === 图片和文件上传 ===
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<{ name: string; url: string; size: number; type: string }[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  // === 定时发布设置 ===
  const [scheduledPublish, setScheduledPublish] = useState(false);
  const [scheduledPublishAt, setScheduledPublishAt] = useState('');
  const [autoUnpublish, setAutoUnpublish] = useState(false);
  const [autoUnpublishAt, setAutoUnpublishAt] = useState('');

  // === 审批流程配置 ===
  const [skipDepartmentDirector, setSkipDepartmentDirector] = useState(false);
  const [approvalType, setApprovalType] = useState<'or_sign' | 'countersign'>('or_sign');

  // === 获取部门配置 ===
  const departmentConfig = useMemo(() => {
    return DEPARTMENTS.find(d => d.id === department) || DEPARTMENTS[0];
  }, [department]);

  // === 根据类型自动判断是否发布到学校主页 ===
  // 校园公告、新闻动态 → 发布到主页（isExternal = true）
  // 内部通知 → 不发布到主页（isExternal = false）
  const isExternal = type !== 'internal_notice';

  // === 是否需要审批 ===
  // 校园公告、新闻动态：需要审批（校长室除外）
  // 内部通知：不需要审批
  const needsApproval = departmentConfig?.requiresApproval && isExternal;

  // === 表单验证 ===
  const isValid = useMemo(() => {
    if (!title.trim() || !content.trim()) return false;
    if (recipientConfig.type === 'role' && (!recipientConfig.roles || recipientConfig.roles.length === 0)) return false;
    if (recipientConfig.type === 'class' && (!recipientConfig.classIds || recipientConfig.classIds.length === 0)) return false;
    if (recipientConfig.type === 'individual' && (!recipientConfig.userIds || recipientConfig.userIds.length === 0)) return false;
    if (recipientConfig.type === 'group' && (!recipientConfig.groupIds || recipientConfig.groupIds.length === 0)) return false;
    return true;
  }, [title, content, recipientConfig]);

  // === 提交处理 ===
  const handleSubmit = async () => {
    if (!isValid || !user) return;

    setLoading(true);
    setError(null);

    try {
      const request: SubmitApprovalRequest = {
        title: title.trim(),
        summary: summary.trim() || undefined,
        content: content.trim(),
        type,
        category: category ? category as AnnouncementCategory | NewsCategory | InternalNoticeCategory : undefined,
        mediaLevel: mediaLevel || undefined,
        department,
        coverImage: coverImage || undefined,
        images: images.length > 0 ? images : undefined,
        attachments: attachments.length > 0 ? attachments : undefined,
        isExternal,
        scheduledPublishAt: scheduledPublish ? scheduledPublishAt : undefined,
        autoUnpublish,
        autoUnpublishAt: autoUnpublish ? autoUnpublishAt : undefined,
        recipients: type === 'internal_notice' ? recipientConfig : undefined,
        customFlow: needsApproval ? {
          skipDepartmentDirector,
          approvalType,
        } : undefined,
      };

      const result = await onSubmit(request);

      if (result.success) {
        // 重置表单
        setTitle('');
        setSummary('');
        setContent('');
        setCategory('');
        setMediaLevel('');
        setRecipientConfig({ type: 'all' });
        setCoverImage(null);
        setImages([]);
        setAttachments([]);
        setScheduledPublish(false);
        setScheduledPublishAt('');
        setAutoUnpublish(false);
        setAutoUnpublishAt('');
        setSkipDepartmentDirector(false);
        setApprovalType('or_sign');
        onOpenChange(false);
      } else {
        setError(result.error || '发布失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '发布失败');
    } finally {
      setLoading(false);
    }
  };

  // === 文件上传处理 ===
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isCover: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'image');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        if (isCover) {
          setCoverImage(result.data.url);
        } else {
          setImages(prev => [...prev, result.data.url]);
        }
      } else {
        setError(result.error || '上传失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'document');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        setAttachments(prev => [...prev, {
          name: result.data.name,
          url: result.data.url,
          size: result.data.size,
          type: result.data.type,
        }]);
      } else {
        setError(result.error || '上传失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败');
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // === 角色选项 ===
  const roleOptions = [
    { value: 'principal', label: '校长' },
    { value: 'secretary', label: '书记' },
    { value: 'vice_principal', label: '副校长' },
    { value: 'head_teacher', label: '班主任' },
    { value: 'subject_teacher', label: '科任教师' },
    { value: 'skill_teacher', label: '技能课教师' },
    { value: 'parent', label: '家长' },
  ];

  // === 渲染接收者选择 ===
  const renderRecipientSelector = () => {
    switch (recipientConfig.type) {
      case 'role':
        return (
          <div className="space-y-3">
            <Label>选择角色</Label>
            <div className="grid grid-cols-2 gap-2">
              {roleOptions.map((role) => (
                <label
                  key={role.value}
                  className={cn(
                    'flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors',
                    recipientConfig.roles?.includes(role.value)
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-gray-50'
                  )}
                >
                  <Checkbox
                    checked={recipientConfig.roles?.includes(role.value)}
                    onCheckedChange={(checked) => {
                      const roles = recipientConfig.roles || [];
                      setRecipientConfig({
                        ...recipientConfig,
                        roles: checked
                          ? [...roles, role.value]
                          : roles.filter((r) => r !== role.value),
                      });
                    }}
                  />
                  <span className="text-sm">{role.label}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'class':
        return (
          <div className="space-y-3">
            <Label>选择班级</Label>
            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
              {allClasses.map((cls) => (
                <label
                  key={cls.id}
                  className={cn(
                    'flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors text-sm',
                    recipientConfig.classIds?.includes(cls.id)
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-gray-50'
                  )}
                >
                  <Checkbox
                    checked={recipientConfig.classIds?.includes(cls.id)}
                    onCheckedChange={(checked) => {
                      const classIds = recipientConfig.classIds || [];
                      setRecipientConfig({
                        ...recipientConfig,
                        classIds: checked
                          ? [...classIds, cls.id]
                          : classIds.filter((id) => id !== cls.id),
                      });
                    }}
                  />
                  <span>{cls.name}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'individual':
        return (
          <div className="space-y-3">
            <Label>选择教师</Label>
            <Select
              value={recipientConfig.userIds?.[0] || ''}
              onValueChange={(value) => {
                setRecipientConfig({
                  ...recipientConfig,
                  userIds: value ? [value] : [],
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择教师" />
              </SelectTrigger>
              <SelectContent>
                {allTeachers.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.name} ({teacher.subject})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'group':
        return (
          <div className="space-y-3">
            <Label>选择部门群组</Label>
            <div className="grid grid-cols-2 gap-2">
              {groups.map((group) => (
                <label
                  key={group.id}
                  className={cn(
                    'flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors',
                    recipientConfig.groupIds?.includes(group.id)
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-gray-50'
                  )}
                >
                  <Checkbox
                    checked={recipientConfig.groupIds?.includes(group.id)}
                    onCheckedChange={(checked) => {
                      const groupIds = recipientConfig.groupIds || [];
                      setRecipientConfig({
                        ...recipientConfig,
                        groupIds: checked
                          ? [...groupIds, group.id]
                          : groupIds.filter((id) => id !== group.id),
                      });
                    }}
                  />
                  <div>
                    <p className="text-sm font-medium">{group.name}</p>
                    <p className="text-xs text-gray-500">{group.memberCount} 人</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-blue-50 text-blue-700">
            <Info className="h-4 w-4" />
            <span className="text-sm">将通知所有用户</span>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            发布通知
          </DialogTitle>
          <DialogDescription>
            发布部门：{departmentConfig?.name} · {departmentConfig?.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 基本信息 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">基本信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">标题 *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="请输入通知标题"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="summary">摘要（可选）</Label>
                <Textarea
                  id="summary"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="请输入摘要，用于首页展示（选填）"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">内容 *</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="请输入通知内容"
                  rows={6}
                />
              </div>

              {/* 图片上传 */}
              <div className="space-y-2">
                <Label>封面图</Label>
                <div className="flex gap-3 items-start">
                  {coverImage ? (
                    <div className="relative w-32 h-24 rounded-lg overflow-hidden border">
                      <img src={coverImage} alt="封面" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setCoverImage(null)}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="w-32 h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, true)}
                        disabled={uploadingImage}
                      />
                      {uploadingImage ? (
                        <span className="text-xs text-muted-foreground">上传中...</span>
                      ) : (
                        <>
                          <ImageIcon className="h-6 w-6 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground mt-1">上传封面</span>
                        </>
                      )}
                    </label>
                  )}
                  <p className="text-xs text-muted-foreground">
                    建议尺寸: 800x600<br />
                    支持 JPG、PNG、GIF、WebP
                  </p>
                </div>
              </div>

              {/* 内容图片 */}
              <div className="space-y-2">
                <Label>内容图片</Label>
                <div className="flex flex-wrap gap-3">
                  {images.map((img, index) => (
                    <div key={index} className="relative w-24 h-24 rounded-lg overflow-hidden border">
                      <img src={img} alt={`图片${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <label className="w-24 h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e, false)}
                      disabled={uploadingImage}
                    />
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground mt-1">添加图片</span>
                  </label>
                </div>
              </div>

              {/* 附件上传 */}
              <div className="space-y-2">
                <Label>附件</Label>
                <div className="space-y-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({(file.size / 1024).toFixed(1)}KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="p-1 text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <label className="flex items-center gap-2 p-3 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors">
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={uploadingFile}
                    />
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {uploadingFile ? '上传中...' : '添加附件'}
                    </span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>类型</Label>
                  <Select
                    value={type}
                    onValueChange={(v) => {
                      setType(v as AnnouncementType);
                      // 类型改变时重置分类和媒体级别
                      setCategory('');
                      setMediaLevel('');
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="announcement">校园公告</SelectItem>
                      <SelectItem value="news">新闻动态</SelectItem>
                      <SelectItem value="internal_notice">内部通知</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>分类</Label>
                  <Select
                    value={category}
                    onValueChange={(v) => setCategory(v as AnnouncementCategory | NewsCategory | InternalNoticeCategory)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择分类" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS[type].map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 媒体级别选择（新闻动态-媒体附小分类下显示） */}
              {type === 'news' && category === '媒体附小' && (
                <div className="space-y-2 mt-4">
                  <Label>媒体级别</Label>
                  <Select
                    value={mediaLevel}
                    onValueChange={(v) => setMediaLevel(v as MediaLevel)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择媒体级别" />
                    </SelectTrigger>
                    <SelectContent>
                      {MEDIA_LEVEL_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 发布设置 - 仅校园公告和新闻动态 */}
          {isExternal && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  发布设置
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 定时发布 */}
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="scheduled"
                    checked={scheduledPublish}
                    onCheckedChange={(checked) => setScheduledPublish(checked as boolean)}
                  />
                  <Label htmlFor="scheduled" className="flex items-center gap-2 cursor-pointer">
                    <Clock className="h-4 w-4" />
                    定时发布
                  </Label>
                </div>
                {scheduledPublish && (
                  <Input
                    type="datetime-local"
                    value={scheduledPublishAt}
                    onChange={(e) => setScheduledPublishAt(e.target.value)}
                  />
                )}

                {/* 自动下架 */}
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="autoUnpublish"
                    checked={autoUnpublish}
                    onCheckedChange={(checked) => setAutoUnpublish(checked as boolean)}
                  />
                  <Label htmlFor="autoUnpublish" className="cursor-pointer">
                    自动下架
                  </Label>
                </div>
                {autoUnpublish && (
                  <Input
                    type="datetime-local"
                    value={autoUnpublishAt}
                    onChange={(e) => setAutoUnpublishAt(e.target.value)}
                  />
                )}
              </CardContent>
            </Card>
          )}

          {/* 接收对象 - 仅内部通知需要选择接收对象 */}
          {type === 'internal_notice' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">接收对象</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs
                  value={recipientConfig.type}
                  onValueChange={(v) => setRecipientConfig({ type: v as RecipientConfig['type'] })}
                >
                  <TabsList className="grid grid-cols-5 h-auto">
                    {recipientTypes.includes('all') && (
                      <TabsTrigger value="all" className="text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        全员
                      </TabsTrigger>
                    )}
                    {recipientTypes.includes('role') && (
                      <TabsTrigger value="role" className="text-xs">
                        <UserCheck className="h-3 w-3 mr-1" />
                        角色
                      </TabsTrigger>
                    )}
                    {recipientTypes.includes('class') && (
                      <TabsTrigger value="class" className="text-xs">
                        <GraduationCap className="h-3 w-3 mr-1" />
                        班级
                      </TabsTrigger>
                    )}
                    {recipientTypes.includes('individual') && (
                      <TabsTrigger value="individual" className="text-xs">
                        个人
                      </TabsTrigger>
                    )}
                    {recipientTypes.includes('group') && (
                      <TabsTrigger value="group" className="text-xs">
                        <Building2 className="h-3 w-3 mr-1" />
                        部门
                      </TabsTrigger>
                    )}
                  </TabsList>

                  {recipientTypes.map((t) => (
                    <TabsContent key={t} value={t} className="mt-4">
                      {renderRecipientSelector()}
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          )}

          {/* 审批流程选择 - 仅校园公告和新闻动态需要审批 */}
          {showApprovalFlow && needsApproval && (
            <Card className="border-amber-200 bg-amber-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  审批流程
                </CardTitle>
                <CardDescription>
                  发布到外部需要审批通过后才能展示
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 流程预览 */}
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline">提交</Badge>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                  {!skipDepartmentDirector && (
                    <>
                      <Badge variant="outline">
                        {departmentConfig?.shortName}主任
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </>
                  )}
                  <Badge variant="outline">校长室</Badge>
                </div>

                {/* 自定义选项 */}
                <div className="space-y-3 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={skipDepartmentDirector}
                      onCheckedChange={(checked) => setSkipDepartmentDirector(checked as boolean)}
                    />
                    <span className="text-sm">跳过部门主任，直接提交校长室审批</span>
                  </label>

                  <div className="space-y-2">
                    <Label className="text-sm">校长室审批方式</Label>
                    <RadioGroup
                      value={approvalType}
                      onValueChange={(v) => setApprovalType(v as 'or_sign' | 'countersign')}
                      className="flex gap-4"
                    >
                      <label className="flex items-center gap-2 cursor-pointer">
                        <RadioGroupItem value="or_sign" />
                        <span className="text-sm">或签（任一人通过即可）</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <RadioGroupItem value="countersign" />
                        <span className="text-sm">会签（所有人都需通过）</span>
                      </label>
                    </RadioGroup>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 错误提示 */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || loading}
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            {loading ? '发布中...' : (needsApproval ? '提交审批' : '发布')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
