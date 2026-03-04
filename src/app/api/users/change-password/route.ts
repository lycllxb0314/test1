/**
 * 用户修改密码 API
 * 
 * 功能：
 * - POST /api/users/change-password: 用户修改自己的密码
 * 
 * 适用角色：所有角色（校长、教师、家长等）
 * 
 * 流程：
 * 1. 验证旧密码
 * 2. 加密新密码（bcrypt）
 * 3. 更新 users 表的 password_hash
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { error, ErrorCode } from '@/lib/api-route-utils';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';
import bcrypt from 'bcryptjs';

/**
 * POST - 修改密码
 */
const handleChangePassword = async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const body = await request.json();
    const { oldPassword, newPassword } = body;

    // 参数验证
    if (!oldPassword || !newPassword) {
      return NextResponse.json(error('请输入旧密码和新密码', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json(error('新密码长度不能少于6位', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }

    if (oldPassword === newPassword) {
      return NextResponse.json(error('新密码不能与旧密码相同', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }

    const client = getSupabaseClient();

    // 通过 employeeId 查询用户
    const { data: dbUser, error: userError } = await client
      .from('users')
      .select('id, password_hash, employee_id')
      .eq('employee_id', user.employeeId)
      .single();

    if (userError || !dbUser) {
      return NextResponse.json(error('用户不存在', ErrorCode.NOT_FOUND), { status: 404 });
    }

    // 验证旧密码
    if (!dbUser.password_hash) {
      return NextResponse.json(error('账号异常，请联系管理员', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }

    const isValidPassword = await bcrypt.compare(oldPassword, dbUser.password_hash);
    if (!isValidPassword) {
      return NextResponse.json(error('旧密码错误', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }

    // 加密新密码
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // 更新 users 表密码
    const { error: updateError } = await client
      .from('users')
      .update({
        password_hash: newPasswordHash,
        updated_at: new Date().toISOString(),
      })
      .eq('id', dbUser.id);

    if (updateError) {
      return NextResponse.json(error('密码更新失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }

    // 如果是教师，同步更新 teachers 表（存储明文用于展示/迁移）
    if (user.role !== 'parent' && user.employeeId) {
      await client
        .from('teachers')
        .update({
          password: newPassword,
          updated_at: new Date().toISOString(),
        })
        .eq('employee_id', user.employeeId);
    }

    return NextResponse.json({
      success: true,
      message: '密码修改成功',
    });
  } catch (err) {
    console.error('Change password error:', err);
    return NextResponse.json(error('密码修改失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
};

export const POST = protectedRoute(handleChangePassword);
