'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Users,
  GraduationCap,
  Clock,
  BookOpen,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// 课程时段配置
const timeSlots = [
  { index: 1, name: '第一节', time: '08:00-08:40' },
  { index: 2, name: '第二节', time: '08:50-09:30' },
  { index: 3, name: '第三节', time: '09:50-10:30' },
  { index: 4, name: '第四节', time: '10:40-11:20' },
  { index: 5, name: '第五节', time: '14:00-14:40' },
  { index: 6, name: '第六节', time: '14:50-15:30' },
  { index: 7, name: '第七节', time: '15:50-16:30' },
];

const weekDays = ['周一', '周二', '周三', '周四', '周五'];

// 课程颜色配置
const courseColors: Record<string, { bg: string; border: string; text: string }> = {
  '语文': { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
  '数学': { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
  '英语': { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
  '科学': { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
  '体育': { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
  '音乐': { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700' },
  '美术': { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700' },
  '道德与法治': { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700' },
  '班会': { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700' },
};

// 模拟班级课表数据
const generateClassSchedule = (className: string) => {
  const courses = ['语文', '数学', '英语', '科学', '体育', '音乐', '美术', '道德与法治'];
  const teachers = ['张老师', '李老师', '王老师', '陈老师', '周老师', '吴老师', '赵老师'];
  
  const schedule: Record<string, { course: string; teacher: string }[]> = {};
  
  weekDays.forEach(day => {
    schedule[day] = [];
    timeSlots.forEach((slot, idx) => {
      // 生成合理的课程安排
      let course = '';
      if (idx === 6) {
        course = '班会';
      } else {
        course = courses[Math.floor(Math.random() * courses.length)];
      }
      schedule[day].push({
        course,
        teacher: teachers[Math.floor(Math.random() * teachers.length)],
      });
    });
  });
  
  return schedule;
};

// 班级列表
const classes = [
  { id: '3-1', name: '三年1班', headTeacher: '张小燕' },
  { id: '3-2', name: '三年2班', headTeacher: '李文博' },
  { id: '3-3', name: '三年3班', headTeacher: '孙伟' },
  { id: '3-4', name: '三年4班', headTeacher: '钱华' },
  { id: '3-5', name: '三年5班', headTeacher: '郑敏' },
];

// 今日调课信息
const todayAdjustments = [
  { classId: '3-2', className: '三年2班', period: '第2节', originalTeacher: '李文博', substituteTeacher: '王建国', reason: '请假' },
  { classId: '3-5', className: '三年5班', period: '第4节', originalTeacher: '郑敏', substituteTeacher: '刘芳', reason: '教研活动' },
];

export default function GradeSchedulePage() {
  const { user } = useAuth();
  const [selectedClass, setSelectedClass] = useState(classes[0].id);
  const [viewMode, setViewMode] = useState<'class' | 'teacher'>('class');
  const [currentWeek, setCurrentWeek] = useState(1);

  // 获取选中班级的课表
  const selectedClassInfo = classes.find(c => c.id === selectedClass);
  const schedule = generateClassSchedule(selectedClassInfo?.name || '');

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-cyan-50/30 via-white to-blue-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="h-7 w-7 text-cyan-500" />
            <h1 className="text-2xl font-bold text-gray-900">年级课表</h1>
          </div>
          <p className="text-gray-500 mt-1">查看三年级各班级课程安排</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-1">
            <RefreshCw className="h-4 w-4" />
            刷新
          </Button>
        </div>
      </div>

      {/* 班级选择 */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center gap-4 overflow-x-auto pb-2">
            {classes.map(cls => (
              <Button
                key={cls.id}
                variant={selectedClass === cls.id ? 'default' : 'outline'}
                size="sm"
                className={`flex-shrink-0 ${selectedClass === cls.id ? 'bg-cyan-500 hover:bg-cyan-600 text-white' : ''}`}
                onClick={() => setSelectedClass(cls.id)}
              >
                {cls.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 今日调课提醒 */}
      {todayAdjustments.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-5 w-5 text-amber-600" />
              <span className="font-medium text-amber-800">今日调课安排</span>
            </div>
            <div className="space-y-2">
              {todayAdjustments.map((adj, idx) => (
                <div key={idx} className="flex items-center gap-4 text-sm">
                  <Badge className="bg-amber-100 text-amber-700">{adj.className}</Badge>
                  <span className="text-gray-600">{adj.period}</span>
                  <span className="text-gray-500">
                    {adj.originalTeacher} → <span className="text-amber-700 font-medium">{adj.substituteTeacher}</span> 代课
                  </span>
                  <span className="text-gray-400">({adj.reason})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 课表 */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-cyan-500" />
              {selectedClassInfo?.name} 课程表
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentWeek(Math.max(1, currentWeek - 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-600 min-w-[80px] text-center">第 {currentWeek} 周</span>
              <Button variant="outline" size="sm" onClick={() => setCurrentWeek(currentWeek + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardDescription>班主任：{selectedClassInfo?.headTeacher}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-2 border bg-gray-50 text-sm font-medium text-gray-600 w-20">节次</th>
                  {weekDays.map(day => (
                    <th key={day} className="p-2 border bg-gray-50 text-sm font-medium text-gray-600">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((slot, idx) => (
                  <tr key={slot.index}>
                    <td className="border p-1 bg-gray-50">
                      <div className="text-xs font-medium text-gray-700">{slot.name}</div>
                      <div className="text-[10px] text-gray-400">{slot.time}</div>
                    </td>
                    {weekDays.map(day => {
                      const courseInfo = schedule[day][idx];
                      const colors = courseColors[courseInfo.course] || { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700' };
                      
                      return (
                        <td key={day} className="border p-1">
                          <div className={`p-2 rounded ${colors.bg} ${colors.border} border h-16`}>
                            <div className={`text-xs font-medium ${colors.text}`}>{courseInfo.course}</div>
                            <div className="text-[10px] text-gray-400 mt-1">{courseInfo.teacher}</div>
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

      {/* 年级课表总览 */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-blue-500" />
            年级课表总览
          </CardTitle>
          <CardDescription>快速查看各班级今日课程安排</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <th className="p-2 border bg-gray-50 font-medium text-gray-600">班级</th>
                  {timeSlots.map(slot => (
                    <th key={slot.index} className="p-2 border bg-gray-50 font-medium text-gray-600">
                      {slot.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {classes.map(cls => {
                  const clsSchedule = generateClassSchedule(cls.name);
                  return (
                    <tr key={cls.id}>
                      <td className="border p-2 bg-gray-50 font-medium">{cls.name}</td>
                      {timeSlots.map((slot, idx) => {
                        const courseInfo = clsSchedule['周一'][idx];
                        const colors = courseColors[courseInfo.course] || { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700' };
                        return (
                          <td key={slot.index} className="border p-1">
                            <div className={`${colors.bg} ${colors.text} p-1 rounded text-center`}>
                              {courseInfo.course}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 课程图例 */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-500">课程图例：</span>
            {Object.entries(courseColors).map(([course, colors]) => (
              <div key={course} className={`px-2 py-1 rounded text-xs ${colors.bg} ${colors.text}`}>
                {course}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
