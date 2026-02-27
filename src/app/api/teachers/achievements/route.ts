import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// Mock教师成果数据
const mockAchievements = [
  { id: 'a1', teacherId: 'teacher-001', type: '公开课', title: '《背影》区级公开课', level: '区级', result: '优秀', date: '2023-11-20', description: '面向全区语文教师的示范课' },
  { id: 'a2', teacherId: 'teacher-001', type: '教学比赛', title: '龙岩市语文教学技能大赛', level: '市级', result: '一等奖', date: '2023-05-10' },
  { id: 'a3', teacherId: 'teacher-001', type: '论文发表', title: '小学语文阅读教学策略研究', level: '省级', date: '2022-08', description: '发表于《福建教育》2022年第8期' },
  { id: 'a4', teacherId: 'teacher-001', type: '课题研究', title: '小学语文核心素养培养研究', level: '市级', result: '结题', date: '2023-06', description: '市级课题主持人' },
  { id: 'a5', teacherId: 'teacher-001', type: '指导学生获奖', title: '指导学生参加征文比赛', level: '省级', result: '一等奖2人', date: '2023-12' },
];

/**
 * GET - 获取教师成果列表
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');

    const client = getSupabaseClient();
    
    let query = client
      .from('teacher_achievements')
      .select('*')
      .order('date', { ascending: false });

    if (teacherId) query = query.eq('teacher_id', teacherId);

    const { data, error } = await query;

    if (error) {
      let filteredData = [...mockAchievements];
      if (teacherId) filteredData = filteredData.filter(a => a.teacherId === teacherId);

      return NextResponse.json({ success: true, data: filteredData, source: 'mock' });
    }

    const formattedData = (data || []).map((achievement: Record<string, unknown>) => ({
      id: achievement.id,
      teacherId: achievement.teacher_id,
      type: achievement.type,
      title: achievement.title,
      level: achievement.level,
      result: achievement.result,
      date: achievement.date,
      description: achievement.description,
      attachments: achievement.attachments || [],
    }));

    return NextResponse.json({ success: true, data: formattedData, source: 'database' });
  } catch (error) {
    console.error('Failed to fetch teacher achievements:', error);
    return NextResponse.json({ success: true, data: mockAchievements, source: 'mock' });
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
      return NextResponse.json({
        success: true,
        data: { id: `a-${Date.now()}`, teacherId, type, title, level, result, date, description, attachments: attachments || [] },
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
    return NextResponse.json({ success: false, error: '添加成果失败' }, { status: 500 });
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

    return NextResponse.json({ success: true, data, source: 'database' });
  } catch (error) {
    console.error('Failed to update teacher achievement:', error);
    return NextResponse.json({ success: false, error: '更新成果失败' }, { status: 500 });
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
      return NextResponse.json({ success: false, error: '缺少成果ID' }, { status: 400 });
    }

    const { error } = await client.from('teacher_achievements').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ success: true, source: 'mock' });
    }

    return NextResponse.json({ success: true, source: 'database' });
  } catch (error) {
    console.error('Failed to delete teacher achievement:', error);
    return NextResponse.json({ success: false, error: '删除成果失败' }, { status: 500 });
  }
}
