'use client';

import React, { useState, useEffect } from 'react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Calendar,
  Clock,
  BookOpen,
  Users,
  RefreshCw,
  Download,
  Plus,
  Edit,
  User,
  Building,
  AlertCircle,
  CheckCircle,
  CalendarClock,
  ArrowRightLeft,
  UserCheck,
} from 'lucide-react';

// 默认作息时间配置
const defaultPeriods = [
  { index: 1, name: '第一节', startTime: '08:00', endTime: '08:40', type: 'morning' },
  { index: 2, name: '第二节', startTime: '08:50', endTime: '09:30', type: 'morning' },
  { index: 3, name: '第三节', startTime: '10:00', endTime: '10:40', type: 'morning' },
  { index: 4, name: '第四节', startTime: '10:50', endTime: '11:30', type: 'morning' },
  { index: 5, name: '第五节', startTime: '14:00', endTime: '14:40', type: 'afternoon' },
  { index: 6, name: '第六节', startTime: '14:50', endTime: '15:30', type: 'afternoon' },
  { index: 7, name: '第七节', startTime: '15:40', endTime: '16:20', type: 'afternoon' },
];

const weekDays = [
  { key: 1, label: '周一' },
  { key: 2, label: '周二' },
  { key: 3, label: '周三' },
  { key: 4, label: '周四' },
  { key: 5, label: '周五' },
];

const subjectColors: Record<string, string> = {
  '语文': 'bg-red-100 text-red-700 border-red-200',
  '数学': 'bg-blue-100 text-blue-700 border-blue-200',
  '英语': 'bg-green-100 text-green-700 border-green-200',
  '体育': 'bg-orange-100 text-orange-700 border-orange-200',
  '音乐': 'bg-purple-100 text-purple-700 border-purple-200',
  '美术': 'bg-pink-100 text-pink-700 border-pink-200',
  '科学': 'bg-cyan-100 text-cyan-700 border-cyan-200',
  '道德': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  '阅读': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  '班会': 'bg-gray-100 text-gray-700 border-gray-200',
  '自习': 'bg-slate-100 text-slate-700 border-slate-200',
  '信息技术': 'bg-teal-100 text-teal-700 border-teal-200',
};

// 模拟班级数据
const mockClasses = [
  { id: '1', name: '一年级1班', grade: 1, headTeacher: '张老师' },
  { id: '2', name: '一年级2班', grade: 1, headTeacher: '李老师' },
  { id: '3', name: '二年级1班', grade: 2, headTeacher: '王老师' },
  { id: '4', name: '二年级2班', grade: 2, headTeacher: '赵老师' },
  { id: '5', name: '三年级1班', grade: 3, headTeacher: '刘老师' },
];

// 模拟教师数据
const mockTeachers = [
  { id: 't1', name: '张老师', subjects: ['语文', '阅读'], grade: 1 },
  { id: 't2', name: '李老师', subjects: ['数学'], grade: 1 },
  { id: 't3', name: '王老师', subjects: ['英语'], grade: 2 },
  { id: 't4', name: '赵老师', subjects: ['体育'], grade: 0 },
  { id: 't5', name: '刘老师', subjects: ['音乐'], grade: 0 },
  { id: 't6', name: '陈老师', subjects: ['美术'], grade: 0 },
  { id: 't7', name: '周老师', subjects: ['科学'], grade: 3 },
  { id: 't8', name: '吴老师', subjects: ['道德'], grade: 3 },
];

