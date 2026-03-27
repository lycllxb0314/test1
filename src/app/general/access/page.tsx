'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DoorOpen,
  Users,
  UserCheck,
  AlertTriangle,
  Wifi,
  WifiOff,
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  MapPin,
  Shield,
  Smartphone,
  Eye,
  Settings,
  Plus,
  ArrowRight,
  Monitor,
} from 'lucide-react';
import Link from 'next/link';

// 模拟统计数据
const mockStatistics = {
  todayTotal: 3528,
  todayIn: 1824,
  todayOut: 1704,
  byPersonType: [
    { type: 'student' as const, count: 2856 },
    { type: 'teacher' as const, count: 486 },
    { type: 'staff' as const, count: 142 },
    { type: 'visitor' as const, count: 44 },
  ],
  abnormalCount: 7,
  visitorCount: 44,
  pendingVisitorCount: 3,
  deviceOnlineCount: 18,
  deviceOfflineCount: 2,
  deviceFaultCount: 1,
};

// 模拟设备状态
const mockDeviceStatus = [
  { id: '1', name: '东校门入口', type: 'gate', status: 'online', todayCount: 856, location: '学校东门' },
  { id: '2', name: '东校门出口', type: 'gate', status: 'online', todayCount: 823, location: '学校东门' },
  { id: '3', name: '西校门入口', type: 'gate', status: 'online', todayCount: 542, location: '学校西门' },
  { id: '4', name: '西校门出口', type: 'gate', status: 'offline', todayCount: 0, location: '学校西门' },
  { id: '5', name: '教学楼A栋入口', type: 'building', status: 'online', todayCount: 421, location: '教学楼A栋' },
  { id: '6', name: '教学楼B栋入口', type: 'building', status: 'online', todayCount: 368, location: '教学楼B栋' },
  { id: '7', name: '综合楼入口', type: 'building', status: 'online', todayCount: 245, location: '综合楼' },
  { id: '8', name: '食堂入口', type: 'building', status: 'fault', todayCount: 0, location: '食堂' },
];

// 模拟最近通行记录
const mockRecentRecords = [
  { id: '1', name: '张三', type: 'student', organization: '三年1班', device: '东校门入口', direction: 'in', time: '08:12:35', status: 'success' },
  { id: '2', name: '李老师', type: 'teacher', organization: '语文组', device: '教学楼A栋入口', direction: 'in', time: '07:45:22', status: 'success' },
  { id: '3', name: '王师傅', type: 'staff', organization: '后勤部', device: '西校门入口', direction: 'in', time: '07:30:15', status: 'success' },
  { id: '4', name: '赵家长', type: 'visitor', organization: '访客', device: '东校门入口', direction: 'in', time: '09:15:48', status: 'success' },
  { id: '5', name: '未知人员', type: 'visitor', organization: '-', device: '东校门入口', direction: 'in', time: '08:45:33', status: 'denied' },
];

// 模拟待审批访客
const mockPendingVisitors = [
  { id: 'v1', name: '张家长', phone: '138****1234', purpose: '家长会', hostName: '王老师', expectedTime: '今天 14:00' },
  { id: 'v2', name: '李工程师', phone: '139****5678', purpose: '设备维修', hostName: '后勤部', expectedTime: '今天 15:30' },
  { id: 'v3', name: '王先生', phone: '137****9012', purpose: '公务来访', hostName: '校长室', expectedTime: '明天 09:00' },
];

// 人员类型映射
const personTypeMap: Record<string, { label: string; color: string }> = {
  student: { label: '学生', color: 'text-blue-600 bg-blue-50' },
  teacher: { label: '教师', color: 'text-green-600 bg-green-50' },
  staff: { label: '后勤', color: 'text-orange-600 bg-orange-50' },
  visitor: { label: '访客', color: 'text-purple-600 bg-purple-50' },
};

// 设备状态映射
const deviceStatusMap: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  online: { label: '在线', color: 'text-green-600 bg-green-50', icon: Wifi },
  offline: { label: '离线', color: 'text-gray-600 bg-gray-50', icon: WifiOff },
  fault: { label: '故障', color: 'text-red-600 bg-red-50', icon: AlertTriangle },
  maintenance: { label: '维护中', color: 'text-yellow-600 bg-yellow-50', icon: Settings },
};

