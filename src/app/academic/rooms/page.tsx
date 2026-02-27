'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  Plus,
  Search,
  MapPin,
  Users,
  Monitor,
  Mic,
  Volume2,
  AirVent,
  Wifi,
  Video,
  Camera,
  Settings,
  Eye,
  Edit,
  Power,
  AlertTriangle,
  CheckCircle,
  Clock,
  Building,
  Layers,
  MoreHorizontal,
  Presentation,
  FileCheck,
  XCircle,
  Calendar,
  User,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Room, RoomType, RoomStatus } from '@/types';

// 模拟教室数据
const mockRooms: Room[] = [
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
      projector: true,
      computer: true,
      microphone: true,
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
    managerName: '张主任',
    usageStats: { totalBookings: 156, thisMonth: 23, lastUsedAt: '2024-03-14 16:00' },
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
      projector: true,
      computer: true,
      microphone: false,
      speaker: true,
      whiteboard: true,
      blackboard: true,
      airConditioner: true,
      wifi: true,
      videoConference: false,
      recording: false,
    },
    status: 'available',
    managerId: 't002',
    managerName: '李主任',
    usageStats: { totalBookings: 98, thisMonth: 15, lastUsedAt: '2024-03-15 10:00' },
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
    status: 'reserved',
    managerId: 'admin',
    managerName: '教务处',
    usageStats: { totalBookings: 234, thisMonth: 18, lastUsedAt: '2024-03-15 14:00' },
    createdAt: '2023-09-01',
    updatedAt: '2024-03-15',
  },
  {
    id: 'room-004',
    name: '3号楼多媒体教室',
    code: 'BLD3-MM01',
    type: 'multimedia_room',
    building: '3号楼',
    floor: 4,
    location: '3号楼4层北侧',
    capacity: 50,
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
    status: 'maintenance',
    managerId: 't003',
    managerName: '王老师',
    usageStats: { totalBookings: 89, thisMonth: 5, lastUsedAt: '2024-03-10 11:00' },
    remark: '投影仪维修中，预计3月18日恢复',
    createdAt: '2023-09-01',
    updatedAt: '2024-03-12',
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
      projector: true,
      computer: false,
      microphone: false,
      speaker: false,
      whiteboard: true,
      blackboard: false,
      airConditioner: true,
      wifi: true,
      videoConference: true,
      recording: false,
    },
    status: 'available',
    managerId: 'admin',
    managerName: '校办',
    usageStats: { totalBookings: 167, thisMonth: 28, lastUsedAt: '2024-03-14 15:30' },
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
      projector: false,
      computer: false,
      microphone: false,
      speaker: false,
      whiteboard: true,
      blackboard: false,
      airConditioner: true,
      wifi: true,
      videoConference: false,
      recording: false,
    },
    status: 'available',
    usageStats: { totalBookings: 45, thisMonth: 8, lastUsedAt: '2024-03-13 09:00' },
    createdAt: '2023-09-01',
    updatedAt: '2024-03-13',
  },
];

