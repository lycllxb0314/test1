'use client';

/**
 * 教室使用日程视图 - 教务端
 * 
 * 课表矩阵模式，显示使用人信息
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
} from '@/components/ui/dialog';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  User,
  DoorOpen,
  Users,
  Loader2,
} from 'lucide-react';
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

// 用途颜色映射
const PURPOSE_COLORS: Record<string, string> = {
  teaching: 'bg-blue-100 text-blue-800 border-blue-200',
  meeting: 'bg-green-100 text-green-800 border-green-200',
  training: 'bg-purple-100 text-purple-800 border-purple-200',
  activity: 'bg-pink-100 text-pink-800 border-pink-200',
  exam: 'bg-orange-100 text-orange-800 border-orange-200',
  competition: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  other: 'bg-gray-100 text-gray-800 border-gray-200',
};

// 类型定义
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
  applicant_id: string;
  applicant_name: string;
  title: string;
  purpose: string;
  booking_date: string;
  time_slot: string;
  status: string;
  expected_attendees: number;
  description?: string;
}

export default function RoomCalendarPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(now.setDate(diff));
  });
  
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  // 获取教室列表
  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch('/api/academic/rooms');
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
  }, [selectedRoom]);

  // 获取预约数据
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

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

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

  // 周导航
  const goToPrevWeek = () => setCurrentWeekStart(addDays(currentWeekStart, -7));
  const goToNextWeek = () => setCurrentWeekStart(addDays(currentWeekStart, 7));
  const goToCurrentWeek = () => {
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

  const handleSlotClick = (booking: Booking) => {
    if (booking) {
      setSelectedBooking(booking);
      setShowDetailDialog(true);
    }
  };

  const selectedRoomData = rooms.find(r => r.id === selectedRoom);

  // 统计
  const stats = {
    total: bookings.length,
    approved: bookings.filter(b => b.status === 'approved').length,
    pending: bookings.filter(b => b.status === 'pending').length,
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-indigo-50/30 via-white to-purple-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="h-7 w-7 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-900">使用日程</h1>
          </div>
          <p className="text-gray-500 mt-1">查看教室使用情况和使用人</p>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">本周预约</p>
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
                <p className="text-sm text-gray-500">已批准</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.approved}</p>
              </div>
              <Users className="h-8 w-8 text-green-300" />
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
              <User className="h-8 w-8 text-orange-300" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* 左侧：教室列表 */}
        <Card className="lg:col-span-1 border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">选择教室</CardTitle>
          </CardHeader>
          <CardContent className="max-h-[500px] overflow-y-auto">
            {rooms.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">暂无教室</p>
            ) : (
              <div className="space-y-2">
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    onClick={() => setSelectedRoom(room.id)}
                    className={cn(
                      'p-3 rounded-lg border cursor-pointer transition-all',
                      selectedRoom === room.id
                        ? 'border-indigo-500 bg-indigo-50'
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
                </CardTitle>
                <CardDescription>
                  点击已预约的格子查看详情和使用人
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
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
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
                              isToday ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-50'
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
                          const bookingMap = getBookingMap(formatDate(date));
                          const booking = bookingMap[slot.id];
                          
                          return (
                            <td 
                              key={idx} 
                              className={cn(
                                'p-1 border text-center min-w-[100px] h-12',
                                booking && 'cursor-pointer hover:opacity-80',
                              )}
                              onClick={() => booking && handleSlotClick(booking)}
                            >
                              {booking ? (
                                <div className={cn(
                                  'rounded h-full flex flex-col items-center justify-center p-1',
                                  booking.status === 'pending' 
                                    ? 'bg-orange-100 text-orange-700' 
                                    : PURPOSE_COLORS[booking.purpose] || 'bg-green-100 text-green-700'
                                )}>
                                  <span className="text-xs font-medium truncate w-full text-center">
                                    {booking.title}
                                  </span>
                                  <div className="flex items-center gap-1 text-xs opacity-70">
                                    <User className="h-3 w-3" />
                                    <span>{booking.applicant_name}</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-gray-50 text-gray-400 rounded h-full flex items-center justify-center">
                                  <span className="text-xs">空闲</span>
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
                <div className="w-4 h-4 rounded bg-gray-100"></div>
                <span>空闲</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded bg-green-100"></div>
                <span>会议</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded bg-blue-100"></div>
                <span>教学</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded bg-purple-100"></div>
                <span>培训</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded bg-orange-100"></div>
                <span>考试</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded border-2 border-orange-300"></div>
                <span>待审批</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 详情弹窗 */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              预约详情
            </DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-lg bg-gray-50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-lg">{selectedBooking.title}</span>
                  <Badge variant={selectedBooking.status === 'approved' ? 'default' : 'secondary'}>
                    {selectedBooking.status === 'approved' ? '已批准' : '待审批'}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">使用人：</span>
                    <span className="font-medium">{selectedBooking.applicant_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">教室：</span>
                    <span>{selectedBooking.room_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">日期：</span>
                    <span>{selectedBooking.booking_date}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">时段：</span>
                    <span>{TIME_SLOTS.find(s => s.id === selectedBooking.time_slot)?.label}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">用途：</span>
                    <span>{getPurposeLabel(selectedBooking.purpose)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">人数：</span>
                    <span>{selectedBooking.expected_attendees}人</span>
                  </div>
                </div>
                
                {selectedBooking.description && (
                  <div className="text-sm pt-2 border-t">
                    <span className="text-gray-500">说明：</span>
                    <p className="mt-1">{selectedBooking.description}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// 辅助函数
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

function getPurposeLabel(purpose: string): string {
  const labels: Record<string, string> = {
    teaching: '教学活动',
    meeting: '教研会议',
    training: '培训讲座',
    activity: '学生活动',
    exam: '考试',
    defense: '答辩',
    competition: '比赛',
    other: '其他',
  };
  return labels[purpose] || purpose;
}
