/**
 * 教师成果 API
 * 
 * GET: 获取教师成果列表
 * POST: 添加教师成果
 * PUT: 更新教师成果
 * DELETE: 删除教师成果
 * 
 * 数据来源：使用 lib/mock/teachers.mock.ts 统一数据源
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { 
  MOCK_TEACHER_ACHIEVEMENTS, 
  getMockTeacherAchievements 
} from '@/lib/mock/teachers.mock';
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

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      // 使用统一 Mock 数据
      const mockData = getMockTeacherAchievements({
        teacherId: teacherId || undefined,
        type: type || undefined,
        level: level || undefined,
      });

      return NextResponse.json({ 
        success: true, 
        data: mockData, 
        source: 'mock' 
      });
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

    return NextResponse.json({ 
      success: true, 
      data: formattedData, 
      source: 'database' 
    });
  } catch (error) {
    console.error('Failed to fetch teacher achievements:', error);
    // 兜底：返回统一 Mock 数据
    return NextResponse.json({ 
      success: true, 
      data: getMockTeacherAchievements(), 
      source: 'mock' 
    });
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

    // 验证教师是否存在
    const teacher = await client
      .from('teachers')
      .select('id, name')
      .eq('id', teacherId)
      .single();

    if (!teacher.data) {
      return NextResponse.json({
        success: false,
        error: '教师不存在',
      }, { status: 400 });
    }

    const { data, error } = await client
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

    if (error) {
      // 返回 Mock 创建结果
      return NextResponse.json({
        success: true,
        data: { 
          id: `a-${Date.now()}`, 
          teacherId, 
          type, 
          title, 
          level, 
          result, 
          date, 
          description, 
          attachments: attachments || [] 
        },
        source: 'mock',
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        teacherId: data.teacher_id,
        type: data.type,
        title: data.title,
        level: data.level,
        result: data.result,
        date: data.date,
        description: data.description,
        attachments: data.attachments || [],
      },
      source: 'database',
    });
  } catch (error) {
    console.error('Failed to create teacher achievement:', error);
    return NextResponse.json({ 
      success: false, 
      error: '添加成果失败' 
    }, { status: 500 });
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

    const { data, error } = await client
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

    if (error) {
      return NextResponse.json({
        success: true,
        data: { id, type, title, level, result, date, description, attachments: attachments || [] },
        source: 'mock',
      });
    }

    return NextResponse.json({ 
      success: true, 
      data, 
      source: 'database' 
    });
  } catch (error) {
    console.error('Failed to update teacher achievement:', error);
    return NextResponse.json({ 
      success: false, 
      error: '更新成果失败' 
    }, { status: 500 });
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
      return NextResponse.json({
        success: false,
        error: '缺少成果ID',
      }, { status: 400 });
    }

    const { error } = await client
      .from('teacher_achievements')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({
        success: true,
        message: '成果已删除（mock模式）',
        source: 'mock',
      });
    }

    return NextResponse.json({
      success: true,
      message: '成果已删除',
      source: 'database',
    });
  } catch (error) {
    console.error('Failed to delete teacher achievement:', error);
    return NextResponse.json({ 
      success: false, 
      error: '删除成果失败' 
    }, { status: 500 });
  }
}
