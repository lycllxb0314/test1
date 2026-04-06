'use client';

/**
 * 德育处 - 荣誉评选活动管理组件
 *
 * 功能：
 * - 创建/编辑评选活动
 * - 发布/结束评选
 * - 查看申报列表
 * - 审批申报（德育处步骤）
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  Trophy,
  Plus,
  Eye,
  Edit,
  Trash2,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Calendar,
  Loader2,
  ChevronLeft,
  ChevronRight,
  FileText,
  RotateCcw,
  FileCheck,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type {
  HonorCampaign,
  HonorApplication,
  CreateCampaignRequest,
  ApprovalComment,
} from '@/types/honor-campaign';
import { FORM_PRESET_EXCELLENT_YOUNG_PIONEER, FORM_PRESET_MERIT_STUDENT, APPROVAL_STEP_NAMES, APPROVAL_STEP_ORDER, getSchoolYearOptions, getCurrentSchoolYear } from '@/types/honor-campaign';
import { HonorApplicationPrintDialog } from './HonorApplicationPrintDialog';
import { HonorApprovedList } from './HonorApprovedList';

// ==================== 配置 ====================

const STATUS_NAMES: Record<string, string> = {
  draft: '草稿',
  published: '已发布',
  closed: '已结束',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  published: 'bg-green-100 text-green-700',
  closed: 'bg-red-100 text-red-700',
};

const HONOR_TYPE_OPTIONS = [
  { value: '优秀少先队员', label: '优秀少先队员' },
  { value: '三好学生', label: '三好学生' },
  { value: '优秀班干部', label: '优秀班干部' },
  { value: '美德少年', label: '美德少年' },
  { value: '学习之星', label: '学习之星' },
  { value: '其他', label: '其他' },
];

// ==================== 主组件 ====================

export function HonorCampaignTab() {
  const { user } = useAuth();

  // === 数据状态 ===
  const [campaigns, setCampaigns] = useState<HonorCampaign[]>([]);
  const [applications, setApplications] = useState<HonorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // === Tab 状态 ===
  const [activeTab, setActiveTab] = useState('campaigns');

  // === 对话框状态 ===
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedCampaign, setSelectedCampaign] = useState<HonorCampaign | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<HonorApplication | null>(null);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [approvalResult, setApprovalResult] = useState<'approved' | 'rejected' | 'returned'>('approved');
  const [approvalComment, setApprovalComment] = useState('');

  // === 表单状态 ===
  const [formData, setFormData] = useState<CreateCampaignRequest>({
    title: '',
    honorType: '优秀少先队员',
    description: '',
    requirements: '',
    startDate: '',
    endDate: '',
    formConfig: FORM_PRESET_EXCELLENT_YOUNG_PIONEER,
    maxApplicantsPerClass: 5,
    approvalConfig: {
      steps: APPROVAL_STEP_ORDER,
      allowReturn: true,
      timeoutDays: 7,
    },
    schoolYear: getCurrentSchoolYear(),
  });

  // ==================== 数据加载 ====================

  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/honor-campaigns', { credentials: 'include' });
      const result = await res.json();

      if (result.success) {
        setCampaigns(result.data.data || []);
      }
    } catch (err) {
      console.error('加载评选活动失败:', err);
      toast.error('加载评选活动失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPendingApplications = useCallback(async () => {
    try {
      const res = await fetch('/api/honor-applications?currentStep=moral_dept&status=pending', {
        credentials: 'include',
      });
      const result = await res.json();

      if (result.success) {
        setApplications(result.data.data || []);
      }
    } catch (err) {
      console.error('加载待审批申报失败:', err);
    }
  }, []);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  useEffect(() => {
    if (activeTab === 'approvals') {
      loadPendingApplications();
    }
  }, [activeTab, loadPendingApplications]);

  // ==================== 操作处理 ====================

  const handleCreate = () => {
    setDialogMode('create');
    setFormData({
      title: '',
      honorType: '优秀少先队员',
      description: '',
      requirements: '',
      startDate: '',
      endDate: '',
      formConfig: FORM_PRESET_EXCELLENT_YOUNG_PIONEER,
      maxApplicantsPerClass: 5,
      approvalConfig: {
        steps: APPROVAL_STEP_ORDER,
        allowReturn: true,
        timeoutDays: 7,
      },
      schoolYear: getCurrentSchoolYear(),
    });
    setDialogOpen(true);
  };

  const handleEdit = (campaign: HonorCampaign) => {
    setDialogMode('edit');
    setSelectedCampaign(campaign);
    setFormData({
      title: campaign.title,
      honorType: campaign.honorType,
      description: campaign.description || '',
      requirements: campaign.requirements || '',
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      formConfig: campaign.formConfig || FORM_PRESET_EXCELLENT_YOUNG_PIONEER,
      maxApplicantsPerClass: campaign.maxApplicantsPerClass,
      approvalConfig: campaign.approvalConfig || undefined,
      schoolYear: campaign.schoolYear || getCurrentSchoolYear(),
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error('请输入活动标题');
      return;
    }
    if (!formData.startDate || !formData.endDate) {
      toast.error('请选择开始和结束日期');
      return;
    }

    setSubmitting(true);
    try {
      const url = dialogMode === 'create'
        ? '/api/honor-campaigns'
        : `/api/honor-campaigns/${selectedCampaign?.id}`;

      const res = await fetch(url, {
        method: dialogMode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      if (result.success) {
        toast.success(dialogMode === 'create' ? '创建成功' : '更新成功');
        setDialogOpen(false);
        loadCampaigns();
      } else {
        toast.error(result.error || result.message || '操作失败');
      }
    } catch (err) {
      console.error('提交失败:', err);
      toast.error('提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async (campaign: HonorCampaign) => {
    if (!confirm(`确定要发布「${campaign.title}」吗？发布后将通知所有班主任和家长。`)) {
      return;
    }

    try {
      const res = await fetch(`/api/honor-campaigns/${campaign.id}/publish`, {
        method: 'POST',
        credentials: 'include',
      });

      const result = await res.json();

      if (result.success) {
        toast.success('发布成功');
        loadCampaigns();
      } else {
        toast.error(result.message || '发布失败');
      }
    } catch (err) {
      console.error('发布失败:', err);
      toast.error('发布失败');
    }
  };

  const handleClose = async (campaign: HonorCampaign) => {
    if (!confirm(`确定要结束「${campaign.title}」吗？`)) {
      return;
    }

    try {
      const res = await fetch(`/api/honor-campaigns/${campaign.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'closed' }),
      });

      const result = await res.json();

      if (result.success) {
        toast.success('已结束');
        loadCampaigns();
      } else {
        toast.error(result.message || '操作失败');
      }
    } catch (err) {
      console.error('结束失败:', err);
      toast.error('操作失败');
    }
  };

  const handleDelete = async (campaign: HonorCampaign) => {
    try {
      const res = await fetch(`/api/honor-campaigns/${campaign.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const result = await res.json();

      if (result.success) {
        toast.success('删除成功');
        loadCampaigns();
      } else {
        toast.error(result.message || '删除失败');
      }
    } catch (err) {
      console.error('删除失败:', err);
      toast.error('删除失败');
    }
  };

  // 打开审批对话框
  const handleOpenApproval = (application: HonorApplication) => {
    setSelectedApplication(application);
    setApprovalResult('approved');
    setApprovalComment('');
    setApprovalDialogOpen(true);
  };

  // 执行审批
  const handleApproval = async () => {
    if (!selectedApplication) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/honor-applications/${selectedApplication.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          result: approvalResult,
          comment: approvalComment,
        }),
      });

      const result = await res.json();

      if (result.success) {
        toast.success(approvalResult === 'approved' ? '审批通过' : approvalResult === 'rejected' ? '已拒绝' : '已退回');
        setApprovalDialogOpen(false);
        loadPendingApplications();
      } else {
        toast.error(result.message || '审批失败');
      }
    } catch (err) {
      console.error('审批失败:', err);
      toast.error('审批失败');
    } finally {
      setSubmitting(false);
    }
  };

  // ==================== 渲染 ====================

  return (
    <div className="space-y-4">
      {/* 子Tab切换 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-4">
          <TabsList className="bg-white border">
            <TabsTrigger value="campaigns" className="gap-2">
              <Trophy className="h-4 w-4" />
              评选活动
            </TabsTrigger>
            <TabsTrigger value="approvals" className="gap-2">
              <CheckCircle className="h-4 w-4" />
              待审批申报
              {applications.length > 0 && (
                <Badge className="ml-1 bg-red-500 text-white text-xs">{applications.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved" className="gap-2">
              <FileCheck className="h-4 w-4" />
              已审批
            </TabsTrigger>
          </TabsList>

          {activeTab === 'campaigns' && (
            <Button onClick={handleCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              创建评选活动
            </Button>
          )}
        </div>

        {/* 评选活动列表 */}
        <TabsContent value="campaigns" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : campaigns.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Trophy className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-4">暂无评选活动</p>
                <Button onClick={handleCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  创建第一个评选活动
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {campaigns.map((campaign) => (
                <Card key={campaign.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-1">{campaign.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {campaign.honorType}
                        </CardDescription>
                      </div>
                      <Badge className={STATUS_COLORS[campaign.status]}>
                        {STATUS_NAMES[campaign.status]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{campaign.applicantCount || 0} 人申报</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>{campaign.approvedCount || 0} 人通过</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      {campaign.status === 'draft' && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => handleEdit(campaign)}>
                            <Edit className="h-4 w-4 mr-1" />
                            编辑
                          </Button>
                          <Button size="sm" onClick={() => handlePublish(campaign)}>
                            <Send className="h-4 w-4 mr-1" />
                            发布
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(campaign)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {campaign.status === 'published' && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => handleEdit(campaign)}>
                            <Edit className="h-4 w-4 mr-1" />
                            编辑
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleClose(campaign)}>
                            结束评选
                          </Button>
                        </>
                      )}
                      {campaign.status === 'closed' && (
                        <span className="text-sm text-muted-foreground">评选已结束</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* 待审批申报列表 */}
        <TabsContent value="approvals" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : applications.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">暂无待审批的申报</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>学生</TableHead>
                    <TableHead>班级</TableHead>
                    <TableHead>荣誉类型</TableHead>
                    <TableHead>申报时间</TableHead>
                    <TableHead>班主任审批</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app) => {
                    const headTeacherComment = app.approvalComments?.find(c => c.step === 'head_teacher');
                    return (
                      <TableRow key={app.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{app.studentName}</p>
                            <p className="text-xs text-muted-foreground">{app.studentNo}</p>
                          </div>
                        </TableCell>
                        <TableCell>{app.className}</TableCell>
                        <TableCell>{app.campaign?.honorType || '-'}</TableCell>
                        <TableCell>
                          {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell>
                          {headTeacherComment ? (
                            <div className="flex items-center gap-1">
                              {headTeacherComment.result === 'approved' ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500" />
                              )}
                              <span className="text-sm">{headTeacherComment.approverName}</span>
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => { setSelectedApplication(app); setPrintDialogOpen(true); }}>
                              <Eye className="h-4 w-4 mr-1" />
                              预览
                            </Button>
                            <Button size="sm" onClick={() => handleOpenApproval(app)}>
                              审批
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* 已审批申报列表 */}
        <TabsContent value="approved" className="space-y-4">
          <HonorApprovedList />
        </TabsContent>
      </Tabs>

      {/* 创建/编辑评选活动对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'create' ? '创建评选活动' : '编辑评选活动'}
            </DialogTitle>
            <DialogDescription>
              设置荣誉评选活动的基本信息和表单配置
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>活动标题 *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="例如：2024年春季优秀少先队员评选"
              />
            </div>

            <div className="grid gap-2">
              <Label>荣誉类型 *</Label>
              <Select
                value={formData.honorType}
                onValueChange={(value) => {
                  const preset = value === '优秀少先队员' ? FORM_PRESET_EXCELLENT_YOUNG_PIONEER :
                                value === '三好学生' ? FORM_PRESET_MERIT_STUDENT :
                                formData.formConfig;
                  setFormData({ ...formData, honorType: value, formConfig: preset });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HONOR_TYPE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>学年 *</Label>
              <Select
                value={formData.schoolYear || getCurrentSchoolYear()}
                onValueChange={(value) => setFormData({ ...formData, schoolYear: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getSchoolYearOptions().map(year => (
                    <SelectItem key={year} value={year}>{year}学年</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>开始日期 *</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>结束日期 *</Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>申报条件</Label>
              <Textarea
                value={formData.requirements}
                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                placeholder="描述申报条件，如：本学期无违纪记录、学习成绩优良等"
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label>活动说明</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="活动的详细说明"
                rows={2}
              />
            </div>

            <div className="grid gap-2">
              <Label>每班最大申报人数</Label>
              <Input
                type="number"
                value={formData.maxApplicantsPerClass}
                onChange={(e) => setFormData({ ...formData, maxApplicantsPerClass: parseInt(e.target.value) || 5 })}
                min={1}
                max={20}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {dialogMode === 'create' ? '创建' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 审批对话框 */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>审批申报</DialogTitle>
            <DialogDescription>
              学生：{selectedApplication?.studentName}（{selectedApplication?.className}）
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>审批结果</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="approvalResult"
                    value="approved"
                    checked={approvalResult === 'approved'}
                    onChange={() => setApprovalResult('approved')}
                    className="h-4 w-4"
                  />
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>通过</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="approvalResult"
                    value="rejected"
                    checked={approvalResult === 'rejected'}
                    onChange={() => setApprovalResult('rejected')}
                    className="h-4 w-4"
                  />
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span>拒绝</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="approvalResult"
                    value="returned"
                    checked={approvalResult === 'returned'}
                    onChange={() => setApprovalResult('returned')}
                    className="h-4 w-4"
                  />
                  <RotateCcw className="h-4 w-4 text-orange-500" />
                  <span>退回</span>
                </label>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>审批意见</Label>
              <Textarea
                value={approvalComment}
                onChange={(e) => setApprovalComment(e.target.value)}
                placeholder="请输入审批意见（可选）"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalDialogOpen(false)}>取消</Button>
            <Button
              onClick={handleApproval}
              disabled={submitting}
              variant={approvalResult === 'approved' ? 'default' : approvalResult === 'rejected' ? 'destructive' : 'outline'}
            >
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              确认
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 打印预览弹窗 */}
      <HonorApplicationPrintDialog
        open={printDialogOpen}
        onOpenChange={setPrintDialogOpen}
        application={selectedApplication}
      />
    </div>
  );
}
