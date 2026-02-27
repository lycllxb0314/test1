import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * GET - 获取当前用户信息
 * 通过用户ID查询用户信息
 * 查询参数：
 * - userId: 用户ID
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: '未提供用户ID',
      }, { status: 400 });
    }

    const { data: user, error } = await client
      .from('users')
      .select(`
        id,
        name,
        role,
        phone,
        email,
        department,
        position,
        class_id,
        class_name,
        subjects,
        avatar,
        children,
        status
      `)
      .eq('id', userId)
      .eq('status', 'active')
      .single();

    if (error || !user) {
      return NextResponse.json({
        success: false,
        error: '用户不存在',
      }, { status: 404 });
    }

    // 转换字段名以匹配前端类型
    const userInfo = {
      id: user.id,
      name: user.name,
      role: user.role,
      phone: user.phone,
      email: user.email,
      department: user.department,
      position: user.position,
      classId: user.class_id,
      className: user.class_name,
      subjects: user.subjects,
      avatar: user.avatar,
      children: user.children,
    };

    return NextResponse.json({
      success: true,
      data: userInfo,
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json({
      success: false,
      error: '获取用户信息失败',
    }, { status: 500 });
  }
}
