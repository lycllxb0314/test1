'use client';

/**
 * 系统维护中页面
 * 
 * 用于展示系统升级维护中的提示页面
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Construction,
  ArrowLeft,
  RefreshCw,
  Clock,
  Wrench,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface MaintenancePageProps {
  /** 模块名称 */
  moduleName: string;
  /** 模块描述 */
  description?: string;
}

export function MaintenancePage({ moduleName, description }: MaintenancePageProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-indigo-50/30 flex items-center justify-center p-6">
      <Card className="max-w-lg w-full border-0 shadow-lg">
        <CardContent className="p-8 text-center">
          {/* 图标 */}
          <div className="relative mb-6">
            <div className="w-24 h-24 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
              <Construction className="w-12 h-12 text-blue-600" />
            </div>
            <div className="absolute -top-1 -right-1 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center animate-bounce">
              <Wrench className="w-4 h-4 text-orange-600" />
            </div>
          </div>

          {/* 标题 */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {moduleName}
          </h1>
          <h2 className="text-lg text-gray-600 mb-4">
            系统正在升级维护中
          </h2>

          {/* 描述 */}
          {description && (
            <p className="text-gray-500 mb-6">
              {description}
            </p>
          )}

          {/* 提示信息 */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center gap-2 text-blue-700">
              <Clock className="w-5 h-5" />
              <span className="font-medium">预计恢复时间</span>
            </div>
            <p className="text-blue-600 mt-1">
              敬请关注系统通知
            </p>
          </div>

          {/* 说明 */}
          <div className="text-sm text-gray-500 mb-6 space-y-1">
            <p>我们正在进行系统升级，为您提供更好的服务体验。</p>
            <p>升级期间，部分功能暂时无法使用，感谢您的理解与支持。</p>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              返回上一页
            </Button>
            <Button
              onClick={() => router.push('/academic')}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              返回教务系统
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
