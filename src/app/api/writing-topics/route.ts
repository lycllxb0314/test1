/**
 * 习作篇目 API
 * 
 * GET /api/writing-topics?grade=X&semester=上册/下册
 * 
 * 获取指定年级学期的习作篇目列表
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 单元分组类型
type UnitGroup = {
  unitNumber: number;
  unitTheme: string;
  topics: WritingTopic[];
};

// 习作篇目类型
type WritingTopic = {
  id: number;
  grade: number;
  semester: string;
  unitNumber: number;
  unitTheme: string;
  topicNumber: number;
  title: string;
  writingType: string;
  requirements: string;
  wordCountMin: number;
  wordCountMax: number;
  keyPoints: string[];
  tips: string;
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

    // 按单元分组
    const unitGroups: UnitGroup[] = [];
    const unitMap = new Map<number, WritingTopic[]>();

    data?.forEach((topic: WritingTopic) => {
      if (!unitMap.has(topic.unitNumber)) {
        unitMap.set(topic.unitNumber, []);
      }
      unitMap.get(topic.unitNumber)!.push(topic);
    });

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
