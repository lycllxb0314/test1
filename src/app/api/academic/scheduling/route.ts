/**
 * 智能排课系统 - API 路由
 * 
 * GET /api/academic/scheduling?action=preview - 获取排课预览数据
 * POST /api/academic/scheduling - 执行排课/保存草稿
 */

import { NextRequest, NextResponse } from 'next/server';
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

// 草稿存储（内存缓存，实际应存数据库）
const drafts: Map<string, ScheduleDraft> = new Map();

/**
 * GET /api/academic/scheduling
 * 获取排课预览数据
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    if (action === 'preview') {
      // 调用已有API获取真实数据
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
      const semester = searchParams.get('semester') || getCurrentSemester();
      const draft = Array.from(drafts.values()).find(d => d.semester === semester);
      return NextResponse.json({
        success: true,
        data: draft || null,
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
    const { action, semester, draftId, teachers: inputTeachers, classes: inputClasses } = body;
    
    if (action === 'execute') {
      // 执行排课
      return await executeScheduling(semester || getCurrentSemester(), inputTeachers, inputClasses);
    }
    
    if (action === 'save-draft') {
      // 保存草稿
      const draft = body as ScheduleDraft;
      drafts.set(draft.id, draft);
      return NextResponse.json({
        success: true,
        data: { draftId: draft.id },
      });
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
async function executeScheduling(
  semester: string,
  inputTeachers?: TeacherInfo[],
  inputClasses?: ClassContainer[]
): Promise<NextResponse> {
  // 获取教师和班级数据
  const teachers = inputTeachers || await fetchTeachers();
  const classes = inputClasses || await fetchClasses();
  
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
    createdBy: 'system',
    teachers: schedulingTeachers,
    classes: schedulingClasses,
    result,
    manualAdjustments: [],
  };
  
  drafts.set(draft.id, draft);
  
  return NextResponse.json({
    success: true,
    data: {
      draftId: draft.id,
      result,
    },
  });
}

/**
 * 确认并同步排课结果
 */
async function confirmScheduling(draftId: string): Promise<NextResponse> {
  const draft = drafts.get(draftId);
  
  if (!draft) {
    return NextResponse.json({
      success: false,
      error: '草稿不存在',
    }, { status: 404 });
  }
  
  const result = draft.result;
  
  if (!result.success) {
    return NextResponse.json({
      success: false,
      error: '排课结果存在错误，无法确认',
      details: result.errors,
    }, { status: 400 });
  }
  
  // 更新草稿状态
  draft.status = 'confirmed';
  draft.updatedAt = new Date().toISOString();
  
  return NextResponse.json({
    success: true,
    data: {
      message: '排课结果已确认',
      statistics: result.statistics,
    },
  });
}

/**
 * 从教师API获取教师数据
 */
async function fetchTeachers(): Promise<TeacherInfo[]> {
  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'http://localhost:5000';
  
  const response = await fetch(`${baseUrl}/api/teachers?pageSize=1000`);
  const result = await response.json();
  
  if (!result.success || !result.data) {
    throw new Error('获取教师数据失败');
  }
  
  // 转换数据格式
  return result.data.map((t: Record<string, unknown>) => {
    // 优先使用 teachable_subjects，否则从 primary_subject + secondary_subjects 构建
    let teachableSubjects: string[];
    if (t.teachable_subjects && Array.isArray(t.teachable_subjects) && t.teachable_subjects.length > 0) {
      teachableSubjects = t.teachable_subjects as string[];
    } else {
      teachableSubjects = [
        t.primary_subject as string,
        ...(t.secondary_subjects as string[] || [])
      ].filter(Boolean) as string[];
    }
    
    return {
      id: t.id as string,
      name: t.name as string,
      gender: t.gender === 'male' ? '男' : t.gender === 'female' ? '女' : '男',
      subject: (t.primary_subject as string) || (t.subjects as string[])?.[0] || '语文',
      title: (t.title as string) || '二级教师',
      department: (t.department as string) || `${(t.subjects as string[])?.[0] || '语文'}组`,
      phone: (t.phone as string) || '',
      email: (t.email as string) || '',
      status: (t.status as string) || 'active',
      teachYears: (t.teachYears as number) || 0,
      avatar: t.avatar as string,
      primaryRole: (t.role as TeacherInfo['primaryRole']) || 'subject_teacher',
      additionalRoles: (t.additional_roles as TeacherInfo['additionalRoles']) || [],
      weeklyHours: (t.total_weekly_hours as number) || 13,
      currentHours: 0,
      teachableSubjects,
      teachableGrades: (t.teachable_grades as number[]) || [1, 2, 3, 4, 5, 6],
      isHeadTeacher: (t.isHeadTeacher as boolean) || false,
      headTeacherClassId: t.headTeacherClassId as string,
      headTeacherClassName: t.headTeacherClassName as string,
      createdAt: t.created_at as string,
      updatedAt: t.updated_at as string,
    };
  });
}

/**
 * 从班级API获取班级数据
 */
async function fetchClasses(): Promise<ClassContainer[]> {
  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'http://localhost:5000';
  
  const response = await fetch(`${baseUrl}/api/classes?pageSize=100`);
  const result = await response.json();
  
  if (!result.success || !result.data) {
    throw new Error('获取班级数据失败');
  }
  
  // 转换数据格式
  return result.data.map((c: Record<string, unknown>) => ({
    id: c.id as string,
    name: c.name as string,
    grade: c.grade as number,
    gradeName: `${c.grade}年级`,
    classNumber: parseInt((c.name as string).replace(/[^0-9]/g, '') || '1'),
    headTeacherId: c.head_teacher_id as string || c.headTeacherId as string,
    headTeacherName: c.head_teacher_name as string || c.headTeacherName as string || '',
    subTeacherId: c.sub_teacher_id as string || c.subTeacherId as string,
    subTeacherName: c.sub_teacher_name as string || c.subTeacherName as string,
    students: [],
    studentCount: (c.student_count as number) || (c.students as unknown[])?.length || 0,
    maleStudentCount: 0,
    femaleStudentCount: 0,
    parents: [],
    parentCount: 0,
    status: (c.status as ClassContainer['status']) || 'active',
    createdAt: c.created_at as string,
    updatedAt: c.updated_at as string,
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
