'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  CalendarClock,
  Bell,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Users,
  Calendar,
  RefreshCw,
  Send,
  Eye,
  Filter,
  Loader2,
  Link,
} from 'lucide-react';

// ==================== 数据类型定义 ====================

type AdjustStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

interface CourseAdjustmentItem {
  id: string;
  leaveRequestId?: string;
  // 申请人信息（请假教师）
  applicantId: string;
  applicantName: string;
  applicantSubject: string;
  applicantGrade: number;
  // 请假信息
  leaveType: string;
  leaveStartDate: string;
  leaveEndDate: string;
  leaveReason: string;
  // 原课程信息
  originalClassId: string;
  originalClassName: string;
  originalSubject: string;
  originalWeekDay: number;
  originalPeriodIndex: number;
  originalPeriodName: string;
  // 调课状态
  status: AdjustStatus;
  adjustType?: 'substitute' | 'swap' | 'cancel' | 'makeup';
  // 代课教师
  substituteTeacherId?: string;
  substituteTeacherName?: string;
  // 处理人
  handlerId?: string;
  handlerName?: string;
  handledAt?: string;
  // 备注
  remark?: string;
  // 时间
  createdAt: string;
  updatedAt?: string;
}

interface AvailableTeacher {
  id: string;
  name: string;
  subjects: string[];
  available: boolean;
}

