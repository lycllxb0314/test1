'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  AlertTriangle,
  AlertCircle,
  Info,
  Search,
  RefreshCw,
  Loader2,
  User,
  Users,
  CheckCircle,
  Clock,
  Bell,
  BellRing,
  Filter,
  Building2,
  TrendingDown,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { HabitCategory, habitCategoryNames } from '@/types';

// 预警数据类型
interface AlertData {
  id: string;
  alertType: 'student_low_rate' | 'class_decline' | 'class_low_rate';
  severity: 'info' | 'warning' | 'critical';
  studentId?: string;
  studentName?: string;
  studentNumber?: string;
  studentGrade?: number;
  studentClassName?: string;
  classId?: string;
  grade?: number;
  title: string;
  description: string;
  metricValue: number;
  thresholdValue: number;
  category?: string;
  categoryName?: string;
  month: string;
  status: 'active' | 'acknowledged' | 'resolved';
  acknowledgedAt?: string;
  acknowledgerName?: string;
  resolvedAt?: string;
  resolverName?: string;
  resolutionNotes?: string;
  createdAt: string;
}

// 预警类型配置
const alertTypes = [
  { value: 'student_low_rate', label: '学生低达成率', icon: User, color: 'text-red-600' },
  { value: 'class_decline', label: '班级下降', icon: TrendingDown, color: 'text-amber-600' },
  { value: 'class_low_rate', label: '班级低达成率', icon: Building2, color: 'text-orange-600' },
];

// 严重程度配置
const severityConfig = {
  critical: { label: '严重', icon: AlertTriangle, color: 'bg-red-100 text-red-700 border-red-200' },
  warning: { label: '警告', icon: AlertCircle, color: 'bg-amber-100 text-amber-700 border-amber-200' },
  info: { label: '提示', icon: Info, color: 'bg-blue-100 text-blue-700 border-blue-200' },
};

// 当前月份
const currentMonth = new Date().toISOString().slice(0, 7);

// 模拟操作人信息
const currentOperator = {
  id: 'operator-001',
  name: '德育处管理员',
};

