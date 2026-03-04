'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, UserRole, AdministrativeRole } from '@/types';

// 是否使用真实API（生产环境设为true）
const USE_REAL_API = process.env.NODE_ENV === 'production';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 导出 AuthContext 供外部使用
export { AuthContext };

// 主要角色名称到角色的映射
const roleNameToRole: Record<string, UserRole> = {
  '校长': 'principal',
  '书记': 'secretary',
  '教学副校长': 'academic_vice_principal',
  '德育副校长': 'moral_vice_principal',
  '总务副校长': 'general_vice_principal',
  '班主任': 'head_teacher',
  '科任教师': 'subject_teacher',
  '技能课教师': 'skill_teacher',
  '家长': 'parent',
};

// 兼任职务名称映射
const adminRoleNameToRole: Record<string, AdministrativeRole> = {
  '教务主任': 'academic_director',
  '德育主任': 'moral_director',
  '总务主任': 'general_director',
  '年段长': 'grade_leader',
  '教研组组长': 'research_group_leader',
  '教研组副组长': 'research_group_deputy_leader',
  '少先队大队辅导员': 'young_pioneer_counselor',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化时检查本地存储的登录状态
  useEffect(() => {
    const initAuth = async () => {
      const savedUser = localStorage.getItem('smart_campus_user');
      
      // 尝试通过 API 验证当前会话（JWT token 在 cookie 中会自动发送）
      try {
        const response = await fetch('/api/auth/current');
        const result = await response.json();
        
        if (result.success && result.data) {
          // 会话有效，更新用户数据
          setUser(result.data);
          localStorage.setItem('smart_campus_user', JSON.stringify(result.data));
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      }
      
      // API 验证失败，检查 localStorage 是否有缓存数据
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          const userData = parsedUser.user || parsedUser;
          
          if (userData.id) {
            // 使用本地缓存的用户数据（离线模式或 token 过期）
            setUser(userData);
          } else {
            localStorage.removeItem('smart_campus_user');
          }
        } catch {
          localStorage.removeItem('smart_campus_user');
        }
      }
      
      setIsLoading(false);
    };
    
    initAuth();
  }, []);

  // 登录
  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // 统一使用 API 登录
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      
      const result = await response.json();
      
      if (result.success && result.data?.user) {
        const userData = result.data.user;
        setUser(userData);
        localStorage.setItem('smart_campus_user', JSON.stringify(userData));
        
        // 保存 token 到 localStorage（用于 Authorization header）
        if (result.data.tokens?.accessToken) {
          localStorage.setItem('smart_campus_token', result.data.tokens.accessToken);
          localStorage.setItem('smart_campus_refresh_token', result.data.tokens.refreshToken);
        }
        
        setIsLoading(false);
        return true;
      }
      
      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      return false;
    }
  }, []);

  // 登出
  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('smart_campus_user');
    localStorage.removeItem('smart_campus_token');
    localStorage.removeItem('smart_campus_refresh_token');
  }, []);

  // 切换角色（仅用于开发测试）
  const switchRole = useCallback((role: UserRole) => {
    if (user) {
      const updatedUser = { ...user, role };
      setUser(updatedUser);
      localStorage.setItem('smart_campus_user', JSON.stringify(updatedUser));
    }
  }, [user]);

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

// 主要角色选项（用于登录选择）
export const roleOptions = [
  { value: 'principal', label: '校长', description: '全校最高管理者' },
  { value: 'secretary', label: '书记', description: '党委书记' },
  { value: 'academic_vice_principal', label: '教学副校长', description: '分管教务工作' },
  { value: 'moral_vice_principal', label: '德育副校长', description: '分管德育工作' },
  { value: 'general_vice_principal', label: '总务副校长', description: '分管总务工作' },
  { value: 'head_teacher', label: '班主任', description: '班级管理教师' },
  { value: 'subject_teacher', label: '科任教师', description: '语数英等主科教师' },
  { value: 'skill_teacher', label: '技能课教师', description: '音乐、美术、体育等教师' },
  { value: 'parent', label: '家长', description: '学生家长，查看子女信息' },
];
