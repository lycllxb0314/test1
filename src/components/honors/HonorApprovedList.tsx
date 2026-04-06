'use client';

/**
 * 已审批申报列表组件
 *
 * 功能：
 * - 展示已审批的申报记录
 * - 支持按审批结果筛选
 * - 支持查看申报详情
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import {
  CheckCircle,
  XCircle,
  Eye,
  Loader2,
  Search,
  FileText,
} from 'lucide-react';
import type { HonorApplication } from '@/types/honor-campaign';
import { APPROVAL_STEP_NAMES } from '@/types/honor-campaign';
import { HonorApplicationPrintDialog } from './HonorApplicationPrintDialog';

// ==================== 类型定义 ====================

type ApprovalStatus = 'all' | 'approved' | 'rejected';

type HonorApprovedListProps = {
  /** 是否限制为本班（班主任端使用） */
  classOnly?: boolean;
  /** 班级ID（classOnly 为 true 时需要） */
  classId?: string;
};

// ==================== 状态名称映射 ====================

const STATUS_NAMES: Record<string, string> = {
  pending: '审批中',
  approved: '已通过',
  rejected: '已拒绝',
  withdrawn: '已撤回',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  withdrawn: 'bg-gray-100 text-gray-700',
};

// ==================== 主组件 ====================

export function HonorApprovedList({
  classOnly = false,
  classId,
}: HonorApprovedListProps) {
  // === 数据状态 ===
  const [applications, setApplications] = useState<HonorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // === 筛选状态 ===
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // === 详情弹窗 ===
  const [selectedApplication, setSelectedApplication] = useState<HonorApplication | null>(null);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);

  // ==================== 数据加载 ====================

  const loadApplications = useCallback(async () => {
    setLoading(true);
    try {
      // 构建查询参数
      const params = new URLSearchParams();
      
      // 已审批的申报：不设置 currentStep（因为已审批的 current_step 为空）
      // 只按状态过滤
      if (statusFilter === 'all') {
        // 查询已通过和已拒绝的
        params.append('statuses', 'approved,rejected');
      } else {
        params.append('status', statusFilter);
      }

      // 班主任端：只查询本班数据
      if (classOnly && classId) {
        params.append('classId', classId);
      }

      const res = await fetch(`/api/honor-applications?${params.toString()}`, {
        credentials: 'include',
      });
      const result = await res.json();

      if (result.success) {
        let data = result.data.data || [];
        
        // 客户端搜索过滤
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          data = data.filter((app: HonorApplication) =>
            app.studentName?.toLowerCase().includes(term) ||
            app.className?.toLowerCase().includes(term) ||
            app.campaign?.honorType?.toLowerCase().includes(term)
          );
        }

        setApplications(data);
        setTotal(result.data.total || data.length);
      }
    } catch (err) {
      console.error('加载已审批列表失败:', err);
      toast.error('加载已审批列表失败');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, classOnly, classId, searchTerm]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  // ==================== 统计数据 ====================

  const approvedCount = applications.filter(a => a.status === 'approved').length;
  const rejectedCount = applications.filter(a => a.status === 'rejected').length;

  // ==================== 渲染 ====================

  return (
    <div className="space-y-4">
      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">已审批总数</p>
                <p className="text-3xl font-bold">{total}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">已通过</p>
                <p className="text-3xl font-bold text-green-600">{approvedCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500/60" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950 dark:to-rose-950">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">已拒绝</p>
                <p className="text-3xl font-bold text-red-600">{rejectedCount}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 筛选工具栏 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索学生姓名、班级或荣誉类型..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as ApprovalStatus)}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="审批结果" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            <SelectItem value="approved">已通过</SelectItem>
            <SelectItem value="rejected">已拒绝</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 申报列表 */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : applications.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">暂无已审批的申报记录</p>
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
                <TableHead>审批结果</TableHead>
                <TableHead>最后审批时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((app) => {
                // 获取最后一个审批意见
                const lastComment = app.approvalComments?.[app.approvalComments.length - 1];
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
                    <TableCell>
                      <Badge className={STATUS_COLORS[app.status]}>
                        {STATUS_NAMES[app.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {lastComment?.time ? (
                          <>
                            <p>{new Date(lastComment.time).toLocaleDateString()}</p>
                            <p className="text-xs text-muted-foreground">
                              {lastComment.approverName}（{APPROVAL_STEP_NAMES[lastComment.step]}）
                            </p>
                          </>
                        ) : app.approvedAt ? (
                          <p>{new Date(app.approvedAt).toLocaleDateString()}</p>
                        ) : (
                          '-'
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedApplication(app);
                          setPrintDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        查看详情
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* 详情弹窗 */}
      <HonorApplicationPrintDialog
        open={printDialogOpen}
        onOpenChange={setPrintDialogOpen}
        application={selectedApplication}
      />
    </div>
  );
}
