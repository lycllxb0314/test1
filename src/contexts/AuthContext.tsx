'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types';
import { mockUsers } from '@/data/mock';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化时检查本地存储的登录状态
  useEffect(() => {
    const savedUser = localStorage.getItem('smart_campus_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('smart_campus_user');
      }
    }
    setIsLoading(false);
  }, []);

  // 模拟登录
  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // 根据用户名查找用户（模拟认证）
    const foundUser = mockUsers.find(u => 
      u.name === username || 
      u.id === username ||
      u.phone?.includes(username)
    );
    
    if (foundUser && password === '123456') {
      setUser(foundUser);
      localStorage.setItem('smart_campus_user', JSON.stringify(foundUser));
      setIsLoading(false);
      return true;
    }
    
    setIsLoading(false);
    return false;
  };

  // 登出
  const logout = () => {
    setUser(null);
    localStorage.removeItem('smart_campus_user');
  };

  // 切换角色（用于演示）
  const switchRole = (role: UserRole) => {
    const userWithRole = mockUsers.find(u => u.role === role);
    if (userWithRole) {
      setUser(userWithRole);
      localStorage.setItem('smart_campus_user', JSON.stringify(userWithRole));
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// 角色选项（用于登录选择）
export const roleOptions = [
  { value: 'principal', label: '校长', description: '全校最高管理者' },
  { value: 'secretary', label: '书记', description: '党委书记' },
  { value: 'vice_principal', label: '副校长', description: '分管副校长' },
  { value: 'admin', label: '行政人员', description: '教务处/德育处等' },
  { value: 'head_teacher', label: '班主任', description: '班级管理教师' },
  { value: 'teacher', label: '教师', description: '普通教师' },
  { value: 'student', label: '学生', description: '在校学生' },
  { value: 'parent', label: '家长', description: '学生家长' },
  { value: 'staff', label: '后勤人员', description: '后勤工作人员' },
];
