'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import {
  UserPlus,
  Search,
  RefreshCw,
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  Users,
  Clock,
  AlertCircle,
  RefreshCw as Sync,
  Download,
  Calendar,
  User,
  Phone,
  MapPin,
  FileText,
  Home,
  AlertTriangle,
  CheckSquare,
} from 'lucide-react';
import type { Parent } from '@/types';

// 新生申请状态
type ApplicationStatus = 'pending' | 'reviewing' | 'approved' | 'rejected' | 'synced';

// 扩展的新生注册申请类型 - 与 API 对齐
interface NewStudentApplication {
  id: string;
  // 基本信息
  studentName: string;
  gender: 'male' | 'female';
  birthDate: string;
  idCard?: string;
  ethnicity?: string;
  nativePlace?: string;
  politicalStatus?: string;
  // 申请信息
  applyGrade: number;
  applyClassId?: string;
  applyClassName?: string;
  // 家庭信息
  familyType?: '核心家庭' | '单亲家庭' | '重组家庭' | '隔代家庭' | '其他';
  parents: Parent[];
  emergencyContact?: string;
  emergencyPhone?: string;
  // 联系信息
  homeAddress: string;
  phone?: string;
  // 学生类型
  studentType: '普通' | '随迁子女' | '留守儿童' | '残疾学生' | '低保家庭';
  // 状态
  status: ApplicationStatus;
  // 时间戳
  submittedAt: string;
  reviewedAt?: string;
  syncedAt?: string;
  reviewedBy?: string;
  syncedBy?: string;
  notes?: string;
  // 同步结果
  syncResult?: {
    success: boolean;
    studentId?: string;
    studentNo?: string;
    error?: string;
  };
}

// 状态配置
const statusConfig: Record<ApplicationStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: '待审核', color: 'text-amber-600', bgColor: 'bg-amber-50' },
  reviewing: { label: '审核中', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  approved: { label: '已通过', color: 'text-green-600', bgColor: 'bg-green-50' },
  rejected: { label: '已拒绝', color: 'text-red-600', bgColor: 'bg-red-50' },
  synced: { label: '已同步', color: 'text-purple-600', bgColor: 'bg-purple-50' },
};

// 班级选项（带ID）
const classOptionsByGrade: Record<number, { id: string; name: string }[]> = {
  1: [
    { id: 'c1-1', name: '一年(1)班' },
    { id: 'c1-2', name: '一年(2)班' },
    { id: 'c1-3', name: '一年(3)班' },
    { id: 'c1-4', name: '一年(4)班' },
    { id: 'c1-5', name: '一年(5)班' },
    { id: 'c1-6', name: '一年(6)班' },
  ],
  2: [
    { id: 'c2-1', name: '二年(1)班' },
    { id: 'c2-2', name: '二年(2)班' },
    { id: 'c2-3', name: '二年(3)班' },
    { id: 'c2-4', name: '二年(4)班' },
    { id: 'c2-5', name: '二年(5)班' },
    { id: 'c2-6', name: '二年(6)班' },
  ],
  3: [
    { id: 'c3-1', name: '三年(1)班' },
    { id: 'c3-2', name: '三年(2)班' },
    { id: 'c3-3', name: '三年(3)班' },
    { id: 'c3-4', name: '三年(4)班' },
    { id: 'c3-5', name: '三年(5)班' },
  ],
  4: [
    { id: 'c4-1', name: '四年(1)班' },
    { id: 'c4-2', name: '四年(2)班' },
    { id: 'c4-3', name: '四年(3)班' },
    { id: 'c4-4', name: '四年(4)班' },
    { id: 'c4-5', name: '四年(5)班' },
  ],
  5: [
    { id: 'c5-1', name: '五年(1)班' },
    { id: 'c5-2', name: '五年(2)班' },
    { id: 'c5-3', name: '五年(3)班' },
    { id: 'c5-4', name: '五年(4)班' },
  ],
  6: [
    { id: 'c6-1', name: '六年(1)班' },
    { id: 'c6-2', name: '六年(2)班' },
    { id: 'c6-3', name: '六年(3)班' },
    { id: 'c6-4', name: '六年(4)班' },
  ],
};

