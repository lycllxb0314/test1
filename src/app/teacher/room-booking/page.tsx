'use client';

/**
 * 教室预约页面 - 课表矩阵模式
 * 
 * 时段：上午3节、午休、下午3节、晚上
 * 绿色=可预约，红色=已预约，灰色=维护中
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
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
  time_slot: string;
  status: string;
  expected_attendees: number;
  description?: string;
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
  
  // 筛选状态
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  // 预约弹窗
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; slot: string } | null>(null);
  const [bookingForm, setBookingForm] = useState({
    purpose: 'meeting',
    title: '',
    description: '',
    expectedAttendees: 20,
  });
  const [submitting, setSubmitting] = useState(false);

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
    try {
      const res = await fetch('/api/academic/rooms/bookings');
      const data = await res.json();
      
      if (data.success && data.data) {
        const myData = data.data.filter((b: Booking) => 
          user && (b.applicant_name === user.name)
        );
        setMyBookings(myData);
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

  // 获取某天的预约映射
  const getBookingMap = (date: string) => {
    const map: Record<string, Booking> = {};
    bookings
      .filter(b => b.booking_date === date && b.status !== 'rejected' && b.status !== 'cancelled')
      .forEach(b => {
        map[b.time_slot] = b;
      });
    return map;
  };

  // 获取格子状态
  const getSlotStatus = (date: string, slotId: string): { status: SlotStatus; booking?: Booking } => {
    const bookingMap = getBookingMap(date);
    const booking = bookingMap[slotId];
    
    if (booking) {
      return { status: 'booked', booking };
    }
    
    const room = rooms.find(r => r.id === selectedRoom);
    if (room?.status === 'maintenance') {
      return { status: 'maintenance' };
    }
    
    return { status: 'available' };
  };

  // 打开预约弹窗
  const handleSlotClick = (date: string, slotId: string) => {
    const { status, booking } = getSlotStatus(date, slotId);
    
    if (status !== 'available') return;
    
    setSelectedSlot({ date, slot: slotId });
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
    if (!selectedSlot || !selectedRoom || !user) return;
    
    if (!bookingForm.title.trim()) {
      alert('请填写活动标题');
      return;
    }
    
    setSubmitting(true);
    try {
      const room = rooms.find(r => r.id === selectedRoom);
      const slot = TIME_SLOTS.find(s => s.id === selectedSlot.slot);
      
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
          bookingDate: selectedSlot.date,
          timeSlot: selectedSlot.slot,
          expectedAttendees: bookingForm.expectedAttendees,
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setShowBookingDialog(false);
        fetchBookings();
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

  // 周导航
  const goToPrevWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, -7));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, 7));
  };

  const goToCurrentWeek = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    setCurrentWeekStart(new Date(now.setDate(diff)));
  };

  // 获取周的日期列表
  const getWeekDates = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      dates.push(addDays(currentWeekStart, i));
    }
    return dates;
  };

  // 统计
  const stats = {
    total: myBookings.length,
    pending: myBookings.filter(b => b.status === 'pending').length,
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
          <p className="text-gray-500 mt-1">选择课表时段进行预约</p>
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
          <CardContent className="max-h-[500px] overflow-y-auto">
            {rooms.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">暂无可用教室</p>
            ) : (
              <div className="space-y-2">
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    onClick={() => setSelectedRoom(room.id)}
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
                          const { status, booking } = getSlotStatus(formatDate(date), slot.id);
                          const isPast = date < new Date(new Date().setHours(0,0,0,0));
                          
                          return (
                            <td 
                              key={idx} 
                              className={cn(
                                'p-1 border text-center min-w-[100px] h-12',
                                status === 'available' && !isPast && 'cursor-pointer hover:opacity-80',
                              )}
                              onClick={() => !isPast && status === 'available' && handleSlotClick(formatDate(date), slot.id)}
                            >
                              {status === 'available' ? (
                                <div className={cn(
                                  'rounded h-full flex items-center justify-center',
                                  isPast ? 'bg-gray-100 text-gray-400' : 'bg-green-100 text-green-700'
                                )}>
                                  <span className="text-xs">{isPast ? '已过' : '可预约'}</span>
                                </div>
                              ) : status === 'booked' ? (
                                <div className={cn(
                                  'rounded h-full flex flex-col items-center justify-center p-1',
                                  booking?.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                                )}>
                                  <span className="text-xs font-medium truncate w-full text-center">
                                    {booking?.title}
                                  </span>
                                  <span className="text-xs opacity-70">{booking?.applicant_name}</span>
                                </div>
                              ) : (
                                <div className="bg-gray-200 text-gray-500 rounded h-full flex items-center justify-center">
                                  <span className="text-xs">维护中</span>
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
            <div className="flex items-center gap-4 mt-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded bg-green-100"></div>
                <span>可预约</span>
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
                <span>维护中</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
              {myBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{booking.title}</span>
                      <Badge variant={booking.status === 'approved' ? 'default' : booking.status === 'pending' ? 'secondary' : 'destructive'}>
                        {booking.status === 'approved' ? '已批准' : booking.status === 'pending' ? '待审批' : '已拒绝'}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {booking.room_name} · {booking.booking_date} · {TIME_SLOTS.find(s => s.id === booking.time_slot)?.label || booking.time_slot}
                    </div>
                  </div>
                  {booking.status === 'pending' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleCancelBooking(booking.id)}
                    >
                      取消
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 预约弹窗 */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>预约 {selectedRoomData?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">日期：</span>
                <span className="font-medium">{selectedSlot?.date}</span>
              </div>
              <div>
                <span className="text-gray-500">时段：</span>
                <span className="font-medium">
                  {TIME_SLOTS.find(s => s.id === selectedSlot?.slot)?.label}
                </span>
              </div>
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
