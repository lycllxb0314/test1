'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Cpu,
  Lightbulb,
  Thermometer,
  DoorOpen,
  Tv,
  Blinds,
  Power,
  Settings,
  RefreshCw,
  MapPin,
  Building,
  Layers,
  Wifi,
  WifiOff,
  Plus,
  Search,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  AlertTriangle,
  Volume2,
  Camera,
  Activity,
  Zap,
} from 'lucide-react';
import {
  useDevices,
  useDeviceStatistics,
  useDeviceBuildings,
  useDeviceActions,
} from '@/hooks/useDevices';
import type { Device, DeviceType, DeviceStatus } from '@/types/general';

// 设备类型配置
const DEVICE_TYPES: { id: DeviceType; name: string; icon: typeof Lightbulb; color: string }[] = [
  { id: 'light', name: '灯光', icon: Lightbulb, color: 'text-yellow-500' },
  { id: 'ac', name: '空调', icon: Thermometer, color: 'text-blue-500' },
  { id: 'door', name: '门禁', icon: DoorOpen, color: 'text-green-500' },
  { id: 'projector', name: '投影仪', icon: Tv, color: 'text-purple-500' },
  { id: 'curtain', name: '窗帘', icon: Blinds, color: 'text-orange-500' },
  { id: 'speaker', name: '音响', icon: Volume2, color: 'text-pink-500' },
  { id: 'camera', name: '摄像头', icon: Camera, color: 'text-red-500' },
  { id: 'sensor', name: '传感器', icon: Activity, color: 'text-teal-500' },
  { id: 'other', name: '其他', icon: Cpu, color: 'text-gray-500' },
];

