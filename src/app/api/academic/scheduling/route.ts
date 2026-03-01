/**
 * 智能排课系统 - API 路由
 * 
 * POST /api/academic/scheduling/execute
 * 执行智能排课，返回排课结果
 * 
 * POST /api/academic/scheduling/draft
 * 保存排课草稿
 * 
 * GET /api/academic/scheduling/draft
 * 获取排课草稿
 * 
 * POST /api/academic/scheduling/confirm
 * 确认并同步排课结果
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import SchedulingEngine from '@/lib/scheduling/engine';
import {
  prepareSchedulingTeachers,
  prepareSchedulingClasses,
  validateSchedulingData,
  generateSchedulingPreview,
} from '@/lib/scheduling/data-preparation';
import type { TeacherInfo } from '@/hooks/useTeachers';
import type { ClassContainer } from '@/hooks/useClasses';
import type { SchedulingResult, ScheduleDraft } from '@/lib/scheduling/types';

// Supabase 客户端
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * GET /api/academic/scheduling
 * 获取排课预览数据
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    if (action === 'preview') {
      // 获取预览数据
      const teachers = await fetchTeachers();
      const classes = await fetchClasses();
      
      const schedulingTeachers = prepareSchedulingTeachers(teachers);
      const schedulingClasses = prepareSchedulingClasses(classes);
      
      const validation = validateSchedulingData(schedulingTeachers, schedulingClasses);
      const preview = generateSchedulingPreview(schedulingTeachers, schedulingClasses);
      
      return NextResponse.json({
        success: true,
        data: {
          teachers: schedulingTeachers,
          classes: schedulingClasses,
          preview,
          validation,
        },
      });
    }
    
    if (action === 'draft') {
      // 获取草稿
      const semester = searchParams.get('semester') || getCurrentSemester();
      const { data, error } = await supabase
        .from('scheduling_drafts')
        .select('*')
        .eq('semester', semester)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return NextResponse.json({
        success: true,
        data: data || null,
      });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Invalid action',
    }, { status: 400 });
    
  } catch (error) {
    console.error('获取排课数据失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '获取排课数据失败',
    }, { status: 500 });
  }
}

/**
 * POST /api/academic/scheduling
 * 执行排课或保存草稿
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, semester, draftId } = body;
    
    if (action === 'execute') {
      // 执行排课
      return await executeScheduling(semester || getCurrentSemester());
    }
    
    if (action === 'save-draft') {
      // 保存草稿
      return await saveDraft(body as ScheduleDraft);
    }
    
    if (action === 'confirm') {
      // 确认并同步
      return await confirmScheduling(draftId);
    }
    
    return NextResponse.json({
      success: false,
      error: 'Invalid action',
    }, { status: 400 });
    
  } catch (error) {
    console.error('排课操作失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '排课操作失败',
    }, { status: 500 });
  }
}

/**
 * 执行智能排课
 */
async function executeScheduling(semester: string): Promise<NextResponse> {
  // 获取教师和班级数据
  const teachers = await fetchTeachers();
  const classes = await fetchClasses();
  
  // 准备排课数据
  const schedulingTeachers = prepareSchedulingTeachers(teachers);
  const schedulingClasses = prepareSchedulingClasses(classes);
  
  // 验证数据
  const validation = validateSchedulingData(schedulingTeachers, schedulingClasses);
  if (!validation.valid) {
    return NextResponse.json({
      success: false,
      error: '数据验证失败',
      details: validation.errors,
    }, { status: 400 });
  }
  
  // 执行排课引擎
  const engine = new SchedulingEngine({
    teachers: schedulingTeachers,
    classes: schedulingClasses,
    semester,
  });
  
  const result = engine.schedule();
  
  // 保存草稿
  const draft: ScheduleDraft = {
    id: crypto.randomUUID(),
    name: `${semester}排课方案`,
    semester,
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: 'system', // TODO: 从认证获取用户
    teachers: schedulingTeachers,
    classes: schedulingClasses,
    result,
    manualAdjustments: [],
  };
  
  await saveDraft(draft);
  
  return NextResponse.json({
    success: true,
    data: {
      draftId: draft.id,
      result,
    },
  });
}

/**
 * 保存排课草稿
 */
async function saveDraft(draft: ScheduleDraft): Promise<NextResponse> {
  const { error } = await supabase
    .from('scheduling_drafts')
    .upsert({
      id: draft.id,
      semester: draft.semester,
      status: draft.status,
      created_at: draft.createdAt,
      updated_at: draft.updatedAt,
      created_by: draft.createdBy,
      teachers: draft.teachers,
      classes: draft.classes,
      result: draft.result,
    });
  
  if (error) {
    throw error;
  }
  
  return NextResponse.json({
    success: true,
    data: { draftId: draft.id },
  });
}

/**
 * 确认并同步排课结果
 */