// 星期几映射
const weekDayNames = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export default function GradeLeaderAdjustPage() {
  // 状态
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [adjustments, setAdjustments] = useState<CourseAdjustmentItem[]>([]);
  const [availableTeachers, setAvailableTeachers] = useState<AvailableTeacher[]>([]);
  
  // 对话框状态
  const [selectedAdjust, setSelectedAdjust] = useState<CourseAdjustmentItem | null>(null);
  const [showProcessDialog, setShowProcessDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  
  // 处理表单状态
  const [processForm, setProcessForm] = useState({
    adjustType: 'substitute' as 'substitute' | 'swap' | 'cancel' | 'makeup',
    substituteTeacherId: '',
    remark: '',
  });

  // 初始化数据
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 并行获取调课记录和可用教师
      const [adjustmentsRes, teachersRes] = await Promise.all([
        fetch('/api/schedule-changes'),
        fetch('/api/schedule-changes?action=available-teachers'),
      ]);
      
      const adjustmentsData = await adjustmentsRes.json();
      const teachersData = await teachersRes.json();
      
      if (adjustmentsData.success) {
        setAdjustments(adjustmentsData.data);
      }
      
      if (teachersData.success) {
        setAvailableTeachers(teachersData.data);
      }
    } catch (error) {
      console.error('获取数据失败:', error);
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
  const handleOpenProcess = async (adjust: CourseAdjustmentItem) => {
    setSelectedAdjust(adjust);
    setProcessForm({
      adjustType: 'substitute',
      substituteTeacherId: '',
      remark: '',
    });
    
    // 获取该时间段可用的教师
    try {
      const res = await fetch(
        `/api/schedule-changes?action=available-teachers&subject=${adjust.originalSubject}&weekDay=${adjust.originalWeekDay}&periodIndex=${adjust.originalPeriodIndex}`
      );
      const data = await res.json();
      if (data.success) {
        setAvailableTeachers(data.data);
      }
    } catch (error) {
      console.error('获取可用教师失败:', error);
    }
    
    setShowProcessDialog(true);
  };

  // 打开详情对话框
  const handleOpenDetail = (adjust: CourseAdjustmentItem) => {
    setSelectedAdjust(adjust);
    setShowDetailDialog(true);
  };

  // 提交处理
  const handleSubmitProcess = async () => {
    if (!selectedAdjust) return;
    if (processForm.adjustType === 'substitute' && !processForm.substituteTeacherId) {
      alert('请选择代课教师');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const response = await fetch('/api/schedule-changes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'arrange',
          recordId: selectedAdjust.id,
          adjustType: processForm.adjustType,
          substituteTeacherId: processForm.substituteTeacherId,
          substituteTeacherName: availableTeachers.find(t => t.id === processForm.substituteTeacherId)?.name,
          handlerId: 'current-user', // 实际应从登录状态获取
          handlerName: '当前年段长',
          remark: processForm.remark,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // 刷新数据
        await fetchData();
        
        // 同步到排课系统
        try {
          await fetch('/api/schedule', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'update-slot',
              slotId: selectedAdjust.id,
              updates: {
                teacherId: processForm.substituteTeacherId,
                teacherName: availableTeachers.find(t => t.id === processForm.substituteTeacherId)?.name,
                status: 'substituted',
                substituteRecordId: selectedAdjust.id,
              },
            }),
          });
        } catch (error) {
          console.error('同步课表失败:', error);
        }
        
        setShowProcessDialog(false);
        setSelectedAdjust(null);
      }
      
    } catch (error) {
      console.error('处理调课失败:', error);
      alert('处理失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  // 推荐代课教师
  const getRecommendedTeachers = (adjust: CourseAdjustmentItem) => {
    return availableTeachers
      .filter(t => t.available && (t.subjects.includes(adjust.originalSubject)))
      .slice(0, 3);
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
                            {adjust.leaveType}
                          </Badge>
                          <span className="text-sm text-gray-500">{adjust.createdAt}</span>
                        </div>
                        <div className="flex items-center gap-4 mb-2">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{adjust.applicantName}</span>
                            <span className="text-sm text-gray-500">({adjust.applicantSubject})</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            {adjust.leaveStartDate}
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">原课程：</span>
                          {adjust.originalClassName} · {weekDayNames[adjust.originalWeekDay]} {adjust.originalPeriodName} · {adjust.originalSubject}
                        </div>
                        <div className="text-sm text-gray-500">
                          <span className="font-medium">请假原因：</span>{adjust.leaveReason}
                        </div>
                        
                        {/* 推荐代课教师 */}
                        <div className="mt-3 p-3 bg-white rounded-lg border border-orange-100">
                          <div className="flex items-center gap-1 text-sm font-medium text-orange-600 mb-2">
                            <Users className="h-4 w-4" />
                            推荐代课教师
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {getRecommendedTeachers(adjust).map(teacher => (
                              <Badge 
                                key={teacher.id} 
                                variant="outline" 
                                className="cursor-pointer hover:bg-orange-100 border-orange-200"
                              >
                                {teacher.name}（{teacher.subjects.join(', ')}）
                              </Badge>
                            ))}
                            {getRecommendedTeachers(adjust).length === 0 && (
                              <span className="text-sm text-gray-400">暂无推荐</span>
                            )}
                          </div>
                        </div>
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
                            {getAdjustTypeName(adjust.adjustType)}
                          </Badge>
                          <span className="text-sm text-gray-500">{adjust.handledAt}</span>
                        </div>
                        <div className="flex items-center gap-4 mb-2">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{adjust.applicantName}</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            <span className="text-green-600 font-medium">{adjust.substituteTeacherName}</span> 代课
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          {adjust.originalClassName} · {weekDayNames[adjust.originalWeekDay]} {adjust.originalPeriodName}
                        </div>
                        {adjust.remark && (
                          <div className="text-sm text-gray-500 mt-1">备注：{adjust.remark}</div>
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
                          <span className="text-sm text-gray-500">{adjust.createdAt}</span>
                        </div>
                        <div className="text-sm">
                          {adjust.applicantName} · {adjust.originalClassName} · {adjust.originalSubject}
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

      {/* 处理调课对话框 */}
      <Dialog open={showProcessDialog} onOpenChange={setShowProcessDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>处理调课申请</DialogTitle>
            <DialogDescription>
              为 {selectedAdjust?.applicantName} 老师的请假安排调课
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* 原课程信息 */}
            <div className="p-3 bg-gray-50 rounded-lg space-y-1">
              <div className="text-sm"><span className="text-gray-500">班级：</span>{selectedAdjust?.originalClassName}</div>
              <div className="text-sm"><span className="text-gray-500">时间：</span>{weekDayNames[selectedAdjust?.originalWeekDay || 0]} {selectedAdjust?.originalPeriodName}</div>
              <div className="text-sm"><span className="text-gray-500">课程：</span>{selectedAdjust?.originalSubject}</div>
              <div className="text-sm"><span className="text-gray-500">请假原因：</span>{selectedAdjust?.leaveReason}</div>
            </div>

            {/* 调课方式 */}
            <div className="space-y-2">
              <Label>调课方式</Label>
              <Select 
                value={processForm.adjustType} 
                onValueChange={(v) => setProcessForm({ ...processForm, adjustType: v as typeof processForm.adjustType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="substitute">安排代课</SelectItem>
                  <SelectItem value="swap">课程调换</SelectItem>
                  <SelectItem value="cancel">取消课程</SelectItem>
                  <SelectItem value="makeup">后期补课</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 代课教师选择 */}
            {processForm.adjustType === 'substitute' && (
              <div className="space-y-2">
                <Label>选择代课教师</Label>
                <Select 
                  value={processForm.substituteTeacherId} 
                  onValueChange={(v) => setProcessForm({ ...processForm, substituteTeacherId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="请选择代课教师" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTeachers.filter(t => t.available).map(teacher => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.name}（{teacher.subjects.join(', ')}）
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 备注 */}
            <div className="space-y-2">
              <Label>备注说明</Label>
              <Textarea
                value={processForm.remark}
                onChange={(e) => setProcessForm({ ...processForm, remark: e.target.value })}
                placeholder="填写调课安排说明..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProcessDialog(false)}>取消</Button>
            <Button 
              onClick={handleSubmitProcess}
              disabled={submitting}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  处理中...
                </>
              ) : (
                '确认安排'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 详情对话框 */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>调课详情</DialogTitle>
          </DialogHeader>

          {selectedAdjust && (
            <div className="space-y-3 py-4">
              <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">状态</span>
                  {getStatusBadge(selectedAdjust.status)}
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">申请人</span>
                  <span>{selectedAdjust.applicantName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">请假类型</span>
                  <span>{selectedAdjust.leaveType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">请假时间</span>
                  <span>{selectedAdjust.leaveStartDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">原班级</span>
                  <span>{selectedAdjust.originalClassName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">原课程</span>
                  <span>{selectedAdjust.originalSubject}</span>
                </div>
                {selectedAdjust.substituteTeacherName && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-500">代课教师</span>
                      <span className="text-green-600 font-medium">{selectedAdjust.substituteTeacherName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">处理人</span>
                      <span>{selectedAdjust.handlerName}</span>
                    </div>
                  </>
                )}
              </div>
              
              {selectedAdjust.remark && (
                <div>
                  <Label className="text-sm font-medium">备注</Label>
                  <p className="text-sm text-gray-600 mt-1">{selectedAdjust.remark}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
