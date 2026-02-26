import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET - 获取主页内容
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section');

    if (section) {
      // 获取特定区块内容
      const { data, error } = await client
        .from('homepage_sections')
        .select('*')
        .eq('section_type', section)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ data: data || null });
    }

    // 获取所有区块内容
    const { data: sections, error: sectionsError } = await client
      .from('homepage_sections')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (sectionsError) {
      return NextResponse.json({ error: sectionsError.message }, { status: 500 });
    }

    return NextResponse.json({ data: sections });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST - 创建或更新主页内容
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    const { section_type, section_title, section_subtitle, content, sort_order, updated_by } = body;

    if (!section_type) {
      return NextResponse.json({ error: 'section_type is required' }, { status: 400 });
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
      const { data, error } = await client
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

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      result = data;
    } else {
      // 创建
      const { data, error } = await client
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

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      result = data;
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
