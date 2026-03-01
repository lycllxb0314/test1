'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Package,
  Wrench,
  ShoppingCart,
  DollarSign,
  Shield,
  Users,
  AlertTriangle,
  Clock,
  TrendingUp,
  ArrowRight,
  Plus,
  Bell,
  CheckCircle,
  XCircle,
  Cpu,
  DoorOpen,
  UserPlus,
  Loader2,
} from 'lucide-react';
import { useSchoolStats } from '@/hooks/useSchoolStats';

// 维修申请接口
interface RepairRequest {
  id: string;
  requester: string;
  item: string;
  type: string;
  location: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
}

// 资产接口
interface Asset {
  id: string;
  name: string;
  category: string;
  specification: string;
  department: string;
  status: string;
  value: number;
}

export default function GeneralPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [repairRequests, setRepairRequests] = useState<RepairRequest[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const { data: schoolStats, loading: statsLoading } = useSchoolStats();

  // 从API获取维修申请
  useEffect(() => {
    fetch('/api/repair-requests?status=pending')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setRepairRequests(data.data || []);
        }
      })
      .catch(console.error);
  }, []);

  // 从API获取资产
  useEffect(() => {
    fetch('/api/assets')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAssets(data.data || []);
        }
      })
      .catch(console.error);
  }, []);

  // 统计数据
  const stats = [
    { title: '资产总数', value: assets.length.toString() || '0', change: '+12%', icon: Package, color: 'bg-blue-500', trend: 'up' },
    { title: '待处理维修', value: repairRequests.filter(r => r.status === 'pending').length.toString() || '0', change: '+3', icon: Wrench, color: 'bg-orange-500', trend: 'up' },
    { title: '本月采购', value: '¥58,000', change: '-5%', icon: ShoppingCart, color: 'bg-green-500', trend: 'down' },
    { title: '本月支出', value: '¥128,500', change: '+8%', icon: DollarSign, color: 'bg-purple-500', trend: 'up' },
  ];

  // 快捷操作
  const quickActions = [
    { name: '资产入库', href: '/general/assets', icon: Package, color: 'bg-blue-100 text-blue-600' },
    { name: '设备控制', href: '/general/devices', icon: Cpu, color: 'bg-indigo-100 text-indigo-600' },
    { name: '报修申请', href: '/general/repairs', icon: Wrench, color: 'bg-orange-100 text-orange-600' },
    { name: '采购申请', href: '/general/purchase', icon: ShoppingCart, color: 'bg-green-100 text-green-600' },
    { name: '费用报销', href: '/general/finance', icon: DollarSign, color: 'bg-purple-100 text-purple-600' },
    { name: '门禁管理', href: '/general/access', icon: DoorOpen, color: 'bg-teal-100 text-teal-600' },
    { name: '访客登记', href: '/general/access/visitors', icon: UserPlus, color: 'bg-cyan-100 text-cyan-600' },
  ];

  // 安全提醒
  const securityAlerts = [
    { id: '1', type: '巡查异常', message: '保安巡查发现北门照明损坏', time: '30分钟前', level: 'high' },
    { id: '2', type: '设施提醒', message: '食堂灭火器即将到期', time: '2小时前', level: 'medium' },
    { id: '3', type: '安全通知', message: '本周五将进行全校安全检查', time: '1天前', level: 'low' },
  ];

  // 获取警告级别颜色
  const getAlertLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-50 border-red-200 text-red-700';
      case 'medium': return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      default: return 'bg-blue-50 border-blue-200 text-blue-700';
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-orange-50/30 via-white to-amber-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">总务后勤管理</h1>
          <p className="text-gray-500 mt-1">资产管理 · 报修维护 · 采购管理 · 安全保障</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Bell className="h-4 w-4" />
            安全提醒
            <Badge className="bg-red-500 text-white text-xs ml-1">3</Badge>
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-white gap-2">
            <Plus className="h-4 w-4" />
            新建申请
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-xl ${stat.color} text-white`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <span className={`text-sm font-medium ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.change}
                </span>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 快捷操作 */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">快捷操作</CardTitle>
          <CardDescription>常用功能快速入口</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                href={action.href}
                className="flex flex-col items-center p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className={`p-3 rounded-lg ${action.color} mb-3`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <span className="text-sm font-medium text-gray-700">{action.name}</span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 双栏布局 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 待处理维修 */}
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">待处理维修</CardTitle>
              <CardDescription>需要处理的维修申请</CardDescription>
            </div>
            <Link href="/general/repairs">
              <Button variant="ghost" size="sm" className="text-primary">
                查看全部 <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {repairRequests.slice(0, 5).map((repair) => (
                <div
                  key={repair.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${
                      repair.status === 'pending' ? 'bg-yellow-100' :
                      repair.status === 'in_progress' ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                      <Wrench className={`h-4 w-4 ${
                        repair.status === 'pending' ? 'text-yellow-600' :
                        repair.status === 'in_progress' ? 'text-blue-600' : 'text-green-600'
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{repair.item}</span>
                        {repair.priority === 'urgent' && (
                          <Badge className="bg-red-100 text-red-600 text-xs">紧急</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{repair.location}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className={
                      repair.status === 'pending' ? 'border-yellow-300 text-yellow-700' :
                      repair.status === 'in_progress' ? 'border-blue-300 text-blue-700' : 'border-green-300 text-green-700'
                    }>
                      {repair.status === 'pending' ? '待处理' : repair.status === 'in_progress' ? '处理中' : '已完成'}
                    </Badge>
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      {repair.createdAt.split(' ')[0]}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 安全提醒 */}
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">安全提醒</CardTitle>
              <CardDescription>校园安全预警信息</CardDescription>
            </div>
            <Link href="/general/security">
              <Button variant="ghost" size="sm" className="text-primary">
                查看全部 <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {securityAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-start gap-3 p-4 rounded-xl border ${getAlertLevelColor(alert.level)}`}
                >
                  <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{alert.type}</span>
                    </div>
                    <p className="text-sm opacity-80">{alert.message}</p>
                    <div className="flex items-center gap-1 mt-2 text-xs opacity-60">
                      <Clock className="h-3 w-3" />
                      {alert.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 资产概览 */}
      <Card className="border-0 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">资产概览</CardTitle>
            <CardDescription>学校资产统计</CardDescription>
          </div>
          <Link href="/general/assets">
            <Button variant="ghost" size="sm" className="text-primary">
              查看全部 <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {assets.slice(0, 6).map((asset: Asset) => (
              <div
                key={asset.id}
                className="p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="outline">{asset.category}</Badge>
                  <Badge className={asset.status === '在用' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                    {asset.status}
                  </Badge>
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">{asset.name}</h4>
                <p className="text-sm text-gray-500 mb-2">{asset.specification}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{asset.department}</span>
                  <span className="font-medium text-gray-900">¥{asset.value.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
