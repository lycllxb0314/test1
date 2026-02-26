'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Cpu,
  Lightbulb,
  DoorOpen,
  Thermometer,
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
} from 'lucide-react';

// 设备类型定义
interface Device {
  id: string;
  name: string;
  building: string;
  floor: number;
  type: 'light' | 'ac' | 'door' | 'projector' | 'curtain';
  status: 'online' | 'offline';
  isOn: boolean;
  brightness?: number;
  temperature?: number;
  locked?: boolean;
  position?: number;
}

// 教学楼数据
const buildings = [
  { id: 'building-1', name: '教学楼A', floors: 5 },
  { id: 'building-2', name: '教学楼B', floors: 4 },
  { id: 'building-3', name: '综合楼', floors: 6 },
  { id: 'building-4', name: '实验楼', floors: 3 },
];

// 设备类型
const deviceTypes = [
  { id: 'light', name: '灯光', icon: Lightbulb, color: 'text-yellow-500' },
  { id: 'ac', name: '空调', icon: Thermometer, color: 'text-blue-500' },
  { id: 'door', name: '门禁', icon: DoorOpen, color: 'text-green-500' },
  { id: 'projector', name: '投影仪', icon: Tv, color: 'text-purple-500' },
  { id: 'curtain', name: '窗帘', icon: Blinds, color: 'text-orange-500' },
];

// 模拟设备数据
const mockDevices: Device[] = [
  // 教学楼A
  { id: '1', name: '教室 A101', building: 'building-1', floor: 1, type: 'light', status: 'online', isOn: true, brightness: 80 },
  { id: '2', name: '教室 A101', building: 'building-1', floor: 1, type: 'ac', status: 'online', isOn: true, temperature: 24 },
  { id: '3', name: '教室 A101', building: 'building-1', floor: 1, type: 'door', status: 'online', isOn: false, locked: true },
  { id: '4', name: '教室 A102', building: 'building-1', floor: 1, type: 'light', status: 'online', isOn: false, brightness: 0 },
  { id: '5', name: '教室 A102', building: 'building-1', floor: 1, type: 'ac', status: 'online', isOn: false, temperature: 26 },
  { id: '6', name: '教室 A201', building: 'building-1', floor: 2, type: 'light', status: 'online', isOn: true, brightness: 100 },
  { id: '7', name: '教室 A201', building: 'building-1', floor: 2, type: 'projector', status: 'online', isOn: false },
  { id: '8', name: '教室 A301', building: 'building-1', floor: 3, type: 'light', status: 'offline', isOn: false, brightness: 0 },
  // 综合楼
  { id: '9', name: '会议室 301', building: 'building-3', floor: 3, type: 'light', status: 'online', isOn: true, brightness: 60 },
  { id: '10', name: '会议室 301', building: 'building-3', floor: 3, type: 'ac', status: 'online', isOn: true, temperature: 22 },
  { id: '11', name: '会议室 301', building: 'building-3', floor: 3, type: 'curtain', status: 'online', isOn: true, position: 100 },
  { id: '12', name: '报告厅', building: 'building-3', floor: 1, type: 'light', status: 'online', isOn: false, brightness: 0 },
  { id: '13', name: '报告厅', building: 'building-3', floor: 1, type: 'projector', status: 'online', isOn: false },
  // 门禁
  { id: '14', name: '北门入口', building: 'building-1', floor: 1, type: 'door', status: 'online', isOn: false, locked: true },
  { id: '15', name: '南门入口', building: 'building-1', floor: 1, type: 'door', status: 'online', isOn: false, locked: true },
  { id: '16', name: '东门入口', building: 'building-3', floor: 1, type: 'door', status: 'online', isOn: false, locked: true },
];