export default function AccessControlPage() {
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');

  // 计算通过率
  const passRate = ((mockStatistics.todayTotal - mockStatistics.abnormalCount) / mockStatistics.todayTotal * 100).toFixed(2);

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-teal-50/30 via-white to-cyan-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <DoorOpen className="h-7 w-7 text-teal-600" />
            <h1 className="text-2xl font-bold text-gray-900">门禁管理</h1>
          </div>
          <p className="text-gray-500 mt-1">智慧门禁系统 · 人员通行管理</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Monitor className="h-4 w-4" />
            实时监控
          </Button>
          <Button className="bg-teal-600 hover:bg-teal-700 text-white gap-2" asChild>
            <Link href="/general/access/visitors">
              <Plus className="h-4 w-4" />
              访客登记
            </Link>
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">今日通行</p>
                <p className="text-2xl font-bold text-gray-900">{mockStatistics.todayTotal.toLocaleString()}</p>
                <p className="text-xs text-gray-400 mt-1">
                  进入 {mockStatistics.todayIn} · 离开 {mockStatistics.todayOut}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 text-white">
                <Activity className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">人员授权</p>
                <p className="text-2xl font-bold text-gray-900">3,486</p>
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  全部有效
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 text-white">
                <UserCheck className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">设备状态</p>
                <p className="text-2xl font-bold text-gray-900">{mockStatistics.deviceOnlineCount}/{mockStatistics.deviceOnlineCount + mockStatistics.deviceOfflineCount + mockStatistics.deviceFaultCount}</p>
                <p className="text-xs text-gray-400 mt-1">
                  <span className="text-red-500">{mockStatistics.deviceFaultCount} 故障</span> · <span className="text-gray-500">{mockStatistics.deviceOfflineCount} 离线</span>
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 text-white">
                <Shield className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">今日访客</p>
                <p className="text-2xl font-bold text-gray-900">{mockStatistics.visitorCount}</p>
                <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {mockStatistics.pendingVisitorCount} 待审批
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 text-white">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 主要内容区域 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 左侧：设备状态 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 设备状态概览 */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">设备状态</CardTitle>
                <Button variant="ghost" size="sm" className="text-teal-600" asChild>
                  <Link href="/general/access/devices">
                    查看全部
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {mockDeviceStatus.slice(0, 6).map(device => {
                  const statusInfo = deviceStatusMap[device.status];
                  const StatusIcon = statusInfo.icon;
                  return (
                    <div key={device.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className={`p-2 rounded-lg ${statusInfo.color}`}>
                        <StatusIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{device.name}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {device.location}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{device.todayCount}</p>
                        <p className="text-xs text-gray-400">今日通行</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* 人员通行分类统计 */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">人员通行统计</CardTitle>
                <Button variant="ghost" size="sm" className="text-teal-600" asChild>
                  <Link href="/general/access/records">
                    通行记录
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                {mockStatistics.byPersonType.map(stat => {
                  const typeInfo = personTypeMap[stat.type];
                  return (
                    <div key={stat.type} className="text-center p-4 rounded-xl bg-gray-50">
                      <div className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${typeInfo.color} mb-2`}>
                        {typeInfo.label}
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
                      <p className="text-xs text-gray-400">今日通行</p>
                    </div>
                  );
                })}
              </div>
              
              {/* 时段趋势图占位 */}
              <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-100">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-gray-700">通行趋势</p>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                      进入
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                      离开
                    </span>
                  </div>
                </div>
                <div className="h-24 flex items-end justify-between gap-1">
                  {[6,7,8,9,10,11,12,13,14,15,16,17,18].map(hour => {
                    const inHeight = Math.random() * 60 + 20;
                    const outHeight = Math.random() * 50 + 15;
                    return (
                      <div key={hour} className="flex-1 flex gap-0.5 items-end justify-center">
                        <div 
                          className="w-2 bg-teal-400 rounded-t" 
                          style={{ height: `${inHeight}%` }}
                        ></div>
                        <div 
                          className="w-2 bg-cyan-400 rounded-t" 
                          style={{ height: `${outHeight}%` }}
                        ></div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-400">
                  <span>06:00</span>
                  <span>12:00</span>
                  <span>18:00</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧：最近记录 & 访客审批 */}
        <div className="space-y-6">
          {/* 最近通行记录 */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">最近通行</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockRecentRecords.map(record => {
                  const typeInfo = personTypeMap[record.type];
                  return (
                    <div key={record.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-sm font-medium">
                        {record.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{record.name}</p>
                        <p className="text-xs text-gray-400">{record.organization}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">{record.time}</p>
                        <p className="text-xs text-gray-400">{record.direction === 'in' ? '进入' : '离开'}</p>
                      </div>
                      <Badge className={record.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                        {record.status === 'success' ? '通过' : '拒绝'}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* 待审批访客 */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">待审批访客</CardTitle>
                <Badge className="bg-orange-100 text-orange-700">{mockPendingVisitors.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockPendingVisitors.map(visitor => (
                  <div key={visitor.id} className="p-3 rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{visitor.name}</span>
                      <span className="text-xs text-gray-500">{visitor.phone}</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">
                      来访目的：{visitor.purpose} · 被访人：{visitor.hostName}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {visitor.expectedTime}
                      </span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="h-7 text-xs">拒绝</Button>
                        <Button size="sm" className="h-7 text-xs bg-teal-600 hover:bg-teal-700">批准</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-3" asChild>
                <Link href="/general/access/visitors">
                  查看全部访客
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* 快捷操作 */}
          <Card className="border-0 shadow-md bg-gradient-to-br from-teal-500 to-cyan-600 text-white">
            <CardContent className="p-4">
              <h3 className="font-medium mb-3">快捷操作</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0" asChild>
                  <Link href="/general/access/devices">
                    <Smartphone className="h-4 w-4 mr-1" />
                    设备管理
                  </Link>
                </Button>
                <Button variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0" asChild>
                  <Link href="/general/access/persons">
                    <UserCheck className="h-4 w-4 mr-1" />
                    人员授权
                  </Link>
                </Button>
                <Button variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0" asChild>
                  <Link href="/general/access/records">
                    <Eye className="h-4 w-4 mr-1" />
                    通行记录
                  </Link>
                </Button>
                <Button variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0" asChild>
                  <Link href="/general/access/visitors">
                    <Users className="h-4 w-4 mr-1" />
                    访客管理
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
