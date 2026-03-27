'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
  Wifi,
  WifiOff,
  AlertTriangle,
  Settings,
  MapPin,
  Clock,
  Monitor,
  Edit,
  Power,
  RefreshCw,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Eye,
  Activity,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AccessDevice, AccessDeviceType, AccessDeviceStatus } from '@/types';

// 模拟设备数据
const mockDevices: AccessDevice[] = [
  {
    id: 'dev-001',
    name: '东校门入口',
    code: 'GATE-E-001',
    type: 'gate',
    location: '学校东门',
    status: 'online',
    direction: 'in',
    manufacturer: '海康威视',
    model: 'DS-K1T671M',
    sn: 'HK2023010001',
    firmwareVersion: 'v2.3.1',
    ipAddress: '192.168.1.101',
    lastOnline: '2024-03-15 10:30:00',
    capabilities: { faceRecognition: true, cardReader: true, qrCode: true, fingerprint: false, temperature: true, metalDetection: false },
    accessRules: [],
    createdAt: '2024-01-15',
    updatedAt: '2024-03-15',
  },
  {
    id: 'dev-002',
    name: '东校门出口',
    code: 'GATE-E-002',
    type: 'gate',
    location: '学校东门',
    status: 'online',
    direction: 'out',
    manufacturer: '海康威视',
    model: 'DS-K1T671M',
    sn: 'HK2023010002',
    firmwareVersion: 'v2.3.1',
    ipAddress: '192.168.1.102',
    lastOnline: '2024-03-15 10:30:00',
    capabilities: { faceRecognition: true, cardReader: true, qrCode: true, fingerprint: false, temperature: false, metalDetection: false },
    accessRules: [],
    createdAt: '2024-01-15',
    updatedAt: '2024-03-15',
  },
  {
    id: 'dev-003',
    name: '西校门入口',
    code: 'GATE-W-001',
    type: 'gate',
    location: '学校西门',
    status: 'online',
    direction: 'in',
    manufacturer: '海康威视',
    model: 'DS-K1T671M',
    sn: 'HK2023010003',
    ipAddress: '192.168.1.103',
    lastOnline: '2024-03-15 10:28:00',
    capabilities: { faceRecognition: true, cardReader: true, qrCode: true, fingerprint: false, temperature: true, metalDetection: false },
    accessRules: [],
    createdAt: '2024-01-15',
    updatedAt: '2024-03-15',
  },
  {
    id: 'dev-004',
    name: '西校门出口',
    code: 'GATE-W-002',
    type: 'gate',
    location: '学校西门',
    status: 'offline',
    direction: 'out',
    manufacturer: '海康威视',
    model: 'DS-K1T671M',
    sn: 'HK2023010004',
    ipAddress: '192.168.1.104',
    lastOnline: '2024-03-14 18:45:00',
    capabilities: { faceRecognition: true, cardReader: true, qrCode: true, fingerprint: false, temperature: false, metalDetection: false },
    accessRules: [],
    createdAt: '2024-01-15',
    updatedAt: '2024-03-14',
  },
  {
    id: 'dev-005',
    name: '教学楼A栋入口',
    code: 'BLD-A-001',
    type: 'building',
    location: '教学楼A栋',
    buildingName: '教学楼A栋',
    status: 'online',
    direction: 'both',
    manufacturer: '大华',
    model: 'ASI7213Y',
    sn: 'DH2023010001',
    ipAddress: '192.168.2.101',
    lastOnline: '2024-03-15 10:30:00',
    capabilities: { faceRecognition: true, cardReader: true, qrCode: true, fingerprint: false, temperature: false, metalDetection: false },
    accessRules: [],
    createdAt: '2024-01-20',
    updatedAt: '2024-03-15',
  },
  {
    id: 'dev-006',
    name: '教学楼B栋入口',
    code: 'BLD-B-001',
    type: 'building',
    location: '教学楼B栋',
    buildingName: '教学楼B栋',
    status: 'online',
    direction: 'both',
    manufacturer: '大华',
    model: 'ASI7213Y',
    sn: 'DH2023010002',
    ipAddress: '192.168.2.102',
    lastOnline: '2024-03-15 10:30:00',
    capabilities: { faceRecognition: true, cardReader: true, qrCode: true, fingerprint: false, temperature: false, metalDetection: false },
    accessRules: [],
    createdAt: '2024-01-20',
    updatedAt: '2024-03-15',
  },
  {
    id: 'dev-007',
    name: '综合楼入口',
    code: 'BLD-C-001',
    type: 'building',
    location: '综合楼',
    buildingName: '综合楼',
    status: 'online',
    direction: 'both',
    manufacturer: '大华',
    model: 'ASI7213Y',
    sn: 'DH2023010003',
    ipAddress: '192.168.2.103',
    lastOnline: '2024-03-15 10:30:00',
    capabilities: { faceRecognition: true, cardReader: true, qrCode: true, fingerprint: false, temperature: false, metalDetection: false },
    accessRules: [],
    createdAt: '2024-01-20',
    updatedAt: '2024-03-15',
  },
  {
    id: 'dev-008',
    name: '食堂入口',
    code: 'BLD-D-001',
    type: 'building',
    location: '食堂',
    buildingName: '食堂',
    status: 'fault',
    direction: 'both',
    manufacturer: '大华',
    model: 'ASI7213Y',
    sn: 'DH2023010004',
    ipAddress: '192.168.2.104',
    lastOnline: '2024-03-15 09:15:00',
    capabilities: { faceRecognition: true, cardReader: true, qrCode: true, fingerprint: false, temperature: false, metalDetection: false },
    accessRules: [],
    createdAt: '2024-01-20',
    updatedAt: '2024-03-15',
  },
];

