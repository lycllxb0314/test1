'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  ArrowRight,
  Monitor,
  FlaskConical,
  Presentation,
  Gamepad2,
  Wrench,
  Eye,
  Loader2,
} from 'lucide-react';
import { Room, RoomType, RoomStatus, RoomBooking, BookingStatus, BookingPurpose } from '@/types';

// 教室类型映射
const roomTypeMap: Record<RoomType, { label: string; icon: any; color: string }> = {
  seminar_room: { label: '教研室', icon: Users, color: 'text-blue-600 bg-blue-50' },
  lecture_hall: { label: '阶梯教室', icon: Presentation, color: 'text-purple-600 bg-purple-50' },
  multimedia_room: { label: '多媒体教室', icon: Monitor, color: 'text-indigo-600 bg-indigo-50' },
  lab: { label: '实验室', icon: FlaskConical, color: 'text-teal-600 bg-teal-50' },
  meeting_room: { label: '会议室', icon: Users, color: 'text-green-600 bg-green-50' },
  activity_room: { label: '活动室', icon: Gamepad2, color: 'text-pink-600 bg-pink-50' },
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
  rejected: { label: '已拒绝', color: 'text-red-600 bg-red-50', icon: AlertTriangle },
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

// API响应类型
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// 数据库记录类型（snake_case）
interface RoomRecord {
  id: string;
  name: string;
  code: string;
  type: RoomType;
  building: string;
  floor: number | null;
  location: string | null;
  capacity: number | null;
  area: number | null;
  facilities: Record<string, boolean>;
  extra_facilities: string[] | null;
  status: RoomStatus;
  manager_id: string | null;
  manager_name: string | null;
  department_id: string | null;
  usage_stats: {
    totalBookings: number;
    thisMonth: number;
    lastUsedAt?: string;
  } | null;
  images: string[] | null;
  remark: string | null;
  created_at: string;
  updated_at: string;
}

interface BookingRecord {
  id: string;
  room_id: string;
  room_name: string;
  room_type: RoomType;
  building: string;
  location: string | null;
  applicant_id: string;
  applicant_name: string;
  applicant_role: string;
  department: string | null;
  phone: string | null;
  purpose: BookingPurpose;
  purpose_detail: string | null;
  title: string;
  description: string | null;
  booking_date: string;
  start_time: string;
  end_time: string;
  duration: number;
  expected_attendees: number;
  attendee_type: string | null;
  required_facilities: string[] | null;
  status: BookingStatus;
  cleaning_required: boolean;
  reject_reason: string | null;
  created_at: string;
  updated_at: string;
}

// 转换函数：数据库记录 -> 前端类型
function transformRoom(record: RoomRecord): Room {
  return {
    id: record.id,
    name: record.name,
    code: record.code,
    type: record.type,
    building: record.building,
    floor: record.floor ?? 0,
    location: record.location || '',
    capacity: record.capacity || 30,
    area: record.area || undefined,
    facilities: record.facilities as any,
    extraFacilities: record.extra_facilities || undefined,
    status: record.status,
    managerId: record.manager_id || undefined,
    managerName: record.manager_name || undefined,
    departmentId: record.department_id || undefined,
    usageStats: record.usage_stats || undefined,
    images: record.images || undefined,
    remark: record.remark || undefined,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

function transformBooking(record: BookingRecord): RoomBooking {
  return {
    id: record.id,
    roomId: record.room_id,
    roomName: record.room_name,
    roomType: record.room_type,
    building: record.building,
    location: record.location || '',
    applicantId: record.applicant_id,
    applicantName: record.applicant_name,
    applicantRole: record.applicant_role as any,
    department: record.department || undefined,
    phone: record.phone || undefined,
    purpose: record.purpose,
    purposeDetail: record.purpose_detail || undefined,
    title: record.title,
    description: record.description || undefined,
    bookingDate: record.booking_date,
    startTime: record.start_time,
    endTime: record.end_time,
    duration: record.duration,
    expectedAttendees: record.expected_attendees,
    attendeeType: record.attendee_type as any,
    requiredFacilities: record.required_facilities || undefined,
    status: record.status,
    cleaningRequired: record.cleaning_required,
    rejectReason: record.reject_reason || undefined,
    approvalFlow: [],
    currentStep: 0,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

export default function RoomsManagementPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [todayBookings, setTodayBookings] = useState<RoomBooking[]>([]);
  const [stats, setStats] = useState({
    totalRooms: 0,
    available: 0,
    inUse: 0,
    reserved: 0,
    maintenance: 0,
    todayBookings: 0,
    pendingApprovals: 0,
  });
  const [loading, setLoading] = useState(true);
  const [buildings, setBuildings] = useState<string[]>([]);
  
  // 筛选状态
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [buildingFilter, setBuildingFilter] = useState<string>('all');

  // 获取统计数据
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/academic/rooms/stats?type=overview');
      const data: ApiResponse<{
        rooms: { total: number; available: number; in_use: number; reserved: number; maintenance: number };
        bookings: { today: number; pending: number };
      }> = await res.json();
      
      if (data.success && data.data) {
        setStats({
          totalRooms: data.data.rooms.total,
          available: data.data.rooms.available,
          inUse: data.data.rooms.in_use,
          reserved: data.data.rooms.reserved,
          maintenance: data.data.rooms.maintenance,
          todayBookings: data.data.bookings.today,
          pendingApprovals: data.data.bookings.pending,
        });
      }
    } catch (err) {
      console.error('获取统计数据失败:', err);
    }
  }, []);

  // 获取教室列表
  const fetchRooms = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (buildingFilter !== 'all') params.set('building', buildingFilter);
      if (searchTerm) params.set('search', searchTerm);
      
      const res = await fetch(`/api/academic/rooms?${params.toString()}`);
      const data: ApiResponse<RoomRecord[]> = await res.json();
      
      if (data.success && data.data) {
        const transformedRooms = data.data.map(transformRoom);
        setRooms(transformedRooms);
        
        // 提取楼栋列表
        const buildingSet = new Set(transformedRooms.map(r => r.building));
        setBuildings(Array.from(buildingSet));
      }
    } catch (err) {
      console.error('获取教室列表失败:', err);
    }
  }, [typeFilter, statusFilter, buildingFilter, searchTerm]);

  // 获取今日预约
  const fetchTodayBookings = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(`/api/academic/rooms/bookings?bookingDate=${today}`);
      const data: ApiResponse<BookingRecord[]> = await res.json();
      
      if (data.success && data.data) {
        setTodayBookings(data.data.map(transformBooking));
      }
    } catch (err) {
      console.error('获取今日预约失败:', err);
    }
  }, []);

  // 初始加载
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchRooms(), fetchTodayBookings()]);
      setLoading(false);
    };
    loadData();
  }, [fetchStats, fetchRooms, fetchTodayBookings]);

  // 筛选变化时重新获取
  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // 过滤教室（前端额外筛选）
  const filteredRooms = rooms.filter(room => {
    const matchSearch = !searchTerm || 
                        room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        room.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        room.location.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch;
  });

  // 今日日期显示
  const today = new Date();
  const todayStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日 · 星期${['日', '一', '二', '三', '四', '五', '六'][today.getDay()]}`;

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
            <h1 className="text-2xl font-bold text-gray-900">教室管理</h1>
          </div>
          <p className="text-gray-500 mt-1">管理教室资源，查看预约情况</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/academic/rooms/calendar">
              <Calendar className="h-4 w-4 mr-2" />
              预约日历
            </Link>
          </Button>
          <Button asChild>
            <Link href="/academic/rooms/booking">
              <Plus className="h-4 w-4 mr-2" />
              预约教室
            </Link>
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-md bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">教室总数</p>
                <p className="text-3xl font-bold mt-1">{stats.totalRooms}</p>
              </div>
              <DoorOpen className="h-10 w-10 text-blue-200" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">空闲可用</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{stats.available}</p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-300" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">今日预约</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{stats.todayBookings}</p>
              </div>
              <Calendar className="h-10 w-10 text-blue-300" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow">
          <Link href="/academic/rooms/approval">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">待审批</p>
                  <p className="text-3xl font-bold text-orange-600 mt-1">{stats.pendingApprovals}</p>
                </div>
                <FileText className="h-10 w-10 text-orange-300" />
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* 快速入口 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/academic/rooms/booking" className="block">
          <Card className="border-0 shadow-md hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer group">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <Plus className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">预约教室</h3>
                  <p className="text-sm text-gray-500">提交教室使用申请</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/academic/rooms/calendar" className="block">
          <Card className="border-0 shadow-md hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer group">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">预约日历</h3>
                  <p className="text-sm text-gray-500">查看教室使用日程</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/academic/rooms/approval" className="block">
          <Card className="border-0 shadow-md hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer group">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                  <FileText className="h-6 w-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">预约审批</h3>
                  <p className="text-sm text-gray-500">审核教室预约申请</p>
                </div>
                <div className="flex items-center gap-2">
                  {stats.pendingApprovals > 0 && (
                    <Badge className="bg-orange-500 text-white">{stats.pendingApprovals}</Badge>
                  )}
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-orange-600 transition-colors" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* 主内容区 */}
      <Tabs defaultValue="rooms" className="space-y-4">
        <TabsList className="bg-white border shadow-sm">
          <TabsTrigger value="rooms" className="gap-2">
            <DoorOpen className="h-4 w-4" />
            教室列表
          </TabsTrigger>
          <TabsTrigger value="today" className="gap-2">
            <Calendar className="h-4 w-4" />
            今日预约
          </TabsTrigger>
        </TabsList>

        {/* 教室列表 */}
        <TabsContent value="rooms" className="space-y-4">
          {/* 筛选栏 */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="搜索教室名称、编码或位置..."
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
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    {Object.entries(roomStatusMap).map(([key, value]) => (
                      <SelectItem key={key} value={key}>{value.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={buildingFilter} onValueChange={setBuildingFilter}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="楼栋" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部楼栋</SelectItem>
                    {buildings.map(building => (
                      <SelectItem key={building} value={building}>{building}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* 教室网格 */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredRooms.map(room => {
              const TypeIcon = roomTypeMap[room.type].icon;
              return (
                <Card key={room.id} className="border-0 shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                  <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${roomTypeMap[room.type].color}`}>
                          <TypeIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{room.name}</CardTitle>
                          <CardDescription className="text-xs">{room.code}</CardDescription>
                        </div>
                      </div>
                      <Badge className={roomStatusMap[room.status].color}>
                        {roomStatusMap[room.status].label}
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
                        <span>{room.capacity}人</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 col-span-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="truncate">{room.location}</span>
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
                      {room.facilities?.videoConference && (
                        <Badge variant="outline" className="text-xs">视频会议</Badge>
                      )}
                      {room.facilities?.recording && (
                        <Badge variant="outline" className="text-xs">录播</Badge>
                      )}
                    </div>

                    {/* 使用统计 */}
                    <div className="pt-2 border-t flex items-center justify-between text-xs text-gray-500">
                      <span>本月使用 {room.usageStats?.thisMonth || 0} 次</span>
                      <span>共 {room.usageStats?.totalBookings || 0} 次</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredRooms.length === 0 && (
            <Card className="border-0 shadow-md">
              <CardContent className="py-12 text-center text-gray-500">
                <DoorOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>没有找到匹配的教室</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 今日预约 */}
        <TabsContent value="today" className="space-y-4">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">今日预约情况</CardTitle>
                  <CardDescription>{todayStr}</CardDescription>
                </div>
                <Badge className="bg-blue-100 text-blue-700">
                  共 {todayBookings.length} 条预约
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todayBookings.map(booking => {
                  const StatusIcon = bookingStatusMap[booking.status].icon;
                  return (
                    <div 
                      key={booking.id} 
                      className="flex items-start gap-4 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      {/* 时间 */}
                      <div className="text-center min-w-[80px]">
                        <div className="text-lg font-semibold text-gray-900">{booking.startTime}</div>
                        <div className="text-sm text-gray-500">至 {booking.endTime}</div>
                      </div>

                      {/* 分隔线 */}
                      <div className="w-px h-16 bg-gray-200" />

                      {/* 内容 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900 truncate">{booking.title}</h4>
                          <Badge className={purposeMap[booking.purpose].color}>
                            {purposeMap[booking.purpose].label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {booking.roomName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {booking.applicantName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {booking.expectedAttendees}人
                          </span>
                        </div>
                      </div>

                      {/* 状态 */}
                      <Badge className={bookingStatusMap[booking.status].color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {bookingStatusMap[booking.status].label}
                      </Badge>
                    </div>
                  );
                })}

                {todayBookings.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                    <p>今日暂无预约</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