export default function EnrollmentPage() {
  const [applications, setApplications] = useState<NewStudentApplication[]>([]);
  const [summary, setSummary] = useState({
    total: 0,
    pending: 0,
    reviewing: 0,
    approved: 0,
    rejected: 0,
    synced: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [gradeFilter, setGradeFilter] = useState('all');
  
  // 批量选择
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // 对话框状态
  const [detailDialog, setDetailDialog] = useState(false);
  const [approveDialog, setApproveDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [syncDialog, setSyncDialog] = useState(false);
  const [batchSyncDialog, setBatchSyncDialog] = useState(false);
  const [selectedApp, setSelectedApp] = useState<NewStudentApplication | null>(null);
  const [approveClassId, setApproveClassId] = useState('');
  const [approveClassName, setApproveClassName] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  // 获取数据
  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (gradeFilter !== 'all') params.set('grade', gradeFilter);
      
      const res = await fetch(`/api/enrollment?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setApplications(data.data);
        setSummary(data.summary);
      }
    } catch {
      toast.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, gradeFilter]);

  // 过滤搜索
  const filteredApplications = applications.filter(app => 
    app.studentName.includes(searchTerm) || 
    app.parents.some(p => p.name.includes(searchTerm) || p.phone.includes(searchTerm))
  );

  // 全选/取消全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredApplications.map(a => a.id));
    } else {
      setSelectedIds([]);
    }
  };

  // 单个选择
  const handleSelect = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(i => i !== id));
    }
  };

  // 查看详情
  const handleViewDetail = (app: NewStudentApplication) => {
    setSelectedApp(app);
    setDetailDialog(true);
  };

  // 审核申请
  const handleReview = async (app: NewStudentApplication) => {
    try {
      const res = await fetch('/api/enrollment', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: app.id,
          action: 'review',
          operator: '教务员',
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('已开始审核');
        fetchData();
      }
    } catch {
      toast.error('操作失败');
    }
  };

  // 打开通过对话框
  const handleOpenApprove = (app: NewStudentApplication) => {
    setSelectedApp(app);
    setApproveClassId('');
    setApproveClassName('');
    setApproveDialog(true);
  };

  // 确认通过
  const handleApprove = async () => {
    if (!selectedApp || !approveClassId || !approveClassName) {
      toast.error('请选择分配班级');
      return;
    }
    try {
      const res = await fetch('/api/enrollment', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedApp.id,
          action: 'approve',
          applyClassId: approveClassId,
          applyClassName: approveClassName,
          operator: '教务员',
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('审核通过，已分配班级');
        setApproveDialog(false);
        fetchData();
      } else {
        toast.error(data.message || '操作失败');
      }
    } catch {
      toast.error('操作失败');
    }
  };

  // 打开拒绝对话框
  const handleOpenReject = (app: NewStudentApplication) => {
    setSelectedApp(app);
    setRejectReason('');
    setRejectDialog(true);
  };

  // 确认拒绝
  const handleReject = async () => {
    if (!selectedApp) return;
    try {
      const res = await fetch('/api/enrollment', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedApp.id,
          action: 'reject',
          notes: rejectReason,
          operator: '教务员',
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('已拒绝该申请');
        setRejectDialog(false);
        fetchData();
      }
    } catch {
      toast.error('操作失败');
    }
  };

  // 打开同步对话框
  const handleOpenSync = (app: NewStudentApplication) => {
    setSelectedApp(app);
    setSyncDialog(true);
  };

  // 确认同步单个
  const handleSync = async () => {
    if (!selectedApp) return;
    try {
      const res = await fetch('/api/enrollment', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedApp.id,
          action: 'sync',
          operator: '教务员',
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`已同步到学生管理系统，学号：${data.data.syncResult?.studentNo}`);
        setSyncDialog(false);
        fetchData();
      } else {
        toast.error(data.message || '同步失败');
      }
    } catch {
      toast.error('同步失败');
    }
  };

  // 打开批量同步对话框
  const handleOpenBatchSync = () => {
    const approvedIds = selectedIds.filter(id => 
      applications.find(a => a.id === id && a.status === 'approved')
    );
    if (approvedIds.length === 0) {
      toast.error('请选择已审核通过待同步的申请');
      return;
    }
    setBatchSyncDialog(true);
  };

  // 批量同步
  const handleBatchSync = async () => {
    const approvedIds = selectedIds.filter(id => 
      applications.find(a => a.id === id && a.status === 'approved')
    );
    
    if (approvedIds.length === 0) {
      toast.error('请选择已审核通过待同步的申请');
      return;
    }
    
    try {
      const res = await fetch('/api/enrollment', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: approvedIds,
          operator: '教务员',
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setBatchSyncDialog(false);
        setSelectedIds([]);
        fetchData();
      } else {
        toast.error(data.message || '批量同步失败');
      }
    } catch {
      toast.error('批量同步失败');
    }
  };

  // 计算年龄
  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // 获取主要家长信息
  const getPrimaryParent = (parents: Parent[]) => {
    return parents.find(p => p.isPrimary) || parents[0];
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">新生注册</h1>
          <p className="text-muted-foreground mt-1">管理新生信息采集、审核分配班级与学籍同步</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            <Calendar className="h-3 w-3 mr-1" />
            每年9月开放
          </Badge>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">总申请</span>
            </div>
            <p className="text-2xl font-bold mt-2">{summary.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-muted-foreground">待审核</span>
            </div>
            <p className="text-2xl font-bold mt-2 text-amber-600">{summary.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">审核中</span>
            </div>
            <p className="text-2xl font-bold mt-2 text-blue-600">{summary.reviewing}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">已通过</span>
            </div>
            <p className="text-2xl font-bold mt-2 text-green-600">{summary.approved}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-muted-foreground">已拒绝</span>
            </div>
            <p className="text-2xl font-bold mt-2 text-red-600">{summary.rejected}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Sync className="h-4 w-4 text-purple-500" />
              <span className="text-sm text-muted-foreground">已同步</span>
            </div>
            <p className="text-2xl font-bold mt-2 text-purple-600">{summary.synced}</p>
          </CardContent>
        </Card>
      </div>

      {/* 主要内容 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>新生申请列表</CardTitle>
            <div className="flex items-center gap-2">
              {selectedIds.filter(id => 
                applications.find(a => a.id === id && a.status === 'approved')
              ).length > 0 && (
                <Button variant="default" onClick={handleOpenBatchSync}>
                  <Sync className="h-4 w-4 mr-2" />
                  批量同步 ({selectedIds.filter(id => 
                    applications.find(a => a.id === id && a.status === 'approved')
                  ).length})
                </Button>
              )}
              <Button variant="outline" onClick={fetchData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                刷新
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                导出
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* 搜索和筛选 */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索学生姓名、家长姓名或电话..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="审核状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="pending">待审核</SelectItem>
                <SelectItem value="reviewing">审核中</SelectItem>
                <SelectItem value="approved">已通过</SelectItem>
                <SelectItem value="rejected">已拒绝</SelectItem>
                <SelectItem value="synced">已同步</SelectItem>
              </SelectContent>
            </Select>
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="申请年级" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部年级</SelectItem>
                <SelectItem value="1">一年级</SelectItem>
                <SelectItem value="2">二年级</SelectItem>
                <SelectItem value="3">三年级</SelectItem>
                <SelectItem value="4">四年级</SelectItem>
                <SelectItem value="5">五年级</SelectItem>
                <SelectItem value="6">六年级</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 表格 */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedIds.length === filteredApplications.length && filteredApplications.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>学生姓名</TableHead>
                  <TableHead>性别</TableHead>
                  <TableHead>年龄</TableHead>
                  <TableHead>申请年级</TableHead>
                  <TableHead>家长信息</TableHead>
                  <TableHead>学生类型</TableHead>
                  <TableHead>分配班级</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : filteredApplications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                      暂无数据
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredApplications.map((app) => {
                    const primaryParent = getPrimaryParent(app.parents);
                    return (
                      <TableRow key={app.id} className={selectedIds.includes(app.id) ? 'bg-muted/50' : ''}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.includes(app.id)}
                            onCheckedChange={(checked) => handleSelect(app.id, checked as boolean)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{app.studentName}</TableCell>
                        <TableCell>{app.gender === 'male' ? '男' : '女'}</TableCell>
                        <TableCell>{calculateAge(app.birthDate)}岁</TableCell>
                        <TableCell>{app.applyGrade}年级</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{primaryParent?.name}({primaryParent?.relationship})</div>
                            <div className="text-muted-foreground">{primaryParent?.phone}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{app.studentType}</Badge>
                        </TableCell>
                        <TableCell>
                          {app.applyClassName || <span className="text-muted-foreground">待分配</span>}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${statusConfig[app.status].bgColor} ${statusConfig[app.status].color}`}>
                            {statusConfig[app.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewDetail(app)}>
                                <Eye className="h-4 w-4 mr-2" />
                                查看详情
                              </DropdownMenuItem>
                              {app.status === 'pending' && (
                                <DropdownMenuItem onClick={() => handleReview(app)}>
                                  <FileText className="h-4 w-4 mr-2" />
                                  开始审核
                                </DropdownMenuItem>
                              )}
                              {(app.status === 'pending' || app.status === 'reviewing') && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleOpenApprove(app)}>
                                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                    审核通过
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleOpenReject(app)}>
                                    <XCircle className="h-4 w-4 mr-2 text-red-600" />
                                    拒绝申请
                                  </DropdownMenuItem>
                                </>
                              )}
                              {app.status === 'approved' && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleOpenSync(app)}>
                                    <Sync className="h-4 w-4 mr-2 text-purple-600" />
                                    同步到学生管理
                                  </DropdownMenuItem>
                                </>
                              )}
                              {app.status === 'synced' && app.syncResult && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem disabled className="text-muted-foreground">
                                    <CheckSquare className="h-4 w-4 mr-2" />
                                    学号: {app.syncResult.studentNo}
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 详情对话框 */}
      <Dialog open={detailDialog} onOpenChange={setDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新生申请详情</DialogTitle>
          </DialogHeader>
          {selectedApp && (
            <div className="space-y-4">
              {/* 基本信息 */}
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  学生基本信息
                </h4>
                <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg">
                  <div>
                    <span className="text-muted-foreground text-sm">姓名：</span>
                    <span className="font-medium">{selectedApp.studentName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-sm">性别：</span>
                    <span>{selectedApp.gender === 'male' ? '男' : '女'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-sm">出生日期：</span>
                    <span>{selectedApp.birthDate}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-sm">身份证号：</span>
                    <span>{selectedApp.idCard || '-'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-sm">民族：</span>
                    <span>{selectedApp.ethnicity || '-'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-sm">籍贯：</span>
                    <span>{selectedApp.nativePlace || '-'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-sm">政治面貌：</span>
                    <span>{selectedApp.politicalStatus || '-'}</span>
                  </div>
                </div>
              </div>

              {/* 申请信息 */}
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  申请信息
                </h4>
                <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg">
                  <div>
                    <span className="text-muted-foreground text-sm">申请年级：</span>
                    <span className="font-medium">{selectedApp.applyGrade}年级</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-sm">分配班级：</span>
                    <span>{selectedApp.applyClassName || '待分配'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-sm">学生类型：</span>
                    <span>{selectedApp.studentType}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-sm">状态：</span>
                    <Badge className={`${statusConfig[selectedApp.status].bgColor} ${statusConfig[selectedApp.status].color}`}>
                      {statusConfig[selectedApp.status].label}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* 家庭信息 */}
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  家庭信息
                </h4>
                <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                  <div>
                    <span className="text-muted-foreground text-sm">家庭类型：</span>
                    <span>{selectedApp.familyType || '-'}</span>
                  </div>
                  <div className="space-y-2">
                    <span className="text-muted-foreground text-sm">家长信息：</span>
                    {selectedApp.parents.map((parent, index) => (
                      <div key={parent.id || index} className="flex items-center gap-2 text-sm">
                        <span className="font-medium">{parent.name}</span>
                        <span className="text-muted-foreground">({parent.relationship})</span>
                        <span className="text-muted-foreground">{parent.phone}</span>
                        {parent.isPrimary && (
                          <Badge variant="outline" className="text-xs">主要联系人</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-muted-foreground text-sm">紧急联系人：</span>
                      <span>{selectedApp.emergencyContact || '-'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-sm">紧急联系电话：</span>
                      <span>{selectedApp.emergencyPhone || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 地址信息 */}
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  地址信息
                </h4>
                <div className="bg-muted/30 p-4 rounded-lg">
                  {selectedApp.homeAddress}
                </div>
              </div>

              {/* 时间信息 */}
              <div>
                <h4 className="font-medium mb-2">时间信息</h4>
                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div>提交时间：{selectedApp.submittedAt}</div>
                  {selectedApp.reviewedAt && <div>审核时间：{selectedApp.reviewedAt}</div>}
                  {selectedApp.syncedAt && <div>同步时间：{selectedApp.syncedAt}</div>}
                </div>
              </div>

              {/* 同步结果 */}
              {selectedApp.syncResult && (
                <div>
                  <h4 className="font-medium mb-2">同步结果</h4>
                  <div className={`p-4 rounded-lg ${selectedApp.syncResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
                    {selectedApp.syncResult.success ? (
                      <div className="text-sm">
                        <div className="text-green-700 font-medium">同步成功</div>
                        <div className="text-green-600">学号：{selectedApp.syncResult.studentNo}</div>
                      </div>
                    ) : (
                      <div className="text-sm text-red-700">
                        同步失败：{selectedApp.syncResult.error}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 备注 */}
              {selectedApp.notes && (
                <div>
                  <h4 className="font-medium mb-2">备注</h4>
                  <div className="bg-muted/30 p-4 rounded-lg text-sm">
                    {selectedApp.notes}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 通过对话框 */}
      <Dialog open={approveDialog} onOpenChange={setApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>审核通过</DialogTitle>
            <DialogDescription>
              请为该学生分配班级
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>学生姓名</Label>
              <Input value={selectedApp?.studentName || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label>申请年级</Label>
              <Input value={selectedApp ? `${selectedApp.applyGrade}年级` : ''} disabled />
            </div>
            <div className="space-y-2">
              <Label>分配班级 *</Label>
              <Select 
                value={approveClassId} 
                onValueChange={(value) => {
                  setApproveClassId(value);
                  const grade = selectedApp?.applyGrade || 1;
                  const classInfo = classOptionsByGrade[grade]?.find(c => c.id === value);
                  setApproveClassName(classInfo?.name || '');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择班级" />
                </SelectTrigger>
                <SelectContent>
                  {selectedApp && classOptionsByGrade[selectedApp.applyGrade]?.map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>备注</Label>
              <Textarea
                placeholder="可选：添加备注信息..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialog(false)}>取消</Button>
            <Button onClick={handleApprove} disabled={!approveClassId}>确认通过</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 拒绝对话框 */}
      <Dialog open={rejectDialog} onOpenChange={setRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>拒绝申请</DialogTitle>
            <DialogDescription>
              请填写拒绝原因
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>学生姓名</Label>
              <Input value={selectedApp?.studentName || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label>拒绝原因</Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="请填写拒绝原因，将通知家长..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(false)}>取消</Button>
            <Button variant="destructive" onClick={handleReject}>确认拒绝</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 单个同步对话框 */}
      <Dialog open={syncDialog} onOpenChange={setSyncDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>同步到学生管理系统</DialogTitle>
            <DialogDescription>
              将新生信息同步到学生管理系统，同步后可在"学生管理"中查看
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-purple-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-purple-800">同步确认</p>
                  <p className="text-purple-700 mt-1">
                    将把 <strong>{selectedApp?.studentName}</strong> 的信息同步到学生管理系统，
                    分配班级为 <strong>{selectedApp?.applyClassName}</strong>，此操作不可撤销。
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-sm">
              <div className="font-medium mb-2">将同步以下信息：</div>
              <ul className="text-muted-foreground space-y-1">
                <li>• 学生基本信息（姓名、性别、出生日期、身份证等）</li>
                <li>• 学籍信息（年级、班级、入学日期）</li>
                <li>• 家庭信息（家长信息、联系方式）</li>
                <li>• 自动生成学号</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSyncDialog(false)}>取消</Button>
            <Button onClick={handleSync}>
              <Sync className="h-4 w-4 mr-2" />
              确认同步
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 批量同步对话框 */}
      <Dialog open={batchSyncDialog} onOpenChange={setBatchSyncDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>批量同步到学生管理系统</DialogTitle>
            <DialogDescription>
              将选中的已审核通过的新生信息批量同步到学生管理系统
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-purple-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-purple-800">批量同步确认</p>
                  <p className="text-purple-700 mt-1">
                    将同步 <strong>{selectedIds.filter(id => 
                      applications.find(a => a.id === id && a.status === 'approved')
                    ).length}</strong> 条已审核通过的申请，此操作不可撤销。
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-sm max-h-48 overflow-y-auto">
              <div className="font-medium mb-2">待同步学生：</div>
              <ul className="text-muted-foreground space-y-1">
                {selectedIds
                  .filter(id => applications.find(a => a.id === id && a.status === 'approved'))
                  .map(id => {
                    const app = applications.find(a => a.id === id);
                    return (
                      <li key={id} className="flex items-center gap-2">
                        <span>{app?.studentName}</span>
                        <span className="text-xs">→ {app?.applyClassName}</span>
                      </li>
                    );
                  })}
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBatchSyncDialog(false)}>取消</Button>
            <Button onClick={handleBatchSync}>
              <Sync className="h-4 w-4 mr-2" />
              确认批量同步
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
