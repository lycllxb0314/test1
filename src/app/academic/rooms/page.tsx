'use client';

import React, { useState } from 'react';
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
  Settings,
  Monitor,
  FlaskConical,
  Presentation,
  Gamepad2,
  Wrench,
  Eye,
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

// 模拟教室数据
const mockRooms: Room[] = [
  {
    id: 'room-001',
    name: '2号楼教研室',
    code: '2-301',
    type: 'seminar_room',
    building: '2号楼',
    floor: 3,
    location: '2号楼3层东侧',
    capacity: 30,
    area: 80,
    facilities: {
      projector: true,
      computer: true,
      microphone: false,
      speaker: true,
      whiteboard: true,
      blackboard: false,
      airConditioner: true,
      wifi: true,
      videoConference: false,
      recording: false,
    },
    status: 'available',
    managerId: 't001',
    managerName: '张明华',
    usageStats: {
      totalBookings: 156,
      thisMonth: 23,
      lastUsedAt: '2024-03-15 16:00',
    },
    createdAt: '2023-09-01',
    updatedAt: '2024-03-15',
  },
  {
    id: 'room-002',
    name: '4号楼教研室',
    code: '4-201',
    type: 'seminar_room',
    building: '4号楼',
    floor: 2,
    location: '4号楼2层西侧',
    capacity: 25,
    area: 65,
    facilities: {
      projector: true,
      computer: false,
      microphone: false,
      speaker: true,
      whiteboard: true,
      blackboard: true,
      airConditioner: true,
      wifi: true,
      videoConference: false,
      recording: false,
    },
    status: 'reserved',
    managerId: 't002',
    managerName: '李晓红',
    usageStats: {
      totalBookings: 98,
      thisMonth: 15,
      lastUsedAt: '2024-03-14 17:30',
    },
    createdAt: '2023-09-01',
    updatedAt: '2024-03-14',
  },
  {
    id: 'room-003',
    name: '1号楼阶梯教室',
    code: '1-101',
    type: 'lecture_hall',
    building: '1号楼',
    floor: 1,
    location: '1号楼1层大厅',
    capacity: 200,
    area: 350,
    facilities: {
      projector: true,
      computer: true,
      microphone: true,
      speaker: true,
      whiteboard: false,
      blackboard: true,
      airConditioner: true,
      wifi: true,
      videoConference: true,
      recording: true,
    },
    status: 'available',
    managerId: 't003',
    managerName: '王建国',
    usageStats: {
      totalBookings: 245,
      thisMonth: 32,
      lastUsedAt: '2024-03-15 11:00',
    },
    createdAt: '2023-09-01',
    updatedAt: '2024-03-15',
  },
  {
    id: 'room-004',
    name: '科学实验室',
    code: '3-401',
    type: 'lab',
    building: '3号楼',
    floor: 4,
    location: '3号楼4层',
    capacity: 50,
    area: 150,
    facilities: {
      projector: true,
      computer: true,
      microphone: false,
      speaker: true,
      whiteboard: true,
      blackboard: false,
      airConditioner: true,
      wifi: true,
      videoConference: false,
      recording: false,
    },
    extraFacilities: ['实验器材', '通风系统', '紧急喷淋'],
    status: 'in_use',
    managerId: 't004',
    managerName: '赵明华',
    usageStats: {
      totalBookings: 180,
      thisMonth: 28,
      lastUsedAt: '2024-03-15 15:30',
    },
    createdAt: '2023-09-01',
    updatedAt: '2024-03-15',
  },
  {
    id: 'room-005',
    name: '综合楼会议室',
    code: 'ZH-501',
    type: 'meeting_room',
    building: '综合楼',
    floor: 5,
    location: '综合楼5层',
    capacity: 40,
    area: 100,
    facilities: {
      projector: true,
      computer: true,
      microphone: true,
      speaker: true,
      whiteboard: true,
      blackboard: false,
      airConditioner: true,
      wifi: true,
      videoConference: true,
      recording: false,
    },
    status: 'maintenance',
    managerId: 't005',
    managerName: '陈雨婷',
    usageStats: {
      totalBookings: 120,
      thisMonth: 8,
      lastUsedAt: '2024-03-10 16:00',
    },
    createdAt: '2023-09-01',
    updatedAt: '2024-03-10',
  },
  {
    id: 'room-006',
    name: '多媒体教室A',
    code: 'M-101',
    type: 'multimedia_room',
    building: '教学楼',
    floor: 1,
    location: '教学楼1层南侧',
    capacity: 60,
    area: 120,
    facilities: {
      projector: true,
      computer: true,
      microphone: true,
      speaker: true,
      whiteboard: true,
      blackboard: false,
      airConditioner: true,
      wifi: true,
      videoConference: false,
      recording: true,
    },
    status: 'available',
    managerId: 't006',
    managerName: '刘志强',
    usageStats: {
      totalBookings: 210,
      thisMonth: 35,
      lastUsedAt: '2024-03-15 14:00',
    },
    createdAt: '2023-09-01',
    updatedAt: '2024-03-15',
  },
];

