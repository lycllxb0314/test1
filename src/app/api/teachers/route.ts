import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * GET - 获取教师列表
 * 查询参数：
 * - page: 页码
 * - pageSize: 每页数量
 * - department: 部门
 * - subject: 学科
 * - status: 状态
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const department = searchParams.get('department');
    const subject = searchParams.get('subject');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let query = client
      .from('teachers')
      .select('*', { count: 'exact' });

    // 应用筛选条件
    if (department) {
      query = query.eq('department', department);
    }
    if (subject) {
      query = query.eq('subject', subject);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,employee_id.ilike.%${search}%`);
    }

    // 分页
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

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
    console.error('Failed to fetch teachers:', error);
    return NextResponse.json({
      success: false,
      error: '获取教师列表失败',
    }, { status: 500 });
  }
}

/**
 * POST - 创建教师
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const { data, error } = await client
      .from('teachers')
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
      message: '教师创建成功',
    });
  } catch (error) {
    console.error('Failed to create teacher:', error);
    return NextResponse.json({
      success: false,
      error: '创建教师失败',
    }, { status: 500 });
  }
}
