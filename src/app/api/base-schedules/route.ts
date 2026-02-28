/**
 * 基准课表 API
 * 
 * 使用统一的路由处理模式和集中的Mock数据
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { 
  getMockBaseSchedule,
} from '@/lib/mock/schedules.mock';
import { 
  success, 
  error, 
  parseQueryParams, 
  ErrorCode 
} from '@/lib/api-route-utils';
import type { BaseScheduleSlot } from '@/types';

/**
 * GET - 获取基准课表
 * 
 * 查询参数：
 * - classId: 班级ID
 * - teacherId: 教师ID
 * - semester: 学期
 */
export async function GET(request: NextRequest) {
  const params = parseQueryParams(request);
  
  try {
    const client = getSupabaseClient();
    
    // 构建查询
    let query = client
      .from('base_schedules')
      .select('*');
    
    // 应用筛选
    if (params.classId) {
      query = query.eq('class_id', params.classId);
    }
    if (params.teacherId) {
      query = query.eq('teacher_id', params.teacherId);
    }
    if (params.semester) {
      query = query.eq('semester', params.semester);
    }
    
    query = query.order('day_of_week', { ascending: true }).order('period_index', { ascending: true });
    
    const { data, error: dbError } = await query;
    
    if (dbError) {
      console.log('Database query failed, using mock data:', dbError.message);
      
      // 使用Mock数据
      const mockData = getMockBaseSchedule(
        params.classId as string,
        params.semester as string
      );
      
      return NextResponse.json(success(mockData, 'mock'));
    }
    
    return NextResponse.json(success(data || [], 'database'));
  } catch (err) {
    console.error('Failed to fetch base schedules:', err);
    
    // 使用Mock数据作为fallback
    const mockData = getMockBaseSchedule(
      params.classId as string,
      params.semester as string
    );
    
    return NextResponse.json(success(mockData, 'mock'));
  }
}

/**
 * POST - 创建基准课表
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const client = getSupabaseClient();
    
    // 批量插入
    const slots = Array.isArray(body) ? body : [body];
    
    const { data, error: dbError } = await client
      .from('base_schedules')
      .insert(slots.map(slot => ({
        ...slot,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })))
      .select();
    
    if (dbError) {
      console.error('Database insert error:', dbError);
      return NextResponse.json(
        error('创建课表失败', ErrorCode.INTERNAL_ERROR),
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data,
      message: '课表保存成功',
      source: 'database',
    });
  } catch (err) {
    console.error('Failed to create base schedule:', err);
    return NextResponse.json(
      error('创建课表失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

/**
 * PUT - 批量更新基准课表
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const client = getSupabaseClient();
    
    // 更新操作
    if (body.action === 'update') {
      const { data, error: dbError } = await client
        .from('base_schedules')
        .update({
          ...body.data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', body.id)
        .select()
        .single();
      
      if (dbError) {
        console.error('Database update error:', dbError);
        return NextResponse.json(success({ id: body.id, ...body.data }, 'mock'));
      }
      
      return NextResponse.json(success(data, 'database'));
    }
    
    // 批量更新
    if (Array.isArray(body.slots)) {
      const updates = body.slots.map((slot: BaseScheduleSlot) =>
        client
          .from('base_schedules')
          .update({
            ...slot,
            updated_at: new Date().toISOString(),
          })
          .eq('id', slot.id)
      );
      
      await Promise.all(updates);
      
      return NextResponse.json({
        success: true,
        message: '课表批量更新成功',
        source: 'database',
      });
    }
    
    return NextResponse.json(
      error('无效的请求参数', ErrorCode.BAD_REQUEST),
      { status: 400 }
    );
  } catch (err) {
    console.error('Failed to update base schedule:', err);
    return NextResponse.json(
      error('更新课表失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

/**
 * DELETE - 删除基准课表
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const classId = searchParams.get('classId');
    
    const client = getSupabaseClient();
    
    if (id) {
      // 删除单条
      const { error: dbError } = await client
        .from('base_schedules')
        .delete()
        .eq('id', id);
      
      if (dbError) {
        console.error('Database delete error:', dbError);
        return NextResponse.json(success({ id }, 'mock'));
      }
    } else if (classId) {
      // 删除班级所有课表
      const { error: dbError } = await client
        .from('base_schedules')
        .delete()
        .eq('class_id', classId);
      
      if (dbError) {
        console.error('Database delete error:', dbError);
        return NextResponse.json(success({ classId }, 'mock'));
      }
    }
    
    return NextResponse.json({
      success: true,
      message: '课表删除成功',
      source: 'database',
    });
  } catch (err) {
    console.error('Failed to delete base schedule:', err);
    return NextResponse.json(
      error('删除课表失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}
