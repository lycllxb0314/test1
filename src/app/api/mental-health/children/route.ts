/**
 * 获取家长关联的孩子列表（含人脸向量状态）
 * GET /api/mental-health/children
 */
import { NextRequest, NextResponse } from 'next/server';
import { mentalHealthService } from '@/services/mental-health.service';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { success, error, ErrorCode } from '@/lib/api';

export const dynamic = 'force-dynamic';

export const GET = async (request: NextRequest) => {
  try {
    // 从 cookie 获取用户信息
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json(error('请先登录', ErrorCode.UNAUTHORIZED), { status: 401 });
    }

    const client = getSupabaseClient();
    const { data: userRow, error: userErr } = await client
      .from('users')
      .select('phone, role')
      .eq('id', token)
      .single();

    if (userErr || !userRow || userRow.role !== 'parent') {
      return NextResponse.json(error('仅家长可访问', ErrorCode.FORBIDDEN), { status: 403 });
    }

    const children = await mentalHealthService.getParentChildren(userRow.phone as string);
    return NextResponse.json(success(children, 'database'));
  } catch (err) {
    console.error('[mental-health/children] GET error:', err);
    return NextResponse.json(error('获取孩子列表失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
};
