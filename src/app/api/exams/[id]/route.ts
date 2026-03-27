/**
 * 考试详情 API
 * 
 * GET: 获取考试详情
 * PUT: 更新考试信息
 * DELETE: 删除考试
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { success, error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

// ==================== GET: 获取考试详情 ====================

export const GET = protectedRoute(async (
  request: NextRequest,
  context: ExtendedRouteContext
) => {
  try {
    const client = getSupabaseClient();
    const params = await context.params;
    const id = params?.id;
    
    if (!id) {
      return NextResponse.json(error('缺少考试ID', ErrorCode.BAD_REQUEST), { status: 400 });
    }
    
    const { data, error: dbError } = await client
      .from('exams')
      .select('*')
      .eq('id', id)
      .single();
    
    if (dbError || !data) {
      return NextResponse.json(error('考试不存在', ErrorCode.NOT_FOUND), { status: 404 });
    }
    
    // 获取参考班级信息
    let classes: Array<{ id: string; name: string; grade: number; head_teacher_id: string | null }> = [];
    if (data.grades && data.grades.length > 0) {
      const { data: classesData } = await client
        .from('classes')
        .select('id, name, grade, head_teacher_id')
        .in('grade', data.grades);
      classes = classesData || [];
    }
    
    // 获取已录入成绩统计
    const { count: gradedCount } = await client
      .from('grades')
      .select('*', { count: 'exact', head: true })
      .eq('exam_id', id);
    
    const result = {
      ...mapExamFromDb(data),
      classes,
      gradedCount: gradedCount || 0,
    };
    
    return NextResponse.json(success(result));
  } catch (err) {
    console.error('获取考试详情失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

// ==================== PUT: 更新考试 ====================

export const PUT = protectedRoute(async (
  request: NextRequest,
  context: ExtendedRouteContext
) => {
  try {
    const client = getSupabaseClient();
    const params = await context.params;
    const id = params?.id;
    
    if (!id) {
      return NextResponse.json(error('缺少考试ID', ErrorCode.BAD_REQUEST), { status: 400 });
    }
    
    const body = await request.json();
    
    // 检查考试是否存在
    const { data: existing, error: findError } = await client
      .from('exams')
      .select('id, status, published_at')
      .eq('id', id)
      .single();
    
    if (findError || !existing) {
      return NextResponse.json(error('考试不存在', ErrorCode.NOT_FOUND), { status: 404 });
    }
    
    // 构建更新数据
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    
    if (body.name !== undefined) updateData.name = body.name;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.semester !== undefined) updateData.semester = body.semester;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.grades !== undefined) updateData.grades = body.grades;
    if (body.subjects !== undefined) updateData.subjects = body.subjects;
    if (body.examRooms !== undefined) updateData.exam_rooms = body.examRooms;
    if (body.startDate !== undefined) updateData.start_date = body.startDate;
    if (body.endDate !== undefined) updateData.end_date = body.endDate;
    if (body.totalStudents !== undefined) updateData.total_students = body.totalStudents;
    
    // 状态变更处理
    if (body.status !== undefined && body.status !== existing.status) {
      updateData.status = body.status;
      if (body.status === 'published' && !existing.published_at) {
        updateData.published_at = new Date().toISOString();
      }
    }
    
    const { data, error: dbError } = await client
      .from('exams')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (dbError) {
      console.error('更新考试失败:', dbError);
      return NextResponse.json(error('更新考试失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    return NextResponse.json(success(mapExamFromDb(data)));
  } catch (err) {
    console.error('更新考试失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

// ==================== DELETE: 删除考试 ====================

export const DELETE = protectedRoute(async (
  request: NextRequest,
  context: ExtendedRouteContext
) => {
  try {
    const client = getSupabaseClient();
    const params = await context.params;
    const id = params?.id;
    
    if (!id) {
      return NextResponse.json(error('缺少考试ID', ErrorCode.BAD_REQUEST), { status: 400 });
    }
    
    // 检查考试是否存在
    const { data: existing, error: findError } = await client
      .from('exams')
      .select('id, status')
      .eq('id', id)
      .single();
    
    if (findError || !existing) {
      return NextResponse.json(error('考试不存在', ErrorCode.NOT_FOUND), { status: 404 });
    }
    
    // 只有计划中的考试可以删除
    if (existing.status !== 'planning') {
      return NextResponse.json(error('只能删除计划中的考试', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    // 删除考试
    const { error: dbError } = await client
      .from('exams')
      .delete()
      .eq('id', id);
    
    if (dbError) {
      console.error('删除考试失败:', dbError);
      return NextResponse.json(error('删除考试失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    return NextResponse.json(success({ id, deleted: true }));
  } catch (err) {
    console.error('删除考试失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

// ==================== 辅助函数 ====================

interface ExamRow {
  id: string;
  name: string;
  type: string;
  semester: string | null;
  description: string | null;
  grades: number[] | null;
  grade: number | null;
  subjects: unknown[] | null;
  exam_rooms: unknown[] | null;
  start_date: string;
  end_date: string;
  status: string;
  total_students: number | null;
  submitted_count: number | null;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

function mapExamFromDb(dbExam: ExamRow) {
  return {
    id: dbExam.id,
    name: dbExam.name,
    type: dbExam.type,
    semester: dbExam.semester || '',
    description: dbExam.description,
    grades: dbExam.grades || (dbExam.grade ? [dbExam.grade] : []),
    subjects: dbExam.subjects || [],
    examRooms: dbExam.exam_rooms || [],
    startDate: dbExam.start_date,
    endDate: dbExam.end_date,
    status: dbExam.status,
    totalStudents: dbExam.total_students || 0,
    submittedCount: dbExam.submitted_count || 0,
    createdBy: dbExam.created_by,
    createdByName: dbExam.created_by_name,
    createdAt: dbExam.created_at,
    updatedAt: dbExam.updated_at,
    publishedAt: dbExam.published_at,
  };
}
