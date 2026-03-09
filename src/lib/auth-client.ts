/**
 * 客户端认证工具
 * 
 * 用于在 fetch 请求中添加认证信息
 * 支持自动刷新 token
 */

// Token 刷新状态
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

/**
 * 获取存储在 localStorage 中的 token
 */
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('smart_campus_token');
}

/**
 * 获取存储在 localStorage 中的 refresh token
 */
export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('smart_campus_refresh_token');
}

/**
 * 设置 token
 */
export function setTokens(accessToken: string, refreshToken?: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('smart_campus_token', accessToken);
  if (refreshToken) {
    localStorage.setItem('smart_campus_refresh_token', refreshToken);
  }
}

/**
 * 清除 token
 */
export function clearTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('smart_campus_token');
  localStorage.removeItem('smart_campus_refresh_token');
  localStorage.removeItem('smart_campus_user');
}

/**
 * 获取认证请求头
 * 
 * 同时支持 Cookie 和 Authorization header 两种方式
 */
export function getAuthHeaders(): Record<string, string> {
  const token = getAccessToken();
  const headers: Record<string, string> = {};
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

/**
 * 创建带认证的 fetch 选项
 * 
 * @param options 原始 fetch 选项
 * @returns 合并了认证信息的 fetch 选项
 */
export function withAuth(options: RequestInit = {}): RequestInit {
  const authHeaders = getAuthHeaders();
  
  return {
    ...options,
    credentials: 'include' as RequestCredentials,
    headers: {
      ...options.headers,
      ...authHeaders,
    },
  };
}

/**
 * 刷新 Token
 * 
 * 使用 refresh token 获取新的 access token
 */
async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  
  if (!refreshToken) {
    console.log('[Auth] No refresh token available');
    return false;
  }
  
  try {
    console.log('[Auth] Attempting to refresh token...');
    
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ refreshToken }),
    });
    
    const result = await response.json();
    
    if (result.success && result.data?.tokens) {
      const { accessToken, refreshToken: newRefreshToken } = result.data.tokens;
      setTokens(accessToken, newRefreshToken);
      console.log('[Auth] Token refreshed successfully');
      return true;
    }
    
    console.log('[Auth] Token refresh failed:', result.error);
    return false;
  } catch (error) {
    console.error('[Auth] Token refresh error:', error);
    return false;
  }
}

/**
 * 确保只有一个刷新请求在进行
 */
async function ensureFreshToken(): Promise<boolean> {
  // 如果已经在刷新，等待刷新完成
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }
  
  isRefreshing = true;
  refreshPromise = refreshAccessToken().finally(() => {
    isRefreshing = false;
    refreshPromise = null;
  });
  
  return refreshPromise;
}

/**
 * 带认证的 fetch 封装
 * 
 * 自动添加 credentials: 'include' 和 Authorization header
 * 支持 401 时自动刷新 token 并重试
 */
export async function authFetch<T = unknown>(
  url: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string; success: boolean }> {
  try {
    // 第一次请求
    let response = await fetch(url, withAuth(options));
    let result = await response.json();
    
    // 如果返回 401，尝试刷新 token 并重试
    if (response.status === 401 || result.code === 'AUTH_FAILED') {
      console.log('[Auth] Request returned 401, attempting token refresh...');
      
      const refreshed = await ensureFreshToken();
      
      if (refreshed) {
        // 使用新的 token 重试请求
        console.log('[Auth] Retrying request with new token...');
        response = await fetch(url, withAuth(options));
        result = await response.json();
        
        if (result.success) {
          return { data: result.data, success: true };
        }
      } else {
        // 刷新失败，清除登录状态
        console.log('[Auth] Token refresh failed, clearing auth state');
        clearTokens();
        
        // 触发全局登出事件
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:logout', { 
            detail: { reason: 'token_expired' } 
          }));
        }
      }
    }
    
    if (result.success) {
      return { data: result.data, success: true };
    }
    
    return { error: result.error || '请求失败', success: false };
  } catch (err) {
    return { error: err instanceof Error ? err.message : '请求失败', success: false };
  }
}

/**
 * 带认证的 fetch 封装（原始版本，不自动刷新）
 * 
 * 用于不需要自动刷新的场景
 */
export async function authFetchSimple<T = unknown>(
  url: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string; success: boolean }> {
  try {
    const response = await fetch(url, withAuth(options));
    const result = await response.json();
    
    if (result.success) {
      return { data: result.data, success: true };
    }
    
    return { error: result.error || '请求失败', success: false };
  } catch (err) {
    return { error: err instanceof Error ? err.message : '请求失败', success: false };
  }
}

/**
 * 检查是否已登录
 */
export function isAuthenticated(): boolean {
  return !!getAccessToken();
}
