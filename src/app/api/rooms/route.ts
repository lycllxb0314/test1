import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * GET - 获取教室列表
 * 查询参数：
 * - page: 页码
 * - pageSize: 每页数量
 * - type: 教室类型
 * - building: 教学楼
 * - status: 状态
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const type = searchParams.get('type');
    const building = searchParams.get('building');
    const status = searchParams.get('status');

    let query = client
      .from('rooms')
      .select('*', { count: 'exact' });

    if (type) {
      query = query.eq('type', type);
    }
    if (building) {
      query = query.eq('building', building);
    }
    if (status) {
      query = query.eq('status', status);
    }

    // 分页
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);
    query = query.order('name', { ascending: true });

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
    console.error('Failed to fetch rooms:', error);
    return NextResponse.json({
      success: false,
      error: '获取教室列表失败',
    }, { status: 500 });
  }
}

/**
 * POST - 创建教室
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const { data, error } = await client
      .from('rooms')
      .insert({
        ...body,
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
      message: '教室创建成功',
    });
  } catch (error) {
    console.error('Failed to create room:', error);
    return NextResponse.json({
      success: false,
      error: '创建教室失败',
    }, { status: 500 });
  }
}
