'use client';

/**
 * 班主任 - 荣誉申报审批组件
 *
 * 功能：
 * - 查看本班学生的荣誉申报
 * - 审批/退回申报
 */

import React, { useState, useEffect, useCallback } from 'react';
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
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type {
  HonorApplication,
  ApprovalComment,
} from '@/types/honor-campaign';
import { APPROVAL_STEP_NAMES } from '@/types/honor-campaign';

// ==================== 主组件 ====================

export function HonorApprovalTab() {
  const { user } = useAuth();

  // === 数据状态 ===
  const [applications, setApplications] = useState<HonorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // === 对话框状态 ===
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<HonorApplication | null>(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [approvalResult, setApprovalResult] = useState<'approved' | 'rejected' | 'returned'>('approved');
  const [approvalComment, setApprovalComment] = useState('');

  // ==================== 数据加载 ====================

  const loadApplications = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      // 获取班主任班级的待审批申报
      const res = await fetch('/api/honor-applications?currentStep=head_teacher&status=pending', {
        credentials: 'include',
      });
      const result = await res.json();

      if (result.success) {
        // 过滤出本班的申报（后端应该已经根据用户身份过滤了）
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
    <div className="space-y-4">
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
                <p className="text-sm text-white/80">本班学生</p>
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
            <p className="text-sm text-muted-foreground mt-2">家长提交申报后，您将在此处收到通知</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>学生</TableHead>
                <TableHead>荣誉类型</TableHead>
                <TableHead>评选活动</TableHead>
                <TableHead>申报时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((app) => (
                <TableRow key={app.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{app.studentName}</p>
                      <p className="text-xs text-muted-foreground">{app.className}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{app.campaign?.honorType || '-'}</Badge>
                  </TableCell>
                  <TableCell>{app.campaign?.title || '-'}</TableCell>
                  <TableCell>
                    {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => { setSelectedApplication(app); setDetailDialogOpen(true); }}>
                        <Eye className="h-4 w-4 mr-1" />
                        查看
                      </Button>
                      <Button size="sm" onClick={() => handleOpenApproval(app)}>
                        审批
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* 申报详情对话框 */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>申报详情</DialogTitle>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">学生姓名</Label>
                  <p className="font-medium">{selectedApplication.studentName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">班级</Label>
                  <p className="font-medium">{selectedApplication.className}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">荣誉类型</Label>
                  <p className="font-medium">{selectedApplication.campaign?.honorType}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">申报时间</Label>
                  <p className="font-medium">
                    {selectedApplication.submittedAt
                      ? new Date(selectedApplication.submittedAt).toLocaleString()
                      : '-'}
                  </p>
                </div>
              </div>

              {/* 申报内容 */}
              {selectedApplication.formData && Object.keys(selectedApplication.formData).length > 0 && (
                <div>
                  <Label className="text-muted-foreground">申报内容</Label>
                  <div className="mt-2 space-y-2">
                    {Object.entries(selectedApplication.formData).map(([key, value]) => (
                      <div key={key} className="bg-muted/50 p-3 rounded-lg">
                        <p className="text-sm font-medium">{key}</p>
                        <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{value as string}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 附件 */}
              {selectedApplication.attachments && selectedApplication.attachments.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">附件</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedApplication.attachments.map((file, index) => (
                      <a
                        key={index}
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-muted rounded-lg text-sm hover:bg-muted/80 transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {file.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>关闭</Button>
            <Button onClick={() => {
              setDetailDialogOpen(false);
              if (selectedApplication) {
                handleOpenApproval(selectedApplication);
              }
            }}>
              审批
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
    </div>
  );
}
