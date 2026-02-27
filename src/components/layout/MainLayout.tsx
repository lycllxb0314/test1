'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  LayoutDashboard,
  Building2,
  GraduationCap,
  Heart,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
  Menu,
  Home,
  FileText,
  Wrench,
  ShoppingCart,
  DollarSign,
  Shield,
  Package,
  Calendar,
  BookOpen,
  ClipboardList,
  BarChart3,
  Award,
  Flag,
  Target,
  MessageSquare,
  CheckSquare,
  AlertTriangle,
  Sparkles,
  UserCircle,
  School,
  Workflow,
  Cpu,
  Lightbulb,
  DoorOpen,
  Edit,
  Newspaper,
  Trophy,
  CalendarClock,
  UserPlus,
  Video,
  Star,
} from 'lucide-react';
import { roleOptions } from '@/contexts/AuthContext';
import { moduleNames, roleConfigs } from '@/config/roles';
import { ModuleType } from '@/types';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  color?: string;
  badge?: string | number;
  children?: NavItem[];
  module?: ModuleType;
  description?: string;
}

// 总务后勤导航
const generalNav: NavItem[] = [
  { name: '总务概览', href: '/general', icon: LayoutDashboard, description: '总务工作看板' },
  { name: '资产管理', href: '/general/assets', icon: Package, description: '资产登记与管理' },
  { name: '设备管理', href: '/general/devices', icon: Cpu, description: '智慧设备控制' },
  { name: '报修管理', href: '/general/repairs', icon: Wrench, description: '设施报修与维修' },
  { name: '采购管理', href: '/general/purchase', icon: ShoppingCart, description: '物资采购申请' },
  { name: '财务管理', href: '/general/finance', icon: DollarSign, description: '费用报销管理' },
  { name: '安全管理', href: '/general/security', icon: Shield, description: '校园安全保障' },
  { name: '门禁管理', href: '/general/access', icon: DoorOpen, description: '智慧门禁系统' },
  { name: '访客管理', href: '/general/access/visitors', icon: UserPlus, description: '访客登记与审批' },
  { name: '环境管理', href: '/general/environment', icon: School, description: '校园环境维护' },
  { name: '人员管理', href: '/general/staff', icon: Users, description: '后勤人员管理' },
];

// 教务教研导航
const academicNav: NavItem[] = [
  { name: '教务概览', href: '/academic', icon: LayoutDashboard, description: '教务工作看板' },
  { name: '学生管理', href: '/academic/students', icon: Users, description: '学生信息管理' },
  { name: '教师管理', href: '/academic/teachers', icon: UserCircle, description: '教师信息管理' },
  { name: '班级管理', href: '/academic/classes', icon: School, description: '班级信息管理' },
  { name: '智能排课', href: '/academic/schedule', icon: Calendar, description: '课程表管理' },
  { name: '考试管理', href: '/academic/exams', icon: ClipboardList, description: '考试安排管理' },
  { name: '成绩管理', href: '/academic/grades', icon: BookOpen, description: '成绩录入查询' },
  { name: '教室管理', href: '/academic/rooms', icon: DoorOpen, description: '教室资源管理' },
  { name: '预约审批', href: '/academic/rooms/approval', icon: CheckSquare, description: '审批教室预约申请' },
  { name: '使用日程', href: '/academic/rooms/calendar', icon: CalendarClock, description: '教室使用日程' },
  { name: '集体备课', href: '/teaching/lesson-planning', icon: Users, description: '备课组协同', badge: '智慧' },
  { name: '听课评课', href: '/teaching/observation', icon: Video, description: '课堂听课评价', badge: '智慧' },
  { name: '教研活动', href: '/academic/research', icon: Target, description: '教学研究活动' },
  { name: '教师考勤', href: '/academic/attendance', icon: CheckSquare, description: '教师考勤管理' },
  { name: '质量分析', href: '/academic/analysis', icon: BarChart3, description: '教学质量分析' },
];

