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
  User,
  Loader2,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMyRepairs, useRepairActions } from '@/hooks/useRepairs';
import type { RepairRecord, RepairStatus, RepairUrgency, RepairType } from '@/types/general';
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

export default function TeacherRepairPage() {
  const { user } = useAuth();
  const { repairs, loading, refetch } = useMyRepairs(user?.id);
  const { createRepair } = useRepairActions();

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [detailDialog, setDetailDialog] = useState<{ open: boolean; repair: RepairRecord | null }>({ open: false, repair: null });

  const [formData, setFormData] = useState({
    type: 'facility' as RepairType,
    item: '',
    location: '',
    description: '',
    urgency: 'normal' as RepairUrgency,
  });

  const filteredRepairs = useMemo(() => {
    return repairs.filter(repair => {
      return repair.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
             repair.location.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [repairs, searchTerm]);

  const handleSubmit = async () => {
    if (!formData.item || !formData.location || !formData.description) {
      toast.error('请填写完整信息');
      return;
    }

    if (!user?.id || !user?.name) {
      toast.error('请先登录');
      return;
    }

    setSubmitting(true);
    try {
      await createRepair({
        type: formData.type,
        item: formData.item,
        location: formData.location,
        description: formData.description,
        urgency: formData.urgency,
        applicantId: user.id,
        applicantName: user.name,
      });
      toast.success('报修申请提交成功');
      setShowAddDialog(false);
      setFormData({
        type: 'facility',
        item: '',
        location: '',
        description: '',
        urgency: 'normal',
      });
      refetch();
    } catch (err) {
      toast.error('提交失败，请重试');
    } finally {
      setSubmitting(false);
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

  // 统计数据
  const stats = useMemo(() => {
    return {
      total: repairs.length,
      pending: repairs.filter(r => r.status === 'pending').length,
      inProgress: repairs.filter(r => r.status === 'in_progress').length,
      completed: repairs.filter(r => r.status === 'completed').length,
    };
  }, [repairs]);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">报修申请</h1>
          <p className="text-muted-foreground mt-1">提交设施设备报修申请，查看处理进度</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          新建报修
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">我的报修</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="p-2 rounded-lg bg-muted">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">待处理</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="p-2 rounded-lg bg-yellow-100">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">处理中</p>
                <p className="text-2xl font-bold text-cyan-600">{stats.inProgress}</p>
              </div>
              <div className="p-2 rounded-lg bg-cyan-100">
                <Wrench className="h-5 w-5 text-cyan-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">已完成</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 搜索 */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索报修物品或位置..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
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
              <AlertTriangle className="h-12 w-12 mb-4" />
              <p>暂无报修记录</p>
              <Button className="mt-4" onClick={() => setShowAddDialog(true)}>
                提交第一条报修
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>报修物品</TableHead>
                  <TableHead>位置</TableHead>
                  <TableHead>紧急程度</TableHead>
                  <TableHead>状态</TableHead>
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
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(repair.created_at).toLocaleDateString('zh-CN')}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDetailDialog({ open: true, repair })}
                      >
                        详情
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 新建报修弹窗 */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>新建报修申请</DialogTitle>
            <DialogDescription>填写报修信息，提交后将有专人处理</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>报修类型</Label>
              <Select
                value={formData.type}
                onValueChange={(v) => setFormData({ ...formData, type: v as RepairType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="facility">设施</SelectItem>
                  <SelectItem value="asset">设备</SelectItem>
                  <SelectItem value="other">其他</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>报修物品 *</Label>
              <Input
                placeholder="如：投影仪、空调、桌椅等"
                value={formData.item}
                onChange={(e) => setFormData({ ...formData, item: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>所在位置 *</Label>
              <Input
                placeholder="如：教学楼301教室"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>问题描述 *</Label>
              <Textarea
                placeholder="详细描述问题情况..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>紧急程度</Label>
              <Select
                value={formData.urgency}
                onValueChange={(v) => setFormData({ ...formData, urgency: v as RepairUrgency })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">紧急</SelectItem>
                  <SelectItem value="high">高</SelectItem>
                  <SelectItem value="normal">中</SelectItem>
                  <SelectItem value="low">低</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setShowAddDialog(false)}>
                取消
              </Button>
              <Button className="flex-1" onClick={handleSubmit} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                提交申请
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
                  <Label className="text-muted-foreground">提交时间</Label>
                  <p className="font-medium">{new Date(detailDialog.repair.created_at).toLocaleString('zh-CN')}</p>
                </div>
                {detailDialog.repair.assignee_name && (
                  <div>
                    <Label className="text-muted-foreground">处理人</Label>
                    <p className="font-medium">{detailDialog.repair.assignee_name}</p>
                  </div>
                )}
              </div>
              <div>
                <Label className="text-muted-foreground">问题描述</Label>
                <p className="mt-1">{detailDialog.repair.description}</p>
              </div>
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
    </div>
  );
}
