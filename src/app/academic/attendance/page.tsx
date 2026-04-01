'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
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
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  CheckCircle2,
  XCircle,
  Clock,
  CalendarDays,
  Users,
  AlertTriangle,
  FileText,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  TrendingUp,
  BarChart3,
  Calendar,
  UserCheck,
  UserX,
  Timer,
  MoreHorizontal,
  Edit,
  RotateCcw,
  CheckCircle,
} from 'lucide-react';

// ==================== 类型定义 ====================

type AttendanceStatus = 'normal' | 'late' | 'absent' | 'leave';

interface TeacherAttendanceRecord {
  teacherId: string;
  teacherName: string;
  employeeId: string;
  department: string;
  subject: string;
  status: AttendanceStatus;
  leaveType?: string;
  leaveDuration?: number;
  remark?: string;
  recordId?: string;
}

interface DailyAttendanceResponse {
  date: string;
  summary: {
    total: number;
    normal: number;
    late: number;
    absent: number;
    leave: number;
  };
  records: TeacherAttendanceRecord[];
}

interface MonthlyAttendanceResponse {
  month: string;
  summary: {
    totalTeachers: number;
    totalDays: number;
    normalDays: number;
    lateDays: number;
    absentDays: number;
    leaveDays: number;
    averageAttendanceRate: number;
  };
  byTeacher: {
    teacherId: string;
    teacherName: string;
    employeeId: string;
    department: string;
    normalDays: number;
    lateDays: number;
    absentDays: number;
    leaveDays: number;
    attendanceRate: number;
    leaveRecords: { date: string; type: string }[];
  }[];
  byDate: {
    date: string;
    weekday: string;
    normal: number;
    late: number;
    absent: number;
    leave: number;
  }[];
}

// ==================== 配置 ====================

const statusConfig: Record<AttendanceStatus, { 
  label: string; 
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
}> = {
  normal: { 
    label: '正常', 
    icon: <CheckCircle2 className="h-4 w-4" />,
    colorClass: 'text-green-600',
    bgClass: 'bg-green-500/10 text-green-600 border-green-200',
  },
  late: { 
    label: '迟到', 
    icon: <Timer className="h-4 w-4" />,
    colorClass: 'text-amber-600',
    bgClass: 'bg-amber-500/10 text-amber-600 border-amber-200',
  },
  absent: { 
    label: '旷工', 
    icon: <UserX className="h-4 w-4" />,
    colorClass: 'text-red-600',
    bgClass: 'bg-red-500/10 text-red-600 border-red-200',
  },
  leave: { 
    label: '请假', 
    icon: <FileText className="h-4 w-4" />,
    colorClass: 'text-blue-600',
    bgClass: 'bg-blue-500/10 text-blue-600 border-blue-200',
  },
};

const weekdays = ['日', '一', '二', '三', '四', '五', '六'];

// ==================== 主页面组件 ====================

