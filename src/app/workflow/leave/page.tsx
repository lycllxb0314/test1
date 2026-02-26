'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar as CalendarIcon,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  User,
  ArrowRight,
  ChevronRight,
} from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { mockLeaveRequests } from '@/data/mock';

export default function LeavePage() {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [leaveType, setLeaveType] = useState('');
  const [reason, setReason] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = () => {
    if (!startDate || !endDate || !leaveType || !reason) {
      alert('请填写完整信息');
      return;
    }
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const getStepStatus = (step: number, currentStep: number) => {
    if (step < currentStep) return 'completed';
    if (step === currentStep) return 'current';
    return 'pending';
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-blue-50/30 via-white to-cyan-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">请假申请</h1>
          <p className="text-gray-500 mt-1">提交请假申请，等待审批</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 申请表单 */}
        <Card className="lg:col-span-2 border-0 shadow-md">
          <CardHeader>
            <CardTitle>填写请假信息</CardTitle>
            <CardDescription>请填写请假类型、时间和原因</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 请假类型 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">请假类型</label>
              <Select value={leaveType} onValueChange={setLeaveType}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="选择请假类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="事假">事假</SelectItem>
                  <SelectItem value="病假">病假</SelectItem>
                  <SelectItem value="年假">年假</SelectItem>
                  <SelectItem value="调休">调休</SelectItem>
                  <SelectItem value="其他">其他</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 请假时间 */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">开始日期</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full h-12 justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, 'PPP', { locale: zhCN }) : '选择日期'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">结束日期</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full h-12 justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, 'PPP', { locale: zhCN }) : '选择日期'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* 请假天数 */}
            {startDate && endDate && (
              <div className="p-4 rounded-xl bg-blue-50 text-blue-700">
                <p className="font-medium">
                  请假天数：{Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1} 天
                </p>
              </div>
            )}

            {/* 请假原因 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">请假原因</label>
              <Textarea
                placeholder="请详细说明请假原因..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-[120px]"
              />
            </div>

            {/* 提交按钮 */}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1">
                保存草稿
              </Button>
              <Button 
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                onClick={handleSubmit}
              >
                提交申请
              </Button>
            </div>

            {/* 成功提示 */}
            {showSuccess && (
              <div className="p-4 rounded-xl bg-green-50 text-green-700 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                申请提交成功，请等待审批
              </div>
            )}
          </CardContent>
        </Card>

        {/* 审批流程 */}
        <div className="space-y-6">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>审批流程</CardTitle>
              <CardDescription>请假审批流程说明</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { step: 1, name: '教研组长审批', role: '教研组长' },
                  { step: 2, name: '年级组长审批', role: '年级组长' },
                  { step: 3, name: '教务处审批', role: '教务处' },
                ].map((item, index) => (
                  <div key={item.step} className="flex items-start gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                      index === 0 ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {item.step}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.role}</p>
                    </div>
                    {index < 2 && (
                      <ArrowRight className="h-4 w-4 text-gray-300 mt-2" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 我的申请记录 */}
          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>申请记录</CardTitle>
                <CardDescription>最近请假记录</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-blue-600">
                查看全部 <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockLeaveRequests.map((request) => (
                  <div
                    key={request.id}
                    className="p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{request.type}</Badge>
                      <Badge className={
                        request.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        request.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }>
                        {request.status === 'pending' ? '审批中' : request.status === 'approved' ? '已通过' : '已拒绝'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {request.startDate} 至 {request.endDate}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">共 {request.duration} 天</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
