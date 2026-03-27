'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Activity,
  Search,
  Filter,
  Download,
  Clock,
  MapPin,
  User,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  Eye,
  Image as ImageIcon,
} from 'lucide-react';
import { AccessRecord, PersonType } from '@/types';

// 模拟通行记录数据
const mockRecords: AccessRecord[] = [
  { id: 'r001', personId: 's001', personType: 'student', personName: '张三', organization: '三年1班', deviceId: 'dev-001', deviceName: '东校门入口', deviceType: 'gate', location: '学校东门', direction: 'in', method: 'face', accessTime: '2024-03-15 08:12:35', status: 'success', temperature: 36.5, createdAt: '2024-03-15 08:12:35' },
  { id: 'r002', personId: 's002', personType: 'student', personName: '李四', organization: '三年1班', deviceId: 'dev-001', deviceName: '东校门入口', deviceType: 'gate', location: '学校东门', direction: 'in', method: 'face', accessTime: '2024-03-15 08:12:58', status: 'success', temperature: 36.3, createdAt: '2024-03-15 08:12:58' },
  { id: 'r003', personId: 't001', personType: 'teacher', personName: '王老师', organization: '语文组', deviceId: 'dev-005', deviceName: '教学楼A栋入口', deviceType: 'building', location: '教学楼A栋', direction: 'in', method: 'face', accessTime: '2024-03-15 07:45:22', status: 'success', createdAt: '2024-03-15 07:45:22' },
  { id: 'r004', personId: 'staff001', personType: 'staff', personName: '赵师傅', organization: '后勤部', deviceId: 'dev-003', deviceName: '西校门入口', deviceType: 'gate', location: '学校西门', direction: 'in', method: 'card', accessTime: '2024-03-15 07:30:15', status: 'success', createdAt: '2024-03-15 07:30:15' },
  { id: 'r005', personId: 'v001', personType: 'visitor', personName: '刘家长', organization: '访客', deviceId: 'dev-001', deviceName: '东校门入口', deviceType: 'gate', location: '学校东门', direction: 'in', method: 'qrcode', accessTime: '2024-03-15 09:15:48', status: 'success', createdAt: '2024-03-15 09:15:48' },
  { id: 'r006', personId: 'unknown', personType: 'visitor', personName: '未知人员', organization: '-', deviceId: 'dev-001', deviceName: '东校门入口', deviceType: 'gate', location: '学校东门', direction: 'in', method: 'face', accessTime: '2024-03-15 08:45:33', status: 'denied', denyReason: '未注册人员', isAbnormal: true, abnormalType: 'unregistered', createdAt: '2024-03-15 08:45:33' },
  { id: 'r007', personId: 's045', personType: 'student', personName: '陈小明', organization: '五年2班', deviceId: 'dev-001', deviceName: '东校门入口', deviceType: 'gate', location: '学校东门', direction: 'in', method: 'face', accessTime: '2024-03-15 08:23:41', status: 'success', temperature: 36.8, createdAt: '2024-03-15 08:23:41' },
  { id: 'r008', personId: 't012', personType: 'teacher', personName: '林老师', organization: '数学组', deviceId: 'dev-006', deviceName: '教学楼B栋入口', deviceType: 'building', location: '教学楼B栋', direction: 'in', method: 'face', accessTime: '2024-03-15 07:58:12', status: 'success', createdAt: '2024-03-15 07:58:12' },
  { id: 'r009', personId: 's045', personType: 'student', personName: '陈小明', organization: '五年2班', deviceId: 'dev-002', deviceName: '东校门出口', deviceType: 'gate', location: '学校东门', direction: 'out', method: 'face', accessTime: '2024-03-15 11:45:22', status: 'timeout', isAbnormal: true, abnormalType: 'wrong_time', createdAt: '2024-03-15 11:45:22' },
  { id: 'r010', personId: 'v002', personType: 'visitor', personName: '张工程师', organization: '访客', deviceId: 'dev-003', deviceName: '西校门入口', deviceType: 'gate', location: '学校西门', direction: 'in', method: 'qrcode', accessTime: '2024-03-15 10:30:00', status: 'success', createdAt: '2024-03-15 10:30:00' },
];

// 人员类型映射
const personTypeMap: Record<PersonType, { label: string; color: string }> = {
  student: { label: '学生', color: 'text-blue-600 bg-blue-50' },
  teacher: { label: '教师', color: 'text-green-600 bg-green-50' },
  staff: { label: '后勤', color: 'text-orange-600 bg-orange-50' },
  visitor: { label: '访客', color: 'text-purple-600 bg-purple-50' },
};

// 通行方式映射
const methodMap: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  face: { label: '人脸识别', icon: User },
  card: { label: '刷卡', icon: User },
  qrcode: { label: '二维码', icon: User },
  fingerprint: { label: '指纹', icon: User },
  manual: { label: '人工', icon: User },
};

