'use client';

/**
 * 班主任端 - 荣誉申报审批页面
 *
 * 功能：
 * - 查看待审批申报
 * - 审批申报（同意/不同意）
 * - 查看班级所有申报记录
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
import { toast } from 'sonner';
import {
  Trophy,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  FileText,
  Loader2,
  ChevronLeft,
  Search,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { HonorApplication } from '@/types/honor-campaign';
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

export default function TeacherHonorApprovalPage() {
  const router = useRouter();
  const { user } = useAuth();

  // === 数据状态 ===
  const [pendingApplications, setPendingApplications] = useState<HonorApplication[]>([]);
  const [allApplications, setAllApplications] = useState<HonorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // === Tab 状态 ===
  const [activeTab, setActiveTab] = useState('pending');

  // === 对话框状态 ===
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<HonorApplication | null>(null);
  const [approveResult, setApproveResult] = useState<'approved' | 'rejected'>('approved');
  const [approveComment, setApproveComment] = useState('');

  // === 搜索状态 ===
  const [searchKeyword, setSearchKeyword] = useState('');

  // ==================== 数据加载 ====================

  // 加载待审批申报
  const loadPendingApplications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/honor-applications?currentStep=head_teacher&status=pending', {
        credentials: 'include',
      });
      const result = await res.json();

      if (result.success) {
        setPendingApplications(result.data.data || []);
      }
    } catch (err) {
      console.error('加载待审批申报失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 加载所有申报记录
  const loadAllApplications = useCallback(async () => {
    try {
      const res = await fetch('/api/honor-applications?role=head_teacher', {
        credentials: 'include',
      });
      const result = await res.json();

      if (result.success) {
        setAllApplications(result.data.data || []);
      }
    } catch (err) {
      console.error('加载申报记录失败:', err);
    }
  }, []);

  useEffect(() => {
    loadPendingApplications();
    loadAllApplications();
  }, [loadPendingApplications, loadAllApplications]);

  // ==================== 操作处理 ====================

  // 查看详情
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

  // 打开审批对话框
  const handleOpenApprove = (application: HonorApplication, result: 'approved' | 'rejected') => {
    setSelectedApplication(application);
    setApproveResult(result);
    setApproveComment(result === 'approved' ? '同意推荐' : '');
    setApproveDialogOpen(true);
  };

  // 提交审批
  const handleSubmitApprove = async () => {
    if (!selectedApplication) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/honor-applications/${selectedApplication.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          result: approveResult,
          comment: approveComment,
        }),
      });

      const result = await res.json();

      if (result.success) {
        toast.success(approveResult === 'approved' ? '审批通过' : '审批拒绝');
        setApproveDialogOpen(false);
        loadPendingApplications();
        loadAllApplications();
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

  // 过滤申报记录
  const filteredApplications = allApplications.filter(app => {
    if (!searchKeyword) return true;
    return (
      (app.studentName || '').includes(searchKeyword) ||
      (app.campaign?.title || '').includes(searchKeyword) ||
      (app.campaign?.honorType || '').includes(searchKeyword)
    );
  });

  // ==================== 渲染 ====================

  return (
    <div className="p-6 lg:p-8 space-y-6 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/teacher')}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">荣誉申报审批</h1>
          <p className="text-gray-500 mt-1">审批班级学生的荣誉申报</p>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">待审批</p>
              <p className="text-2xl font-bold">{pendingApplications.length}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">已通过</p>
              <p className="text-2xl font-bold">
                {allApplications.filter(a => a.status === 'approved').length}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <Trophy className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">总申报</p>
              <p className="text-2xl font-bold">{allApplications.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab 切换 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-card border">
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            待审批
            {pendingApplications.length > 0 && (
              <Badge variant="secondary" className="ml-1">{pendingApplications.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-2">
            <FileText className="h-4 w-4" />
            所有申报
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: 待审批 */}
        <TabsContent value="pending" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : pendingApplications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-gray-400">暂无待审批申报</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingApplications.map((application) => (
                <Card key={application.id} className="border-0 shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{application.studentName}</h3>
                          <span className="text-sm text-gray-500">·</span>
                          <span className="text-sm text-gray-500">{application.className}</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {application.campaign?.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          提交时间：{application.submittedAt ? new Date(application.submittedAt).toLocaleString() : '-'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetail(application)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleOpenApprove(application, 'rejected')}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-green-600 hover:text-green-700"
                          onClick={() => handleOpenApprove(application, 'approved')}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: 所有申报 */}
        <TabsContent value="all" className="space-y-4">
          {/* 搜索框 */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索学生姓名、评选活动..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <Card className="border-0 shadow-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>学生姓名</TableHead>
                  <TableHead>评选活动</TableHead>
                  <TableHead>荣誉类型</TableHead>
                  <TableHead>提交时间</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                      暂无申报记录
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredApplications.map((application) => (
                    <TableRow key={application.id}>
                      <TableCell className="font-medium">{application.studentName}</TableCell>
                      <TableCell>{application.campaign?.title}</TableCell>
                      <TableCell>{application.campaign?.honorType}</TableCell>
                      <TableCell>
                        {application.submittedAt ? new Date(application.submittedAt).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[application.status]}>
                          {STATUS_NAMES[application.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetail(application)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 申报详情对话框 */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>申报详情</DialogTitle>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-4">
              {/* 基本信息 */}
              <Card className="border-0 bg-muted/50">
                <CardContent className="p-4">
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
                      <span>
                        {selectedApplication.submittedAt ? new Date(selectedApplication.submittedAt).toLocaleString() : '-'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 表单内容 */}
              <div className="space-y-3">
                {Object.entries(selectedApplication.formData).map(([key, value]) => (
                  <div key={key}>
                    <Label className="text-gray-500">{key}</Label>
                    <p className="mt-1 text-sm whitespace-pre-wrap bg-muted/50 rounded-lg p-3">
                      {value}
                    </p>
                  </div>
                ))}
              </div>

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
            {selectedApplication && selectedApplication.status === 'pending' && selectedApplication.currentStep === 'head_teacher' && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setDetailDialogOpen(false);
                    handleOpenApprove(selectedApplication, 'rejected');
                  }}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  不同意
                </Button>
                <Button
                  onClick={() => {
                    setDetailDialogOpen(false);
                    handleOpenApprove(selectedApplication, 'approved');
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  同意推荐
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 审批确认对话框 */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {approveResult === 'approved' ? '同意推荐' : '不同意推荐'}
            </DialogTitle>
            <DialogDescription>
              {approveResult === 'approved'
                ? '确认同意推荐该学生申报此项荣誉'
                : '确认不同意推荐该学生申报此项荣誉'}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label>审批意见</Label>
            <Textarea
              placeholder="请输入审批意见（可选）"
              value={approveComment}
              onChange={(e) => setApproveComment(e.target.value)}
              rows={3}
              className="mt-2"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              取消
            </Button>
            <Button
              variant={approveResult === 'approved' ? 'default' : 'destructive'}
              onClick={handleSubmitApprove}
              disabled={submitting}
            >
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              确认
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
