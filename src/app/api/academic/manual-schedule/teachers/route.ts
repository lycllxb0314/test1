/**
 * 手动排课 - 可用教师 API
 * 
 * 架构：API Route → Service → Repository
 * 
 * 返回格式：{ subjects: [{ subject: string, teachers: TeacherInfo[] }] }
 */

import { NextRequest, NextResponse } from 'next/server';
import { manualScheduleService } from '@/services/academic.service';
import { error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

interface TeacherInfo {
  id: string;
  name: string;
  subject: string;
  maxHours: number;
  usedHours: number;
  remainingHours: number;
}

interface SubjectGroup {
  subject: string;
  teachers: TeacherInfo[];
}

/**
 * GET - 获取可用教师列表（按科目分组）
 */
export const GET = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const { searchParams } = new URL(request.url);
    
    const weekDay = searchParams.get('weekDay');
    const periodIndex = searchParams.get('periodIndex');
    const grade = searchParams.get('grade');
    
    const result = await manualScheduleService.getAvailableTeachers({
      subject: searchParams.get('subject') || undefined,
      weekDay: weekDay ? parseInt(weekDay) : undefined,
      periodIndex: periodIndex ? parseInt(periodIndex) : undefined,
    });
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '获取教师列表失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    
    // 将教师列表按科目分组
    const teacherList = result.data || [];
    const subjectMap = new Map<string, TeacherInfo[]>();
    
    // 科目显示顺序
    const subjectOrder = ['语文', '数学', '英语', '科学', '道德与法治', '音乐', '美术', '体育', '信息技术', '书法', '劳动', '综合实践', '校本'];
    
    for (const t of teacherList) {
      const subject = t.primary_subject || '其他';
      if (!subjectMap.has(subject)) {
        subjectMap.set(subject, []);
      }
      subjectMap.get(subject)!.push({
        id: t.id,
        name: t.name,
        subject: t.primary_subject,
        maxHours: t.total_weekly_hours || 20,
        usedHours: 0, // TODO: 计算已用课时
        remainingHours: t.total_weekly_hours || 20,
      });
    }
    
    // 按科目顺序排列
    const subjects: SubjectGroup[] = subjectOrder
      .filter(s => subjectMap.has(s))
      .map(subject => ({
        subject,
        teachers: subjectMap.get(subject) || [],
      }));
    
    // 添加其他科目
    for (const [subject, teachers] of subjectMap) {
      if (!subjectOrder.includes(subject)) {
        subjects.push({ subject, teachers });
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      data: { subjects },
      meta: {
        grade: grade ? parseInt(grade) : null,
        weekDay: weekDay ? parseInt(weekDay) : null,
        periodIndex: periodIndex ? parseInt(periodIndex) : null,
        totalTeachers: teacherList.length,
      }
    });
  } catch (err) {
    console.error('获取可用教师失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
