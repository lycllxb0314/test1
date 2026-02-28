/**
 * 德育活动 API
 * 
 * 使用统一的路由处理模式和认证保护
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';
import { success, error, ErrorCode } from '@/lib/api-route-utils';

/**
 * GET - 获取德育活动列表
 * 
 * 查询参数：
 * - type: 活动类型
 * - status: 状态
 * - semester: 学期
 * 
 * 权限要求：德育模块查看权限
 */
const handleGetActivities = async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const semester = searchParams.get('semester');

    let query = client
      .from('moral_activities')
      .select('*')
      .order('date', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (semester) {
      query = query.eq('semester', semester);
    }

    const { data, error: dbError } = await query;

    if (dbError) {
      console.log('Database query failed:', dbError.message);
      
      // 返回Mock数据
      return NextResponse.json({
        success: true,
        data: [],
        source: 'mock',
      });
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

    return NextResponse.json({
      success: true,
      data: formattedData,
      source: 'database',
    });
  } catch (err) {
    console.error('Failed to fetch moral activities:', err);
    return NextResponse.json({
      success: true,
      data: [],
      source: 'mock',
    });
  }
};

/**
 * POST - 创建德育活动
 * 
 * 权限要求：德育模块编辑权限
 */
const handleCreateActivity = async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const {
      title,
      type,
      date,
      location,
      participants,
      organizer,
      description,
      images,
    } = body;

    const { data, error: dbError } = await client
      .from('moral_activities')
      .insert({
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
      console.log('Database insert failed:', dbError.message);
      
      // 返回Mock成功响应
      return NextResponse.json({
        success: true,
        data: {
          id: `ma_${Date.now()}`,
          title,
          type,
          date,
          location,
          participants: participants || [],
          participantCount: participants?.length || 0,
          organizer: organizer || user.name,
          status: 'planned',
          description,
          images: images || [],
        },
        source: 'mock',
      });
    }

    return NextResponse.json({
      success: true,
      data,
      source: 'database',
    });
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
 * 
 * 权限要求：德育模块编辑权限
 */
const handleUpdateActivity = async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const { id, ...updates } = body;

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
      console.log('Database update failed:', dbError.message);
      
      return NextResponse.json({
        success: true,
        data: { id, ...updates },
        source: 'mock',
      });
    }

    return NextResponse.json({
      success: true,
      data,
      source: 'database',
    });
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
  optional: true, // 列表查询允许未登录访问（用于演示）
});

export const POST = protectedRoute(handleCreateActivity, { 
  module: 'moral', 
  permission: 'edit' 
});

export const PUT = protectedRoute(handleUpdateActivity, { 
  module: 'moral', 
  permission: 'edit' 
});
