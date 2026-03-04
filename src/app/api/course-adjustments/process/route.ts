/**
 * 调课处理 API
 * 
 * 年段长使用：
 * - 获取待处理调课列表
 * - 安排代课教师
 * - 更新调课状态
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';
import { success, error, ErrorCode } from '@/lib/api-route-utils';

/**
 * GET - 获取调课列表
 * 
 * Query params:
 * - status: 状态筛选
 * - applicantId: 申请人筛选
 * - effectiveWeek: 生效周筛选
 */
export const GET = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    let query = client
      .from('course_adjustments')
      .select('*')
      .order('created_at', { ascending: false });
    
    const status = searchParams.get('status');
    const applicantId = searchParams.get('applicantId');
    const effectiveWeek = searchParams.get('effectiveWeek');
    
    if (status) {
      query = query.eq('status', status);
    }
    if (applicantId) {
      query = query.eq('applicant_id', applicantId);
    }
    if (effectiveWeek) {
      query = query.eq('effective_week', effectiveWeek);
    }
    
    const { data, error: dbError } = await query;
    
    if (dbError) {
      console.error('获取调课列表失败:', dbError);
      return NextResponse.json(error('获取调课列表失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    return NextResponse.json(success(data || [], 'database'));
    
  } catch (err) {
    console.error('获取调课列表失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

/**
 * POST - 处理调课（安排代课教师）
 */
export const POST = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    
    const { adjustmentId, action, substituteEmployeeId, substituteName, remark } = body;
    
    if (!adjustmentId) {
      return NextResponse.json(error('缺少调课记录ID', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    // 获取调课记录
    const { data: adjustment, error: fetchError } = await client
      .from('course_adjustments')
      .select('*')
      .eq('id', adjustmentId)
      .single();
    
    if (fetchError || !adjustment) {
      return NextResponse.json(error('调课记录不存在', ErrorCode.NOT_FOUND), { status: 404 });
    }
    
    // 更新调课记录
    const updateData: Record<string, any> = {
      status: 'completed',
      adjuster_id: user.employeeId,
      adjuster_name: user.name,
      updated_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      sync_status: {
        scheduleUpdated: true,
        workloadUpdated: false,
        notificationSent: false,
      },
    };
    
    if (action === 'substitute') {
      if (!substituteEmployeeId || !substituteName) {
        return NextResponse.json(error('请选择代课教师', ErrorCode.VALIDATION_ERROR), { status: 400 });
      }
      updateData.adjust_type = 'substitute';
      updateData.substitute_employee_id = substituteEmployeeId;
      updateData.substitute_name = substituteName;
      updateData.adjust_result = {
        type: 'substitute',
        substituteEmployeeId,
        substituteName,
      };
    } else if (action === 'cancel') {
      updateData.adjust_type = 'cancel';
      updateData.adjust_result = {
        type: 'cancel',
      };
    }
    
    if (remark) {
      updateData.reason = remark;
    }
    
    const { error: updateError } = await client
      .from('course_adjustments')
      .update(updateData)
      .eq('id', adjustmentId);
    
    if (updateError) {
      console.error('更新调课记录失败:', updateError);
      return NextResponse.json(error('更新调课记录失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    // 更新请假申请的调课状态
    if (adjustment.leave_request_id) {
      // 检查是否所有调课都已完成
      const { data: pendingCount } = await client
        .from('course_adjustments')
        .select('id', { count: 'exact', head: true })
        .eq('leave_request_id', adjustment.leave_request_id)
        .eq('status', 'pending');
      
      if (!pendingCount || pendingCount.length === 0) {
        // 所有调课已完成
        await client
          .from('leave_requests')
          .update({
            adjustment_status: 'completed',
            adjusted_by: user.employeeId,
            adjusted_at: new Date().toISOString(),
          })
          .eq('id', adjustment.leave_request_id);
      }
    }
    
    // 发送通知
    if (action === 'substitute') {
      // 通知代课教师
      await client.from('messages').insert({
        title: '代课通知',
        content: `${adjustment.applicant_name}请假，您被安排于${adjustment.effective_week}周${adjustment.week_day === 1 ? '一' : adjustment.week_day === 2 ? '二' : adjustment.week_day === 3 ? '三' : adjustment.week_day === 4 ? '四' : '五'}第${adjustment.period_index + 1}节代课${adjustment.subject}，班级：${adjustment.class_name}。`,
        event: 'course_adjustment',
        priority: 'high',
        sender_id: user.employeeId,
        sender_name: user.name,
        sender_role: user.role,
        recipient_id: substituteEmployeeId,
        metadata: {
          adjustmentId,
          classId: adjustment.class_id,
          weekDay: adjustment.week_day,
          periodIndex: adjustment.period_index,
        },
      });
      
      // 通知请假教师
      await client.from('messages').insert({
        title: '调课安排完成',
        content: `您${adjustment.effective_week}周${adjustment.week_day === 1 ? '一' : adjustment.week_day === 2 ? '二' : adjustment.week_day === 3 ? '三' : adjustment.week_day === 4 ? '四' : '五'}第${adjustment.period_index + 1}节的${adjustment.subject}课已安排${substituteName}代课。`,
        event: 'course_adjustment',
        priority: 'normal',
        sender_id: user.employeeId,
        sender_name: user.name,
        sender_role: user.role,
        recipient_id: adjustment.applicant_id,
        metadata: {
          adjustmentId,
          substituteEmployeeId,
          substituteName,
        },
      });
    }
    
    // 更新同步状态
    await client
      .from('course_adjustments')
      .update({
        sync_status: {
          scheduleUpdated: true,
          workloadUpdated: true,
          notificationSent: true,
        },
      })
      .eq('id', adjustmentId);
    
    return NextResponse.json(success({ adjustmentId, status: 'completed' }, 'database'));
    
  } catch (err) {
    console.error('处理调课失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
