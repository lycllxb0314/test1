'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
  Calendar,
  Clock,
  MapPin,
  Users,
  Monitor,
  Mic,
  Volume2,
  AirVent,
  Wifi,
  Video,
  Camera,
  Plus,
  Search,
  CheckCircle,
  AlertTriangle,
  DoorOpen,
  FileText,
  Send,
  CalendarDays,
  AlertCircle,
  Info,
  Presentation,
} from 'lucide-react';
import { Room, RoomBooking, BookingPurpose, BookingStatus } from '@/types';

// 模拟可用教室数据
const mockAvailableRooms: Room[] = [
  {
    id: 'room-001',
    name: '2号楼教研室',
    code: 'BLD2-SR01',
    type: 'seminar_room',
    building: '2号楼',
    floor: 3,
    location: '2号楼3层东侧',
    capacity: 30,
    area: 80,
    facilities: {
      projector: true, computer: true, microphone: true, speaker: true,
      whiteboard: true, blackboard: false, airConditioner: true, wifi: true,
      videoConference: false, recording: false,
    },
    status: 'available',
    createdAt: '2023-09-01',
    updatedAt: '2024-03-15',
  },
  {
    id: 'room-002',
    name: '4号楼教研室',
    code: 'BLD4-SR01',
    type: 'seminar_room',
    building: '4号楼',
    floor: 2,
    location: '4号楼2层西侧',
    capacity: 25,
    area: 65,
    facilities: {
      projector: true, computer: true, microphone: false, speaker: true,
      whiteboard: true, blackboard: true, airConditioner: true, wifi: true,
      videoConference: false, recording: false,
    },
    status: 'available',
    createdAt: '2023-09-01',
    updatedAt: '2024-03-15',
  },
  {
    id: 'room-003',
    name: '1号楼阶梯教室',
    code: 'BLD1-LH01',
    type: 'lecture_hall',
    building: '1号楼',
    floor: 1,
    location: '1号楼1层大厅',
    capacity: 200,
    area: 350,
    facilities: {
      projector: true, computer: true, microphone: true, speaker: true,
      whiteboard: false, blackboard: true, airConditioner: true, wifi: true,
      videoConference: true, recording: true,
    },
    status: 'available',
    createdAt: '2023-09-01',
    updatedAt: '2024-03-15',
  },
  {
    id: 'room-005',
    name: '综合楼会议室',
    code: 'GEN-MR01',
    type: 'meeting_room',
    building: '综合楼',
    floor: 5,
    location: '综合楼5层',
    capacity: 20,
    area: 50,
    facilities: {
      projector: true, computer: false, microphone: false, speaker: false,
      whiteboard: true, blackboard: false, airConditioner: true, wifi: true,
      videoConference: true, recording: false,
    },
    status: 'available',
    createdAt: '2023-09-01',
    updatedAt: '2024-03-14',
  },
  {
    id: 'room-006',
    name: '2号楼小型教研室',
    code: 'BLD2-SR02',
    type: 'seminar_room',
    building: '2号楼',
    floor: 2,
    location: '2号楼2层南侧',
    capacity: 15,
    area: 40,
    facilities: {
      projector: false, computer: false, microphone: false, speaker: false,
      whiteboard: true, blackboard: false, airConditioner: true, wifi: true,
      videoConference: false, recording: false,
    },
    status: 'available',
    createdAt: '2023-09-01',
    updatedAt: '2024-03-13',
  },
];

// 模拟我的申请记录
const mockMyBookings: RoomBooking[] = [
  {
    id: 'b001',
    roomId: 'room-001', roomName: '2号楼教研室', roomType: 'seminar_room',
    building: '2号楼', location: '2号楼3层东侧',
    applicantId: 't001', applicantName: '张明华', applicantRole: 'subject_teacher', department: '语文组',
    purpose: 'meeting', title: '语文教研组集体备课',
    bookingDate: '2024-03-18', startTime: '14:00', endTime: '16:00', duration: 120,
    expectedAttendees: 15, attendeeType: 'teacher',
    status: 'approved', approvalFlow: [], currentStep: 1,
    createdAt: '2024-03-15 10:30', updatedAt: '2024-03-15 11:00',
  },
  {
    id: 'b002',
    roomId: 'room-003', roomName: '1号楼阶梯教室', roomType: 'lecture_hall',
    building: '1号楼', location: '1号楼1层大厅',
    applicantId: 't001', applicantName: '张明华', applicantRole: 'subject_teacher', department: '语文组',
    purpose: 'training', title: '青年教师教学技能培训',
    bookingDate: '2024-03-20', startTime: '09:00', endTime: '11:30', duration: 150,
    expectedAttendees: 80, attendeeType: 'teacher',
    status: 'pending', approvalFlow: [], currentStep: 0,
    createdAt: '2024-03-15 14:00', updatedAt: '2024-03-15 14:00',
  },
  {
    id: 'b003',
    roomId: 'room-002', roomName: '4号楼教研室', roomType: 'seminar_room',
    building: '4号楼', location: '4号楼2层西侧',
    applicantId: 't001', applicantName: '张明华', applicantRole: 'subject_teacher', department: '语文组',
    purpose: 'other', title: '家长座谈会',
    bookingDate: '2024-03-12', startTime: '15:00', endTime: '17:00', duration: 120,
    expectedAttendees: 25, attendeeType: 'mixed',
    status: 'completed', approvalFlow: [], currentStep: 2,
    actualStartTime: '15:00', actualEndTime: '16:45', actualAttendees: 22,
    createdAt: '2024-03-10 09:00', updatedAt: '2024-03-12 17:00',
  },
];

