/**
 * 德育活动详情 API
 * 
 * GET: 获取活动详情
 * PUT: 更新活动（德育处）
 * DELETE: 删除活动（德育处）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

// 年级名称映射
const GRADE_NAMES = ['', '一年级', '二年级', '三年级', '四年级', '五年级', '六年级'];

// GET: 获取活动详情
export const GET = protectedRoute(async (
  request: NextRequest,
  context: ExtendedRouteContext
) => {
  try {
    const params = await context.params;
    const id = params?.id;
    
    if (!id) {
      return NextResponse.json({ success: false, error: '缺少活动ID' }, { status: 400 });
    }
    
    const client = getSupabaseClient();
    
    const { data: activity, error } = await client
      .from('moral_activities')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !activity) {
      return NextResponse.json({ success: false, error: '活动不存在' }, { status: 404 });
    }
    
    // 获取提交统计
    const { count: submissionCount } = await client
      .from('moral_activity_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('activity_id', id);
    
    const { count: pendingCount } = await client
      .from('moral_activity_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('activity_id', id)
      .eq('status', 'pending');
    
    const { count: submittedCount } = await client
      .from('moral_activity_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('activity_id', id)
      .eq('status', 'submitted');
    
    return NextResponse.json({
      success: true,
      data: {
        id: activity.id,
        title: activity.title,
        content: activity.content,
        targetGrades: activity.target_grades || [],
        targetGradeNames: (activity.target_grades || []).map((g: number) => GRADE_NAMES[g] || `${g}年级`),
        targetRoles: activity.target_roles || ['head_teacher', 'grade_leader'],
        requireSubmission: activity.require_submission,
        submissionConfig: activity.submission_config || {},
        deadline: activity.deadline,
        status: activity.status,
        createdBy: activity.created_by,
        createdByName: activity.created_by_name,
        createdAt: activity.created_at,
        updatedAt: activity.updated_at,
        publishedAt: activity.published_at,
        statistics: {
          submissions: submissionCount || 0,
          pending: pendingCount || 0,
          submitted: submittedCount || 0,
        },
      },
    });
  } catch (error) {
    console.error('Failed to fetch activity:', error);
    return NextResponse.json({ success: false, error: '获取活动详情失败' }, { status: 500 });
  }
});

// PUT: 更新活动
export const PUT = protectedRoute(async (
  request: NextRequest,
  context: ExtendedRouteContext
) => {
  try {
    const params = await context.params;
    const id = params?.id;
    
    if (!id) {
      return NextResponse.json({ success: false, error: '缺少活动ID' }, { status: 400 });
    }
    
    const client = getSupabaseClient();
    const body = await request.json();
    
    const {
      title,
      content,
      targetGrades,
      targetRoles,
      requireSubmission,
      submissionConfig,
      deadline,
      status,
    } = body;
    
    // 获取原活动信息
    const { data: existingActivity } = await client
      .from('moral_activities')
      .select('status, title, target_grades, target_roles')
      .eq('id', id)
      .single();
    
    if (!existingActivity) {
      return NextResponse.json({ success: false, error: '活动不存在' }, { status: 404 });
    }
    
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (targetGrades !== undefined) updateData.target_grades = targetGrades;
    if (targetRoles !== undefined) updateData.target_roles = targetRoles;
    if (requireSubmission !== undefined) updateData.require_submission = requireSubmission;
    if (submissionConfig !== undefined) updateData.submission_config = submissionConfig;
    if (deadline !== undefined) updateData.deadline = deadline || null;
    
    // 发布状态变更
    if (status === 'published' && existingActivity.status !== 'published') {
      updateData.status = 'published';
      updateData.published_at = new Date().toISOString();
      
      // 发送通知
      const { data: userData } = await client
        .from('users')
        .select('name')
        .eq('id', context.user.id)
        .single();
      
      await sendActivityNotification(client, {
        activityId: id,
        title: title || existingActivity.title,
        targetGrades: targetGrades || existingActivity.target_grades,
        targetRoles: targetRoles || existingActivity.target_roles,
        senderId: context.user.id,
        senderName: userData?.name || '德育处',
      });
    } else if (status !== undefined) {
      updateData.status = status;
    }
    
    const { error } = await client
      .from('moral_activities')
      .update(updateData)
      .eq('id', id);
    
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: '活动更新成功',
    });
  } catch (error) {
    console.error('Failed to update activity:', error);
    return NextResponse.json({ success: false, error: '更新活动失败' }, { status: 500 });
  }
});

// DELETE: 删除活动
export const DELETE = protectedRoute(async (
  request: NextRequest,
  context: ExtendedRouteContext
) => {
  try {
    const params = await context.params;
    const id = params?.id;
    
    if (!id) {
      return NextResponse.json({ success: false, error: '缺少活动ID' }, { status: 400 });
    }
    
    const client = getSupabaseClient();
    
    const { error } = await client
      .from('moral_activities')
      .delete()
      .eq('id', id);
    
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: '活动删除成功',
    });
  } catch (error) {
    console.error('Failed to delete activity:', error);
    return NextResponse.json({ success: false, error: '删除活动失败' }, { status: 500 });
  }
});

// 发送活动通知
async function sendActivityNotification(
  client: ReturnType<typeof getSupabaseClient>,
  params: {
    activityId: string;
    title: string;
    targetGrades: number[];
    targetRoles: string[];
    senderId: string;
    senderName: string;
  }
) {
  const { activityId, title, targetGrades, targetRoles, senderId, senderName } = params;
  
  const gradeNames = targetGrades.map(g => GRADE_NAMES[g] || `${g}年级`);
  
  // 获取目标年级的班主任和年段长
  const { data: targetUsers } = await client
    .from('users')
    .select('id, role, additional_roles, class_id')
    .or(`role.in.(${targetRoles.join(',')}),additional_roles.cs.[${targetRoles.map(r => `"${r}"`).join(',')}]`);
  
  if (!targetUsers || targetUsers.length === 0) return;
  
  const notifyUserIds: string[] = [];
  
  for (const u of targetUsers) {
    if (targetRoles.includes('grade_leader') && u.additional_roles?.includes('grade_leader')) {
      notifyUserIds.push(u.id);
    }
    
    if (targetRoles.includes('head_teacher') && u.role === 'head_teacher' && u.class_id) {
      const { data: classData } = await client
        .from('classes')
        .select('grade')
        .eq('id', u.class_id)
        .single();
      
      if (classData && targetGrades.includes(classData.grade)) {
        notifyUserIds.push(u.id);
      }
    }
  }
  
  const messages = [...new Set(notifyUserIds)].map(userId => ({
    title: `【德育活动】${title}`,
    content: `德育处发布了新的德育活动"${title}"，请及时查看${gradeNames.length > 0 ? `（涉及年级：${gradeNames.join('、')}）` : ''}`,
    type: 'activity',
    priority: 'high',
    sender_id: senderId,
    sender_name: senderName,
    sender_role: 'moral_director',
    recipient_id: userId,
    recipient_type: 'individual',
    metadata: { activityId, targetGrades },
    created_at: new Date().toISOString(),
    sent_at: new Date().toISOString(),
  }));
  
  if (messages.length > 0) {
    await client.from('messages').insert(messages);
  }
}