// 状态映射
const statusMap: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  success: { label: '通行成功', color: 'text-green-600 bg-green-50', icon: CheckCircle },
  denied: { label: '拒绝通行', color: 'text-red-600 bg-red-50', icon: XCircle },
  timeout: { label: '超时异常', color: 'text-orange-600 bg-orange-50', icon: AlertTriangle },
  exception: { label: '异常', color: 'text-red-600 bg-red-50', icon: AlertTriangle },
};

export default function AccessRecordsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [directionFilter, setDirectionFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('today');

  // 过滤记录
  const filteredRecords = mockRecords.filter(record => {
    const matchSearch = record.personName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (record.organization || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = typeFilter === 'all' || record.personType === typeFilter;
    const matchStatus = statusFilter === 'all' || record.status === statusFilter;
    const matchDirection = directionFilter === 'all' || record.direction === directionFilter;
    return matchSearch && matchType && matchStatus && matchDirection;
  });

  // 统计
  const stats = {
    total: mockRecords.length,
    success: mockRecords.filter(r => r.status === 'success').length,
    denied: mockRecords.filter(r => r.status === 'denied').length,
    abnormal: mockRecords.filter(r => r.isAbnormal).length,
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-teal-50/30 via-white to-cyan-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-7 w-7 text-teal-600" />
            <h1 className="text-2xl font-bold text-gray-900">通行记录</h1>
          </div>
          <p className="text-gray-500 mt-1">人员进出记录查询与追踪</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          导出记录
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">今日通行</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Activity className="h-8 w-8 text-teal-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">通行成功</p>
                <p className="text-2xl font-bold text-green-600">{stats.success}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">拒绝通行</p>
                <p className="text-2xl font-bold text-red-600">{stats.denied}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">异常记录</p>
                <p className="text-2xl font-bold text-orange-600">{stats.abnormal}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 筛选栏 */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索姓名或组织..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="时间" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">今天</SelectItem>
                <SelectItem value="yesterday">昨天</SelectItem>
                <SelectItem value="week">本周</SelectItem>
                <SelectItem value="month">本月</SelectItem>
                <SelectItem value="custom">自定义</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-28">
                <SelectValue placeholder="人员类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="student">学生</SelectItem>
                <SelectItem value="teacher">教师</SelectItem>
                <SelectItem value="staff">后勤</SelectItem>
                <SelectItem value="visitor">访客</SelectItem>
              </SelectContent>
            </Select>
            <Select value={directionFilter} onValueChange={setDirectionFilter}>
              <SelectTrigger className="w-28">
                <SelectValue placeholder="通行方向" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部方向</SelectItem>
                <SelectItem value="in">进入</SelectItem>
                <SelectItem value="out">离开</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-28">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="success">成功</SelectItem>
                <SelectItem value="denied">拒绝</SelectItem>
                <SelectItem value="timeout">超时</SelectItem>
                <SelectItem value="exception">异常</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 记录列表 */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>时间</TableHead>
                <TableHead>人员信息</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>设备</TableHead>
                <TableHead>方向</TableHead>
                <TableHead>方式</TableHead>
                <TableHead>体温</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map(record => {
                const typeInfo = personTypeMap[record.personType] || { label: '未知', color: 'text-gray-600 bg-gray-50' };
                const statusInfo = statusMap[record.status || 'success'] || { label: '未知', color: 'text-gray-600 bg-gray-50', icon: CheckCircle };
                const StatusIcon = statusInfo.icon;
                const accessTimeStr = record.accessTime || '';

                return (
                  <TableRow key={record.id} className={`hover:bg-gray-50 ${record.isAbnormal ? 'bg-red-50/50' : ''}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="font-medium">{accessTimeStr.split(' ')[1] || ''}</p>
                          <p className="text-xs text-gray-400">{accessTimeStr.split(' ')[0] || ''}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-sm font-medium">
                          {record.personName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{record.personName}</p>
                          <p className="text-xs text-gray-400">{record.organization || '-'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={typeInfo.color}>{typeInfo.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{record.deviceName}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {record.location}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`flex items-center gap-1 ${record.direction === 'in' ? 'text-blue-600' : 'text-green-600'}`}>
                        {record.direction === 'in' ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                        <span>{record.direction === 'in' ? '进入' : '离开'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600">{methodMap[record.method || 'face'].label}</TableCell>
                    <TableCell>
                      {record.temperature ? (
                        <span className={record.temperature > 37.3 ? 'text-red-600 font-medium' : 'text-gray-600'}>
                          {record.temperature}°C
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusInfo.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusInfo.label}
                      </Badge>
                      {record.isAbnormal && (
                        <p className="text-xs text-red-600 mt-1">{record.denyReason || '异常'}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="h-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 分页 */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          显示 {filteredRecords.length} 条记录，共 {mockRecords.length} 条
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>上一页</Button>
          <Button variant="outline" size="sm">下一页</Button>
        </div>
      </div>
    </div>
  );
}
