'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Users,
  User,
  CheckCircle,
  AlertTriangle,
  DoorOpen,
  LayoutGrid,
  List,
} from 'lucide-react';
import { RoomBooking, BookingPurpose } from '@/types';

// 时间段
const timeSlots = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00',
];

// 模拟教室列表
const mockRooms = [
  { id: 'room-001', name: '2号楼教研室', type: 'seminar_room' },
  { id: 'room-002', name: '4号楼教研室', type: 'seminar_room' },
  { id: 'room-003', name: '1号楼阶梯教室', type: 'lecture_hall' },
  { id: 'room-005', name: '综合楼会议室', type: 'meeting_room' },
];

// 模拟预约数据（2024-03-18 这周）
const mockScheduleData: Record<string, RoomBooking[]> = {
  '2024-03-18': [
    {
      id: 'b001', roomId: 'room-001', roomName: '2号楼教研室', roomType: 'seminar_room',
      building: '2号楼', location: '2号楼3层东侧',
      applicantId: 't001', applicantName: '张明华', applicantRole: 'teacher', department: '语文组',
      purpose: 'meeting', title: '语文教研组备课',
      bookingDate: '2024-03-18', startTime: '14:00', endTime: '16:00', duration: 120,
      expectedAttendees: 15, attendeeType: 'teacher',
      status: 'approved', approvalFlow: [], currentStep: 1,
      createdAt: '2024-03-15 10:00', updatedAt: '2024-03-15 11:00',
    },
    {
      id: 'b009', roomId: 'room-003', roomName: '1号楼阶梯教室', roomType: 'lecture_hall',
      building: '1号楼', location: '1号楼1层大厅',
      applicantId: 't002', applicantName: '李晓红', applicantRole: 'teacher', department: '数学组',
      purpose: 'training', title: '数学思维训练讲座',
      bookingDate: '2024-03-18', startTime: '09:00', endTime: '11:00', duration: 120,
      expectedAttendees: 150, attendeeType: 'student',
      status: 'approved', approvalFlow: [], currentStep: 1,
      createdAt: '2024-03-14 09:00', updatedAt: '2024-03-14 10:00',
    },
    {
      id: 'b010', roomId: 'room-005', roomName: '综合楼会议室', roomType: 'meeting_room',
      building: '综合楼', location: '综合楼5层',
      applicantId: 't003', applicantName: '王建国', applicantRole: 'teacher', department: '科学组',
      purpose: 'meeting', title: '科学组教研活动',
      bookingDate: '2024-03-18', startTime: '15:00', endTime: '17:00', duration: 120,
      expectedAttendees: 10, attendeeType: 'teacher',
      status: 'approved', approvalFlow: [], currentStep: 1,
      createdAt: '2024-03-15 14:00', updatedAt: '2024-03-15 15:00',
    },
  ],
  '2024-03-19': [
    {
      id: 'b005', roomId: 'room-005', roomName: '综合楼会议室', roomType: 'meeting_room',
      building: '综合楼', location: '综合楼5层',
      applicantId: 't003', applicantName: '王建国', applicantRole: 'teacher', department: '科学组',
      purpose: 'meeting', title: '科学教研组期中研讨会',
      bookingDate: '2024-03-19', startTime: '14:00', endTime: '16:30', duration: 150,
      expectedAttendees: 12, attendeeType: 'teacher',
      status: 'approved', approvalFlow: [], currentStep: 1,
      createdAt: '2024-03-15 17:30', updatedAt: '2024-03-15 18:00',
    },
    {
      id: 'b011', roomId: 'room-001', roomName: '2号楼教研室', roomType: 'seminar_room',
      building: '2号楼', location: '2号楼3层东侧',
      applicantId: 't004', applicantName: '赵明华', applicantRole: 'teacher', department: '语文组',
      purpose: 'meeting', title: '语文组青年教师磨课',
      bookingDate: '2024-03-19', startTime: '09:00', endTime: '11:30', duration: 150,
      expectedAttendees: 8, attendeeType: 'teacher',
      status: 'approved', approvalFlow: [], currentStep: 1,
      createdAt: '2024-03-16 09:00', updatedAt: '2024-03-16 10:00',
    },
  ],
  '2024-03-20': [
    {
      id: 'b006', roomId: 'room-001', roomName: '2号楼教研室', roomType: 'seminar_room',
      building: '2号楼', location: '2号楼3层东侧',
      applicantId: 't004', applicantName: '赵明华', applicantRole: 'teacher', department: '语文组',
      purpose: 'activity', title: '学生经典诵读比赛彩排',
      bookingDate: '2024-03-20', startTime: '15:30', endTime: '17:30', duration: 120,
      expectedAttendees: 28, attendeeType: 'student',
      status: 'approved', approvalFlow: [], currentStep: 1,
      createdAt: '2024-03-15 18:00', updatedAt: '2024-03-15 19:00',
    },
    {
      id: 'b012', roomId: 'room-002', roomName: '4号楼教研室', roomType: 'seminar_room',
      building: '4号楼', location: '4号楼2层西侧',
      applicantId: 't005', applicantName: '陈雨婷', applicantRole: 'teacher', department: '英语组',
      purpose: 'meeting', title: '英语组教材研讨',
      bookingDate: '2024-03-20', startTime: '14:00', endTime: '16:00', duration: 120,
      expectedAttendees: 12, attendeeType: 'teacher',
      status: 'approved', approvalFlow: [], currentStep: 1,
      createdAt: '2024-03-16 10:00', updatedAt: '2024-03-16 11:00',
    },
  ],
  '2024-03-21': [
    {
      id: 'b013', roomId: 'room-003', roomName: '1号楼阶梯教室', roomType: 'lecture_hall',
      building: '1号楼', location: '1号楼1层大厅',
      applicantId: 't006', applicantName: '刘志强', applicantRole: 'teacher', department: '体育组',
      purpose: 'training', title: '学生安全教育讲座',
      bookingDate: '2024-03-21', startTime: '10:00', endTime: '11:30', duration: 90,
      expectedAttendees: 200, attendeeType: 'student',
      status: 'approved', approvalFlow: [], currentStep: 1,
      createdAt: '2024-03-17 09:00', updatedAt: '2024-03-17 10:00',
    },
  ],
  '2024-03-22': [
    {
      id: 'b004', roomId: 'room-003', roomName: '1号楼阶梯教室', roomType: 'lecture_hall',
      building: '1号楼', location: '1号楼1层大厅',
      applicantId: 't002', applicantName: '李晓红', applicantRole: 'teacher', department: '数学组',
      purpose: 'training', title: '数学思维训练公开课',
      bookingDate: '2024-03-22', startTime: '09:00', endTime: '11:00', duration: 120,
      expectedAttendees: 120, attendeeType: 'student',
      status: 'pending', approvalFlow: [], currentStep: 0,
      createdAt: '2024-03-15 16:00', updatedAt: '2024-03-15 16:00',
    },
    {
      id: 'b014', roomId: 'room-001', roomName: '2号楼教研室', roomType: 'seminar_room',
      building: '2号楼', location: '2号楼3层东侧',
      applicantId: 't001', applicantName: '张明华', applicantRole: 'teacher', department: '语文组',
      purpose: 'meeting', title: '语文组教学研讨',
      bookingDate: '2024-03-22', startTime: '14:00', endTime: '16:00', duration: 120,
      expectedAttendees: 15, attendeeType: 'teacher',
      status: 'approved', approvalFlow: [], currentStep: 1,
      createdAt: '2024-03-17 10:00', updatedAt: '2024-03-17 11:00',
    },
  ],
};

