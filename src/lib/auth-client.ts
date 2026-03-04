/**
 * 客户端认证工具
 * 
 * 用于在 fetch 请求中添加认证信息
 */

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
 * 带认证的 fetch 封装
 * 
 * 自动添加 credentials: 'include' 和 Authorization header
 */
export async function authFetch<T = unknown>(
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
