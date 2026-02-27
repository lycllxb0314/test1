import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * GET - 获取教研活动列表
 * 查询参数：
 * - page: 页码
 * - pageSize: 每页数量
 * - type: 活动类型
 * - department: 教研组
 * - status: 状态
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const type = searchParams.get('type');
    const department = searchParams.get('department');
    const status = searchParams.get('status');
    const teacherId = searchParams.get('teacherId');

    let query = client
      .from('research_activities')
      .select('*', { count: 'exact' });

    if (type) {
      query = query.eq('type', type);
    }
    if (department) {
      query = query.eq('department', department);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (teacherId) {
      // 查找参与者包含该教师的活动
      query = query.contains('participant_ids', [teacherId]);
    }

    // 分页
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);
    query = query.order('start_date', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        data: data || [],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    });
  } catch (error) {
    console.error('Failed to fetch research activities:', error);
    return NextResponse.json({
      success: false,
      error: '获取教研活动列表失败',
    }, { status: 500 });
  }
}

/**
 * POST - 创建教研活动
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const { data, error } = await client
      .from('research_activities')
      .insert({
        ...body,
        status: body.status || 'planning',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
      message: '教研活动创建成功',
    });
  } catch (error) {
    console.error('Failed to create research activity:', error);
    return NextResponse.json({
      success: false,
      error: '创建教研活动失败',
    }, { status: 500 });
  }
}
