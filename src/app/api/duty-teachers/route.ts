/**
 * 值日老师安排 API
 * 
 * 功能：
 * - GET: 获取值日老师安排
 * - POST: 创建值日安排
 * - PUT: 更新值日安排
 * - DELETE: 删除值日安排
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getUserFromSession } from '@/lib/auth/session';
import { success, error, ErrorCode } from '@/lib/api';

/** 值日安排 */
interface DutySchedule {
  id?: string;
  teacherId: string;
  teacherName: string;
  grade: number; // 负责的年级，0表示全校
  weekDay: number; // 周几值日，0表示每天
  isActive: boolean;
  startDate?: string;
  endDate?: string;
}

/**
 * GET - 获取值日老师安排
 * 
 * 查询参数：
 * - teacherId: 按老师筛选
 * - grade: 按年级筛选
 * - active: 仅有效安排
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    const teacherId = searchParams.get('teacherId');
    const grade = searchParams.get('grade');
    const activeOnly = searchParams.get('active') === 'true';
    
    // 构建查询
    let query = supabase
      .from('duty_teachers')
      .select('*');
    
    // 筛选条件
    if (teacherId) {
      query = query.eq('teacher_id', teacherId);
    }
    if (grade) {
      query = query.eq('grade', parseInt(grade));
    }
    if (activeOnly) {
      query = query.eq('is_active', true);
    }
    
    query = query.order('grade', { ascending: true });
    
    const { data, error: fetchError } = await query;
    
    if (fetchError) {
      console.error('获取值日安排失败:', fetchError);
      return NextResponse.json(error('获取值日安排失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    // 转换数据格式
    const schedules = (data || []).map((item: Record<string, unknown>) => ({
      id: item.id,
      teacherId: item.teacher_id,
      teacherName: item.teacher_name,
      grade: item.grade,
      weekDay: item.week_day,
      isActive: item.is_active,
      startDate: item.start_date,
      endDate: item.end_date,
      createdAt: item.created_at,
    }));
    
    return NextResponse.json({
      success: true,
      data: schedules,
    });
  } catch (err) {
    console.error('值日老师安排API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}

/**
 * POST - 创建值日安排
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const user = await getUserFromSession(request);
    
    if (!user) {
      return NextResponse.json(error('未登录', ErrorCode.UNAUTHORIZED), { status: 401 });
    }
    
    const body: DutySchedule = await request.json();
    
    // 验证必填字段
    if (!body.teacherId || !body.teacherName) {
      return NextResponse.json(error('缺少必填字段', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    // 检查是否已存在该老师的值日安排
    const { data: existing } = await supabase
      .from('duty_teachers')
      .select('id')
      .eq('teacher_id', body.teacherId)
      .eq('is_active', true)
      .single();
    
    if (existing) {
      return NextResponse.json(error('该老师已有值日安排', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    // 创建值日安排
    const { data, error: createError } = await supabase
      .from('duty_teachers')
      .insert({
        teacher_id: body.teacherId,
        teacher_name: body.teacherName,
        grade: body.grade ?? 0,
        week_day: body.weekDay ?? 0,
        is_active: body.isActive ?? true,
        start_date: body.startDate,
        end_date: body.endDate,
        created_by: user.id,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (createError) {
      console.error('创建值日安排失败:', createError);
      return NextResponse.json(error('创建值日安排失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    return NextResponse.json(success(data, 'database'));
  } catch (err) {
    console.error('创建值日安排API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}

/**
 * PUT - 更新值日安排
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const user = await getUserFromSession(request);
    
    if (!user) {
      return NextResponse.json(error('未登录', ErrorCode.UNAUTHORIZED), { status: 401 });
    }
    
    const body = await request.json();
    
    if (!body.id) {
      return NextResponse.json(error('缺少安排ID', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    // 更新值日安排
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    
    if (body.grade !== undefined) updateData.grade = body.grade;
    if (body.weekDay !== undefined) updateData.week_day = body.weekDay;
    if (body.isActive !== undefined) updateData.is_active = body.isActive;
    if (body.startDate !== undefined) updateData.start_date = body.startDate;
    if (body.endDate !== undefined) updateData.end_date = body.endDate;
    
    const { data, error: updateError } = await supabase
      .from('duty_teachers')
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('更新值日安排失败:', updateError);
      return NextResponse.json(error('更新值日安排失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    return NextResponse.json(success(data, 'database'));
  } catch (err) {
    console.error('更新值日安排API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}

/**
 * DELETE - 删除值日安排
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const user = await getUserFromSession(request);
    
    if (!user) {
      return NextResponse.json(error('未登录', ErrorCode.UNAUTHORIZED), { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(error('缺少安排ID', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    const { error: deleteError } = await supabase
      .from('duty_teachers')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      console.error('删除值日安排失败:', deleteError);
      return NextResponse.json(error('删除值日安排失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    return NextResponse.json({ success: true, message: '删除成功' });
  } catch (err) {
    console.error('删除值日安排API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}
