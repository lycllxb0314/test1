/**
 * 教师成果 API
 * 
 * 数据源：Supabase 数据库（唯一数据源）
 * v3.0: 移除Mock fallback，数据库失败时返回错误响应
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { success, error, ErrorCode } from '@/lib/api';
import type { TeacherAchievement } from '@/types';

/**
 * GET - 获取教师成果列表
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    const type = searchParams.get('type');
    const level = searchParams.get('level');

    const client = getSupabaseClient();
    
    let query = client
      .from('teacher_achievements')
      .select('*')
      .order('date', { ascending: false });

    if (teacherId) query = query.eq('teacher_id', teacherId);
    if (type) query = query.eq('type', type);
    if (level) query = query.eq('level', level);

    const { data, error: dbError } = await query;

    if (dbError) {
      return NextResponse.json(
        error('数据库查询失败: ' + dbError.message, ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }

    const formattedData: TeacherAchievement[] = (data || []).map((achievement: Record<string, unknown>) => ({
      id: achievement.id as string,
      teacherId: achievement.teacher_id as string,
      type: achievement.type as '公开课' | '教学比赛' | '论文发表' | '课题研究' | '指导学生获奖',
      title: achievement.title as string,
      level: achievement.level as string,
      result: achievement.result as string,
      date: achievement.date as string,
      description: achievement.description as string,
      attachments: (achievement.attachments as string[]) || [],
    }));

    return NextResponse.json(success(formattedData, 'database'));
  } catch (err) {
    console.error('Failed to fetch teacher achievements:', err);
    return NextResponse.json(
      error('获取教师成果失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

/**
 * POST - 添加教师成果
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    const { teacherId, type, title, level, result, date, description, attachments } = body;

    const { data, error: dbError } = await client
      .from('teacher_achievements')
      .insert({
        teacher_id: teacherId,
        type,
        title,
        level,
        result,
        date,
        description,
        attachments: attachments || [],
      })
      .select()
      .single();

    if (dbError) {
      return NextResponse.json(
        error('添加成果失败: ' + dbError.message, ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }

    return NextResponse.json(success({
      id: data.id,
      teacherId: data.teacher_id,
      type: data.type,
      title: data.title,
      level: data.level,
      result: data.result,
      date: data.date,
      description: data.description,
      attachments: data.attachments || [],
    }, 'database'));
  } catch (err) {
    console.error('Failed to create teacher achievement:', err);
    return NextResponse.json(
      error('添加成果失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

/**
 * PUT - 更新教师成果
 */
export async function PUT(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    const { id, type, title, level, result, date, description, attachments } = body;

    const { data, error: dbError } = await client
      .from('teacher_achievements')
      .update({
        type,
        title,
        level,
        result,
        date,
        description,
        attachments: attachments || [],
      })
      .eq('id', id)
      .select()
      .single();

    if (dbError) {
      return NextResponse.json(
        error('更新成果失败: ' + dbError.message, ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }

    return NextResponse.json(success(data, 'database'));
  } catch (err) {
    console.error('Failed to update teacher achievement:', err);
    return NextResponse.json(
      error('更新成果失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

/**
 * DELETE - 删除教师成果
 */
export async function DELETE(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        error('缺少成果ID', ErrorCode.BAD_REQUEST),
        { status: 400 }
      );
    }

    const { error: dbError } = await client
      .from('teacher_achievements')
      .delete()
      .eq('id', id);

    if (dbError) {
      return NextResponse.json(
        error('删除成果失败: ' + dbError.message, ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: '成果已删除' });
  } catch (err) {
    console.error('Failed to delete teacher achievement:', err);
    return NextResponse.json(
      error('删除成果失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}
