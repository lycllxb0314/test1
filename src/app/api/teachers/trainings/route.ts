/**
 * 教师培训 API
 * 
 * GET: 获取教师培训列表
 * POST: 添加教师培训
 * PUT: 更新教师培训
 * DELETE: 删除教师培训
 * 
 * 数据来源：使用 lib/mock/teachers.mock.ts 统一数据源
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { 
  MOCK_TEACHER_TRAININGS, 
  getMockTeacherTrainings 
} from '@/lib/mock/teachers.mock';
import type { TeacherTraining } from '@/types';

/**
 * GET - 获取教师培训列表
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    const client = getSupabaseClient();
    
    let query = client
      .from('teacher_trainings')
      .select('*')
      .order('start_date', { ascending: false });

    if (teacherId) query = query.eq('teacher_id', teacherId);
    if (type) query = query.eq('type', type);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      // 使用统一 Mock 数据
      const mockData = getMockTeacherTrainings({
        teacherId: teacherId || undefined,
        type: type || undefined,
        status: status || undefined,
      });

      return NextResponse.json({ 
        success: true, 
        data: mockData, 
        source: 'mock' 
      });
    }

    const formattedData: TeacherTraining[] = (data || []).map((training: Record<string, unknown>) => ({
      id: training.id as string,
      teacherId: training.teacher_id as string,
      name: training.name as string,
      type: training.type as '校内培训' | '区级培训' | '市级培训' | '省级培训' | '国家级培训',
      organizer: training.organizer as string,
      startDate: training.start_date as string,
      endDate: training.end_date as string,
      hours: training.hours as number,
      status: training.status as '进行中' | '已完成' | '未通过',
      certificate: training.certificate as string,
      notes: training.notes as string,
    }));

    return NextResponse.json({ 
      success: true, 
      data: formattedData, 
      source: 'database' 
    });
  } catch (error) {
    console.error('Failed to fetch teacher trainings:', error);
    // 兜底：返回统一 Mock 数据
    return NextResponse.json({ 
      success: true, 
      data: getMockTeacherTrainings(), 
      source: 'mock' 
    });
  }
}

/**
 * POST - 添加教师培训
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    const { teacherId, name, type, organizer, startDate, endDate, hours, status, certificate, notes } = body;

    const { data, error } = await client
      .from('teacher_trainings')
      .insert({
        teacher_id: teacherId,
        name,
        type,
        organizer,
        start_date: startDate,
        end_date: endDate,
        hours: hours || 0,
        status: status || '进行中',
        certificate,
        notes,
      })
      .select()
      .single();

    if (error) {
      // 返回 Mock 创建结果
      return NextResponse.json({
        success: true,
        data: { 
          id: `t-${Date.now()}`, 
          teacherId, 
          name, 
          type, 
          organizer, 
          startDate, 
          endDate, 
          hours: hours || 0, 
          status: status || '进行中', 
          certificate, 
          notes 
        },
        source: 'mock',
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        teacherId: data.teacher_id,
        name: data.name,
        type: data.type,
        organizer: data.organizer,
        startDate: data.start_date,
        endDate: data.end_date,
        hours: data.hours,
        status: data.status,
        certificate: data.certificate,
        notes: data.notes,
      },
      source: 'database',
    });
  } catch (error) {
    console.error('Failed to create teacher training:', error);
    return NextResponse.json({ 
      success: false, 
      error: '添加培训失败' 
    }, { status: 500 });
  }
}

/**
 * PUT - 更新教师培训
 */
export async function PUT(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    const { id, name, type, organizer, startDate, endDate, hours, status, certificate, notes } = body;

    const { data, error } = await client
      .from('teacher_trainings')
      .update({
        name,
        type,
        organizer,
        start_date: startDate,
        end_date: endDate,
        hours,
        status,
        certificate,
        notes,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({
        success: true,
        data: { id, name, type, organizer, startDate, endDate, hours, status, certificate, notes },
        source: 'mock',
      });
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        id: data.id,
        teacherId: data.teacher_id,
        name: data.name,
        type: data.type,
        organizer: data.organizer,
        startDate: data.start_date,
        endDate: data.end_date,
        hours: data.hours,
        status: data.status,
        certificate: data.certificate,
        notes: data.notes,
      },
      source: 'database' 
    });
  } catch (error) {
    console.error('Failed to update teacher training:', error);
    return NextResponse.json({ 
      success: false, 
      error: '更新培训失败' 
    }, { status: 500 });
  }
}

/**
 * DELETE - 删除教师培训
 */
export async function DELETE(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        success: false,
        error: '缺少培训ID',
      }, { status: 400 });
    }

    const { error } = await client
      .from('teacher_trainings')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({
        success: true,
        message: '培训已删除（mock模式）',
        source: 'mock',
      });
    }

    return NextResponse.json({
      success: true,
      message: '培训已删除',
      source: 'database',
    });
  } catch (error) {
    console.error('Failed to delete teacher training:', error);
    return NextResponse.json({ 
      success: false, 
      error: '删除培训失败' 
    }, { status: 500 });
  }
}
