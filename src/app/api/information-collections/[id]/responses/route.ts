/**
 * 信息收集响应 API
 * 
 * GET: 获取响应列表（班主任）
 * POST: 提交响应（家长）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

// GET: 获取响应列表
export const GET = protectedRoute(async (
  request: NextRequest,
  context: ExtendedRouteContext
) => {
  try {
    const params = await context.params;
    const collectionId = params?.id;
    
    if (!collectionId) {
      return NextResponse.json({ success: false, error: '缺少信息收集ID' }, { status: 400 });
    }

    const client = getSupabaseClient();

    // 获取信息收集
    const { data: collection, error: collectionError } = await client
      .from('information_collections')
      .select('*')
      .eq('id', collectionId)
      .single();

    if (collectionError || !collection) {
      return NextResponse.json({ success: false, error: '信息收集不存在' }, { status: 404 });
    }

    // 权限检查：只有创建者可以查看响应
    if (collection.teacher_id !== context.user.id && context.user.role !== 'admin' as string) {
      return NextResponse.json({ success: false, error: '无权限查看响应' }, { status: 403 });
    }

    // 获取响应列表
    const { data: responses, error } = await client
      .from('information_collection_responses')
      .select(`
        id,
        collection_id,
        student_id,
        parent_id,
        parent_name,
        responses,
        submitted_at,
        created_at
      `)
      .eq('collection_id', collectionId)
      .order('submitted_at', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // 获取已提交的学生ID
    const submittedStudentIds = new Set((responses || []).map(r => r.student_id).filter(Boolean));

    // 获取班级所有学生
    const { data: allStudents } = await client
      .from('students')
      .select('id, name, class_id')
      .eq('class_id', collection.class_id);

    // 获取班级所有家长
    const { data: allParents } = await client
      .from('parents')
      .select('id, name, student_id, is_primary')
      .eq('class_id', collection.class_id);

    // 构建学生-家长映射
    const studentParentMap = new Map<string, { parentId: string; parentName: string; isPrimary: boolean }[]>();
    (allParents || []).forEach(p => {
      if (!studentParentMap.has(p.student_id)) {
        studentParentMap.set(p.student_id, []);
      }
      studentParentMap.get(p.student_id)!.push({
        parentId: p.id,
        parentName: p.name,
        isPrimary: p.is_primary || false,
      });
    });

    // 获取已提交学生的详细信息
    const studentIds = (responses || []).map(r => r.student_id).filter(Boolean);
    const { data: students } = studentIds.length > 0 
      ? await client.from('students').select('id, name').in('id', studentIds)
      : { data: [] };

    const studentMap = new Map((students || []).map(s => [s.id, s.name]));

    // 格式化已提交响应
    const formattedResponses = (responses || []).map(r => ({
      id: r.id,
      collectionId: r.collection_id,
      studentId: r.student_id,
      studentName: studentMap.get(r.student_id) || '未知',
      parentId: r.parent_id,
      parentName: r.parent_name,
      responses: r.responses,
      submittedAt: r.submitted_at,
      createdAt: r.created_at,
    }));

    // 找出未提交的学生
    const notSubmitted = (allStudents || [])
      .filter(s => !submittedStudentIds.has(s.id))
      .map(s => {
        const parents = studentParentMap.get(s.id) || [];
        const primaryParent = parents.find(p => p.isPrimary) || parents[0];
        return {
          studentId: s.id,
          studentName: s.name,
          parentId: primaryParent?.parentId || null,
          parentName: primaryParent?.parentName || '未绑定家长',
        };
      });

    return NextResponse.json({
      success: true,
      data: formattedResponses,
      notSubmitted,
      statistics: {
        total: (allStudents || []).length,
        submitted: formattedResponses.length,
        notSubmitted: notSubmitted.length,
      },
      collection: {
        id: collection.id,
        title: collection.title,
        fields: collection.fields,
      },
    });
  } catch (error) {
    console.error('Failed to fetch responses:', error);
    return NextResponse.json({ success: false, error: '获取响应列表失败' }, { status: 500 });
  }
});

// POST: 提交响应（家长）
export const POST = protectedRoute(async (
  request: NextRequest,
  context: ExtendedRouteContext
) => {
  try {
    const params = await context.params;
    const collectionId = params?.id;
    
    if (!collectionId) {
      return NextResponse.json({ success: false, error: '缺少信息收集ID' }, { status: 400 });
    }

    const client = getSupabaseClient();

    // 检查是否是家长
    if (context.user.role !== 'parent') {
      return NextResponse.json({ success: false, error: '只有家长可以提交响应' }, { status: 403 });
    }

    // 获取信息收集
    const { data: collection, error: collectionError } = await client
      .from('information_collections')
      .select('*')
      .eq('id', collectionId)
      .single();

    if (collectionError || !collection) {
      return NextResponse.json({ success: false, error: '信息收集不存在' }, { status: 404 });
    }

    // 检查状态
    if (collection.status !== 'published') {
      return NextResponse.json({ success: false, error: '该信息收集未发布或已关闭' }, { status: 400 });
    }

    // 检查截止时间
    if (collection.deadline && new Date(collection.deadline) < new Date()) {
      return NextResponse.json({ success: false, error: '该信息收集已截止' }, { status: 400 });
    }

    // 获取家长信息
    const { data: parentData, error: parentError } = await client
      .from('parents')
      .select('id, student_id, name')
      .eq('account_id', context.user.id)
      .single();

    if (parentError) {
      console.error('[信息收集响应] 查询家长失败:', parentError);
    }

    if (!parentData) {
      return NextResponse.json({ success: false, error: '未找到家长信息，请联系管理员确认账号绑定' }, { status: 400 });
    }

    // 检查是否已提交
    const { data: existingResponse } = await client
      .from('information_collection_responses')
      .select('id')
      .eq('collection_id', collectionId)
      .eq('parent_id', parentData.id)
      .single();

    if (existingResponse) {
      return NextResponse.json({ success: false, error: '您已提交过响应' }, { status: 400 });
    }

    const body = await request.json();
    const { responses } = body;

    if (!responses || Object.keys(responses).length === 0) {
      return NextResponse.json({ success: false, error: '请填写信息' }, { status: 400 });
    }

    // 验证必填字段
    const fields = collection.fields as Array<{ id: string; required: boolean; label: string }>;
    const missingFields = fields
      .filter(f => f.required && !responses[f.id])
      .map(f => f.label);

    if (missingFields.length > 0) {
      return NextResponse.json({ 
        success: false, 
        error: `请填写必填项：${missingFields.join('、')}` 
      }, { status: 400 });
    }

    // 提交响应
    const now = new Date().toISOString();
    const { error } = await client
      .from('information_collection_responses')
      .insert({
        collection_id: collectionId,
        student_id: parentData.student_id,
        parent_id: parentData.id,
        parent_name: parentData.name || context.user.name,
        responses,
        submitted_at: now,
        created_at: now,
      });

    if (error) {
      console.error('[信息收集响应] 插入失败:', error);
      return NextResponse.json({ success: false, error: `提交失败: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: '提交成功',
    });
  } catch (error: unknown) {
    console.error('[信息收集响应] 提交异常:', error);
    const message = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json({ 
      success: false, 
      error: `提交失败: ${message}` 
    }, { status: 500 });
  }
});
