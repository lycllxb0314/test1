'use client';

/**
 * 认证 Hook
 * 重新导出 AuthContext 中的 useAuth
 * 
 * 使用方式:
 * ```tsx
 * const { user, isLoading, login, logout, switchRole } = useAuth();
 * ```
 */

// 重新导出 AuthContext 中的 useAuth 和 AuthProvider
export { useAuth, AuthProvider } from '@/contexts/AuthContext';
