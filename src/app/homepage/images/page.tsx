'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, Upload, FolderOpen } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';

export default function ImagesManagementPage() {
  return (
    <MainLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">图片管理</h1>
            <p className="text-gray-500 mt-1">管理主页展示的图片资源</p>
          </div>
          <Button className="gap-2">
            <Upload className="h-4 w-4" />
            上传图片
          </Button>
        </div>

        {/* 功能说明 */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-8">
            <div className="text-center">
              <FolderOpen className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">图片资源管理</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                在此管理主页各区块使用的图片，包括校园活动、教师发展、五育展示等图片资源。
              </p>
              <div className="mt-6 grid grid-cols-3 gap-4 max-w-lg mx-auto">
                <div className="p-4 rounded-lg bg-gray-50">
                  <ImageIcon className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-sm font-medium">校园活动</p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50">
                  <ImageIcon className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p className="text-sm font-medium">教师发展</p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50">
                  <ImageIcon className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <p className="text-sm font-medium">五育展示</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 提示 */}
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <p className="text-sm text-amber-800">
              <strong>提示：</strong>图片上传功能需要配置对象存储服务。目前图片通过文件路径引用，
              请将图片放置在 public/images 目录下。
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
