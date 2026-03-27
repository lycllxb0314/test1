/**
 * 用户修改密码 API
 * 
 * 功能：
 * - POST /api/users/change-password: 修改密码
 * 
 * 两种模式：
 * 1. 用户修改自己的密码 - 需要 oldPassword + newPassword
 * 2. 管理员修改他人密码 - 需要 targetUserId + newPassword（无需旧密码）
 * 
 * 权限：
 * - 用户自己：需要验证旧密码
 * - 校长（principal）、教学副校长（academic_vice_principal）：可以修改教师和家长密码
 * - 兼任教务主任（academic_director）：可以修改教师和家长密码
 * - 兼任年段长（grade_leader）：可以修改本年段教师密码
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';
import type { AdministrativeRole } from '@/types';
import bcrypt from 'bcryptjs';

// 有权限修改他人密码的主要角色
const ADMIN_PRIMARY_ROLES = ['principal', 'academic_vice_principal'];

// 有权限修改他人密码的兼任职务
const ADMIN_ADDITIONAL_ROLES: AdministrativeRole[] = ['academic_director', 'grade_leader'];

/**
 * 检查用户是否有管理员权限
 */
function hasAdminPermission(user: { role: string; additionalRoles?: AdministrativeRole[] }): boolean {
  // 检查主要角色
  if (ADMIN_PRIMARY_ROLES.includes(user.role)) {
    return true;
  }
  // 检查兼任职务
  if (user.additionalRoles?.some(r => ADMIN_ADDITIONAL_ROLES.includes(r))) {
    return true;
  }
  return false;
}

/**
 * POST - 修改密码
 */
const handleChangePassword = async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const body = await request.json();
    const { oldPassword, newPassword, targetUserId, targetEmployeeId } = body;

    // 参数验证
    if (!newPassword) {
      return NextResponse.json(error('请输入新密码', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json(error('新密码长度不能少于6位', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }

    const client = getSupabaseClient();

    // 判断是修改自己还是修改他人
    const isModifyOthers = targetUserId || targetEmployeeId;
    
    if (isModifyOthers) {
      // === 管理员修改他人密码 ===
      
      // 权限检查
      if (!hasAdminPermission(user)) {
        return NextResponse.json(error('您没有权限修改他人密码', ErrorCode.FORBIDDEN), { status: 403 });
      }

      // 查询目标用户
      let targetUser;
      if (targetEmployeeId) {
        const { data, error: userError } = await client
          .from('users')
          .select('id, employee_id, role, name')
          .eq('employee_id', targetEmployeeId)
          .single();
        targetUser = data;
      } else {
        const { data, error: userError } = await client
          .from('users')
          .select('id, employee_id, role, name')
          .eq('id', targetUserId)
          .single();
        targetUser = data;
      }

      if (!targetUser) {
        return NextResponse.json(error('目标用户不存在', ErrorCode.NOT_FOUND), { status: 404 });
      }

      // 年段长只能修改教师（不能修改校长、副校长等领导）
      const isGradeLeader = user.additionalRoles?.includes('grade_leader');
      const isOnlyGradeLeader = !ADMIN_PRIMARY_ROLES.includes(user.role) && 
                                 !user.additionalRoles?.includes('academic_director') &&
                                 isGradeLeader;
      
      if (isOnlyGradeLeader) {
        // 年段长不能修改领导密码
        if (['principal', 'academic_vice_principal', 'moral_vice_principal', 'general_vice_principal', 'secretary'].includes(targetUser.role)) {
          return NextResponse.json(error('您没有权限修改该用户的密码', ErrorCode.FORBIDDEN), { status: 403 });
        }
      }

      // 加密新密码
      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      // 更新密码
      const { error: updateError } = await client
        .from('users')
        .update({
          password_hash: newPasswordHash,
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetUser.id);

      if (updateError) {
        return NextResponse.json(error('密码更新失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
      }

      // 同步更新 teachers 表
      if (targetUser.employee_id) {
        await client
          .from('teachers')
          .update({
            password: newPassword,
            updated_at: new Date().toISOString(),
          })
          .eq('employee_id', targetUser.employee_id);
      }

      return NextResponse.json({
        success: true,
        message: `已成功修改 ${targetUser.name} 的密码`,
      });

    } else {
      // === 用户修改自己的密码 ===
      
      if (!oldPassword) {
        return NextResponse.json(error('请输入旧密码', ErrorCode.VALIDATION_ERROR), { status: 400 });
      }

      if (oldPassword === newPassword) {
        return NextResponse.json(error('新密码不能与旧密码相同', ErrorCode.VALIDATION_ERROR), { status: 400 });
      }

      // 查询当前用户
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

      // 更新密码
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

      // 同步更新 teachers 表
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
    }
  } catch (err) {
    console.error('Change password error:', err);
    return NextResponse.json(error('密码修改失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
};

export const POST = protectedRoute(handleChangePassword);
