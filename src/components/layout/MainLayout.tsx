'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { AdministrativeRole } from '@/types';
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
  Sliders,
  CalendarDays,
  ClipboardCheck,
  Activity,
  Edit3,
  Key,
} from 'lucide-react';
import { roleOptions } from '@/contexts/AuthContext';
import { moduleNames, roleConfigs, administrativeRoleConfigs } from '@/config/roles';
import { ModuleType, GROUP_CONFIGS, type GroupType } from '@/types';
import { ChangePasswordDialog } from '@/components/ChangePasswordDialog';

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
  { name: '家长管理', href: '/academic/parents', icon: Heart, description: '学生家长信息管理' },
  { name: '新生注册', href: '/academic/enrollment', icon: UserPlus, description: '新生信息采集与注册', badge: '9月' },
  { name: '教师管理', href: '/academic/teachers', icon: UserCircle, description: '教师信息管理' },
  { name: '班级管理', href: '/academic/classes', icon: School, description: '班级信息管理' },
  { name: '手动排课', href: '/academic/manual-schedule', icon: Edit3, description: '编排班级课表', 
    children: [
      { name: '全校课表', href: '/academic/school-schedule', icon: Calendar, description: '全校课表总览', badge: '总览' },
      { name: '一年级', href: '/academic/manual-schedule/1', icon: Edit3, description: '一年级排课' },
      { name: '二年级', href: '/academic/manual-schedule/2', icon: Edit3, description: '二年级排课' },
      { name: '三年级', href: '/academic/manual-schedule/3', icon: Edit3, description: '三年级排课' },
      { name: '四年级', href: '/academic/manual-schedule/4', icon: Edit3, description: '四年级排课' },
      { name: '五年级', href: '/academic/manual-schedule/5', icon: Edit3, description: '五年级排课' },
      { name: '六年级', href: '/academic/manual-schedule/6', icon: Edit3, description: '六年级排课' },
    ]
  },
  { name: '工作量统计', href: '/academic/workload', icon: BarChart3, description: '教师工作量统计', badge: '新' },
  { name: '考试管理', href: '/academic/exams', icon: ClipboardList, description: '考试安排管理' },
  { name: '教室管理', href: '/academic/rooms', icon: DoorOpen, description: '教室资源与预约' },
  { name: '教研活动', href: '/academic/research', icon: Target, description: '集体备课与听课评课', badge: '智慧' },
  { name: '教师考勤', href: '/academic/attendance', icon: CheckSquare, description: '教师考勤管理' },
  { name: '质量分析', href: '/academic/analysis', icon: BarChart3, description: '教学质量分析' },
];

// 德育管理导航
const moralNav: NavItem[] = [
  { name: '德育工作台', href: '/moral', icon: LayoutDashboard, description: '德育处工作台' },
  { name: '习惯养成', href: '/moral/habit', icon: Target, description: '八大习惯目标管理', badge: '新' },
  { name: '德育活动', href: '/moral/activities', icon: Calendar, description: '发布管理德育活动', badge: '新' },
  { name: '学生荣誉', href: '/moral/honors', icon: Award, description: '学生荣誉管理与可视化', badge: '新' },
  { name: '班级常规', href: '/moral/routine', icon: ClipboardCheck, description: '班级常规评比与值日管理', badge: '新' },
];

// 教师空间导航 - 基础功能（所有教师可见，待重建）
const teacherBaseNav: NavItem[] = [
  { name: '工作台', href: '/teacher', icon: LayoutDashboard, description: '教师工作台' },
  { name: '个人档案', href: '/teacher/profile', icon: UserCircle, description: '个人信息维护' },
  { name: '我的课表', href: '/teacher/schedule', icon: Calendar, description: '查看我的课程安排' },
  { name: '请假调课', href: '/teacher/leave', icon: FileText, description: '请假和调课申请' },
  { name: '报销申请', href: '/teacher/expense', icon: DollarSign, description: '费用报销申请' },
  { name: '教室预约', href: '/teacher/room-booking', icon: DoorOpen, description: '预约使用教室' },
];