async function confirmScheduling(draftId: string): Promise<NextResponse> {
  // 获取草稿
  const { data: draft, error: fetchError } = await supabase
    .from('scheduling_drafts')
    .select('*')
    .eq('id', draftId)
    .single();
  
  if (fetchError || !draft) {
    return NextResponse.json({
      success: false,
      error: '草稿不存在',
    }, { status: 404 });
  }
  
  const result = draft.result as SchedulingResult;
  
  if (!result.success) {
    return NextResponse.json({
      success: false,
      error: '排课结果存在错误，无法确认',
      details: result.errors,
    }, { status: 400 });
  }
  
  // 同步到正式课表
  // 1. 清除该学期的旧课表
  await supabase
    .from('class_schedules')
    .delete()
    .eq('semester', draft.semester);
  
  // 2. 插入新课表
  const scheduleRecords = result.assignments.map(a => ({
    id: crypto.randomUUID(),
    semester: draft.semester,
    class_id: a.classId,
    class_name: a.className,
    grade: a.grade,
    week_day: a.timeSlot.weekDay,
    period_index: a.timeSlot.periodIndex,
    period_name: a.timeSlot.periodName,
    period_type: a.timeSlot.periodType,
    subject: a.subject,
    teacher_id: a.teacherId,
    teacher_name: a.teacherName,
    created_at: new Date().toISOString(),
  }));
  
  // 批量插入
  const batchSize = 100;
  for (let i = 0; i < scheduleRecords.length; i += batchSize) {
    const batch = scheduleRecords.slice(i, i + batchSize);
    const { error: insertError } = await supabase
      .from('class_schedules')
      .insert(batch);
    
    if (insertError) {
      console.error('插入课表失败:', insertError);
      throw insertError;
    }
  }
  
  // 3. 更新草稿状态为已确认
  await supabase
    .from('scheduling_drafts')
    .update({ status: 'confirmed', updated_at: new Date().toISOString() })
    .eq('id', draftId);
  
  // 4. 更新教师课时统计
  for (const teacherWorkload of result.teacherWorkloads) {
    await supabase
      .from('teachers')
      .update({
        current_hours: teacherWorkload.actualHours,
        updated_at: new Date().toISOString(),
      })
      .eq('id', teacherWorkload.teacherId);
  }
  
  return NextResponse.json({
    success: true,
    data: {
      message: '排课结果已确认并同步',
      statistics: result.statistics,
    },
  });
}

/**
 * 从数据库获取教师数据
 */
async function fetchTeachers(): Promise<TeacherInfo[]> {
  const { data, error } = await supabase
    .from('teachers')
    .select(`
      *,
      class_relations:class_teacher_relations(
        class_id,
        class_name,
        role
      )
    `)
    .eq('status', '在编');
  
  if (error) {
    throw error;
  }
  
  // 转换数据格式
  return (data || []).map(t => ({
    id: t.id,
    name: t.name,
    gender: t.gender || '男',
    subject: t.subject || '语文',
    title: t.title || '教师',
    department: t.department || '',
    phone: t.phone || '',
    email: t.email || '',
    status: t.status,
    teachYears: t.teach_years || 0,
    primaryRole: t.primary_role,
    additionalRoles: t.additional_roles || [],
    weeklyHours: t.weekly_hours || 14,
    currentHours: t.current_hours || 0,
    teachableSubjects: t.teachable_subjects || [],
    teachableGrades: t.teachable_grades || [1, 2, 3, 4, 5, 6],
    isHeadTeacher: t.is_head_teacher,
    headTeacherClassId: t.head_teacher_class_id,
    headTeacherClassName: t.head_teacher_class_name,
    subTeacherClasses: t.class_relations
      ?.filter((r: any) => r.role === 'sub_teacher')
      .map((r: any) => ({ classId: r.class_id, className: r.class_name })),
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  }));
}

/**
 * 从数据库获取班级数据
 */
async function fetchClasses(): Promise<ClassContainer[]> {
  const { data, error } = await supabase
    .from('classes')
    .select(`
      *,
      students:students(count),
      head_teacher:teachers!head_teacher_id(id, name),
      sub_teacher:teachers!sub_teacher_id(id, name)
    `)
    .eq('status', 'active')
    .order('grade', { ascending: true })
    .order('name', { ascending: true });
  
  if (error) {
    throw error;
  }
  
  // 转换数据格式
  return (data || []).map(c => ({
    id: c.id,
    name: c.name,
    grade: c.grade,
    gradeName: `${c.grade}年级`,
    classNumber: parseInt(c.name.replace(/[^0-9]/g, '') || '1'),
    headTeacherId: c.head_teacher_id,
    headTeacherName: c.head_teacher?.name || '',
    subTeacherId: c.sub_teacher_id,
    subTeacherName: c.sub_teacher?.name,
    students: [],
    studentCount: c.students?.[0]?.count || 0,
    maleStudentCount: 0,
    femaleStudentCount: 0,
    parents: [],
    parentCount: 0,
    status: c.status,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  }));
}

/**
 * 获取当前学期
 */
function getCurrentSemester(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  
  // 9-1月为上学期，2-6月为下学期，7-8月为暑假
  if (month >= 9) {
    return `${year}-${year + 1}-1`;
  } else if (month >= 2) {
    return `${year - 1}-${year}-2`;
  } else {
    return `${year - 1}-${year}-1`;
  }
}
