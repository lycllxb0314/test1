/**
 * 家长端信息收集列表 API
 * 
 * GET: 获取家长需要填写的信息收集列表
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

// GET: 获取家长的信息收集列表
export const GET = protectedRoute(async (
  request: NextRequest,
  { user }: ExtendedRouteContext
) => {
  try {
    if (user.role !== 'parent') {
      return NextResponse.json({ success: false, error: '只有家长可以访问' }, { status: 403 });
    }

    const client = getSupabaseClient();

    // 获取家长信息
    const { data: parentData } = await client
      .from('parents')
      .select('id, student_id, class_id')
      .eq('account_id', user.id)
      .single();

    if (!parentData) {
      return NextResponse.json({ success: false, error: '未找到家长信息' }, { status: 400 });
    }

    // 获取班级的信息收集
    const { data: collections, error } = await client
      .from('information_collections')
      .select('*')
      .eq('class_id', parentData.class_id)
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // 获取已提交的响应
    const { data: responses } = await client
      .from('information_collection_responses')
      .select('collection_id, submitted_at')
      .eq('parent_id', parentData.id);

    const submittedMap = new Map(
      (responses || []).map(r => [r.collection_id, r.submitted_at])
    );

    // 格式化结果
    const result = (collections || []).map(c => ({
      id: c.id,
      title: c.title,
      description: c.description,
      teacherName: c.teacher_name,
      deadline: c.deadline,
      publishedAt: c.published_at,
      fields: c.fields,
      submitted: submittedMap.has(c.id),
      submittedAt: submittedMap.get(c.id),
      isExpired: c.deadline && new Date(c.deadline) < new Date(),
    }));

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Failed to fetch parent collections:', error);
    return NextResponse.json({ success: false, error: '获取信息收集列表失败' }, { status: 500 });
  }
});
