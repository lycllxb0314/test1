'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Wrench, 
  AlertTriangle,
  ArrowLeft 
} from 'lucide-react';
import Link from 'next/link';

// 系统维护状态配置
const MAINTENANCE_CONFIG = {
  enabled: true, // 设为 false 可恢复正常访问
  title: '系统正在升级维护中',
  message: '总务后勤系统正在进行功能升级，请稍后再访问。',
  contactInfo: '如有紧急事务，请联系总务处：0597-XXX-XXXX',
};

export default function GeneralLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 维护模式
  if (MAINTENANCE_CONFIG.enabled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-amber-50/30 flex items-center justify-center p-6">
        <Card className="max-w-lg w-full border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            {/* 维护图标 */}
            <div className="w-20 h-20 mx-auto mb-6 bg-orange-100 rounded-full flex items-center justify-center">
              <Wrench className="h-10 w-10 text-orange-500 animate-pulse" />
            </div>

            {/* 标题 */}
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              {MAINTENANCE_CONFIG.title}
            </h1>

            {/* 描述 */}
            <p className="text-gray-600 mb-6 leading-relaxed">
              {MAINTENANCE_CONFIG.message}
            </p>

            {/* 联系信息 */}
            <div className="flex items-center justify-center gap-2 text-sm text-amber-600 bg-amber-50 rounded-lg px-4 py-3 mb-6">
              <AlertTriangle className="h-4 w-4" />
              <span>{MAINTENANCE_CONFIG.contactInfo}</span>
            </div>

            {/* 返回首页按钮 */}
            <Link href="/">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                返回首页
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 正常模式
  return <>{children}</>;
}
