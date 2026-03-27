/**
 * 家长修改密码 API
 * 
 * 功能：
 * - POST /api/parents/change-password: 家长修改自己的密码
 * 
 * 家长通过手机号登录，修改密码需要：
 * 1. 验证旧密码
 * 2. 设置新密码（同时更新users表）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';
import bcrypt from 'bcryptjs';

/**
 * POST - 修改密码
 */
const handleChangePassword = async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    // 只有家长角色可以调用此接口
    if (user.role !== 'parent') {
      return NextResponse.json(error('只有家长角色可以修改密码', ErrorCode.FORBIDDEN), { status: 403 });
    }

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

    // 通过手机号查询用户
    const { data: dbUser, error: userError } = await client
      .from('users')
      .select('*')
      .eq('phone', user.phone)
      .eq('role', 'parent')
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
    const { error: updateUserError } = await client
      .from('users')
      .update({
        password_hash: newPasswordHash,
        updated_at: new Date().toISOString(),
      })
      .eq('id', dbUser.id);

    if (updateUserError) {
      return NextResponse.json(error('密码更新失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }

    // 同步更新 parents 表（可选，存储明文用于展示）
    await client
      .from('parents')
      .update({
        password: newPassword,
        updated_at: new Date().toISOString(),
      })
      .eq('phone', user.phone);

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
