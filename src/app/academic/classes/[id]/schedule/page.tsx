'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar,
  Clock,
  Users,
  Monitor,
  Wifi,
  WifiOff,
  RefreshCw,
  Download,
  Share2,
  Settings,
  User,
  BookOpen,
  Bell,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

// 默认作息时间配置
const defaultPeriods = [
  { index: 1, name: '第一节', startTime: '08:00', endTime: '08:40', type: 'morning' },
  { index: 2, name: '第二节', startTime: '08:50', endTime: '09:30', type: 'morning' },
  { index: 3, name: '第三节', startTime: '10:00', endTime: '10:40', type: 'morning' },
  { index: 4, name: '第四节', startTime: '10:50', endTime: '11:30', type: 'morning' },
  { index: 5, name: '第五节', startTime: '14:00', endTime: '14:40', type: 'afternoon' },
  { index: 6, name: '第六节', startTime: '14:50', endTime: '15:30', type: 'afternoon' },
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
};

// 模拟班级信息
const mockClassInfo = {
  id: '1',
  name: '一年级1班',
  grade: 1,
  headTeacher: '张老师',
  classroom: '教学楼A栋101',
  studentCount: 45,
  electronicBoard: {
    id: 'eb-001',
    status: 'online',
    lastSync: '2024-03-16 14:30:00',
    ipAddress: '192.168.1.101',
  },
};

// 模拟课表数据
const mockScheduleSlots = [
  { weekDay: 1, periodIndex: 1, courseName: '语文', subject: '语文', teacherName: '张老师', status: 'normal' },
  { weekDay: 1, periodIndex: 2, courseName: '数学', subject: '数学', teacherName: '李老师', status: 'normal' },
  { weekDay: 1, periodIndex: 3, courseName: '体育', subject: '体育', teacherName: '钱老师', status: 'substituted', substituteTeacherName: '钱老师' },
  { weekDay: 1, periodIndex: 4, courseName: '音乐', subject: '音乐', teacherName: '刘老师', status: 'normal' },
  { weekDay: 1, periodIndex: 5, courseName: '美术', subject: '美术', teacherName: '陈老师', status: 'normal' },
  { weekDay: 1, periodIndex: 6, courseName: '自习', subject: '自习', teacherName: '', status: 'normal' },
  
  { weekDay: 2, periodIndex: 1, courseName: '数学', subject: '数学', teacherName: '李老师', status: 'normal' },
  { weekDay: 2, periodIndex: 2, courseName: '语文', subject: '语文', teacherName: '张老师', status: 'normal' },
  { weekDay: 2, periodIndex: 3, courseName: '英语', subject: '英语', teacherName: '王老师', status: 'normal' },
  { weekDay: 2, periodIndex: 4, courseName: '科学', subject: '科学', teacherName: '周老师', status: 'normal' },
  { weekDay: 2, periodIndex: 5, courseName: '道德', subject: '道德', teacherName: '吴老师', status: 'normal' },
  { weekDay: 2, periodIndex: 6, courseName: '自习', subject: '自习', teacherName: '', status: 'normal' },
  
  { weekDay: 3, periodIndex: 1, courseName: '语文', subject: '语文', teacherName: '张老师', status: 'normal' },
  { weekDay: 3, periodIndex: 2, courseName: '数学', subject: '数学', teacherName: '李老师', status: 'normal' },
  { weekDay: 3, periodIndex: 3, courseName: '体育', subject: '体育', teacherName: '赵老师', status: 'normal' },
  { weekDay: 3, periodIndex: 4, courseName: '音乐', subject: '音乐', teacherName: '刘老师', status: 'normal' },
  { weekDay: 3, periodIndex: 5, courseName: '美术', subject: '美术', teacherName: '陈老师', status: 'normal' },
  { weekDay: 3, periodIndex: 6, courseName: '班会', subject: '班会', teacherName: '张老师', status: 'normal' },
  
  { weekDay: 4, periodIndex: 1, courseName: '数学', subject: '数学', teacherName: '李老师', status: 'normal' },
  { weekDay: 4, periodIndex: 2, courseName: '语文', subject: '语文', teacherName: '张老师', status: 'normal' },
  { weekDay: 4, periodIndex: 3, courseName: '英语', subject: '英语', teacherName: '王老师', status: 'normal' },
  { weekDay: 4, periodIndex: 4, courseName: '科学', subject: '科学', teacherName: '周老师', status: 'normal' },
  { weekDay: 4, periodIndex: 5, courseName: '道德', subject: '道德', teacherName: '吴老师', status: 'normal' },
  { weekDay: 4, periodIndex: 6, courseName: '自习', subject: '自习', teacherName: '', status: 'normal' },
  
  { weekDay: 5, periodIndex: 1, courseName: '语文', subject: '语文', teacherName: '张老师', status: 'normal' },
  { weekDay: 5, periodIndex: 2, courseName: '数学', subject: '数学', teacherName: '李老师', status: 'normal' },
  { weekDay: 5, periodIndex: 3, courseName: '体育', subject: '体育', teacherName: '赵老师', status: 'normal' },
  { weekDay: 5, periodIndex: 4, courseName: '阅读', subject: '阅读', teacherName: '张老师', status: 'normal' },
  { weekDay: 5, periodIndex: 5, courseName: '信息技术', subject: '信息技术', teacherName: '周老师', status: 'normal' },
  { weekDay: 5, periodIndex: 6, courseName: '班会', subject: '班会', teacherName: '张老师', status: 'normal' },
];