export default function DevicesPage() {
  const [selectedBuilding, setSelectedBuilding] = useState<string>('all');
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [devices, setDevices] = useState(mockDevices);

  // 过滤设备
  const filteredDevices = devices.filter(device => {
    if (selectedBuilding !== 'all' && device.building !== selectedBuilding) return false;
    if (selectedFloor !== 'all' && device.floor !== parseInt(selectedFloor)) return false;
    if (selectedType !== 'all' && device.type !== selectedType) return false;
    return true;
  });

  // 切换设备开关
  const toggleDevice = (deviceId: string) => {
    setDevices(prev => prev.map(d => 
      d.id === deviceId ? { ...d, isOn: !d.isOn } : d
    ));
  };

  // 调节亮度/温度
  const adjustDevice = (deviceId: string, value: number) => {
    setDevices(prev => prev.map(d => 
      d.id === deviceId ? { ...d, [d.type === 'ac' ? 'temperature' : 'brightness']: value } : d
    ));
  };

  // 批量控制
  const batchControl = (type: string, action: 'on' | 'off') => {
    setDevices(prev => prev.map(d => 
      d.type === type ? { ...d, isOn: action === 'on' } : d
    ));
  };

  // 获取设备图标
  const getDeviceIcon = (type: string) => {
    const deviceType = deviceTypes.find(t => t.id === type);
    return deviceType?.icon || Cpu;
  };

  // 获取设备颜色
  const getDeviceColor = (type: string) => {
    const deviceType = deviceTypes.find(t => t.id === type);
    return deviceType?.color || 'text-gray-500';
  };

  // 统计数据
  const onlineCount = devices.filter(d => d.status === 'online').length;
  const onCount = devices.filter(d => d.isOn).length;
  const totalCount = devices.length;

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gray-50 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">设备管理</h1>
          <p className="text-gray-500 mt-1">智慧设备远程控制与状态监控</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            刷新状态
          </Button>
          <Button variant="outline" className="gap-2">
            <Settings className="h-4 w-4" />
            设备设置
          </Button>
        </div>
      </div>

      {/* 状态统计 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Cpu className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">设备总数</p>
                <p className="text-2xl font-bold">{totalCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Wifi className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">在线设备</p>
                <p className="text-2xl font-bold">{onlineCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Power className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">运行中</p>
                <p className="text-2xl font-bold">{onCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <WifiOff className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">离线设备</p>
                <p className="text-2xl font-bold">{totalCount - onlineCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 批量控制 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">批量控制</CardTitle>
          <CardDescription>快速控制同类设备</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {deviceTypes.map(type => {
              const Icon = type.icon;
              const typeDevices = devices.filter(d => d.type === type.id);
              const onDevices = typeDevices.filter(d => d.isOn).length;
              return (
                <div key={type.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Icon className={`h-5 w-5 ${type.color}`} />
                  <span className="text-sm font-medium">{type.name}</span>
                  <span className="text-xs text-gray-500">({onDevices}/{typeDevices.length})</span>
                  <div className="flex gap-1 ml-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => batchControl(type.id, 'on')}
                    >
                      全开
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => batchControl(type.id, 'off')}
                    >
                      全关
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 筛选条件 */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4 text-gray-400" />
          <select 
            className="border rounded-md px-3 py-2 text-sm"
            value={selectedBuilding}
            onChange={(e) => setSelectedBuilding(e.target.value)}
          >
            <option value="all">全部楼宇</option>
            {buildings.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-gray-400" />
          <select 
            className="border rounded-md px-3 py-2 text-sm"
            value={selectedFloor}
            onChange={(e) => setSelectedFloor(e.target.value)}
          >
            <option value="all">全部楼层</option>
            {[1,2,3,4,5,6].map(f => (
              <option key={f} value={f}>{f}层</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-gray-400" />
          <select 
            className="border rounded-md px-3 py-2 text-sm"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="all">全部类型</option>
            {deviceTypes.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 设备列表 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredDevices.map(device => {
          const Icon = getDeviceIcon(device.type);
          const colorClass = getDeviceColor(device.type);
          const buildingName = buildings.find(b => b.id === device.building)?.name || '';
          
          return (
            <Card key={device.id} className={`overflow-hidden ${device.status === 'offline' ? 'opacity-60' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${device.isOn ? 'bg-green-100' : 'bg-gray-100'}`}>
                      <Icon className={`h-5 w-5 ${device.isOn ? 'text-green-600' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{device.name}</h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <MapPin className="h-3 w-3" />
                        {buildingName} {device.floor}层
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {device.status === 'offline' ? (
                      <Badge variant="destructive" className="text-xs">
                        <WifiOff className="h-3 w-3 mr-1" />
                        离线
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                        <Wifi className="h-3 w-3 mr-1" />
                        在线
                      </Badge>
                    )}
                  </div>
                </div>

                {/* 设备控制 */}
                {device.status === 'online' && (
                  <div className="border-t pt-3">
                    {/* 灯光控制 */}
                    {device.type === 'light' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">开关</span>
                          <Switch 
                            checked={device.isOn} 
                            onCheckedChange={() => toggleDevice(device.id)}
                          />
                        </div>
                        {device.isOn && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">亮度</span>
                              <span className="text-sm font-medium">{device.brightness}%</span>
                            </div>
                            <Slider 
                              value={[device.brightness || 0]} 
                              onValueChange={(v) => adjustDevice(device.id, v[0])}
                              max={100}
                              step={1}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* 空调控制 */}
                    {device.type === 'ac' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">开关</span>
                          <Switch 
                            checked={device.isOn} 
                            onCheckedChange={() => toggleDevice(device.id)}
                          />
                        </div>
                        {device.isOn && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">温度</span>
                              <span className="text-sm font-medium">{device.temperature}°C</span>
                            </div>
                            <Slider 
                              value={[device.temperature || 24]} 
                              onValueChange={(v) => adjustDevice(device.id, v[0])}
                              min={16}
                              max={30}
                              step={1}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* 门禁控制 */}
                    {device.type === 'door' && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">门锁状态</span>
                        <div className="flex items-center gap-2">
                          <Badge variant={device.locked ? "default" : "destructive"} className="text-xs">
                            {device.locked ? '已锁定' : '已解锁'}
                          </Badge>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setDevices(prev => prev.map(d => 
                              d.id === device.id ? { ...d, locked: !d.locked } : d
                            ))}
                          >
                            {device.locked ? '解锁' : '锁定'}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* 投影仪控制 */}
                    {device.type === 'projector' && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">电源</span>
                        <Switch 
                          checked={device.isOn} 
                          onCheckedChange={() => toggleDevice(device.id)}
                        />
                      </div>
                    )}

                    {/* 窗帘控制 */}
                    {device.type === 'curtain' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">开关</span>
                          <Switch 
                            checked={device.isOn} 
                            onCheckedChange={() => toggleDevice(device.id)}
                          />
                        </div>
                        {device.isOn && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="flex-1">全开</Button>
                            <Button size="sm" variant="outline" className="flex-1">半开</Button>
                            <Button size="sm" variant="outline" className="flex-1">关闭</Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 空状态 */}
      {filteredDevices.length === 0 && (
        <div className="text-center py-12">
          <Cpu className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">没有找到符合条件的设备</p>
        </div>
      )}
    </div>
  );
}
