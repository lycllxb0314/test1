/**
 * 德育活动提交审核 API
 * 
 * PUT: 审核提交（德育处）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';
import { getMergedPermissions } from '@/lib/auth/permissions';
import type { AdministrativeRole, UserGroupMembership } from '@/types';

// 检查用户是否有德育管理权限（考虑群组权限）
async function checkMoralAccess(
  client: ReturnType<typeof getSupabaseClient>,
  userId: string,
  userRole: string
): Promise<{ canManage: boolean; canView: boolean }> {
  // 获取用户的兼任职务和群组信息
  const { data: userData } = await client
    .from('users')
    .select('additional_roles, groups')
    .eq('id', userId)
    .single();
  
  const additionalRoles = (userData?.additional_roles as AdministrativeRole[]) || [];
  const groups = (userData?.groups as UserGroupMembership[]) || [];
  
  // 使用统一的权限检查函数
  const permissions = getMergedPermissions(
    userRole as any,
    additionalRoles,
    groups
  );
  
  const moralPermissions = permissions['moral'] || [];
  
  return {
    canManage: moralPermissions.includes('admin') || moralPermissions.includes('manage') || moralPermissions.includes('edit'),
    canView: moralPermissions.length > 0,
  };
}

// PUT: 审核提交
export const PUT = protectedRoute(async (
  request: NextRequest,
  context: ExtendedRouteContext
) => {
  try {
    const params = await context.params;
    const id = params?.id;
    
    if (!id) {
      return NextResponse.json({ success: false, error: '缺少提交ID' }, { status: 400 });
    }
    
    const client = getSupabaseClient();
    
    // 检查用户是否有德育管理权限
    const { canManage } = await checkMoralAccess(client, context.user.id, context.user.role);
    if (!canManage) {
      return NextResponse.json({ success: false, error: '无权限审核提交' }, { status: 403 });
    }
    
    const body = await request.json();
    
    const { status, reviewComment } = body;
    
    if (!status || !['reviewed', 'rejected'].includes(status)) {
      return NextResponse.json({ success: false, error: '请选择审核状态' }, { status: 400 });
    }
    
    const now = new Date().toISOString();
    
    const { error } = await client
      .from('moral_activity_submissions')
      .update({
        status,
        review_comment: reviewComment || null,
        reviewed_by: context.user.id,
        reviewed_at: now,
        updated_at: now,
      })
      .eq('id', id);
    
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: status === 'reviewed' ? '审核通过' : '已驳回',
    });
  } catch (error) {
    console.error('Failed to review submission:', error);
    return NextResponse.json({ success: false, error: '审核失败' }, { status: 500 });
  }
});

// GET: 获取单个提交详情
export const GET = protectedRoute(async (
  request: NextRequest,
  context: ExtendedRouteContext
) => {
  try {
    const params = await context.params;
    const id = params?.id;
    
    if (!id) {
      return NextResponse.json({ success: false, error: '缺少提交ID' }, { status: 400 });
    }
    
    const client = getSupabaseClient();
    
    const { data: submission, error } = await client
      .from('moral_activity_submissions')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !submission) {
      return NextResponse.json({ success: false, error: '提交记录不存在' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        id: submission.id,
        activityId: submission.activity_id,
        classId: submission.class_id,
        className: submission.class_name,
        grade: submission.grade,
        submitterId: submission.submitter_id,
        submitterName: submission.submitter_name,
        submitterRole: submission.submitter_role,
        textContent: submission.text_content,
        attachments: submission.attachments || [],
        status: submission.status,
        submittedAt: submission.submitted_at,
        reviewedAt: submission.reviewed_at,
        reviewedBy: submission.reviewed_by,
        reviewComment: submission.review_comment,
        createdAt: submission.created_at,
      },
    });
  } catch (error) {
    console.error('Failed to fetch submission:', error);
    return NextResponse.json({ success: false, error: '获取提交详情失败' }, { status: 500 });
  }
});
