'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  MapPin,
  Users,
  Search,
  FileText,
  AlertTriangle,
  User,
  Building,
  Phone,
  MessageSquare,
  Check,
  X,
  Eye,
  Send,
} from 'lucide-react';
import { RoomBooking, BookingStatus, BookingPurpose } from '@/types';

// 模拟审批数据
const mockPendingApprovals: RoomBooking[] = [
  {
    id: 'b004',
    roomId: 'room-003', roomName: '1号楼阶梯教室', roomType: 'lecture_hall',
    building: '1号楼', location: '1号楼1层大厅',
    applicantId: 't002', applicantName: '李晓红', applicantRole: 'teacher', department: '数学组',
    purpose: 'training', title: '数学思维训练公开课',
    bookingDate: '2024-03-22', startTime: '09:00', endTime: '11:00', duration: 120,
    expectedAttendees: 120, attendeeType: 'student',
    description: '邀请市教研员开展数学思维训练公开课，面向四年级全体学生',
    status: 'pending', approvalFlow: [], currentStep: 0,
    createdAt: '2024-03-15 16:00', updatedAt: '2024-03-15 16:00',
  },
  {
    id: 'b005',
    roomId: 'room-005', roomName: '综合楼会议室', roomType: 'meeting_room',
    building: '综合楼', location: '综合楼5层',
    applicantId: 't003', applicantName: '王建国', applicantRole: 'teacher', department: '科学组',
    purpose: 'meeting', title: '科学教研组期中研讨会',
    bookingDate: '2024-03-19', startTime: '14:00', endTime: '16:30', duration: 150,
    expectedAttendees: 12, attendeeType: 'teacher',
    description: '讨论期中考试命题方案及实验教学改进措施',
    status: 'pending', approvalFlow: [], currentStep: 0,
    createdAt: '2024-03-15 17:30', updatedAt: '2024-03-15 17:30',
  },
  {
    id: 'b006',
    roomId: 'room-001', roomName: '2号楼教研室', roomType: 'seminar_room',
    building: '2号楼', location: '2号楼3层东侧',
    applicantId: 't004', applicantName: '赵明华', applicantRole: 'teacher', department: '语文组',
    purpose: 'activity', title: '学生经典诵读比赛彩排',
    bookingDate: '2024-03-20', startTime: '15:30', endTime: '17:30', duration: 120,
    expectedAttendees: 28, attendeeType: 'student',
    cleaningRequired: true,
    status: 'pending', approvalFlow: [], currentStep: 0,
    createdAt: '2024-03-15 18:00', updatedAt: '2024-03-15 18:00',
  },
];

const mockAllBookings: RoomBooking[] = [
  ...mockPendingApprovals,
  {
    id: 'b001',
    roomId: 'room-001', roomName: '2号楼教研室', roomType: 'seminar_room',
    building: '2号楼', location: '2号楼3层东侧',
    applicantId: 't001', applicantName: '张明华', applicantRole: 'teacher', department: '语文组',
    purpose: 'meeting', title: '语文教研组集体备课',
    bookingDate: '2024-03-18', startTime: '14:00', endTime: '16:00', duration: 120,
    expectedAttendees: 15, attendeeType: 'teacher',
    status: 'approved', approvalFlow: [], currentStep: 1,
    createdAt: '2024-03-15 10:30', updatedAt: '2024-03-15 11:00',
  },
  {
    id: 'b007',
    roomId: 'room-003', roomName: '1号楼阶梯教室', roomType: 'lecture_hall',
    building: '1号楼', location: '1号楼1层大厅',
    applicantId: 't005', applicantName: '陈雨婷', applicantRole: 'teacher', department: '英语组',
    purpose: 'competition', title: '英语演讲比赛',
    bookingDate: '2024-03-17', startTime: '13:30', endTime: '16:00', duration: 150,
    expectedAttendees: 80, attendeeType: 'student',
    status: 'rejected', approvalFlow: [], currentStep: 0,
    rejectReason: '该时段已有学校重要会议安排，请选择其他时间',
    createdAt: '2024-03-14 09:00', updatedAt: '2024-03-14 15:00',
  },
  {
    id: 'b008',
    roomId: 'room-002', roomName: '4号楼教研室', roomType: 'seminar_room',
    building: '4号楼', location: '4号楼2层西侧',
    applicantId: 't006', applicantName: '刘志强', applicantRole: 'teacher', department: '体育组',
    purpose: 'meeting', title: '体育组教学计划讨论',
    bookingDate: '2024-03-12', startTime: '15:00', endTime: '17:00', duration: 120,
    expectedAttendees: 8, attendeeType: 'teacher',
    status: 'completed', approvalFlow: [], currentStep: 2,
    actualStartTime: '15:00', actualEndTime: '16:45', actualAttendees: 8,
    createdAt: '2024-03-10 09:00', updatedAt: '2024-03-12 17:00',
  },
];

