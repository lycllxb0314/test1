/**
 * 获取家长子女列表 API
 * 
 * GET /api/parents/user/[id]/children - 获取指定用户ID对应家长的所有子女信息
 * 
 * 用于家长端获取绑定的学生列表
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { success, error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

/**
 * GET - 获取家长的所有子女
 */
const handleGetChildren = async (
  request: NextRequest, 
  context: ExtendedRouteContext
) => {
  try {
    const { user } = context;
    const params = await context.params;
    const userId = params?.id;
    
    if (!userId) {
      return NextResponse.json(error('缺少用户ID', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    // 验证用户只能访问自己的子女信息（校长可以查看所有）
    if (user.id !== userId && user.role !== 'principal') {
      return NextResponse.json(error('无权访问', ErrorCode.FORBIDDEN), { status: 403 });
    }

    const client = getSupabaseClient();

    // 先通过user_id查找家长记录
    // 如果parents表有user_id字段，直接用user_id查询
    // 否则通过users表的phone字段关联查询
    const { data: userRecord } = await client
      .from('users')
      .select('id, phone, role')
      .eq('id', userId)
      .single();

    if (!userRecord) {
      return NextResponse.json(error('用户不存在', ErrorCode.NOT_FOUND), { status: 404 });
    }

    // 优先使用account_id字段查询，如果没有则用phone
    // account_id 是开通账号时设置的关联字段
    const { data: parentsByAccountId, error: queryError } = await client
      .from('parents')
      .select('id, student_id, student_name, class_id, class_name, is_primary, relation, relation_name, account_id, phone')
      .eq('account_id', userId)
      .eq('status', 'active');

    if (queryError) {
      console.error('Query parents by account_id error:', queryError);
    }

    let parentRecords = parentsByAccountId;

    // 如果通过account_id没找到，尝试通过phone查询
    if (!parentRecords || parentRecords.length === 0) {
      if (userRecord.phone) {
        const { data: parentsByPhone, error: phoneQueryError } = await client
          .from('parents')
          .select('id, student_id, student_name, class_id, class_name, is_primary, relation, relation_name, account_id, phone')
          .eq('phone', userRecord.phone)
          .eq('status', 'active');
        
        if (phoneQueryError) {
          console.error('Query parents by phone error:', phoneQueryError);
        }
        
        parentRecords = parentsByPhone;
      }
    }

    if (!parentRecords || parentRecords.length === 0) {
      return NextResponse.json({
        success: true,
        children: [],
        message: '未绑定子女信息',
      });
    }

    // 获取学生详细信息
    const studentIds = parentRecords.map(p => p.student_id).filter(Boolean);
    const { data: students } = await client
      .from('students')
      .select('id, name, student_no, class_id, class_name, gender, birth_date, avatar, grade')
      .in('id', studentIds);

    // 组装子女列表
    const children = parentRecords.map(parent => {
      const student = students?.find(s => s.id === parent.student_id);
      return {
        id: parent.student_id,
        name: parent.student_name || student?.name || '',
        studentNumber: student?.student_no || '',
        className: parent.class_name || student?.class_name || '',
        gender: student?.gender,
        birthDate: student?.birth_date,
        avatar: student?.avatar,
        grade: student?.grade,
        parentId: parent.id,
        relation: parent.relation,
        relationName: parent.relation_name,
        isPrimary: parent.is_primary,
      };
    });

    return NextResponse.json({
      success: true,
      children,
    });
  } catch (err) {
    console.error('Failed to fetch children:', err);
    return NextResponse.json(error('获取子女信息失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
};

export const GET = protectedRoute(handleGetChildren);
