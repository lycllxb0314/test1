/**
 * 德育活动 API
 * 
 * GET: 获取活动列表
 * POST: 创建新活动（德育处）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

// 年级名称映射
const GRADE_NAMES = ['', '一年级', '二年级', '三年级', '四年级', '五年级', '六年级'];

// GET: 获取活动列表
const handleGetActivities = async (request: NextRequest, { user }: ExtendedRouteContext) => {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const grade = searchParams.get('grade');
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');

  try {
    const client = getSupabaseClient();
    
    let query = client
      .from('moral_activities')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });
    
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    
    // 检查用户是否有德育管理权限
    // 权限包括：校长、书记、德育副校长、德育主任
    const additionalRoles = (user as any).additionalRoles as string[] | undefined;
    const hasMoralAccess = 
      user.role === 'principal' || 
      user.role === 'secretary' || 
      user.role === 'moral_vice_principal' ||
      (additionalRoles?.includes('moral_director') ?? false);
    
    // 非德育处用户只能看已发布的活动
    if (!hasMoralAccess) {
      query = query.eq('status', 'published');
      
      // 按年级筛选
      if (grade && grade !== 'all') {
        const gradeNum = parseInt(grade);
        query = query.contains('target_grades', [gradeNum]);
      }
    }
    
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);
    
    const { data, error, count } = await query;
    
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    // 格式化数据
    const formattedData = (data || []).map(activity => ({
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
    console.error('Failed to fetch activities:', error);
    return NextResponse.json({ success: false, error: '获取活动列表失败' }, { status: 500 });
  }
};

// POST: 创建活动
const handleCreateActivity = async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    
    const {
      title,
      content,
      targetGrades = [],
      targetRoles = ['head_teacher', 'grade_leader'],
      requireSubmission = false,
      submissionConfig = {},
      deadline,
      status = 'draft',
    } = body;
    
    if (!title || !content) {
      return NextResponse.json({ success: false, error: '标题和内容为必填项' }, { status: 400 });
    }
    
    // 获取创建者信息
    const { data: userData } = await client
      .from('users')
      .select('name')
      .eq('id', user.id)
      .single();
    
    const now = new Date().toISOString();
    const isPublishing = status === 'published';
    
    const { data, error } = await client
      .from('moral_activities')
      .insert({
        title,
        content,
        target_grades: targetGrades,
        target_roles: targetRoles,
        require_submission: requireSubmission,
        submission_config: submissionConfig,
        deadline: deadline || null,
        status,
        created_by: user.id,
        created_by_name: userData?.name || '德育处',
        created_at: now,
        updated_at: now,
        published_at: isPublishing ? now : null,
      })
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    // 如果发布活动，发送消息通知
    if (isPublishing && targetGrades.length > 0) {
      await sendActivityNotification(client, {
        activityId: data.id,
        title,
        targetGrades,
        targetRoles,
        senderId: user.id,
        senderName: userData?.name || '德育处',
      });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        title: data.title,
        status: data.status,
      },
      message: status === 'published' ? '活动发布成功' : '活动创建成功',
    });
  } catch (error) {
    console.error('Failed to create activity:', error);
    return NextResponse.json({ success: false, error: '创建活动失败' }, { status: 500 });
  }
};

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
  
  // 获取目标年级的班主任和年段长
  const gradeNames = targetGrades.map(g => GRADE_NAMES[g] || `${g}年级`);
  
  // 查询目标用户
  const { data: targetUsers } = await client
    .from('users')
    .select('id, role, additional_roles, class_id')
    .or(`role.in.(${targetRoles.join(',')}),additional_roles.cs.[${targetRoles.map(r => `"${r}"`).join(',')}]`);
  
  if (!targetUsers || targetUsers.length === 0) return;
  
  // 筛选符合年级的用户
  const notifyUserIds: string[] = [];
  
  for (const u of targetUsers) {
    // 年段长检查
    if (targetRoles.includes('grade_leader') && u.additional_roles?.includes('grade_leader')) {
      // 这里需要查询年段长负责的年级
      // 简化处理：通知所有年段长
      notifyUserIds.push(u.id);
    }
    
    // 班主任检查
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
  
  // 为每个用户创建消息
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

export const GET = protectedRoute(handleGetActivities);
export const POST = protectedRoute(handleCreateActivity);
