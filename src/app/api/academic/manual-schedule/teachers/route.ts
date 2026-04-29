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
    
    // 不传 subject，获取全部教师以便按科目分组
    const result = await manualScheduleService.getAvailableTeachers({
      weekDay: weekDay ? parseInt(weekDay) : undefined,
      periodIndex: periodIndex ? parseInt(periodIndex) : undefined,
    });
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '获取教师列表失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    
    const teacherList = result.data || [];
    const subjectMap = new Map<string, TeacherInfo[]>();
    
    // 科目显示顺序
    const subjectOrder = ['语文', '数学', '英语', '科学', '道德与法治', '音乐', '美术', '体育', '信息技术', '书法', '劳动', '综合实践', '校本'];
    
    // 按 primary_subject 和 subjects 字段分组
    // 一个老师可能出现在多个科目分组中（例如语文老师兼教书法）
    // 需要从数据库获取 subjects 字段，但 getAvailableTeachers 已清理了它
    // 所以重新查一次获取完整数据用于分组
    const { getSupabaseClient } = await import('@/storage/database/supabase-client');
    const client = getSupabaseClient();
    const { data: rawTeachers } = await client
      .from('teachers')
      .select('employee_id, name, primary_subject, subjects, total_weekly_hours')
      .eq('status', 'active');
    
    // 构建 employee_id → subjects 映射
    const subjectsMap = new Map<string, string[]>();
    for (const rt of (rawTeachers || [])) {
      if (rt.employee_id) {
        subjectsMap.set(rt.employee_id, (rt.subjects as string[]) || []);
      }
    }
    
    for (const t of teacherList) {
      const primarySubject = t.primary_subject || '其他';
      const teacherSubjects = subjectsMap.get(t.id) || [];
      
      // 将教师加入 primary_subject 分组
      if (!subjectMap.has(primarySubject)) {
        subjectMap.set(primarySubject, []);
      }
      subjectMap.get(primarySubject)!.push({
        id: t.id,
        name: t.name,
        subject: primarySubject,
        maxHours: t.total_weekly_hours || 20,
        usedHours: 0,
        remainingHours: t.total_weekly_hours || 20,
      });
      
      // 将教师也加入 subjects 中各科目的分组
      for (const sub of teacherSubjects) {
        if (sub === primarySubject) continue; // 避免重复
        if (!subjectMap.has(sub)) {
          subjectMap.set(sub, []);
        }
        subjectMap.get(sub)!.push({
          id: t.id,
          name: t.name,
          subject: primarySubject, // 保留主学科标识
          maxHours: t.total_weekly_hours || 20,
          usedHours: 0,
          remainingHours: t.total_weekly_hours || 20,
        });
      }
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
