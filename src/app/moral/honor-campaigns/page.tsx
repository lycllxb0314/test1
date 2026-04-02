'use client';

/**
 * 德育处 - 学生荣誉评选管理页面
 *
 * 功能：
 * - 创建/编辑评选活动
 * - 发布/结束评选
 * - 查看申报列表
 * - 审批申报（德育处步骤）
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
  Search,
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
  FileText,
  Settings,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type {
  HonorCampaign,
  HonorApplication,
  CreateCampaignRequest,
  FormConfig,
} from '@/types/honor-campaign';
import { FORM_PRESET_EXCELLENT_YOUNG_PIONEER, FORM_PRESET_MERIT_STUDENT, APPROVAL_STEP_NAMES, APPROVAL_STEP_ORDER } from '@/types/honor-campaign';

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

export default function HonorCampaignManagementPage() {
  const router = useRouter();
  const { user } = useAuth();

  // === 数据状态 ===
  const [campaigns, setCampaigns] = useState<HonorCampaign[]>([]);
  const [applications, setApplications] = useState<HonorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // === 分页状态 ===
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // === Tab 状态 ===
  const [activeTab, setActiveTab] = useState('campaigns');

  // === 对话框状态 ===
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedCampaign, setSelectedCampaign] = useState<HonorCampaign | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [applicationDetailOpen, setApplicationDetailOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<HonorApplication | null>(null);

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
  });

  // ==================== 数据加载 ====================

  // 加载评选活动列表
  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/honor-campaigns', { credentials: 'include' });
      const result = await res.json();
      
      if (result.success) {
        setCampaigns(result.data.data || []);
        setTotal(result.data.pagination?.total || 0);
        setTotalPages(Math.ceil((result.data.pagination?.total || 0) / 20));
      }
    } catch (err) {
      console.error('加载评选活动失败:', err);
      toast.error('加载评选活动失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 加载待审批申报
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

  // 打开创建对话框
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
    });
    setDialogOpen(true);
  };

  // 打开编辑对话框
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
    });
    setDialogOpen(true);
  };

  // 提交表单
  const handleSubmit = async () => {
    // 验证
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
        toast.error(result.message || '操作失败');
      }
    } catch (err) {
      console.error('提交失败:', err);
      toast.error('提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 发布评选活动
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

  // 查看申报详情
  const handleViewApplication = async (application: HonorApplication) => {
    try {
      const res = await fetch(`/api/honor-applications/${application.id}`, {
        credentials: 'include',
      });
      const result = await res.json();

      if (result.success) {
        setSelectedApplication(result.data);
        setApplicationDetailOpen(true);
      }
    } catch (err) {
      console.error('获取申报详情失败:', err);
      toast.error('获取申报详情失败');
    }
  };

  // 审批申报
  const handleApprove = async (application: HonorApplication, result: 'approved' | 'rejected') => {
    const comment = result === 'approved' ? '同意' : '不同意';
    
    try {
      const res = await fetch(`/api/honor-applications/${application.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ result, comment }),
      });

      const resData = await res.json();

      if (resData.success) {
        toast.success(result === 'approved' ? '审批通过' : '审批拒绝');
        loadPendingApplications();
      } else {
        toast.error(resData.message || '审批失败');
      }
    } catch (err) {
      console.error('审批失败:', err);
      toast.error('审批失败');
    }
  };

  // 荣誉类型变化时更新表单配置
  const handleHonorTypeChange = (value: string) => {
    let formConfig = FORM_PRESET_EXCELLENT_YOUNG_PIONEER;
    if (value === '三好学生') {
      formConfig = FORM_PRESET_MERIT_STUDENT;
    }
    setFormData(prev => ({ ...prev, honorType: value, formConfig }));
  };

  // ==================== 渲染 ====================

  return (
    <div className="p-6 lg:p-8 space-y-6 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/moral')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">学生荣誉评选管理</h1>
            <p className="text-gray-500 mt-1">管理评选活动、审批申报</p>
          </div>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          创建评选活动
        </Button>
      </div>

      {/* Tab 切换 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-card border">
          <TabsTrigger value="campaigns" className="gap-2">
            <Trophy className="h-4 w-4" />
            评选活动
          </TabsTrigger>
          <TabsTrigger value="approvals" className="gap-2">
            <FileText className="h-4 w-4" />
            待审批
            {applications.length > 0 && (
              <Badge variant="secondary" className="ml-1">{applications.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: 评选活动列表 */}
        <TabsContent value="campaigns" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : campaigns.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Trophy className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-400">暂无评选活动</p>
                <Button onClick={handleCreate} variant="link" className="mt-2">
                  创建第一个评选活动
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {campaigns.map((campaign) => (
                <Card key={campaign.id} className="border-0 shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{campaign.title}</CardTitle>
                        <CardDescription className="mt-1">{campaign.honorType}</CardDescription>
                      </div>
                      <Badge className={STATUS_COLORS[campaign.status]}>
                        {STATUS_NAMES[campaign.status]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {campaign.startDate} ~ {campaign.endDate}
                      </div>
                    </div>
                    
                    {campaign.applicantCount !== undefined && (
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-blue-500" />
                          <span>申报: {campaign.applicantCount}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>通过: {campaign.approvedCount || 0}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2">
                      {campaign.status === 'draft' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(campaign)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            编辑
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handlePublish(campaign)}
                          >
                            <Send className="h-4 w-4 mr-1" />
                            发布
                          </Button>
                        </>
                      )}
                      {campaign.status === 'published' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/moral/honor-campaigns/${campaign.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          查看申报
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: 待审批 */}
        <TabsContent value="approvals" className="space-y-4">
          {applications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-400">暂无待审批申报</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>学生</TableHead>
                    <TableHead>班级</TableHead>
                    <TableHead>评选活动</TableHead>
                    <TableHead>提交时间</TableHead>
                    <TableHead>班主任意见</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">{app.studentName}</TableCell>
                      <TableCell>{app.className}</TableCell>
                      <TableCell>{app.campaign?.title}</TableCell>
                      <TableCell>
                        {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>
                        {app.approvalComments.find(c => c.step === 'head_teacher')?.comment || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewApplication(app)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-green-600 hover:text-green-700"
                            onClick={() => handleApprove(app, 'approved')}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleApprove(app, 'rejected')}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* 创建/编辑对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'create' ? '创建评选活动' : '编辑评选活动'}
            </DialogTitle>
            <DialogDescription>
              设置评选活动基本信息和表单配置
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* 活动标题 */}
            <div className="grid gap-2">
              <Label>活动标题 *</Label>
              <Input
                placeholder="如：2024年秋季学期优秀少先队员评选"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            {/* 荣誉类型 */}
            <div className="grid gap-2">
              <Label>荣誉类型 *</Label>
              <Select value={formData.honorType} onValueChange={handleHonorTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="选择荣誉类型" />
                </SelectTrigger>
                <SelectContent>
                  {HONOR_TYPE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 活动描述 */}
            <div className="grid gap-2">
              <Label>活动描述</Label>
              <Textarea
                placeholder="评选活动的详细描述..."
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            {/* 申报条件 */}
            <div className="grid gap-2">
              <Label>申报条件</Label>
              <Textarea
                placeholder="申报条件要求..."
                value={formData.requirements || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, requirements: e.target.value }))}
                rows={3}
              />
            </div>

            {/* 时间设置 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>开始日期 *</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>截止日期 *</Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>

            {/* 每班申报上限 */}
            <div className="grid gap-2">
              <Label>每班申报上限</Label>
              <Input
                type="number"
                min={1}
                max={20}
                value={formData.maxApplicantsPerClass}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  maxApplicantsPerClass: parseInt(e.target.value) || 5 
                }))}
              />
            </div>

            {/* 表单字段配置 */}
            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                表单字段配置
              </Label>
              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                {formData.formConfig?.fields.map((field, index) => (
                  <div key={index} className="flex items-center gap-2 py-1">
                    <span className="font-medium">{field.label}</span>
                    <span className="text-gray-400">({field.type})</span>
                    {field.required && <Badge variant="secondary" className="text-xs">必填</Badge>}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                表单字段根据荣誉类型自动配置，如需自定义请联系开发人员
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {dialogMode === 'create' ? '创建' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 申报详情对话框 */}
      <Dialog open={applicationDetailOpen} onOpenChange={setApplicationDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>申报详情</DialogTitle>
          </DialogHeader>
          
          {selectedApplication && (
            <div className="space-y-4">
              {/* 基本信息 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">基本信息</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">学生姓名：</span>
                      <span className="font-medium">{selectedApplication.studentName}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">班级：</span>
                      <span>{selectedApplication.className}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">申报荣誉：</span>
                      <span>{selectedApplication.campaign?.honorType}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">提交时间：</span>
                      <span>{selectedApplication.submittedAt ? new Date(selectedApplication.submittedAt).toLocaleString() : '-'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 表单内容 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">申报内容</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(selectedApplication.formData).map(([key, value]) => (
                      <div key={key}>
                        <Label className="text-gray-500">{key}</Label>
                        <p className="mt-1 text-sm whitespace-pre-wrap">{value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 附件 */}
              {selectedApplication.attachments && selectedApplication.attachments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">附件材料</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedApplication.attachments.map((att, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <FileText className="h-4 w-4 text-blue-500" />
                          <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {att.name}
                          </a>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 审批流程 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">审批流程</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedApplication.approvalComments.map((comment, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          comment.result === 'approved' ? 'bg-green-100 text-green-600' :
                          comment.result === 'rejected' ? 'bg-red-100 text-red-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {comment.result === 'approved' ? <CheckCircle className="h-4 w-4" /> :
                           comment.result === 'rejected' ? <XCircle className="h-4 w-4" /> :
                           <Clock className="h-4 w-4" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{APPROVAL_STEP_NAMES[comment.step]}</span>
                            <span className="text-gray-400">·</span>
                            <span className="text-sm text-gray-500">{comment.approverName}</span>
                          </div>
                          {comment.comment && (
                            <p className="text-sm text-gray-600 mt-1">{comment.comment}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(comment.time).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setApplicationDetailOpen(false)}>
              关闭
            </Button>
            {selectedApplication && selectedApplication.status === 'pending' && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleApprove(selectedApplication, 'rejected');
                    setApplicationDetailOpen(false);
                  }}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  拒绝
                </Button>
                <Button
                  onClick={() => {
                    handleApprove(selectedApplication, 'approved');
                    setApplicationDetailOpen(false);
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  通过
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