// 设备状态配置
const DEVICE_STATUS: { id: DeviceStatus; name: string; color: string }[] = [
  { id: 'online', name: '在线', color: 'bg-green-100 text-green-700 border-green-200' },
  { id: 'offline', name: '离线', color: 'bg-red-100 text-red-700 border-red-200' },
  { id: 'maintenance', name: '维护中', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { id: 'fault', name: '故障', color: 'bg-red-100 text-red-700 border-red-200' },
];

export default function DevicesPage() {
  // 状态
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedBuilding, setSelectedBuilding] = useState<string>('all');
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [formData, setFormData] = useState<Partial<Device>>({});

  // 数据
  const { devices, loading: devicesLoading, refresh } = useDevices();
  const { statistics, loading: statsLoading, refresh: refreshStats } = useDeviceStatistics();
  const { buildings } = useDeviceBuildings();
  const { toggleDevice, adjustDevice, batchControl, createDevice, updateDevice, deleteDevice, loading: actionLoading } = useDeviceActions();

  // 筛选设备
  const filteredDevices = useMemo(() => {
    return devices.filter(device => {
      if (selectedType !== 'all' && device.type !== selectedType) return false;
      if (selectedStatus !== 'all' && device.status !== selectedStatus) return false;
      if (selectedBuilding !== 'all' && device.building !== selectedBuilding) return false;
      if (selectedFloor !== 'all' && device.floor !== parseInt(selectedFloor)) return false;
      if (searchText) {
        const search = searchText.toLowerCase();
        return (
          device.name.toLowerCase().includes(search) ||
          device.deviceNo?.toLowerCase().includes(search) ||
          device.location?.toLowerCase().includes(search)
        );
      }
      return true;
    });
  }, [devices, selectedType, selectedStatus, selectedBuilding, selectedFloor, searchText]);

  // 获取设备类型图标
  const getTypeIcon = (type: DeviceType) => {
    const typeConfig = DEVICE_TYPES.find(t => t.id === type);
    return typeConfig?.icon || Cpu;
  };

  // 获取设备类型颜色
  const getTypeColor = (type: DeviceType) => {
    const typeConfig = DEVICE_TYPES.find(t => t.id === type);
    return typeConfig?.color || 'text-gray-500';
  };

  // 开关控制
  const handleToggle = useCallback(async (device: Device) => {
    if (device.status !== 'online') {
      toast.error('设备离线，无法控制');
      return;
    }
    const result = await toggleDevice(device.id, !device.isOn);
    if (result) {
      toast.success(device.isOn ? '已关闭' : '已开启');
      refresh();
    } else {
      toast.error('操作失败');
    }
  }, [toggleDevice, refresh]);

  // 亮度/温度调节
  const handleAdjust = useCallback(async (device: Device, key: string, value: number) => {
    const result = await adjustDevice(device.id, { [key]: value });
    if (result) {
      refresh();
    }
  }, [adjustDevice, refresh]);

  // 门锁控制
  const handleLock = useCallback(async (device: Device) => {
    const result = await adjustDevice(device.id, { locked: !device.locked });
    if (result) {
      toast.success(device.locked ? '已解锁' : '已锁定');
      refresh();
    }
  }, [adjustDevice, refresh]);

  // 批量控制
  const handleBatchControl = useCallback(async (type: DeviceType, action: 'on' | 'off') => {
    const count = await batchControl(type, action);
    if (count > 0) {
      toast.success(`已${action === 'on' ? '开启' : '关闭'} ${count} 台设备`);
      refresh();
    }
  }, [batchControl, refresh]);

  // 打开新增弹窗
  const handleAdd = () => {
    setSelectedDevice(null);
    setFormData({
      type: 'light',
      status: 'online',
      isOn: false,
      floor: 1,
    });
    setDialogOpen(true);
  };

  // 打开编辑弹窗
  const handleEdit = (device: Device) => {
    setSelectedDevice(device);
    setFormData(device);
    setDialogOpen(true);
  };

  // 查看详情
  const handleView = (device: Device) => {
    setSelectedDevice(device);
    setDetailOpen(true);
  };

  // 删除设备
  const handleDelete = async (device: Device) => {
    if (!confirm(`确定要删除设备"${device.name}"吗？`)) return;
    const success = await deleteDevice(device.id);
    if (success) {
      toast.success('删除成功');
      refresh();
    } else {
      toast.error('删除失败');
    }
  };

  // 保存设备
  const handleSave = async () => {
    if (!formData.name) {
      toast.error('请输入设备名称');
      return;
    }

    let result;
    if (selectedDevice) {
      result = await updateDevice(selectedDevice.id, formData);
    } else {
      result = await createDevice(formData);
    }

    if (result) {
      toast.success(selectedDevice ? '更新成功' : '创建成功');
      setDialogOpen(false);
      refresh();
    } else {
      toast.error('保存失败');
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-background min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">设备管理</h1>
          <p className="text-muted-foreground mt-1">智慧设备远程控制与状态监控</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => { refresh(); refreshStats(); }}>
            <RefreshCw className="h-4 w-4" />
            刷新
          </Button>
          <Button size="sm" className="gap-2" onClick={handleAdd}>
            <Plus className="h-4 w-4" />
            新增设备
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Cpu className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">设备总数</p>
                <p className="text-2xl font-bold">{statistics?.total || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Wifi className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">在线设备</p>
                <p className="text-2xl font-bold">{statistics?.online || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Power className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">运行中</p>
                <p className="text-2xl font-bold">{statistics?.running || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <WifiOff className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">离线/故障</p>
                <p className="text-2xl font-bold">{(statistics?.offline || 0) + (statistics?.fault || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 批量控制 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">批量控制</CardTitle>
          <CardDescription>快速控制同类设备</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {DEVICE_TYPES.slice(0, 6).map(type => {
              const Icon = type.icon;
              const typeDevices = devices.filter(d => d.type === type.id);
              const onDevices = typeDevices.filter(d => d.isOn).length;
              const onlineDevices = typeDevices.filter(d => d.status === 'online').length;
              return (
                <div key={type.id} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <Icon className={`h-5 w-5 ${type.color}`} />
                  <span className="text-sm font-medium">{type.name}</span>
                  <span className="text-xs text-muted-foreground">({onDevices}/{typeDevices.length})</span>
                  {onlineDevices > 0 && (
                    <div className="flex gap-1 ml-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => handleBatchControl(type.id, 'on')}
                      >
                        全开
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => handleBatchControl(type.id, 'off')}
                      >
                        全关
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 筛选条件 */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索设备..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-48"
          />
        </div>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="设备类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部类型</SelectItem>
            {DEVICE_TYPES.map(t => (
              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="设备状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            {DEVICE_STATUS.map(s => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="楼宇" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部楼宇</SelectItem>
            {buildings.map(b => (
              <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 设备列表 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredDevices.map(device => {
          const Icon = getTypeIcon(device.type);
          const colorClass = getTypeColor(device.type);

          return (
            <Card key={device.id} className={`overflow-hidden ${device.status === 'offline' ? 'opacity-60' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${device.isOn ? 'bg-green-100 dark:bg-green-900/30' : 'bg-muted'}`}>
                      <Icon className={`h-5 w-5 ${device.isOn ? 'text-green-600' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">{device.name}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {device.buildingName || device.building} {device.floor}层{device.room ? ` ${device.room}` : ''}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {device.status === 'offline' ? (
                      <Badge variant="destructive" className="text-xs">
                        <WifiOff className="h-3 w-3 mr-1" />
                        离线
                      </Badge>
                    ) : device.status === 'fault' ? (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        故障
                      </Badge>
                    ) : device.status === 'maintenance' ? (
                      <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                        维护中
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                        <Wifi className="h-3 w-3 mr-1" />
                        在线
                      </Badge>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleView(device)}>
                          <Eye className="h-4 w-4 mr-2" />
                          查看详情
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(device)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          编辑
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(device)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* 设备控制 */}
                {device.status === 'online' && (
                  <div className="border-t pt-3 space-y-3">
                    {/* 灯光控制 */}
                    {device.type === 'light' && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">开关</span>
                          <Switch
                            checked={device.isOn}
                            onCheckedChange={() => handleToggle(device)}
                          />
                        </div>
                        {device.isOn && device.brightness !== undefined && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">亮度</span>
                              <span className="text-sm font-medium">{device.brightness}%</span>
                            </div>
                            <Slider
                              value={[device.brightness]}
                              onValueChange={(v) => handleAdjust(device, 'brightness', v[0])}
                              max={100}
                              step={1}
                            />
                          </div>
                        )}
                      </>
                    )}

                    {/* 空调控制 */}
                    {device.type === 'ac' && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">开关</span>
                          <Switch
                            checked={device.isOn}
                            onCheckedChange={() => handleToggle(device)}
                          />
                        </div>
                        {device.isOn && device.temperature !== undefined && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">温度</span>
                              <span className="text-sm font-medium">{device.temperature}°C</span>
                            </div>
                            <Slider
                              value={[device.temperature]}
                              onValueChange={(v) => handleAdjust(device, 'temperature', v[0])}
                              min={16}
                              max={30}
                              step={1}
                            />
                          </div>
                        )}
                      </>
                    )}

                    {/* 门禁控制 */}
                    {device.type === 'door' && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">门锁状态</span>
                        <div className="flex items-center gap-2">
                          <Badge variant={device.locked ? 'default' : 'destructive'} className="text-xs">
                            {device.locked ? '已锁定' : '已解锁'}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleLock(device)}
                          >
                            {device.locked ? '解锁' : '锁定'}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* 投影仪/音响/摄像头控制 */}
                    {(device.type === 'projector' || device.type === 'speaker' || device.type === 'camera') && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">电源</span>
                        <Switch
                          checked={device.isOn}
                          onCheckedChange={() => handleToggle(device)}
                        />
                      </div>
                    )}

                    {/* 窗帘控制 */}
                    {device.type === 'curtain' && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">开关</span>
                          <Switch
                            checked={device.isOn}
                            onCheckedChange={() => handleToggle(device)}
                          />
                        </div>
                        {device.isOn && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => handleAdjust(device, 'position', 100)}
                            >
                              全开
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => handleAdjust(device, 'position', 50)}
                            >
                              半开
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => handleAdjust(device, 'position', 0)}
                            >
                              关闭
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 空状态 */}
      {filteredDevices.length === 0 && !devicesLoading && (
        <div className="text-center py-12">
          <Cpu className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">没有找到符合条件的设备</p>
        </div>
      )}

      {/* 新增/编辑弹窗 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedDevice ? '编辑设备' : '新增设备'}</DialogTitle>
            <DialogDescription>
              {selectedDevice ? '修改设备信息' : '添加新的智能设备'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>设备名称 *</Label>
                <Input
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="如：教室 A101"
                />
              </div>
              <div className="space-y-2">
                <Label>设备编号</Label>
                <Input
                  value={formData.deviceNo || ''}
                  onChange={(e) => setFormData({ ...formData, deviceNo: e.target.value })}
                  placeholder="设备编号"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>设备类型</Label>
                <Select
                  value={formData.type || 'light'}
                  onValueChange={(v) => setFormData({ ...formData, type: v as DeviceType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEVICE_TYPES.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>设备状态</Label>
                <Select
                  value={formData.status || 'online'}
                  onValueChange={(v) => setFormData({ ...formData, status: v as DeviceStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEVICE_STATUS.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>所属楼宇</Label>
                <Input
                  value={formData.building || ''}
                  onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                  placeholder="如：教学楼A"
                />
              </div>
              <div className="space-y-2">
                <Label>楼层</Label>
                <Input
                  type="number"
                  value={formData.floor || 1}
                  onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) || 1 })}
                  min={1}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>房间号/位置</Label>
              <Input
                value={formData.room || ''}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                placeholder="如：A101"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>品牌</Label>
                <Input
                  value={formData.brand || ''}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>型号</Label>
                <Input
                  value={formData.model || ''}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>IP地址</Label>
              <Input
                value={formData.ipAddress || ''}
                onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                placeholder="如：192.168.1.100"
              />
            </div>
            <div className="space-y-2">
              <Label>备注</Label>
              <Input
                value={formData.note || ''}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSave} disabled={actionLoading}>
              {actionLoading ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 详情弹窗 */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>设备详情</DialogTitle>
          </DialogHeader>
          {selectedDevice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">设备名称</p>
                  <p className="font-medium">{selectedDevice.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">设备编号</p>
                  <p className="font-medium">{selectedDevice.deviceNo || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">设备类型</p>
                  <p className="font-medium">
                    {DEVICE_TYPES.find(t => t.id === selectedDevice.type)?.name || selectedDevice.type}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">设备状态</p>
                  <Badge variant={selectedDevice.status === 'online' ? 'default' : 'destructive'}>
                    {DEVICE_STATUS.find(s => s.id === selectedDevice.status)?.name || selectedDevice.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">位置</p>
                  <p className="font-medium">
                    {selectedDevice.buildingName || selectedDevice.building} {selectedDevice.floor}层
                    {selectedDevice.room ? ` ${selectedDevice.room}` : ''}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">开关状态</p>
                  <p className="font-medium">{selectedDevice.isOn ? '开启' : '关闭'}</p>
                </div>
                {selectedDevice.brand && (
                  <div>
                    <p className="text-sm text-muted-foreground">品牌</p>
                    <p className="font-medium">{selectedDevice.brand}</p>
                  </div>
                )}
                {selectedDevice.model && (
                  <div>
                    <p className="text-sm text-muted-foreground">型号</p>
                    <p className="font-medium">{selectedDevice.model}</p>
                  </div>
                )}
                {selectedDevice.ipAddress && (
                  <div>
                    <p className="text-sm text-muted-foreground">IP地址</p>
                    <p className="font-medium">{selectedDevice.ipAddress}</p>
                  </div>
                )}
                {selectedDevice.brightness !== undefined && (
                  <div>
                    <p className="text-sm text-muted-foreground">亮度</p>
                    <p className="font-medium">{selectedDevice.brightness}%</p>
                  </div>
                )}
                {selectedDevice.temperature !== undefined && (
                  <div>
                    <p className="text-sm text-muted-foreground">温度</p>
                    <p className="font-medium">{selectedDevice.temperature}°C</p>
                  </div>
                )}
              </div>
              {selectedDevice.note && (
                <div>
                  <p className="text-sm text-muted-foreground">备注</p>
                  <p className="font-medium">{selectedDevice.note}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
