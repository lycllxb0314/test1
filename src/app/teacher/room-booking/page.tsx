'use client';

/**
 * 教室预约页面 - 课表矩阵模式（支持多选时段）
 * 
 * 时段：上午3节、午休、下午3节、晚上
 * 绿色=可预约，红色=已预约，灰色=维护中
 * 支持按住Ctrl/Cmd多选，或连续选择
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DoorOpen,
  Calendar,
  Users,
  Search,
  Loader2,
  CheckCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Info,
  Edit3,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

// ==================== 课表时段定义 ====================
const TIME_SLOTS = [
  { id: 'morning_1', label: '第1节', period: '上午' },
  { id: 'morning_2', label: '第2节', period: '上午' },
  { id: 'morning_3', label: '第3节', period: '上午' },
  { id: 'noon', label: '午休', period: '午间' },
  { id: 'afternoon_1', label: '第4节', period: '下午' },
  { id: 'afternoon_2', label: '第5节', period: '下午' },
  { id: 'afternoon_3', label: '第6节', period: '下午' },
  { id: 'evening', label: '晚上', period: '晚上' },
];

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

// 用途选项
const PURPOSE_OPTIONS = [
  { value: 'teaching', label: '教学活动' },
  { value: 'meeting', label: '教研会议' },
  { value: 'training', label: '培训讲座' },
  { value: 'activity', label: '学生活动' },
  { value: 'exam', label: '考试' },
  { value: 'competition', label: '比赛' },
  { value: 'other', label: '其他' },
];

// ==================== 类型定义 ====================
type SlotStatus = 'available' | 'booked' | 'maintenance';

interface Room {
  id: string;
  name: string;
  type: string;
  building: string;
  capacity: number | null;
  status: string;
}

interface Booking {
  id: string;
  room_id: string;
  room_name: string;
  applicant_name: string;
  title: string;
  purpose: string;
  booking_date: string;
  time_slots: string[];  // 支持多时段
  status: string;
  expected_attendees: number;
  description?: string;
}

// 选中的格子
interface SelectedSlot {
  date: string;
  slotId: string;
}

// ==================== 主组件 ====================
export default function TeacherRoomBookingPage() {
  const { user } = useAuth();
  
  // 数据状态
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 视图状态
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(now.setDate(diff));
  });
  
  // 多选状态
  const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([]);
  const [lastSelectedSlot, setLastSelectedSlot] = useState<SelectedSlot | null>(null);
  
  // 筛选状态
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  // 预约弹窗
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    purpose: 'meeting',
    title: '',
    description: '',
    expectedAttendees: 20,
  });
  const [submitting, setSubmitting] = useState(false);

  // 编辑预约弹窗
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editForm, setEditForm] = useState({
    purpose: 'meeting',
    title: '',
    description: '',
    expectedAttendees: 20,
  });

  // 获取教室列表
  const fetchRooms = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (searchTerm) params.set('search', searchTerm);
      
      const res = await fetch(`/api/academic/rooms?${params.toString()}`);
      const data = await res.json();
      
      if (data.success && data.data) {
        setRooms(data.data);
        if (!selectedRoom && data.data.length > 0) {
          setSelectedRoom(data.data[0].id);
        }
      }
    } catch (err) {
      console.error('获取教室列表失败:', err);
    }
  }, [typeFilter, searchTerm, selectedRoom]);

  // 获取预约数据（当前周）
  const fetchBookings = useCallback(async () => {
    if (!selectedRoom) return;
    
    setLoading(true);
    try {
      const startDate = formatDate(currentWeekStart);
      const endDate = formatDate(addDays(currentWeekStart, 6));
      
      const res = await fetch(
        `/api/academic/rooms/bookings?roomId=${selectedRoom}&startDate=${startDate}&endDate=${endDate}`
      );
      const data = await res.json();
      
      if (data.success && data.data) {
        setBookings(data.data);
      }
    } catch (err) {
      console.error('获取预约数据失败:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedRoom, currentWeekStart]);

  // 获取我的预约
  const fetchMyBookings = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const res = await fetch(`/api/academic/rooms/bookings?applicantId=${user.id}`);
      const data = await res.json();
      
      if (data.success && data.data) {
        setMyBookings(data.data);
      }
    } catch (err) {
      console.error('获取我的预约失败:', err);
    }
  }, [user]);

  // 初始加载
  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    if (user) {
      fetchMyBookings();
    }
  }, [fetchMyBookings, user]);

  // 检查格子是否被预约
  const isSlotBooked = (date: string, slotId: string): { booked: boolean; booking?: Booking } => {
    for (const booking of bookings) {
      if (booking.booking_date === date && 
          booking.status !== 'rejected' && 
          booking.status !== 'cancelled' &&
          booking.time_slots?.includes(slotId)) {
        return { booked: true, booking };
      }
    }
    return { booked: false };
  };

  // 检查格子是否被选中
  const isSlotSelected = (date: string, slotId: string): boolean => {
    return selectedSlots.some(s => s.date === date && s.slotId === slotId);
  };

  // 处理格子点击（支持多选）
  const handleSlotClick = (date: string, slotId: string, event: React.MouseEvent) => {
    const { booked } = isSlotBooked(date, slotId);
    if (booked) return;

    const room = rooms.find(r => r.id === selectedRoom);
    if (room?.status === 'maintenance') return;

    const isPast = new Date(date) < new Date(new Date().setHours(0,0,0,0));
    if (isPast) return;

    const currentSlot = { date, slotId };

    // Ctrl/Cmd + 点击：切换选中状态
    if (event.ctrlKey || event.metaKey) {
      setSelectedSlots(prev => {
        const exists = prev.some(s => s.date === date && s.slotId === slotId);
        if (exists) {
          return prev.filter(s => !(s.date === date && s.slotId === slotId));
        } else {
          return [...prev, currentSlot];
        }
      });
      setLastSelectedSlot(currentSlot);
    }
    // Shift + 点击：范围选择
    else if (event.shiftKey && lastSelectedSlot) {
      // 只在同一日期内做范围选择
      if (lastSelectedSlot.date === date) {
        const startIdx = TIME_SLOTS.findIndex(s => s.id === lastSelectedSlot.slotId);
        const endIdx = TIME_SLOTS.findIndex(s => s.id === slotId);
        const minIdx = Math.min(startIdx, endIdx);
        const maxIdx = Math.max(startIdx, endIdx);
        
        const slotsInRange = TIME_SLOTS.slice(minIdx, maxIdx + 1)
          .filter(s => !isSlotBooked(date, s.id).booked)
          .map(s => ({ date, slotId: s.id }));
        
        setSelectedSlots(prev => {
          // 移除该日期已选的，添加新的范围
          const otherDateSlots = prev.filter(s => s.date !== date);
          return [...otherDateSlots, ...slotsInRange];
        });
      }
    }
    // 普通点击：清空之前的选择，只选当前
    else {
      setSelectedSlots([currentSlot]);
      setLastSelectedSlot(currentSlot);
    }
  };

  // 打开预约弹窗
  const openBookingDialog = () => {
    if (selectedSlots.length === 0) return;
    
    setBookingForm({
      purpose: 'meeting',
      title: '',
      description: '',
      expectedAttendees: 20,
    });
    setShowBookingDialog(true);
  };

  // 提交预约
  const handleSubmitBooking = async () => {
    if (selectedSlots.length === 0 || !selectedRoom || !user) return;
    
    if (!bookingForm.title.trim()) {
      alert('请填写活动标题');
      return;
    }
    
    setSubmitting(true);
    try {
      const room = rooms.find(r => r.id === selectedRoom);
      
      // 按日期分组
      const slotsByDate: Record<string, string[]> = {};
      selectedSlots.forEach(slot => {
        if (!slotsByDate[slot.date]) {
          slotsByDate[slot.date] = [];
        }
        slotsByDate[slot.date].push(slot.slotId);
      });
      
      // 为每个日期创建预约
      const results = await Promise.all(
        Object.entries(slotsByDate).map(async ([date, slots]) => {
          const res = await fetch('/api/academic/rooms/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              roomId: selectedRoom,
              roomName: room?.name,
              roomType: room?.type,
              building: room?.building,
              applicantId: user.id,
              applicantName: user.name,
              applicantRole: user.role,
              department: user.department,
              purpose: bookingForm.purpose,
              title: bookingForm.title,
              description: bookingForm.description,
              bookingDate: date,
              timeSlots: slots,  // 多时段
              expectedAttendees: bookingForm.expectedAttendees,
            }),
          });
          return res.json();
        })
      );
      
      const allSuccess = results.every(r => r.success);
      
      if (allSuccess) {
        setShowBookingDialog(false);
        setSelectedSlots([]);
        fetchBookings();
        fetchMyBookings();
        alert('预约申请已提交，请等待审批');
      } else {
        const errors = results.filter(r => !r.success).map(r => r.error).join('\n');
        alert(errors || '部分预约提交失败');
      }
    } catch (err) {
      console.error('提交预约失败:', err);
      alert('提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  // 取消预约
  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('确定要取消这个预约吗？')) return;
    
    try {
      const res = await fetch(`/api/academic/rooms/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        fetchBookings();
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

  // 打开编辑弹窗
  const openEditDialog = (booking: Booking) => {
    setEditingBooking(booking);
    setEditForm({
      purpose: booking.purpose || 'meeting',
      title: booking.title || '',
      description: booking.description || '',
      expectedAttendees: booking.expected_attendees || 20,
    });
    setShowEditDialog(true);
  };

  // 重新提交预约
  const handleResubmitBooking = async () => {
    if (!editingBooking) return;
    
    if (!editForm.title.trim()) {
      alert('请填写活动标题');
      return;
    }
    
    setSubmitting(true);
    try {
      const res = await fetch(`/api/academic/rooms/bookings/${editingBooking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resubmit',
          purpose: editForm.purpose,
          title: editForm.title,
          description: editForm.description,
          expectedAttendees: editForm.expectedAttendees,
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setShowEditDialog(false);
        setEditingBooking(null);
        fetchBookings();
        fetchMyBookings();
        alert('预约已重新提交，请等待审批');
      } else {
        alert(data.error || '重新提交失败');
      }
    } catch (err) {
      console.error('重新提交失败:', err);
      alert('重新提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  // 清空选择
  const clearSelection = () => {
    setSelectedSlots([]);
    setLastSelectedSlot(null);
  };

  // 周导航
  const goToPrevWeek = () => {
    clearSelection();
    setCurrentWeekStart(addDays(currentWeekStart, -7));
  };

  const goToNextWeek = () => {
    clearSelection();
    setCurrentWeekStart(addDays(currentWeekStart, 7));
  };

  const goToCurrentWeek = () => {
    clearSelection();
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    setCurrentWeekStart(new Date(now.setDate(diff)));
  };

  const getWeekDates = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      dates.push(addDays(currentWeekStart, i));
    }
    return dates;
  };

  // 获取选中时段的显示文本
  const getSelectedSlotsText = () => {
    if (selectedSlots.length === 0) return '';
    
    const slotsByDate: Record<string, string[]> = {};
    selectedSlots.forEach(slot => {
      if (!slotsByDate[slot.date]) {
        slotsByDate[slot.date] = [];
      }
      slotsByDate[slot.date].push(slot.slotId);
    });
    
    return Object.entries(slotsByDate).map(([date, slots]) => {
      const sortedSlots = slots.sort((a, b) => 
        TIME_SLOTS.findIndex(s => s.id === a) - TIME_SLOTS.findIndex(s => s.id === b)
      );
      const labels = sortedSlots.map(id => TIME_SLOTS.find(s => s.id === id)?.label).join('、');
      return `${date} ${labels}`;
    }).join('；');
  };

  // 统计
  const stats = {
    total: myBookings.length,
    pending: myBookings.filter(b => b.status === 'pending').length,
    returned: myBookings.filter(b => b.status === 'returned').length,
    approved: myBookings.filter(b => b.status === 'approved').length,
  };

  const selectedRoomData = rooms.find(r => r.id === selectedRoom);

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-slate-50/50 via-white to-blue-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <DoorOpen className="h-7 w-7 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">教室预约</h1>
          </div>
          <p className="text-gray-500 mt-1">选择课表时段进行预约（支持多选）</p>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">我的预约</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <Calendar className="h-8 w-8 text-gray-300" />
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
                <p className="text-sm text-gray-500">待修改</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{stats.returned}</p>
              </div>
              <Edit3 className="h-8 w-8 text-amber-300" />
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
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* 左侧：教室列表 */}
        <Card className="lg:col-span-1 border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">选择教室</CardTitle>
            <div className="flex gap-2 mt-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="搜索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-8"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-24 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="seminar_room">教研室</SelectItem>
                  <SelectItem value="lecture_hall">阶梯教室</SelectItem>
                  <SelectItem value="meeting_room">会议室</SelectItem>
                  <SelectItem value="lab">实验室</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="max-h-[400px] overflow-y-auto">
            {rooms.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">暂无可用教室</p>
            ) : (
              <div className="space-y-2">
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    onClick={() => { setSelectedRoom(room.id); clearSelection(); }}
                    className={cn(
                      'p-3 rounded-lg border cursor-pointer transition-all',
                      selectedRoom === room.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{room.name}</span>
                      {room.capacity && (
                        <span className="text-xs text-gray-500">{room.capacity}人</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">{room.building}</span>
                      {room.status === 'maintenance' && (
                        <Badge variant="outline" className="text-xs h-5">维护中</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 右侧：课表矩阵 */}
        <Card className="lg:col-span-3 border-0 shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">
                  {selectedRoomData?.name || '请选择教室'} 
                  {selectedRoomData?.capacity && (
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      容纳 {selectedRoomData.capacity} 人
                    </span>
                  )}
                </CardTitle>
                <CardDescription className="mt-1">
                  点击选择时段 · Ctrl+点击多选 · Shift+点击范围选择
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={goToPrevWeek}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={goToCurrentWeek}>
                  本周
                </Button>
                <Button variant="outline" size="sm" onClick={goToNextWeek}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {formatDate(currentWeekStart, 'long')} - {formatDate(addDays(currentWeekStart, 6), 'long')}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : !selectedRoom ? (
              <div className="text-center py-20 text-gray-500">
                <DoorOpen className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>请从左侧选择教室</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="w-16 p-2 border bg-gray-50 text-sm font-medium">时段</th>
                      {getWeekDates().map((date, idx) => {
                        const isToday = formatDate(date) === formatDate(new Date());
                        return (
                          <th 
                            key={idx} 
                            className={cn(
                              'p-2 border text-center text-sm font-medium',
                              isToday ? 'bg-blue-100 text-blue-700' : 'bg-gray-50'
                            )}
                          >
                            <div>周{WEEKDAYS[date.getDay()]}</div>
                            <div className="text-xs text-gray-500">{formatDate(date, 'short')}</div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {TIME_SLOTS.map((slot) => (
                      <tr key={slot.id}>
                        <td className="p-2 border bg-gray-50 text-xs font-medium text-center">
                          <div>{slot.label}</div>
                          <div className="text-gray-400">{slot.period}</div>
                        </td>
                        {getWeekDates().map((date, idx) => {
                          const { booked, booking } = isSlotBooked(formatDate(date), slot.id);
                          const selected = isSlotSelected(formatDate(date), slot.id);
                          const isPast = date < new Date(new Date().setHours(0,0,0,0));
                          const roomMaintenance = selectedRoomData?.status === 'maintenance';
                          
                          return (
                            <td 
                              key={idx} 
                              className={cn(
                                'p-1 border text-center min-w-[80px] h-10',
                                !booked && !isPast && !roomMaintenance && 'cursor-pointer hover:opacity-80',
                              )}
                              onClick={(e) => handleSlotClick(formatDate(date), slot.id, e)}
                            >
                              {booked ? (
                                <div className={cn(
                                  'rounded h-full flex flex-col items-center justify-center p-1',
                                  booking?.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                                )}>
                                  <span className="text-xs font-medium truncate w-full text-center">
                                    {booking?.title}
                                  </span>
                                  <span className="text-xs opacity-70">{booking?.applicant_name}</span>
                                </div>
                              ) : roomMaintenance ? (
                                <div className="bg-gray-200 text-gray-500 rounded h-full flex items-center justify-center">
                                  <span className="text-xs">维护中</span>
                                </div>
                              ) : isPast ? (
                                <div className="bg-gray-100 text-gray-400 rounded h-full flex items-center justify-center">
                                  <span className="text-xs">已过</span>
                                </div>
                              ) : selected ? (
                                <div className="bg-blue-500 text-white rounded h-full flex items-center justify-center">
                                  <CheckCircle className="h-4 w-4" />
                                </div>
                              ) : (
                                <div className="bg-green-100 text-green-700 rounded h-full flex items-center justify-center hover:bg-green-200 transition-colors">
                                  <span className="text-xs">可选</span>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 图例 */}
            <div className="flex items-center gap-4 mt-4 text-xs flex-wrap">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded bg-green-100"></div>
                <span>可选</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded bg-blue-500"></div>
                <span>已选中</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded bg-red-100"></div>
                <span>已预约</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded bg-orange-100"></div>
                <span>待审批</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded bg-gray-200"></div>
                <span>不可选</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 已选时段和操作按钮 */}
      {selectedSlots.length > 0 && (
        <Card className="border-0 shadow-md border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-blue-500">{selectedSlots.length} 个时段已选中</Badge>
                  <Button variant="ghost" size="sm" onClick={clearSelection}>
                    清空选择
                  </Button>
                </div>
                <p className="text-sm text-gray-600">{getSelectedSlotsText()}</p>
              </div>
              <Button onClick={openBookingDialog}>
                提交预约
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 我的预约记录 */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-base">我的预约</CardTitle>
        </CardHeader>
        <CardContent>
          {myBookings.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">暂无预约记录</p>
          ) : (
            <div className="space-y-2">
              {myBookings.map((booking) => {
                const slotsLabel = booking.time_slots?.map(id => 
                  TIME_SLOTS.find(s => s.id === id)?.label
                ).join('、') || '';
                
                // 状态显示配置
                const getStatusConfig = (status: string) => {
                  switch (status) {
                    case 'approved':
                      return { label: '已批准', variant: 'default' as const, color: 'text-green-600' };
                    case 'pending':
                      return { label: '待审批', variant: 'secondary' as const, color: 'text-yellow-600' };
                    case 'returned':
                      return { label: '待修改', variant: 'outline' as const, color: 'text-orange-600' };
                    case 'rejected':
                      return { label: '已拒绝', variant: 'destructive' as const, color: 'text-red-600' };
                    case 'cancelled':
                      return { label: '已取消', variant: 'outline' as const, color: 'text-gray-500' };
                    default:
                      return { label: status, variant: 'secondary' as const, color: 'text-gray-600' };
                  }
                };
                const statusConfig = getStatusConfig(booking.status);
                
                return (
                  <div 
                    key={booking.id} 
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      booking.status === 'returned' ? 'border-orange-200 bg-orange-50 cursor-pointer hover:bg-orange-100' : ''
                    }`}
                    onClick={() => booking.status === 'returned' && openEditDialog(booking)}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{booking.title}</span>
                        <Badge variant={statusConfig.variant}>
                          {statusConfig.label}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {booking.room_name} · {booking.booking_date} · {slotsLabel}
                      </div>
                    </div>
                    {booking.status === 'pending' && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelBooking(booking.id);
                        }}
                      >
                        取消
                      </Button>
                    )}
                    {booking.status === 'returned' && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-orange-300 text-orange-600 hover:bg-orange-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditDialog(booking);
                        }}
                      >
                        编辑
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 预约弹窗 */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>预约 {selectedRoomData?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* 已选时段 */}
            <div className="p-3 rounded-lg bg-blue-50 text-sm">
              <div className="flex items-center gap-2 text-blue-700 mb-1">
                <Info className="h-4 w-4" />
                <span className="font-medium">已选 {selectedSlots.length} 个时段</span>
              </div>
              <p className="text-blue-600">{getSelectedSlotsText()}</p>
            </div>
            
            <div className="space-y-2">
              <Label>活动用途</Label>
              <Select 
                value={bookingForm.purpose} 
                onValueChange={(v) => setBookingForm({ ...bookingForm, purpose: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PURPOSE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>活动标题 *</Label>
              <Input 
                value={bookingForm.title}
                onChange={(e) => setBookingForm({ ...bookingForm, title: e.target.value })}
                placeholder="请输入活动标题"
              />
            </div>

            <div className="space-y-2">
              <Label>预期人数</Label>
              <Input 
                type="number"
                value={bookingForm.expectedAttendees}
                onChange={(e) => setBookingForm({ ...bookingForm, expectedAttendees: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label>备注说明</Label>
              <Textarea 
                value={bookingForm.description}
                onChange={(e) => setBookingForm({ ...bookingForm, description: e.target.value })}
                placeholder="可选"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBookingDialog(false)}>取消</Button>
            <Button onClick={handleSubmitBooking} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              提交预约
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑预约弹窗 */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>修改预约</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* 原有预约信息 */}
            {editingBooking && (
              <div className="p-3 rounded-lg bg-amber-50 text-sm">
                <div className="flex items-center gap-2 text-amber-700 mb-2">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">预约信息</span>
                </div>
                <div className="text-amber-600 space-y-1">
                  <p><strong>教室：</strong>{editingBooking.room_name}</p>
                  <p><strong>日期：</strong>{editingBooking.booking_date}</p>
                  <p><strong>时段：</strong>{editingBooking.time_slots?.map((id: string) => 
                    TIME_SLOTS.find(s => s.id === id)?.label
                  ).join('、') || ''}</p>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label>活动用途</Label>
              <Select 
                value={editForm.purpose} 
                onValueChange={(v) => setEditForm({ ...editForm, purpose: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PURPOSE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>活动标题 *</Label>
              <Input 
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                placeholder="请输入活动标题"
              />
            </div>

            <div className="space-y-2">
              <Label>预期人数</Label>
              <Input 
                type="number"
                value={editForm.expectedAttendees}
                onChange={(e) => setEditForm({ ...editForm, expectedAttendees: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label>备注说明</Label>
              <Textarea 
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="可选"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>取消</Button>
            <Button onClick={handleResubmitBooking} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              重新提交
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==================== 辅助函数 ====================
function formatDate(date: Date, format: 'short' | 'long' = 'short'): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  if (format === 'long') {
    return `${year}年${month}月${day}日`;
  }
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