// 模拟今日预约数据
const mockTodayBookings: RoomBooking[] = [
  {
    id: 'b001',
    roomId: 'room-001',
    roomName: '2号楼教研室',
    roomType: 'seminar_room',
    building: '2号楼',
    location: '2号楼3层东侧',
    applicantId: 't001',
    applicantName: '张明华',
    applicantRole: 'subject_teacher',
    department: '语文组',
    purpose: 'meeting',
    title: '语文教研组集体备课',
    bookingDate: '2024-03-18',
    startTime: '14:00',
    endTime: '16:00',
    duration: 120,
    expectedAttendees: 15,
    attendeeType: 'teacher',
    status: 'approved',
    approvalFlow: [],
    currentStep: 1,
    createdAt: '2024-03-15 10:30',
    updatedAt: '2024-03-15 11:00',
  },
  {
    id: 'b009',
    roomId: 'room-003',
    roomName: '1号楼阶梯教室',
    roomType: 'lecture_hall',
    building: '1号楼',
    location: '1号楼1层大厅',
    applicantId: 't002',
    applicantName: '李晓红',
    applicantRole: 'subject_teacher',
    department: '数学组',
    purpose: 'training',
    title: '数学思维训练讲座',
    bookingDate: '2024-03-18',
    startTime: '09:00',
    endTime: '11:00',
    duration: 120,
    expectedAttendees: 150,
    attendeeType: 'student',
    status: 'in_progress',
    approvalFlow: [],
    currentStep: 1,
    createdAt: '2024-03-14 09:00',
    updatedAt: '2024-03-14 10:00',
  },
  {
    id: 'b010',
    roomId: 'room-005',
    roomName: '综合楼会议室',
    roomType: 'meeting_room',
    building: '综合楼',
    location: '综合楼5层',
    applicantId: 't003',
    applicantName: '王建国',
    applicantRole: 'subject_teacher',
    department: '科学组',
    purpose: 'meeting',
    title: '科学组教研活动',
    bookingDate: '2024-03-18',
    startTime: '15:00',
    endTime: '17:00',
    duration: 120,
    expectedAttendees: 10,
    attendeeType: 'teacher',
    status: 'approved',
    approvalFlow: [],
    currentStep: 1,
    createdAt: '2024-03-15 14:00',
    updatedAt: '2024-03-15 15:00',
  },
];

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

export default function RoomsManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [buildingFilter, setBuildingFilter] = useState<string>('all');

  // 统计数据
  const stats = {
    totalRooms: mockRooms.length,
    available: mockRooms.filter(r => r.status === 'available').length,
    inUse: mockRooms.filter(r => r.status === 'in_use').length,
    reserved: mockRooms.filter(r => r.status === 'reserved').length,
    maintenance: mockRooms.filter(r => r.status === 'maintenance').length,
    todayBookings: mockTodayBookings.length,
    pendingApprovals: 3, // 模拟待审批数量
  };

  // 获取所有楼栋
  const buildings = [...new Set(mockRooms.map(r => r.building))];

  // 过滤教室
  const filteredRooms = mockRooms.filter(room => {
    const matchSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        room.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        room.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = typeFilter === 'all' || room.type === typeFilter;
    const matchStatus = statusFilter === 'all' || room.status === statusFilter;
    const matchBuilding = buildingFilter === 'all' || room.building === buildingFilter;
    return matchSearch && matchType && matchStatus && matchBuilding;
  });

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
                      {room.facilities.projector && (
                        <Badge variant="outline" className="text-xs">投影</Badge>
                      )}
                      {room.facilities.airConditioner && (
                        <Badge variant="outline" className="text-xs">空调</Badge>
                      )}
                      {room.facilities.videoConference && (
                        <Badge variant="outline" className="text-xs">视频会议</Badge>
                      )}
                      {room.facilities.recording && (
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
                  <CardDescription>2024年3月18日 · 星期一</CardDescription>
                </div>
                <Badge className="bg-blue-100 text-blue-700">
                  共 {mockTodayBookings.length} 条预约
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockTodayBookings.map(booking => {
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

                {mockTodayBookings.length === 0 && (
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
