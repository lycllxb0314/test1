/**
 * 信息收集 API
 * 
 * GET: 获取信息收集列表
 * POST: 创建新的信息收集（班主任）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

// 表单字段类型
interface FormField {
  id: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'checkbox' | 'radio' | 'date';
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[];  // 用于 select, checkbox, radio
  defaultValue?: string;
}

// GET: 获取信息收集列表
const handleGetCollections = async (request: NextRequest, { user }: ExtendedRouteContext) => {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const classId = searchParams.get('classId');

  try {
    const client = getSupabaseClient();

    let query = client
      .from('information_collections')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // 班主任只能看自己班级的
    if (user.role === 'head_teacher') {
      // 获取班主任的班级
      const { data: userData } = await client
        .from('users')
        .select('class_id')
        .eq('id', user.id)
        .single();
      
      if (userData?.class_id) {
        query = query.eq('class_id', userData.class_id);
      }
    } else if (classId) {
      query = query.eq('class_id', classId);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // 获取每个收集的响应统计
    const collectionsWithStats = await Promise.all(
      (data || []).map(async (collection) => {
        const { count: responseCount } = await client
          .from('information_collection_responses')
          .select('*', { count: 'exact', head: true })
          .eq('collection_id', collection.id);

        return {
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
          responseCount: responseCount || 0,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: collectionsWithStats,
      total: count || 0,
    });
  } catch (error) {
    console.error('Failed to fetch information collections:', error);
    return NextResponse.json({ success: false, error: '获取信息收集列表失败' }, { status: 500 });
  }
};

// POST: 创建信息收集
const handleCreateCollection = async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const client = getSupabaseClient();

    // 只有班主任可以创建
    if (user.role !== 'head_teacher') {
      return NextResponse.json({ success: false, error: '只有班主任可以创建信息收集' }, { status: 403 });
    }

    // 获取教师信息
    const { data: userData } = await client
      .from('users')
      .select('name, class_id')
      .eq('id', user.id)
      .single();

    if (!userData?.class_id) {
      return NextResponse.json({ success: false, error: '未找到您的班级信息' }, { status: 400 });
    }

    const body = await request.json();
    const { title, description, fields, deadline, status = 'draft' } = body;

    if (!title || !fields || fields.length === 0) {
      return NextResponse.json({ success: false, error: '标题和字段为必填项' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const isPublishing = status === 'published';

    const { data, error } = await client
      .from('information_collections')
      .insert({
        title,
        description: description || '',
        class_id: userData.class_id,
        teacher_id: user.id,
        teacher_name: userData.name || '班主任',
        fields: fields,
        status,
        deadline: deadline || null,
        created_at: now,
        updated_at: now,
        published_at: isPublishing ? now : null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // 如果发布，发送消息通知家长
    if (isPublishing) {
      await sendNotificationToParents(client, {
        collectionId: data.id,
        title,
        classId: userData.class_id,
        teacherId: user.id,
        teacherName: userData.name || '班主任',
        deadline,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        title: data.title,
        status: data.status,
      },
      message: status === 'published' ? '信息收集发布成功，已通知家长' : '信息收集创建成功',
    });
  } catch (error) {
    console.error('Failed to create information collection:', error);
    return NextResponse.json({ success: false, error: '创建信息收集失败' }, { status: 500 });
  }
};

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

  if (!students || students.length === 0) {
    console.log('No students found for class:', classId);
    return;
  }

  const studentIds = students.map(s => s.id);

  // 获取家长账号
  const { data: parents } = await client
    .from('parents')
    .select('id, account_id, student_id, name')
    .in('student_id', studentIds);

  if (!parents || parents.length === 0) {
    console.log('No parents found for students');
    return;
  }

  // 过滤出有账号的家长
  const parentAccounts = parents.filter(p => p.account_id);
  
  if (parentAccounts.length === 0) {
    console.log('No parent accounts found');
    return;
  }

  // 创建消息
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

  const { error } = await client.from('messages').insert(messages);
  
  if (error) {
    console.error('Failed to send notifications to parents:', error);
  } else {
    console.log(`Sent information collection notification to ${messages.length} parents`);
  }
}

export const GET = protectedRoute(handleGetCollections);
export const POST = protectedRoute(handleCreateCollection);
