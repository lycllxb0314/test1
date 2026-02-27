import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * GET - 获取数据采集任务列表
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    let query = client
      .from('data_collection_tasks')
      .select('*')
      .order('deadline', { ascending: false });

    if (status) query = query.eq('status', status);
    if (type) query = query.eq('type', type);

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: (data || []).map((t: any) => ({
        id: t.id,
        title: t.title,
        type: t.type,
        description: t.description,
        deadline: t.deadline,
        targetRoles: t.target_roles || [],
        submittedCount: t.submitted_count || 0,
        totalCount: t.total_count || 0,
        status: t.status,
        createdBy: t.created_by,
        createdAt: t.created_at,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch data collection tasks:', error);
    return NextResponse.json({ success: false, error: '获取数据采集任务失败' }, { status: 500 });
  }
}

/**
 * POST - 创建数据采集任务
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const { data, error } = await client
      .from('data_collection_tasks')
      .insert({
        title: body.title,
        type: body.type,
        description: body.description,
        deadline: body.deadline,
        target_roles: body.targetRoles || [],
        total_count: body.totalCount || 0,
        status: 'active',
        created_by: body.createdBy,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Failed to create data collection task:', error);
    return NextResponse.json({ success: false, error: '创建数据采集任务失败' }, { status: 500 });
  }
}
