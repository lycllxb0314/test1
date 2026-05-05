'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

import { roleConfigs } from '@/config/roles';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, Key } from 'lucide-react';
import { ChangePasswordDialog } from '@/components/ChangePasswordDialog';

// ─── Props ───────────────────────────────────────────────────────

interface UserDropdownMenuProps {
  collapsed: boolean;
}

// ─── Component ───────────────────────────────────────────────────

export function UserDropdownMenu({ collapsed }: UserDropdownMenuProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) return null;

  const roleConfig = roleConfigs[user.role] || roleConfigs.subject_teacher;

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'flex w-full items-center gap-2 rounded-xl p-2 transition-all hover:bg-gray-100',
            collapsed && 'justify-center',
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
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          退出登录
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
