/**
 * 门禁申请审批组件
 * 处理家长/访客的通行申请
 */

'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useAccessApplications } from '@/hooks/useAccessControl';
import { Search, CheckCircle, XCircle, Eye } from 'lucide-react';
import type { AccessApplication, ApplicationStatus } from '@/repositories/access-control.repository';
import { toast } from 'sonner';

const statusLabels: Record<ApplicationStatus, string> = {
  pending: '待审批',
  approved: '已通过',
  rejected: '已驳回',
  cancelled: '已取消',
  expired: '已过期',
};

const statusColors: Record<ApplicationStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
  expired: 'bg-gray-100 text-gray-800',
};

const typeLabels = { parent: '家长', visitor: '访客' };
const typeColors = { parent: 'bg-amber-100 text-amber-800', visitor: 'bg-purple-100 text-purple-800' };

export function AccessApplicationPanel() {
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | undefined>(undefined);
  const [applicantType, setApplicantType] = useState<'parent' | 'visitor' | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, total, loading, approveApplication, rejectApplication } = useAccessApplications({
    status: statusFilter,
    applicantType,
    search: search || undefined,
    page,
    pageSize: 15,
  });

  const [selectedApp, setSelectedApp] = useState<AccessApplication | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectId, setRejectId] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleApprove = useCallback(async (id: string) => {
    setProcessing(true);
    try {
      await approveApplication(id);
      toast.success('审批通过');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败');
    } finally {
      setProcessing(false);
    }
  }, [approveApplication]);

  const handleReject = useCallback(async () => {
    if (!rejectReason.trim()) {
      toast.error('请输入驳回原因');
      return;
    }
    setProcessing(true);
    try {
      await rejectApplication(rejectId, rejectReason);
      toast.success('已驳回');
      setShowRejectDialog(false);
      setRejectReason('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败');
    } finally {
      setProcessing(false);
    }
  }, [rejectId, rejectReason, rejectApplication]);

  const totalPages = Math.ceil(total / 15);

  return (
    <div className="space-y-4">
      {/* 工具栏 */}
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={statusFilter || 'all'} onValueChange={(v) => { setStatusFilter(v === 'all' ? undefined : v as ApplicationStatus); setPage(1); }}>
          <SelectTrigger className="w-28"><SelectValue placeholder="审批状态" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            <SelectItem value="pending">待审批</SelectItem>
            <SelectItem value="approved">已通过</SelectItem>
            <SelectItem value="rejected">已驳回</SelectItem>
          </SelectContent>
        </Select>
        <Select value={applicantType || 'all'} onValueChange={(v) => { setApplicantType(v === 'all' ? undefined : v as 'parent' | 'visitor'); setPage(1); }}>
          <SelectTrigger className="w-28"><SelectValue placeholder="申请类型" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            <SelectItem value="parent">家长</SelectItem>
            <SelectItem value="visitor">访客</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="搜索姓名、被访人..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>

      {/* 申请表格 */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">类型</TableHead>
                <TableHead>申请人</TableHead>
                <TableHead>来访事由</TableHead>
                <TableHead>被访人</TableHead>
                <TableHead>来访日期</TableHead>
                <TableHead>时段</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="w-28">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">加载中...</TableCell></TableRow>
              ) : data.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">暂无申请</TableCell></TableRow>
              ) : data.map((app) => (
                <TableRow key={app.id}>
                  <TableCell>
                    <Badge variant="secondary" className={typeColors[app.applicantType]}>
                      {typeLabels[app.applicantType]}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{app.applicantName}</TableCell>
                  <TableCell className="max-w-[160px] truncate">{app.purpose}</TableCell>
                  <TableCell className="text-muted-foreground">{app.targetPerson || '-'}</TableCell>
                  <TableCell className="text-muted-foreground">{app.expectedDate}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {app.expectedTimeStart && app.expectedTimeEnd
                      ? `${app.expectedTimeStart}-${app.expectedTimeEnd}` : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={statusColors[app.status]}>
                      {statusLabels[app.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedApp(app)} title="查看详情">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {app.status === 'pending' && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => handleApprove(app.id)} title="通过" disabled={processing}>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => { setRejectId(app.id); setShowRejectDialog(true); }} title="驳回" disabled={processing}>
                            <XCircle className="h-4 w-4 text-red-600" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>共 {total} 条</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>上一页</Button>
            <span className="py-1">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>下一页</Button>
          </div>
        </div>
      )}

      {/* 详情弹窗 */}
      <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>申请详情</DialogTitle>
          </DialogHeader>
          {selectedApp && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">申请人：</span>{selectedApp.applicantName}</div>
                <div><span className="text-muted-foreground">类型：</span>{typeLabels[selectedApp.applicantType]}</div>
                <div><span className="text-muted-foreground">联系电话：</span>{selectedApp.applicantPhone || '-'}</div>
                <div><span className="text-muted-foreground">身份证：</span>{selectedApp.idCard || '-'}</div>
                <div><span className="text-muted-foreground">来访事由：</span>{selectedApp.purpose}</div>
                <div><span className="text-muted-foreground">被访人：</span>{selectedApp.targetPerson || '-'}</div>
                <div><span className="text-muted-foreground">被访部门：</span>{selectedApp.targetDepartment || '-'}</div>
                {selectedApp.relation && <div><span className="text-muted-foreground">关系：</span>{selectedApp.relation}</div>}
                {selectedApp.studentName && <div><span className="text-muted-foreground">关联学生：</span>{selectedApp.studentName}</div>}
                <div><span className="text-muted-foreground">来访日期：</span>{selectedApp.expectedDate}</div>
                <div><span className="text-muted-foreground">时段：</span>{selectedApp.expectedTimeStart}-{selectedApp.expectedTimeEnd}</div>
                <div><span className="text-muted-foreground">状态：</span>{statusLabels[selectedApp.status]}</div>
                {selectedApp.approverName && <div><span className="text-muted-foreground">审批人：</span>{selectedApp.approverName}</div>}
                {selectedApp.rejectionReason && <div className="col-span-2"><span className="text-muted-foreground">驳回原因：</span>{selectedApp.rejectionReason}</div>}
                {selectedApp.remark && <div className="col-span-2"><span className="text-muted-foreground">备注：</span>{selectedApp.remark}</div>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 驳回弹窗 */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>驳回申请</DialogTitle>
          </DialogHeader>
          <Textarea placeholder="请输入驳回原因..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>取消</Button>
            <Button variant="destructive" onClick={handleReject} disabled={processing}>确认驳回</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