// 用途类型映射
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

// 状态映射
const statusMap: Record<BookingStatus, { label: string; color: string; icon: any }> = {
  pending: { label: '待审批', color: 'text-orange-600 bg-orange-50', icon: Clock },
  approved: { label: '已批准', color: 'text-green-600 bg-green-50', icon: CheckCircle },
  rejected: { label: '已拒绝', color: 'text-red-600 bg-red-50', icon: AlertTriangle },
  cancelled: { label: '已取消', color: 'text-gray-600 bg-gray-50', icon: AlertCircle },
  completed: { label: '已完成', color: 'text-blue-600 bg-blue-50', icon: CheckCircle },
  in_progress: { label: '进行中', color: 'text-purple-600 bg-purple-50', icon: Clock },
};

// 设施图标
const facilityIconMap: Record<string, { icon: any; label: string }> = {
  projector: { icon: Monitor, label: '投影仪' },
  computer: { icon: Monitor, label: '电脑' },
  microphone: { icon: Mic, label: '麦克风' },
  speaker: { icon: Volume2, label: '音响' },
  whiteboard: { icon: Presentation, label: '白板' },
  airConditioner: { icon: AirVent, label: '空调' },
  wifi: { icon: Wifi, label: 'WiFi' },
  videoConference: { icon: Video, label: '视频会议' },
  recording: { icon: Camera, label: '录播' },
};