export default function HabitAlertsPage() {
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [month, setMonth] = useState(currentMonth);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'acknowledged' | 'resolved'>('active');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // 处理对话框
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<AlertData | null>(null);
  const [actionType, setActionType] = useState<'acknowledge' | 'resolve'>('acknowledge');
  const [actionNotes, setActionNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  // 获取预警列表
  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('month', month);
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      if (severityFilter !== 'all') {
        params.append('severity', severityFilter);
      }

      const response = await fetch(`/api/habit/alerts?${params.toString()}`);
      const result = await response.json();

      if (result.success && result.data) {
        setAlerts(result.data);
      } else {
        setAlerts([]);
      }
    } catch (error) {
      console.error('获取预警列表失败:', error);
      toast.error('获取预警列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [month, statusFilter, severityFilter]);

  // 生成预警
  const handleGenerate = async (force = false) => {
    try {
      setGenerating(true);
      const response = await fetch('/api/habit/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, forceRegenerate: force }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success(result.message);
        fetchAlerts();
      } else {
        throw new Error(result.error || '生成失败');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '生成失败');
    } finally {
      setGenerating(false);
    }
  };

  // 筛选
  const filteredAlerts = useMemo(() => {
    return alerts.filter(a => {
      if (!searchTerm) return true;
      return a.title.includes(searchTerm) || 
             a.studentName?.includes(searchTerm) ||
             a.studentClassName?.includes(searchTerm);
    });
  }, [alerts, searchTerm]);

  // 统计
  const stats = useMemo(() => ({
    total: alerts.length,
    active: alerts.filter(a => a.status === 'active').length,
    acknowledged: alerts.filter(a => a.status === 'acknowledged').length,
    resolved: alerts.filter(a => a.status === 'resolved').length,
    critical: alerts.filter(a => a.severity === 'critical' && a.status === 'active').length,
    warning: alerts.filter(a => a.severity === 'warning' && a.status === 'active').length,
  }), [alerts]);

  // 打开处理对话框
  const handleOpenAction = (alert: AlertData, action: 'acknowledge' | 'resolve') => {
    setSelectedAlert(alert);
    setActionType(action);
    setActionNotes('');
    setShowActionDialog(true);
  };

  // 执行操作
  const handleAction = async () => {
    if (!selectedAlert) return;

    try {
      setProcessing(true);
      const response = await fetch('/api/habit/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedAlert.id,
          action: actionType,
          operatorId: currentOperator.id,
          operatorName: currentOperator.name,
          notes: actionNotes,
        }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success(actionType === 'acknowledge' ? '已确认' : '已解决');
        setShowActionDialog(false);
        fetchAlerts();
      } else {
        throw new Error(result.error || '操作失败');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '操作失败');
    } finally {
      setProcessing(false);
    }
  };

  // 获取严重程度信息
  const getSeverityInfo = (severity: string) => {
    return severityConfig[severity as keyof typeof severityConfig] || severityConfig.info;
  };

  // 获取预警类型信息
  const getTypeInfo = (type: string) => {
    return alertTypes.find(t => t.value === type) || alertTypes[0];
  };

  // 格式化时间
  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-red-50/30 via-white to-orange-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 shadow-lg shadow-red-500/30">
              <BellRing className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">习惯预警管理</h1>
              <p className="text-gray-500">达成率预警 · 及时干预</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => handleGenerate(true)} disabled={generating}>
            {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <AlertTriangle className="h-4 w-4 mr-2" />}
            检测预警
          </Button>
          <Button variant="outline" size="icon" onClick={() => fetchAlerts()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border-0 shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">总预警</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-2 rounded-xl bg-gray-100">
                <Bell className="h-5 w-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-red-500 to-orange-500 text-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-100">待处理</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
              <div className="p-2 rounded-xl bg-white/20">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">已确认</p>
                <p className="text-2xl font-bold text-amber-600">{stats.acknowledged}</p>
              </div>
              <div className="p-2 rounded-xl bg-amber-100">
                <Eye className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">已解决</p>
                <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
              </div>
              <div className="p-2 rounded-xl bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">严重预警</p>
                <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
              </div>
              <div className="p-2 rounded-xl bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 筛选栏 */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索预警标题或学生..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-[160px]"
            />
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | 'active' | 'acknowledged' | 'resolved')}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="active">待处理</SelectItem>
                <SelectItem value="acknowledged">已确认</SelectItem>
                <SelectItem value="resolved">已解决</SelectItem>
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={(v) => setSeverityFilter(v as 'all' | 'critical' | 'warning' | 'info')}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="严重程度" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="critical">严重</SelectItem>
                <SelectItem value="warning">警告</SelectItem>
                <SelectItem value="info">提示</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 预警列表 */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">预警记录</CardTitle>
          <CardDescription>习惯养成异常预警，需要关注和干预</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>暂无预警</p>
              <p className="text-sm mt-1">学生习惯养成情况良好</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>预警内容</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>严重程度</TableHead>
                  <TableHead>指标值</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAlerts.map((alert) => {
                  const severityInfo = getSeverityInfo(alert.severity);
                  const typeInfo = getTypeInfo(alert.alertType);
                  const SeverityIcon = severityInfo.icon;
                  
                  return (
                    <TableRow key={alert.id}>
                      <TableCell>
                        <div className="flex items-start gap-2">
                          <SeverityIcon className={`h-4 w-4 mt-0.5 ${severityInfo.color.split(' ')[0]}`} />
                          <div>
                            <div className="font-medium">{alert.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {alert.studentName && `${alert.studentName} · `}
                              {alert.studentClassName}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          {typeInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={severityInfo.color}>
                          {severityInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${alert.metricValue < 0 ? 'text-red-600' : 'text-amber-600'}`}>
                            {alert.metricValue < 0 ? '' : ''}{alert.metricValue.toFixed(1)}%
                          </span>
                          <span className="text-xs text-muted-foreground">
                            / 阈值 {alert.thresholdValue}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {alert.status === 'active' ? (
                          <Badge className="bg-red-600">待处理</Badge>
                        ) : alert.status === 'acknowledged' ? (
                          <Badge className="bg-amber-600">已确认</Badge>
                        ) : (
                          <Badge className="bg-green-600">已解决</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {alert.status === 'active' && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleOpenAction(alert, 'acknowledge')}
                              >
                                确认
                              </Button>
                              <Button 
                                size="sm"
                                onClick={() => handleOpenAction(alert, 'resolve')}
                              >
                                解决
                              </Button>
                            </>
                          )}
                          {alert.status === 'acknowledged' && (
                            <Button 
                              size="sm"
                              onClick={() => handleOpenAction(alert, 'resolve')}
                            >
                              解决
                            </Button>
                          )}
                          {alert.status === 'resolved' && (
                            <span className="text-xs text-muted-foreground">
                              {formatTime(alert.resolvedAt)}
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 处理对话框 */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType === 'acknowledge' ? (
                <>
                  <Eye className="h-5 w-5 text-amber-600" />
                  确认预警
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  解决预警
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedAlert?.title}
            </DialogDescription>
          </DialogHeader>

          {selectedAlert && (
            <div className="space-y-4">
              {/* 预警详情 */}
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getSeverityInfo(selectedAlert.severity).color}>
                      {getSeverityInfo(selectedAlert.severity).label}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {getTypeInfo(selectedAlert.alertType).label}
                    </span>
                  </div>
                  <p className="text-sm">{selectedAlert.description}</p>
                  {selectedAlert.studentName && (
                    <p className="text-sm text-muted-foreground mt-2">
                      学生：{selectedAlert.studentName} · {selectedAlert.studentClassName}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* 备注 */}
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {actionType === 'acknowledge' ? '确认备注（可选）' : '解决说明'}
                </p>
                <Textarea
                  placeholder={actionType === 'acknowledge' ? '输入确认备注...' : '请说明已采取的措施...'}
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActionDialog(false)}>
              取消
            </Button>
            <Button 
              onClick={handleAction} 
              disabled={processing || (actionType === 'resolve' && !actionNotes.trim())}
              className={actionType === 'acknowledge' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-green-600 hover:bg-green-700'}
            >
              {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {actionType === 'acknowledge' ? '确认' : '标记已解决'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