// 模拟课表数据
const mockScheduleSlots = [
  // 一年级1班
  { id: 's1', classId: '1', className: '一年级1班', grade: 1, weekDay: 1, periodIndex: 1, courseName: '语文', subject: '语文', teacherId: 't1', teacherName: '张老师', status: 'normal' },
  { id: 's2', classId: '1', className: '一年级1班', grade: 1, weekDay: 1, periodIndex: 2, courseName: '数学', subject: '数学', teacherId: 't2', teacherName: '李老师', status: 'normal' },
  { id: 's3', classId: '1', className: '一年级1班', grade: 1, weekDay: 1, periodIndex: 3, courseName: '体育', subject: '体育', teacherId: 't4', teacherName: '赵老师', status: 'substituted', originalTeacherName: '赵老师' },
  { id: 's4', classId: '1', className: '一年级1班', grade: 1, weekDay: 1, periodIndex: 4, courseName: '音乐', subject: '音乐', teacherId: 't5', teacherName: '刘老师', status: 'normal' },
  { id: 's5', classId: '1', className: '一年级1班', grade: 1, weekDay: 1, periodIndex: 5, courseName: '美术', subject: '美术', teacherId: 't6', teacherName: '陈老师', status: 'normal' },
  { id: 's6', classId: '1', className: '一年级1班', grade: 1, weekDay: 1, periodIndex: 6, courseName: '自习', subject: '自习', teacherId: '', teacherName: '', status: 'normal' },
  
  { id: 's7', classId: '1', className: '一年级1班', grade: 1, weekDay: 2, periodIndex: 1, courseName: '数学', subject: '数学', teacherId: 't2', teacherName: '李老师', status: 'normal' },
  { id: 's8', classId: '1', className: '一年级1班', grade: 1, weekDay: 2, periodIndex: 2, courseName: '语文', subject: '语文', teacherId: 't1', teacherName: '张老师', status: 'normal' },
  { id: 's9', classId: '1', className: '一年级1班', grade: 1, weekDay: 2, periodIndex: 3, courseName: '英语', subject: '英语', teacherId: 't3', teacherName: '王老师', status: 'normal' },
  { id: 's10', classId: '1', className: '一年级1班', grade: 1, weekDay: 2, periodIndex: 4, courseName: '科学', subject: '科学', teacherId: 't7', teacherName: '周老师', status: 'normal' },
  { id: 's11', classId: '1', className: '一年级1班', grade: 1, weekDay: 2, periodIndex: 5, courseName: '道德', subject: '道德', teacherId: 't8', teacherName: '吴老师', status: 'normal' },
  { id: 's12', classId: '1', className: '一年级1班', grade: 1, weekDay: 2, periodIndex: 6, courseName: '自习', subject: '自习', teacherId: '', teacherName: '', status: 'normal' },
  
  // 周三
  { id: 's13', classId: '1', className: '一年级1班', grade: 1, weekDay: 3, periodIndex: 1, courseName: '语文', subject: '语文', teacherId: 't1', teacherName: '张老师', status: 'normal' },
  { id: 's14', classId: '1', className: '一年级1班', grade: 1, weekDay: 3, periodIndex: 2, courseName: '数学', subject: '数学', teacherId: 't2', teacherName: '李老师', status: 'normal' },
  { id: 's15', classId: '1', className: '一年级1班', grade: 1, weekDay: 3, periodIndex: 3, courseName: '体育', subject: '体育', teacherId: 't4', teacherName: '赵老师', status: 'normal' },
  { id: 's16', classId: '1', className: '一年级1班', grade: 1, weekDay: 3, periodIndex: 4, courseName: '音乐', subject: '音乐', teacherId: 't5', teacherName: '刘老师', status: 'normal' },
  { id: 's17', classId: '1', className: '一年级1班', grade: 1, weekDay: 3, periodIndex: 5, courseName: '美术', subject: '美术', teacherId: 't6', teacherName: '陈老师', status: 'normal' },
  { id: 's18', classId: '1', className: '一年级1班', grade: 1, weekDay: 3, periodIndex: 6, courseName: '班会', subject: '班会', teacherId: 't1', teacherName: '张老师', status: 'normal' },
  
  // 周四
  { id: 's19', classId: '1', className: '一年级1班', grade: 1, weekDay: 4, periodIndex: 1, courseName: '数学', subject: '数学', teacherId: 't2', teacherName: '李老师', status: 'normal' },
  { id: 's20', classId: '1', className: '一年级1班', grade: 1, weekDay: 4, periodIndex: 2, courseName: '语文', subject: '语文', teacherId: 't1', teacherName: '张老师', status: 'normal' },
  { id: 's21', classId: '1', className: '一年级1班', grade: 1, weekDay: 4, periodIndex: 3, courseName: '英语', subject: '英语', teacherId: 't3', teacherName: '王老师', status: 'normal' },
  { id: 's22', classId: '1', className: '一年级1班', grade: 1, weekDay: 4, periodIndex: 4, courseName: '科学', subject: '科学', teacherId: 't7', teacherName: '周老师', status: 'normal' },
  { id: 's23', classId: '1', className: '一年级1班', grade: 1, weekDay: 4, periodIndex: 5, courseName: '道德', subject: '道德', teacherId: 't8', teacherName: '吴老师', status: 'normal' },
  { id: 's24', classId: '1', className: '一年级1班', grade: 1, weekDay: 4, periodIndex: 6, courseName: '自习', subject: '自习', teacherId: '', teacherName: '', status: 'normal' },
  
  // 周五
  { id: 's25', classId: '1', className: '一年级1班', grade: 1, weekDay: 5, periodIndex: 1, courseName: '语文', subject: '语文', teacherId: 't1', teacherName: '张老师', status: 'normal' },
  { id: 's26', classId: '1', className: '一年级1班', grade: 1, weekDay: 5, periodIndex: 2, courseName: '数学', subject: '数学', teacherId: 't2', teacherName: '李老师', status: 'normal' },
  { id: 's27', classId: '1', className: '一年级1班', grade: 1, weekDay: 5, periodIndex: 3, courseName: '体育', subject: '体育', teacherId: 't4', teacherName: '赵老师', status: 'normal' },
  { id: 's28', classId: '1', className: '一年级1班', grade: 1, weekDay: 5, periodIndex: 4, courseName: '阅读', subject: '阅读', teacherId: 't1', teacherName: '张老师', status: 'normal' },
  { id: 's29', classId: '1', className: '一年级1班', grade: 1, weekDay: 5, periodIndex: 5, courseName: '信息技术', subject: '信息技术', teacherId: 't7', teacherName: '周老师', status: 'normal' },
  { id: 's30', classId: '1', className: '一年级1班', grade: 1, weekDay: 5, periodIndex: 6, courseName: '班会', subject: '班会', teacherId: 't1', teacherName: '张老师', status: 'normal' },
];