// 教师空间导航 - 班主任专属功能
const headTeacherNav: NavItem[] = [
  { name: '班级管理', href: '/teacher/class', icon: Users, description: '学生家长信息' },
  { name: '信息收集', href: '/teacher/collection', icon: ClipboardList, description: '创建表单收集信息', badge: '新' },
  { name: '习惯养成', href: '/teacher/habit', icon: Target, description: '制定班级月度习惯目标', badge: '新' },
  { name: '荣誉管理', href: '/teacher/honors', icon: Trophy, description: '管理本班学生荣誉', badge: '新' },
  { name: '德育活动', href: '/teacher/activities', icon: Calendar, description: '参与德育活动提交材料', badge: '新' },
];

// 教师空间导航 - 科任教师（副班主任）功能（待重建）
const subTeacherNav: NavItem[] = [
  { name: '班级管理', href: '/teacher/class', icon: Users, description: '学生家长信息' },
  { name: '荣誉管理', href: '/teacher/honors', icon: Trophy, description: '管理本班学生荣誉', badge: '新' },
];

// 教师空间导航 - 年段长专属功能（待重建）
const gradeLeaderNav: NavItem[] = [
  { name: '年级管理', href: '/teacher/grade', icon: Users, description: '年级教师学生管理' },
  { name: '调课管理', href: '/teacher/adjust', icon: CalendarClock, description: '处理年级调课申请', badge: '专属' },
  { name: '年级课表', href: '/teacher/grade-schedule', icon: Calendar, description: '查看年级课表' },
  { name: '德育活动', href: '/teacher/activities', icon: Calendar, description: '参与德育活动提交材料', badge: '新' },
];