// 德育管理导航
const moralNav: NavItem[] = [
  { name: '德育概览', href: '/moral', icon: LayoutDashboard, description: '德育工作看板' },
  { name: '习惯养成评价', href: '/moral/habit', icon: Star, description: '八大行为习惯评价', badge: '特色' },
  { name: '小目标管理', href: '/moral/habit-goals', icon: Target, description: '学生月度小目标', badge: '特色' },
  { name: '少先队管理', href: '/moral/pioneer', icon: Flag, description: '少先队组织管理' },
  { name: '德育活动', href: '/moral/activities', icon: Calendar, description: '德育活动管理' },
  { name: '德育评价', href: '/moral/assessment', icon: Award, description: '学生德育评价' },
  { name: '预警管理', href: '/moral/alerts', icon: AlertTriangle, description: '预警任务管理' },
  { name: '成长档案', href: '/moral/growth', icon: Target, description: '学生成长档案' },
  { name: '数据分析', href: '/moral/analytics', icon: BarChart3, description: '德育数据分析' },
  { name: '工作计划', href: '/moral/plans', icon: FileText, description: '德育工作计划' },
];

// 教师空间导航 - 基础功能（所有教师可见）
const teacherBaseNav: NavItem[] = [
  { name: '工作台', href: '/teacher', icon: LayoutDashboard, description: '教师工作台' },
  { name: '我的课表', href: '/teacher/schedule', icon: Calendar, description: '查看我的课程安排' },
  { name: '通知公告', href: '/teacher/announcements', icon: Bell, description: '学校通知公告' },
  { name: '请假调课', href: '/teacher/leave', icon: FileText, description: '请假和调课申请' },
  { name: '教室预约', href: '/academic/rooms/booking', icon: DoorOpen, description: '预约使用教室' },
];

// 教师空间导航 - 班主任专属功能
const headTeacherNav: NavItem[] = [
  { name: '班级管理', href: '/teacher/class', icon: Users, description: '学生家长信息' },
  { name: '信息收集', href: '/teacher/collect', icon: ClipboardList, description: '企业微信信息采集' },
  { name: '日常管理', href: '/teacher/daily', icon: Calendar, description: '考勤晨检值日' },
  { name: '家校沟通', href: '/teacher/communication', icon: MessageSquare, description: '通知话术家长会', badge: 'AI' },
  { name: '成长德育', href: '/teacher/moral', icon: Heart, description: '奖惩行为心理' },
  { name: '学情作业', href: '/teacher/homework', icon: BookOpen, description: '作业错题学情' },
  { name: '行政材料', href: '/teacher/admin', icon: FileText, description: '计划总结评语', badge: 'AI' },
  { name: '安全应急', href: '/teacher/safety', icon: Shield, description: '安全台账隐患' },
];

// 教师空间导航 - 年段长专属功能
const gradeLeaderNav: NavItem[] = [
  { name: '年级管理', href: '/teacher/grade', icon: Users, description: '年级教师学生管理' },
  { name: '调课管理', href: '/teacher/adjust', icon: CalendarClock, description: '处理年级调课申请', badge: '专属' },
  { name: '年级课表', href: '/teacher/grade-schedule', icon: Calendar, description: '查看年级课表' },
];

// 工作流管理导航
const workflowNav: NavItem[] = [
  { name: '审批中心', href: '/workflow', icon: LayoutDashboard, description: '统一审批中心' },
  { name: '流程配置', href: '/workflow/config', icon: Settings, description: '配置审批流程' },
  { name: '请假审批', href: '/workflow/leave', icon: FileText, description: '请假申请审批' },
  { name: '报修审批', href: '/workflow/repair', icon: Wrench, description: '报修申请审批' },
  { name: '采购审批', href: '/workflow/purchase', icon: ShoppingCart, description: '采购申请审批' },
];

