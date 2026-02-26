'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  CheckSquare,
  Search,
  Download,
  Calendar,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  BookOpen,
  ArrowRightLeft,
  User,
  CalendarClock,
} from 'lucide-react';

// 模拟考勤数据（包含请假关联）
const mockAttendance = [
  { 
    id: 1, 
    name: '张老师', 
    department: '语文组', 
    date: '2024-03-18', 
    checkIn: '07:45', 
    checkOut: '17:30', 
    status: 'present',
    scheduledCourses: 4,
    actualCourses: 4,
    substitutedCourses: 0,
    leaveInfo: null,
  },
  { 
    id: 2, 
    name: '李老师', 
    department: '数学组', 
    date: '2024-03-18', 
    checkIn: '08:05', 
    checkOut: '17:30', 
    status: 'late',
    scheduledCourses: 3,
    actualCourses: 3,
    substitutedCourses: 0,
    leaveInfo: null,
    remark: '迟到5分钟',
  },
  { 
    id: 3, 
    name: '王老师', 
    department: '英语组', 
    date: '2024-03-18', 
    checkIn: '-', 
    checkOut: '-', 
    status: 'leave',
    scheduledCourses: 2,
    actualCourses: 0,
    substitutedCourses: 2,
    leaveInfo: {
      type: '病假',
      duration: 1,
      leaveId: 'leave-001',
      approved: true,
    },
  },
  { 
    id: 4, 
    name: '赵老师', 
    department: '体育组', 
    date: '2024-03-18', 
    checkIn: '-', 
    checkOut: '-', 
    status: 'leave',
    scheduledCourses: 3,
    actualCourses: 0,
    substitutedCourses: 2,
    leaveInfo: {
      type: '事假',
      duration: 1,
      leaveId: 'leave-002',
      approved: true,
    },
    remark: '1节课程取消',
  },
  { 
    id: 5, 
    name: '陈老师', 
    department: '美术组', 
    date: '2024-03-18', 
    checkIn: '07:48', 
    checkOut: '17:35', 
    status: 'present',
    scheduledCourses: 2,
    actualCourses: 3,
    substitutedCourses: 0,
    leaveInfo: null,
    remark: '代课1节',
  },
  { 
    id: 6, 
    name: '刘老师', 
    department: '音乐组', 
    date: '2024-03-18', 
    checkIn: '07:52', 
    checkOut: '17:28', 
    status: 'present',
    scheduledCourses: 2,
    actualCourses: 2,
    substitutedCourses: 0,
    leaveInfo: null,
  },
  { 
    id: 7, 
    name: '周老师', 
    department: '科学组', 
    date: '2024-03-18', 
    checkIn: '07:55', 
    checkOut: '17:30', 
    status: 'present',
    scheduledCourses: 3,
    actualCourses: 3,
    substitutedCourses: 0,
    leaveInfo: null,
  },
  { 
    id: 8, 
    name: '吴老师', 
    department: '道德组', 
    date: '2024-03-18', 
    checkIn: '08:15', 
    checkOut: '17:40', 
    status: 'late',
    scheduledCourses: 2,
    actualCourses: 2,
    substitutedCourses: 0,
    leaveInfo: null,
    remark: '迟到15分钟',
  },
];

// 模拟请假记录
const mockLeaveRecords = [
  {
    id: 'leave-001',
    teacherName: '王老师',
    type: '病假',
    duration: 1,
    status: 'approved',
    startDate: '2024-03-18',
    endDate: '2024-03-18',
    reason: '感冒发烧',
    courseAdjustStatus: 'completed',
    courses: [
      { className: '三年级2班', courseName: '英语', period: 2, adjustType: 'substituted', substituteName: '钱老师' },
      { className: '四年级1班', courseName: '英语', period: 5, adjustType: 'substituted', substituteName: '孙老师' },
    ],
  },
  {
    id: 'leave-002',
    teacherName: '赵老师',
    type: '事假',
    duration: 1,
    status: 'approved',
    startDate: '2024-03-18',
    endDate: '2024-03-18',
    reason: '家中有事',
    courseAdjustStatus: 'completed',
    courses: [
      { className: '二年级1班', courseName: '体育', period: 3, adjustType: 'substituted', substituteName: '李老师' },
      { className: '一年级3班', courseName: '体育', period: 6, adjustType: 'cancelled', substituteName: null },
    ],
  },
  {
    id: 'leave-003',
    teacherName: '张老师',
    type: '病假',
    duration: 3,
    status: 'approved',
    startDate: '2024-03-20',
    endDate: '2024-03-22',
    reason: '住院治疗',
    courseAdjustStatus: 'pending',
    courses: [],
  },
];

