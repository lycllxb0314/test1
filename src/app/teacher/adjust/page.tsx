'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  CalendarClock,
  User,
  Clock,
  CheckCircle,
  FileText,
  Calendar,
  RefreshCw,
  Send,
  Eye,
  Loader2,
  Link,
  BookOpen,
} from 'lucide-react';
import { toast } from 'sonner';
import { CourseAdjustmentDialog } from '@/components/course-adjustment/CourseAdjustmentDialog';

// ==================== 数据类型定义 ====================

type AdjustStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

interface CourseAdjustmentItem {
  id: string;
  leave_request_id?: string;
  applicant_id: string;
  applicant_name: string;
  grade: number;
  class_id: string;
  class_name: string;
  subject: string;
  week_day: number;
  period_index: number;
  period_name?: string;
  effective_week: string;
  status: AdjustStatus;
  adjust_type?: 'substitute' | 'swap' | 'cancel' | 'makeup';
  substitute_employee_id?: string;
  substitute_name?: string;
  reason?: string;
  created_at: string;
  updated_at?: string;
  completed_at?: string;
}

// 星期几映射
const weekDayNames = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];

// 年级映射
const gradeNames: Record<number, string> = {
  1: '一年级',
  2: '二年级',
  3: '三年级',
  4: '四年级',
  5: '五年级',
  6: '六年级',
};

