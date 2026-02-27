'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  Wrench,
  ShoppingCart,
  Receipt,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  ChevronRight,
  Filter,
  User,
  Calendar,
} from 'lucide-react';
import { mockLeaveRequests, mockRepairRequests } from '@/data/mock';

export default function WorkflowPage() {
  const [activeTab, setActiveTab] = useState('pending');

  // 待审批列表
  const pendingApprovals = [
    { id: 'L001', type: 'leave', applicant: '张小燕', title: '事假申请', duration: '2天', time: '10分钟前', urgent: true },
    { id: 'L002', type: 'leave', applicant: '王丽萍', title: '病假申请', duration: '1天', time: '2小时前', urgent: false },
    { id: 'R001', type: 'repair', applicant: '张小燕', title: '投影仪报修', location: '教学楼301', time: '3小时前', urgent: true },
    { id: 'P001', type: 'purchase', applicant: '教务处', title: '办公用品采购', amount: '¥5,800', time: '昨天', urgent: false },
    { id: 'E001', type: 'expense', applicant: '王丽萍', title: '培训差旅费报销', amount: '¥1,280', time: '昨天', urgent: false },
  ];

  // 已处理列表
  const processedApprovals = [
    { id: 'L003', type: 'leave', applicant: '李文博', title: '调休申请', status: 'approved', time: '昨天' },
    { id: 'R002', type: 'repair', applicant: '刘婷婷', title: '办公室门锁报修', status: 'approved', time: '2天前' },
    { id: 'P002', type: 'purchase', applicant: '德育处', title: '活动物资采购', status: 'rejected', time: '3天前' },
    { id: 'E002', type: 'expense', applicant: '张小燕', title: '办公用品报销', status: 'approved', time: '4天前' },
  ];

  // 获取类型图标和颜色
  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'leave':
        return { icon: FileText, color: 'bg-blue-100 text-blue-600', label: '请假' };
      case 'repair':
        return { icon: Wrench, color: 'bg-orange-100 text-orange-600', label: '报修' };
      case 'purchase':
        return { icon: ShoppingCart, color: 'bg-green-100 text-green-600', label: '采购' };
      case 'expense':
        return { icon: Receipt, color: 'bg-purple-100 text-purple-600', label: '报销' };
      default:
        return { icon: FileText, color: 'bg-gray-100 text-gray-600', label: '其他' };
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-amber-50/30 via-white to-orange-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">审批中心</h1>
          <p className="text-gray-500 mt-1">请假审批 · 报修审批 · 采购审批</p>
        </div>
        <div className="flex items-center gap-3">
          <Select defaultValue="all">
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="全部类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              <SelectItem value="leave">请假审批</SelectItem>
              <SelectItem value="repair">报修审批</SelectItem>
              <SelectItem value="purchase">采购审批</SelectItem>
              <SelectItem value="expense">报销审批</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            筛选
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">待审批</p>
                <p className="text-3xl font-bold text-orange-600">4</p>
              </div>
              <div className="p-3 rounded-xl bg-orange-100">
                <AlertCircle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">已通过</p>
                <p className="text-3xl font-bold text-green-600">28</p>
              </div>
              <div className="p-3 rounded-xl bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">已拒绝</p>
                <p className="text-3xl font-bold text-red-600">5</p>
              </div>
              <div className="p-3 rounded-xl bg-red-100">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">本月总计</p>
                <p className="text-3xl font-bold text-gray-900">37</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-100">
                <FileText className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 审批列表 */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="pending" className="gap-2">
                <AlertCircle className="h-4 w-4" />
                待审批
                <Badge className="bg-orange-500 text-white text-xs ml-1">4</Badge>
              </TabsTrigger>
              <TabsTrigger value="processed" className="gap-2">
                <CheckCircle className="h-4 w-4" />
                已处理
              </TabsTrigger>
              <TabsTrigger value="mine" className="gap-2">
                <User className="h-4 w-4" />
                我的申请
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="pt-6">
          {/* 待审批列表 */}
          <TabsContent value="pending" className="mt-0">
            <div className="space-y-3">
              {pendingApprovals.map((item) => {
                const typeStyle = getTypeStyle(item.type);
                const Icon = typeStyle.icon;
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <div className={`p-3 rounded-xl ${typeStyle.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">{typeStyle.label}</Badge>
                        <p className="font-medium text-gray-900">{item.title}</p>
                        {item.urgent && (
                          <Badge className="bg-red-100 text-red-700 text-xs">紧急</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {item.applicant}
                        </span>
                        {item.duration && <span>时长：{item.duration}</span>}
                        {item.location && <span>位置：{item.location}</span>}
                        {item.amount && <span>金额：{item.amount}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-2">{item.time}</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="text-green-600 hover:bg-green-50">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          通过
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50">
                          <XCircle className="h-4 w-4 mr-1" />
                          拒绝
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* 已处理列表 */}
          <TabsContent value="processed" className="mt-0">
            <div className="space-y-3">
              {processedApprovals.map((item) => {
                const typeStyle = getTypeStyle(item.type);
                const Icon = typeStyle.icon;
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <div className={`p-3 rounded-xl ${typeStyle.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">{typeStyle.label}</Badge>
                        <p className="font-medium text-gray-900">{item.title}</p>
                      </div>
                      <p className="text-sm text-gray-500">申请人：{item.applicant}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-1">{item.time}</p>
                      <Badge className={
                        item.status === 'approved' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }>
                        {item.status === 'approved' ? '已通过' : '已拒绝'}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* 我的申请列表 */}
          <TabsContent value="mine" className="mt-0">
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>暂无您的申请记录</p>
              <Button className="mt-4 bg-amber-500 hover:bg-amber-600 text-white">
                新建申请
              </Button>
            </div>
          </TabsContent>
        </CardContent>
      </Card>

      {/* 快捷入口 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Link href="/workflow/leave">
          <Card className="border-0 shadow-md hover:shadow-lg transition-all cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">请假申请</h3>
                  <p className="text-sm text-gray-500">事假、病假、调休等</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/workflow/repair">
          <Card className="border-0 shadow-md hover:shadow-lg transition-all cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-orange-100 text-orange-600">
                  <Wrench className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">报修申请</h3>
                  <p className="text-sm text-gray-500">设施设备维修</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-orange-600 transition-colors" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/workflow/purchase">
          <Card className="border-0 shadow-md hover:shadow-lg transition-all cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-green-100 text-green-600">
                  <ShoppingCart className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">采购申请</h3>
                  <p className="text-sm text-gray-500">物资采购审批</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-green-600 transition-colors" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/workflow/expense">
          <Card className="border-0 shadow-md hover:shadow-lg transition-all cursor-pointer group">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-purple-100 text-purple-600">
                  <Receipt className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">报销申请</h3>
                  <p className="text-sm text-gray-500">费用报销审批</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
