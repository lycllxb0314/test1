'use client';

/**
 * 发布通知组件
 * 
 * 支持：
 * - 部门模式：发布校园公告、新闻动态、内部通知（完整功能）
 * - 教师模式：发布家长通知（简化功能）
 */

import React, { useState, useMemo, useEffect } from 'react';
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
  type ParentNoticeCategory,
  type MediaLevel,
  type ApproverLeaderRole,
  type ApprovalMode,
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
  parent_notice: [
    { value: '班级通知', label: '班级通知' },
    { value: '作业通知', label: '作业通知' },
    { value: '活动通知', label: '活动通知' },
    { value: '考试通知', label: '考试通知' },
    { value: '缴费通知', label: '缴费通知' },
    { value: '假期通知', label: '假期通知' },
    { value: '安全提醒', label: '安全提醒' },
    { value: '家校沟通', label: '家校沟通' },
    { value: '其他通知', label: '其他通知' },
  ],
  leave_request: [], // 请假审批无分类
};

/** 媒体级别选项（新闻动态-媒体附小分类下使用） */
const MEDIA_LEVEL_OPTIONS = [
  { value: '国家级', label: '国家级' },
  { value: '省级', label: '省级' },
  { value: '市级', label: '市级' },
];

// ==================== 类型定义 ====================

/** 发布模式 */
export type PublishMode = 'department' | 'teacher';

