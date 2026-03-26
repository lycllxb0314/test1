/**
 * Supabase 客户端（优化版）
 * 
 * 特性：
 * 1. 本地缓存 - 避免重复调用 Python 脚本
 * 2. 缓存过期 - 5分钟后自动重新加载
 * 3. 错误重试 - 失败后最多重试2次
 * 
 * @module storage/database/supabase-client
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';
import { writeFileSync, readFileSync, existsSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

// ============================================
// 缓存配置
// ============================================

const CACHE_FILE = join(tmpdir(), '.supabase-env-cache.json');
const CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存
const MAX_RETRIES = 2;

interface CacheData {
  env: Record<string, string>;
  timestamp: number;
}

interface SupabaseCredentials {
  url: string;
  anonKey: string;
}

// ============================================
// 环境变量加载状态
// ============================================

let envLoaded = false;
let loadingPromise: Promise<void> | null = null;

// ============================================
// 缓存读写
// ============================================

function readCache(): CacheData | null {
  try {
    if (!existsSync(CACHE_FILE)) {
      return null;
    }
    const content = readFileSync(CACHE_FILE, 'utf-8');
    const cache = JSON.parse(content) as CacheData;
    
    // 检查缓存是否过期
    if (Date.now() - cache.timestamp > CACHE_TTL) {
      return null;
    }
    
    return cache;
  } catch {
    return null;
  }
}

function writeCache(env: Record<string, string>): void {
  try {
    const cache: CacheData = {
      env,
      timestamp: Date.now(),
    };
    writeFileSync(CACHE_FILE, JSON.stringify(cache), 'utf-8');
  } catch {
    // 忽略缓存写入错误
  }
}

function clearCache(): void {
  try {
    if (existsSync(CACHE_FILE)) {
      unlinkSync(CACHE_FILE);
    }
  } catch {
    // 忽略错误
  }
}

// ============================================
// 环境变量加载
// ============================================

async function loadEnvFromPython(retryCount = 0): Promise<Record<string, string>> {
  const pythonCode = `
import os
import sys
try:
    from coze_workload_identity import Client
    client = Client()
    env_vars = client.get_project_env_vars()
    client.close()
    for env_var in env_vars:
        print(f"{env_var.key}={env_var.value}")
except Exception as e:
    print(f"# Error: {e}", file=sys.stderr)
`;

  try {
    const output = execSync(`python3 -c '${pythonCode.replace(/'/g, "'\"'\"'")}'`, {
      encoding: 'utf-8',
      timeout: 10000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const env: Record<string, string> = {};
    const lines = output.trim().split('\n');
    
    for (const line of lines) {
      if (line.startsWith('#')) continue;
      const eqIndex = line.indexOf('=');
      if (eqIndex > 0) {
        const key = line.substring(0, eqIndex);
        let value = line.substring(eqIndex + 1);
        if ((value.startsWith("'") && value.endsWith("'")) ||
            (value.startsWith('"') && value.endsWith('"'))) {
          value = value.slice(1, -1);
        }
        env[key] = value;
      }
    }

    return env;
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      // 等待一段时间后重试
      await new Promise(resolve => setTimeout(resolve, 500));
      return loadEnvFromPython(retryCount + 1);
    }
    throw error;
  }
}

async function loadEnv(): Promise<void> {
  // 如果已经加载过，直接返回
  if (envLoaded || (process.env.COZE_SUPABASE_URL && process.env.COZE_SUPABASE_ANON_KEY)) {
    envLoaded = true;
    return;
  }

  // 防止并发加载
  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = (async () => {
    try {
      // 尝试加载 dotenv
      try {
        require('dotenv').config();
        if (process.env.COZE_SUPABASE_URL && process.env.COZE_SUPABASE_ANON_KEY) {
          envLoaded = true;
          return;
        }
      } catch {
        // dotenv not available
      }

      // 尝试从缓存读取
      const cache = readCache();
      if (cache && cache.env) {
        // 从缓存恢复环境变量
        for (const [key, value] of Object.entries(cache.env)) {
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
        envLoaded = true;
        return;
      }

      // 从 Python 加载
      const env = await loadEnvFromPython();
      
      // 设置环境变量
      for (const [key, value] of Object.entries(env)) {
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }

      // 写入缓存
      writeCache(env);
      envLoaded = true;
    } catch (error) {
      console.error('[Supabase] Failed to load environment variables:', error);
      // 清除可能损坏的缓存
      clearCache();
    }
  })();

  await loadingPromise;
  loadingPromise = null;
}

// ============================================
// 凭证获取
// ============================================

function getSupabaseCredentials(): SupabaseCredentials {
  // 同步加载（用于已加载的情况）
  if (!envLoaded) {
    // 如果还没加载，尝试从缓存同步读取
    const cache = readCache();
    if (cache && cache.env) {
      for (const [key, value] of Object.entries(cache.env)) {
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
      envLoaded = true;
    }
  }

  const url = process.env.COZE_SUPABASE_URL;
  const anonKey = process.env.COZE_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error('COZE_SUPABASE_URL is not set');
  }
  if (!anonKey) {
    throw new Error('COZE_SUPABASE_ANON_KEY is not set');
  }

  return { url, anonKey };
}

// ============================================
// 客户端创建
// ============================================

// 客户端缓存（避免重复创建）
let defaultClient: SupabaseClient | null = null;
const clientsWithToken = new Map<string, SupabaseClient>();

function getSupabaseClient(token?: string): SupabaseClient {
  const { url, anonKey } = getSupabaseCredentials();

  // 无 token 时返回默认客户端
  if (!token) {
    if (!defaultClient) {
      defaultClient = createClient(url, anonKey, {
        db: { timeout: 60000 },
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    }
    return defaultClient;
  }

  // 有 token 时返回带认证的客户端（缓存）
  let client = clientsWithToken.get(token);
  if (!client) {
    client = createClient(url, anonKey, {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
      db: { timeout: 60000 },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    clientsWithToken.set(token, client);
    
    // 限制缓存大小
    if (clientsWithToken.size > 100) {
      const firstKey = clientsWithToken.keys().next().value;
      if (firstKey) {
        clientsWithToken.delete(firstKey);
      }
    }
  }

  return client;
}

// ============================================
// 导出
// ============================================

export { loadEnv, getSupabaseCredentials, getSupabaseClient };
