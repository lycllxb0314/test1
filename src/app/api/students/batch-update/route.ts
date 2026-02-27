import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * POST - 批量更新学生
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    const { ids, updates } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({
        success: false,
        error: '请选择要更新的数据',
      }, { status: 400 });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json({
        success: false,
        error: '请提供更新内容',
      }, { status: 400 });
    }

    const { error } = await client
      .from('students')
      .update(updates)
      .in('id', ids);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: { count: ids.length },
    });
  } catch (error) {
    console.error('Failed to batch update students:', error);
    return NextResponse.json({
      success: false,
      error: '批量更新失败',
    }, { status: 500 });
  }
}