// 设备类型映射
const deviceTypeMap: Record<AccessDeviceType, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  gate: { label: '校门闸机', icon: DoorOpen, color: 'text-blue-600 bg-blue-50' },
  building: { label: '楼宇门禁', icon: Monitor, color: 'text-green-600 bg-green-50' },
  classroom: { label: '教室门禁', icon: Monitor, color: 'text-purple-600 bg-purple-50' },
  office: { label: '办公室门禁', icon: Monitor, color: 'text-orange-600 bg-orange-50' },
  dormitory: { label: '宿舍门禁', icon: Monitor, color: 'text-teal-600 bg-teal-50' },
};

// 设备状态映射
const deviceStatusMap: Record<AccessDeviceStatus, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  online: { label: '在线', color: 'text-green-600 bg-green-50', icon: Wifi },
  offline: { label: '离线', color: 'text-gray-600 bg-gray-50', icon: WifiOff },
  maintenance: { label: '维护中', color: 'text-yellow-600 bg-yellow-50', icon: Settings },
  fault: { label: '故障', color: 'text-red-600 bg-red-50', icon: AlertTriangle },
};

// 方向映射
const directionMap = {
  in: { label: '入口', color: 'text-blue-600 bg-blue-50' },
  out: { label: '出口', color: 'text-green-600 bg-green-50' },
  both: { label: '双向', color: 'text-purple-600 bg-purple-50' },
};

