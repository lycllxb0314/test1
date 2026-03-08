/**
 * 信息收集详情 API
 * 
 * GET: 获取信息收集详情
 * PUT: 更新信息收集（班主任）
 * DELETE: 删除信息收集（班主任）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

// GET: 获取信息收集详情
export const GET = protectedRoute(async (
  request: NextRequest,
  context: ExtendedRouteContext
) => {
  try {
    const params = await context.params;
    const id = params?.id;
    
    if (!id) {
      return NextResponse.json({ success: false, error: '缺少信息收集ID' }, { status: 400 });
    }

    const client = getSupabaseClient();

    const { data: collection, error } = await client
      .from('information_collections')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !collection) {
      return NextResponse.json({ success: false, error: '信息收集不存在' }, { status: 404 });
    }

    // 获取响应统计
    const { count: responseCount } = await client
      .from('information_collection_responses')
      .select('*', { count: 'exact', head: true })
      .eq('collection_id', id);

    // 获取班级学生总数
    const { count: studentCount } = await client
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('class_id', collection.class_id);

    return NextResponse.json({
      success: true,
      data: {
        id: collection.id,
        title: collection.title,
        description: collection.description,
        classId: collection.class_id,
        teacherId: collection.teacher_id,
        teacherName: collection.teacher_name,
        fields: collection.fields,
        status: collection.status,
        deadline: collection.deadline,
        createdAt: collection.created_at,
        updatedAt: collection.updated_at,
        publishedAt: collection.published_at,
        statistics: {
          responses: responseCount || 0,
          students: studentCount || 0,
          rate: studentCount ? Math.round(((responseCount || 0) / studentCount) * 100) : 0,
        },
      },
    });
  } catch (error) {
    console.error('Failed to fetch information collection:', error);
    return NextResponse.json({ success: false, error: '获取信息收集详情失败' }, { status: 500 });
  }
});

// PUT: 更新信息收集
export const PUT = protectedRoute(async (
  request: NextRequest,
  context: ExtendedRouteContext
) => {
  try {
    const params = await context.params;
    const id = params?.id;
    
    if (!id) {
      return NextResponse.json({ success: false, error: '缺少信息收集ID' }, { status: 400 });
    }

    const client = getSupabaseClient();

    // 检查权限
    const { data: existing } = await client
      .from('information_collections')
      .select('teacher_id, status')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json({ success: false, error: '信息收集不存在' }, { status: 404 });
    }

    if (existing.teacher_id !== context.user.id && context.user.role !== 'admin' as string) {
      return NextResponse.json({ success: false, error: '无权限编辑此信息收集' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, fields, deadline, status } = body;

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (fields !== undefined) updateData.fields = fields;
    if (deadline !== undefined) updateData.deadline = deadline || null;

    // 发布状态变更
    if (status === 'published' && existing.status !== 'published') {
      updateData.status = 'published';
      updateData.published_at = new Date().toISOString();

      // 获取信息收集详情并发送通知
      const { data: userData } = await client
        .from('users')
        .select('name, class_id')
        .eq('id', context.user.id)
        .single();

      const collectionTitle = title || (await client.from('information_collections').select('title').eq('id', id).single()).data?.title;

      if (userData?.class_id) {
        await sendNotificationToParents(client, {
          collectionId: id,
          title: collectionTitle || '信息收集',
          classId: userData.class_id,
          teacherId: context.user.id,
          teacherName: userData.name || '班主任',
          deadline,
        });
      }
    } else if (status !== undefined) {
      updateData.status = status;
    }

    const { error } = await client
      .from('information_collections')
      .update(updateData)
      .eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: '信息收集更新成功',
    });
  } catch (error) {
    console.error('Failed to update information collection:', error);
    return NextResponse.json({ success: false, error: '更新信息收集失败' }, { status: 500 });
  }
});

// DELETE: 删除信息收集
export const DELETE = protectedRoute(async (
  request: NextRequest,
  context: ExtendedRouteContext
) => {
  try {
    const params = await context.params;
    const id = params?.id;
    
    if (!id) {
      return NextResponse.json({ success: false, error: '缺少信息收集ID' }, { status: 400 });
    }

    const client = getSupabaseClient();

    // 检查权限
    const { data: existing } = await client
      .from('information_collections')
      .select('teacher_id')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json({ success: false, error: '信息收集不存在' }, { status: 404 });
    }

    if (existing.teacher_id !== context.user.id && context.user.role !== 'admin' as string) {
      return NextResponse.json({ success: false, error: '无权限删除此信息收集' }, { status: 403 });
    }

    const { error } = await client
      .from('information_collections')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: '信息收集删除成功',
    });
  } catch (error) {
    console.error('Failed to delete information collection:', error);
    return NextResponse.json({ success: false, error: '删除信息收集失败' }, { status: 500 });
  }
});

// 发送通知给家长
async function sendNotificationToParents(
  client: ReturnType<typeof getSupabaseClient>,
  params: {
    collectionId: string;
    title: string;
    classId: string;
    teacherId: string;
    teacherName: string;
    deadline?: string;
  }
) {
  const { collectionId, title, classId, teacherId, teacherName, deadline } = params;

  // 获取班级学生的家长账号
  const { data: students } = await client
    .from('students')
    .select('id, name')
    .eq('class_id', classId);

  if (!students || students.length === 0) return;

  const studentIds = students.map(s => s.id);

  // 获取家长账号
  const { data: parents } = await client
    .from('parents')
    .select('id, account_id, student_id, name')
    .in('student_id', studentIds);

  if (!parents || parents.length === 0) return;

  const parentAccounts = parents.filter(p => p.account_id);
  if (parentAccounts.length === 0) return;

  const messages = parentAccounts.map(parent => ({
    title: `【信息收集】${title}`,
    content: `班主任${teacherName}发布了一项信息收集"${title}"，请及时填写。${deadline ? `截止时间：${new Date(deadline).toLocaleDateString()}` : ''}`,
    type: 'information_collection',
    priority: 'high',
    sender_id: teacherId,
    sender_name: teacherName,
    sender_role: 'head_teacher',
    recipient_id: parent.account_id,
    recipient_type: 'individual',
    metadata: { collectionId, classId },
    created_at: new Date().toISOString(),
    sent_at: new Date().toISOString(),
  }));

  await client.from('messages').insert(messages);
}