// 模拟调课记录
const mockAdjustments = [
  {
    id: 'adj1',
    applicantName: '赵老师',
    adjusterName: '年级组长',
    adjustType: 'substitute',
    status: 'completed',
    originalSlot: { className: '一年级1班', weekDay: 1, periodIndex: 3, courseName: '体育', teacherName: '赵老师' },
    adjustResult: { substituteTeacherName: '钱老师' },
    reason: '病假',
    createdAt: '2024-03-15 10:30',
  },
  {
    id: 'adj2',
    applicantName: '张老师',
    adjusterName: '年级组长',
    adjustType: 'swap',
    status: 'pending',
    originalSlot: { className: '一年级1班', weekDay: 3, periodIndex: 1, courseName: '语文', teacherName: '张老师' },
    adjustResult: {},
    reason: '外出培训',
    createdAt: '2024-03-16 14:20',
  },
];

export default function SchedulePage() {
  const [selectedClassId, setSelectedClassId] = useState('1');
  const [viewMode, setViewMode] = useState<'class' | 'teacher'>('class');
  const [selectedTeacherId, setSelectedTeacherId] = useState('t1');
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  
  // 根据选中的班级筛选课表
  const classScheduleSlots = mockScheduleSlots.filter(s => s.classId === selectedClassId);
  
  // 根据选中的教师筛选课表
  const teacherScheduleSlots = mockScheduleSlots.filter(s => s.teacherId === selectedTeacherId);
  
  // 获取指定位置的课表
  const getSlot = (weekDay: number, periodIndex: number, slots: any[]) => {
    return slots.find(s => s.weekDay === weekDay && s.periodIndex === periodIndex);
  };
  
  // 计算课时统计
  const calculateSubjectHours = (slots: any[]) => {
    const hours: Record<string, number> = {};
    slots.forEach(slot => {
      if (slot.subject && slot.subject !== '自习') {
        hours[slot.subject] = (hours[slot.subject] || 0) + 1;
      }
    });
    return hours;
  };
  
  const subjectHours = calculateSubjectHours(classScheduleSlots);
  
  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-blue-50/30 via-white to-indigo-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">智能排课</h1>
          <p className="text-gray-500 mt-1">课程表管理、调课处理与教务数据同步</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            导出课表
          </Button>
          <Button variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            智能排课
          </Button>
          <Button className="bg-blue-500 hover:bg-blue-600 text-white gap-2">
            <Plus className="h-4 w-4" />
            新增课程
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">班级总数</p>
                <p className="text-2xl font-bold text-blue-600">56</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">课程科目</p>
                <p className="text-2xl font-bold text-green-600">12</p>
              </div>
              <div className="p-2 rounded-lg bg-green-100">
                <BookOpen className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">待处理调课</p>
                <p className="text-2xl font-bold text-orange-600">3</p>
              </div>
              <div className="p-2 rounded-lg bg-orange-100">
                <CalendarClock className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">本周调课数</p>
                <p className="text-2xl font-bold text-purple-600">5</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-100">
                <ArrowRightLeft className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 主内容区 */}
      <Tabs defaultValue="schedule" className="space-y-4">
        <TabsList className="bg-white border">
          <TabsTrigger value="schedule">班级课表</TabsTrigger>
          <TabsTrigger value="teacher">教师课表</TabsTrigger>
          <TabsTrigger value="adjust">调课管理</TabsTrigger>
          <TabsTrigger value="settings">排课设置</TabsTrigger>
        </TabsList>

        {/* 班级课表 */}
        <TabsContent value="schedule">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>班级课程表</CardTitle>
                  <CardDescription>查看和管理各班级的课程安排</CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {mockClasses.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="text-sm text-gray-500">
                    班主任：{mockClasses.find(c => c.id === selectedClassId)?.headTeacher}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="p-3 text-left bg-gray-50 border font-medium text-gray-700 w-24">节次/时间</th>
                      {weekDays.map(day => (
                        <th key={day.key} className="p-3 text-center bg-gray-50 border font-medium text-gray-700">
                          {day.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {defaultPeriods.map(period => (
                      <tr key={period.index}>
                        <td className="p-3 border bg-gray-50">
                          <div className="font-medium text-gray-700">{period.name}</div>
                          <div className="text-xs text-gray-500">{period.startTime}-{period.endTime}</div>
                        </td>
                        {weekDays.map(day => {
                          const slot = getSlot(day.key, period.index, classScheduleSlots);
                          if (!slot) {
                            return (
                              <td key={day.key} className="p-2 border text-center">
                                <div className="p-2 rounded-lg border-2 border-dashed border-gray-200 text-gray-400 text-sm">
                                  未安排
                                </div>
                              </td>
                            );
                          }
                          
                          const isAdjusted = slot.status === 'substituted' || slot.status === 'swapped';
                          
                          return (
                            <td key={day.key} className="p-2 border text-center">
                              <div 
                                className={`p-2 rounded-lg border cursor-pointer hover:shadow-md transition-shadow ${
                                  subjectColors[slot.subject] || 'bg-gray-50'
                                } ${isAdjusted ? 'ring-2 ring-orange-400' : ''}`}
                                onClick={() => {
                                  setSelectedSlot(slot);
                                  setShowAdjustDialog(true);
                                }}
                              >
                                <div className="font-medium">{slot.courseName}</div>
                                <div className="text-xs mt-1 flex items-center justify-center gap-1">
                                  <User className="h-3 w-3" />
                                  {slot.teacherName || '待定'}
                                </div>
                                {isAdjusted && (
                                  <div className="mt-1">
                                    <Badge variant="outline" className="text-[10px] bg-orange-50 text-orange-600 border-orange-200">
                                      {slot.status === 'substituted' ? '已代课' : '已调换'}
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* 课时统计 */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-700 mb-3">本周课时分布</h4>
                <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                  {Object.entries(subjectHours).map(([subject, hours]) => (
                    <div key={subject} className="flex items-center justify-between p-2 bg-white rounded border">
                      <span className={`px-2 py-0.5 rounded text-xs ${subjectColors[subject] || 'bg-gray-100'}`}>
                        {subject}
                      </span>
                      <span className="font-medium text-sm">{hours}节</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 教师课表 */}
        <TabsContent value="teacher">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>教师课表</CardTitle>
                  <CardDescription>查看各教师的课程安排</CardDescription>
                </div>
                <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {mockTeachers.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="p-3 text-left bg-gray-50 border font-medium text-gray-700 w-24">节次/时间</th>
                      {weekDays.map(day => (
                        <th key={day.key} className="p-3 text-center bg-gray-50 border font-medium text-gray-700">
                          {day.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {defaultPeriods.map(period => (
                      <tr key={period.index}>
                        <td className="p-3 border bg-gray-50">
                          <div className="font-medium text-gray-700">{period.name}</div>
                          <div className="text-xs text-gray-500">{period.startTime}-{period.endTime}</div>
                        </td>
                        {weekDays.map(day => {
                          const slot = getSlot(day.key, period.index, teacherScheduleSlots);
                          if (!slot) {
                            return (
                              <td key={day.key} className="p-2 border text-center">
                                <div className="p-2 rounded-lg bg-gray-50 text-gray-400 text-sm">
                                  -
                                </div>
                              </td>
                            );
                          }
                          
                          return (
                            <td key={day.key} className="p-2 border text-center">
                              <div className={`p-2 rounded-lg border ${subjectColors[slot.subject] || 'bg-gray-50'}`}>
                                <div className="font-medium">{slot.courseName}</div>
                                <div className="text-xs mt-1 flex items-center justify-center gap-1">
                                  <Building className="h-3 w-3" />
                                  {slot.className}
                                </div>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 调课管理 */}
        <TabsContent value="adjust">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>调课记录</CardTitle>
                  <CardDescription>处理教师请假后的调课安排，同步到各系统</CardDescription>
                </div>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  新增调课
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockAdjustments.map(adjust => (
                  <div key={adjust.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={adjust.status === 'completed' ? 'default' : 'secondary'}>
                            {adjust.status === 'completed' ? '已完成' : adjust.status === 'pending' ? '待处理' : '已拒绝'}
                          </Badge>
                          <Badge variant="outline">
                            {adjust.adjustType === 'substitute' ? '代课' : 
                             adjust.adjustType === 'swap' ? '调换' : 
                             adjust.adjustType === 'cancel' ? '取消' : '补课'}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">{adjust.applicantName}</span> 申请调课
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <BookOpen className="h-4 w-4" />
                            {adjust.originalSlot.courseName}
                          </div>
                          <div className="flex items-center gap-1">
                            <Building className="h-4 w-4" />
                            {adjust.originalSlot.className}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            周{adjust.originalSlot.weekDay} 第{adjust.originalSlot.periodIndex}节
                          </div>
                        </div>
                        
                        {adjust.adjustResult.substituteTeacherName && (
                          <div className="mt-2 text-sm text-green-600 flex items-center gap-1">
                            <UserCheck className="h-4 w-4" />
                            代课教师：{adjust.adjustResult.substituteTeacherName}
                          </div>
                        )}
                        
                        <div className="mt-2 text-xs text-gray-400">
                          原因：{adjust.reason} · 申请时间：{adjust.createdAt}
                        </div>
                      </div>
                      
                      {adjust.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">拒绝</Button>
                          <Button size="sm">处理调课</Button>
                        </div>
                      )}
                      
                      {adjust.status === 'completed' && (
                        <div className="flex items-center gap-2 text-green-600 text-sm">
                          <CheckCircle className="h-4 w-4" />
                          已同步
                        </div>
                      )}
                    </div>
                    
                    {/* 同步状态 */}
                    {adjust.status === 'completed' && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="text-xs text-gray-500 mb-2">数据同步状态：</div>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { key: 'teacherSchedule', label: '教师课表' },
                            { key: 'academicSchedule', label: '教务排课' },
                            { key: 'classSchedule', label: '班级课表' },
                            { key: 'electronicBoard', label: '电子白板' },
                            { key: 'teacherAttendance', label: '教师考勤' },
                          ].map(item => (
                            <Badge key={item.key} variant="outline" className="bg-green-50 text-green-600 border-green-200">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              {item.label}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 排课设置 */}
        <TabsContent value="settings">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>作息时间设置</CardTitle>
                <CardDescription>配置每日课程时间安排</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {defaultPeriods.map(period => (
                    <div key={period.index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{period.name}</span>
                        <Badge variant="outline">
                          {period.type === 'morning' ? '上午' : period.type === 'afternoon' ? '下午' : '晚间'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">{period.startTime} - {period.endTime}</span>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button className="w-full mt-4" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  添加节次
                </Button>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>课程设置</CardTitle>
                <CardDescription>管理学校开设的课程</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['语文', '数学', '英语', '体育', '音乐', '美术', '科学', '道德'].map(subject => (
                    <div key={subject} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded ${subjectColors[subject]?.split(' ')[0] || 'bg-gray-200'}`} />
                        <span className="font-medium">{subject}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">每周 4 节</span>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