export default function RoomBookingPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('upcoming');
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<RoomBooking | null>(null);

  // 新预约表单
  const [bookingForm, setBookingForm] = useState({
    roomId: '',
    purpose: 'meeting' as BookingPurpose,
    title: '',
    description: '',
    bookingDate: '',
    startTime: '',
    endTime: '',
    expectedAttendees: 0,
    attendeeType: 'teacher' as const,
    requiredFacilities: [] as string[],
    cleaningRequired: false,
  });

  // 过滤我的申请
  const filteredBookings = mockMyBookings.filter(booking => {
    const matchSearch = booking.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        booking.roomName.toLowerCase().includes(searchTerm.toLowerCase());
    if (dateFilter === 'upcoming') {
      return booking.status !== 'completed' && booking.status !== 'cancelled';
    } else if (dateFilter === 'completed') {
      return booking.status === 'completed';
    }
    return matchSearch;
  });

  // 统计
  const stats = {
    total: mockMyBookings.length,
    pending: mockMyBookings.filter(b => b.status === 'pending').length,
    approved: mockMyBookings.filter(b => b.status === 'approved').length,
    completed: mockMyBookings.filter(b => b.status === 'completed').length,
  };

  // 计算时长
  const calculateDuration = (start: string, end: string) => {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    return (eh * 60 + em) - (sh * 60 + sm);
  };

  // 提交预约
  const handleSubmitBooking = () => {
    // 这里会调用API
    setShowBookingDialog(false);
    setSelectedRoom(null);
    setBookingForm({
      roomId: '', purpose: 'meeting', title: '', description: '',
      bookingDate: '', startTime: '', endTime: '',
      expectedAttendees: 0, attendeeType: 'teacher',
      requiredFacilities: [], cleaningRequired: false,
    });
  };

  // 打开预约对话框
  const handleOpenBooking = (room: Room) => {
    setSelectedRoom(room);
    setBookingForm(prev => ({ ...prev, roomId: room.id }));
    setShowBookingDialog(true);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-indigo-50/30 via-white to-purple-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="h-7 w-7 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-900">教室预约</h1>
          </div>
          <p className="text-gray-500 mt-1">申请使用教研室、阶梯教室等场所</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2" onClick={() => setShowBookingDialog(true)}>
          <Plus className="h-4 w-4" />
          新建预约
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">我的申请</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
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
                <p className="text-sm text-gray-500">已完成</p>
                <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
              </div>
              <CalendarDays className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 双栏布局 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 左侧：可预约教室 */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">可预约教室</CardTitle>
                  <CardDescription>选择需要使用的教室</CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="搜索教室..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-48"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {mockAvailableRooms.map(room => (
                  <div
                    key={room.id}
                    className="p-4 rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => handleOpenBooking(room)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900">{room.name}</h3>
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {room.location}
                        </p>
                      </div>
                      <Badge className="bg-green-100 text-green-700">可预约</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {room.capacity}人
                      </span>
                      <span className="flex items-center gap-1">
                        <DoorOpen className="h-4 w-4" />
                        {room.area}m²
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(room.facilities).filter(([_, v]) => v).slice(0, 4).map(([key]) => {
                        const facility = facilityIconMap[key];
                        if (!facility) return null;
                        return (
                          <span key={key} className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-600">
                            {facility.label}
                          </span>
                        );
                      })}
                      {Object.values(room.facilities).filter(Boolean).length > 4 && (
                        <span className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-600">
                          +{Object.values(room.facilities).filter(Boolean).length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 我的申请记录 */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">我的申请</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant={dateFilter === 'upcoming' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDateFilter('upcoming')}
                    className={dateFilter === 'upcoming' ? 'bg-indigo-600' : ''}
                  >
                    进行中
                  </Button>
                  <Button
                    variant={dateFilter === 'completed' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDateFilter('completed')}
                    className={dateFilter === 'completed' ? 'bg-indigo-600' : ''}
                  >
                    已完成
                  </Button>
                  <Button
                    variant={dateFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDateFilter('all')}
                    className={dateFilter === 'all' ? 'bg-indigo-600' : ''}
                  >
                    全部
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredBookings.map(booking => {
                  const statusInfo = statusMap[booking.status];
                  const StatusIcon = statusInfo.icon;
                  return (
                    <div
                      key={booking.id}
                      className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                      onClick={() => { setSelectedBooking(booking); setShowDetailDialog(true); }}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{booking.title}</span>
                          <Badge className={statusInfo.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusInfo.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {booking.roomName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {booking.bookingDate}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {booking.startTime}-{booking.endTime}
                          </span>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">查看</Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧：使用须知与快速预约 */}
        <div className="space-y-4">
          {/* 使用须知 */}
          <Card className="border-0 shadow-md bg-gradient-to-br from-indigo-50 to-purple-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="h-5 w-5 text-indigo-600" />
                使用须知
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-2">
              <p>1. 请提前1-3个工作日预约，大型活动需提前5个工作日</p>
              <p>2. 阶梯教室容量较大，请根据实际人数合理选择</p>
              <p>3. 使用完毕请关闭设备电源，保持环境整洁</p>
              <p>4. 如需取消预约，请提前24小时通知</p>
              <p>5. 设备问题请及时联系总务处报修</p>
            </CardContent>
          </Card>

          {/* 今日预约概览 */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">今日预约</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="p-3 rounded-lg bg-green-50 border border-green-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-green-900">2号楼教研室</span>
                    <Badge className="bg-green-200 text-green-800">已批准</Badge>
                  </div>
                  <p className="text-xs text-green-700">14:00-16:00 · 语文教研组备课</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50">
                  <p className="text-sm text-gray-500 text-center">暂无其他预约</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 快捷操作 */}
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="h-auto py-3 flex-col" asChild>
                  <a href="/academic/rooms">
                    <DoorOpen className="h-5 w-5 mb-1" />
                    <span className="text-xs">教室管理</span>
                  </a>
                </Button>
                <Button variant="outline" className="h-auto py-3 flex-col" asChild>
                  <a href="/general/repairs">
                    <AlertTriangle className="h-5 w-5 mb-1" />
                    <span className="text-xs">设备报修</span>
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 新建预约对话框 */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-indigo-600" />
              申请教室使用
            </DialogTitle>
            <DialogDescription>
              {selectedRoom ? `预约：${selectedRoom.name}` : '选择要预约的教室'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            {/* 选择教室 */}
            {!selectedRoom && (
              <div className="space-y-2">
                <Label>选择教室 *</Label>
                <Select value={bookingForm.roomId} onValueChange={(v) => {
                  const room = mockAvailableRooms.find(r => r.id === v);
                  if (room) setSelectedRoom(room);
                  setBookingForm(prev => ({ ...prev, roomId: v }));
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择要预约的教室" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockAvailableRooms.map(room => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.name} ({room.capacity}人) - {room.location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 教室信息 */}
            {selectedRoom && (
              <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-indigo-900">{selectedRoom.name}</p>
                    <p className="text-xs text-indigo-600">{selectedRoom.location} · {selectedRoom.capacity}人</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedRoom(null)}>
                    更换
                  </Button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>活动类型</Label>
                <Select value={bookingForm.purpose} onValueChange={(v) => setBookingForm(prev => ({ ...prev, purpose: v as BookingPurpose }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meeting">教研会议</SelectItem>
                    <SelectItem value="teaching">教学活动</SelectItem>
                    <SelectItem value="training">培训讲座</SelectItem>
                    <SelectItem value="activity">学生活动</SelectItem>
                    <SelectItem value="exam">考试</SelectItem>
                    <SelectItem value="defense">答辩</SelectItem>
                    <SelectItem value="competition">比赛</SelectItem>
                    <SelectItem value="other">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>预计人数</Label>
                <Input
                  type="number"
                  value={bookingForm.expectedAttendees || ''}
                  onChange={(e) => setBookingForm(prev => ({ ...prev, expectedAttendees: Number(e.target.value) }))}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>活动标题 *</Label>
              <Input
                value={bookingForm.title}
                onChange={(e) => setBookingForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="如：语文教研组集体备课"
              />
            </div>

            <div className="space-y-2">
              <Label>活动说明</Label>
              <Textarea
                value={bookingForm.description}
                onChange={(e) => setBookingForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="简要说明活动内容和目的"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>预约日期 *</Label>
                <Input
                  type="date"
                  value={bookingForm.bookingDate}
                  onChange={(e) => setBookingForm(prev => ({ ...prev, bookingDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>开始时间 *</Label>
                <Input
                  type="time"
                  value={bookingForm.startTime}
                  onChange={(e) => setBookingForm(prev => ({ ...prev, startTime: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>结束时间 *</Label>
                <Input
                  type="time"
                  value={bookingForm.endTime}
                  onChange={(e) => setBookingForm(prev => ({ ...prev, endTime: e.target.value }))}
                />
              </div>
            </div>

            {bookingForm.startTime && bookingForm.endTime && (
              <div className="p-2 rounded bg-gray-50 text-sm text-gray-600">
                预计使用时长：{calculateDuration(bookingForm.startTime, bookingForm.endTime)} 分钟
              </div>
            )}

            <div className="space-y-2">
              <Label>需要使用的设备</Label>
              <div className="flex flex-wrap gap-2">
                {selectedRoom && Object.entries(selectedRoom.facilities).filter(([_, v]) => v).map(([key]) => {
                  const facility = facilityIconMap[key];
                  if (!facility) return null;
                  return (
                    <label key={key} className="flex items-center gap-2 px-3 py-1.5 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <Checkbox
                        checked={bookingForm.requiredFacilities.includes(key)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setBookingForm(prev => ({ ...prev, requiredFacilities: [...prev.requiredFacilities, key] }));
                          } else {
                            setBookingForm(prev => ({ ...prev, requiredFacilities: prev.requiredFacilities.filter(f => f !== key) }));
                          }
                        }}
                      />
                      <span className="text-sm">{facility.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="cleaning"
                checked={bookingForm.cleaningRequired}
                onCheckedChange={(checked) => setBookingForm(prev => ({ ...prev, cleaningRequired: !!checked }))}
              />
              <Label htmlFor="cleaning" className="text-sm font-normal">
                活动结束后需要保洁服务（将通知总务处）
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBookingDialog(false)}>取消</Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 gap-2"
              onClick={handleSubmitBooking}
              disabled={!bookingForm.roomId || !bookingForm.title || !bookingForm.bookingDate || !bookingForm.startTime || !bookingForm.endTime}
            >
              <Send className="h-4 w-4" />
              提交申请
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 预约详情对话框 */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>预约详情</DialogTitle>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-lg bg-gray-50">
                <h3 className="font-medium text-lg mb-2">{selectedBooking.title}</h3>
                <Badge className={statusMap[selectedBooking.status].color}>
                  {statusMap[selectedBooking.status].label}
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
                  <Label className="text-gray-500 text-xs">日期</Label>
                  <p className="font-medium">{selectedBooking.bookingDate}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">时间</Label>
                  <p className="font-medium">{selectedBooking.startTime} - {selectedBooking.endTime}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">活动类型</Label>
                  <p className="font-medium">{purposeMap[selectedBooking.purpose].label}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">参与人数</Label>
                  <p className="font-medium">{selectedBooking.expectedAttendees} 人</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <Label className="text-gray-500 text-xs">申请时间</Label>
                <p className="text-sm">{selectedBooking.createdAt}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>关闭</Button>
            {selectedBooking?.status === 'pending' && (
              <Button variant="outline" className="text-red-600 border-red-200">取消预约</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
