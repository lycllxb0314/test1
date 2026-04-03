'use client';

/**
 * 德育副校长 - 荣誉申报审批页面
 *
 * 功能：
 * - 查看待审批的荣誉申报（德育处审批通过后）
 * - 审批/退回申报
 * - 打印预览申报表
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Eye,
  RotateCcw,
  Users,
  Trophy,
  ChevronLeft,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { HonorApplication } from '@/types/honor-campaign';
import { APPROVAL_STEP_NAMES } from '@/types/honor-campaign';
import { HonorApplicationPrintDialog } from '@/components/honors/HonorApplicationPrintDialog';

// ==================== 主组件 ====================

export default function MoralVicePrincipalHonorApprovalPage() {
  const router = useRouter();
  const { user } = useAuth();

  // === 数据状态 ===
  const [applications, setApplications] = useState<HonorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // === 对话框状态 ===
  const [selectedApplication, setSelectedApplication] = useState<HonorApplication | null>(null);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [approvalResult, setApprovalResult] = useState<'approved' | 'rejected' | 'returned'>('approved');
  const [approvalComment, setApprovalComment] = useState('');

  // ==================== 数据加载 ====================

  const loadApplications = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      // 获取德育副校长待审批的申报
      const res = await fetch('/api/honor-applications?currentStep=moral_vice_principal&status=pending', {
        credentials: 'include',
      });
      const result = await res.json();

      if (result.success) {
        setApplications(result.data.data || []);
      }
    } catch (err) {
      console.error('加载申报列表失败:', err);
      toast.error('加载申报列表失败');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  // ==================== 操作处理 ====================

  const handleOpenApproval = (application: HonorApplication) => {
    setSelectedApplication(application);
    setApprovalResult('approved');
    setApprovalComment('');
    setApprovalDialogOpen(true);
  };

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
        loadApplications();
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
    <div className="p-6 lg:p-8 space-y-6 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">荣誉申报审批</h1>
          <p className="text-gray-500 mt-1">德育处审批通过后，等待您最终审批</p>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-0 shadow-md bg-gradient-to-br from-amber-500 to-orange-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/80">待审批</p>
                <p className="text-3xl font-bold">{applications.length}</p>
              </div>
              <Clock className="h-8 w-8 text-white/60" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-gradient-to-br from-green-500 to-emerald-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/80">涉及学生</p>
                <p className="text-3xl font-bold">{applications.length > 0 ? new Set(applications.map(a => a.studentId)).size : 0}</p>
              </div>
              <Users className="h-8 w-8 text-white/60" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-gradient-to-br from-purple-500 to-pink-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/80">荣誉类型</p>
                <p className="text-xl font-bold">
                  {applications.length > 0 ? [...new Set(applications.map(a => a.campaign?.honorType))].filter(Boolean).join('、') : '-'}
                </p>
              </div>
              <Trophy className="h-8 w-8 text-white/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 申报列表 */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : applications.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">暂无待审批的申报</p>
            <p className="text-sm text-muted-foreground mt-2">德育处审批通过后，您将在此处收到通知</p>
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
                <TableHead>评选活动</TableHead>
                <TableHead>德育处审批</TableHead>
                <TableHead>申报时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((app) => {
                const moralDeptComment = app.approvalComments?.find(c => c.step === 'moral_dept');
                return (
                  <TableRow key={app.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{app.studentName}</p>
                        <p className="text-xs text-muted-foreground">{app.studentNo}</p>
                      </div>
                    </TableCell>
                    <TableCell>{app.className}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{app.campaign?.honorType || '-'}</Badge>
                    </TableCell>
                    <TableCell>{app.campaign?.title || '-'}</TableCell>
                    <TableCell>
                      {moralDeptComment ? (
                        <div className="flex items-center gap-1">
                          {moralDeptComment.result === 'approved' ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-sm">{moralDeptComment.approverName}</span>
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : '-'}
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