// 状态映射
const statusMap: Record<BookingStatus, { label: string; color: string; icon: any }> = {
  pending: { label: '待审批', color: 'text-orange-600 bg-orange-50', icon: Clock },
  approved: { label: '已批准', color: 'text-green-600 bg-green-50', icon: CheckCircle },
  rejected: { label: '已拒绝', color: 'text-red-600 bg-red-50', icon: XCircle },
  cancelled: { label: '已取消', color: 'text-gray-600 bg-gray-50', icon: AlertTriangle },
  completed: { label: '已完成', color: 'text-blue-600 bg-blue-50', icon: CheckCircle },
  in_progress: { label: '进行中', color: 'text-purple-600 bg-purple-50', icon: Clock },
};

// 用途映射
const purposeMap: Record<BookingPurpose, { label: string; color: string }> = {
  teaching: { label: '教学活动', color: 'text-blue-600 bg-blue-50' },
  meeting: { label: '教研会议', color: 'text-green-600 bg-green-50' },
  training: { label: '培训讲座', color: 'text-purple-600 bg-purple-50' },
  activity: { label: '学生活动', color: 'text-pink-600 bg-pink-50' },
  exam: { label: '考试', color: 'text-orange-600 bg-orange-50' },
  defense: { label: '答辩', color: 'text-teal-600 bg-teal-50' },
  competition: { label: '比赛', color: 'text-indigo-600 bg-indigo-50' },
  other: { label: '其他', color: 'text-gray-600 bg-gray-50' },
};