// 模拟通知
const mockNotices = [
  { id: 'n1', content: '明天下午课外活动取消', type: 'warning', createdAt: '2024-03-16 10:00' },
  { id: 'n2', content: '本周五家长会，请提醒家长准时参加', type: 'important', createdAt: '2024-03-15 14:30' },
  { id: 'n3', content: '下周一开始期中考试', type: 'info', createdAt: '2024-03-14 09:00' },
];

export default function ClassSchedulePage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id as string;
  
  const [activeTab, setActiveTab] = useState('schedule');
  const [syncing, setSyncing] = useState(false);
  
  // 获取指定位置的课表
  const getSlot = (weekDay: number, periodIndex: number) => {
    return mockScheduleSlots.find(s => s.weekDay === weekDay && s.periodIndex === periodIndex);
  };
  
  // 同步到电子白板
  const handleSyncToBoard = async () => {
    setSyncing(true);
    // 模拟同步
    await new Promise(resolve => setTimeout(resolve, 2000));
    setSyncing(false);
    alert('课表已同步到电子白板');
  };
  
  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-teal-50/30 via-white to-cyan-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            ← 返回
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{mockClassInfo.name} 课表管理</h1>
            <p className="text-gray-500 mt-1">班级课表查看与电子白板同步</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            导出课表
          </Button>
          <Button 
            className="gap-2 bg-teal-500 hover:bg-teal-600 text-white"
            onClick={handleSyncToBoard}
            disabled={syncing}
          >
            {syncing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Monitor className="h-4 w-4" />
            )}
            {syncing ? '同步中...' : '同步到电子白板'}
          </Button>
        </div>
      </div>

      {/* 班级信息 & 电子白板状态 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">班主任</p>
                <p className="text-lg font-bold text-gray-900">{mockClassInfo.headTeacher}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100">
                <User className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">学生人数</p>
                <p className="text-lg font-bold text-gray-900">{mockClassInfo.studentCount}人</p>
              </div>
              <div className="p-2 rounded-lg bg-green-100">
                <Users className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">教室位置</p>
                <p className="text-lg font-bold text-gray-900">{mockClassInfo.classroom}</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-100">
                <BookOpen className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">电子白板</p>
                <div className="flex items-center gap-1">
                  {mockClassInfo.electronicBoard.status === 'online' ? (
                    <>
                      <Wifi className="h-4 w-4 text-green-500" />
                      <span className="text-lg font-bold text-green-600">在线</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-4 w-4 text-red-500" />
                      <span className="text-lg font-bold text-red-600">离线</span>
                    </>
                  )}
                </div>
              </div>
              <div className={`p-2 rounded-lg ${
                mockClassInfo.electronicBoard.status === 'online' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <Monitor className={`h-5 w-5 ${
                  mockClassInfo.electronicBoard.status === 'online' ? 'text-green-600' : 'text-red-600'
                }`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 主内容区 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-white border">
          <TabsTrigger value="schedule">本周课表</TabsTrigger>
          <TabsTrigger value="today">今日课程</TabsTrigger>
          <TabsTrigger value="notices">班级通知</TabsTrigger>
          <TabsTrigger value="board">电子白板设置</TabsTrigger>
        </TabsList>

        {/* 本周课表 */}
        <TabsContent value="schedule">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>班级课程表</CardTitle>
                  <CardDescription>2024-2025学年第二学期 第8周</CardDescription>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="h-4 w-4" />
                  最后同步：{mockClassInfo.electronicBoard.lastSync}
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
                          const slot = getSlot(day.key, period.index);
                          if (!slot) {
                            return (
                              <td key={day.key} className="p-2 border text-center">
                                <div className="p-2 rounded-lg bg-gray-50 text-gray-400 text-sm">
                                  -
                                </div>
                              </td>
                            );
                          }
                          
                          const isAdjusted = slot.status === 'substituted';
                          
                          return (
                            <td key={day.key} className="p-2 border text-center">
                              <div className={`p-2 rounded-lg border ${
                                subjectColors[slot.subject] || 'bg-gray-50'
                              } ${isAdjusted ? 'ring-2 ring-orange-400' : ''}`}>
                                <div className="font-medium">{slot.courseName}</div>
                                <div className="text-xs mt-1 flex items-center justify-center gap-1">
                                  <User className="h-3 w-3" />
                                  {isAdjusted ? slot.substituteTeacherName : slot.teacherName || '待定'}
                                </div>
                                {isAdjusted && (
                                  <Badge variant="outline" className="mt-1 text-[10px] bg-orange-50 text-orange-600">
                                    代课
                                  </Badge>
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* 今日课程 */}
        <TabsContent value="today">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>今日课程</CardTitle>
              <CardDescription>电子白板展示内容预览</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {/* 今日课表 */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-700">今日课程安排</h4>
                  {defaultPeriods.map((period, idx) => {
                    const slot = getSlot(1, period.index); // 假设今天是周一
                    return (
                      <div 
                        key={period.index}
                        className={`p-4 rounded-lg border-2 ${
                          idx === 1 ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{period.name}</span>
                              <span className="text-sm text-gray-500">{period.startTime}-{period.endTime}</span>
                              {idx === 1 && (
                                <Badge className="bg-blue-500">当前课程</Badge>
                              )}
                            </div>
                            {slot && (
                              <div className="mt-2">
                                <span className={`px-3 py-1 rounded ${
                                  subjectColors[slot.subject] || 'bg-gray-100'
                                }`}>
                                  {slot.courseName}
                                </span>
                                <span className="ml-2 text-sm text-gray-600">
                                  {slot.teacherName}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* 通知区域 */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-700">班级通知</h4>
                  {mockNotices.map(notice => (
                    <div 
                      key={notice.id}
                      className={`p-3 rounded-lg border-l-4 ${
                        notice.type === 'important' ? 'bg-red-50 border-red-500' :
                        notice.type === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                        'bg-blue-50 border-blue-500'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <Bell className={`h-4 w-4 mt-0.5 ${
                          notice.type === 'important' ? 'text-red-500' :
                          notice.type === 'warning' ? 'text-yellow-500' :
                          'text-blue-500'
                        }`} />
                        <div>
                          <p className="text-sm">{notice.content}</p>
                          <p className="text-xs text-gray-500 mt-1">{notice.createdAt}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 班级通知 */}
        <TabsContent value="notices">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>班级通知管理</CardTitle>
                  <CardDescription>发布通知将同步到电子白板显示</CardDescription>
                </div>
                <Button className="gap-2">
                  <Bell className="h-4 w-4" />
                  发布通知
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockNotices.map(notice => (
                  <div key={notice.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded ${
                          notice.type === 'important' ? 'bg-red-100' :
                          notice.type === 'warning' ? 'bg-yellow-100' :
                          'bg-blue-100'
                        }`}>
                          {notice.type === 'important' ? (
                            <AlertCircle className="h-5 w-5 text-red-600" />
                          ) : notice.type === 'warning' ? (
                            <AlertCircle className="h-5 w-5 text-yellow-600" />
                          ) : (
                            <Bell className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{notice.content}</p>
                          <p className="text-sm text-gray-500 mt-1">{notice.createdAt}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">编辑</Button>
                        <Button variant="ghost" size="sm" className="text-red-500">删除</Button>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-50 text-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        已同步到电子白板
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 电子白板设置 */}
        <TabsContent value="board">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>电子白板信息</CardTitle>
                <CardDescription>管理班级门口电子白板设备</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">设备ID</span>
                    <span className="font-medium">{mockClassInfo.electronicBoard.id}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">IP地址</span>
                    <span className="font-medium">{mockClassInfo.electronicBoard.ipAddress}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">连接状态</span>
                    <div className="flex items-center gap-1">
                      {mockClassInfo.electronicBoard.status === 'online' ? (
                        <>
                          <Wifi className="h-4 w-4 text-green-500" />
                          <span className="text-green-600 font-medium">在线</span>
                        </>
                      ) : (
                        <>
                          <WifiOff className="h-4 w-4 text-red-500" />
                          <span className="text-red-600 font-medium">离线</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">最后同步</span>
                    <span className="font-medium">{mockClassInfo.electronicBoard.lastSync}</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 gap-2">
                    <Settings className="h-4 w-4" />
                    设备设置
                  </Button>
                  <Button variant="outline" className="flex-1 gap-2">
                    <RefreshCw className="h-4 w-4" />
                    重启设备
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>同步设置</CardTitle>
                <CardDescription>配置电子白板显示内容和同步频率</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span className="text-gray-700">自动同步课表</span>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span className="text-gray-700">显示班级通知</span>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span className="text-gray-700">显示调课信息</span>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span className="text-gray-700">同步频率</span>
                    <select className="border rounded px-2 py-1 text-sm">
                      <option>实时同步</option>
                      <option>每小时同步</option>
                      <option>每日同步</option>
                    </select>
                  </div>
                </div>
                
                <Button className="w-full gap-2" onClick={handleSyncToBoard}>
                  <Share2 className="h-4 w-4" />
                  立即同步
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
