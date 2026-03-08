/**
 * 德育活动提交 API
 * 
 * GET: 获取提交列表
 * POST: 创建/更新提交（班主任/年段长）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

// GET: 获取提交列表
const handleGetSubmissions = async (request: NextRequest, { user }: ExtendedRouteContext) => {
  const { searchParams } = new URL(request.url);
  const activityId = searchParams.get('activityId');
  const classId = searchParams.get('classId');
  const status = searchParams.get('status');
  const grade = searchParams.get('grade');
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '50');

  try {
    const client = getSupabaseClient();
    
    let query = client
      .from('moral_activity_submissions')
      .select('*', { count: 'exact' })
      .order('submitted_at', { ascending: false });
    
    if (activityId) {
      query = query.eq('activity_id', activityId);
    }
    
    if (classId) {
      query = query.eq('class_id', classId);
    }
    
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    
    if (grade && grade !== 'all') {
      query = query.eq('grade', parseInt(grade));
    }
    
    // 班主任只能看自己班级的提交
    if (user.role === 'head_teacher') {
      // 获取用户班级ID
      const { data: userData } = await client
        .from('users')
        .select('class_id')
        .eq('id', user.id)
        .single();
      
      if (userData?.class_id) {
        query = query.eq('class_id', userData.class_id);
      } else {
        return NextResponse.json({
          success: true,
          data: [],
          pagination: { page, pageSize, total: 0, totalPages: 0 },
        });
      }
    }
    
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);
    
    const { data, error, count } = await query;
    
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    const formattedData = (data || []).map(sub => ({
      id: sub.id,
      activityId: sub.activity_id,
      classId: sub.class_id,
      className: sub.class_name,
      grade: sub.grade,
      submitterId: sub.submitter_id,
      submitterName: sub.submitter_name,
      submitterRole: sub.submitter_role,
      textContent: sub.text_content,
      attachments: sub.attachments || [],
      status: sub.status,
      submittedAt: sub.submitted_at,
      reviewedAt: sub.reviewed_at,
      reviewedBy: sub.reviewed_by,
      reviewComment: sub.review_comment,
      createdAt: sub.created_at,
    }));
    
    return NextResponse.json({
      success: true,
      data: formattedData,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    });
  } catch (error) {
    console.error('Failed to fetch submissions:', error);
    return NextResponse.json({ success: false, error: '获取提交列表失败' }, { status: 500 });
  }
};

// POST: 创建/更新提交
const handleSubmit = async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    
    const {
      activityId,
      classId,
      textContent,
      attachments,
    } = body;
    
    if (!activityId || !classId) {
      return NextResponse.json({ success: false, error: '活动ID和班级ID为必填项' }, { status: 400 });
    }
    
    // 验证活动是否需要提交
    const { data: activity } = await client
      .from('moral_activities')
      .select('require_submission, deadline, status')
      .eq('id', activityId)
      .single();
    
    if (!activity) {
      return NextResponse.json({ success: false, error: '活动不存在' }, { status: 404 });
    }
    
    if (!activity.require_submission) {
      return NextResponse.json({ success: false, error: '该活动不需要提交材料' }, { status: 400 });
    }
    
    if (activity.status !== 'published') {
      return NextResponse.json({ success: false, error: '活动未发布，无法提交' }, { status: 400 });
    }
    
    // 检查截止时间
    if (activity.deadline && new Date(activity.deadline) < new Date()) {
      return NextResponse.json({ success: false, error: '已过截止时间，无法提交' }, { status: 400 });
    }
    
    // 获取班级信息
    const { data: classData } = await client
      .from('classes')
      .select('name, grade')
      .eq('id', classId)
      .single();
    
    // 获取用户信息
    const { data: userData } = await client
      .from('users')
      .select('name, role')
      .eq('id', user.id)
      .single();
    
    const now = new Date().toISOString();
    
    // 检查是否已存在提交
    const { data: existing } = await client
      .from('moral_activity_submissions')
      .select('id')
      .eq('activity_id', activityId)
      .eq('class_id', classId)
      .single();
    
    if (existing) {
      // 更新提交
      const { error } = await client
        .from('moral_activity_submissions')
        .update({
          text_content: textContent,
          attachments: attachments || [],
          status: 'submitted',
          submitted_at: now,
          updated_at: now,
        })
        .eq('id', existing.id);
      
      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        data: { id: existing.id },
        message: '提交更新成功',
      });
    } else {
      // 创建新提交
      const { data, error } = await client
        .from('moral_activity_submissions')
        .insert({
          activity_id: activityId,
          class_id: classId,
          class_name: classData?.name,
          grade: classData?.grade,
          submitter_id: user.id,
          submitter_name: userData?.name,
          submitter_role: userData?.role,
          text_content: textContent,
          attachments: attachments || [],
          status: 'submitted',
          submitted_at: now,
          created_at: now,
          updated_at: now,
        })
        .select('id')
        .single();
      
      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        data: { id: data.id },
        message: '提交成功',
      });
    }
  } catch (error) {
    console.error('Failed to submit:', error);
    return NextResponse.json({ success: false, error: '提交失败' }, { status: 500 });
  }
};

export const GET = protectedRoute(handleGetSubmissions);
export const POST = protectedRoute(handleSubmit);
