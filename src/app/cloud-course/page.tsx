'use client';

/**
 * 云教学首页 - 按角色分流
 * 教师 → 研修课程
 * 家长 → 家长课程 + 子女课程
 * 管理员 → 课程管理
 */

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Baby, GraduationCap, Settings } from 'lucide-react';
import Link from 'next/link';

const ROLE_ENTRIES = {
  head_teacher: [
    { title: '教师研修', desc: '专业发展·教学提升', href: '/teacher/research-cloud', icon: BookOpen, color: 'text-primary' },
    { title: '课程推送', desc: '向学生推送课程', href: '/cloud-course/admin', icon: GraduationCap, color: 'text-emerald-600' },
  ],
  subject_teacher: [
    { title: '教师研修', desc: '专业发展·教学提升', href: '/teacher/research-cloud', icon: BookOpen, color: 'text-primary' },
  ],
  skill_teacher: [
    { title: '教师研修', desc: '专业发展·教学提升', href: '/teacher/research-cloud', icon: BookOpen, color: 'text-primary' },
  ],
  parent: [
    { title: '家长课程', desc: '育儿知识·亲子沟通', href: '/parent/cloud-course', icon: Baby, color: 'text-amber-600' },
    { title: '子女学习', desc: '安排·查看进度', href: '/parent/cloud-course', icon: GraduationCap, color: 'text-emerald-600' },
  ],
  principal: [
    { title: '教师研修', desc: '专业发展·教学提升', href: '/teacher/research-cloud', icon: BookOpen, color: 'text-primary' },
    { title: '课程管理', desc: '管理·统计', href: '/cloud-course/admin', icon: Settings, color: 'text-muted-foreground' },
  ],
  academic_vice_principal: [
    { title: '教师研修', desc: '专业发展·教学提升', href: '/teacher/research-cloud', icon: BookOpen, color: 'text-primary' },
    { title: '课程管理', desc: '管理·统计', href: '/cloud-course/admin', icon: Settings, color: 'text-muted-foreground' },
  ],
};

export default function CloudCoursePage() {
  const { user } = useAuth();
  const role = user?.role as keyof typeof ROLE_ENTRIES;
  const entries = ROLE_ENTRIES[role] || ROLE_ENTRIES.parent;

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-primary/90 to-primary/70 text-primary-foreground px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-2">云教学</h1>
          <p className="text-primary-foreground/80">在线教学 · 慕课学习 · 共同成长</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {entries.map(entry => {
            const Icon = entry.icon;
            return (
              <Link key={entry.href + entry.title} href={entry.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className={`h-6 w-6 ${entry.color}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{entry.title}</h3>
                      <p className="text-sm text-muted-foreground">{entry.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
