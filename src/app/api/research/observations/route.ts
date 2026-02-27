import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * GET - 获取听课评课列表
 * 查询参数：
 * - page: 页码
 * - pageSize: 每页数量
 * - teacherId: 被听课教师ID
 * - observerId: 听课人ID
 * - subject: 学科
 * - status: 状态
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const teacherId = searchParams.get('teacherId');
    const observerId = searchParams.get('observerId');
    const subject = searchParams.get('subject');
    const status = searchParams.get('status');

    let query = client
      .from('lesson_observations')
      .select('*', { count: 'exact' });

    if (teacherId) {
      query = query.eq('teacher_id', teacherId);
    }
    if (observerId) {
      query = query.contains('observer_ids', [observerId]);
    }
    if (subject) {
      query = query.eq('subject', subject);
    }
    if (status) {
      query = query.eq('status', status);
    }

    // 分页
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);
    query = query.order('date', { ascending: false });

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
    console.error('Failed to fetch lesson observations:', error);
    return NextResponse.json({
      success: false,
      error: '获取听课评课列表失败',
    }, { status: 500 });
  }
}

/**
 * POST - 创建听课评课
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    // 计算总分
    let overallScore = 0;
    if (body.evaluations && body.evaluations.length > 0) {
      overallScore = body.evaluations.reduce((sum: number, e: { score: number }) => sum + e.score, 0);
    }

    const { data, error } = await client
      .from('lesson_observations')
      .insert({
        ...body,
        overall_score: overallScore,
        status: body.status || 'scheduled',
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
      message: '听课评课创建成功',
    });
  } catch (error) {
    console.error('Failed to create lesson observation:', error);
    return NextResponse.json({
      success: false,
      error: '创建听课评课失败',
    }, { status: 500 });
  }
}
