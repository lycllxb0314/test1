'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
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
  DoorOpen,
  Calendar,
  Clock,
  Users,
  Search,
  Plus,
  Building,
  MapPin,
  CheckCircle,
  AlertTriangle,
  FileText,
  Loader2,
  Filter,
  XCircle,
  Send,
  Eye,
  Trash2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// 类型定义
type RoomType = 'seminar_room' | 'lecture_hall' | 'multimedia_room' | 'lab' | 'meeting_room' | 'activity_room';
type RoomStatus = 'available' | 'in_use' | 'reserved' | 'maintenance' | 'locked';
type BookingStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed' | 'in_progress';
type BookingPurpose = 'teaching' | 'meeting' | 'training' | 'activity' | 'exam' | 'defense' | 'competition' | 'other';

// 教室类型映射
const roomTypeMap: Record<RoomType, { label: string; color: string }> = {
  seminar_room: { label: '教研室', color: 'text-blue-600 bg-blue-50' },
  lecture_hall: { label: '阶梯教室', color: 'text-purple-600 bg-purple-50' },
  multimedia_room: { label: '多媒体教室', color: 'text-indigo-600 bg-indigo-50' },
  lab: { label: '实验室', color: 'text-teal-600 bg-teal-50' },
  meeting_room: { label: '会议室', color: 'text-green-600 bg-green-50' },
  activity_room: { label: '活动室', color: 'text-pink-600 bg-pink-50' },
};

// 教室状态映射
const roomStatusMap: Record<RoomStatus, { label: string; color: string }> = {
  available: { label: '空闲', color: 'text-green-600 bg-green-50' },
  in_use: { label: '使用中', color: 'text-blue-600 bg-blue-50' },
  reserved: { label: '已预约', color: 'text-orange-600 bg-orange-50' },
  maintenance: { label: '维护中', color: 'text-red-600 bg-red-50' },
  locked: { label: '已锁定', color: 'text-gray-600 bg-gray-50' },
};

// 预约状态映射
const bookingStatusMap: Record<BookingStatus, { label: string; color: string; icon: any }> = {
  pending: { label: '待审批', color: 'text-orange-600 bg-orange-50', icon: Clock },
  approved: { label: '已批准', color: 'text-green-600 bg-green-50', icon: CheckCircle },
  rejected: { label: '已拒绝', color: 'text-red-600 bg-red-50', icon: XCircle },
  cancelled: { label: '已取消', color: 'text-gray-600 bg-gray-50', icon: AlertTriangle },
  completed: { label: '已完成', color: 'text-blue-600 bg-blue-50', icon: CheckCircle },
  in_progress: { label: '进行中', color: 'text-purple-600 bg-purple-50', icon: Clock },
};

// 用途映射
const purposeOptions: { value: BookingPurpose; label: string }[] = [
  { value: 'teaching', label: '教学活动' },
  { value: 'meeting', label: '教研会议' },
  { value: 'training', label: '培训讲座' },
  { value: 'activity', label: '学生活动' },
  { value: 'exam', label: '考试' },
  { value: 'defense', label: '答辩' },
  { value: 'competition', label: '比赛' },
  { value: 'other', label: '其他' },
];

// API响应类型
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// 教室记录
interface RoomRecord {
  id: string;
  name: string;
  code: string;
  type: RoomType;
  building: string;
  floor: number | null;
  location: string | null;
  capacity: number | null;
  facilities: Record<string, boolean>;
  status: RoomStatus;
}

// 预约记录
interface BookingRecord {
  id: string;
  room_id: string;
  room_name: string;
  room_type: RoomType;
  building: string;
  location: string | null;
  applicant_id: string;
  applicant_name: string;
  purpose: BookingPurpose;
  title: string;
  description: string | null;
  booking_date: string;
  start_time: string;
  end_time: string;
  duration: number;
  expected_attendees: number;
  status: BookingStatus;
  reject_reason: string | null;
  created_at: string;
}

// 时间段选项
const timeSlots = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'
];