export default function AccessDevicesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<AccessDevice | null>(null);

  // 过滤设备
  const filteredDevices = mockDevices.filter(device => {
    const matchSearch = device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        device.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        device.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = typeFilter === 'all' || device.type === typeFilter;
    const matchStatus = statusFilter === 'all' || device.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  // 统计
  const stats = {
    total: mockDevices.length,
    online: mockDevices.filter(d => d.status === 'online').length,
    offline: mockDevices.filter(d => d.status === 'offline').length,
    fault: mockDevices.filter(d => d.status === 'fault').length,
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-teal-50/30 via-white to-cyan-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Monitor className="h-7 w-7 text-teal-600" />
            <h1 className="text-2xl font-bold text-gray-900">设备管理</h1>
          </div>
          <p className="text-gray-500 mt-1">门禁设备状态监控与配置</p>
        </div>
        <Button className="bg-teal-600 hover:bg-teal-700 text-white gap-2" onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4" />
          添加设备
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">设备总数</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Monitor className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">在线设备</p>
                <p className="text-2xl font-bold text-green-600">{stats.online}</p>
              </div>
              <Wifi className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">离线设备</p>
                <p className="text-2xl font-bold text-gray-600">{stats.offline}</p>
              </div>
              <WifiOff className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">故障设备</p>
                <p className="text-2xl font-bold text-red-600">{stats.fault}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-400" />
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
                placeholder="搜索设备名称、编码或位置..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="设备类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="gate">校门闸机</SelectItem>
                <SelectItem value="building">楼宇门禁</SelectItem>
                <SelectItem value="classroom">教室门禁</SelectItem>
                <SelectItem value="office">办公室门禁</SelectItem>
                <SelectItem value="dormitory">宿舍门禁</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="设备状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="online">在线</SelectItem>
                <SelectItem value="offline">离线</SelectItem>
                <SelectItem value="fault">故障</SelectItem>
                <SelectItem value="maintenance">维护中</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 设备列表 */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>设备名称</TableHead>
                <TableHead>设备编码</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>位置</TableHead>
                <TableHead>方向</TableHead>
                <TableHead>IP地址</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>最后在线</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDevices.map(device => {
                const typeInfo = deviceTypeMap[device.type];
                const statusInfo = deviceStatusMap[device.status];
                const dirInfo = directionMap[device.direction];
                const TypeIcon = typeInfo.icon;
                const StatusIcon = statusInfo.icon;

                return (
                  <TableRow key={device.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${typeInfo.color}`}>
                          <TypeIcon className="h-4 w-4" />
                        </div>
                        <span className="font-medium">{device.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-500">{device.code}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={typeInfo.color}>{typeInfo.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-gray-600">
                        <MapPin className="h-3 w-3" />
                        {device.location}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={dirInfo.color}>{dirInfo.label}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm text-gray-500">{device.ipAddress || '-'}</TableCell>
                    <TableCell>
                      <Badge className={statusInfo.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {device.lastOnline ? device.lastOnline.split(' ')[1] : '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedDevice(device)}>
                            <Eye className="h-4 w-4 mr-2" />
                            查看详情
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            编辑配置
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            同步数据
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            {device.status === 'online' ? (
                              <>
                                <Power className="h-4 w-4 mr-2" />
                                重启设备
                              </>
                            ) : (
                              <>
                                <Power className="h-4 w-4 mr-2" />
                                远程唤醒
                              </>
                            )}
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

      {/* 设备详情对话框 */}
      <Dialog open={!!selectedDevice} onOpenChange={() => setSelectedDevice(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-teal-600" />
              设备详情
            </DialogTitle>
            <DialogDescription>
              {selectedDevice?.name} ({selectedDevice?.code})
            </DialogDescription>
          </DialogHeader>

          {selectedDevice && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-gray-500 text-xs">设备类型</Label>
                  <p className="font-medium">{deviceTypeMap[selectedDevice.type].label}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-500 text-xs">设备状态</Label>
                  <Badge className={deviceStatusMap[selectedDevice.status].color}>
                    {deviceStatusMap[selectedDevice.status].label}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-500 text-xs">安装位置</Label>
                  <p className="font-medium">{selectedDevice.location}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-500 text-xs">通行方向</Label>
                  <p className="font-medium">{directionMap[selectedDevice.direction].label}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-500 text-xs">厂商</Label>
                  <p className="font-medium">{selectedDevice.manufacturer || '-'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-500 text-xs">型号</Label>
                  <p className="font-medium">{selectedDevice.model || '-'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-500 text-xs">序列号</Label>
                  <p className="font-medium font-mono">{selectedDevice.sn || '-'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-500 text-xs">固件版本</Label>
                  <p className="font-medium">{selectedDevice.firmwareVersion || '-'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-500 text-xs">IP地址</Label>
                  <p className="font-medium font-mono">{selectedDevice.ipAddress || '-'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-500 text-xs">最后在线</Label>
                  <p className="font-medium">{selectedDevice.lastOnline || '-'}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <Label className="text-gray-500 text-xs mb-2 block">设备能力</Label>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={selectedDevice.capabilities.faceRecognition ? 'default' : 'outline'} className={selectedDevice.capabilities.faceRecognition ? 'bg-teal-100 text-teal-700' : ''}>
                    {selectedDevice.capabilities.faceRecognition ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                    人脸识别
                  </Badge>
                  <Badge variant={selectedDevice.capabilities.cardReader ? 'default' : 'outline'} className={selectedDevice.capabilities.cardReader ? 'bg-teal-100 text-teal-700' : ''}>
                    {selectedDevice.capabilities.cardReader ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                    刷卡
                  </Badge>
                  <Badge variant={selectedDevice.capabilities.qrCode ? 'default' : 'outline'} className={selectedDevice.capabilities.qrCode ? 'bg-teal-100 text-teal-700' : ''}>
                    {selectedDevice.capabilities.qrCode ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                    二维码
                  </Badge>
                  <Badge variant={selectedDevice.capabilities.fingerprint ? 'default' : 'outline'} className={selectedDevice.capabilities.fingerprint ? 'bg-teal-100 text-teal-700' : ''}>
                    {selectedDevice.capabilities.fingerprint ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                    指纹
                  </Badge>
                  <Badge variant={selectedDevice.capabilities.temperature ? 'default' : 'outline'} className={selectedDevice.capabilities.temperature ? 'bg-teal-100 text-teal-700' : ''}>
                    {selectedDevice.capabilities.temperature ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                    体温检测
                  </Badge>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedDevice(null)}>关闭</Button>
            <Button className="bg-teal-600 hover:bg-teal-700">编辑配置</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 添加设备对话框 */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>添加门禁设备</DialogTitle>
            <DialogDescription>
              登记新的门禁设备到系统
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>设备名称 *</Label>
              <Input placeholder="如：东校门入口" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>设备类型</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="选择类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gate">校门闸机</SelectItem>
                    <SelectItem value="building">楼宇门禁</SelectItem>
                    <SelectItem value="classroom">教室门禁</SelectItem>
                    <SelectItem value="office">办公室门禁</SelectItem>
                    <SelectItem value="dormitory">宿舍门禁</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>通行方向</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="选择方向" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in">入口</SelectItem>
                    <SelectItem value="out">出口</SelectItem>
                    <SelectItem value="both">双向</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>安装位置 *</Label>
              <Input placeholder="如：学校东门" />
            </div>
            <div className="space-y-2">
              <Label>IP地址</Label>
              <Input placeholder="如：192.168.1.100" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>取消</Button>
            <Button className="bg-teal-600 hover:bg-teal-700">添加设备</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