export interface PublishNotificationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (request: SubmitApprovalRequest) => Promise<{ success: boolean; error?: string }>;
  /** 发布者部门 */
  department: string;
  /** 发布模式：department-部门模式，teacher-教师模式 */
  mode?: PublishMode;
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
  mode = 'department',
  showApprovalFlow = true,
  recipientTypes = ['all', 'role', 'class', 'individual', 'group'],
}: PublishNotificationProps) {
  const { user } = useAuth();
  const { allTeachers } = useTeachers();
  const { allClasses } = useClasses();
  const { groups } = useGroups();

  // === 教师模式：固定为家长通知 ===
  const isTeacherMode = mode === 'teacher';

  // === 表单状态 ===
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  // 教师模式默认为 parent_notice，部门模式默认为 announcement
  const [type, setType] = useState<AnnouncementType>(isTeacherMode ? 'parent_notice' : 'announcement');
  const [category, setCategory] = useState<AnnouncementCategory | NewsCategory | InternalNoticeCategory | ParentNoticeCategory | ''>('');
  const [mediaLevel, setMediaLevel] = useState<MediaLevel | ''>('');
  // 教师模式默认发送给本班家长
  const [recipientConfig, setRecipientConfig] = useState<RecipientConfig>({ 
    type: isTeacherMode ? 'class' : 'all',
    classIds: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // === 图片和文件上传 ===
  const [images, setImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  // === 部门模式专用状态 ===
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<{ name: string; url: string; size: number; type: string }[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [scheduledPublish, setScheduledPublish] = useState(false);
  const [scheduledPublishAt, setScheduledPublishAt] = useState('');
  const [autoUnpublish, setAutoUnpublish] = useState(false);
  const [autoUnpublishAt, setAutoUnpublishAt] = useState('');
  const [skipDepartmentDirector, setSkipDepartmentDirector] = useState(false);
  const [approvalType, setApprovalType] = useState<'or_sign' | 'countersign'>('or_sign');
  const [selectedLeaders, setSelectedLeaders] = useState<ApproverLeaderRole[]>([]);
  const [approvalMode, setApprovalMode] = useState<ApprovalMode>('or_sign');

  // === 获取部门配置 ===
  const departmentConfig = useMemo(() => {
    if (isTeacherMode) return null;
    return DEPARTMENTS.find(d => d.id === department) || DEPARTMENTS[0];
  }, [department, isTeacherMode]);

  // === 教师模式信息 ===
  const teacherInfo = useMemo(() => {
    if (!isTeacherMode) return null;
    const isHeadTeacher = user?.role === 'head_teacher';
    return {
      name: isHeadTeacher ? '班主任' : '科任教师',
      description: isHeadTeacher ? '发布通知给本班家长' : '发布通知给班级学生家长',
    };
  }, [isTeacherMode, user?.role]);

  // === 获取当前班级信息 ===
  const myClass = useMemo(() => {
    if (!isTeacherMode || !user?.classId) return null;
    return allClasses.find(c => c.id === user.classId);
  }, [isTeacherMode, user?.classId, allClasses]);

  // === 根据类型自动判断是否发布到学校主页 ===
  const isExternal = type === 'announcement' || type === 'news';

  // === 是否需要审批 ===
  const needsApproval = !isTeacherMode && departmentConfig?.requiresApproval && isExternal;

  // === 教师模式：对话框打开时自动设置本班为接收者 ===
  useEffect(() => {
    if (open && isTeacherMode && user?.classId) {
      setRecipientConfig({
        type: 'class',
        classIds: [user.classId],
      });
    }
  }, [open, isTeacherMode, user?.classId]);

  // === 可选审批领导列表 ===
  const availableLeaders: { role: ApproverLeaderRole; label: string; description: string }[] = [
    { role: 'principal', label: '校长', description: '学校最高管理者' },
    { role: 'secretary', label: '书记', description: '党委书记' },
    { role: 'academic_vice_principal', label: '教学副校长', description: '分管教务' },
    { role: 'moral_vice_principal', label: '德育副校长', description: '分管德育' },
    { role: 'general_vice_principal', label: '总务副校长', description: '分管总务' },
  ];

  // === 根据部门自动推荐分管副校长 ===
  const recommendedVicePrincipal = useMemo((): ApproverLeaderRole | null => {
    if (department === 'academic_office') return 'academic_vice_principal';
    if (department === 'moral_office') return 'moral_vice_principal';
    if (department === 'general_office') return 'general_vice_principal';
    return null;
  }, [department]);

  // === 自动选择推荐的分管副校长 ===
  useEffect(() => {
    if (needsApproval && recommendedVicePrincipal && selectedLeaders.length === 0) {
      setSelectedLeaders([recommendedVicePrincipal]);
    }
  }, [needsApproval, recommendedVicePrincipal]);

  // === 表单验证 ===
  const isValid = useMemo(() => {
    if (!title.trim() || !content.trim()) return false;
    if (!isTeacherMode) {
      // 部门模式的验证
      if (recipientConfig.type === 'role' && (!recipientConfig.roles || recipientConfig.roles.length === 0)) return false;
      if (recipientConfig.type === 'class' && (!recipientConfig.classIds || recipientConfig.classIds.length === 0)) return false;
      if (recipientConfig.type === 'individual' && (!recipientConfig.userIds || recipientConfig.userIds.length === 0)) return false;
      if (recipientConfig.type === 'group' && (!recipientConfig.groupIds || recipientConfig.groupIds.length === 0)) return false;
      if (needsApproval && selectedLeaders.length === 0) return false;
    } else {
      // 教师模式：必须有班级
      if (!recipientConfig.classIds || recipientConfig.classIds.length === 0) return false;
    }
    return true;
  }, [title, content, recipientConfig, needsApproval, selectedLeaders, isTeacherMode]);

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
        // 内部通知和家长通知都需要传递接收者信息
        recipients: (type === 'internal_notice' || type === 'parent_notice') ? recipientConfig : undefined,
        customFlow: needsApproval ? {
          skipDepartmentDirector,
          approvalType,
          selectedLeaders,
          approvalMode,
        } : undefined,
      };

      const result = await onSubmit(request);

      if (result.success) {
        // 重置表单
        resetForm();
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

  // === 重置表单 ===
  const resetForm = () => {
    setTitle('');
    setSummary('');
    setContent('');
    setCategory('');
    setMediaLevel('');
    setRecipientConfig({ 
      type: isTeacherMode ? 'class' : 'all',
      classIds: isTeacherMode && user?.classId ? [user.classId] : [],
    });
    setCoverImage(null);
    setImages([]);
    setAttachments([]);
    setScheduledPublish(false);
    setScheduledPublishAt('');
    setAutoUnpublish(false);
    setAutoUnpublishAt('');
    setSkipDepartmentDirector(false);
    setApprovalType('or_sign');
    setSelectedLeaders([]);
    setApprovalMode('or_sign');
    setError(null);
  };

  // === 图片上传处理 ===
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
        if (isCover && !isTeacherMode) {
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

  // === 文件上传处理（仅部门模式） ===
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
    { value: 'academic_vice_principal', label: '教学副校长' },
    { value: 'moral_vice_principal', label: '德育副校长' },
    { value: 'general_vice_principal', label: '总务副校长' },
    { value: 'head_teacher', label: '班主任' },
    { value: 'subject_teacher', label: '科任教师' },
    { value: 'skill_teacher', label: '技能课教师' },
    { value: 'parent', label: '家长' },
  ];

  // ==================== 教师模式简化界面 ====================
  if (isTeacherMode) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              发布家长通知
            </DialogTitle>
            <DialogDescription>
              {teacherInfo?.name} · {myClass ? `${myClass.grade}${myClass.name}` : '未分配班级'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* 错误提示 */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {/* 接收班级 */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">接收对象：</span>
                <span className="font-medium">
                  {myClass ? `${myClass.grade}${myClass.name} 全体家长` : '未分配班级'}
                </span>
              </div>
            </div>

            {/* 通知分类 */}
            <div className="space-y-2">
              <Label>通知分类</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as ParentNoticeCategory)}>
                <SelectTrigger>
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.parent_notice.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 标题 */}
            <div className="space-y-2">
              <Label htmlFor="title">通知标题 *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="请输入通知标题"
              />
            </div>

            {/* 内容 */}
            <div className="space-y-2">
              <Label htmlFor="content">通知内容 *</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="请输入通知内容"
                rows={6}
              />
            </div>

            {/* 图片上传（可选） */}
            <div className="space-y-2">
              <Label>配图（可选）</Label>
              <div className="flex flex-wrap gap-3">
                {images.map((img, index) => (
                  <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden border">
                    <img src={img} alt={`图片${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full hover:bg-black/70"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {images.length < 9 && (
                  <label className="w-20 h-20 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                    />
                    {uploadingImage ? (
                      <span className="text-xs text-muted-foreground">上传中...</span>
                    ) : (
                      <>
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground mt-1">添加图片</span>
                      </>
                    )}
                  </label>
                )}
              </div>
              <p className="text-xs text-muted-foreground">最多上传9张图片</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={!isValid || loading}>
              {loading ? '发送中...' : '发送通知'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // ==================== 部门模式完整界面 ====================
  // ... 以下保持原有的部门模式代码 ...

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
                  <span>{cls.grade}{cls.name}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'individual':
        return (
          <div className="space-y-3">
            <Label>选择教师</Label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {allTeachers.map((teacher) => (
                <label
                  key={teacher.id}
                  className={cn(
                    'flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors text-sm',
                    recipientConfig.userIds?.includes(teacher.id)
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-gray-50'
                  )}
                >
                  <Checkbox
                    checked={recipientConfig.userIds?.includes(teacher.id)}
                    onCheckedChange={(checked) => {
                      const userIds = recipientConfig.userIds || [];
                      setRecipientConfig({
                        ...recipientConfig,
                        userIds: checked
                          ? [...userIds, teacher.id]
                          : userIds.filter((id) => id !== teacher.id),
                      });
                    }}
                  />
                  <span>{teacher.name}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'group':
        return (
          <div className="space-y-3">
            <Label>选择群组</Label>
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
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
                    <span className="text-sm font-medium">{group.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {group.memberCount || 0}人
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Users className="h-4 w-4 text-muted-foreground" />
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
          {/* 错误提示 */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

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

              {/* 封面图 */}
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
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                    />
                    {uploadingImage ? (
                      <span className="text-xs text-muted-foreground">上传中...</span>
                    ) : (
                      <>
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground mt-1">添加图片</span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* 附件 */}
              <div className="space-y-2">
                <Label>附件</Label>
                <div className="space-y-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm flex-1 truncate">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(1)}KB
                      </span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="p-1 text-destructive hover:bg-destructive/10 rounded"
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
                    {uploadingFile ? (
                      <span className="text-sm text-muted-foreground">上传中...</span>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">上传附件</span>
                      </>
                    )}
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 通知类型与分类 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">通知类型与分类</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>通知类型</Label>
                <Select value={type} onValueChange={(v) => setType(v as AnnouncementType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="announcement">校园公告</SelectItem>
                    <SelectItem value="news">新闻动态</SelectItem>
                    <SelectItem value="internal_notice">内部通知</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {type === 'announcement' && '校园公告将发布到学校主页门户，需要审批'}
                  {type === 'news' && '新闻动态将发布到学校主页门户，需要审批'}
                  {type === 'internal_notice' && '内部通知仅发送给指定对象，无需审批'}
                </p>
              </div>

              <div className="space-y-2">
                <Label>分类</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS[type]?.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 媒体级别（仅新闻动态-媒体附小分类） */}
              {type === 'news' && category === '媒体附小' && (
                <div className="space-y-2">
                  <Label>媒体级别</Label>
                  <Select value={mediaLevel} onValueChange={(v) => setMediaLevel(v as MediaLevel)}>
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

          {/* 接收对象（仅内部通知） */}
          {type === 'internal_notice' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">接收对象</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>通知对象类型</Label>
                  <Select
                    value={recipientConfig.type}
                    onValueChange={(v) => {
                      setRecipientConfig({
                        type: v as RecipientConfig['type'],
                        roles: [],
                        classIds: [],
                        userIds: [],
                        groupIds: [],
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全体教师</SelectItem>
                      <SelectItem value="role">按角色</SelectItem>
                      <SelectItem value="class">按班级</SelectItem>
                      <SelectItem value="individual">指定教师</SelectItem>
                      <SelectItem value="group">群组</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {renderRecipientSelector()}
              </CardContent>
            </Card>
          )}

          {/* 发布设置 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">发布设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>定时发布</Label>
                  <p className="text-xs text-muted-foreground">设置后将在指定时间发布</p>
                </div>
                <Checkbox
                  checked={scheduledPublish}
                  onCheckedChange={(checked) => setScheduledPublish(checked as boolean)}
                />
              </div>

              {scheduledPublish && (
                <div className="space-y-2">
                  <Label>发布时间</Label>
                  <Input
                    type="datetime-local"
                    value={scheduledPublishAt}
                    onChange={(e) => setScheduledPublishAt(e.target.value)}
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>自动下架</Label>
                  <p className="text-xs text-muted-foreground">设置后将在指定时间自动下架</p>
                </div>
                <Checkbox
                  checked={autoUnpublish}
                  onCheckedChange={(checked) => setAutoUnpublish(checked as boolean)}
                />
              </div>

              {autoUnpublish && (
                <div className="space-y-2">
                  <Label>下架时间</Label>
                  <Input
                    type="datetime-local"
                    value={autoUnpublishAt}
                    onChange={(e) => setAutoUnpublishAt(e.target.value)}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* 审批流程 */}
          {needsApproval && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">审批流程</CardTitle>
                <CardDescription>
                  此通知需要审批后才能发布
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>跳过部门主任</Label>
                    <p className="text-xs text-muted-foreground">直接提交给校级领导审批</p>
                  </div>
                  <Checkbox
                    checked={skipDepartmentDirector}
                    onCheckedChange={(checked) => setSkipDepartmentDirector(checked as boolean)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>审批领导</Label>
                  <div className="space-y-2">
                    {availableLeaders.map((leader) => (
                      <label
                        key={leader.role}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                          selectedLeaders.includes(leader.role)
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-gray-50'
                        )}
                      >
                        <Checkbox
                          checked={selectedLeaders.includes(leader.role)}
                          onCheckedChange={(checked) => {
                            setSelectedLeaders(
                              checked
                                ? [...selectedLeaders, leader.role]
                                : selectedLeaders.filter((l) => l !== leader.role)
                            );
                          }}
                        />
                        <div>
                          <span className="text-sm font-medium">{leader.label}</span>
                          <p className="text-xs text-muted-foreground">{leader.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>审批方式</Label>
                  <RadioGroup
                    value={approvalMode}
                    onValueChange={(v) => setApprovalMode(v as ApprovalMode)}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="or_sign" id="or_sign" />
                      <Label htmlFor="or_sign" className="text-sm">或签（任一领导通过即可）</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="countersign" id="countersign" />
                      <Label htmlFor="countersign" className="text-sm">会签（所有领导都需通过）</Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || loading}>
            {loading ? '提交中...' : needsApproval ? '提交审批' : '发布'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
