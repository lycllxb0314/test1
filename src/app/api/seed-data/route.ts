/**
 * 种子数据 API
 * 
 * POST: 初始化种子数据
 * 
 * ⚠️ 架构原则：
 * - 仅用于开发环境初始化数据
 */

import { NextRequest, NextResponse } from 'next/server';
import { success, error, ErrorCode } from '@/lib/api';

// 简化的种子数据初始化
async function initializeSeedData() {
  const { getSupabaseClient } = await import('@/storage/database/supabase-client');
  const client = getSupabaseClient();
  
  // 检查是否已有数据
  const { count } = await client.from('teachers').select('*', { count: 'exact', head: true });
  if (count && count > 0) {
    return { success: true, message: '数据已存在，跳过初始化' };
  }

  // 初始化基础数据
  const results = [];
  
  // 初始化教师数据示例
  const { error: teacherError } = await client.from('teachers').insert([
    { id: 'teacher-001', name: '示例教师', subject: '语文', status: 'active' },
  ]);
  
  if (teacherError) {
    results.push({ table: 'teachers', success: false, error: teacherError.message });
  } else {
    results.push({ table: 'teachers', success: true, count: 1 });
  }

  return { success: true, results };
}

/**
 * POST - 初始化种子数据
 */
export async function POST(request: NextRequest) {
  // 仅在开发环境允许
  if (process.env.COZE_PROJECT_ENV === 'PROD') {
    return NextResponse.json(
      error('生产环境禁止执行此操作', ErrorCode.FORBIDDEN),
      { status: 403 }
    );
  }

  try {
    const result = await initializeSeedData();
    return NextResponse.json(success(result));
  } catch (err) {
    console.error('初始化种子数据失败:', err);
    return NextResponse.json(
      error('初始化种子数据失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}
