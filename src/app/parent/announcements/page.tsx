'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bell,
  Calendar,
  Eye,
  Paperclip,
} from 'lucide-react';

// 模拟通知数据
const mockNotices = [
  {
    id: 1,
    title: '关于开展2024年春季研学活动的通知',
    content: '为丰富学生课外生活，开阔视野，学校定于4月15日-16日组织开展春季研学活动。本次活动将前往龙岩市博物馆、科技馆等地参观学习。请各位家长配合做好准备工作...',
    type: '活动通知',
    date: '2024-03-15',
    isRead: false,
    isImportant: true,
    attachments: ['研学活动方案.pdf', '安全责任书.docx'],
  },
  {
    id: 2,
    title: '期中考试时间安排',
    content: '本学期期中考试定于4月8日-10日举行。具体安排如下：4月8日语文、数学；4月9日英语、科学；4月10日道德与法治。请督促孩子做好复习准备。',
    type: '教务通知',
    date: '2024-03-14',
    isRead: false,
    isImportant: true,
    attachments: [],
  },
  {
    id: 3,
    title: '家长会通知',
    content: '学校定于3月25日（周一）下午3:00召开全校家长会，届时将向各位家长汇报本学期教学工作安排及学生学习情况，请准时参加。',
    type: '会议通知',
    date: '2024-03-12',
    isRead: true,
    isImportant: false,
    attachments: [],
  },
  {
    id: 4,
    title: '关于做好春季传染病预防工作的通知',
    content: '春季是传染病高发季节，请家长配合学校做好以下预防工作：1. 保持室内通风；2. 注意个人卫生；3. 合理饮食，加强锻炼；4. 发现异常及时就医并告知班主任。',
    type: '安全通知',
    date: '2024-03-10',
    isRead: true,
    isImportant: true,
    attachments: ['春季传染病预防指南.pdf'],
  },
  {
    id: 5,
    title: '关于开展"读书月"活动的通知',
    content: '为培养学生的阅读兴趣和习惯，学校将4月定为"读书月"，开展系列读书活动。请家长督促孩子每天阅读不少于30分钟，并做好阅读记录。',
    type: '活动通知',
    date: '2024-03-08',
    isRead: true,
    isImportant: false,
    attachments: ['推荐书目.docx'],
  },
];

const getTypeColor = (type: string) => {
  switch (type) {
    case '活动通知': return 'bg-blue-100 text-blue-700';
    case '教务通知': return 'bg-green-100 text-green-700';
    case '会议通知': return 'bg-purple-100 text-purple-700';
    case '安全通知': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

export default function ParentAnnouncementsPage() {
  const unreadCount = mockNotices.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">通知公告</h1>
          <p className="text-muted-foreground mt-1">
            学校通知公告
            {unreadCount > 0 && (
              <Badge className="ml-2 bg-red-100 text-red-700">{unreadCount}条未读</Badge>
            )}
          </p>
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">全部</TabsTrigger>
          <TabsTrigger value="unread">未读 {unreadCount}</TabsTrigger>
          <TabsTrigger value="important">重要通知</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4 space-y-4">
          {mockNotices.map((notice) => (
            <Card key={notice.id} className={!notice.isRead ? 'border-l-4 border-l-cyan-500' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {!notice.isRead && (
                        <div className="w-2 h-2 rounded-full bg-cyan-500" />
                      )}
                      <Badge className={getTypeColor(notice.type)}>{notice.type}</Badge>
                      {notice.isImportant && (
                        <Badge className="bg-red-100 text-red-700">重要</Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg">{notice.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4" />
                      {notice.date}
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    查看详情
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">{notice.content}</p>
                {notice.attachments.length > 0 && (
                  <div className="flex items-center gap-2 mt-3">
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                    <div className="flex gap-2">
                      {notice.attachments.map((att, index) => (
                        <Badge key={index} variant="outline" className="cursor-pointer hover:bg-muted">
                          {att}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="unread" className="mt-4 space-y-4">
          {mockNotices.filter(n => !n.isRead).map((notice) => (
            <Card key={notice.id} className="border-l-4 border-l-cyan-500">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full bg-cyan-500" />
                      <Badge className={getTypeColor(notice.type)}>{notice.type}</Badge>
                      {notice.isImportant && (
                        <Badge className="bg-red-100 text-red-700">重要</Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg">{notice.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4" />
                      {notice.date}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">{notice.content}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="important" className="mt-4 space-y-4">
          {mockNotices.filter(n => n.isImportant).map((notice) => (
            <Card key={notice.id} className={!notice.isRead ? 'border-l-4 border-l-cyan-500' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {!notice.isRead && (
                        <div className="w-2 h-2 rounded-full bg-cyan-500" />
                      )}
                      <Badge className={getTypeColor(notice.type)}>{notice.type}</Badge>
                      <Badge className="bg-red-100 text-red-700">重要</Badge>
                    </div>
                    <CardTitle className="text-lg">{notice.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4" />
                      {notice.date}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">{notice.content}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