export default function AttendancePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('2024-03-18');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-100 text-green-700 border-green-200">出勤</Badge>;
      case 'late':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">迟到</Badge>;
      case 'early_leave':
        return <Badge className="bg-orange-100 text-orange-700 border-orange-200">早退</Badge>;
      case 'absent':
        return <Badge className="bg-red-100 text-red-700 border-red-200">缺勤</Badge>;
      case 'leave':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">请假</Badge>;
      case 'business_trip':
        return <Badge className="bg-purple-100 text-purple-700 border-purple-200">出差</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredAttendance = mockAttendance.filter(a => {
    const matchesSearch = a.name.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // 统计
  const stats = {
    total: mockAttendance.length,
    present: mockAttendance.filter(a => a.status === 'present').length,
    late: mockAttendance.filter(a => a.status === 'late').length,
    leave: mockAttendance.filter(a => a.status === 'leave').length,
    totalScheduled: mockAttendance.reduce((sum, a) => sum + a.scheduledCourses, 0),
    totalActual: mockAttendance.reduce((sum, a) => sum + a.actualCourses, 0),
    totalSubstituted: mockAttendance.reduce((sum, a) => sum + a.substitutedCourses, 0),
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-indigo-50/30 via-white to-purple-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">教师考勤</h1>
          <p className="text-gray-500 mt-1">教师出勤记录、请假统计与调课关联</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Calendar className="h-4 w-4" />
            选择日期
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            导出报表
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-6">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">应出勤</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-2 rounded-lg bg-gray-100">
                <Users className="h-5 w-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">正常出勤</p>
                <p className="text-2xl font-bold text-green-600">{stats.present}</p>
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
                <p className="text-sm text-gray-500">迟到</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.late}</p>
              </div>
              <div className="p-2 rounded-lg bg-yellow-100">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">请假</p>
                <p className="text-2xl font-bold text-blue-600">{stats.leave}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">计划课时</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalScheduled}</p>
              </div>
              <div className="p-2 rounded-lg bg-indigo-100">
                <BookOpen className="h-5 w-5 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">代课课时</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalSubstituted}</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-100">
                <ArrowRightLeft className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 主内容区 */}
      <Tabs defaultValue="attendance" className="space-y-4">
        <TabsList className="bg-white border">
          <TabsTrigger value="attendance">考勤记录</TabsTrigger>
          <TabsTrigger value="leave">请假记录</TabsTrigger>
          <TabsTrigger value="adjust">调课关联</TabsTrigger>
        </TabsList>

        {/* 考勤记录 */}
        <TabsContent value="attendance">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>今日考勤详情</CardTitle>
                  <CardDescription>{dateFilter} 考勤记录</CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="搜索教师姓名..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-48"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="状态筛选" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部状态</SelectItem>
                      <SelectItem value="present">出勤</SelectItem>
                      <SelectItem value="late">迟到</SelectItem>
                      <SelectItem value="leave">请假</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>教师</TableHead>
                    <TableHead>部门</TableHead>
                    <TableHead>签到</TableHead>
                    <TableHead>签退</TableHead>
                    <TableHead className="text-center">计划课时</TableHead>
                    <TableHead className="text-center">实际上课</TableHead>
                    <TableHead className="text-center">被代课</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>备注</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttendance.map(record => (
                    <TableRow key={record.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{record.name}</TableCell>
                      <TableCell>{record.department}</TableCell>
                      <TableCell>{record.checkIn}</TableCell>
                      <TableCell>{record.checkOut}</TableCell>
                      <TableCell className="text-center">{record.scheduledCourses}</TableCell>
                      <TableCell className="text-center">{record.actualCourses}</TableCell>
                      <TableCell className="text-center">
                        {record.substitutedCourses > 0 ? (
                          <Badge variant="outline" className="bg-purple-50 text-purple-600">
                            {record.substitutedCourses}节
                          </Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell>
                        {record.leaveInfo ? (
                          <div className="text-xs">
                            <div className="text-blue-600">{record.leaveInfo.type}</div>
                            <div className="text-gray-400">{record.leaveInfo.duration}天</div>
                          </div>
                        ) : record.remark ? (
                          <span className="text-xs text-gray-500">{record.remark}</span>
                        ) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 请假记录 */}
        <TabsContent value="leave">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>请假记录</CardTitle>
                  <CardDescription>与考勤系统自动关联的请假记录</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockLeaveRecords.map(leave => (
                  <div key={leave.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg ${
                          leave.type === '病假' ? 'bg-red-100' : 'bg-blue-100'
                        }`}>
                          <FileText className={`h-5 w-5 ${
                            leave.type === '病假' ? 'text-red-600' : 'text-blue-600'
                          }`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{leave.teacherName}</span>
                            <Badge variant="outline">{leave.type}</Badge>
                            <Badge className={
                              leave.status === 'approved' ? 'bg-green-100 text-green-700' :
                              leave.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }>
                              {leave.status === 'approved' ? '已通过' : 
                               leave.status === 'pending' ? '审批中' : '已拒绝'}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600">
                            {leave.startDate} 至 {leave.endDate}，共 {leave.duration} 天
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            原因：{leave.reason}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {leave.courseAdjustStatus === 'completed' ? (
                          <Badge className="bg-green-100 text-green-700">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            调课完成
                          </Badge>
                        ) : leave.courseAdjustStatus === 'pending' ? (
                          <Badge className="bg-yellow-100 text-yellow-700">
                            <Clock className="h-3 w-3 mr-1" />
                            待调课
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                    
                    {/* 课程调整详情 */}
                    {leave.courses.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="text-sm text-gray-600 mb-2">课程调整：</div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {leave.courses.map((course, idx) => (
                            <div key={idx} className="p-2 bg-gray-50 rounded text-sm">
                              <div className="font-medium">{course.className} · {course.courseName}</div>
                              <div className="text-gray-500 text-xs mt-1">
                                第{course.period}节 · 
                                {course.adjustType === 'substituted' ? (
                                  <span className="text-green-600">由{course.substituteName}代课</span>
                                ) : course.adjustType === 'cancelled' ? (
                                  <span className="text-orange-600">已取消</span>
                                ) : (
                                  <span>待安排</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* 考勤同步状态 */}
                    <div className="mt-3 pt-3 border-t flex items-center gap-4">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <CalendarClock className="h-3 w-3" />
                        考勤已同步
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <ArrowRightLeft className="h-3 w-3" />
                        排课已同步
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <CheckCircle className="h-3 w-3" />
                        课表已同步
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 调课关联 */}
        <TabsContent value="adjust">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>调课与考勤关联</CardTitle>
              <CardDescription>请假导致的调课记录自动同步到考勤系统</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                <div className="flex items-center gap-2 text-blue-700">
                  <ArrowRightLeft className="h-5 w-5" />
                  <span className="font-medium">数据联动说明</span>
                </div>
                <p className="text-sm text-blue-600 mt-2">
                  当教师请假审批通过后，系统自动执行以下操作：
                </p>
                <ul className="text-sm text-blue-600 mt-2 space-y-1 list-disc list-inside">
                  <li>更新教师考勤状态为"请假"</li>
                  <li>触发调课流程，由年段长安排代课</li>
                  <li>调课完成后自动同步到教师课表、班级课表、电子白板</li>
                  <li>更新考勤中的课程统计（计划课时、实际课时、代课课时）</li>
                </ul>
              </div>
              
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>请假教师</TableHead>
                    <TableHead>请假类型</TableHead>
                    <TableHead>请假时间</TableHead>
                    <TableHead>影响课程</TableHead>
                    <TableHead>调课状态</TableHead>
                    <TableHead>考勤同步</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockLeaveRecords.map(leave => (
                    <TableRow key={leave.id}>
                      <TableCell className="font-medium">{leave.teacherName}</TableCell>
                      <TableCell>{leave.type}</TableCell>
                      <TableCell>{leave.startDate}</TableCell>
                      <TableCell>{leave.courses.length}节</TableCell>
                      <TableCell>
                        {leave.courseAdjustStatus === 'completed' ? (
                          <Badge className="bg-green-100 text-green-700">已完成</Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-700">待处理</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-50 text-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          已同步
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
