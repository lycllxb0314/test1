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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { DEPARTMENTS, type SubmitApprovalRequest, type AnnouncementType } from '@/types/approval';
import { useTeachers } from '@/hooks/useTeachers';
import { useClasses } from '@/hooks/useClasses';
import { useGroups } from '@/hooks/useGroups';

// ==================== 类型定义 ====================

export interface PublishNotificationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (request: SubmitApprovalRequest) => Promise<{ success: boolean; error?: string }>;
  /** 发布者部门 */
  department: string;
  /** 是否显示外部发布选项 */
  showExternalOption?: boolean;
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
  showExternalOption = true,
  showApprovalFlow = true,
  recipientTypes = ['all', 'role', 'class', 'individual', 'group'],
}: PublishNotificationProps) {
  const { user } = useAuth();
  const { allTeachers } = useTeachers();
  const { allClasses } = useClasses();
  const { groups } = useGroups();

  // === 表单状态 ===
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<AnnouncementType>('announcement');
  const [category, setCategory] = useState('');
  const [recipientConfig, setRecipientConfig] = useState<RecipientConfig>({ type: 'all' });
  const [isExternal, setIsExternal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // === 审批流程配置 ===
  const [skipDepartmentDirector, setSkipDepartmentDirector] = useState(false);
  const [approvalType, setApprovalType] = useState<'or_sign' | 'countersign'>('or_sign');

  // === 获取部门配置 ===
  const departmentConfig = useMemo(() => {
    return DEPARTMENTS.find(d => d.id === department) || DEPARTMENTS[0];
  }, [department]);

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
        content: content.trim(),
        type,
        category: category.trim() || undefined,
        department,
        isExternal,
        customFlow: needsApproval ? {
          skipDepartmentDirector,
          approvalType,
        } : undefined,
      };

      const result = await onSubmit(request);

      if (result.success) {
        // 重置表单
        setTitle('');
        setContent('');
        setCategory('');
        setRecipientConfig({ type: 'all' });
        setIsExternal(false);
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
                <Label htmlFor="content">内容 *</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="请输入通知内容"
                  rows={6}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>类型</Label>
                  <Select
                    value={type}
                    onValueChange={(v) => setType(v as AnnouncementType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="announcement">校园公告</SelectItem>
                      <SelectItem value="news">新闻动态</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>分类</Label>
                  <Input
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="如：重要通知、活动预告"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 接收对象 */}
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

          {/* 外部发布选项 */}
          {showExternalOption && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">发布范围</CardTitle>
              </CardHeader>
              <CardContent>
                <label className="flex items-start gap-3 cursor-pointer">
                  <Checkbox
                    checked={isExternal}
                    onCheckedChange={(checked) => setIsExternal(checked as boolean)}
                  />
                  <div>
                    <p className="font-medium text-sm">同时发布到学校主页</p>
                    <p className="text-xs text-gray-500">
                      勾选后将在学校官网的校园公告/新闻中心同步展示
                    </p>
                  </div>
                </label>
              </CardContent>
            </Card>
          )}

          {/* 审批流程选择 */}
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
