/**
 * 门禁管理主页面
 * 统一管理教师/学生/家长/访客的通行权限
 */

'use client';

import { useState } from 'react';
import { AccessStatsPanel } from '@/components/access/AccessStatsPanel';
import { AccessPersonPanel } from '@/components/access/AccessPersonPanel';
import { AccessApplicationPanel } from '@/components/access/AccessApplicationPanel';
import { AccessRecordPanel } from '@/components/access/AccessRecordPanel';
import { Shield, Users, ClipboardList, ArrowLeftRight } from 'lucide-react';

const tabs = [
  { key: 'persons', label: '人员管理', icon: Users },
  { key: 'applications', label: '申请审批', icon: ClipboardList },
  { key: 'records', label: '通行记录', icon: ArrowLeftRight },
] as const;

type TabKey = typeof tabs[number]['key'];

export default function AccessControlPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('persons');

  return (
    <div className="space-y-6 p-6">
      {/* 页头 */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">门禁管理</h1>
          <p className="text-sm text-muted-foreground">统一管理教师、学生、家长、访客的通行权限与出入记录</p>
        </div>
      </div>

      {/* 统计面板 */}
      <AccessStatsPanel />

      {/* Tab 切换 */}
      <div className="border-b">
        <div className="flex gap-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 面板内容 */}
      <div>
        {activeTab === 'persons' && <AccessPersonPanel />}
        {activeTab === 'applications' && <AccessApplicationPanel />}
        {activeTab === 'records' && <AccessRecordPanel />}
      </div>
    </div>
  );
}
