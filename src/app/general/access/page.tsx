/**
 * 门禁管理主页面
 * 统一管理教师/学生/家长/访客的通行权限、申请审批和出入记录
 */

'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AccessStatsPanel } from '@/components/access/AccessStatsPanel';
import { AccessPersonPanel } from '@/components/access/AccessPersonPanel';
import { AccessApplicationPanel } from '@/components/access/AccessApplicationPanel';
import { AccessRecordPanel } from '@/components/access/AccessRecordPanel';

export default function AccessControlPage() {
  const [activeTab, setActiveTab] = useState('persons');

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold">门禁管理</h1>
        <p className="text-sm text-muted-foreground mt-1">
          统一管理教师、学生、家长、访客的通行权限与出入记录
        </p>
      </div>

      {/* 统计面板 */}
      <AccessStatsPanel />

      {/* 功能标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="persons">人员管理</TabsTrigger>
          <TabsTrigger value="applications">申请审批</TabsTrigger>
          <TabsTrigger value="records">通行记录</TabsTrigger>
        </TabsList>

        <TabsContent value="persons" className="mt-4">
          <AccessPersonPanel />
        </TabsContent>

        <TabsContent value="applications" className="mt-4">
          <AccessApplicationPanel />
        </TabsContent>

        <TabsContent value="records" className="mt-4">
          <AccessRecordPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
