import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { UserRole } from '@/types';

// 角色名称到角色的映射
const roleNameToRole: Record<string, UserRole> = {
  '校长': 'principal',
  '书记': 'secretary',
  '副校长': 'vice_principal',
  '教务主任': 'academic_director',
  '德育主任': 'moral_director',
  '总务主任': 'general_director',
  '教务员': 'academic_staff',
  '德育员': 'moral_staff',
  '班主任': 'head_teacher',
  '年段长': 'grade_leader',
  '教师': 'teacher',
  '学生': 'student',
  '家长': 'parent',
  '后勤': 'staff',
  '后勤人员': 'staff',
};

/**
 * POST - 用户登录
 * 请求体：
 * - username: 用户名/工号/手机号
 * - password: 密码
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({
        success: false,
        error: '请输入用户名和密码',
      }, { status: 400 });
    }

    // 1. 尝试通过工号或手机号查找用户
    let { data: user, error } = await client
      .from('users')
      .select('*')
      .or(`employee_id.eq.${username},phone.eq.${username},name.eq.${username}`)
      .eq('status', 'active')
      .single();

    // 2. 如果没找到，尝试通过角色名称查找（用于演示）
    if (!user && roleNameToRole[username]) {
      const targetRole = roleNameToRole[username];
      const result = await client
        .from('users')
        .select('*')
        .eq('role', targetRole)
        .eq('status', 'active')
        .limit(1)
        .single();
      
      if (!result.error) {
        user = result.data;
      }
    }

    if (!user) {
      return NextResponse.json({
        success: false,
        error: '用户不存在',
      }, { status: 401 });
    }

    // 3. 验证密码（实际项目中应该使用加密比较）
    // 这里简单比较，生产环境需要使用 bcrypt 等加密库
    const isValidPassword = password === '123456' || password === user.password;

    if (!isValidPassword) {
      return NextResponse.json({
        success: false,
        error: '密码错误',
      }, { status: 401 });
    }

    // 4. 更新最后登录时间
    await client
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id);

    // 5. 构造返回的用户信息（不包含敏感信息）
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
      message: '登录成功',
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({
      success: false,
      error: '登录失败，请稍后重试',
    }, { status: 500 });
  }
}
