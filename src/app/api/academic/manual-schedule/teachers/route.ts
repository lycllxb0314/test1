/**
 * 手动排课 - 获取教师列表
 * 按学科分组，显示剩余课时
 * 支持按班级筛选（语文数学只能选本班班主任/科任）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { success, error, ErrorCode } from '@/lib/api-route-utils';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

// 职务课时减免
const POSITION_REDUCTION: Record<string, number> = {
  principal: 13,
  secretary: 13,
  vice_principal: 10,
  academic_director: 6,
  moral_director: 6,
  general_director: 6,
  grade_leader: 2,
  research_group_leader: 1,
  head_teacher: 2,
};

// 各年级课时标准
const SUBJECT_HOURS: Record<string, Record<number, number>> = {
  '语文': { 1: 8, 2: 8, 3: 7, 4: 7, 5: 7, 6: 7 },
  '数学': { 1: 4, 2: 4, 3: 5, 4: 5, 5: 5, 6: 5 },
  '道德与法治': { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2 },
  '科学': { 1: 2, 2: 2, 3: 3, 4: 3, 5: 3, 6: 3 },
  '体育': { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3 },
  '音乐': { 1: 2, 2: 2, 3: 1, 4: 1, 5: 1, 6: 1 },
  '美术': { 1: 2, 2: 2, 3: 1, 4: 1, 5: 1, 6: 1 },
  '劳动': { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1 },
  '综合实践': { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1 },
  '信息技术': { 1: 0, 2: 0, 3: 1, 4: 1, 5: 1, 6: 1 },
  '英语': { 1: 0, 2: 0, 3: 2, 4: 2, 5: 2, 6: 2 },
  '心育': { 1: 0, 2: 0, 3: 1, 4: 1, 5: 1, 6: 1 },
  '书法': { 1: 0, 2: 0, 3: 1, 4: 1, 5: 1, 6: 1 },
};

export const GET = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const grade = parseInt(searchParams.get('grade') || '1');
    const classId = searchParams.get('classId') || '';
    
    // 获取班级信息（班主任、副班主任）
    let classInfo: { headTeacherId: string | null; subTeacherId: string | null; headTeacherSubject: string | null; subTeacherSubject: string | null } | null = null;
    
    if (classId) {
      const { data: cls } = await client
        .from('classes')
        .select(`
          id,
          head_teacher_id,
          sub_teacher_id,
          head_teacher:teachers!classes_head_teacher_id_fkey(id, primary_subject),
          sub_teacher:teachers!classes_sub_teacher_id_fkey(id, primary_subject)
        `)
        .eq('id', classId)
        .single();
      
      if (cls) {
        classInfo = {
          headTeacherId: cls.head_teacher_id,
          subTeacherId: cls.sub_teacher_id,
          headTeacherSubject: (cls.head_teacher as any)?.primary_subject || null,
          subTeacherSubject: (cls.sub_teacher as any)?.primary_subject || null,
        };
      }
    }
    
    // 获取所有教师（排除校长书记副校长）
    const { data: teachers, error: teachersError } = await client
      .from('teachers')
      .select('id, name, primary_subject, total_weekly_hours, additional_roles')
      .not('role', 'in', '(principal,secretary,vice_principal)')
      .order('primary_subject')
      .order('name');
    
    if (teachersError) {
      return NextResponse.json(error('获取教师失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    // 获取所有班级的班主任映射
    const { data: classes } = await client
      .from('classes')
      .select('id, head_teacher_id');
    
    const headTeacherMap = new Map<string, string>();
    classes?.forEach(c => {
      if (c.head_teacher_id) {
        headTeacherMap.set(c.head_teacher_id, c.id);
      }
    });
    
    // 获取每个教师已安排的课时
    const { data: slots } = await client
      .from('schedule_slots')
      .select('teacher_id');
    
    const teacherUsedHours = new Map<string, number>();
    slots?.forEach(s => {
      if (s.teacher_id) {
        teacherUsedHours.set(s.teacher_id, (teacherUsedHours.get(s.teacher_id) || 0) + 1);
      }
    });
    
    // 按学科分组
    const teachersBySubject = new Map<string, any[]>();
    
    for (const t of teachers || []) {
      const isHeadTeacher = headTeacherMap.has(t.id);
      let reduction = isHeadTeacher ? POSITION_REDUCTION.head_teacher : 0;
      
      // 职务减免
      const roles = t.additional_roles || [];
      for (const role of roles) {
        reduction += POSITION_REDUCTION[role] || 0;
      }
      
      const maxHours = Math.max((t.total_weekly_hours || 16) - reduction, 0);
      const usedHours = teacherUsedHours.get(t.id) || 0;
      const remainingHours = maxHours - usedHours;
      
      // 判断是否是本班的班主任/副班主任
      const isClassHeadTeacher = classInfo?.headTeacherId === t.id;
      const isClassSubTeacher = classInfo?.subTeacherId === t.id;
      
      const teacherInfo = {
        id: t.id,
        name: t.name,
        subject: t.primary_subject,
        maxHours,
        usedHours,
        remainingHours,
        isHeadTeacher,
        isClassHeadTeacher,  // 是否是当前班级的班主任
        isClassSubTeacher,   // 是否是当前班级的副班主任
      };
      
      if (!teachersBySubject.has(t.primary_subject)) {
        teachersBySubject.set(t.primary_subject, []);
      }
      teachersBySubject.get(t.primary_subject)!.push(teacherInfo);
    }
    
    // 构建响应
    const subjects = Array.from(teachersBySubject.entries()).map(([subject, teachers]) => ({
      subject,
      teachers: teachers.sort((a, b) => {
        // 本班班主任/副班主任排最前面
        if (a.isClassHeadTeacher || a.isClassSubTeacher) return -1;
        if (b.isClassHeadTeacher || b.isClassSubTeacher) return 1;
        // 然后按剩余课时排序
        return b.remainingHours - a.remainingHours;
      }),
    }));
    
    return NextResponse.json(success({
      subjects,
      subjectHours: SUBJECT_HOURS,
      grade,
      classInfo: classInfo ? {
        headTeacherId: classInfo.headTeacherId,
        subTeacherId: classInfo.subTeacherId,
        headTeacherSubject: classInfo.headTeacherSubject,
        subTeacherSubject: classInfo.subTeacherSubject,
      } : null,
    }));
    
  } catch (err) {
    console.error('获取教师列表失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