// 模拟预约申请数据
const mockBookings = [
  {
    id: 'bk-001',
    roomId: 'room-003',
    roomName: '1号楼阶梯教室',
    applicantId: 't001',
    applicantName: '张老师',
    applicantDept: '语文教研组',
    purpose: '公开课观摩活动',
    date: '2024-03-20',
    timeSlot: '14:00-16:00',
    expectedAttendees: 150,
    status: 'pending',
    createdAt: '2024-03-15 09:30',
    remark: '需要使用投影仪和麦克风',
  },
  {
    id: 'bk-002',
    roomId: 'room-001',
    roomName: '2号楼教研室',
    applicantId: 't002',
    applicantName: '李老师',
    applicantDept: '数学教研组',
    purpose: '教研组集体备课',
    date: '2024-03-18',
    timeSlot: '15:00-17:00',
    expectedAttendees: 20,
    status: 'pending',
    createdAt: '2024-03-14 14:20',
  },
  {
    id: 'bk-003',
    roomId: 'room-005',
    roomName: '综合楼会议室',
    applicantId: 't003',
    applicantName: '王老师',
    applicantDept: '英语教研组',
    purpose: '英语角活动',
    date: '2024-03-16',
    timeSlot: '16:00-18:00',
    expectedAttendees: 30,
    status: 'approved',
    approverName: '教务主任',
    approvedAt: '2024-03-14 10:00',
    createdAt: '2024-03-13 11:30',
  },
  {
    id: 'bk-004',
    roomId: 'room-003',
    roomName: '1号楼阶梯教室',
    applicantId: 't004',
    applicantName: '赵老师',
    applicantDept: '科学教研组',
    purpose: '科普讲座',
    date: '2024-03-15',
    timeSlot: '09:00-11:00',
    expectedAttendees: 180,
    status: 'rejected',
    rejectReason: '该时段已有其他安排',
    rejectedAt: '2024-03-13 15:30',
    createdAt: '2024-03-12 16:00',
  },
  {
    id: 'bk-005',
    roomId: 'room-002',
    roomName: '4号楼教研室',
    applicantId: 't005',
    applicantName: '陈老师',
    applicantDept: '美术教研组',
    purpose: '美术作品评审会',
    date: '2024-03-17',
    timeSlot: '10:00-12:00',
    expectedAttendees: 15,
    status: 'approved',
    approverName: '教务主任',
    approvedAt: '2024-03-15 08:30',
    createdAt: '2024-03-14 09:00',
  },
];

// 预约状态映射
const bookingStatusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待审批', color: 'bg-amber-100 text-amber-700' },
  approved: { label: '已通过', color: 'bg-green-100 text-green-700' },
  rejected: { label: '已驳回', color: 'bg-red-100 text-red-700' },
  cancelled: { label: '已取消', color: 'bg-gray-100 text-gray-500' },
};

// 教室类型映射
const roomTypeMap: Record<RoomType, { label: string; color: string }> = {
  seminar_room: { label: '教研室', color: 'text-blue-600 bg-blue-50' },
  lecture_hall: { label: '阶梯教室', color: 'text-purple-600 bg-purple-50' },
  multimedia_room: { label: '多媒体教室', color: 'text-green-600 bg-green-50' },
  lab: { label: '实验室', color: 'text-orange-600 bg-orange-50' },
  meeting_room: { label: '会议室', color: 'text-teal-600 bg-teal-50' },
  activity_room: { label: '活动室', color: 'text-pink-600 bg-pink-50' },
};

// 教室状态映射
const roomStatusMap: Record<RoomStatus, { label: string; color: string; icon: any }> = {
  available: { label: '可用', color: 'text-green-600 bg-green-50', icon: CheckCircle },
  in_use: { label: '使用中', color: 'text-blue-600 bg-blue-50', icon: Clock },
  reserved: { label: '已预约', color: 'text-purple-600 bg-purple-50', icon: Clock },
  maintenance: { label: '维护中', color: 'text-orange-600 bg-orange-50', icon: AlertTriangle },
  locked: { label: '已锁定', color: 'text-gray-600 bg-gray-50', icon: Power },
};

// 设施图标映射
const facilityIconMap: Record<string, { icon: any; label: string }> = {
  projector: { icon: Monitor, label: '投影仪' },
  computer: { icon: Monitor, label: '电脑' },
  microphone: { icon: Mic, label: '麦克风' },
  speaker: { icon: Volume2, label: '音响' },
  whiteboard: { icon: Presentation, label: '白板' },
  blackboard: { icon: Presentation, label: '黑板' },
  airConditioner: { icon: AirVent, label: '空调' },
  wifi: { icon: Wifi, label: 'WiFi' },
  videoConference: { icon: Video, label: '视频会议' },
  recording: { icon: Camera, label: '录播' },
};

