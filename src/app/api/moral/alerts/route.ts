import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * GET - 获取德育预警列表
 * 查询参数：
 * - type: 预警类型
 * - level: 预警级别
 * - status: 处理状态
 * - grade: 年级
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const level = searchParams.get('level');
    const status = searchParams.get('status');
    const grade = searchParams.get('grade');

    let query = client
      .from('moral_alerts')
      .select(`
        id,
        student_id,
        student_name,
        grade,
        class_name,
        type,
        level,
        description,
        status,
        handler_id,
        handler_name,
        handled_at,
        handling_result,
        created_at,
        students (
          id,
          name,
          student_number
        )
      `)
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }

    if (level) {
      query = query.eq('level', level);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (grade) {
      query = query.eq('grade', parseInt(grade));
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const formattedData = (data || []).map((alert: any) => ({
      id: alert.id,
      studentId: alert.student_id,
      studentName: alert.student_name,
      studentNumber: alert.students?.student_number || '',
      grade: alert.grade,
      className: alert.class_name,
      type: alert.type,
      level: alert.level,
      description: alert.description,
      status: alert.status,
      handlerId: alert.handler_id,
      handlerName: alert.handler_name,
      handledAt: alert.handled_at,
      handlingResult: alert.handling_result,
      createdAt: alert.created_at,
    }));

    return NextResponse.json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error('Failed to fetch moral alerts:', error);
    return NextResponse.json({
      success: false,
      error: '获取德育预警列表失败',
    }, { status: 500 });
  }
}

/**
 * POST - 创建德育预警
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const {
      studentId,
      studentName,
      grade,
      className,
      type,
      level,
      description,
    } = body;

    const { data, error } = await client
      .from('moral_alerts')
      .insert({
        student_id: studentId,
        student_name: studentName,
        grade,
        class_name: className,
        type,
        level,
        description,
        status: 'pending',
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
    console.error('Failed to create moral alert:', error);
    return NextResponse.json({
      success: false,
      error: '创建德育预警失败',
    }, { status: 500 });
  }
}

/**
 * PUT - 处理德育预警
 */
export async function PUT(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const { id, handlerId, handlerName, handlingResult, status } = body;

    const { data, error } = await client
      .from('moral_alerts')
      .update({
        status: status || 'handled',
        handler_id: handlerId,
        handler_name: handlerName,
        handled_at: new Date().toISOString(),
        handling_result: handlingResult,
      })
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
    console.error('Failed to update moral alert:', error);
    return NextResponse.json({
      success: false,
      error: '处理德育预警失败',
    }, { status: 500 });
  }
}
