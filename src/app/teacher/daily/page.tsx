'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  Sun,
  Moon,
  ClipboardCheck,
  Loader2,
} from 'lucide-react';

// 学生数据类型
interface StudentDailyData {
  id: string;
  name: string;
  status: 'present' | 'absent' | 'late';
  morningCheck: string;
  temperature: string;
  arrivalTime: string;
}

export default function DailyPage() {
  const [activeTab, setActiveTab] = useState<'attendance' | 'check' | 'duty'>('attendance');
  const [students, setStudents] = useState<StudentDailyData[]>([]);
  const [loading, setLoading] = useState(true);

  // 今日数据
  const todayData = {
    date: '2024年3月20日 星期三',
    weather: '晴 18-25°C',
    attendance: { total: students.length, present: students.filter(s => s.status === 'present').length, absent: students.filter(s => s.status === 'absent').length, late: students.filter(s => s.status === 'late').length },
    morningCheck: { normal: students.filter(s => s.morningCheck === 'normal').length, fever: 0, leave: students.filter(s => s.morningCheck === '-').length },
    duty: { morning: '张小明、李小红', afternoon: '王小刚、赵小芳' },
  };

  // 从API获取学生数据
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/students?limit=20');
        const result = await response.json();
        
        if (result.success && result.data) {
          // 转换API数据到页面格式
          const formattedStudents: StudentDailyData[] = result.data.map((s: {
            id: string;
            name: string;
          }) => ({
            id: s.id,
            name: s.name,
            status: Math.random() > 0.1 ? 'present' : (Math.random() > 0.5 ? 'absent' : 'late'),
            morningCheck: Math.random() > 0.05 ? 'normal' : '-',
            temperature: (36 + Math.random() * 1).toFixed(1),
            arrivalTime: `07:${40 + Math.floor(Math.random() * 30)}`,
          }));
          setStudents(formattedStudents);
        }
      } catch (error) {
        console.error('获取学生数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-100 text-green-700">出勤</Badge>;
      case 'absent':
        return <Badge className="bg-red-100 text-red-700">缺勤</Badge>;
      case 'late':
        return <Badge className="bg-yellow-100 text-yellow-700">迟到</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-purple-50/30 via-white to-pink-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">日常管理</h1>
          <p className="text-gray-500 mt-1">考勤、晨检、值日管理</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-medium text-gray-900">{todayData.date}</p>
          <p className="text-sm text-gray-500">{todayData.weather}</p>
        </div>
      </div>

      {/* 考勤统计 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">班级人数</p>
                <p className="text-2xl font-bold text-purple-600">{todayData.attendance.total}</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-100">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">出勤人数</p>
                <p className="text-2xl font-bold text-green-600">{todayData.attendance.present}</p>
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
                <p className="text-sm text-gray-500">缺勤人数</p>
                <p className="text-2xl font-bold text-red-600">{todayData.attendance.absent}</p>
              </div>
              <div className="p-2 rounded-lg bg-red-100">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">迟到人数</p>
                <p className="text-2xl font-bold text-yellow-600">{todayData.attendance.late}</p>
              </div>
              <div className="p-2 rounded-lg bg-yellow-100">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-2 border-b">
        <button
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'attendance' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('attendance')}
        >
          考勤记录
        </button>
        <button
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'check' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('check')}
        >
          晨检记录
        </button>
        <button
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'duty' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('duty')}
        >
          值日安排
        </button>
      </div>

      {/* 考勤记录 */}
      {activeTab === 'attendance' && (
        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-3 text-left font-medium text-gray-700">学生姓名</th>
                  <th className="p-3 text-left font-medium text-gray-700">状态</th>
                  <th className="p-3 text-left font-medium text-gray-700">到校时间</th>
                  <th className="p-3 text-left font-medium text-gray-700">备注</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-medium">{student.name}</td>
                    <td className="p-3">{getStatusBadge(student.status)}</td>
                    <td className="p-3">{student.arrivalTime}</td>
                    <td className="p-3 text-gray-500">-</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* 晨检记录 */}
      {activeTab === 'check' && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sun className="h-5 w-5 text-orange-500" />
                晨检统计
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span>正常</span>
                  <span className="font-bold text-green-600">{todayData.morningCheck.normal}人</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <span>发热</span>
                  <span className="font-bold text-red-600">{todayData.morningCheck.fever}人</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <span>请假</span>
                  <span className="font-bold text-yellow-600">{todayData.morningCheck.leave}人</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>今日体温记录</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-3 text-left font-medium text-gray-700">学生姓名</th>
                    <th className="p-3 text-left font-medium text-gray-700">体温</th>
                    <th className="p-3 text-left font-medium text-gray-700">状态</th>
                  </tr>
                </thead>
                <tbody>
                  {students.filter(s => s.status === 'present').slice(0, 5).map((student) => (
                    <tr key={student.id} className="border-t">
                      <td className="p-3">{student.name}</td>
                      <td className="p-3">{student.temperature}°C</td>
                      <td className="p-3">
                        <Badge className="bg-green-100 text-green-700">正常</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 值日安排 */}
      {activeTab === 'duty' && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sun className="h-5 w-5 text-orange-500" />
                上午值日
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-lg font-medium text-gray-900">{todayData.duty.morning}</p>
                <p className="text-sm text-gray-500 mt-1">负责打扫教室、擦黑板、整理桌椅</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Moon className="h-5 w-5 text-indigo-500" />
                下午值日
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-indigo-50 rounded-lg">
                <p className="text-lg font-medium text-gray-900">{todayData.duty.afternoon}</p>
                <p className="text-sm text-gray-500 mt-1">负责打扫教室、倒垃圾、关窗锁门</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md md:col-span-2">
            <CardHeader>
              <CardTitle>本周值日安排</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-2">
                {['周一', '周二', '周三', '周四', '周五'].map((day, index) => (
                  <div key={day} className={`p-3 rounded-lg ${index === 2 ? 'bg-purple-100 border-2 border-purple-300' : 'bg-gray-50'}`}>
                    <p className="font-medium text-center">{day}</p>
                    <p className="text-sm text-center text-gray-600 mt-1">
                      {['第1组', '第2组', '第3组', '第4组', '第5组'][index]}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
