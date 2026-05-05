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
import { Search, CheckCircle, XCircle, Eye, ChevronLeft, ChevronRight, Clock, User } from 'lucide-react';
import type { AccessApplication, ApplicationStatus } from '@/repositories/access-control.repository';
import { toast } from 'sonner';

const statusLabels: Record<ApplicationStatus, string> = {
  pending: '待审批', approved: '已通过', rejected: '已驳回', cancelled: '已取消', expired: '已过期',
};

const statusStyles: Record<ApplicationStatus, string> = {
  pending: 'bg-amber-500/10 text-amber-700',
  approved: 'bg-emerald-500/10 text-emerald-700',
  rejected: 'bg-red-500/10 text-red-700',
  cancelled: 'bg-muted text-muted-foreground',
  expired: 'bg-muted text-muted-foreground',
};

const typeLabels = { parent: '家长', visitor: '访客' };
const typeStyles = { parent: 'bg-amber-500/10 text-amber-700', visitor: 'bg-violet-500/10 text-violet-700' };

export function AccessApplicationPanel() {
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | undefined>(undefined);
  const [applicantType, setApplicantType] = useState<'parent' | 'visitor' | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const { data, total, loading, approveApplication, rejectApplication } = useAccessApplications({
    status: statusFilter,
    applicantType,
    search: search || undefined,
    page,
    pageSize,
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
      toast.success('审批通过，已自动创建通行权限');
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

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      {/* 工具栏 */}
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={statusFilter || 'all'} onValueChange={(v) => { setStatusFilter(v === 'all' ? undefined : v as ApplicationStatus); setPage(1); }}>
          <SelectTrigger className="w-28"><SelectValue placeholder="审批状态" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="pending">待审批</SelectItem>
            <SelectItem value="approved">已通过</SelectItem>
            <SelectItem value="rejected">已驳回</SelectItem>
          </SelectContent>
        </Select>
        <Select value={applicantType || 'all'} onValueChange={(v) => { setApplicantType(v === 'all' ? undefined : v as 'parent' | 'visitor'); setPage(1); }}>
          <SelectTrigger className="w-28"><SelectValue placeholder="申请类型" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部类型</SelectItem>
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
      <Card className="border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
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
                <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">加载中...</TableCell></TableRow>
              ) : data.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">暂无申请</TableCell></TableRow>
              ) : data.map((app) => (
                <TableRow key={app.id}>
                  <TableCell>
                    <Badge variant="secondary" className={typeStyles[app.applicantType]}>
                      {typeLabels[app.applicantType]}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{app.applicantName}</TableCell>
                  <TableCell className="max-w-[160px] truncate text-muted-foreground">{app.purpose}</TableCell>
                  <TableCell className="text-muted-foreground">{app.targetPerson || '-'}</TableCell>
                  <TableCell className="text-muted-foreground">{app.expectedDate}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {app.expectedTimeStart && app.expectedTimeEnd
                      ? `${app.expectedTimeStart}-${app.expectedTimeEnd}` : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={statusStyles[app.status]}>
                      {statusLabels[app.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-0.5">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setSelectedApp(app)} title="查看详情">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {app.status === 'pending' && (
                        <>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleApprove(app.id)} title="通过" disabled={processing}>
                            <CheckCircle className="h-4 w-4 text-emerald-600" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => { setRejectId(app.id); setShowRejectDialog(true); }} title="驳回" disabled={processing}>
                            <XCircle className="h-4 w-4 text-red-500" />
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
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span>{page} / {totalPages}</span>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
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
            <div className="space-y-4">
              {/* 顶部信息 */}
              <div className="flex items-center gap-3 pb-3 border-b">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">{selectedApp.applicantName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="secondary" className={typeStyles[selectedApp.applicantType]}>
                      {typeLabels[selectedApp.applicantType]}
                    </Badge>
                    <Badge variant="secondary" className={statusStyles[selectedApp.status]}>
                      {statusLabels[selectedApp.status]}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* 详细信息 */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {selectedApp.applicantPhone && (
                  <div><span className="text-muted-foreground">联系电话：</span>{selectedApp.applicantPhone}</div>
                )}
                {selectedApp.idCard && (
                  <div><span className="text-muted-foreground">身份证：</span>{selectedApp.idCard}</div>
                )}
                <div className="col-span-2"><span className="text-muted-foreground">来访事由：</span>{selectedApp.purpose}</div>
                {selectedApp.targetPerson && (
                  <div><span className="text-muted-foreground">被访人：</span>{selectedApp.targetPerson}</div>
                )}
                {selectedApp.targetDepartment && (
                  <div><span className="text-muted-foreground">被访部门：</span>{selectedApp.targetDepartment}</div>
                )}
                {selectedApp.relation && (
                  <div><span className="text-muted-foreground">与被访人关系：</span>{selectedApp.relation}</div>
                )}
                {selectedApp.studentName && (
                  <div><span className="text-muted-foreground">关联学生：</span>{selectedApp.studentName}</div>
                )}
              </div>

              {/* 时间信息 */}
              <div className="flex items-center gap-2 text-sm bg-muted/50 p-3 rounded-lg">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">来访时间：</span>
                <span className="font-medium">{selectedApp.expectedDate}</span>
                {selectedApp.expectedTimeStart && selectedApp.expectedTimeEnd && (
                  <span className="text-muted-foreground">
                    {selectedApp.expectedTimeStart} - {selectedApp.expectedTimeEnd}
                  </span>
                )}
              </div>

              {/* 审批信息 */}
              {selectedApp.approverName && (
                <div className="text-sm">
                  <span className="text-muted-foreground">审批人：</span>{selectedApp.approverName}
                  {selectedApp.approvedAt && (
                    <span className="text-muted-foreground ml-2">
                      {new Date(selectedApp.approvedAt).toLocaleString('zh-CN')}
                    </span>
                  )}
                </div>
              )}
              {selectedApp.rejectionReason && (
                <div className="text-sm bg-red-500/5 p-3 rounded-lg">
                  <span className="text-red-600 font-medium">驳回原因：</span>
                  <span className="text-red-600">{selectedApp.rejectionReason}</span>
                </div>
              )}
              {selectedApp.remark && (
                <div className="text-sm"><span className="text-muted-foreground">备注：</span>{selectedApp.remark}</div>
              )}

              {/* 审批操作 */}
              {selectedApp.status === 'pending' && (
                <div className="flex gap-2 pt-2">
                  <Button className="flex-1" onClick={() => { handleApprove(selectedApp.id); setSelectedApp(null); }} disabled={processing}>
                    <CheckCircle className="h-4 w-4 mr-1" /> 通过
                  </Button>
                  <Button variant="destructive" className="flex-1" onClick={() => { setRejectId(selectedApp.id); setShowRejectDialog(true); setSelectedApp(null); }} disabled={processing}>
                    <XCircle className="h-4 w-4 mr-1" /> 驳回
                  </Button>
                </div>
              )}
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