export default function RoomApprovalPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [purposeFilter, setPurposeFilter] = useState<string>('all');
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<RoomBooking | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [approvalNote, setApprovalNote] = useState('');

  // 过滤预约
  const filteredBookings = mockAllBookings.filter(booking => {
    const matchSearch = booking.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        booking.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        booking.roomName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || booking.status === statusFilter;
    const matchPurpose = purposeFilter === 'all' || booking.purpose === purposeFilter;
    return matchSearch && matchStatus && matchPurpose;
  });

  // 统计
  const stats = {
    pending: mockAllBookings.filter(b => b.status === 'pending').length,
    approved: mockAllBookings.filter(b => b.status === 'approved').length,
    rejected: mockAllBookings.filter(b => b.status === 'rejected').length,
    completed: mockAllBookings.filter(b => b.status === 'completed').length,
  };

  // 批准预约
  const handleApprove = () => {
    // 这里调用API
    setShowApproveDialog(false);
    setSelectedBooking(null);
    setApprovalNote('');
  };

  // 拒绝预约
  const handleReject = () => {
    // 这里调用API
    setShowRejectDialog(false);
    setSelectedBooking(null);
    setRejectReason('');
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-indigo-50/30 via-white to-purple-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="h-7 w-7 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-900">预约审批</h1>
          </div>
          <p className="text-gray-500 mt-1">审核教室使用申请，管理预约记录</p>
        </div>
        <Badge className="bg-orange-100 text-orange-700 px-3 py-1 text-base">
          {stats.pending} 条待审批
        </Badge>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">待审批</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">已批准</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">已拒绝</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">已完成</p>
                <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 主内容区 */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="bg-white border shadow-sm">
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            待审批
            {stats.pending > 0 && (
              <Badge className="ml-1 bg-orange-500 text-white">{stats.pending}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-2">
            <FileText className="h-4 w-4" />
            全部记录
          </TabsTrigger>
        </TabsList>

        {/* 待审批 */}
        <TabsContent value="pending" className="space-y-4">
          {mockPendingApprovals.length === 0 ? (
            <Card className="border-0 shadow-md">
              <CardContent className="py-12 text-center text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>暂无待审批的预约申请</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {mockPendingApprovals.map(booking => (
                <Card key={booking.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg text-gray-900">{booking.title}</h3>
                          <Badge className={purposeMap[booking.purpose].color}>
                            {purposeMap[booking.purpose].label}
                          </Badge>
                          {booking.cleaningRequired && (
                            <Badge className="bg-teal-50 text-teal-700">需保洁</Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span>{booking.roomName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span>{booking.bookingDate}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span>{booking.startTime} - {booking.endTime}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Users className="h-4 w-4 text-gray-400" />
                            <span>{booking.expectedAttendees} 人</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">申请人：</span>
                            <span className="font-medium">{booking.applicantName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Building className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">部门：</span>
                            <span className="font-medium">{booking.department}</span>
                          </div>
                          <div className="text-sm text-gray-400">
                            申请时间：{booking.createdAt}
                          </div>
                        </div>

                        {booking.description && (
                          <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-600">
                            {booking.description}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          className="bg-green-600 hover:bg-green-700 text-white gap-1"
                          onClick={() => { setSelectedBooking(booking); setShowApproveDialog(true); }}
                        >
                          <Check className="h-4 w-4" />
                          批准
                        </Button>
                        <Button
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50 gap-1"
                          onClick={() => { setSelectedBooking(booking); setShowRejectDialog(true); }}
                        >
                          <X className="h-4 w-4" />
                          拒绝
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setSelectedBooking(booking); setShowDetailDialog(true); }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          详情
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* 全部记录 */}
        <TabsContent value="all" className="space-y-4">
          {/* 筛选栏 */}
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="搜索活动名称、申请人或教室..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-28">
                    <SelectValue placeholder="状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    <SelectItem value="pending">待审批</SelectItem>
                    <SelectItem value="approved">已批准</SelectItem>
                    <SelectItem value="rejected">已拒绝</SelectItem>
                    <SelectItem value="completed">已完成</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={purposeFilter} onValueChange={setPurposeFilter}>
                  <SelectTrigger className="w-28">
                    <SelectValue placeholder="类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部类型</SelectItem>
                    <SelectItem value="meeting">教研会议</SelectItem>
                    <SelectItem value="teaching">教学活动</SelectItem>
                    <SelectItem value="training">培训讲座</SelectItem>
                    <SelectItem value="activity">学生活动</SelectItem>
                    <SelectItem value="competition">比赛</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* 列表 */}
          <Card className="border-0 shadow-md">
            <CardContent className="p-0 divide-y divide-gray-100">
              {filteredBookings.map(booking => {
                const statusInfo = statusMap[booking.status];
                const StatusIcon = statusInfo.icon;
                return (
                  <div
                    key={booking.id}
                    className="p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => { setSelectedBooking(booking); setShowDetailDialog(true); }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{booking.title}</span>
                          <Badge className={statusInfo.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusInfo.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>{booking.roomName}</span>
                          <span>{booking.bookingDate} {booking.startTime}-{booking.endTime}</span>
                          <span>{booking.applicantName}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">查看</Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 详情对话框 */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>预约详情</DialogTitle>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-lg bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-lg">{selectedBooking.title}</h3>
                  <Badge className={statusMap[selectedBooking.status].color}>
                    {statusMap[selectedBooking.status].label}
                  </Badge>
                </div>
                <Badge className={purposeMap[selectedBooking.purpose].color}>
                  {purposeMap[selectedBooking.purpose].label}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-gray-500 text-xs">教室</Label>
                  <p className="font-medium">{selectedBooking.roomName}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">位置</Label>
                  <p className="font-medium">{selectedBooking.location}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">预约日期</Label>
                  <p className="font-medium">{selectedBooking.bookingDate}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">使用时段</Label>
                  <p className="font-medium">{selectedBooking.startTime} - {selectedBooking.endTime}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">参与人数</Label>
                  <p className="font-medium">{selectedBooking.expectedAttendees} 人</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">申请人</Label>
                  <p className="font-medium">{selectedBooking.applicantName}</p>
                </div>
              </div>

              {selectedBooking.description && (
                <div>
                  <Label className="text-gray-500 text-xs">活动说明</Label>
                  <p className="text-sm bg-gray-50 p-2 rounded mt-1">{selectedBooking.description}</p>
                </div>
              )}

              {selectedBooking.rejectReason && (
                <div className="p-3 rounded bg-red-50 border border-red-100">
                  <Label className="text-red-700 text-xs">拒绝原因</Label>
                  <p className="text-sm text-red-800 mt-1">{selectedBooking.rejectReason}</p>
                </div>
              )}

              <div className="border-t pt-4 text-sm text-gray-500">
                <p>申请时间：{selectedBooking.createdAt}</p>
                <p>更新时间：{selectedBooking.updatedAt}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>关闭</Button>
            {selectedBooking?.status === 'pending' && (
              <>
                <Button
                  variant="outline"
                  className="text-red-600 border-red-200"
                  onClick={() => { setShowDetailDialog(false); setShowRejectDialog(true); }}
                >
                  拒绝
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => { setShowDetailDialog(false); setShowApproveDialog(true); }}
                >
                  批准
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 批准对话框 */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              批准预约
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="text-gray-600 mb-4">
              确认批准 <span className="font-medium">{selectedBooking?.applicantName}</span> 的预约申请：
              <span className="font-medium">{selectedBooking?.title}</span>
            </p>

            <div className="space-y-2">
              <Label>审批备注（可选）</Label>
              <Textarea
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
                placeholder="填写审批意见或备注信息"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>取消</Button>
            <Button className="bg-green-600 hover:bg-green-700 gap-2" onClick={handleApprove}>
              <Check className="h-4 w-4" />
              确认批准
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 拒绝对话框 */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <XCircle className="h-5 w-5" />
              拒绝预约
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="text-gray-600 mb-4">
              拒绝 <span className="font-medium">{selectedBooking?.applicantName}</span> 的预约申请：
              <span className="font-medium">{selectedBooking?.title}</span>
            </p>

            <div className="space-y-2">
              <Label>拒绝原因 *</Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="请填写拒绝原因，将通知申请人"
                rows={3}
              />
            </div>

            <div className="mt-4 p-3 rounded bg-red-50 border border-red-100">
              <p className="text-sm text-red-700">
                <AlertTriangle className="h-4 w-4 inline mr-1" />
                拒绝后申请人将收到通知，请说明原因以便其调整安排
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>取消</Button>
            <Button
              variant="destructive"
              className="gap-2"
              onClick={handleReject}
              disabled={!rejectReason.trim()}
            >
              <X className="h-4 w-4" />
              确认拒绝
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
