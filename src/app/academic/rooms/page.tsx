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
} from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [buildingFilter, setBuildingFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

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
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2" onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4" />
          添加教室
        </Button>
      </div>

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
    </div>
  );
}
