import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * 获取用户账号列表（仅管理员可用）
 * 
 * GET /api/users/accounts
 * 
 * 返回所有用户的账号信息（不包含密码哈希）
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    
    // 查询所有用户
    const { data: users, error } = await client
      .from('users')
      .select('id, employee_id, name, role, additional_roles, department, position, phone, status')
      .order('role', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      return NextResponse.json(
        { success: false, error: '获取用户列表失败' },
        { status: 500 }
      );
    }

    // 按角色分组
    const groupedUsers: Record<string, typeof users> = {};
    
    for (const user of users || []) {
      const role = user.role;
      if (!groupedUsers[role]) {
        groupedUsers[role] = [];
      }
      groupedUsers[role].push({
        ...user,
        // 默认密码提示
        defaultPassword: 'lysf2024',
      });
    }

    // 角色名称映射
    const roleNames: Record<string, string> = {
      principal: '校长',
      secretary: '书记',
      vice_principal: '副校长',
      head_teacher: '班主任',
      subject_teacher: '科任教师',
      skill_teacher: '技能课教师',
      parent: '家长',
    };

    return NextResponse.json({
      success: true,
      data: {
        users: users || [],
        groupedUsers,
        roleNames,
        defaultPassword: 'lysf2024',
        note: '所有用户默认密码为 lysf2024，请在首次登录后修改密码',
      },
    });
  } catch (error) {
    console.error('获取用户账号列表失败:', error);
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    );
  }
}
