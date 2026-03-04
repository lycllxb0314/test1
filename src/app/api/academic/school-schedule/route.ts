/**
 * 全校课表 API
 * 
 * 支持多种查询模式：
 * - all-classes: 获取所有班级课表（可按年级筛选）
 * - all-teachers: 获取所有教师课表
 * - teacher: 获取指定教师课表
 * - class: 获取指定班级课表
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { success, error, ErrorCode } from '@/lib/api-route-utils';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

// GET: 获取全校课表数据
export const GET = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'all-classes';
    const grade = searchParams.get('grade'); // 年级筛选
    const teacherId = searchParams.get('teacherId'); // 教师筛选
    const classId = searchParams.get('classId'); // 班级筛选
    const search = searchParams.get('search'); // 搜索关键词

    switch (mode) {
      case 'all-classes':
        return await getAllClassesSchedule(client, grade, search);
      
      case 'all-teachers':
        return await getAllTeachersSchedule(client, search);
      
      case 'teacher':
        if (!teacherId) {
          return NextResponse.json(error('缺少教师ID', ErrorCode.VALIDATION_ERROR), { status: 400 });
        }
        return await getTeacherSchedule(client, teacherId);
      
      case 'class':
        if (!classId) {
          return NextResponse.json(error('缺少班级ID', ErrorCode.VALIDATION_ERROR), { status: 400 });
        }
        return await getClassSchedule(client, classId);
      
      case 'summary':
        return await getScheduleSummary(client);
      
      default:
        return NextResponse.json(error('无效的查询模式', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
  } catch (err) {
    console.error('获取全校课表失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

// 获取所有班级课表
async function getAllClassesSchedule(client: any, gradeFilter: string | null, search: string | null) {
  // 1. 获取所有班级
  let classQuery = client
    .from('classes')
    .select('id, name, grade, head_teacher_id, sub_teacher_id')
    .order('grade')
    .order('name');
  
  if (gradeFilter) {
    classQuery = classQuery.eq('grade', parseInt(gradeFilter));
  }
  
  if (search) {
    classQuery = classQuery.ilike('name', `%${search}%`);
  }
  
  const { data: classes, error: classesError } = await classQuery;
  
  if (classesError) {
    console.error('获取班级失败:', classesError);
    return NextResponse.json(error('获取班级失败', ErrorCode.DATABASE_ERROR), { status: 500 });
  }
  
  // 2. 获取班主任和副班主任的ID列表
  const teacherIds = new Set<string>();
  for (const cls of classes || []) {
    if (cls.head_teacher_id) teacherIds.add(cls.head_teacher_id);
    if (cls.sub_teacher_id) teacherIds.add(cls.sub_teacher_id);
  }
  
  // 3. 获取教师信息
  let teachers: any[] = [];
  if (teacherIds.size > 0) {
    const { data: teachersData, error: teachersError } = await client
      .from('teachers')
      .select('id, name, primary_subject')
      .in('id', Array.from(teacherIds));
    
    if (!teachersError && teachersData) {
      teachers = teachersData;
    }
  }
  
  // 教师ID到教师信息映射
  const teacherMap = new Map<string, any>();
  for (const t of teachers) {
    teacherMap.set(t.id, t);
  }
  
  // 4. 获取所有班级的课表
  const classIds = classes?.map((c: any) => c.id) || [];
  
  const { data: slots, error: slotsError } = await client
    .from('schedule_slots')
    .select('*')
    .in('class_id', classIds);
  
  if (slotsError) {
    console.error('获取课表失败:', slotsError);
    return NextResponse.json(error('获取课表失败', ErrorCode.DATABASE_ERROR), { status: 500 });
  }
  
  // 按班级分组
  const slotsByClass = new Map<string, any[]>();
  for (const slot of slots || []) {
    if (!slotsByClass.has(slot.class_id)) {
      slotsByClass.set(slot.class_id, []);
    }
    slotsByClass.get(slot.class_id)!.push(slot);
  }
  
  // 按年级分组，并关联教师信息
  const scheduleByGrade = new Map<number, any[]>();
  for (const cls of classes || []) {
    const grade = cls.grade;
    if (!scheduleByGrade.has(grade)) {
      scheduleByGrade.set(grade, []);
    }
    
    // 关联班主任和副班主任信息
    const headTeacher = cls.head_teacher_id ? teacherMap.get(cls.head_teacher_id) : null;
    const subTeacher = cls.sub_teacher_id ? teacherMap.get(cls.sub_teacher_id) : null;
    
    scheduleByGrade.get(grade)!.push({
      ...cls,
      head_teacher: headTeacher ? {
        id: headTeacher.id,
        name: headTeacher.name,
        primary_subject: headTeacher.primary_subject,
      } : null,
      sub_teacher: subTeacher ? {
        id: subTeacher.id,
        name: subTeacher.name,
        primary_subject: subTeacher.primary_subject,
      } : null,
      slots: slotsByClass.get(cls.id) || [],
    });
  }
  
  // 构建结果
  const result: any[] = [];
  scheduleByGrade.forEach((classSchedules, grade) => {
    result.push({
      grade,
      gradeName: `${grade}年级`,
      classes: classSchedules,
      classCount: classSchedules.length,
    });
  });
  
  return NextResponse.json(success({
    mode: 'all-classes',
    data: result,
    totalClasses: classes?.length || 0,
    totalSlots: slots?.length || 0,
  }));
}

// 获取所有教师课表
async function getAllTeachersSchedule(client: any, search: string | null) {
  // 先获取有课程的教师ID
  const { data: slotsData } = await client
    .from('schedule_slots')
    .select('teacher_id');
  
  const teacherIdsWithSlots = [...new Set((slotsData || []).map((s: any) => s.teacher_id).filter(Boolean))];
  
  if (teacherIdsWithSlots.length === 0) {
    return NextResponse.json(success({
      mode: 'all-teachers',
      data: [],
      totalTeachers: 0,
      totalSlots: 0,
    }));
  }
  
  // 获取有课程的教师
  let teacherQuery = client
    .from('teachers')
    .select('id, name, primary_subject, employee_id')
    .in('id', teacherIdsWithSlots)
    .order('primary_subject')
    .order('name');
  
  if (search) {
    teacherQuery = teacherQuery.or(`name.ilike.%${search}%,employee_id.ilike.%${search}%`);
  }
  
  const { data: teachers, error: teachersError } = await teacherQuery;
  
  if (teachersError) {
    return NextResponse.json(error('获取教师失败', ErrorCode.DATABASE_ERROR), { status: 500 });
  }
  
  // 获取所有课表数据
  const { data: slots, error: slotsError } = await client
    .from('schedule_slots')
    .select('*')
    .in('teacher_id', teacherIdsWithSlots);
  
  if (slotsError) {
    return NextResponse.json(error('获取课表失败', ErrorCode.DATABASE_ERROR), { status: 500 });
  }
  
  // 按教师分组
  const slotsByTeacher = new Map<string, any[]>();
  for (const slot of slots || []) {
    if (!slotsByTeacher.has(slot.teacher_id)) {
      slotsByTeacher.set(slot.teacher_id, []);
    }
    slotsByTeacher.get(slot.teacher_id)!.push(slot);
  }
  
  // 按学科分组
  const teachersBySubject = new Map<string, any[]>();
  for (const teacher of teachers || []) {
    const subject = teacher.primary_subject || '其他';
    if (!teachersBySubject.has(subject)) {
      teachersBySubject.set(subject, []);
    }
    teachersBySubject.get(subject)!.push({
      ...teacher,
      slots: slotsByTeacher.get(teacher.id) || [],
      totalHours: (slotsByTeacher.get(teacher.id) || []).length,
    });
  }
  
  // 构建结果
  const result: any[] = [];
  teachersBySubject.forEach((teacherList, subject) => {
    result.push({
      subject,
      teachers: teacherList,
      teacherCount: teacherList.length,
    });
  });
  
  return NextResponse.json(success({
    mode: 'all-teachers',
    data: result,
    totalTeachers: teachers?.length || 0,
    totalSlots: slots?.length || 0,
  }));
}

// 获取单个教师课表
async function getTeacherSchedule(client: any, teacherId: string) {
  // 获取教师信息
  const { data: teacher, error: teacherError } = await client
    .from('teachers')
    .select('id, name, primary_subject, employee_id')
    .eq('id', teacherId)
    .single();
  
  if (teacherError || !teacher) {
    return NextResponse.json(error('教师不存在', ErrorCode.NOT_FOUND), { status: 404 });
  }
  
  // 获取该教师的所有课程
  const { data: slots, error: slotsError } = await client
    .from('schedule_slots')
    .select('*')
    .eq('teacher_id', teacherId);
  
  if (slotsError) {
    return NextResponse.json(error('获取课表失败', ErrorCode.DATABASE_ERROR), { status: 500 });
  }
  
  // 获取涉及的班级信息
  const classIds = [...new Set((slots || []).map((s: any) => s.class_id))];
  const { data: classes } = await client
    .from('classes')
    .select('id, name, grade')
    .in('id', classIds);
  
  const classMap = new Map<string, { id: string; name: string; grade: number }>((classes || []).map((c: any) => [c.id, c]));
  
  // 构建课表矩阵
  const scheduleMatrix: any[][] = [];
  for (let period = 0; period < 6; period++) {
    const row: any[] = [];
    for (let day = 0; day < 5; day++) {
      const slot = (slots || []).find(
        (s: any) => s.week_day === day + 1 && s.period_index === period
      );
      if (slot) {
        const cls = classMap.get(slot.class_id);
        row.push({
          ...slot,
          className: cls?.name || slot.class_name,
          grade: cls?.grade,
        });
      } else {
        row.push(null);
      }
    }
    scheduleMatrix.push(row);
  }
  
  return NextResponse.json(success({
    mode: 'teacher',
    teacher,
    scheduleMatrix,
    slots: slots || [],
    totalHours: (slots || []).length,
    classes: classMap,
  }));
}

// 获取单个班级课表
async function getClassSchedule(client: any, classId: string) {
  // 获取班级信息
  const { data: cls, error: classError } = await client
    .from('classes')
    .select('id, name, grade, head_teacher_id, sub_teacher_id')
    .eq('id', classId)
    .single();
  
  if (classError || !cls) {
    return NextResponse.json(error('班级不存在', ErrorCode.NOT_FOUND), { status: 404 });
  }
  
  // 获取班主任和副班主任信息
  const teacherIds = [cls.head_teacher_id, cls.sub_teacher_id].filter(Boolean);
  let teacherMap = new Map<string, any>();
  
  if (teacherIds.length > 0) {
    const { data: teachers } = await client
      .from('teachers')
      .select('id, name, primary_subject')
      .in('id', teacherIds);
    
    (teachers || []).forEach((t: any) => teacherMap.set(t.id, t));
  }
  
  const headTeacher = cls.head_teacher_id ? teacherMap.get(cls.head_teacher_id) : null;
  const subTeacher = cls.sub_teacher_id ? teacherMap.get(cls.sub_teacher_id) : null;
  
  const classInfo = {
    ...cls,
    head_teacher: headTeacher ? {
      id: headTeacher.id,
      name: headTeacher.name,
      primary_subject: headTeacher.primary_subject,
    } : null,
    sub_teacher: subTeacher ? {
      id: subTeacher.id,
      name: subTeacher.name,
      primary_subject: subTeacher.primary_subject,
    } : null,
  };
  
  // 获取班级课表
  const { data: slots, error: slotsError } = await client
    .from('schedule_slots')
    .select('*')
    .eq('class_id', classId);
  
  if (slotsError) {
    return NextResponse.json(error('获取课表失败', ErrorCode.DATABASE_ERROR), { status: 500 });
  }
  
  // 构建课表矩阵
  const scheduleMatrix: any[][] = [];
  for (let period = 0; period < 6; period++) {
    const row: any[] = [];
    for (let day = 0; day < 5; day++) {
      const slot = (slots || []).find(
        (s: any) => s.week_day === day + 1 && s.period_index === period
      );
      row.push(slot || null);
    }
    scheduleMatrix.push(row);
  }
  
  return NextResponse.json(success({
    mode: 'class',
    class: classInfo,
    scheduleMatrix,
    slots: slots || [],
  }));
}

// 获取课表统计概览
async function getScheduleSummary(client: any) {
  // 获取班级统计
  const { data: classes } = await client
    .from('classes')
    .select('id, grade');
  
  // 获取课表统计
  const { data: slots } = await client
    .from('schedule_slots')
    .select('id, teacher_id, class_id, subject');
  
  // 按年级统计
  const gradeStats = new Map<number, { classCount: number; slotCount: number }>();
  const classGradeMap = new Map<string, number>((classes || []).map((c: any) => [c.id as string, c.grade as number]));
  
  for (let grade = 1; grade <= 6; grade++) {
    gradeStats.set(grade, { classCount: 0, slotCount: 0 });
  }
  
  (classes || []).forEach((c: any) => {
    const grade = c.grade;
    const stat = gradeStats.get(grade);
    if (stat) stat.classCount++;
  });
  
  (slots || []).forEach((s: any) => {
    const grade = classGradeMap.get(s.class_id);
    if (grade) {
      const stat = gradeStats.get(grade);
      if (stat) stat.slotCount++;
    }
  });
  
  // 教师课时统计
  const teacherHours = new Map<string, number>();
  (slots || []).forEach((s: any) => {
    if (s.teacher_id) {
      teacherHours.set(s.teacher_id, (teacherHours.get(s.teacher_id) || 0) + 1);
    }
  });
  
  // 按学科统计课时
  const subjectHours = new Map<string, number>();
  (slots || []).forEach((s: any) => {
    if (s.subject) {
      subjectHours.set(s.subject, (subjectHours.get(s.subject) || 0) + 1);
    }
  });
  
  return NextResponse.json(success({
    totalClasses: classes?.length || 0,
    totalSlots: slots?.length || 0,
    totalTeachers: teacherHours.size,
    gradeStats: Array.from(gradeStats.entries()).map(([grade, stat]) => ({
      grade,
      gradeName: `${grade}年级`,
      ...stat,
    })),
    subjectStats: Array.from(subjectHours.entries())
      .map(([subject, hours]) => ({ subject, hours }))
      .sort((a, b) => b.hours - a.hours),
  }));
}
