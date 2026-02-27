import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * POST - 批量删除学生
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
      .from('students')
      .delete()
      .in('id', ids);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: { count: ids.length },
    });
  } catch (error) {
    console.error('Failed to batch delete students:', error);
    return NextResponse.json({
      success: false,
      error: '批量删除失败',
    }, { status: 500 });
  }
}
