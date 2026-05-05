'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Wrench,
  Plus,
  Search,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  User,
  AlertTriangle,
  Loader2,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import { useRepairs, useRepairStatistics, useRepairActions } from '@/hooks/useRepairs';
import type { RepairRecord, RepairStatus, RepairUrgency } from '@/types/general';
import { toast } from 'sonner';

const STATUS_CONFIG: Record<RepairStatus, { label: string; className: string }> = {
  pending: { label: '待处理', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  approved: { label: '已批准', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  in_progress: { label: '处理中', className: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  completed: { label: '已完成', className: 'bg-green-100 text-green-700 border-green-200' },
  rejected: { label: '已拒绝', className: 'bg-red-100 text-red-700 border-red-200' },
};

const URGENCY_CONFIG: Record<RepairUrgency, { label: string; className: string }> = {
  urgent: { label: '紧急', className: 'bg-red-500 text-white' },
  high: { label: '高', className: 'bg-orange-500 text-white' },
  normal: { label: '中', className: 'bg-blue-500 text-white' },
  low: { label: '低', className: 'bg-gray-500 text-white' },
};

export default function RepairsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');

  const { repairs, loading, refetch } = useRepairs();
  const { statistics } = useRepairStatistics();
  const { updateStatus, deleteRepair } = useRepairActions();

  const [detailDialog, setDetailDialog] = useState<{ open: boolean; repair: RepairRecord | null }>({ open: false, repair: null });
  const [processDialog, setProcessDialog] = useState<{ open: boolean; repair: RepairRecord | null }>({ open: false, repair: null });
  const [processForm, setProcessForm] = useState({
    status: 'in_progress' as RepairStatus,
    assigneeName: '',
    estimatedCost: '',
    scheduledDate: '',
    note: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const filteredRepairs = useMemo(() => {
    return repairs.filter(repair => {
      const matchesSearch = repair.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           repair.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           repair.applicant_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || repair.status === statusFilter;
      const matchesUrgency = urgencyFilter === 'all' || repair.urgency === urgencyFilter;
      return matchesSearch && matchesStatus && matchesUrgency;
    });
  }, [repairs, searchTerm, statusFilter, urgencyFilter]);

  const handleProcess = async () => {
    if (!processDialog.repair) return;
    setSubmitting(true);
    try {
      await updateStatus(processDialog.repair.id, processForm.status, {
        assigneeName: processForm.assigneeName || undefined,
        estimatedCost: processForm.estimatedCost ? parseFloat(processForm.estimatedCost) : undefined,
        scheduledDate: processForm.scheduledDate || undefined,
        note: processForm.note || undefined,
      });
      toast.success('处理成功');
      setProcessDialog({ open: false, repair: null });
      refetch();
    } catch (err) {
      toast.error('处理失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条报修记录吗？')) return;
    try {
      await deleteRepair(id);
      toast.success('删除成功');
      refetch();
    } catch (err) {
      toast.error('删除失败');
    }
  };

  const getStatusBadge = (status: RepairStatus) => {
    const config = STATUS_CONFIG[status];
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getUrgencyBadge = (urgency: RepairUrgency) => {
    const config = URGENCY_CONFIG[urgency];
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">报修管理</h1>
          <p className="text-muted-foreground mt-1">设施设备维修申请与处理</p>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">待处理</p>
                <p className="text-2xl font-bold text-yellow-600">{statistics?.pending || 0}</p>
              </div>
              <div className="p-2 rounded-lg bg-yellow-100">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">处理中</p>
                <p className="text-2xl font-bold text-cyan-600">{statistics?.inProgress || 0}</p>
              </div>
              <div className="p-2 rounded-lg bg-cyan-100">
                <Wrench className="h-5 w-5 text-cyan-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">本月完成</p>
                <p className="text-2xl font-bold text-green-600">{statistics?.monthCompleted || 0}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">平均响应</p>
                <p className="text-2xl font-bold">{statistics?.avgResponseTime || 0}h</p>
              </div>
              <div className="p-2 rounded-lg bg-muted">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和筛选 */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索报修物品、位置或申请人..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="状态筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="pending">待处理</SelectItem>
                <SelectItem value="approved">已批准</SelectItem>
                <SelectItem value="in_progress">处理中</SelectItem>
                <SelectItem value="completed">已完成</SelectItem>
                <SelectItem value="rejected">已拒绝</SelectItem>
              </SelectContent>
            </Select>
            <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="紧急程度" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部程度</SelectItem>
                <SelectItem value="urgent">紧急</SelectItem>
                <SelectItem value="high">高</SelectItem>
                <SelectItem value="normal">中</SelectItem>
                <SelectItem value="low">低</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 报修列表 */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredRepairs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mb-4" />
              <p>暂无报修记录</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>报修物品</TableHead>
                  <TableHead>位置</TableHead>
                  <TableHead>紧急程度</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>申请人</TableHead>
                  <TableHead>提交时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRepairs.map((repair) => (
                  <TableRow key={repair.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div>
                        <p className="font-medium">{repair.item}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{repair.description}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {repair.location}
                      </div>
                    </TableCell>
                    <TableCell>{getUrgencyBadge(repair.urgency)}</TableCell>
                    <TableCell>{getStatusBadge(repair.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-muted-foreground" />
                        {repair.applicant_name}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(repair.created_at).toLocaleDateString('zh-CN')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDetailDialog({ open: true, repair })}
                        >
                          详情
                        </Button>
                        {repair.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setProcessForm({
                                status: 'in_progress',
                                assigneeName: '',
                                estimatedCost: '',
                                scheduledDate: '',
                                note: '',
                              });
                              setProcessDialog({ open: true, repair });
                            }}
                          >
                            处理
                          </Button>
                        )}
                        {(repair.status === 'in_progress' || repair.status === 'approved') && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setProcessForm({
                                status: 'completed',
                                assigneeName: repair.assignee_name || '',
                                estimatedCost: repair.estimated_cost?.toString() || '',
                                scheduledDate: repair.scheduled_date || '',
                                note: '',
                              });
                              setProcessDialog({ open: true, repair });
                            }}
                          >
                            完成
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 详情弹窗 */}
      <Dialog open={detailDialog.open} onOpenChange={(open) => setDetailDialog({ open, repair: null })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>报修详情</DialogTitle>
          </DialogHeader>
          {detailDialog.repair && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">报修物品</Label>
                  <p className="font-medium">{detailDialog.repair.item}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">位置</Label>
                  <p className="font-medium">{detailDialog.repair.location}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">紧急程度</Label>
                  <div className="mt-1">{getUrgencyBadge(detailDialog.repair.urgency)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">状态</Label>
                  <div className="mt-1">{getStatusBadge(detailDialog.repair.status)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">申请人</Label>
                  <p className="font-medium">{detailDialog.repair.applicant_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">提交时间</Label>
                  <p className="font-medium">{new Date(detailDialog.repair.created_at).toLocaleString('zh-CN')}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">问题描述</Label>
                <p className="mt-1">{detailDialog.repair.description}</p>
              </div>
              {detailDialog.repair.assignee_name && (
                <div>
                  <Label className="text-muted-foreground">处理人</Label>
                  <p className="font-medium">{detailDialog.repair.assignee_name}</p>
                </div>
              )}
              {detailDialog.repair.completed_at && (
                <div>
                  <Label className="text-muted-foreground">完成时间</Label>
                  <p className="font-medium">{new Date(detailDialog.repair.completed_at).toLocaleString('zh-CN')}</p>
                </div>
              )}
              {detailDialog.repair.note && (
                <div>
                  <Label className="text-muted-foreground">备注</Label>
                  <p className="mt-1">{detailDialog.repair.note}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 处理弹窗 */}
      <Dialog open={processDialog.open} onOpenChange={(open) => setProcessDialog({ open, repair: null })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>处理报修</DialogTitle>
            <DialogDescription>
              {processDialog.repair?.item} - {processDialog.repair?.location}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>状态</Label>
              <Select value={processForm.status} onValueChange={(v) => setProcessForm({ ...processForm, status: v as RepairStatus })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">已批准</SelectItem>
                  <SelectItem value="in_progress">处理中</SelectItem>
                  <SelectItem value="completed">已完成</SelectItem>
                  <SelectItem value="rejected">已拒绝</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>处理人</Label>
              <Input
                placeholder="指派处理人"
                value={processForm.assigneeName}
                onChange={(e) => setProcessForm({ ...processForm, assigneeName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>预估费用（元）</Label>
              <Input
                type="number"
                placeholder="预估维修费用"
                value={processForm.estimatedCost}
                onChange={(e) => setProcessForm({ ...processForm, estimatedCost: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>备注</Label>
              <Textarea
                placeholder="处理备注..."
                value={processForm.note}
                onChange={(e) => setProcessForm({ ...processForm, note: e.target.value })}
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setProcessDialog({ open: false, repair: null })}>
                取消
              </Button>
              <Button className="flex-1" onClick={handleProcess} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                确认
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
