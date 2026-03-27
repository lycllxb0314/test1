/**
 * 当前登录家长信息 API
 * 
 * 功能：
 * - GET /api/parents/me: 获取当前登录家长的详细信息
 * - PUT /api/parents/me: 更新当前登录家长的信息
 * 
 * 家长通过 phone 字段与 users 表关联
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { success, error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// 关系名称映射
const RELATION_NAMES: Record<string, string> = {
  father: '父亲',
  mother: '母亲',
  grandfather: '爷爷/外公',
  grandmother: '奶奶/外婆',
  other: '其他',
};

/**
 * GET - 获取当前登录家长信息
 */
const handleGetMyInfo = async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    // 只有家长角色可以访问
    if (user.role !== 'parent') {
      return NextResponse.json(error('只有家长角色可以访问', ErrorCode.FORBIDDEN), { status: 403 });
    }

    const client = getSupabaseClient();

    // 通过手机号查询家长信息
    const { data: parent, error: dbError } = await client
      .from('parents')
      .select('*')
      .eq('phone', user.phone)
      .eq('status', 'active')
      .single();

    if (dbError || !parent) {
      return NextResponse.json(error('家长信息不存在', ErrorCode.NOT_FOUND), { status: 404 });
    }

    // 获取该家长关联的所有子女信息
    const { data: studentInfo } = await client
      .from('students')
      .select('id, name, student_no, class_id, class_name, gender, birth_date')
      .eq('id', parent.student_id)
      .single();

    // 获取该学生的其他家长
    const { data: otherParents } = await client
      .from('parents')
      .select('id, name, relation, relation_name, phone, is_primary')
      .eq('student_id', parent.student_id)
      .neq('id', parent.id);

    return NextResponse.json({
      success: true,
      data: {
        ...parent,
        student: studentInfo,
        otherParents: otherParents || [],
      },
    });
  } catch (err) {
    console.error('Failed to fetch parent info:', err);
    return NextResponse.json(error('获取家长信息失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
};

/**
 * PUT - 更新当前登录家长信息
 */
const handleUpdateMyInfo = async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    // 只有家长角色可以访问
    if (user.role !== 'parent') {
      return NextResponse.json(error('只有家长角色可以访问', ErrorCode.FORBIDDEN), { status: 403 });
    }

    const body = await request.json();
    const client = getSupabaseClient();

    // 通过手机号查询家长信息
    const { data: existingParent, error: fetchError } = await client
      .from('parents')
      .select('id, phone')
      .eq('phone', user.phone)
      .single();

    if (fetchError || !existingParent) {
      return NextResponse.json(error('家长信息不存在', ErrorCode.NOT_FOUND), { status: 404 });
    }

    // 准备更新数据（家长只能修改部分信息）
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    // 允许家长修改的字段
    const allowedFields = [
      'wechat', 'email', 'education', 'political_status',
      'household_address', 'current_address', 
      'emergency_contact', 'emergency_phone',
      'occupation', 'work_unit', 'remark'
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field] || null;
      }
    }

    // 执行更新
    const { error: updateError } = await client
      .from('parents')
      .update(updateData)
      .eq('id', existingParent.id);

    if (updateError) {
      return NextResponse.json(error('更新失败: ' + updateError.message, ErrorCode.DATABASE_ERROR), { status: 500 });
    }

    // 如果包含密码修改
    if (body.newPassword && body.oldPassword) {
      // 验证旧密码
      const { data: userData } = await client
        .from('users')
        .select('password_hash')
        .eq('phone', user.phone)
        .eq('role', 'parent')
        .single();

      if (userData?.password_hash) {
        const isValid = await bcrypt.compare(body.oldPassword, userData.password_hash);
        if (!isValid) {
          return NextResponse.json(error('旧密码错误', ErrorCode.VALIDATION_ERROR), { status: 400 });
        }

        // 更新密码
        const newPasswordHash = await bcrypt.hash(body.newPassword, 10);
        await client
          .from('users')
          .update({ password_hash: newPasswordHash, updated_at: new Date().toISOString() })
          .eq('phone', user.phone)
          .eq('role', 'parent');

        // 同步更新parents表
        await client
          .from('parents')
          .update({ password: body.newPassword })
          .eq('id', existingParent.id);
      }
    }

    // 获取更新后的数据
    const { data: updatedParent } = await client
      .from('parents')
      .select('*')
      .eq('id', existingParent.id)
      .single();

    return NextResponse.json({
      success: true,
      data: updatedParent,
      message: '更新成功',
    });
  } catch (err) {
    console.error('Failed to update parent info:', err);
    return NextResponse.json(error('更新家长信息失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
};

export const GET = protectedRoute(handleGetMyInfo);
export const PUT = protectedRoute(handleUpdateMyInfo);
