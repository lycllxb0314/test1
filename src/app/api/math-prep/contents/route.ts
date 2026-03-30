/**
 * 数学教学内容 API
 * 
 * 提供教学内容的查询接口
 * 
 * @module app/api/math-prep/contents
 */

import { NextRequest, NextResponse } from 'next/server';
import { mathTeachingContentRepository } from '@/repositories/math-teaching-content.repository';

/**
 * GET /api/math-prep/contents
 * 按年级学期查询教学内容
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const grade = searchParams.get('grade');
    const semester = searchParams.get('semester') as '上册' | '下册' | null;
    const grouped = searchParams.get('grouped');

    if (!grade) {
      return NextResponse.json(
        { success: false, error: '缺少年级参数' },
        { status: 400 }
      );
    }

    const gradeNum = parseInt(grade, 10);
    if (isNaN(gradeNum) || gradeNum < 1 || gradeNum > 6) {
      return NextResponse.json(
        { success: false, error: '年级参数无效，应为1-6' },
        { status: 400 }
      );
    }

    if (grouped === 'true' && semester) {
      // 返回按单元分组的数据
      const unitGroups = await mathTeachingContentRepository.findGroupedByUnit(gradeNum, semester);
      return NextResponse.json({ success: true, data: unitGroups });
    }

    if (semester) {
      // 返回该年级学期的所有教学内容
      const contents = await mathTeachingContentRepository.findByGradeAndSemester(gradeNum, semester);
      return NextResponse.json({ success: true, data: contents });
    }

    // 返回该年级所有教学内容
    const contents = await mathTeachingContentRepository.findByGradeAndSemester(gradeNum, '上册');
    return NextResponse.json({ success: true, data: contents });
  } catch (error) {
    console.error('[API] math-prep/contents GET error:', error);
    return NextResponse.json(
      { success: false, error: '查询教学内容失败' },
      { status: 500 }
    );
  }
}
