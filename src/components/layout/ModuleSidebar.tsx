'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { AdministrativeRole } from '@/types';
import { ModuleType, GROUP_CONFIGS, type GroupType } from '@/types';
import { roleConfigs, administrativeRoleConfigs } from '@/config/roles';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  School,
} from 'lucide-react';
import { MODULE_METAS, type ModuleMeta } from './nav-config';
import { UserDropdownMenu } from './UserDropdownMenu';

// ─── Props ───────────────────────────────────────────────────────

interface ModuleSidebarProps {
  activeModule: ModuleType | null;
  onModuleChange: (module: ModuleType | null) => void;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

// ─── Component ───────────────────────────────────────────────────

export function ModuleSidebar({ activeModule, onModuleChange, collapsed, onCollapsedChange }: ModuleSidebarProps) {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const roleConfig = roleConfigs[user.role] || roleConfigs.subject_teacher;
  const additionalRoles = (user as unknown as Record<string, unknown>).additionalRoles as AdministrativeRole[] | undefined;
  const [userGroups, setUserGroups] = React.useState<{ groupType: GroupType }[]>([]);

  // 获取用户群组成员身份
  React.useEffect(() => {
    if (user?.id) {
      fetch(`/api/users/${user.id}/groups`)
        .then((res) => res.json())
        .then((data) => {
          if (data.groups) {
            setUserGroups(data.groups.map((g: { groupType: GroupType }) => ({ groupType: g.groupType })));
          }
        })
        .catch((err) => console.error('获取用户群组失败:', err));
    }
  }, [user?.id]);

  // 计算可访问的模块
  const accessibleModules = React.useMemo(() => {
    const modules = new Set<ModuleType>(roleConfig.modules);
    additionalRoles?.forEach((role) => {
      const adminConfig = administrativeRoleConfigs[role];
      if (adminConfig) {
        adminConfig.modules.forEach((m) => modules.add(m));
      }
    });
    userGroups.forEach((group) => {
      const groupConfig = GROUP_CONFIGS[group.groupType];
      if (groupConfig?.modulePermissions) {
        Object.keys(groupConfig.modulePermissions).forEach((m) => modules.add(m as ModuleType));
      }
    });
    return modules;
  }, [roleConfig.modules, additionalRoles, userGroups]);

  const isLeaderRole = !['subject_teacher', 'skill_teacher', 'head_teacher', 'parent'].includes(user.role);

  return (
    <TooltipProvider>
      <div
        className={cn(
          'flex flex-col border-r bg-gradient-to-b from-white to-orange-50/30 transition-all duration-300',
          collapsed ? 'w-16' : 'w-56',
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b px-3">
          {!collapsed ? (
            <Link href="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="龙岩师范附属小学" className="h-10 w-10 rounded-lg object-contain" />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-900">智慧校园</span>
                <span className="text-[10px] text-gray-500">龙岩师范附属小学</span>
              </div>
            </Link>
          ) : (
            <img src="/logo.png" alt="Logo" className="h-10 w-10 rounded-lg object-contain mx-auto" />
          )}
        </div>

        {/* 模块菜单 */}
        <nav className="flex-1 space-y-1 p-2">
          {/* 领导驾驶舱 */}
          {isLeaderRole && <DashboardLink pathname={pathname} collapsed={collapsed} userRole={user.role} />}

          {/* 分割线 */}
          {isLeaderRole && <div className="my-2 border-t border-gray-200" />}

          {/* 功能模块按钮 */}
          {MODULE_METAS.filter((m) => accessibleModules.has(m.key)).map((meta) => (
            <ModuleButton
              key={meta.key}
              meta={meta}
              active={activeModule === meta.key}
              collapsed={collapsed}
              onClick={() => onModuleChange(activeModule === meta.key ? null : meta.key)}
            />
          ))}
        </nav>

        {/* 底部区域 */}
        <div className="border-t">
          {/* 返回首页 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/"
                className={cn(
                  'flex w-full items-center gap-2 rounded-xl p-2 transition-all hover:bg-blue-50 hover:text-blue-600',
                  collapsed && 'justify-center',
                )}
              >
                <School className="h-4 w-4" />
                {!collapsed && <span className="text-xs">网站首页</span>}
              </Link>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">网站首页</TooltipContent>}
          </Tooltip>

          {/* 折叠按钮 */}
          <button
            onClick={() => onCollapsedChange(!collapsed)}
            className={cn(
              'flex w-full items-center gap-2 rounded-xl p-2 transition-all hover:bg-gray-100',
              collapsed && 'justify-center',
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
          <UserDropdownMenu collapsed={collapsed} />
        </div>
      </div>
    </TooltipProvider>
  );
}

// ─── ModuleButton ────────────────────────────────────────────────

interface ModuleButtonProps {
  meta: ModuleMeta;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
}

function ModuleButton({ meta, active, collapsed, onClick }: ModuleButtonProps) {
  const Icon = meta.icon;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={cn(
            'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
            active
              ? `${meta.activeBg} text-white shadow-lg ${meta.activeShadow}`
              : `text-gray-700 ${meta.hoverBg} ${meta.hoverText}`,
          )}
        >
          <Icon className="h-5 w-5" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">{meta.label}</span>
              <ChevronRight className={cn('h-4 w-4 transition-transform', active && 'rotate-90')} />
            </>
          )}
        </button>
      </TooltipTrigger>
      {collapsed && <TooltipContent side="right">{meta.label}</TooltipContent>}
    </Tooltip>
  );
}

// ─── DashboardLink (领导角色专用) ────────────────────────────────

interface DashboardLinkProps {
  pathname: string;
  collapsed: boolean;
  userRole: string;
}

function DashboardLink({ pathname, collapsed, userRole }: DashboardLinkProps) {
  const dashboardPath = getDashboardPath(userRole);
  const dashboardLabel = getDashboardLabel(userRole);
  const isActive = pathname === '/dashboard' || pathname.startsWith(dashboardPath);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={dashboardPath}
          className={cn(
            'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
            isActive
              ? 'bg-primary text-white shadow-lg shadow-primary/25'
              : 'text-gray-700 hover:bg-gray-100',
          )}
        >
          <LayoutDashboard className="h-5 w-5" />
          {!collapsed && <span>{dashboardLabel}</span>}
        </Link>
      </TooltipTrigger>
      {collapsed && <TooltipContent side="right">{dashboardLabel}</TooltipContent>}
    </Tooltip>
  );
}

function getDashboardPath(role: string): string {
  const map: Record<string, string> = {
    secretary: '/dashboard/secretary',
    principal: '/dashboard/principal',
    academic_vice_principal: '/dashboard/academic-vice-principal',
    moral_vice_principal: '/dashboard/moral-vice-principal',
    general_vice_principal: '/dashboard/general-vice-principal',
  };
  return map[role] || '/dashboard';
}

function getDashboardLabel(role: string): string {
  const map: Record<string, string> = {
    secretary: '书记工作台',
    principal: '校长工作台',
    academic_vice_principal: '教学副校长工作台',
    moral_vice_principal: '德育副校长工作台',
    general_vice_principal: '总务副校长工作台',
  };
  return map[role] || '工作台';
}
