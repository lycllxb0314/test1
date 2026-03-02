/**
 * 智能排课API路由
 * 
 * POST /api/academic/scheduling
 * 执行智能排课算法
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { success, error, ErrorCode } from '@/lib/api-route-utils';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';
import { SchedulingEngine } from '@/lib/scheduling/engine';
import { 
  ScheduleInput, 
  TeacherForSchedule, 
  ClassForSchedule,
  SubjectNeed 
} from '@/lib/scheduling/types';
import { 
  SUBJECT_HOURS_CONFIG, 
  POSITION_HOURS_REDUCTION,
  getSubjectHours,
} from '@/lib/scheduling/rules';

/**
 * POST - 执行智能排课
 */
const handleSchedule = async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const client = getSupabaseClient();
    
    // 1. 获取教师数据
    const { data: teachersData, error: teachersError } = await client
      .from('teachers')
      .select(`
        id, name, role, primary_subject, secondary_subjects,
        total_weekly_hours, teachable_grades,
        additional_roles, head_teacher_class_ids
      `)
      .not('role', 'in', '(principal,secretary,vice_principal)');
    
    if (teachersError) {
      return NextResponse.json(
        error('获取教师数据失败', ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }
    
    // 2. 获取班级数据
    const { data: classesData, error: classesError } = await client
      .from('classes')
      .select('id, name, grade, class_number, head_teacher_id, head_teacher_name')
      .order('grade', { ascending: true })
      .order('class_number', { ascending: true });
    
    if (classesError) {
      return NextResponse.json(
        error('获取班级数据失败', ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }
    
    // 3. 获取教师课程数据（用于确定教师任教班级）
    const { data: coursesData } = await client
      .from('teacher_courses')
      .select('teacher_id, class_id, subject');
    
    // 构建教师任教班级映射
    const teacherClassesMap = new Map<string, Set<string>>();
    if (coursesData) {
      for (const course of coursesData) {
        if (!teacherClassesMap.has(course.teacher_id)) {
          teacherClassesMap.set(course.teacher_id, new Set());
        }
        teacherClassesMap.get(course.teacher_id)!.add(course.class_id);
      }
    }
    
    // 4. 转换教师数据
    const teachers: TeacherForSchedule[] = (teachersData || []).map(t => {
      // 计算职务减免后的最大课时
      let reduction = 0;
      const roles = t.additional_roles || [];
      
      for (const role of roles) {
        reduction += POSITION_HOURS_REDUCTION[role] || 0;
      }
      
      // 班主任减免
      if (t.head_teacher_class_ids && t.head_teacher_class_ids.length > 0) {
        reduction += POSITION_HOURS_REDUCTION['head_teacher'] || 2;
      }
      
      // 处理 secondary_subjects
      let secondarySubjects: string[] = [];
      if (t.secondary_subjects) {
        if (Array.isArray(t.secondary_subjects)) {
          secondarySubjects = t.secondary_subjects.filter((s: string) => s);
        } else if (typeof t.secondary_subjects === 'string') {
          try {
            const parsed = JSON.parse(t.secondary_subjects);
            secondarySubjects = Array.isArray(parsed) ? parsed : [];
          } catch {
            secondarySubjects = [];
          }
        }
      }
      
      // 处理 teachable_grades
      let teachableGrades: number[] = [1, 2, 3, 4, 5, 6];
      if (t.teachable_grades) {
        if (Array.isArray(t.teachable_grades)) {
          teachableGrades = t.teachable_grades.filter((g: number) => g);
        } else if (typeof t.teachable_grades === 'string') {
          try {
            const parsed = JSON.parse(t.teachable_grades);
            teachableGrades = Array.isArray(parsed) ? parsed : teachableGrades;
          } catch {
            // 保持默认
          }
        }
      }
      
      const baseHours = t.total_weekly_hours || 16;
      const maxHours = Math.max(baseHours - reduction, 0);
      
      return {
        id: t.id,
        name: t.name,
        primarySubject: t.primary_subject || '语文',
        secondarySubjects,
        weeklyHours: baseHours,
        currentHours: 0,
        teachableGrades,
        isHeadTeacher: !!(t.head_teacher_class_ids && t.head_teacher_class_ids.length > 0),
        headTeacherClassId: t.head_teacher_class_ids?.[0],
        additionalRoles: roles || [],
        maxHours,
        mainSubjectOnly: t.primary_subject === '语文' || t.primary_subject === '数学',
      };
    });
    
    // 5. 转换班级数据
    const classes: ClassForSchedule[] = (classesData || []).map(c => {
      // 根据年级生成学科需求
      const subjectNeeds: SubjectNeed[] = SUBJECT_HOURS_CONFIG
        .filter(s => getSubjectHours(s.name, c.grade) > 0)
        .map(s => ({
          subject: s.name,
          weeklyHours: getSubjectHours(s.name, c.grade),
          assigned: false,
        }));
      
      return {
        id: c.id,
        name: c.name,
        grade: c.grade,
        classNumber: c.class_number || 1,
        headTeacherId: c.head_teacher_id,
        headTeacherName: c.head_teacher_name,
        subjectNeeds,
      };
    });
    
    // 6. 执行排课
    const input: ScheduleInput = { teachers, classes, semester: '2024-2025-2' };
    const engine = new SchedulingEngine(input);
    
    const result = await engine.execute((phase, current, total, message) => {
      console.log(`[排课进度] ${phase}: ${current}/${total} - ${message}`);
    });
    
    // 7. 保存排课结果到数据库
    if (result.success) {
      // 清空旧的排课数据
      await client.from('schedule_slots').delete().neq('id', '');
      
      // 插入新的排课数据
      const slotsToInsert = [];
      for (const classSchedule of result.classSchedules) {
        for (let dayIndex = 0; dayIndex < classSchedule.slots.length; dayIndex++) {
          for (const slot of classSchedule.slots[dayIndex]) {
            slotsToInsert.push({
              class_id: slot.classId,
              class_name: slot.className,
              grade: slot.grade,
              week_day: dayIndex + 1, // 1-5 表示周一到周五
              period_index: slot.timeSlot.period === '上午' 
                ? slot.timeSlot.periodIndex 
                : slot.timeSlot.periodIndex + 3, // 下午从4开始
              period_name: `${slot.timeSlot.period}${slot.timeSlot.periodIndex}`,
              subject: slot.subject,
              teacher_id: slot.teacherId,
              teacher_name: slot.teacherName,
              status: 'active',
            });
          }
        }
      }
      
      if (slotsToInsert.length > 0) {
        // 分批插入
        const batchSize = 100;
        for (let i = 0; i < slotsToInsert.length; i += batchSize) {
          const batch = slotsToInsert.slice(i, i + batchSize);
          await client.from('schedule_slots').insert(batch);
        }
      }
    }
    
    return NextResponse.json(success(result));
    
  } catch (err) {
    console.error('排课失败:', err);
    return NextResponse.json(
      error('排课失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
};

// 导出受保护的路由处理器
export const POST = protectedRoute(handleSchedule, {
  module: 'academic',
  permission: 'manage',
});
