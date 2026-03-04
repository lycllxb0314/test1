/**
 * 用户群组 API
 * 
 * 功能：
 * - 获取用户所属群组
 * - 更新用户群组成员身份
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { GROUP_CONFIGS, type GroupType, type UserGroupMembership } from '@/types';
import { verifyToken } from '@/lib/auth';

// GET: 获取用户所属群组
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient();
    const { id: userId } = await params;

    if (!userId) {
      return NextResponse.json({ error: '缺少用户ID' }, { status: 400 });
    }

    // 获取用户所属群组
    const { data: memberships, error } = await supabase
      .from('group_members')
      .select(`
        group_id,
        group_type,
        is_admin,
        join_type,
        joined_at
      `)
      .eq('user_id', userId);

    if (error) {
      console.error('获取用户群组失败:', error);
      return NextResponse.json({ error: '获取用户群组失败' }, { status: 500 });
    }

    const groups: UserGroupMembership[] = (memberships || []).map((m: Record<string, unknown>) => ({
      groupId: m.group_id as string,
      groupType: m.group_type as GroupType,
      groupName: GROUP_CONFIGS[m.group_type as GroupType]?.name || '',
      isAdmin: m.is_admin as boolean,
      joinType: m.join_type as 'auto' | 'manual',
    }));

    return NextResponse.json({ groups });
  } catch (error) {
    console.error('用户群组API错误:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}

// PUT: 更新用户群组成员身份
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 从 cookie 中获取 access token
    const accessToken = request.cookies.get('smart_campus_access_token')?.value;
    if (!accessToken) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }
    
    // 验证用户身份
    const user = await verifyToken(accessToken);
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const supabase = getSupabaseClient();
    const { id: userId } = await params;
    
    if (!userId) {
      return NextResponse.json({ error: '缺少用户ID' }, { status: 400 });
    }
    
    const body = await request.json();
    const { groups } = body;
    const currentUserId = user.userId;

    // 只有校长室成员可以修改用户群组
    const { data: isPrincipalOffice } = await supabase
      .from('group_members')
      .select('id')
      .eq('user_id', currentUserId)
      .eq('group_type', 'principal_office')
      .single();

    if (!isPrincipalOffice) {
      return NextResponse.json({ error: '无权限修改用户群组' }, { status: 403 });
    }

    // 获取用户当前的群组成员身份
    const { data: currentMemberships } = await supabase
      .from('group_members')
      .select('id, group_type, join_type')
      .eq('user_id', userId);

    const currentGroupTypes = new Set((currentMemberships || []).map((m: { group_type: string }) => m.group_type));
    const newGroupTypes = new Set(groups as GroupType[]);

    // 删除不再需要的群组成员（只删除手动添加的）
    const toRemove = (currentMemberships || [])
      .filter((m: { group_type: string; join_type: string }) => 
        !newGroupTypes.has(m.group_type as GroupType) && m.join_type === 'manual'
      )
      .map((m: { id: string }) => m.id);

    if (toRemove.length > 0) {
      await supabase
        .from('group_members')
        .delete()
        .in('id', toRemove);
    }

    // 添加新的群组成员
    const toAdd = [...newGroupTypes].filter(gt => !currentGroupTypes.has(gt));
    
    if (toAdd.length > 0) {
      const membersToAdd = toAdd.map(groupType => ({
        group_id: groupType,
        group_type: groupType,
        user_id: userId,
        is_admin: false,
        join_type: 'manual',
        joined_at: new Date().toISOString(),
      }));

      await supabase
        .from('group_members')
        .insert(membersToAdd);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('更新用户群组API错误:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
