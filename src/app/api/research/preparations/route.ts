import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * GET - 获取集体备课列表
 * 查询参数：
 * - page: 页码
 * - pageSize: 每页数量
 * - subject: 学科
 * - grade: 年级
 * - hostId: 主备人ID
 * - status: 状态
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const subject = searchParams.get('subject');
    const grade = searchParams.get('grade');
    const hostId = searchParams.get('hostId');
    const participantId = searchParams.get('participantId');
    const status = searchParams.get('status');

    let query = client
      .from('collective_preparations')
      .select('*', { count: 'exact' });

    if (subject) {
      query = query.eq('subject', subject);
    }
    if (grade) {
      query = query.eq('grade', parseInt(grade));
    }
    if (hostId) {
      query = query.eq('host_id', hostId);
    }
    if (participantId) {
      query = query.contains('participant_ids', [participantId]);
    }
    if (status) {
      query = query.eq('status', status);
    }

    // 分页
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);
    query = query.order('scheduled_date', { ascending: false });

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
    console.error('Failed to fetch collective preparations:', error);
    return NextResponse.json({
      success: false,
      error: '获取集体备课列表失败',
    }, { status: 500 });
  }
}

/**
 * POST - 创建集体备课
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const { data, error } = await client
      .from('collective_preparations')
      .insert({
        ...body,
        status: body.status || 'draft',
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
      message: '集体备课创建成功',
    });
  } catch (error) {
    console.error('Failed to create collective preparation:', error);
    return NextResponse.json({
      success: false,
      error: '创建集体备课失败',
    }, { status: 500 });
  }
}