// 主页内容管理导航
const homepageNav: NavItem[] = [
  { name: '内容概览', href: '/homepage', icon: LayoutDashboard, description: '主页内容总览' },
  { name: '新闻管理', href: '/homepage/news', icon: Newspaper, description: '新闻发布管理' },
  { name: '荣誉管理', href: '/homepage/honors', icon: Trophy, description: '荣誉展示管理' },
  { name: '图片管理', href: '/homepage/images', icon: School, description: '图片资源管理' },
  { name: '区块设置', href: '/homepage/sections', icon: Edit, description: '内容区块设置' },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout, switchRole } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [activeModule, setActiveModule] = useState<ModuleType | 'workflow' | null>(null);

  // 根据当前路径确定活跃模块
  useEffect(() => {
    if (pathname.startsWith('/general')) {
      setActiveModule('general');
    } else if (pathname.startsWith('/academic') || pathname.startsWith('/teaching')) {
      setActiveModule('academic');
    } else if (pathname.startsWith('/moral')) {
      setActiveModule('moral');
    } else if (pathname.startsWith('/teacher')) {
      setActiveModule('teacher');
    } else if (pathname.startsWith('/workflow')) {
      setActiveModule('workflow');
    } else if (pathname.startsWith('/homepage')) {
      setActiveModule('homepage');
    } else {
      setActiveModule(null);
    }
  }, [pathname]);

  if (!user) return null;

  const roleConfig = roleConfigs[user.role];
  const isHeadTeacher = user.role === 'head_teacher';
  const isGradeLeader = user.role === 'grade_leader';

  // 获取当前模块的导航
  const getCurrentNav = (): NavItem[] => {
    switch (activeModule) {
      case 'general':
        return generalNav;
      case 'academic':
        return academicNav;
      case 'moral':
        return moralNav;
      case 'teacher':
        // 班主任有基础功能 + 班主任专属功能
        if (isHeadTeacher) {
          return [...teacherBaseNav, ...headTeacherNav];
        }
        // 年段长有基础功能 + 年段长专属功能
        if (isGradeLeader) {
          return [...teacherBaseNav, ...gradeLeaderNav];
        }
        // 普通教师只有基础功能
        return teacherBaseNav;
      case 'workflow':
        return workflowNav;
      case 'homepage':
        return homepageNav;
      default:
        return [];
    }
  };

  return (
    <TooltipProvider>
      <div className="flex h-screen">
        {/* 一级导航 - 模块选择 */}
        <div
          className={cn(
            'flex flex-col border-r bg-gradient-to-b from-white to-orange-50/30 transition-all duration-300',
            collapsed ? 'w-16' : 'w-56'
          )}
        >
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b px-3">
            {!collapsed && (
              <Link href="/" className="flex items-center gap-2">
                <img src="/logo.png" alt="龙岩师范附属小学" className="h-10 w-10 rounded-lg object-contain" />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-900">智慧校园</span>
                  <span className="text-[10px] text-gray-500">龙岩师范附属小学</span>
                </div>
              </Link>
            )}
            {collapsed && (
              <img src="/logo.png" alt="Logo" className="h-10 w-10 rounded-lg object-contain mx-auto" />
            )}
          </div>

          {/* 模块菜单 */}
          <nav className="flex-1 space-y-1 p-2">
            {/* 领导驾驶舱 / 工作台 - 根据角色跳转不同页面 */}
            {user.role !== 'teacher' && user.role !== 'head_teacher' && user.role !== 'grade_leader' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={
                      user.role === 'secretary' ? '/dashboard/secretary' :
                      user.role === 'principal' ? '/dashboard/principal' :
                      user.role === 'vice_principal' ? '/dashboard/vice-principal' :
                      '/dashboard'
                    }
                    className={cn(
                      'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                      (pathname === '/dashboard' || pathname.startsWith('/dashboard/secretary') || pathname.startsWith('/dashboard/principal') || pathname.startsWith('/dashboard/vice-principal'))
                        ? 'bg-primary text-white shadow-lg shadow-primary/25'
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    <LayoutDashboard className="h-5 w-5" />
                    {!collapsed && (
                      <span>
                        {user.role === 'secretary' ? '书记工作台' :
                         user.role === 'principal' ? '校长工作台' :
                         user.role === 'vice_principal' ? '副校长工作台' : '工作台'}
                      </span>
                    )}
                  </Link>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right">
                    {user.role === 'secretary' ? '书记工作台' :
                     user.role === 'principal' ? '校长工作台' :
                     user.role === 'vice_principal' ? '副校长工作台' : '工作台'}
                  </TooltipContent>
                )}
              </Tooltip>
            )}

            {/* 分割线 - 教师角色不需要分割线 */}
            {user.role !== 'teacher' && user.role !== 'head_teacher' && user.role !== 'grade_leader' && (
              <div className="my-2 border-t border-gray-200" />
            )}

            {/* 总务后勤 */}
            {roleConfig.modules.includes('general') && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setActiveModule(activeModule === 'general' ? null : 'general')}
                    className={cn(
                      'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                      activeModule === 'general'
                        ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25'
                        : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600'
                    )}
                  >
                    <Building2 className="h-5 w-5" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">总务后勤</span>
                        <ChevronRight className={cn(
                          'h-4 w-4 transition-transform',
                          activeModule === 'general' && 'rotate-90'
                        )} />
                      </>
                    )}
                  </button>
                </TooltipTrigger>
                {collapsed && <TooltipContent side="right">总务后勤</TooltipContent>}
              </Tooltip>
            )}

            {/* 教务教研 */}
            {roleConfig.modules.includes('academic') && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setActiveModule(activeModule === 'academic' ? null : 'academic')}
                    className={cn(
                      'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                      activeModule === 'academic'
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                        : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                    )}
                  >
                    <GraduationCap className="h-5 w-5" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">教务教研</span>
                        <ChevronRight className={cn(
                          'h-4 w-4 transition-transform',
                          activeModule === 'academic' && 'rotate-90'
                        )} />
                      </>
                    )}
                  </button>
                </TooltipTrigger>
                {collapsed && <TooltipContent side="right">教务教研</TooltipContent>}
              </Tooltip>
            )}

            {/* 德育管理 */}
            {roleConfig.modules.includes('moral') && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setActiveModule(activeModule === 'moral' ? null : 'moral')}
                    className={cn(
                      'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                      activeModule === 'moral'
                        ? 'bg-green-500 text-white shadow-lg shadow-green-500/25'
                        : 'text-gray-700 hover:bg-green-50 hover:text-green-600'
                    )}
                  >
                    <Heart className="h-5 w-5" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">德育管理</span>
                        <ChevronRight className={cn(
                          'h-4 w-4 transition-transform',
                          activeModule === 'moral' && 'rotate-90'
                        )} />
                      </>
                    )}
                  </button>
                </TooltipTrigger>
                {collapsed && <TooltipContent side="right">德育管理</TooltipContent>}
              </Tooltip>
            )}

            {/* 教师空间（所有教师可访问） */}
            {roleConfig.modules.includes('teacher') && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setActiveModule(activeModule === 'teacher' ? null : 'teacher')}
                    className={cn(
                      'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                      activeModule === 'teacher'
                        ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25'
                        : 'text-gray-700 hover:bg-purple-50 hover:text-purple-600'
                    )}
                  >
                    <Users className="h-5 w-5" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">教师空间</span>
                        <ChevronRight className={cn(
                          'h-4 w-4 transition-transform',
                          activeModule === 'teacher' && 'rotate-90'
                        )} />
                      </>
                    )}
                  </button>
                </TooltipTrigger>
                {collapsed && <TooltipContent side="right">教师空间</TooltipContent>}
              </Tooltip>
            )}

            {/* 审批中心 */}
            {(user.role === 'principal' || user.role === 'secretary' || user.role === 'vice_principal' || user.role === 'academic_director' || user.role === 'moral_director' || user.role === 'general_director') && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setActiveModule(activeModule === 'workflow' ? null : 'workflow')}
                    className={cn(
                      'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                      activeModule === 'workflow'
                        ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/25'
                        : 'text-gray-700 hover:bg-amber-50 hover:text-amber-600'
                    )}
                  >
                    <Workflow className="h-5 w-5" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">审批中心</span>
                        <ChevronRight className={cn(
                          'h-4 w-4 transition-transform',
                          activeModule === 'workflow' && 'rotate-90'
                        )} />
                      </>
                    )}
                  </button>
                </TooltipTrigger>
                {collapsed && <TooltipContent side="right">审批中心</TooltipContent>}
              </Tooltip>
            )}

            {/* 主页内容管理 */}
            {roleConfig.modules.includes('homepage') && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setActiveModule(activeModule === 'homepage' ? null : 'homepage')}
                    className={cn(
                      'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                      activeModule === 'homepage'
                        ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/25'
                        : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600'
                    )}
                  >
                    <Edit className="h-5 w-5" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">主页管理</span>
                        <ChevronRight className={cn(
                          'h-4 w-4 transition-transform',
                          activeModule === 'homepage' && 'rotate-90'
                        )} />
                      </>
                    )}
                  </button>
                </TooltipTrigger>
                {collapsed && <TooltipContent side="right">主页管理</TooltipContent>}
              </Tooltip>
            )}
          </nav>

          {/* 底部：折叠按钮 + 用户信息 */}
          <div className="border-t">
            {/* 折叠按钮 */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className={cn(
                'flex w-full items-center gap-2 rounded-xl p-2 transition-all hover:bg-gray-100',
                collapsed && 'justify-center'
              )}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              ) : (
                <>
                  <ChevronLeft className="h-4 w-4 text-gray-500" />
                  <span className="text-xs text-gray-500">收起菜单</span>
                </>
              )}
            </button>
            
            {/* 用户信息 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    'flex w-full items-center gap-2 rounded-xl p-2 transition-all hover:bg-gray-100',
                    collapsed && 'justify-center'
                  )}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="bg-primary text-white text-sm">
                      {user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {!collapsed && (
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{roleConfig.name}</p>
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{user.name}</span>
                    <span className="text-xs font-normal text-gray-500">{user.department || ''}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-gray-500">切换角色（演示）</DropdownMenuLabel>
                {roleOptions.map((role) => (
                  <DropdownMenuItem
                    key={role.value}
                    onClick={() => switchRole(role.value as any)}
                    className={user.role === role.value ? 'bg-primary/10' : ''}
                  >
                    <span className="font-medium">{role.label}</span>
                    <span className="ml-2 text-xs text-gray-500">{role.description}</span>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* 二级导航 - 功能菜单 */}
        {activeModule && !collapsed && (
          <div className="w-56 border-r bg-white flex flex-col">
            <div className="h-16 flex items-center justify-between px-4 border-b">
              <span className="font-semibold text-gray-900">
                {activeModule === 'general' && '总务后勤'}
                {activeModule === 'academic' && '教务教研'}
                {activeModule === 'moral' && '德育管理'}
                {activeModule === 'teacher' && '教师空间'}
                {activeModule === 'workflow' && '审批中心'}
                {activeModule === 'homepage' && '主页管理'}
              </span>
              <button
                onClick={() => setActiveModule(null)}
                className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <nav className="flex-1 space-y-0.5 p-2 overflow-y-auto">
              {getCurrentNav().map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all',
                      isActive
                        ? 'bg-primary text-white font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="flex-1">{item.name}</span>
                    {item.badge && (
                      <span className={cn(
                        'px-1.5 py-0.5 text-[10px] font-bold rounded',
                        isActive ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                      )}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

// 页面布局包装器
export function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();

  // 登录页和门户首页不需要侧边栏
  const isPublicPage = pathname === '/login' || pathname === '/';

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
    </div>
  );
}
