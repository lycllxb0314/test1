/**
 * 主页内容管理 API
 * 
 * 使用统一的路由处理模式和响应格式
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { success, error, ErrorCode } from '@/lib/api-route-utils';

/**
 * GET - 获取主页内容
 * 
 * 查询参数：
 * - section: 区块类型（可选）
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section');

    if (section) {
      // 获取特定区块内容
      const { data, error: dbError } = await client
        .from('homepage_sections')
        .select('*')
        .eq('section_type', section)
        .eq('is_active', true)
        .single();

      if (dbError && dbError.code !== 'PGRST116') {
        return NextResponse.json(error('获取区块内容失败', ErrorCode.DATABASE_ERROR), { status: 500 });
      }

      return NextResponse.json(success(data, 'database'));
    }

    // 获取所有区块内容
    const { data: sections, error: dbError } = await client
      .from('homepage_sections')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (dbError) {
      return NextResponse.json(error('获取主页内容失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }

    return NextResponse.json(success(sections || [], 'database'));
  } catch (err) {
    console.error('API Error:', err);
    return NextResponse.json(error('服务器内部错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}

/**
 * POST - 创建或更新主页内容
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    const { section_type, section_title, section_subtitle, content, sort_order, updated_by } = body;

    if (!section_type) {
      return NextResponse.json(error('section_type 参数必填', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    // 检查是否已存在
    const { data: existing } = await client
      .from('homepage_sections')
      .select('id')
      .eq('section_type', section_type)
      .single();

    let result;
    if (existing) {
      // 更新
      const { data, error: dbError } = await client
        .from('homepage_sections')
        .update({
          section_title,
          section_subtitle,
          content,
          sort_order,
          updated_by,
          updated_at: new Date().toISOString(),
        })
        .eq('section_type', section_type)
        .select()
        .single();

      if (dbError) {
        return NextResponse.json(error('更新内容失败', ErrorCode.DATABASE_ERROR), { status: 500 });
      }
      result = data;
    } else {
      // 创建
      const { data, error: dbError } = await client
        .from('homepage_sections')
        .insert({
          section_type,
          section_title,
          section_subtitle,
          content,
          sort_order,
          updated_by,
        })
        .select()
        .single();

      if (dbError) {
        return NextResponse.json(error('创建内容失败', ErrorCode.DATABASE_ERROR), { status: 500 });
      }
      result = data;
    }

    return NextResponse.json(success(result, 'database'));
  } catch (err) {
    console.error('API Error:', err);
    return NextResponse.json(error('服务器内部错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}
