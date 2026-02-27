import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * POST - 批量删除教师
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({
        success: false,
        error: '请选择要删除的数据',
      }, { status: 400 });
    }

    const { error } = await client
      .from('teachers')
      .delete()
      .in('id', ids);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: { count: ids.length },
    });
  } catch (error) {
    console.error('Failed to batch delete teachers:', error);
    return NextResponse.json({
      success: false,
      error: '批量删除失败',
    }, { status: 500 });
  }
}
