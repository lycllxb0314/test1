/**
 * 群组管理 API
 * 
 * 功能：
 * - 获取所有群组列表
 * - 获取群组成员
 * - 添加/移除成员
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { GROUP_CONFIGS, type GroupType, type GroupInfo, type GroupMember } from '@/types';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

// GET: 获取群组列表或群组成员
export const GET = protectedRoute(async (
  request: NextRequest,
  context: ExtendedRouteContext
) => {
  try {
    const supabase = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'list';

    if (action === 'list') {
      // 获取所有群组及其成员数量
      const groups: GroupInfo[] = [];
      
      for (const [type, config] of Object.entries(GROUP_CONFIGS)) {
        // 获取群组成员数量
        const { count } = await supabase
          .from('group_members')
          .select('*', { count: 'exact', head: true })
          .eq('group_type', type);
        
        // 获取群组管理员（部门负责人）- 使用 maybeSingle 避免没有管理员时报错
        const { data: director } = await supabase
          .from('group_members')
          .select('user_id, users!inner(name)')
          .eq('group_type', type)
          .eq('is_admin', true)
          .maybeSingle();
        
        const directorData = director as { user_id: string; users: { name: string } } | null;
        
        groups.push({
          id: type,
          type: type as GroupType,
          name: config.name,
          description: config.description,
          directorId: directorData?.user_id,
          directorName: directorData?.users?.name,
          memberCount: count || 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      return NextResponse.json({ groups });
    }

    if (action === 'members') {
      // 获取群组成员列表
      const groupType = searchParams.get('groupType') as GroupType;
      
      if (!groupType || !GROUP_CONFIGS[groupType]) {
        return NextResponse.json({ error: '无效的群组类型' }, { status: 400 });
      }

      const { data: members, error } = await supabase
        .from('group_members')
        .select(`
          id,
          group_id,
          group_type,
          user_id,
          is_admin,
          join_type,
          joined_at,
          users!inner(
            name,
            role,
            employee_id
          )
        `)
        .eq('group_type', groupType)
        .order('joined_at', { ascending: false });

      if (error) {
        console.error('获取群组成员失败:', error);
        return NextResponse.json({ error: '获取群组成员失败' }, { status: 500 });
      }

      const formattedMembers: GroupMember[] = (members || []).map((m: Record<string, unknown>) => {
        const groupType = m.group_type as GroupType;
        return {
          id: m.id as string,
          groupId: m.group_id as string,
          groupType,
          groupName: GROUP_CONFIGS[groupType]?.name || '',
          userId: m.user_id as string,
          userName: (m.users as { name: string })?.name || '',
          userRole: (m.users as { role: string })?.role as GroupMember['userRole'],
          employeeId: (m.users as { employee_id?: string })?.employee_id,
          isAdmin: (m.is_admin as boolean) || false,
          joinType: m.join_type as 'auto' | 'manual',
          joinedAt: m.joined_at as string,
        };
      });

      return NextResponse.json({ members: formattedMembers });
    }

    if (action === 'candidates') {
      // 获取可添加的用户列表（教师，排除已在群组中的）
      const groupType = searchParams.get('groupType') as GroupType;
      const search = searchParams.get('search') || '';
      
      if (!groupType || !GROUP_CONFIGS[groupType]) {
        return NextResponse.json({ error: '无效的群组类型' }, { status: 400 });
      }

      // 获取已在群组中的用户ID
      const { data: existingMembers } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_type', groupType);
      
      const existingUserIds = (existingMembers || []).map((m: { user_id: string }) => m.user_id);

      // 构建查询
      let query = supabase
        .from('users')
        .select('id, name, role, employee_id')
        .in('role', ['principal', 'secretary', 'academic_vice_principal', 'moral_vice_principal', 'general_vice_principal', 'head_teacher', 'subject_teacher', 'skill_teacher'])
        .eq('status', 'active')
        .order('name');
      
      if (existingUserIds.length > 0) {
        query = query.not('id', 'in', `(${existingUserIds.join(',')})`);
      }
      
      if (search) {
        query = query.or(`name.ilike.%${search}%,employee_id.ilike.%${search}%`);
      }

      const { data: candidates, error } = await query.limit(50);

      if (error) {
        console.error('获取候选人失败:', error);
        return NextResponse.json({ error: '获取候选人失败' }, { status: 500 });
      }

      return NextResponse.json({ candidates: candidates || [] });
    }

    return NextResponse.json({ error: '未知的操作' }, { status: 400 });
  } catch (error) {
    console.error('群组API错误:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
});

// POST: 添加群组成员
export const POST = protectedRoute(async (
  request: NextRequest,
  context: ExtendedRouteContext
) => {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    const { action, groupType, userIds } = body as { 
      action: string; 
      groupType?: GroupType; 
      userIds?: string[];
      targetUserId?: string;
      isAdmin?: boolean;
    };
    const userId = context.user.id;

    // 简化权限检查：校长室成员、对应部门主任可以操作
    const { data: isPrincipalOffice } = await supabase
      .from('group_members')
      .select('id')
      .eq('user_id', userId)
      .eq('group_type', 'principal_office')
      .single();
    
    const { data: isGroupAdmin } = await supabase
      .from('group_members')
      .select('id')
      .eq('user_id', userId)
      .eq('group_type', groupType)
      .eq('is_admin', true)
      .single();

    if (!isPrincipalOffice && !isGroupAdmin) {
      return NextResponse.json({ error: '无权限操作此群组' }, { status: 403 });
    }

    if (action === 'add_members') {
      if (!groupType || !GROUP_CONFIGS[groupType]) {
        return NextResponse.json({ error: '无效的群组类型' }, { status: 400 });
      }

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return NextResponse.json({ error: '请选择要添加的用户' }, { status: 400 });
      }

      // 批量添加成员
      const membersToAdd = userIds.map((uId: string) => ({
        group_id: groupType,
        group_type: groupType,
        user_id: uId,
        is_admin: false,
        join_type: 'manual',
        joined_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('group_members')
        .insert(membersToAdd);

      if (error) {
        console.error('添加成员失败:', error);
        return NextResponse.json({ error: '添加成员失败' }, { status: 500 });
      }

      return NextResponse.json({ success: true, addedCount: userIds.length });
    }

    if (action === 'set_admin') {
      const { targetUserId, isAdmin } = body as { targetUserId?: string; isAdmin?: boolean };
      
      if (!groupType || !targetUserId) {
        return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
      }

      const { error } = await supabase
        .from('group_members')
        .update({ is_admin: isAdmin || false })
        .eq('group_type', groupType)
        .eq('user_id', targetUserId);

      if (error) {
        console.error('设置管理员失败:', error);
        return NextResponse.json({ error: '设置管理员失败' }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: '未知的操作' }, { status: 400 });
  } catch (error) {
    console.error('群组API错误:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
});

// DELETE: 移除群组成员
export const DELETE = protectedRoute(async (
  request: NextRequest,
  context: ExtendedRouteContext
) => {
  try {
    const supabase = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const groupType = searchParams.get('groupType');
    const targetUserId = searchParams.get('userId');
    const userId = context.user.id;

    if (!groupType || !targetUserId) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    // 权限检查
    const { data: isPrincipalOffice } = await supabase
      .from('group_members')
      .select('id')
      .eq('user_id', userId)
      .eq('group_type', 'principal_office')
      .single();
    
    const { data: isGroupAdmin } = await supabase
      .from('group_members')
      .select('id')
      .eq('user_id', userId)
      .eq('group_type', groupType)
      .eq('is_admin', true)
      .single();

    if (!isPrincipalOffice && !isGroupAdmin) {
      return NextResponse.json({ error: '无权限操作此群组' }, { status: 403 });
    }

    // 不允许移除自动加入的成员
    const { data: member } = await supabase
      .from('group_members')
      .select('join_type')
      .eq('group_type', groupType)
      .eq('user_id', targetUserId)
      .single();

    if (member?.join_type === 'auto') {
      return NextResponse.json({ error: '自动加入的成员不能手动移除' }, { status: 400 });
    }

    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_type', groupType)
      .eq('user_id', targetUserId);

    if (error) {
      console.error('移除成员失败:', error);
      return NextResponse.json({ error: '移除成员失败' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('群组API错误:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
});
