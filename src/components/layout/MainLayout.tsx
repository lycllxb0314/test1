'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { AdministrativeRole } from '@/types';
import { ModuleType } from '@/types';
import { roleConfigs } from '@/config/roles';
import { ClipboardCheck } from 'lucide-react';
import Watermark from '@/components/Watermark';
import { ModuleSidebar } from './ModuleSidebar';
import { SecondaryNav } from './SecondaryNav';
import {
  type NavItem,
  generalNav,
  academicNav,
  moralNav,
  healthNav,
  teacherBaseNav,
  headTeacherNav,
  subTeacherNav,
  gradeLeaderNav,
  parentNav,
} from './nav-config';

// ─── 模块标题映射 ────────────────────────────────────────────────

const MODULE_TITLES: Record<string, string> = {
  general: '总务后勤',
  academic: '教务教研',
  moral: '德育管理',
  teacher: '教师空间',
  parent: '家长端',
  health: '体育健康',
};

// ─── AppSidebar (薄编排层) ───────────────────────────────────────

export function AppSidebar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [activeModule, setActiveModule] = useState<ModuleType | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isDutyTeacher, setIsDutyTeacher] = useState(false);

  // 检查是否为值日老师
  useEffect(() => {
    if (user?.id && (user.role === 'head_teacher' || user.role === 'subject_teacher')) {
      fetch(`/api/duty-teachers?teacherId=${user.id}&active=true`)
        .then((res) => res.json())
        .then((data) => {
          setIsDutyTeacher(data.success && data.data?.length > 0);
        })
        .catch(() => {
          setIsDutyTeacher(false);
        });
    } else {
      setIsDutyTeacher(false);
    }
  }, [user?.id, user?.role]);

  // 根据当前路径确定活跃模块
  useEffect(() => {
    if (pathname.startsWith('/general')) {
      setActiveModule('general');
    } else if (pathname.startsWith('/academic') || pathname.startsWith('/teaching')) {
      setActiveModule('academic');
    } else if (pathname.startsWith('/moral')) {
      setActiveModule('moral');
    } else if (pathname.startsWith('/health')) {
      setActiveModule('health');
    } else if (pathname.startsWith('/teacher')) {
      setActiveModule('teacher');
    } else if (pathname.startsWith('/parent')) {
      setActiveModule('parent');
    } else {
      setActiveModule(null);
    }
  }, [pathname]);

  if (!user) return null;

  const additionalRoles = (user as unknown as Record<string, unknown>).additionalRoles as AdministrativeRole[] | undefined;
  const isHeadTeacher = user.role === 'head_teacher';
  const isSubTeacher = user.role === 'subject_teacher';
  const isGradeLeader = additionalRoles?.includes('grade_leader');

  // 获取当前模块导航
  const currentNav = useMemo((): NavItem[] => {
    if (!activeModule) return [];

    if (activeModule === 'general') return generalNav;
    if (activeModule === 'academic') return academicNav;
    if (activeModule === 'moral') return moralNav;
    if (activeModule === 'health') return healthNav;
    if (activeModule === 'parent') return parentNav;

    if (activeModule === 'teacher') {
      const dutyNavItem: NavItem = {
        name: '值日工作',
        href: '/teacher/duty',
        icon: ClipboardCheck,
        description: '班级常规评分',
      };

      let nav: NavItem[];
      if (isHeadTeacher) {
        nav = [...teacherBaseNav, ...headTeacherNav];
      } else if (isSubTeacher) {
        nav = [...teacherBaseNav, ...subTeacherNav];
      } else if (isGradeLeader) {
        nav = [...teacherBaseNav, ...gradeLeaderNav];
      } else {
        nav = [...teacherBaseNav];
      }

      if (isDutyTeacher) nav.push(dutyNavItem);
      return nav;
    }

    return [];
  }, [activeModule, isHeadTeacher, isSubTeacher, isGradeLeader, isDutyTeacher]);

  // 获取二级导航折叠状态
  const showSecondaryNav = activeModule !== null && !sidebarCollapsed;

  return (
    <div className="flex h-screen">
      <ModuleSidebar
        activeModule={activeModule}
        onModuleChange={setActiveModule}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />
      {showSecondaryNav && (
        <SecondaryNav
          navItems={currentNav}
          title={MODULE_TITLES[activeModule!] || ''}
          onClose={() => setActiveModule(null)}
        />
      )}
    </div>
  );
}

// ─── MainLayout (页面布局包装器) ──────────────────────────────────

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();

  // 公开页面不需要侧边栏布局
  const isPublicPage =
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/philosophy' ||
    pathname === '/leadership' ||
    pathname.startsWith('/news') ||
    pathname.startsWith('/notices') ||
    pathname.startsWith('/achievements') ||
    pathname.startsWith('/teacher-excellence') ||
    pathname.startsWith('/student-showcase') ||
    pathname.startsWith('/visitor-apply');

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  // 未登录时跳转到登录页
  if (!user && !isPublicPage) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return null;
  }

  // 公共页面不显示侧边栏
  if (isPublicPage || !user) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
      <Watermark />
    </div>
  );
}