export default function GradeLeaderAdjustPage() {
  // 状态
  const [loading, setLoading] = useState(true);
  const [adjustments, setAdjustments] = useState<CourseAdjustmentItem[]>([]);
  
  // 对话框状态
  const [selectedAdjust, setSelectedAdjust] = useState<CourseAdjustmentItem | null>(null);
  const [showProcessDialog, setShowProcessDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  // 初始化数据
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/course-adjustments/process');
      const data = await response.json();
      
      if (data.success) {
        setAdjustments(data.data || []);
      } else {
        toast.error('获取调课记录失败');
      }
    } catch (error) {
      console.error('获取数据失败:', error);
      toast.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取状态徽章
  const getStatusBadge = (status: AdjustStatus) => {
    const statusMap: Record<AdjustStatus, { label: string; color: string }> = {
      pending: { label: '待处理', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
      processing: { label: '处理中', color: 'bg-blue-100 text-blue-700 border-blue-200' },
      completed: { label: '已完成', color: 'bg-green-100 text-green-700 border-green-200' },
      cancelled: { label: '已取消', color: 'bg-gray-100 text-gray-700 border-gray-200' },
    };
    const { label, color } = statusMap[status];
    return <Badge className={`${color} border`}>{label}</Badge>;
  };

  // 获取调课类型名称
  const getAdjustTypeName = (type?: string) => {
    const typeMap: Record<string, string> = {
      substitute: '代课',
      swap: '调换',
      cancel: '取消',
      makeup: '补课',
    };
    return type ? typeMap[type] : '-';
  };

  // 统计数据
  const stats = {
    pending: adjustments.filter(a => a.status === 'pending').length,
    processing: adjustments.filter(a => a.status === 'processing').length,
    completed: adjustments.filter(a => a.status === 'completed').length,
    total: adjustments.length,
  };

  // 打开处理对话框
  const handleOpenProcess = (adjust: CourseAdjustmentItem) => {
    setSelectedAdjust(adjust);
    setShowProcessDialog(true);
  };

  // 打开详情对话框
  const handleOpenDetail = (adjust: CourseAdjustmentItem) => {
    setSelectedAdjust(adjust);
    setShowDetailDialog(true);
  };

  // 处理完成回调
  const handleProcessSuccess = () => {
    setShowProcessDialog(false);
    setSelectedAdjust(null);
    fetchData();
    toast.success('调课处理成功');
  };

  // 加载状态
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <span className="ml-2 text-gray-500">加载数据中...</span>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-orange-50/30 via-white to-amber-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CalendarClock className="h-7 w-7 text-orange-500" />
            <h1 className="text-2xl font-bold text-gray-900">调课管理</h1>
          </div>
          <p className="text-gray-500 mt-1">处理年级教师请假调课申请，安排代课教师</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" />
            刷新
          </Button>
        </div>
      </div>

      {/* 联动提示 */}
      <Card className="border-orange-200 bg-orange-50/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-orange-700">
            <Link className="h-4 w-4" />
            <span className="text-sm">
              本页面与请假系统、排课系统、电子白板实时联动。请假审批通过后自动创建调课记录，安排代课后自动同步到各系统。
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">待处理</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">处理中</p>
                <p className="text-3xl font-bold text-blue-600">{stats.processing}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <RefreshCw className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">已完成</p>
                <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">本月总计</p>
                <p className="text-3xl font-bold text-gray-700">{stats.total}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                <FileText className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 调课列表 */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">调课申请列表</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="pending" className="gap-1">
                <Clock className="h-4 w-4" />
                待处理 ({stats.pending})
              </TabsTrigger>
              <TabsTrigger value="processing" className="gap-1">
                <RefreshCw className="h-4 w-4" />
                处理中 ({stats.processing})
              </TabsTrigger>
              <TabsTrigger value="completed" className="gap-1">
                <CheckCircle className="h-4 w-4" />
                已完成 ({stats.completed})
              </TabsTrigger>
              <TabsTrigger value="all" className="gap-1">
                <FileText className="h-4 w-4" />
                全部 ({stats.total})
              </TabsTrigger>
            </TabsList>

            {/* 待处理列表 */}
            <TabsContent value="pending" className="space-y-3">
              {adjustments.filter(a => a.status === 'pending').map(adjust => (
                <Card key={adjust.id} className="border border-yellow-200 bg-yellow-50/50 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusBadge(adjust.status)}
                          <Badge variant="outline" className="text-orange-600 border-orange-200">
                            {gradeNames[adjust.grade] || `${adjust.grade}年级`}
                          </Badge>
                          <span className="text-sm text-gray-500">{adjust.created_at}</span>
                        </div>
                        <div className="flex items-center gap-4 mb-2">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{adjust.applicant_name}</span>
                            <span className="text-sm text-gray-500">({adjust.subject})</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            第{adjust.effective_week}周
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">原课程：</span>
                          {adjust.class_name} · {weekDayNames[adjust.week_day]} 第{adjust.period_index + 1}节 · {adjust.subject}
                        </div>
                        {adjust.reason && (
                          <div className="text-sm text-gray-500">
                            <span className="font-medium">原因：</span>{adjust.reason}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <Button 
                          size="sm" 
                          className="bg-orange-500 hover:bg-orange-600 text-white gap-1"
                          onClick={() => handleOpenProcess(adjust)}
                        >
                          <Send className="h-4 w-4" />
                          处理调课
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1" onClick={() => handleOpenDetail(adjust)}>
                          <Eye className="h-4 w-4" />
                          查看详情
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {adjustments.filter(a => a.status === 'pending').length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>暂无待处理的调课申请</p>
                </div>
              )}
            </TabsContent>

            {/* 已完成列表 */}
            <TabsContent value="completed" className="space-y-3">
              {adjustments.filter(a => a.status === 'completed').map(adjust => (
                <Card key={adjust.id} className="border border-green-200 bg-green-50/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusBadge(adjust.status)}
                          <Badge variant="outline" className="text-green-600 border-green-200">
                            {getAdjustTypeName(adjust.adjust_type)}
                          </Badge>
                          <span className="text-sm text-gray-500">{adjust.completed_at}</span>
                        </div>
                        <div className="flex items-center gap-4 mb-2">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{adjust.applicant_name}</span>
                          </div>
                          {adjust.substitute_name && (
                            <div className="text-sm text-gray-600">
                              <span className="text-green-600 font-medium">{adjust.substitute_name}</span> 代课
                            </div>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          {adjust.class_name} · {weekDayNames[adjust.week_day]} 第{adjust.period_index + 1}节
                        </div>
                        {adjust.reason && (
                          <div className="text-sm text-gray-500 mt-1">备注：{adjust.reason}</div>
                        )}
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleOpenDetail(adjust)}>
                        查看详情
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* 全部列表 */}
            <TabsContent value="all" className="space-y-3">
              {adjustments.map(adjust => (
                <Card key={adjust.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusBadge(adjust.status)}
                          <span className="text-sm text-gray-500">{adjust.created_at}</span>
                        </div>
                        <div className="text-sm">
                          {adjust.applicant_name} · {adjust.class_name} · {adjust.subject}
                        </div>
                      </div>
                      {adjust.status === 'pending' && (
                        <Button size="sm" onClick={() => handleOpenProcess(adjust)}>
                          处理
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 智能调课处理对话框 */}
      <CourseAdjustmentDialog
        open={showProcessDialog}
        onOpenChange={setShowProcessDialog}
        adjustment={selectedAdjust}
        onSuccess={handleProcessSuccess}
      />

      {/* 详情对话框 */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              调课详情
            </DialogTitle>
          </DialogHeader>

          {selectedAdjust && (
            <div className="space-y-3 py-4">
              <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">状态</span>
                  {getStatusBadge(selectedAdjust.status)}
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">申请人</span>
                  <span>{selectedAdjust.applicant_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">年级</span>
                  <span>{gradeNames[selectedAdjust.grade] || `${selectedAdjust.grade}年级`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">班级</span>
                  <span>{selectedAdjust.class_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">课程</span>
                  <span>{selectedAdjust.subject}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">时间</span>
                  <span>第{selectedAdjust.effective_week}周 {weekDayNames[selectedAdjust.week_day]} 第{selectedAdjust.period_index + 1}节</span>
                </div>
                {selectedAdjust.substitute_name && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">代课教师</span>
                      <span className="text-green-600 font-medium">{selectedAdjust.substitute_name}</span>
                    </div>
                  </>
                )}
              </div>
              
              {selectedAdjust.reason && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">原因/备注</span>
                  <p className="text-sm text-foreground mt-1">{selectedAdjust.reason}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
