'use client';

/**
 * 门户管理父组件
 *
 * 职责：仅负责 Tab 切换，将各管理功能委托给独立子组件。
 * 子组件列表：
 * - CarouselManagement       轮播图管理
 * - PhilosophyManagement     童心教育管理
 * - AchievementsManagement   成果特色办学管理
 * - AnnouncementsManagement  公告新闻管理
 * - TeacherExcellenceManagement 卓越教师管理
 * - StudentShowcaseManagement   附小少年管理
 */

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Image as ImageIcon,
  Shield,
  Sparkles,
  Newspaper,
  GraduationCap,
} from 'lucide-react';

import { CarouselManagement } from './CarouselManagement';
import { PhilosophyManagement } from './PhilosophyManagement';
import { AchievementsManagement } from './AchievementsManagement';
import { AnnouncementsManagement } from './AnnouncementsManagement';
import { TeacherExcellenceManagement } from './TeacherExcellenceManagement';
import { StudentShowcaseManagement } from './StudentShowcaseManagement';

export function PortalManagement() {
  const [activeTab, setActiveTab] = useState('carousel');

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="carousel" className="gap-2">
            <ImageIcon className="h-4 w-4" />
            轮播图管理
          </TabsTrigger>
          <TabsTrigger value="philosophy" className="gap-2">
            <Shield className="h-4 w-4" />
            童心教育管理
          </TabsTrigger>
          <TabsTrigger value="achievements" className="gap-2">
            <Sparkles className="h-4 w-4" />
            成果特色办学
          </TabsTrigger>
          <TabsTrigger value="announcements" className="gap-2">
            <Newspaper className="h-4 w-4" />
            公告新闻管理
          </TabsTrigger>
          <TabsTrigger value="teacherExcellence" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            卓越教师
          </TabsTrigger>
          <TabsTrigger value="studentShowcase" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            附小少年
          </TabsTrigger>
        </TabsList>

        <TabsContent value="carousel" className="mt-4">
          <CarouselManagement />
        </TabsContent>

        <TabsContent value="philosophy" className="mt-4">
          <PhilosophyManagement />
        </TabsContent>

        <TabsContent value="achievements" className="mt-4">
          <AchievementsManagement />
        </TabsContent>

        <TabsContent value="announcements" className="mt-4">
          <AnnouncementsManagement />
        </TabsContent>

        <TabsContent value="teacherExcellence" className="mt-4">
          <TeacherExcellenceManagement />
        </TabsContent>

        <TabsContent value="studentShowcase" className="mt-4">
          <StudentShowcaseManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
