/**
 * 手动排课 - 获取教师列表
 * 按学科分组，显示剩余课时
 * 支持按班级筛选（语文数学只能选本班班主任/科任）
 * 显示教师跨年级任职信息
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { success, error, ErrorCode } from '@/lib/api-route-utils';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';
import { SUBJECT_HOURS, GRADE_CHINESE } from '@/lib/schedule-config';

// 职务课时减免
const POSITION_REDUCTION: Record<string, number> = {
  principal: 13,
  secretary: 13,
  academic_vice_principal: 6,
  moral_vice_principal: 6,
  general_vice_principal: 6,
  academic_director: 6,
  moral_director: 6,
  general_director: 6,
  grade_leader: 2,
  research_group_leader: 1,
  head_teacher: 2,
};

export const GET = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const grade = parseInt(searchParams.get('grade') || '1');
    const classId = searchParams.get('classId') || '';
    
    // 新增：获取当前时段参数（用于冲突检测）
    const weekDay = searchParams.get('weekDay') ? parseInt(searchParams.get('weekDay')!) : null;
    const periodIndex = searchParams.get('periodIndex') ? parseInt(searchParams.get('periodIndex')!) : null;
    
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
      .not('role', 'in', '(principal,secretary,academic_vice_principal,moral_vice_principal,general_vice_principal)')
      .order('primary_subject')
      .order('name');
    
    if (teachersError) {
      return NextResponse.json(error('获取教师失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    // 查询教师在指定时段的课程安排（用于冲突检测）
    const teacherSlotConflict = new Map<string, { className: string; subject: string; grade: number }>();
    
    if (weekDay !== null && periodIndex !== null) {
      const { data: conflictSlots } = await client
        .from('schedule_slots')
        .select('teacher_id, class_name, subject, grade, class_id')
        .eq('week_day', weekDay)
        .eq('period_index', periodIndex)
        .neq('class_id', classId);  // 排除当前班级
      
      conflictSlots?.forEach(s => {
        if (s.teacher_id) {
          teacherSlotConflict.set(s.teacher_id, {
            className: s.class_name,
            subject: s.subject,
            grade: s.grade,
          });
        }
      });
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
    
    // 获取每个教师已安排的课时（从 schedule_slots 表）
    const { data: slots } = await client
      .from('schedule_slots')
      .select('teacher_id, grade, class_name, subject');
    
    // 统计每个教师的课时和跨年级任职信息
    const teacherUsedHours = new Map<string, number>();
    const teacherGrades = new Map<string, Map<number, { classes: Set<string>; subjects: Set<string> }>>();
    
    slots?.forEach(s => {
      if (s.teacher_id) {
        // 统计课时
        teacherUsedHours.set(s.teacher_id, (teacherUsedHours.get(s.teacher_id) || 0) + 1);
        
        // 统计跨年级信息
        if (!teacherGrades.has(s.teacher_id)) {
          teacherGrades.set(s.teacher_id, new Map());
        }
        const gradeMap = teacherGrades.get(s.teacher_id)!;
        if (!gradeMap.has(s.grade)) {
          gradeMap.set(s.grade, { classes: new Set(), subjects: new Set() });
        }
        gradeMap.get(s.grade)!.classes.add(s.class_name);
        gradeMap.get(s.grade)!.subjects.add(s.subject);
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
      
      // 构建跨年级任职信息
      const gradeAssignments: { grade: number; gradeName: string; classes: string[]; subjects: string[] }[] = [];
      const teacherGradeMap = teacherGrades.get(t.id);
      if (teacherGradeMap) {
        teacherGradeMap.forEach((info, g) => {
          gradeAssignments.push({
            grade: g,
            gradeName: `${GRADE_CHINESE[g]}年级`,
            classes: Array.from(info.classes),
            subjects: Array.from(info.subjects),
          });
        });
        // 按年级排序
        gradeAssignments.sort((a, b) => a.grade - b.grade);
      }
      
      // 获取该教师的时段冲突信息
      const slotConflict = teacherSlotConflict.get(t.id);
      
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
        gradeAssignments,    // 跨年级任职信息
        // 新增：时段冲突信息
        hasSlotConflict: !!slotConflict,
        slotConflict: slotConflict ? {
          className: slotConflict.className,
          subject: slotConflict.subject,
          grade: slotConflict.grade,
          gradeName: `${GRADE_CHINESE[slotConflict.grade]}年级`,
        } : null,
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
