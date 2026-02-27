import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * GET - 获取德育活动列表
 * 查询参数：
 * - type: 活动类型
 * - status: 状态
 * - semester: 学期
 */
export async function GET(request: NextRequest) {
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

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const formattedData = (data || []).map((activity: any) => ({
      id: activity.id,
      title: activity.title,
      type: activity.type,
      date: activity.date,
      location: activity.location,
      participants: activity.participants || [],
      participantCount: activity.participant_count || 0,
      organizer: activity.organizer,
      status: activity.status,
      description: activity.description,
      images: activity.images || [],
      createdAt: activity.created_at,
    }));

    return NextResponse.json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error('Failed to fetch moral activities:', error);
    return NextResponse.json({
      success: false,
      error: '获取德育活动列表失败',
    }, { status: 500 });
  }
}

/**
 * POST - 创建德育活动
 */
export async function POST(request: NextRequest) {
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

    const { data, error } = await client
      .from('moral_activities')
      .insert({
        title,
        type,
        date,
        location,
        participants: participants || [],
        participant_count: participants?.length || 0,
        organizer,
        status: 'planned',
        description,
        images: images || [],
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Failed to create moral activity:', error);
    return NextResponse.json({
      success: false,
      error: '创建德育活动失败',
    }, { status: 500 });
  }
}

/**
 * PUT - 更新德育活动
 */
export async function PUT(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const { id, ...updates } = body;

    const updateData: any = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.date !== undefined) updateData.date = updates.date;
    if (updates.location !== undefined) updateData.location = updates.location;
    if (updates.participants !== undefined) {
      updateData.participants = updates.participants;
      updateData.participant_count = updates.participants.length;
    }
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.images !== undefined) updateData.images = updates.images;

    const { data, error } = await client
      .from('moral_activities')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Failed to update moral activity:', error);
    return NextResponse.json({
      success: false,
      error: '更新德育活动失败',
    }, { status: 500 });
  }
}