export default function TeacherRoomBookingPage() {
  const { user } = useAuth();
  
  // 数据状态
  const [rooms, setRooms] = useState<RoomRecord[]>([]);
  const [myBookings, setMyBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 筛选状态
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // 预约弹窗
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<RoomRecord | null>(null);
  const [bookingForm, setBookingForm] = useState({
    purpose: 'meeting' as BookingPurpose,
    title: '',
    description: '',
    bookingDate: '',
    startTime: '08:00',
    endTime: '09:00',
    expectedAttendees: 20,
  });
  const [submitting, setSubmitting] = useState(false);
  
  // 详情弹窗
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingRecord | null>(null);

  // 获取可用教室列表
  const fetchRooms = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set('status', 'available');
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (searchTerm) params.set('search', searchTerm);
      
      const res = await fetch(`/api/academic/rooms?${params.toString()}`);
      const data: ApiResponse<RoomRecord[]> = await res.json();
      
      if (data.success && data.data) {
        setRooms(data.data);
      }
    } catch (err) {
      console.error('获取教室列表失败:', err);
    }
  }, [typeFilter, searchTerm]);

  // 获取我的预约记录
  const fetchMyBookings = useCallback(async () => {
    try {
      const res = await fetch('/api/academic/rooms/bookings');
      const data: ApiResponse<BookingRecord[]> = await res.json();
      
      if (data.success && data.data) {
        // 只显示当前用户的预约
        const myData = data.data.filter(b => 
          user && (b.applicant_id === user.id || b.applicant_name === user.name)
        );
        setMyBookings(myData);
      }
    } catch (err) {
      console.error('获取预约记录失败:', err);
    }
  }, [user]);

  // 初始加载
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchRooms(), fetchMyBookings()]);
      setLoading(false);
    };
    if (user) {
      loadData();
    }
  }, [fetchRooms, fetchMyBookings, user]);

  // 筛选变化时重新获取
  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // 打开预约弹窗
  const handleOpenBooking = (room: RoomRecord) => {
    setSelectedRoom(room);
    setBookingForm({
      purpose: 'meeting',
      title: '',
      description: '',
      bookingDate: new Date().toISOString().split('T')[0],
      startTime: '08:00',
      endTime: '09:00',
      expectedAttendees: Math.min(20, room.capacity || 20),
    });
    setShowBookingDialog(true);
  };

  // 提交预约
  const handleSubmitBooking = async () => {
    if (!selectedRoom || !user) return;
    
    // 验证表单
    if (!bookingForm.title.trim()) {
      alert('请填写活动标题');
      return;
    }
    if (!bookingForm.bookingDate) {
      alert('请选择预约日期');
      return;
    }
    
    setSubmitting(true);
    try {
      const res = await fetch('/api/academic/rooms/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: selectedRoom.id,
          roomName: selectedRoom.name,
          roomType: selectedRoom.type,
          building: selectedRoom.building,
          location: selectedRoom.location,
          applicantId: user.id,
          applicantName: user.name,
          applicantRole: user.role,
          department: user.department,
          ...bookingForm,
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setShowBookingDialog(false);
        fetchMyBookings();
        alert('预约申请已提交，请等待审批');
      } else {
        alert(data.error || '提交失败');
      }
    } catch (err) {
      console.error('提交预约失败:', err);
      alert('提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  // 取消预约
  const handleCancelBooking = async (booking: BookingRecord) => {
    if (!confirm('确定要取消这个预约吗？')) return;
    
    try {
      const res = await fetch(`/api/academic/rooms/bookings/${booking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        fetchMyBookings();
        alert('预约已取消');
      } else {
        alert(data.error || '取消失败');
      }
    } catch (err) {
      console.error('取消预约失败:', err);
      alert('取消失败，请重试');
    }
  };

  // 过滤教室
  const filteredRooms = rooms.filter(room => {
    return room.status === 'available';
  });

  // 统计
  const stats = {
    total: myBookings.length,
    pending: myBookings.filter(b => b.status === 'pending').length,
    approved: myBookings.filter(b => b.status === 'approved').length,
    completed: myBookings.filter(b => b.status === 'completed').length,
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-slate-50/50 via-white to-blue-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <DoorOpen className="h-7 w-7 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">教室预约</h1>
          </div>
          <p className="text-gray-500 mt-1">申请使用学校教室资源</p>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">我的预约</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-gray-300" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">待审批</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-300" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">已批准</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.approved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-300" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">已完成</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{stats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-300" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 主内容区 */}
      <Tabs defaultValue="rooms" className="space-y-4">
        <TabsList className="bg-white border shadow-sm">
          <TabsTrigger value="rooms" className="gap-2">
            <DoorOpen className="h-4 w-4" />
            可预约教室
          </TabsTrigger>
          <TabsTrigger value="bookings" className="gap-2">
            <FileText className="h-4 w-4" />
            我的预约
          </TabsTrigger>
        </TabsList>

        {/* 可预约教室 */}
        <TabsContent value="rooms" className="space-y-4">
          {/* 筛选栏 */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="搜索教室名称或位置..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="教室类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部类型</SelectItem>
                    {Object.entries(roomTypeMap).map(([key, value]) => (
                      <SelectItem key={key} value={key}>{value.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* 教室网格 */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredRooms.map(room => (
              <Card key={room.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{room.name}</CardTitle>
                      <CardDescription className="text-xs">{room.code}</CardDescription>
                    </div>
                    <Badge className={roomTypeMap[room.type]?.color || 'text-gray-600 bg-gray-50'}>
                      {roomTypeMap[room.type]?.label || room.type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Building className="h-4 w-4 text-gray-400" />
                      <span>{room.building}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span>{room.capacity || 30}人</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 col-span-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="truncate">{room.location || '-'}</span>
                    </div>
                  </div>
                  
                  {/* 设施标签 */}
                  <div className="flex flex-wrap gap-1">
                    {room.facilities?.projector && (
                      <Badge variant="outline" className="text-xs">投影</Badge>
                    )}
                    {room.facilities?.airConditioner && (
                      <Badge variant="outline" className="text-xs">空调</Badge>
                    )}
                    {room.facilities?.computer && (
                      <Badge variant="outline" className="text-xs">电脑</Badge>
                    )}
                  </div>

                  {/* 操作按钮 */}
                  <Button 
                    className="w-full" 
                    onClick={() => handleOpenBooking(room)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    预约申请
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredRooms.length === 0 && (
            <Card className="border-0 shadow-md">
              <CardContent className="py-12 text-center text-gray-500">
                <DoorOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>暂无可用教室</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 我的预约 */}
        <TabsContent value="bookings" className="space-y-4">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">预约记录</CardTitle>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="状态筛选" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    {Object.entries(bookingStatusMap).map(([key, value]) => (
                      <SelectItem key={key} value={key}>{value.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {myBookings
                  .filter(b => statusFilter === 'all' || b.status === statusFilter)
                  .map(booking => {
                    const StatusIcon = bookingStatusMap[booking.status]?.icon || Clock;
                    return (
                      <div 
                        key={booking.id} 
                        className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        {/* 日期 */}
                        <div className="text-center min-w-[80px]">
                          <div className="text-lg font-semibold text-gray-900">
                            {booking.booking_date.slice(5)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {booking.start_time}-{booking.end_time}
                          </div>
                        </div>

                        {/* 分隔线 */}
                        <div className="w-px h-16 bg-gray-200" />

                        {/* 内容 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900 truncate">{booking.title}</h4>
                            <Badge className={bookingStatusMap[booking.status]?.color}>
                              {bookingStatusMap[booking.status]?.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {booking.room_name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {booking.expected_attendees}人
                            </span>
                          </div>
                          {booking.reject_reason && (
                            <p className="text-sm text-red-600 mt-1">拒绝原因：{booking.reject_reason}</p>
                          )}
                        </div>

                        {/* 操作 */}
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedBooking(booking);
                              setShowDetailDialog(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {booking.status === 'pending' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleCancelBooking(booking)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                {myBookings.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                    <p>暂无预约记录</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 预约弹窗 */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>预约教室</DialogTitle>
            <DialogDescription>
              {selectedRoom?.name} · {selectedRoom?.building}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid gap-4">
              <div>
                <Label>预约日期 *</Label>
                <Input 
                  type="date" 
                  value={bookingForm.bookingDate}
                  onChange={(e) => setBookingForm({...bookingForm, bookingDate: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>开始时间 *</Label>
                  <Select 
                    value={bookingForm.startTime}
                    onValueChange={(v) => setBookingForm({...bookingForm, startTime: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>结束时间 *</Label>
                  <Select 
                    value={bookingForm.endTime}
                    onValueChange={(v) => setBookingForm({...bookingForm, endTime: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label>活动用途 *</Label>
                <Select 
                  value={bookingForm.purpose}
                  onValueChange={(v) => setBookingForm({...bookingForm, purpose: v as BookingPurpose})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {purposeOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>活动标题 *</Label>
                <Input 
                  placeholder="如：语文教研组集体备课"
                  value={bookingForm.title}
                  onChange={(e) => setBookingForm({...bookingForm, title: e.target.value})}
                />
              </div>
              
              <div>
                <Label>预计人数</Label>
                <Input 
                  type="number"
                  min={1}
                  max={selectedRoom?.capacity || 200}
                  value={bookingForm.expectedAttendees}
                  onChange={(e) => setBookingForm({...bookingForm, expectedAttendees: parseInt(e.target.value) || 1})}
                />
                <p className="text-xs text-gray-500 mt-1">最大容量：{selectedRoom?.capacity || 200}人</p>
              </div>
              
              <div>
                <Label>备注说明</Label>
                <Textarea 
                  placeholder="活动描述、特殊需求等..."
                  value={bookingForm.description}
                  onChange={(e) => setBookingForm({...bookingForm, description: e.target.value})}
                  rows={3}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBookingDialog(false)}>
              取消
            </Button>
            <Button onClick={handleSubmitBooking} disabled={submitting}>
              {submitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              提交申请
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 详情弹窗 */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>预约详情</DialogTitle>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-3 py-4">
              <div className="flex items-center gap-2">
                <Badge className={bookingStatusMap[selectedBooking.status]?.color}>
                  {bookingStatusMap[selectedBooking.status]?.label}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">活动标题</p>
                  <p className="font-medium">{selectedBooking.title}</p>
                </div>
                <div>
                  <p className="text-gray-500">活动用途</p>
                  <p className="font-medium">{purposeOptions.find(p => p.value === selectedBooking.purpose)?.label}</p>
                </div>
                <div>
                  <p className="text-gray-500">预约日期</p>
                  <p className="font-medium">{selectedBooking.booking_date}</p>
                </div>
                <div>
                  <p className="text-gray-500">时间段</p>
                  <p className="font-medium">{selectedBooking.start_time} - {selectedBooking.end_time}</p>
                </div>
                <div>
                  <p className="text-gray-500">教室</p>
                  <p className="font-medium">{selectedBooking.room_name}</p>
                </div>
                <div>
                  <p className="text-gray-500">预计人数</p>
                  <p className="font-medium">{selectedBooking.expected_attendees}人</p>
                </div>
              </div>
              
              {selectedBooking.description && (
                <div>
                  <p className="text-gray-500 text-sm">备注说明</p>
                  <p className="text-sm">{selectedBooking.description}</p>
                </div>
              )}
              
              {selectedBooking.reject_reason && (
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="text-red-600 text-sm">拒绝原因：{selectedBooking.reject_reason}</p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              关闭
            </Button>
            {selectedBooking?.status === 'pending' && (
              <Button 
                variant="destructive"
                onClick={() => {
                  setShowDetailDialog(false);
                  handleCancelBooking(selectedBooking);
                }}
              >
                取消预约
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
