/**
 * 单个习惯目标 API
 * 
 * GET /api/habit/goals/[id] - 获取目标详情
 * PUT /api/habit/goals/[id] - 更新目标
 * DELETE /api/habit/goals/[id] - 删除目标
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;
    
    const { data, error } = await client
      .from('habit_goals')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    if (!data) {
      return NextResponse.json({ success: false, error: '目标不存在' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        category: data.category,
        code: data.code,
        title: data.title,
        description: data.description,
        gradeRange: data.grade_range,
        difficulty: data.difficulty,
        isActive: data.is_active,
        sortOrder: data.sort_order,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    });
  } catch (error) {
    console.error('Failed to fetch habit goal:', error);
    return NextResponse.json({ success: false, error: '获取目标详情失败' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;
    const body = await request.json();
    
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    
    if (body.category !== undefined) updateData.category = body.category;
    if (body.code !== undefined) updateData.code = body.code;
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.gradeRange !== undefined) updateData.grade_range = body.gradeRange;
    if (body.difficulty !== undefined) updateData.difficulty = body.difficulty;
    if (body.isActive !== undefined) updateData.is_active = body.isActive;
    if (body.sortOrder !== undefined) updateData.sort_order = body.sortOrder;
    
    const { data, error } = await client
      .from('habit_goals')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        category: data.category,
        code: data.code,
        title: data.title,
        description: data.description,
        gradeRange: data.grade_range,
        difficulty: data.difficulty,
        isActive: data.is_active,
        sortOrder: data.sort_order,
      },
      message: '更新成功',
    });
  } catch (error) {
    console.error('Failed to update habit goal:', error);
    return NextResponse.json({ success: false, error: '更新目标失败' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;
    
    const { error } = await client
      .from('habit_goals')
      .delete()
      .eq('id', id);
    
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: '删除成功',
    });
  } catch (error) {
    console.error('Failed to delete habit goal:', error);
    return NextResponse.json({ success: false, error: '删除目标失败' }, { status: 500 });
  }
}
