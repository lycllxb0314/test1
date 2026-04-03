'use client';

/**
 * 家长端 - 学生荣誉申报页面
 *
 * 功能：
 * - 查看可申报的评选活动
 * - 填写申报表
 * - 查看申报状态
 * - 打印申报表
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Trophy,
  Plus,
  Eye,
  Edit,
  Printer,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useFilePreview } from '@/hooks/useFilePreview';
import { FilePreviewDialog } from '@/components/ui/file-preview-dialog';
import { HonorInput } from '@/components/honors/HonorInput';
import { HonorApplicationPrintDialog } from '@/components/honors/HonorApplicationPrintDialog';
import type {
  HonorCampaign,
  HonorApplication,
  FormFieldConfig,
  ApplicationAttachment,
  StudentHonor,
} from '@/types/honor-campaign';
import { APPROVAL_STEP_NAMES } from '@/types/honor-campaign';

// ==================== 配置 ====================

const STATUS_NAMES: Record<string, string> = {
  pending: '审批中',
  approved: '已通过',
  rejected: '未通过',
  withdrawn: '已撤回',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  withdrawn: 'bg-gray-100 text-gray-700',
};

// ==================== 主组件 ====================

export default function ParentHonorApplicationPage() {
  const router = useRouter();
  const { user } = useAuth();
  const filePreview = useFilePreview();

  // === 数据状态 ===
  const [campaigns, setCampaigns] = useState<HonorCampaign[]>([]);
  const [myApplications, setMyApplications] = useState<HonorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // === Tab 状态 ===
  const [activeTab, setActiveTab] = useState('available');

  // === 对话框状态 ===
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<HonorCampaign | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<HonorApplication | null>(null);

  // === 表单状态 ===
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [attachments, setAttachments] = useState<ApplicationAttachment[]>([]);
  const [existingHonors, setExistingHonors] = useState<StudentHonor[]>([]);
  const [studentHonors, setStudentHonors] = useState<StudentHonor[]>([]);
  const [children, setChildren] = useState<Array<{ id: string; name: string; classId: string; className: string }>>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');

  // ==================== 数据加载 ====================

  // 加载子女信息 - 优先使用 AuthContext 中的数据
  const loadChildren = useCallback(async () => {
    // 如果 AuthContext 中已有子女信息，直接使用
    if (user?.children && user.children.length > 0) {
      setChildren(user.children);
      setSelectedChildId(user.children[0].id);
      return;
    }
    
    // 否则从 API 获取
    try {
      const res = await fetch('/api/parent/children', { credentials: 'include' });
      const result = await res.json();
      
      if (result.success) {
        setChildren(result.data || []);
        if (result.data?.length > 0) {
          setSelectedChildId(result.data[0].id);
        }
      }
    } catch (err) {
      console.error('加载子女信息失败:', err);
    }
  }, [user?.children]);

  // 加载学生已有荣誉
  const loadStudentHonors = useCallback(async (studentId: string): Promise<StudentHonor[]> => {
    try {
      const res = await fetch(`/api/student-honors?studentId=${studentId}&pageSize=100`, { credentials: 'include' });
      const result = await res.json();
      
      if (result.success && result.data?.data) {
        // 转换为 StudentHonor 格式
        const honors: StudentHonor[] = result.data.data.map((h: any) => ({
          title: h.title,
          level: h.level || '校级',
          category: h.category || '其他',
          issuer: h.issuer || '',
          date: h.date || '',
          certificateNo: h.certificateNo || '',
          schoolYear: h.schoolYear || '',
        }));
        setStudentHonors(honors);
        return honors;
      }
    } catch (err) {
      console.error('加载学生荣誉失败:', err);
    }
    setStudentHonors([]);
    return [];
  }, []);

  // 加载可申报的评选活动
  const loadCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/honor-campaigns?status=published', { credentials: 'include' });
      const result = await res.json();
      
      if (result.success) {
        setCampaigns(result.data.data || []);
      }
    } catch (err) {
      console.error('加载评选活动失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 加载我的申报记录
  const loadMyApplications = useCallback(async () => {
    try {
      const res = await fetch('/api/honor-applications?applicantId=me', { credentials: 'include' });
      const result = await res.json();
      
      if (result.success) {
        setMyApplications(result.data.data || []);
      }
    } catch (err) {
      console.error('加载申报记录失败:', err);
    }
  }, []);

  useEffect(() => {
    loadChildren();
  }, [loadChildren]);

  useEffect(() => {
    if (children.length > 0) {
      loadCampaigns();
      loadMyApplications();
    }
  }, [children, loadCampaigns, loadMyApplications]);

  // ==================== 操作处理 ====================

  // 打开申报对话框
  const handleApply = async (campaign: HonorCampaign) => {
    setSelectedCampaign(campaign);
    // 初始化表单数据
    const initialData: Record<string, string> = {};
    campaign.formConfig?.fields.forEach(field => {
      initialData[field.field] = field.defaultValue || '';
    });
    setFormData(initialData);
    setAttachments([]);
    
    // 加载选中孩子的已有荣誉
    if (selectedChildId) {
      const honors = await loadStudentHonors(selectedChildId);
      // 初始化 existingHonors 为学生已有荣誉的副本
      setExistingHonors(honors.length > 0 ? [...honors] : []);
    } else {
      setExistingHonors([]);
    }
    
    setApplyDialogOpen(true);
  };

  // 提交申报
  const handleSubmit = async () => {
    if (!selectedCampaign || !selectedChildId) {
      toast.error('请选择要申报的孩子');
      return;
    }

    // 验证必填字段
    const requiredFields = selectedCampaign.formConfig?.fields.filter(f => f.required) || [];
    for (const field of requiredFields) {
      if (!formData[field.field]?.trim()) {
        toast.error(`请填写${field.label}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/honor-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          campaignId: selectedCampaign.id,
          studentId: selectedChildId,
          formData,
          attachments,
          existingHonors,
        }),
      });

      const result = await res.json();

      if (result.success) {
        toast.success('申报提交成功');
        setApplyDialogOpen(false);
        loadMyApplications();
        setActiveTab('my');
      } else {
        toast.error(result.message || '提交失败');
      }
    } catch (err) {
      console.error('提交申报失败:', err);
      toast.error('提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 查看申报详情
  const handleViewDetail = async (application: HonorApplication) => {
    try {
      const res = await fetch(`/api/honor-applications/${application.id}`, {
        credentials: 'include',
      });
      const result = await res.json();

      if (result.success) {
        setSelectedApplication(result.data);
        setDetailDialogOpen(true);
      }
    } catch (err) {
      console.error('获取申报详情失败:', err);
    }
  };

  // 撤回申报
  const handleWithdraw = async (application: HonorApplication) => {
    if (!confirm('确定要撤回此申报吗？')) return;

    try {
      const res = await fetch(`/api/honor-applications/${application.id}/withdraw`, {
        method: 'POST',
        credentials: 'include',
      });

      const result = await res.json();

      if (result.success) {
        toast.success('撤回成功');
        loadMyApplications();
      } else {
        toast.error(result.message || '撤回失败');
      }
    } catch (err) {
      console.error('撤回失败:', err);
      toast.error('撤回失败');
    }
  };

  // 打印申报表
  const handlePrint = async (application: HonorApplication) => {
    // 先获取完整的申报详情（包含campaign.formConfig）
    try {
      const res = await fetch(`/api/honor-applications/${application.id}`, {
        credentials: 'include',
      });
      const result = await res.json();

      if (result.success) {
        setSelectedApplication(result.data);
        setPrintDialogOpen(true);
      } else {
        // 如果获取失败，使用列表数据
        setSelectedApplication(application);
        setPrintDialogOpen(true);
      }
    } catch (err) {
      console.error('获取申报详情失败:', err);
      // 出错时使用列表数据
      setSelectedApplication(application);
      setPrintDialogOpen(true);
    }
  };

  // ==================== 渲染 ====================

  if (children.length === 0) {
    return (
      <div className="p-6 lg:p-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
            <p className="text-gray-600">您还没有绑定孩子信息</p>
            <p className="text-sm text-gray-400 mt-2">请联系班主任添加家长信息</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/parent')}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">学生荣誉申报</h1>
          <p className="text-gray-500 mt-1">为孩子申报学校荣誉评选</p>
        </div>
      </div>

      {/* 子女选择 */}
      {children.length > 1 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Label>选择孩子：</Label>
              <div className="flex gap-2">
                {children.map(child => (
                  <Button
                    key={child.id}
                    variant={selectedChildId === child.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedChildId(child.id)}
                  >
                    {child.name}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 切换 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-card border">
          <TabsTrigger value="available" className="gap-2">
            <Trophy className="h-4 w-4" />
            可申报
          </TabsTrigger>
          <TabsTrigger value="my" className="gap-2">
            <FileText className="h-4 w-4" />
            我的申报
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: 可申报列表 */}
        <TabsContent value="available" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : campaigns.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Trophy className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-400">暂无可申报的评选活动</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {campaigns.map((campaign) => {
                // 检查是否已申报
                const existingApplication = myApplications.find(
                  app => app.campaignId === campaign.id && app.studentId === selectedChildId
                );

                return (
                  <Card key={campaign.id} className="border-0 shadow-md">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{campaign.title}</CardTitle>
                      <CardDescription>{campaign.honorType}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        截止日期：{campaign.endDate}
                      </div>
                      
                      {campaign.requirements && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {campaign.requirements}
                        </p>
                      )}

                      <div className="flex items-center gap-2 pt-2">
                        {existingApplication ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleViewDetail(existingApplication)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            查看申报
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => handleApply(campaign)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            立即申报
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: 我的申报 */}
        <TabsContent value="my" className="space-y-4">
          {myApplications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-400">暂无申报记录</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {myApplications.map((application) => (
                <Card key={application.id} className="border-0 shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{application.campaign?.title}</h3>
                          <Badge className={STATUS_COLORS[application.status]}>
                            {STATUS_NAMES[application.status]}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {application.studentName} · {application.className}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          提交时间：{application.submittedAt ? new Date(application.submittedAt).toLocaleString() : '-'}
                        </p>

                        {/* 审批进度 */}
                        {application.status === 'pending' && application.currentStep && (
                          <div className="mt-3 flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-blue-500" />
                            <span className="text-blue-600">
                              当前步骤：{APPROVAL_STEP_NAMES[application.currentStep]}
                            </span>
                          </div>
                        )}

                        {/* 审批结果 */}
                        {application.status === 'approved' && (
                          <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span>恭喜！申报已通过审批</span>
                          </div>
                        )}

                        {application.status === 'rejected' && (
                          <div className="mt-3 flex items-center gap-2 text-sm text-red-600">
                            <XCircle className="h-4 w-4" />
                            <span>申报未通过审批</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetail(application)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          详情
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePrint(application)}
                        >
                          <Printer className="h-4 w-4 mr-1" />
                          打印预览
                        </Button>
                        {application.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleWithdraw(application)}
                          >
                            撤回
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* 申报对话框 */}
      <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedCampaign?.title}</DialogTitle>
            <DialogDescription>
              {selectedCampaign?.honorType} · 请认真填写以下申报内容
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* 申报须知 */}
            {selectedCampaign?.requirements && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                <strong>申报条件：</strong>
                <p className="mt-1">{selectedCampaign.requirements}</p>
              </div>
            )}

            {/* 选择孩子 */}
            {children.length > 1 && (
              <div className="grid gap-2">
                <Label>选择孩子 *</Label>
                <Select
                  value={selectedChildId}
                  onValueChange={async (value) => {
                    setSelectedChildId(value);
                    // 切换孩子时重新加载荣誉
                    const honors = await loadStudentHonors(value);
                    setExistingHonors(honors.length > 0 ? [...honors] : []);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {children.map(child => (
                      <SelectItem key={child.id} value={child.id}>
                        {child.name} ({child.className})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 表单字段 */}
            {selectedCampaign?.formConfig?.fields.map((field) => (
              <div key={field.field} className="grid gap-2">
                <Label className="flex items-center gap-1">
                  {field.label}
                  {field.required && <span className="text-red-500">*</span>}
                </Label>
                {field.type === 'textarea' ? (
                  <Textarea
                    placeholder={field.placeholder}
                    value={formData[field.field] || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      [field.field]: e.target.value,
                    }))}
                    maxLength={field.maxLength}
                    rows={4}
                  />
                ) : (
                  <Input
                    type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
                    placeholder={field.placeholder}
                    value={formData[field.field] || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      [field.field]: e.target.value,
                    }))}
                    maxLength={field.maxLength}
                  />
                )}
                {field.hint && (
                  <p className="text-xs text-gray-500">{field.hint}</p>
                )}
              </div>
            ))}

            {/* 已获奖荣誉填写 */}
            <div className="border-t pt-4 mt-4">
              <HonorInput
                value={existingHonors}
                onChange={setExistingHonors}
                schoolYear={selectedCampaign?.schoolYear ?? undefined}
              />
              {studentHonors.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  已自动加载该学生在本学年的 {studentHonors.length} 条荣誉记录
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setApplyDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              提交申报
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 申报详情对话框 */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>申报详情</DialogTitle>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-4">
              {/* 基本信息 */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">学生姓名：</span>
                  <span className="font-medium">{selectedApplication.studentName}</span>
                </div>
                <div>
                  <span className="text-gray-500">申报荣誉：</span>
                  <span>{selectedApplication.campaign?.honorType}</span>
                </div>
                <div>
                  <span className="text-gray-500">申报状态：</span>
                  <Badge className={STATUS_COLORS[selectedApplication.status]}>
                    {STATUS_NAMES[selectedApplication.status]}
                  </Badge>
                </div>
                <div>
                  <span className="text-gray-500">提交时间：</span>
                  <span>{selectedApplication.submittedAt ? new Date(selectedApplication.submittedAt).toLocaleString() : '-'}</span>
                </div>
              </div>

              {/* 表单内容 */}
              <div className="space-y-3 pt-4 border-t">
                {Object.entries(selectedApplication.formData).map(([key, value]) => (
                  <div key={key}>
                    <Label className="text-gray-500">{key}</Label>
                    <p className="mt-1 text-sm whitespace-pre-wrap bg-muted/50 rounded-lg p-3">
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              {/* 已获奖荣誉 */}
              {selectedApplication.existingHonors && selectedApplication.existingHonors.length > 0 && (
                <div className="pt-4 border-t">
                  <Label className="text-gray-500 mb-3 block">已获奖荣誉</Label>
                  <div className="space-y-2">
                    {selectedApplication.existingHonors.map((honor, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Trophy className="h-4 w-4 text-amber-500" />
                        <div className="flex-1">
                          <span className="font-medium text-sm">{honor.title}</span>
                          <span className="text-xs text-gray-400 ml-2">{honor.level} · {honor.category}</span>
                        </div>
                        <span className="text-xs text-gray-400">{honor.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 审批流程 */}
              {selectedApplication.approvalComments.length > 0 && (
                <div className="pt-4 border-t">
                  <Label className="text-gray-500 mb-3 block">审批记录</Label>
                  <div className="space-y-2">
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
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{APPROVAL_STEP_NAMES[comment.step]}</span>
                            <span className="text-xs text-gray-400">{comment.approverName}</span>
                          </div>
                          {comment.comment && (
                            <p className="text-sm text-gray-600 mt-1">{comment.comment}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              关闭
            </Button>
            <Button onClick={() => handlePrint(selectedApplication!)}>
              <Printer className="h-4 w-4 mr-2" />
              打印预览
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 文件预览对话框 */}
      <FilePreviewDialog
        open={filePreview.state.isOpen}
        onOpenChange={(open) => { if (!open) filePreview.close(); }}
        resource={filePreview.state.resource}
        viewerType={filePreview.state.viewerType}
        onViewerTypeChange={filePreview.setViewerType}
      />

      {/* 打印预览对话框 */}
      <HonorApplicationPrintDialog
        open={printDialogOpen}
        onOpenChange={setPrintDialogOpen}
        application={selectedApplication}
      />
    </div>
  );
}
