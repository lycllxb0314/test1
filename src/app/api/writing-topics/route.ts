/**
 * 习作篇目 API
 * 
 * GET /api/writing-topics?grade=X&semester=上册/下册
 * 
 * 获取指定年级学期的习作篇目列表
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 数据库原始类型（snake_case）
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

// 单元分组类型
type UnitGroup = {
  unitNumber: number;
  unitTheme: string;
  topics: WritingTopicRow[];
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const grade = searchParams.get('grade');
    const semester = searchParams.get('semester');

    if (!grade || !semester) {
      return NextResponse.json(
        { success: false, error: '请提供年级和学期参数' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('writing_topics')
      .select('*')
      .eq('grade', parseInt(grade))
      .eq('semester', semester)
      .order('unit_number', { ascending: true })
      .order('topic_number', { ascending: true });

    if (error) {
      console.error('[Writing Topics API Error]:', error);
      return NextResponse.json(
        { success: false, error: '获取习作篇目失败' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    // 按单元分组（使用 snake_case 字段名）
    const unitMap = new Map<number, WritingTopicRow[]>();

    (data as WritingTopicRow[]).forEach((topic) => {
      const unitNum = topic.unit_number;
      if (!unitMap.has(unitNum)) {
        unitMap.set(unitNum, []);
      }
      unitMap.get(unitNum)!.push(topic);
    });

    // 转换为数组
    const unitGroups: UnitGroup[] = [];
    unitMap.forEach((topics, unitNumber) => {
      unitGroups.push({
        unitNumber,
        unitTheme: topics[0]?.unit_theme || '',
        topics,
      });
    });

    return NextResponse.json({
      success: true,
      data: unitGroups,
    });
  } catch (error) {
    console.error('[Writing Topics API Error]:', error);
    return NextResponse.json(
      { success: false, error: '获取习作篇目失败' },
      { status: 500 }
    );
  }
}
