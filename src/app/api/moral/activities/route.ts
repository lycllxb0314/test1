/**
 * 德育活动 API
 * 
 * 数据源：Supabase 数据库（唯一数据源）
 * v3.0: 移除Mock fallback，数据库失败时返回错误响应
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';
import { success, error, parseQueryParams, ErrorCode } from '@/lib/api-route-utils';

/**
 * GET - 获取德育活动列表
 */
const handleGetActivities = async (request: NextRequest, { user }: ExtendedRouteContext) => {
  const params = parseQueryParams(request);
  
  try {
    const client = getSupabaseClient();

    let query = client
      .from('moral_activities')
      .select('*')
      .order('date', { ascending: false });

    if (params.type) query = query.eq('type', params.type);
    if (params.status) query = query.eq('status', params.status);
    if (params.semester) query = query.eq('semester', params.semester);

    const { data, error: dbError } = await query;

    if (dbError) {
      return NextResponse.json(
        error('数据库查询失败', ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }

    const formattedData = (data || []).map((activity: Record<string, unknown>) => ({
      id: activity.id,
      title: activity.title,
      type: activity.type,
      date: activity.date,
      location: activity.location,
      participants: activity.participants || [],
      participantCount: (activity.participants as unknown[])?.length || 0,
      organizer: activity.organizer,
      status: activity.status,
      description: activity.description,
      images: activity.images || [],
      createdAt: activity.created_at,
    }));

    return NextResponse.json(success(formattedData));
  } catch (err) {
    console.error('Failed to fetch moral activities:', err);
    return NextResponse.json(
      error('获取德育活动列表失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
};

/**
 * POST - 创建德育活动
 */
const handleCreateActivity = async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const { title, type, date, location, participants, organizer, description, images } = body;

    if (!title || !type || !date) {
      return NextResponse.json(
        error('缺少必要参数', ErrorCode.VALIDATION_ERROR),
        { status: 400 }
      );
    }

    const { data, error: dbError } = await client
      .from('moral_activities')
      .insert({
        id: `ma-${Date.now()}`,
        title,
        type,
        date,
        location,
        participants: participants || [],
        participant_count: participants?.length || 0,
        organizer: organizer || user.name,
        status: 'planned',
        description,
        images: images || [],
        created_by: user.id,
      })
      .select()
      .single();

    if (dbError) {
      return NextResponse.json(
        error('创建德育活动失败: ' + dbError.message, ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }

    return NextResponse.json(success({
      id: data.id,
      title: data.title,
      type: data.type,
      date: data.date,
      status: data.status,
    }));
  } catch (err) {
    console.error('Failed to create moral activity:', err);
    return NextResponse.json(
      error('创建德育活动失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
};

/**
 * PUT - 更新德育活动
 */
const handleUpdateActivity = async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        error('缺少活动ID', ErrorCode.VALIDATION_ERROR),
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.date !== undefined) updateData.date = updates.date;
    if (updates.location !== undefined) updateData.location = updates.location;
    if (updates.participants !== undefined) {
      updateData.participants = updates.participants;
      updateData.participant_count = (updates.participants as unknown[]).length;
    }
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.images !== undefined) updateData.images = updates.images;

    const { data, error: dbError } = await client
      .from('moral_activities')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (dbError) {
      return NextResponse.json(
        error('更新德育活动失败: ' + dbError.message, ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }

    return NextResponse.json(success(data));
  } catch (err) {
    console.error('Failed to update moral activity:', err);
    return NextResponse.json(
      error('更新德育活动失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
};

// 导出受保护的路由处理器
export const GET = protectedRoute(handleGetActivities, { 
  module: 'moral', 
  permission: 'view',
  optional: true,
});

export const POST = protectedRoute(handleCreateActivity, { 
  module: 'moral', 
  permission: 'edit' 
});

export const PUT = protectedRoute(handleUpdateActivity, { 
  module: 'moral', 
  permission: 'edit' 
});