export default function TeacherAttendancePage() {
  const [viewType, setViewType] = useState<'daily' | 'monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AttendanceStatus>('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  
  const [dailyData, setDailyData] = useState<DailyAttendanceResponse | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyAttendanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // 详情弹窗
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherAttendanceRecord | null>(null);
  
  // 标记弹窗
  const [showMarkDialog, setShowMarkDialog] = useState(false);
  const [markingTeacher, setMarkingTeacher] = useState<TeacherAttendanceRecord | null>(null);
  const [markStatus, setMarkStatus] = useState<'late' | 'absent'>('late');
  const [markRemark, setMarkRemark] = useState('');
  const [marking, setMarking] = useState(false);
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 获取部门列表
  const departments = useMemo(() => {
    const deps = new Set<string>();
    if (dailyData?.records) {
      dailyData.records.forEach(r => deps.add(r.department));
    }
    return Array.from(deps).sort();
  }, [dailyData]);

  // 获取数据
  const fetchData = async (showRefreshLoader = false) => {
    if (showRefreshLoader) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      if (viewType === 'daily') {
        const response = await fetch(`/api/teacher-attendance?type=daily&date=${selectedDate}`);
        const result = await response.json();
        if (result.success) {
          setDailyData(result.data);
        }
      } else {
        const response = await fetch(`/api/teacher-attendance?type=monthly&month=${selectedMonth}`);
        const result = await response.json();
        if (result.success) {
          setMonthlyData(result.data);
        }
      }
    } catch (err) {
      console.error('获取考勤数据失败:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 初始化加载 & 切换视图时加载
  useEffect(() => {
    fetchData();
  }, [viewType, selectedDate, selectedMonth]);

  // 标记考勤状态
  const handleMarkStatus = useCallback(async () => {
    if (!markingTeacher) return;
    
    setMarking(true);
    try {
      const response = await fetch('/api/teacher-attendance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: markingTeacher.teacherId,
          teacherName: markingTeacher.teacherName,
          date: selectedDate,
          status: markStatus,
          remark: markRemark,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(`已标记为${markStatus === 'late' ? '迟到' : '旷工'}`);
        setShowMarkDialog(false);
        setMarkingTeacher(null);
        setMarkRemark('');
        fetchData();
      } else {
        toast.error(result.error || '标记失败');
      }
    } catch (err) {
      console.error('标记考勤状态失败:', err);
      toast.error('标记失败');
    } finally {
      setMarking(false);
    }
  }, [markingTeacher, markStatus, markRemark, selectedDate, fetchData]);

  // 恢复正常状态
  const handleRestoreNormal = useCallback(async (record: TeacherAttendanceRecord) => {
    try {
      const response = await fetch('/api/teacher-attendance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: record.teacherId,
          teacherName: record.teacherName,
          date: selectedDate,
          status: 'present',
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('已恢复正常状态');
        fetchData();
      } else {
        toast.error(result.error || '恢复失败');
      }
    } catch (err) {
      console.error('恢复考勤状态失败:', err);
      toast.error('恢复失败');
    }
  }, [selectedDate, fetchData]);

  // 打开标记弹窗
  const openMarkDialog = useCallback((record: TeacherAttendanceRecord, status: 'late' | 'absent') => {
    setMarkingTeacher(record);
    setMarkStatus(status);
    setMarkRemark('');
    setShowMarkDialog(true);
  }, []);

  // 过滤数据 + 工号排序
  const filteredRecords = useMemo(() => {
    if (!dailyData?.records) return [];
    
    const filtered = dailyData.records.filter(record => {
      // 搜索过滤
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !record.teacherName.toLowerCase().includes(query) &&
          !record.employeeId.toLowerCase().includes(query) &&
          !record.department.toLowerCase().includes(query)
        ) {
          return false;
        }
      }
      
      // 状态过滤
      if (statusFilter !== 'all' && record.status !== statusFilter) {
        return false;
      }
      
      // 部门过滤
      if (departmentFilter !== 'all' && record.department !== departmentFilter) {
        return false;
      }
      
      return true;
    });
    
    // 按工号升序排序
    return filtered.sort((a, b) => {
      const idA = a.employeeId || '';
      const idB = b.employeeId || '';
      return idA.localeCompare(idB, 'zh-CN', { numeric: true });
    });
  }, [dailyData, searchQuery, statusFilter, departmentFilter]);

  // 分页计算
  const totalPages = Math.ceil(filteredRecords.length / pageSize);
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredRecords.slice(start, end);
  }, [filteredRecords, currentPage, pageSize]);
  
  // 筛选条件变化时重置页码
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, departmentFilter]);
  
  // 分页操作
  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };
  
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  // 日期导航
  const navigateDate = (direction: 'prev' | 'next') => {
    const current = new Date(selectedDate);
    if (direction === 'prev') {
      current.setDate(current.getDate() - 1);
    } else {
      current.setDate(current.getDate() + 1);
    }
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  // 月份导航
  const navigateMonth = (direction: 'prev' | 'next') => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    if (direction === 'prev') {
      date.setMonth(date.getMonth() - 1);
    } else {
      date.setMonth(date.getMonth() + 1);
    }
    setSelectedMonth(date.toISOString().substring(0, 7));
  };

  // 格式化日期显示
  const formatDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr);
    const weekday = weekdays[date.getDay()];
    return `${dateStr} 周${weekday}`;
  };

  // 查看教师详情
  const handleViewDetail = (record: TeacherAttendanceRecord) => {
    setSelectedTeacher(record);
    setShowDetailDialog(true);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-muted/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <UserCheck className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">教师考勤</h1>
          </div>
          <p className="text-muted-foreground mt-1">查看教师考勤状况，同步请假数据</p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          className="gap-2"
          onClick={() => fetchData(true)}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      {/* 视图切换 */}
      <Tabs value={viewType} onValueChange={(v) => setViewType(v as 'daily' | 'monthly')}>
        <TabsList className="grid w-[300px] grid-cols-2">
          <TabsTrigger value="daily" className="gap-2">
            <CalendarDays className="h-4 w-4" />
            日考勤
          </TabsTrigger>
          <TabsTrigger value="monthly" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            月统计
          </TabsTrigger>
        </TabsList>

        {/* 日考勤视图 */}
        <TabsContent value="daily" className="space-y-6 mt-6">
          {loading ? (
            <DailyLoadingSkeleton />
          ) : (
            <>
              {/* 统计卡片 */}
              <DailySummaryCards summary={dailyData?.summary} date={selectedDate} />
              
              {/* 日期导航和筛选 */}
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => navigateDate('prev')}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="text-lg font-medium min-w-[180px] text-center">
                        {formatDateDisplay(selectedDate)}
                      </div>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => navigateDate('next')}
                        disabled={selectedDate >= new Date().toISOString().split('T')[0]}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="搜索教师..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9 w-[200px]"
                        />
                      </div>
                      <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="状态" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">全部状态</SelectItem>
                          <SelectItem value="normal">正常</SelectItem>
                          <SelectItem value="late">迟到</SelectItem>
                          <SelectItem value="absent">旷工</SelectItem>
                          <SelectItem value="leave">请假</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="部门" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">全部部门</SelectItem>
                          {departments.map(dep => (
                            <SelectItem key={dep} value={dep}>{dep}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <TeacherAttendanceTable 
                    records={paginatedRecords} 
                    onViewDetail={handleViewDetail}
                    onMarkStatus={openMarkDialog}
                    onRestoreNormal={handleRestoreNormal}
                    pagination={{
                      page: currentPage,
                      pageSize,
                      total: filteredRecords.length,
                      totalPages,
                      onPageChange: handlePageChange,
                      onPageSizeChange: handlePageSizeChange,
                    }}
                  />
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* 月统计视图 */}
        <TabsContent value="monthly" className="space-y-6 mt-6">
          {loading ? (
            <MonthlyLoadingSkeleton />
          ) : (
            <>
              {/* 月度统计卡片 */}
              <MonthlySummaryCards summary={monthlyData?.summary} month={selectedMonth} />
              
              {/* 月份导航 */}
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => navigateMonth('prev')}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="text-lg font-medium min-w-[120px] text-center">
                        {selectedMonth}
                      </div>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => navigateMonth('next')}
                        disabled={selectedMonth >= new Date().toISOString().substring(0, 7)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* 月度日历视图 */}
              {monthlyData && (
                <Card className="border-0 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg">日历视图</CardTitle>
                    <CardDescription>每日考勤概览（周末不计入）</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <MonthlyCalendar data={monthlyData.byDate} />
                  </CardContent>
                </Card>
              )}

              {/* 教师月度统计表 */}
              {monthlyData && (
                <Card className="border-0 shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg">教师考勤统计</CardTitle>
                    <CardDescription>本月各教师考勤详情</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <MonthlyTeacherTable data={monthlyData.byTeacher} />
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* 教师详情弹窗 */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>考勤详情</DialogTitle>
          </DialogHeader>
          
          {selectedTeacher && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3">
                <div className={`h-12 w-12 rounded-full flex items-center justify-center ${statusConfig[selectedTeacher.status].bgClass}`}>
                  {statusConfig[selectedTeacher.status].icon}
                </div>
                <div>
                  <p className="font-medium text-lg">{selectedTeacher.teacherName}</p>
                  <p className="text-sm text-muted-foreground">{selectedTeacher.employeeId}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">部门</Label>
                  <p className="font-medium">{selectedTeacher.department}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">任教学科</Label>
                  <p className="font-medium">{selectedTeacher.subject || '-'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">考勤状态</Label>
                  <div className="mt-1">
                    <Badge className={statusConfig[selectedTeacher.status].bgClass}>
                      {statusConfig[selectedTeacher.status].label}
                    </Badge>
                  </div>
                </div>
                {selectedTeacher.leaveType && (
                  <div>
                    <Label className="text-xs text-muted-foreground">请假类型</Label>
                    <p className="font-medium">{selectedTeacher.leaveType}</p>
                  </div>
                )}
              </div>
              
              {selectedTeacher.remark && (
                <div>
                  <Label className="text-xs text-muted-foreground">备注</Label>
                  <p className="text-sm bg-muted/50 p-2 rounded mt-1">{selectedTeacher.remark}</p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 标记考勤状态弹窗 */}
      <Dialog open={showMarkDialog} onOpenChange={setShowMarkDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              标记为{markStatus === 'late' ? '迟到' : '旷工'}
            </DialogTitle>
            <DialogDescription>
              教师：{markingTeacher?.teacherName}（{markingTeacher?.employeeId}）
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3">
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${markStatus === 'late' ? 'bg-amber-500/10 text-amber-600' : 'bg-red-500/10 text-red-600'}`}>
                {markStatus === 'late' ? <Timer className="h-6 w-6" /> : <UserX className="h-6 w-6" />}
              </div>
              <div>
                <p className="font-medium">{markingTeacher?.teacherName}</p>
                <p className="text-sm text-muted-foreground">{markingTeacher?.department}</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={markStatus === 'late' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMarkStatus('late')}
                className="flex-1"
              >
                <Timer className="h-4 w-4 mr-1" />
                迟到
              </Button>
              <Button
                variant={markStatus === 'absent' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMarkStatus('absent')}
                className="flex-1"
              >
                <UserX className="h-4 w-4 mr-1" />
                旷工
              </Button>
            </div>
            
            <div>
              <Label className="text-xs text-muted-foreground">备注（可选）</Label>
              <Textarea
                placeholder="请输入备注信息..."
                value={markRemark}
                onChange={(e) => setMarkRemark(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMarkDialog(false)}>取消</Button>
            <Button onClick={handleMarkStatus} disabled={marking}>
              {marking ? '标记中...' : '确认标记'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==================== 子组件 ====================

// 日考勤统计卡片
function DailySummaryCards({ summary, date }: { summary?: DailyAttendanceResponse['summary']; date: string }) {
  const cards = [
    { 
      key: 'total', 
      label: '应到人数', 
      value: summary?.total || 0, 
      icon: <Users className="h-5 w-5" />,
      color: 'text-foreground',
      bg: 'bg-muted',
    },
    { 
      key: 'normal', 
      label: '正常', 
      value: summary?.normal || 0, 
      icon: <CheckCircle2 className="h-5 w-5" />,
      color: 'text-green-600',
      bg: 'bg-green-500/10',
    },
    { 
      key: 'late', 
      label: '迟到', 
      value: summary?.late || 0, 
      icon: <Timer className="h-5 w-5" />,
      color: 'text-amber-600',
      bg: 'bg-amber-500/10',
    },
    { 
      key: 'absent', 
      label: '旷工', 
      value: summary?.absent || 0, 
      icon: <UserX className="h-5 w-5" />,
      color: 'text-red-600',
      bg: 'bg-red-500/10',
    },
    { 
      key: 'leave', 
      label: '请假', 
      value: summary?.leave || 0, 
      icon: <FileText className="h-5 w-5" />,
      color: 'text-blue-600',
      bg: 'bg-blue-500/10',
    },
  ];

  const attendanceRate = summary?.total 
    ? Math.round(((summary.normal + summary.late) / summary.total) * 100) 
    : 100;

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {cards.map(card => (
          <Card key={card.key} className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                </div>
                <div className={`h-10 w-10 rounded-full ${card.bg} flex items-center justify-center ${card.color}`}>
                  {card.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card className="border-0 shadow-md bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">出勤率</p>
                <p className="text-2xl font-bold text-primary">{attendanceRate}%</p>
              </div>
            </div>
            <Progress value={attendanceRate} className="w-32 h-2" />
          </div>
        </CardContent>
      </Card>
    </>
  );
}

// 月度统计卡片
function MonthlySummaryCards({ summary, month }: { summary?: MonthlyAttendanceResponse['summary']; month: string }) {
  const cards = [
    { 
      key: 'totalTeachers', 
      label: '教师总数', 
      value: summary?.totalTeachers || 0, 
      icon: <Users className="h-5 w-5" />,
    },
    { 
      key: 'totalDays', 
      label: '工作日数', 
      value: summary?.totalDays || 0, 
      icon: <Calendar className="h-5 w-5" />,
    },
    { 
      key: 'leaveDays', 
      label: '请假人次', 
      value: summary?.leaveDays || 0, 
      icon: <FileText className="h-5 w-5" />,
      color: 'text-blue-600',
      bg: 'bg-blue-500/10',
    },
    { 
      key: 'lateDays', 
      label: '迟到人次', 
      value: summary?.lateDays || 0, 
      icon: <Timer className="h-5 w-5" />,
      color: 'text-amber-600',
      bg: 'bg-amber-500/10',
    },
    { 
      key: 'absentDays', 
      label: '旷工人次', 
      value: summary?.absentDays || 0, 
      icon: <UserX className="h-5 w-5" />,
      color: 'text-red-600',
      bg: 'bg-red-500/10',
    },
  ];

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {cards.map(card => (
          <Card key={card.key} className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className={`text-2xl font-bold ${card.color || 'text-foreground'}`}>{card.value}</p>
                </div>
                <div className={`h-10 w-10 rounded-full ${card.bg || 'bg-muted'} flex items-center justify-center ${card.color || 'text-muted-foreground'}`}>
                  {card.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card className="border-0 shadow-md bg-gradient-to-r from-primary/5 to-primary/10">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">月平均出勤率</p>
                <p className="text-2xl font-bold text-primary">{summary?.averageAttendanceRate || 100}%</p>
              </div>
            </div>
            <Progress value={summary?.averageAttendanceRate || 100} className="w-32 h-2" />
          </div>
        </CardContent>
      </Card>
    </>
  );
}

// 教师考勤表格
function TeacherAttendanceTable({ 
  records, 
  onViewDetail,
  onMarkStatus,
  onRestoreNormal,
  pagination,
}: { 
  records: TeacherAttendanceRecord[];
  onViewDetail: (record: TeacherAttendanceRecord) => void;
  onMarkStatus: (record: TeacherAttendanceRecord, status: 'late' | 'absent') => void;
  onRestoreNormal: (record: TeacherAttendanceRecord) => void;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
  };
}) {
  if (records.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>暂无数据</p>
      </div>
    );
  }

  const pageSizeOptions = [10, 30, 50];

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>教师</TableHead>
            <TableHead>工号</TableHead>
            <TableHead>部门</TableHead>
            <TableHead>学科</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>备注</TableHead>
            <TableHead className="w-[120px]">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.teacherId} className="hover:bg-muted/50">
              <TableCell className="font-medium">{record.teacherName}</TableCell>
              <TableCell className="text-muted-foreground">{record.employeeId || '-'}</TableCell>
              <TableCell>{record.department}</TableCell>
              <TableCell>{record.subject || '-'}</TableCell>
              <TableCell>
                <Badge className={statusConfig[record.status].bgClass}>
                  <span className="flex items-center gap-1">
                    {statusConfig[record.status].icon}
                    {statusConfig[record.status].label}
                  </span>
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {record.leaveType ? `${record.leaveType}` : record.remark || '-'}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  {/* 只有正常或迟到/旷工状态才能标记 */}
                  {record.status === 'normal' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onMarkStatus(record, 'late')}>
                          <Timer className="h-4 w-4 mr-2 text-amber-600" />
                          标记迟到
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onMarkStatus(record, 'absent')}>
                          <UserX className="h-4 w-4 mr-2 text-red-600" />
                          标记旷工
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onViewDetail(record)}>
                          <FileText className="h-4 w-4 mr-2" />
                          查看详情
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  {(record.status === 'late' || record.status === 'absent') && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onRestoreNormal(record)}>
                          <RotateCcw className="h-4 w-4 mr-2 text-green-600" />
                          恢复正常
                        </DropdownMenuItem>
                        {record.status === 'late' && (
                          <DropdownMenuItem onClick={() => onMarkStatus(record, 'absent')}>
                            <UserX className="h-4 w-4 mr-2 text-red-600" />
                            改为旷工
                          </DropdownMenuItem>
                        )}
                        {record.status === 'absent' && (
                          <DropdownMenuItem onClick={() => onMarkStatus(record, 'late')}>
                            <Timer className="h-4 w-4 mr-2 text-amber-600" />
                            改为迟到
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onViewDetail(record)}>
                          <FileText className="h-4 w-4 mr-2" />
                          查看详情
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  {/* 请假状态只能查看详情 */}
                  {record.status === 'leave' && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onViewDetail(record)}
                    >
                      详情
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {/* 分页控件 */}
      {pagination && pagination.total > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              显示 {(pagination.page - 1) * pagination.pageSize + 1} - {Math.min(pagination.page * pagination.pageSize, pagination.total)} 条，共 {pagination.total} 条
            </div>
            <Select 
              value={pagination.pageSize.toString()} 
              onValueChange={(value) => pagination.onPageSizeChange(parseInt(value))}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map(size => (
                  <SelectItem key={size} value={size.toString()}>{size} 条/页</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              上一页
            </Button>
            <span className="text-sm">
              第 {pagination.page} / {pagination.totalPages} 页
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              下一页
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

// 月度日历视图
function MonthlyCalendar({ data }: { data: MonthlyAttendanceResponse['byDate'] }) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">暂无数据</div>
    );
  }

  return (
    <div className="grid grid-cols-5 gap-2">
      {data.map((day) => {
        const total = day.normal + day.late + day.absent + day.leave;
        const normalRate = total > 0 ? Math.round((day.normal / total) * 100) : 0;
        
        return (
          <div 
            key={day.date}
            className="p-3 rounded-lg border bg-card hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">周{day.weekday}</span>
              <span className="text-xs font-medium">{day.date.split('-')[2]}</span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-green-600">正常</span>
                <span className="font-medium">{day.normal}</span>
              </div>
              {day.late > 0 && (
                <div className="flex items-center justify-between text-amber-600">
                  <span>迟到</span>
                  <span className="font-medium">{day.late}</span>
                </div>
              )}
              {day.absent > 0 && (
                <div className="flex items-center justify-between text-red-600">
                  <span>旷工</span>
                  <span className="font-medium">{day.absent}</span>
                </div>
              )}
              {day.leave > 0 && (
                <div className="flex items-center justify-between text-blue-600">
                  <span>请假</span>
                  <span className="font-medium">{day.leave}</span>
                </div>
              )}
            </div>
            <div className="mt-2">
              <Progress value={normalRate} className="h-1" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// 月度教师统计表
function MonthlyTeacherTable({ data }: { data: MonthlyAttendanceResponse['byTeacher'] }) {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    const query = searchQuery.toLowerCase();
    return data.filter(t => 
      t.teacherName.toLowerCase().includes(query) ||
      t.employeeId.toLowerCase().includes(query) ||
      t.department.toLowerCase().includes(query)
    );
  }, [data, searchQuery]);

  return (
    <div className="space-y-4">
      <div className="relative w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="搜索教师..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>教师</TableHead>
            <TableHead>工号</TableHead>
            <TableHead>部门</TableHead>
            <TableHead className="text-center">正常</TableHead>
            <TableHead className="text-center">迟到</TableHead>
            <TableHead className="text-center">旷工</TableHead>
            <TableHead className="text-center">请假</TableHead>
            <TableHead className="text-center">出勤率</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.map((teacher) => (
            <TableRow key={teacher.teacherId} className="hover:bg-muted/50">
              <TableCell className="font-medium">{teacher.teacherName}</TableCell>
              <TableCell className="text-muted-foreground">{teacher.employeeId || '-'}</TableCell>
              <TableCell>{teacher.department}</TableCell>
              <TableCell className="text-center text-green-600 font-medium">{teacher.normalDays}</TableCell>
              <TableCell className="text-center text-amber-600 font-medium">{teacher.lateDays}</TableCell>
              <TableCell className="text-center text-red-600 font-medium">{teacher.absentDays}</TableCell>
              <TableCell className="text-center text-blue-600 font-medium">{teacher.leaveDays}</TableCell>
              <TableCell className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <Progress value={teacher.attendanceRate} className="w-16 h-2" />
                  <span className="text-sm font-medium">{teacher.attendanceRate}%</span>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// 加载骨架屏
function DailyLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="border-0 shadow-md">
            <CardContent className="p-4">
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="border-0 shadow-md">
        <CardContent className="p-6">
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

function MonthlyLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="border-0 shadow-md">
            <CardContent className="p-4">
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="border-0 shadow-md">
        <CardContent className="p-6">
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
