import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import bcrypt from 'bcryptjs';

/**
 * POST - 修改教师密码
 * 同时更新 users 表（加密存储）和 teachers 表
 * 
 * 关联逻辑：
 * - teachers 表使用 't001', 't002' 等 id
 * - users 表使用 UUID 格式的 id
 * - 两个表通过 employee_id 关联
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

    // 1. 获取教师的 employee_id
    const { data: teacher, error: teacherError } = await client
      .from('teachers')
      .select('id, name, employee_id')
      .eq('id', id)
      .single();

    if (teacherError || !teacher) {
      return NextResponse.json({
        success: false,
        error: '教师不存在',
      }, { status: 404 });
    }

    const employeeId = teacher.employee_id;
    
    // 使用 bcrypt 加密密码
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const now = new Date().toISOString();

    // 2. 更新 teachers 表
    const { error: updateTeacherError } = await client
      .from('teachers')
      .update({
        password: newPassword,  // teachers 表存明文（可选，用于同步显示）
        updated_at: now,
      })
      .eq('id', id);

    if (updateTeacherError) {
      console.error('Failed to update teacher password:', updateTeacherError);
      // 继续尝试更新 users 表
    }

    // 3. 根据 employee_id 查找并更新 users 表
    if (employeeId) {
      const { error: userError } = await client
        .from('users')
        .update({
          password_hash: passwordHash,
          updated_at: now,
        })
        .eq('employee_id', employeeId);

      if (userError) {
        console.error('Failed to update user password:', userError);
        // 如果 users 表更新失败，记录日志但不返回错误（可能用户不存在）
      }
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