// 用途颜色映射
const purposeColors: Record<BookingPurpose, string> = {
  teaching: 'bg-blue-100 text-blue-800 border-blue-200',
  meeting: 'bg-green-100 text-green-800 border-green-200',
  training: 'bg-purple-100 text-purple-800 border-purple-200',
  activity: 'bg-pink-100 text-pink-800 border-pink-200',
  exam: 'bg-orange-100 text-orange-800 border-orange-200',
  defense: 'bg-teal-100 text-teal-800 border-teal-200',
  competition: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  other: 'bg-gray-100 text-gray-800 border-gray-200',
};

// 用途标签映射
const purposeLabels: Record<BookingPurpose, string> = {
  teaching: '教学', meeting: '会议', training: '培训',
  activity: '活动', exam: '考试', defense: '答辩',
  competition: '比赛', other: '其他',
};

// 星期映射
const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

export default function RoomCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2024, 2, 18)); // 2024-03-18
  const [selectedRoom, setSelectedRoom] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [selectedBooking, setSelectedBooking] = useState<RoomBooking | null>(null);

  // 获取当前周的日期
  const getWeekDates = () => {
    const dates = [];
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  // 格式化日期
  const formatDate = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  // 获取某天的预约
  const getBookingsForDate = (dateStr: string) => {
    const bookings = mockScheduleData[dateStr] || [];
    if (selectedRoom === 'all') return bookings;
    return bookings.filter(b => b.roomId === selectedRoom);
  };

  // 获取时间槽内的预约
  const getBookingForTimeSlot = (dateStr: string, timeSlot: string, roomId: string) => {
    const bookings = mockScheduleData[dateStr] || [];
    return bookings.find(b => {
      if (b.roomId !== roomId) return false;
      const [sh, sm] = b.startTime.split(':').map(Number);
      const [th, tm] = timeSlot.split(':').map(Number);
      const [eh, em] = b.endTime.split(':').map(Number);
      const startMinutes = sh * 60 + sm;
      const timeMinutes = th * 60 + tm;
      const endMinutes = eh * 60 + em;
      return timeMinutes >= startMinutes && timeMinutes < endMinutes;
    });
  };

  // 计算预约的跨度（半小时为单位）
  const getBookingSpan = (booking: RoomBooking) => {
    const [sh, sm] = booking.startTime.split(':').map(Number);
    const [eh, em] = booking.endTime.split(':').map(Number);
    const duration = (eh * 60 + em) - (sh * 60 + sm);
    return Math.ceil(duration / 30);
  };

  // 判断是否是预约的开始时间
  const isBookingStart = (booking: RoomBooking, timeSlot: string) => {
    return booking.startTime === timeSlot;
  };

  // 上一周/天
  const goPrevious = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - (viewMode === 'week' ? 7 : 1));
    setCurrentDate(newDate);
  };

  // 下一周/天
  const goNext = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (viewMode === 'week' ? 7 : 1));
    setCurrentDate(newDate);
  };

  // 今天
  const goToday = () => {
    setCurrentDate(new Date(2024, 2, 18));
  };

  const weekDates = getWeekDates();
  const currentRoom = selectedRoom === 'all' ? null : mockRooms.find(r => r.id === selectedRoom);

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-indigo-50/30 via-white to-purple-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-7 w-7 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-900">使用日程</h1>
          </div>
          <p className="text-gray-500 mt-1">查看教室预约安排和使用情况</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" asChild>
          <a href="/academic/rooms/booking">
            <Calendar className="h-4 w-4 mr-2" />
            预约教室
          </a>
        </Button>
      </div>

      {/* 控制栏 */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" onClick={goPrevious}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={goToday}>今天</Button>
                <Button variant="outline" size="icon" onClick={goNext}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-lg font-medium">
                {currentDate.getFullYear()}年{currentDate.getMonth() + 1}月
                {viewMode === 'week' && (
                  <span className="text-gray-500 ml-2">
                    第{Math.ceil((currentDate.getDate() + new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()) / 7)}周
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex gap-1 p-1 bg-gray-100 rounded">
                <Button
                  variant={viewMode === 'week' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('week')}
                  className={viewMode === 'week' ? 'bg-white shadow' : ''}
                >
                  周视图
                </Button>
                <Button
                  variant={viewMode === 'day' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('day')}
                  className={viewMode === 'day' ? 'bg-white shadow' : ''}
                >
                  日视图
                </Button>
              </div>

              <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="选择教室" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部教室</SelectItem>
                  {mockRooms.map(room => (
                    <SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 周视图 */}
      {viewMode === 'week' && (
        <Card className="border-0 shadow-md overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="sticky left-0 z-10 bg-gray-50 w-16 border-b border-r text-sm font-medium text-gray-500 p-2">
                      时间
                    </th>
                    {weekDates.map((date, idx) => {
                      const isToday = formatDate(date) === formatDate(new Date());
                      return (
                        <th
                          key={idx}
                          className={`border-b text-sm font-medium p-2 min-w-[120px] ${
                            isToday ? 'bg-indigo-50' : ''
                          }`}
                        >
                          <div className={`text-center ${isToday ? 'text-indigo-700' : 'text-gray-600'}`}>
                            <div className="text-xs">周{weekDays[date.getDay()]}</div>
                            <div className={`text-lg font-bold ${isToday ? 'text-indigo-600' : ''}`}>
                              {date.getDate()}
                            </div>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.filter((_, i) => i % 2 === 0).map((timeSlot, rowIdx) => (
                    <tr key={timeSlot} className="h-12">
                      <td className="sticky left-0 z-10 bg-white border-r border-b text-xs text-gray-500 p-2 text-center">
                        {timeSlot}
                      </td>
                      {weekDates.map((date, colIdx) => {
                        const dateStr = formatDate(date);
                        const bookings = getBookingsForDate(dateStr);
                        const bookingsInSlot = bookings.filter(b => isBookingStart(b, timeSlot));

                        return (
                          <td
                            key={colIdx}
                            className="border-b border-l relative p-0.5"
                            rowSpan={1}
                          >
                            {bookingsInSlot.map(booking => (
                              <div
                                key={booking.id}
                                className={`absolute inset-x-1 rounded-md p-1 cursor-pointer hover:opacity-80 transition-opacity ${purposeColors[booking.purpose]}`}
                                style={{
                                  top: '2px',
                                  height: `${Math.min(getBookingSpan(booking), 4) * 44 - 4}px`,
                                  zIndex: 5,
                                }}
                                onClick={() => setSelectedBooking(booking)}
                              >
                                <div className="text-xs font-medium truncate">{booking.title}</div>
                                <div className="text-xs opacity-70">{booking.startTime}-{booking.endTime}</div>
                              </div>
                            ))}
                            {bookings.filter(b => {
                              const [sh, sm] = b.startTime.split(':').map(Number);
                              const [th, tm] = timeSlot.split(':').map(Number);
                              const [eh, em] = b.endTime.split(':').map(Number);
                              const startMinutes = sh * 60 + sm;
                              const timeMinutes = th * 60 + tm;
                              const endMinutes = eh * 60 + em;
                              return timeMinutes > startMinutes && timeMinutes < endMinutes;
                            }).length > 0 && (
                              <div className="absolute inset-x-1 bg-gray-100 rounded" style={{ height: '44px' }} />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 日视图 */}
      {viewMode === 'day' && (
        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
              <div>
                <div className="text-lg font-medium">
                  {currentDate.getFullYear()}年{currentDate.getMonth() + 1}月{currentDate.getDate()}日
                  周{weekDays[currentDate.getDay()]}
                </div>
                {currentRoom && (
                  <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <DoorOpen className="h-3 w-3" />
                    {currentRoom.name}
                  </div>
                )}
              </div>
            </div>

            <div className="relative">
              {/* 时间轴 */}
              <div className="grid grid-cols-[60px_1fr]">
                {timeSlots.filter((_, i) => i % 2 === 0).map(timeSlot => {
                  const dateStr = formatDate(currentDate);
                  const roomsToShow = selectedRoom === 'all' ? mockRooms : mockRooms.filter(r => r.id === selectedRoom);
                  const hasBookingInAnyRoom = roomsToShow.some(room => {
                    const booking = getBookingForTimeSlot(dateStr, timeSlot, room.id);
                    return booking && isBookingStart(booking, timeSlot);
                  });

                  return (
                    <React.Fragment key={timeSlot}>
                      {/* 时间 */}
                      <div className="h-12 border-r border-b text-xs text-gray-500 flex items-center justify-center">
                        {timeSlot}
                      </div>
                      {/* 内容区 */}
                      <div className="h-12 border-b relative">
                        {selectedRoom === 'all' ? (
                          // 显示所有教室的预约
                          <div className="flex h-full">
                            {roomsToShow.map((room, idx) => {
                              const booking = getBookingForTimeSlot(dateStr, timeSlot, room.id);
                              const isStart = booking && isBookingStart(booking, timeSlot);

                              return (
                                <div
                                  key={room.id}
                                  className={`flex-1 relative ${idx > 0 ? 'border-l' : ''}`}
                                >
                                  {isStart && (
                                    <div
                                      className={`absolute inset-1 rounded-md p-1 cursor-pointer hover:opacity-80 ${purposeColors[booking.purpose]}`}
                                      style={{
                                        height: `${getBookingSpan(booking) * 44 - 8}px`,
                                        zIndex: 10,
                                      }}
                                      onClick={() => setSelectedBooking(booking!)}
                                    >
                                      <div className="text-xs font-medium truncate">{booking.title}</div>
                                      <div className="text-xs opacity-70">{booking.roomName}</div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          // 单个教室视图
                          hasBookingInAnyRoom && (
                            <div className="h-full flex items-center">
                              {(() => {
                                const booking = getBookingForTimeSlot(dateStr, timeSlot, selectedRoom);
                                if (booking && isBookingStart(booking, timeSlot)) {
                                  return (
                                    <div
                                      className={`absolute inset-x-2 rounded-md p-2 cursor-pointer hover:opacity-80 ${purposeColors[booking.purpose]}`}
                                      style={{
                                        height: `${getBookingSpan(booking) * 44 - 8}px`,
                                        zIndex: 10,
                                      }}
                                      onClick={() => setSelectedBooking(booking)}
                                    >
                                      <div className="text-sm font-medium">{booking.title}</div>
                                      <div className="text-xs opacity-70 mt-1">
                                        {booking.startTime} - {booking.endTime} · {booking.applicantName}
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          )
                        )}
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 图例 */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="text-gray-500">活动类型：</span>
            {Object.entries(purposeColors).map(([purpose, color]) => (
              <div key={purpose} className="flex items-center gap-1">
                <div className={`w-4 h-4 rounded ${color.split(' ')[0]}`} />
                <span className="text-gray-600">{purposeLabels[purpose as BookingPurpose]}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 预约详情对话框 */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>预约详情</DialogTitle>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-lg bg-gray-50">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-medium text-lg">{selectedBooking.title}</h3>
                  <Badge className={purposeColors[selectedBooking.purpose]}>
                    {purposeLabels[selectedBooking.purpose]}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500 text-xs mb-1">教室</div>
                  <div className="font-medium">{selectedBooking.roomName}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs mb-1">位置</div>
                  <div className="font-medium">{selectedBooking.location}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs mb-1">日期</div>
                  <div className="font-medium">{selectedBooking.bookingDate}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs mb-1">时间</div>
                  <div className="font-medium">{selectedBooking.startTime} - {selectedBooking.endTime}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs mb-1">申请人</div>
                  <div className="font-medium">{selectedBooking.applicantName}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs mb-1">部门</div>
                  <div className="font-medium">{selectedBooking.department}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs mb-1">参与人数</div>
                  <div className="font-medium">{selectedBooking.expectedAttendees} 人</div>
                </div>
                <div>
                  <div className="text-gray-500 text-xs mb-1">状态</div>
                  <Badge className="bg-green-100 text-green-700">已批准</Badge>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSelectedBooking(null)}>关闭</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