export default function RoomManagementPage() {
  const [activeTab, setActiveTab] = useState('rooms');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [buildingFilter, setBuildingFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  
  // 审批相关状态
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<typeof mockBookings[0] | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [rejectReason, setRejectReason] = useState('');

  // 统计审批数量
  const bookingStats = {
    pending: mockBookings.filter(b => b.status === 'pending').length,
    approved: mockBookings.filter(b => b.status === 'approved').length,
    rejected: mockBookings.filter(b => b.status === 'rejected').length,
  };

  // 过滤预约申请
  const filteredBookings = mockBookings.filter(booking => {
    return bookingStatusFilter === 'all' || booking.status === bookingStatusFilter;
  });

  // 处理审批
  const handleApproval = (booking: typeof mockBookings[0], action: 'approve' | 'reject') => {
    setSelectedBooking(booking);
    setApprovalAction(action);
    setRejectReason('');
    setShowApprovalDialog(true);
  };

  // 过滤教室
  const filteredRooms = mockRooms.filter(room => {
    const matchSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        room.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        room.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = typeFilter === 'all' || room.type === typeFilter;
    const matchBuilding = buildingFilter === 'all' || room.building === buildingFilter;
    const matchStatus = statusFilter === 'all' || room.status === statusFilter;
    return matchSearch && matchType && matchBuilding && matchStatus;
  });

  // 统计
  const stats = {
    total: mockRooms.length,
    available: mockRooms.filter(r => r.status === 'available').length,
    reserved: mockRooms.filter(r => r.status === 'reserved').length,
    maintenance: mockRooms.filter(r => r.status === 'maintenance').length,
  };

  // 获取楼栋列表
  const buildings = [...new Set(mockRooms.map(r => r.building))];

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-indigo-50/30 via-white to-purple-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <DoorOpen className="h-7 w-7 text-indigo-600" />
            <h1 className="text-2xl font-bold text-gray-900">教室资源管理</h1>
          </div>
          <p className="text-gray-500 mt-1">教研室、阶梯教室等资源管理与预约审批</p>
        </div>
        <div className="flex items-center gap-3">
          {bookingStats.pending > 0 && (
            <Badge className="bg-amber-100 text-amber-700 px-3 py-1">
              {bookingStats.pending} 条待审批
            </Badge>
          )}
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4" />
            添加教室
          </Button>
        </div>
      </div>

      {/* 标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-100 p-1">
          <TabsTrigger value="rooms" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <DoorOpen className="h-4 w-4 mr-2" />
            教室列表
          </TabsTrigger>
          <TabsTrigger value="bookings" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <FileCheck className="h-4 w-4 mr-2" />
            预约审批
            {bookingStats.pending > 0 && (
              <span className="ml-1.5 bg-amber-500 text-white text-xs rounded-full px-1.5 py-0.5">
                {bookingStats.pending}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* 教室列表标签页 */}
        <TabsContent value="rooms" className="space-y-4 mt-4">
          {/* 统计卡片 */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">教室总数</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                  <DoorOpen className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">可预约</p>
                    <p className="text-2xl font-bold text-green-600">{stats.available}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">已预约</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.reserved}</p>
                  </div>
                  <Clock className="h-8 w-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">维护中</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.maintenance}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-orange-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 筛选栏 */}
          <Card className="border-0 shadow-md">
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
              <SelectTrigger className="w-32">
                <SelectValue placeholder="类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="seminar_room">教研室</SelectItem>
                <SelectItem value="lecture_hall">阶梯教室</SelectItem>
                <SelectItem value="multimedia_room">多媒体教室</SelectItem>
                <SelectItem value="meeting_room">会议室</SelectItem>
                <SelectItem value="lab">实验室</SelectItem>
              </SelectContent>
            </Select>
            <Select value={buildingFilter} onValueChange={setBuildingFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="楼栋" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部楼栋</SelectItem>
                {buildings.map(b => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-28">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="available">可用</SelectItem>
                <SelectItem value="reserved">已预约</SelectItem>
                <SelectItem value="maintenance">维护中</SelectItem>
                <SelectItem value="locked">已锁定</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 教室列表 */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>教室名称</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>位置</TableHead>
                <TableHead>容量</TableHead>
                <TableHead>设施</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>本月预约</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRooms.map(room => {
                const typeInfo = roomTypeMap[room.type];
                const statusInfo = roomStatusMap[room.status];
                const StatusIcon = statusInfo.icon;
                const facilityCount = Object.values(room.facilities).filter(Boolean).length;

                return (
                  <TableRow key={room.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div>
                        <p className="font-medium">{room.name}</p>
                        <p className="text-xs text-gray-400">{room.code}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={typeInfo.color}>{typeInfo.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-gray-600">
                        <MapPin className="h-3 w-3" />
                        <span className="text-sm">{room.location}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span>{room.capacity}人</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Settings className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{facilityCount}项</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusInfo.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="font-medium">{room.usageStats?.thisMonth || 0}</span>
                      <span className="text-xs text-gray-400 ml-1">次</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedRoom(room)}>
                            <Eye className="h-4 w-4 mr-2" />
                            查看详情
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            编辑信息
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Clock className="h-4 w-4 mr-2" />
                            查看日程
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            报修设备
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
        </TabsContent>

        {/* 预约审批标签页 */}
        <TabsContent value="bookings" className="space-y-4 mt-4">
          {/* 审批统计 */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">待审批</p>
                    <p className="text-2xl font-bold text-amber-600">{bookingStats.pending}</p>
                  </div>
                  <Clock className="h-8 w-8 text-amber-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">已通过</p>
                    <p className="text-2xl font-bold text-green-600">{bookingStats.approved}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">已驳回</p>
                    <p className="text-2xl font-bold text-red-600">{bookingStats.rejected}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-400" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">总计</p>
                    <p className="text-2xl font-bold text-gray-900">{mockBookings.length}</p>
                  </div>
                  <FileCheck className="h-8 w-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 筛选栏 */}
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Filter className="h-4 w-4 text-gray-400" />
                <Select value={bookingStatusFilter} onValueChange={setBookingStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="审批状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    <SelectItem value="pending">待审批</SelectItem>
                    <SelectItem value="approved">已通过</SelectItem>
                    <SelectItem value="rejected">已驳回</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* 预约列表 */}
          <Card className="border-0 shadow-md">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>申请人</TableHead>
                    <TableHead>教室</TableHead>
                    <TableHead>用途</TableHead>
                    <TableHead>日期时间</TableHead>
                    <TableHead>人数</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>申请时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map(booking => (
                    <TableRow key={booking.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <p className="font-medium">{booking.applicantName}</p>
                          <p className="text-xs text-gray-400">{booking.applicantDept}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DoorOpen className="h-3 w-3 text-gray-400" />
                          <span className="text-sm">{booking.roomName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{booking.purpose}</span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{booking.date}</p>
                          <p className="text-xs text-gray-400">{booking.timeSlot}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span>{booking.expectedAttendees}人</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={bookingStatusMap[booking.status].color}>
                          {bookingStatusMap[booking.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">{booking.createdAt}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        {booking.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 hover:bg-green-50"
                              onClick={() => handleApproval(booking, 'approve')}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              通过
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => handleApproval(booking, 'reject')}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              驳回
                            </Button>
                          </div>
                        ) : (
                          <Button size="sm" variant="ghost" onClick={() => setSelectedBooking(booking)}>
                            <Eye className="h-4 w-4 mr-1" />
                            查看
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 教室详情对话框 */}
      <Dialog open={!!selectedRoom} onOpenChange={() => setSelectedRoom(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DoorOpen className="h-5 w-5 text-indigo-600" />
              教室详情
            </DialogTitle>
            <DialogDescription>
              {selectedRoom?.name} ({selectedRoom?.code})
            </DialogDescription>
          </DialogHeader>

          {selectedRoom && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-gray-500 text-xs">教室类型</Label>
                  <p className="font-medium">{roomTypeMap[selectedRoom.type].label}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-500 text-xs">状态</Label>
                  <Badge className={roomStatusMap[selectedRoom.status].color}>
                    {roomStatusMap[selectedRoom.status].label}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-500 text-xs">所在楼栋</Label>
                  <p className="font-medium">{selectedRoom.building} · {selectedRoom.floor}层</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-500 text-xs">具体位置</Label>
                  <p className="font-medium">{selectedRoom.location}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-500 text-xs">容纳人数</Label>
                  <p className="font-medium">{selectedRoom.capacity} 人</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-500 text-xs">面积</Label>
                  <p className="font-medium">{selectedRoom.area || '-'} m²</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-500 text-xs">管理员</Label>
                  <p className="font-medium">{selectedRoom.managerName || '未指定'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-500 text-xs">本月预约</Label>
                  <p className="font-medium">{selectedRoom.usageStats?.thisMonth || 0} 次</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <Label className="text-gray-500 text-xs mb-3 block">设施配置</Label>
                <div className="grid grid-cols-5 gap-2">
                  {Object.entries(selectedRoom.facilities).map(([key, value]) => {
                    const facility = facilityIconMap[key];
                    if (!facility) return null;
                    const Icon = facility.icon;
                    return (
                      <div
                        key={key}
                        className={`flex flex-col items-center p-2 rounded-lg border ${
                          value ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50 opacity-50'
                        }`}
                      >
                        <Icon className={`h-5 w-5 ${value ? 'text-green-600' : 'text-gray-400'}`} />
                        <span className="text-xs mt-1">{facility.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedRoom.remark && (
                <div className="border-t pt-4">
                  <Label className="text-gray-500 text-xs mb-1 block">备注</Label>
                  <p className="text-sm text-gray-700 bg-orange-50 p-2 rounded">{selectedRoom.remark}</p>
                </div>
              )}

              <div className="border-t pt-4">
                <Label className="text-gray-500 text-xs mb-2 block">使用统计</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-xl font-bold text-blue-600">{selectedRoom.usageStats?.totalBookings || 0}</p>
                    <p className="text-xs text-gray-500">累计预约</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-xl font-bold text-green-600">{selectedRoom.usageStats?.thisMonth || 0}</p>
                    <p className="text-xs text-gray-500">本月预约</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm font-medium text-purple-600">
                      {selectedRoom.usageStats?.lastUsedAt?.split(' ')[0] || '-'}
                    </p>
                    <p className="text-xs text-gray-500">最后使用</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRoom(null)}>关闭</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700">编辑信息</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 添加教室对话框 */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>添加教室</DialogTitle>
            <DialogDescription>
              登记新的教室或活动场所
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>教室名称 *</Label>
                <Input placeholder="如：2号楼教研室" />
              </div>
              <div className="space-y-2">
                <Label>教室编码</Label>
                <Input placeholder="如：BLD2-SR01" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>教室类型</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="选择类型" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seminar_room">教研室</SelectItem>
                    <SelectItem value="lecture_hall">阶梯教室</SelectItem>
                    <SelectItem value="multimedia_room">多媒体教室</SelectItem>
                    <SelectItem value="meeting_room">会议室</SelectItem>
                    <SelectItem value="lab">实验室</SelectItem>
                    <SelectItem value="activity_room">活动室</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>容纳人数</Label>
                <Input type="number" placeholder="0" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>所在楼栋</Label>
                <Input placeholder="如：2号楼" />
              </div>
              <div className="space-y-2">
                <Label>楼层</Label>
                <Input type="number" placeholder="1" />
              </div>
              <div className="space-y-2">
                <Label>面积(m²)</Label>
                <Input type="number" placeholder="0" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>具体位置</Label>
              <Input placeholder="如：2号楼3层东侧" />
            </div>
            <div className="space-y-2">
              <Label>设施配置</Label>
              <div className="grid grid-cols-5 gap-2">
                {Object.entries(facilityIconMap).map(([key, facility]) => {
                  const Icon = facility.icon;
                  return (
                    <label key={key} className="flex flex-col items-center p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <Checkbox id={key} className="sr-only" />
                      <Icon className="h-4 w-4 text-gray-600" />
                      <span className="text-xs mt-1">{facility.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <Label>管理员</Label>
              <Input placeholder="指定教室负责人" />
            </div>
            <div className="space-y-2">
              <Label>备注</Label>
              <Textarea placeholder="其他说明信息" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>取消</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700">添加教室</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 审批对话框 */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {approvalAction === 'approve' ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  确认通过
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  驳回申请
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedBooking && (
                <span>
                  {selectedBooking.applicantName} 申请使用 {selectedBooking.roomName}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-4 py-4">
              <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">申请时间</span>
                  <span>{selectedBooking.createdAt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">使用日期</span>
                  <span>{selectedBooking.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">时间段</span>
                  <span>{selectedBooking.timeSlot}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">参加人数</span>
                  <span>{selectedBooking.expectedAttendees}人</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">用途</span>
                  <span>{selectedBooking.purpose}</span>
                </div>
              </div>

              {approvalAction === 'reject' && (
                <div className="space-y-2">
                  <Label>驳回原因 *</Label>
                  <Textarea
                    placeholder="请填写驳回原因..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>取消</Button>
            {approvalAction === 'approve' ? (
              <Button className="bg-green-600 hover:bg-green-700" onClick={() => setShowApprovalDialog(false)}>
                确认通过
              </Button>
            ) : (
              <Button className="bg-red-600 hover:bg-red-700" onClick={() => setShowApprovalDialog(false)}>
                确认驳回
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 预约详情对话框 */}
      <Dialog open={!!selectedBooking && !showApprovalDialog} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-indigo-600" />
              预约详情
            </DialogTitle>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-center">
                <Badge className={`${bookingStatusMap[selectedBooking.status].color} text-base px-4 py-1`}>
                  {bookingStatusMap[selectedBooking.status].label}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">{selectedBooking.applicantName}</p>
                    <p className="text-xs text-gray-500">{selectedBooking.applicantDept}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <DoorOpen className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">{selectedBooking.roomName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">{selectedBooking.date}</p>
                    <p className="text-xs text-gray-500">{selectedBooking.timeSlot}</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">用途</span>
                  <span>{selectedBooking.purpose}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">参加人数</span>
                  <span>{selectedBooking.expectedAttendees}人</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">申请时间</span>
                  <span>{selectedBooking.createdAt}</span>
                </div>
                {selectedBooking.remark && (
                  <div className="pt-2 border-t">
                    <span className="text-gray-500">备注：</span>
                    <span>{selectedBooking.remark}</span>
                  </div>
                )}
              </div>

              {selectedBooking.status === 'approved' && selectedBooking.approverName && (
                <div className="bg-green-50 rounded-lg p-3 text-sm">
                  <p className="text-green-700">
                    审批人：{selectedBooking.approverName}
                  </p>
                  <p className="text-green-600 text-xs">
                    审批时间：{selectedBooking.approvedAt}
                  </p>
                </div>
              )}

              {selectedBooking.status === 'rejected' && selectedBooking.rejectReason && (
                <div className="bg-red-50 rounded-lg p-3 text-sm">
                  <p className="text-red-700 font-medium">驳回原因：</p>
                  <p className="text-red-600">{selectedBooking.rejectReason}</p>
                  <p className="text-red-500 text-xs mt-1">
                    驳回时间：{selectedBooking.rejectedAt}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedBooking(null)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
