/**
 * 习作篇目 API
 *
 * GET: 按年级和学期获取习作篇目列表（按单元分组）
 * POST: 创建习作篇目
 *
 * 数据来源：writing_topics 表
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { success, error, ErrorCode } from '@/lib/api';

/** 习作篇目类型（对应数据库字段，snake_case） */
type WritingTopicRow = {
  id: number;
  grade: number;
  semester: string;
  unit_number: number;
  unit_theme: string;
  topic_number: number;
  title: string;
  writing_type: string;
  requirements: string;
  word_count_min: number;
  word_count_max: number;
  key_points: string[];
  tips: string;
  created_at: string;
};

/** 按单元分组的结果 */
type UnitGroup = {
  unitNumber: number;
  unitTheme: string;
  topics: WritingTopicRow[];
};

/**
 * GET - 获取习作篇目列表（按单元分组）
 *
 * 查询参数：
 * - grade: 年级（1-6）
 * - semester: 学期（上册/下册）
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const gradeParam = searchParams.get('grade');
  const semester = searchParams.get('semester');

  if (!gradeParam) {
    return NextResponse.json(
      error('缺少年级参数', ErrorCode.VALIDATION_ERROR),
      { status: 400 }
    );
  }

  const grade = parseInt(gradeParam, 10);
  if (isNaN(grade) || grade < 1 || grade > 6) {
    return NextResponse.json(
      error('年级参数无效，应为1-6', ErrorCode.VALIDATION_ERROR),
      { status: 400 }
    );
  }

  if (!semester || (semester !== '上册' && semester !== '下册')) {
    return NextResponse.json(
      error('缺少学期参数，应为"上册"或"下册"', ErrorCode.VALIDATION_ERROR),
      { status: 400 }
    );
  }

  try {
    const supabase = getSupabaseClient();

    const { data, error: dbError } = await supabase
      .from('writing_topics')
      .select('*')
      .eq('grade', grade)
      .eq('semester', semester)
      .order('unit_number', { ascending: true })
      .order('topic_number', { ascending: true });

    if (dbError) {
      console.error('[WritingTopics API] 查询失败:', dbError.message);
      return NextResponse.json(
        error('获取习作篇目失败', ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(success([]));
    }

    // 按单元分组，转换为前端期望的 UnitGroup 格式
    const unitMap = new Map<number, UnitGroup>();

    for (const row of data as WritingTopicRow[]) {
      const unitNum = row.unit_number;

      if (!unitMap.has(unitNum)) {
        unitMap.set(unitNum, {
          unitNumber: unitNum,
          unitTheme: row.unit_theme || `第${unitNum}单元`,
          topics: [],
        });
      }

      unitMap.get(unitNum)!.topics.push(row);
    }

    return NextResponse.json(success(Array.from(unitMap.values())));
  } catch (err) {
    console.error('[WritingTopics API] 异常:', err);
    return NextResponse.json(
      error('获取习作篇目失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

/**
 * POST - 创建习作篇目
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.title || !body.grade) {
      return NextResponse.json(
        error('缺少必填字段（title, grade）', ErrorCode.VALIDATION_ERROR),
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    const { data, error: dbError } = await supabase
      .from('writing_topics')
      .insert({
        grade: body.grade,
        semester: body.semester || '上册',
        unit_number: body.unit_number || 1,
        unit_theme: body.unit_theme || '',
        topic_number: body.topic_number || 1,
        title: body.title,
        writing_type: body.writing_type || '写事',
        requirements: body.requirements || '',
        word_count_min: body.word_count_min || 100,
        word_count_max: body.word_count_max || 400,
        key_points: body.key_points || [],
        tips: body.tips || '',
      })
      .select()
      .single();

    if (dbError) {
      console.error('[WritingTopics API] 创建失败:', dbError.message);
      return NextResponse.json(
        error('创建习作篇目失败', ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }

    return NextResponse.json(success(data));
  } catch (err) {
    console.error('[WritingTopics API] 创建异常:', err);
    return NextResponse.json(
      error('创建习作篇目失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}
