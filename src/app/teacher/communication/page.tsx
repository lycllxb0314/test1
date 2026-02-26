'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  MessageSquare,
  Plus,
  Search,
  Send,
  Users,
  Phone,
  Bell,
  Calendar,
  FileText,
  Sparkles,
} from 'lucide-react';

// 模拟通知数据
const mockNotices = [
  { id: 1, title: '关于春游活动的通知', type: '活动通知', status: 'sent', sendTime: '2024-03-15 10:00', readCount: 48, totalCount: 50 },
  { id: 2, title: '期中考试安排通知', type: '考试通知', status: 'sent', sendTime: '2024-03-14 15:30', readCount: 50, totalCount: 50 },
  { id: 3, title: '清明节放假安排', type: '放假通知', status: 'draft', sendTime: '-', readCount: 0, totalCount: 50 },
];

// 模拟家长消息
const mockMessages = [
  { id: 1, parent: '王先生', student: '张小明', content: '老师好，请问明天需要带什么材料？', time: '10:30', status: 'unread' },
  { id: 2, parent: '李女士', student: '李小红', content: '收到，谢谢老师通知！', time: '09:45', status: 'read' },
  { id: 3, parent: '张先生', student: '王小刚', content: '老师好，孩子今天不舒服，请帮忙关注一下', time: '08:30', status: 'unread' },
];

// 话术模板
const mockTemplates = [
  { id: 1, title: '学生请假模板', content: '您好，{学生姓名}今日因{原因}请假，请家长知晓。' },
  { id: 2, title: '成绩通知模板', content: '您好，{学生姓名}本次{科目}考试成绩为{分数}分，请关注。' },
  { id: 3, title: '家长会邀请模板', content: '尊敬的家长，诚邀您参加{日期}举行的家长会，地点：{地点}。' },
];

export default function CommunicationPage() {
  const [activeTab, setActiveTab] = useState<'notice' | 'message' | 'template'>('notice');
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-purple-50/30 via-white to-pink-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">家校沟通</h1>
          <p className="text-gray-500 mt-1">通知发布、家长消息、话术模板</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-purple-500 hover:bg-purple-600 text-white gap-2">
            <Plus className="h-4 w-4" />
            发送通知
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">本月通知</p>
                <p className="text-2xl font-bold text-purple-600">12</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-100">
                <Bell className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">未读消息</p>
                <p className="text-2xl font-bold text-red-600">5</p>
              </div>
              <div className="p-2 rounded-lg bg-red-100">
                <MessageSquare className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">话术模板</p>
                <p className="text-2xl font-bold text-blue-600">8</p>
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
                <p className="text-sm text-gray-500">家长满意度</p>
                <p className="text-2xl font-bold text-green-600">98%</p>
              </div>
              <div className="p-2 rounded-lg bg-green-100">
                <Users className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-2 border-b">
        <button
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'notice' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('notice')}
        >
          通知管理
        </button>
        <button
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'message' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('message')}
        >
          家长消息
        </button>
        <button
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'template' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('template')}
        >
          话术模板
        </button>
      </div>

      {/* 通知管理 */}
      {activeTab === 'notice' && (
        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-3 text-left font-medium text-gray-700">通知标题</th>
                  <th className="p-3 text-left font-medium text-gray-700">类型</th>
                  <th className="p-3 text-left font-medium text-gray-700">阅读情况</th>
                  <th className="p-3 text-left font-medium text-gray-700">发送时间</th>
                  <th className="p-3 text-left font-medium text-gray-700">状态</th>
                </tr>
              </thead>
              <tbody>
                {mockNotices.map((notice) => (
                  <tr key={notice.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-medium">{notice.title}</td>
                    <td className="p-3">
                      <Badge variant="outline">{notice.type}</Badge>
                    </td>
                    <td className="p-3">{notice.readCount}/{notice.totalCount}</td>
                    <td className="p-3">{notice.sendTime}</td>
                    <td className="p-3">
                      <Badge className={notice.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                        {notice.status === 'sent' ? '已发送' : '草稿'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* 家长消息 */}
      {activeTab === 'message' && (
        <div className="space-y-3">
          {mockMessages.map((msg) => (
            <Card key={msg.id} className={`border-0 shadow-md ${msg.status === 'unread' ? 'bg-purple-50' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <Users className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{msg.parent}</span>
                        <span className="text-sm text-gray-500">({msg.student}家长)</span>
                        {msg.status === 'unread' && (
                          <Badge className="bg-red-500 text-white text-xs">未读</Badge>
                        )}
                      </div>
                      <p className="text-gray-700 mt-1">{msg.content}</p>
                      <p className="text-xs text-gray-400 mt-1">{msg.time}</p>
                    </div>
                  </div>
                  <Button size="sm">回复</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 话术模板 */}
      {activeTab === 'template' && (
        <div className="grid gap-4 md:grid-cols-2">
          {mockTemplates.map((template) => (
            <Card key={template.id} className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{template.title}</h3>
                  <Badge className="bg-purple-100 text-purple-700">
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI推荐
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-3">{template.content}</p>
                <Button size="sm" variant="outline" className="w-full">使用模板</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
