/**
 * 修改教师密码 API
 * 
 * 同时更新 users 表（加密存储）和 teachers 表
 * 
 * 架构：API Route → Service → Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { teacherService } from '@/services/teacher.service';
import { userService } from '@/services/user.service';
import { error, ErrorCode } from '@/lib/api';

/**
 * POST - 修改教师密码
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    // 获取教师信息
    const teacherResult = await teacherService.getTeacher(id);
    if (!teacherResult.success || !teacherResult.data) {
      return NextResponse.json({
        success: false,
        error: '教师不存在',
      }, { status: 404 });
    }

    const teacher = teacherResult.data;
    const employeeId = (teacher as any).employee_id;

    // 更新 teachers 表密码
    const updateResult = await teacherService.updatePassword(id, newPassword);
    if (!updateResult.success) {
      console.error('Failed to update teacher password');
    }

    // 同步更新 users 表（如果有对应账号）
    if (employeeId) {
      const userResult = await userService.changePasswordWithAuth({
        userId: '',
        employeeId,
        newPassword,
        userRoles: [],
        additionalRoles: [],
      });
      // users 表更新失败只记录日志，不返回错误（可能用户不存在）
      if (!userResult.success) {
        console.error('Failed to sync password to users table');
      }
    }

    return NextResponse.json({
      success: true,
      message: '密码修改成功',
    });
  } catch (err) {
    console.error('Failed to update password:', err);
    return NextResponse.json({
      success: false,
      error: '密码修改失败',
    }, { status: 500 });
  }
}
