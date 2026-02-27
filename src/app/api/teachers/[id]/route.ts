import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * GET - 获取教师详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;

    const { data, error } = await client
      .from('teachers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
      }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({
        success: false,
        error: '教师不存在',
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Failed to fetch teacher:', error);
    return NextResponse.json({
      success: false,
      error: '获取教师详情失败',
    }, { status: 500 });
  }
}

/**
 * PUT - 更新教师信息
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;
    const body = await request.json();

    const { data, error } = await client
      .from('teachers')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
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
      message: '教师信息更新成功',
    });
  } catch (error) {
    console.error('Failed to update teacher:', error);
    return NextResponse.json({
      success: false,
      error: '更新教师信息失败',
    }, { status: 500 });
  }
}

/**
 * DELETE - 删除教师
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;

    const { error } = await client
      .from('teachers')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: '教师删除成功',
    });
  } catch (error) {
    console.error('Failed to delete teacher:', error);
    return NextResponse.json({
      success: false,
      error: '删除教师失败',
    }, { status: 500 });
  }
}
