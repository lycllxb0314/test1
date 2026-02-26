'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  School,
  Trees,
  Trash2,
  Droplets,
  Thermometer,
  Wind,
  Leaf,
  Plus,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

// 模拟环境管理数据
const environmentAreas = [
  { id: 1, name: '教学楼A区', type: '教学区', status: 'good', cleaner: '王阿姨', lastClean: '2024-03-15 07:30' },
  { id: 2, name: '教学楼B区', type: '教学区', status: 'good', cleaner: '李阿姨', lastClean: '2024-03-15 07:30' },
  { id: 3, name: '实验楼', type: '教学区', status: 'attention', cleaner: '张阿姨', lastClean: '2024-03-15 08:00' },
  { id: 4, name: '食堂', type: '生活区', status: 'good', cleaner: '刘阿姨', lastClean: '2024-03-15 06:30' },
  { id: 5, name: '操场', type: '运动区', status: 'good', cleaner: '赵师傅', lastClean: '2024-03-15 07:00' },
  { id: 6, name: '校门口', type: '公共区', status: 'good', cleaner: '孙阿姨', lastClean: '2024-03-15 06:00' },
];

// 绿化区域
const greenAreas = [
  { id: 1, name: '前广场花坛', area: '200㎡', plants: '月季、杜鹃', status: '良好', lastMaintain: '2024-03-10' },
  { id: 2, name: '操场周边绿化带', area: '500㎡', plants: '樟树、桂花', status: '良好', lastMaintain: '2024-03-08' },
  { id: 3, name: '教学楼庭院', area: '300㎡', plants: '银杏、草坪', status: '需修剪', lastMaintain: '2024-02-28' },
  { id: 4, name: '后山绿化区', area: '1000㎡', plants: '竹林、茶花', status: '良好', lastMaintain: '2024-03-05' },
];

export default function EnvironmentPage() {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'good':
        return <Badge className="bg-green-100 text-green-700">良好</Badge>;
      case 'attention':
        return <Badge className="bg-yellow-100 text-yellow-700">需关注</Badge>;
      case 'warning':
        return <Badge className="bg-red-100 text-red-700">需整改</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-orange-50/30 via-white to-amber-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">环境管理</h1>
          <p className="text-gray-500 mt-1">校园环境卫生与绿化维护</p>
        </div>
        <Button className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
          <Plus className="h-4 w-4" />
          新建任务
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">环境优良率</p>
                <p className="text-2xl font-bold text-green-600">95%</p>
              </div>
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">绿化面积</p>
                <p className="text-2xl font-bold text-green-600">8500㎡</p>
              </div>
              <div className="p-2 rounded-lg bg-green-100">
                <Trees className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">保洁人员</p>
                <p className="text-2xl font-bold text-blue-600">12人</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100">
                <School className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">待处理</p>
                <p className="text-2xl font-bold text-orange-600">3项</p>
              </div>
              <div className="p-2 rounded-lg bg-orange-100">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 环境质量监测 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Thermometer className="h-5 w-5 text-red-500" />
              空气质量
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-2">优</div>
            <p className="text-sm text-gray-500">AQI: 35 · PM2.5: 18μg/m³</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Droplets className="h-5 w-5 text-blue-500" />
              水质监测
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-2">达标</div>
            <p className="text-sm text-gray-500">饮用水pH: 7.2 · 余氯: 0.3mg/L</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Wind className="h-5 w-5 text-cyan-500" />
              噪音监测
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-2">正常</div>
            <p className="text-sm text-gray-500">教学区: 45dB · 操场: 55dB</p>
          </CardContent>
        </Card>
      </div>

      {/* 区域清洁状态 */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>区域清洁状态</CardTitle>
          <CardDescription>各区域卫生清洁情况一览</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>区域名称</TableHead>
                <TableHead>区域类型</TableHead>
                <TableHead>保洁人员</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>最后清洁时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {environmentAreas.map((area) => (
                <TableRow key={area.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{area.name}</TableCell>
                  <TableCell>{area.type}</TableCell>
                  <TableCell>{area.cleaner}</TableCell>
                  <TableCell>{getStatusBadge(area.status)}</TableCell>
                  <TableCell>{area.lastClean}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 绿化养护 */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-green-600" />
            绿化养护
          </CardTitle>
          <CardDescription>校园绿化区域管理</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>绿化区域</TableHead>
                <TableHead>面积</TableHead>
                <TableHead>主要植物</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>上次养护</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {greenAreas.map((area) => (
                <TableRow key={area.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{area.name}</TableCell>
                  <TableCell>{area.area}</TableCell>
                  <TableCell>{area.plants}</TableCell>
                  <TableCell>{getStatusBadge(area.status === '良好' ? 'good' : 'attention')}</TableCell>
                  <TableCell>{area.lastMaintain}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