// 家长端导航
const parentNav: NavItem[] = [
  { name: '家长工作台', href: '/parent', icon: LayoutDashboard, description: '家长端工作台' },
  { name: '信息收集', href: '/parent/collection', icon: ClipboardList, description: '填写信息收集表', badge: '新' },
  { name: '习惯打卡', href: '/parent/habit', icon: Target, description: '子女习惯养成打卡', badge: '新' },
  { name: '个人资料', href: '/parent/profile', icon: UserCircle, description: '维护个人信息' },
  { name: '子女信息', href: '/parent/children', icon: Users, description: '子女信息管理' },
  { name: '成绩查看', href: '/parent/grades', icon: BookOpen, description: '查看子女成绩' },
  { name: '通知公告', href: '/parent/announcements', icon: Bell, description: '学校通知公告' },
  { name: '新生注册', href: '/parent/enrollment', icon: UserPlus, description: '新生入学注册', badge: '9月' },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, switchRole } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [activeModule, setActiveModule] = useState<ModuleType | null>(null);
  const [expandedItems, setExpandedItems] = useState<string[]>([]); // 展开的三级菜单项
  const [userGroups, setUserGroups] = useState<{ groupType: GroupType }[]>([]); // 用户群组成员身份
  const [isDutyTeacher, setIsDutyTeacher] = useState(false); // 是否为值日老师

  // 处理退出登录
  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  // 获取用户群组成员身份
  useEffect(() => {
    if (user?.id) {
      fetch(`/api/users/${user.id}/groups`)
        .then(res => res.json())
        .then(data => {
          if (data.groups) {
            setUserGroups(data.groups.map((g: { groupType: GroupType }) => ({ groupType: g.groupType })));
          }
        })
        .catch(err => console.error('获取用户群组失败:', err));
    }
  }, [user?.id]);

  // 检查是否为值日老师
  useEffect(() => {
    if (user?.id && (user.role === 'head_teacher' || user.role === 'subject_teacher')) {
      fetch(`/api/duty-teachers?teacherId=${user.id}&active=true`)
        .then(res => res.json())
        .then(data => {
          setIsDutyTeacher(data.success && data.data?.length > 0);
        })
        .catch(err => {
          console.error('检查值日状态失败:', err);
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
    } else if (pathname.startsWith('/teacher')) {
      setActiveModule('teacher');
    } else if (pathname.startsWith('/parent')) {
      setActiveModule('parent');
    } else {
      setActiveModule(null);
    }
  }, [pathname]);

  if (!user) return null;

  const roleConfig = roleConfigs[user.role] || roleConfigs.subject_teacher; // 默认使用科任教师配置
  const additionalRoles = (user as any).additionalRoles as AdministrativeRole[] | undefined;
  
  const isHeadTeacher = user.role === 'head_teacher';
  const isSubTeacher = user.role === 'subject_teacher'; // 科任教师（副班主任）
  const isGradeLeader = additionalRoles?.includes('grade_leader');
  
  // 计算用户可访问的模块（合并主要角色 + 兼任职务 + 群组成员身份）
  const accessibleModules = useMemo(() => {
    const modules = new Set<ModuleType>(roleConfig.modules);
    
    // 添加兼任职务的模块权限
    additionalRoles?.forEach(role => {
      const adminConfig = administrativeRoleConfigs[role];
      if (adminConfig) {
        adminConfig.modules.forEach(m => modules.add(m));
      }
    });
    
    // 添加群组成员身份的模块权限
    userGroups.forEach(group => {
      const groupConfig = GROUP_CONFIGS[group.groupType];
      if (groupConfig?.modulePermissions) {
        Object.keys(groupConfig.modulePermissions).forEach(m => modules.add(m as ModuleType));
      }
    });
    
    return modules;
  }, [roleConfig.modules, additionalRoles, userGroups]);

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
        // 值日工作导航项
        const dutyNavItem: NavItem = { 
          name: '值日工作', 
          href: '/teacher/duty', 
          icon: ClipboardCheck, 
          description: '班级常规评分',
          badge: '值日'
        };
        
        // 班主任有基础功能 + 班主任专属功能
        if (isHeadTeacher) {
          const nav = [...teacherBaseNav, ...headTeacherNav];
          if (isDutyTeacher) nav.push(dutyNavItem);
          return nav;
        }
        // 科任教师（副班主任）有基础功能 + 科任教师功能
        if (isSubTeacher) {
          const nav = [...teacherBaseNav, ...subTeacherNav];
          if (isDutyTeacher) nav.push(dutyNavItem);
          return nav;
        }
        // 年段长有基础功能 + 年段长专属功能
        if (isGradeLeader) {
          const nav = [...teacherBaseNav, ...gradeLeaderNav];
          if (isDutyTeacher) nav.push(dutyNavItem);
          return nav;
        }
        // 普通教师只有基础功能，但如果是值日老师则显示值日工作
        if (isDutyTeacher) {
          return [...teacherBaseNav, dutyNavItem];
        }
        return teacherBaseNav;
      case 'parent':
        return parentNav;
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
            {user.role !== 'subject_teacher' && user.role !== 'skill_teacher' && user.role !== 'head_teacher' && user.role !== 'parent' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={
                      user.role === 'secretary' ? '/dashboard/secretary' :
                      user.role === 'principal' ? '/dashboard/principal' :
                      user.role === 'academic_vice_principal' ? '/dashboard/academic-vice-principal' :
                      user.role === 'moral_vice_principal' ? '/dashboard/moral-vice-principal' :
                      user.role === 'general_vice_principal' ? '/dashboard/general-vice-principal' :
                      '/dashboard'
                    }
                    className={cn(
                      'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                      (pathname === '/dashboard' || pathname.startsWith('/dashboard/secretary') || pathname.startsWith('/dashboard/principal') || pathname.startsWith('/dashboard/academic-vice-principal') || pathname.startsWith('/dashboard/moral-vice-principal') || pathname.startsWith('/dashboard/general-vice-principal'))
                        ? 'bg-primary text-white shadow-lg shadow-primary/25'
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    <LayoutDashboard className="h-5 w-5" />
                    {!collapsed && (
                      <span>
                        {user.role === 'secretary' ? '书记工作台' :
                         user.role === 'principal' ? '校长工作台' :
                         user.role === 'academic_vice_principal' ? '教学副校长工作台' :
                         user.role === 'moral_vice_principal' ? '德育副校长工作台' :
                         user.role === 'general_vice_principal' ? '总务副校长工作台' : '工作台'}
                      </span>
                    )}
                  </Link>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right">
                    {user.role === 'secretary' ? '书记工作台' :
                     user.role === 'principal' ? '校长工作台' :
                     user.role === 'academic_vice_principal' ? '教学副校长工作台' :
                     user.role === 'moral_vice_principal' ? '德育副校长工作台' :
                     user.role === 'general_vice_principal' ? '总务副校长工作台' : '工作台'}
                  </TooltipContent>
                )}
              </Tooltip>
            )}

            {/* 分割线 - 教师和家长角色不需要分割线 */}
            {user.role !== 'subject_teacher' && user.role !== 'skill_teacher' && user.role !== 'head_teacher' && user.role !== 'parent' && (
              <div className="my-2 border-t border-gray-200" />
            )}

            {/* 总务后勤 */}
            {accessibleModules.has('general') && (
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
            {accessibleModules.has('academic') && (
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
            {accessibleModules.has('moral') && (
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
            {accessibleModules.has('teacher') && (
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

            {/* 家长端 */}
            {accessibleModules.has('parent') && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setActiveModule(activeModule === 'parent' ? null : 'parent')}
                    className={cn(
                      'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                      activeModule === 'parent'
                        ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/25'
                        : 'text-gray-700 hover:bg-cyan-50 hover:text-cyan-600'
                    )}
                  >
                    <Heart className="h-5 w-5" />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">家长端</span>
                        <ChevronRight className={cn(
                          'h-4 w-4 transition-transform',
                          activeModule === 'parent' && 'rotate-90'
                        )} />
                      </>
                    )}
                  </button>
                </TooltipTrigger>
                {collapsed && <TooltipContent side="right">家长端</TooltipContent>}
              </Tooltip>
            )}
          </nav>

          {/* 底部：折叠按钮 + 用户信息 */}
          <div className="border-t">
            {/* 返回网站首页 */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/"
                  className={cn(
                    'flex w-full items-center gap-2 rounded-xl p-2 transition-all hover:bg-blue-50 hover:text-blue-600',
                    collapsed && 'justify-center'
                  )}
                >
                  <School className="h-4 w-4" />
                  {!collapsed && (
                    <span className="text-xs">网站首页</span>
                  )}
                </Link>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right">
                  网站首页
                </TooltipContent>
              )}
            </Tooltip>
            
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
                      {user.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  {!collapsed && (
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-gray-900">{user.name || '用户'}</p>
                      <p className="text-xs text-gray-500">{roleConfig?.name || '未知角色'}</p>
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{user.name || '用户'}</span>
                    <span className="text-xs font-normal text-gray-500">{user.department || ''}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/" className="cursor-pointer">
                    <School className="mr-2 h-4 w-4" />
                    网站首页
                  </Link>
                </DropdownMenuItem>
                {/* 家长修改密码 */}
                {user.role === 'parent' && (
                  <ChangePasswordDialog 
                    trigger={
                      <div className="flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent focus:bg-accent">
                        <Key className="mr-2 h-4 w-4" />
                        修改密码
                      </div>
                    }
                  />
                )}
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
                <DropdownMenuItem onClick={handleLogout}>
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
                {activeModule === 'parent' && '家长端'}
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
                const isActive = pathname === item.href || (item.children && pathname.startsWith(item.href));
                const isExpanded = expandedItems.includes(item.href) || (item.children && pathname.startsWith(item.href));
                const Icon = item.icon;
                const hasChildren = item.children && item.children.length > 0;
                
                return (
                  <div key={item.href}>
                    {hasChildren ? (
                      <button
                        onClick={() => {
                          setExpandedItems(prev => 
                            prev.includes(item.href) 
                              ? prev.filter(h => h !== item.href)
                              : [...prev, item.href]
                          );
                        }}
                        className={cn(
                          'group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all',
                          isActive
                            ? 'bg-primary text-white font-medium'
                            : 'text-gray-700 hover:bg-gray-100'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="flex-1 text-left">{item.name}</span>
                        {item.badge && (
                          <span className={cn(
                            'px-1.5 py-0.5 text-[10px] font-bold rounded',
                            isActive ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                          )}>
                            {item.badge}
                          </span>
                        )}
                        <ChevronRight className={cn(
                          'h-4 w-4 transition-transform',
                          isExpanded && 'rotate-90'
                        )} />
                      </button>
                    ) : (
                      <Link
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
                    )}
                    
                    {/* 三级菜单 */}
                    {hasChildren && isExpanded && (
                      <div className="ml-4 mt-0.5 space-y-0.5 border-l-2 border-gray-200 pl-2">
                        {item.children!.map((child) => {
                          const childIsActive = pathname === child.href || (child.children && pathname.startsWith(child.href));
                          const ChildIcon = child.icon;
                          const childHasChildren = child.children && child.children.length > 0;
                          const childIsExpanded = expandedItems.includes(child.href) || (child.children && pathname.startsWith(child.href));
                          
                          return (
                            <div key={child.href}>
                              {childHasChildren ? (
                                <>
                                  <button
                                    onClick={() => {
                                      setExpandedItems(prev => 
                                        prev.includes(child.href) 
                                          ? prev.filter(h => h !== child.href)
                                          : [...prev, child.href]
                                      );
                                    }}
                                    className={cn(
                                      'group flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-all w-full',
                                      childIsActive
                                        ? 'bg-primary/10 text-primary font-medium'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    )}
                                  >
                                    <ChildIcon className="h-3.5 w-3.5" />
                                    <span className="flex-1 text-left">{child.name}</span>
                                    {child.badge && (
                                      <span className={cn(
                                        'px-1 py-0.5 text-[10px] font-bold rounded',
                                        childIsActive ? 'bg-primary/20 text-primary' : 'bg-amber-100 text-amber-700'
                                      )}>
                                        {child.badge}
                                      </span>
                                    )}
                                    <ChevronRight className={cn(
                                      'h-3 w-3 transition-transform',
                                      childIsExpanded && 'rotate-90'
                                    )} />
                                  </button>
                                  
                                  {/* 四级菜单 */}
                                  {childIsExpanded && (
                                    <div className="ml-4 mt-0.5 space-y-0.5 border-l border-gray-100 pl-2">
                                      {child.children!.map((grandChild) => {
                                        const grandChildIsActive = pathname === grandChild.href;
                                        const GrandChildIcon = grandChild.icon;
                                        return (
                                          <Link
                                            key={grandChild.href}
                                            href={grandChild.href}
                                            className={cn(
                                              'group flex items-center gap-2 rounded-lg px-3 py-1 text-xs transition-all',
                                              grandChildIsActive
                                                ? 'bg-primary/5 text-primary font-medium'
                                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                                            )}
                                          >
                                            <GrandChildIcon className="h-3 w-3" />
                                            <span>{grandChild.name}</span>
                                            {grandChild.badge && (
                                              <span className="px-1 py-0.5 text-[9px] font-bold rounded bg-amber-50 text-amber-600">
                                                {grandChild.badge}
                                              </span>
                                            )}
                                          </Link>
                                        );
                                      })}
                                    </div>
                                  )}
                                </>
                              ) : (
                                <Link
                                  href={child.href}
                                  className={cn(
                                    'group flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-all',
                                    childIsActive
                                      ? 'bg-primary/10 text-primary font-medium'
                                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                  )}
                                >
                                  <ChildIcon className="h-3.5 w-3.5" />
                                  <span>{child.name}</span>
                                  {child.badge && (
                                    <span className={cn(
                                      'px-1 py-0.5 text-[10px] font-bold rounded',
                                      childIsActive ? 'bg-primary/20 text-primary' : 'bg-amber-100 text-amber-700'
                                    )}>
                                      {child.badge}
                                    </span>
                                  )}
                                </Link>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
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

  // 公开页面不需要侧边栏布局：首页、登录页、办学理念、现任领导、新闻中心、校园公告、成果特色办学（含详情页）
  const isPublicPage = pathname === '/' 
    || pathname === '/login' 
    || pathname === '/philosophy' 
    || pathname === '/leadership' 
    || pathname.startsWith('/news') 
    || pathname.startsWith('/notices')
    || pathname.startsWith('/achievements');

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
