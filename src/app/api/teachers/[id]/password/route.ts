import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * POST - 修改教师密码
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;
    const body = await request.json();
    const { newPassword } = body;

    // 验证密码
    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({
        success: false,
        error: '密码长度至少6位',
      }, { status: 400 });
    }

    // 更新密码（存储为 password 字段）
    const { error } = await client
      .from('teachers')
      .update({
        password: newPassword,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: '密码修改成功',
    });
  } catch (error) {
    console.error('Failed to update password:', error);
    return NextResponse.json({
      success: false,
      error: '密码修改失败',
    }, { status: 500 });
  }
}
