/**
 * 单个班级 API
 * 用于更新班级信息（包括科任）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { success, error, ErrorCode } from '@/lib/api-route-utils';

/**
 * GET - 获取单个班级详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getSupabaseClient();
    
    const { data, error: dbError } = await client
      .from('classes')
      .select('*')
      .eq('id', id)
      .single();
    
    if (dbError || !data) {
      return NextResponse.json(error('班级不存在', ErrorCode.NOT_FOUND), { status: 404 });
    }
    
    // 转换为驼峰格式
    const formattedData = {
      id: data.id,
      name: data.name,
      grade: data.grade,
      gradeName: data.grade_name,
      classNumber: data.class_number,
      headTeacherId: data.head_teacher_id,
      headTeacherName: data.head_teacher_name,
      subTeacherId: data.sub_teacher_id,
      subTeacherName: data.sub_teacher_name,
      classroomId: data.classroom_id,
      classroomName: data.classroom_name,
      building: data.building,
      studentCount: data.student_count,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
    
    return NextResponse.json(success(formattedData));
  } catch (err) {
    console.error('Failed to fetch class:', err);
    return NextResponse.json(error('获取班级失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}

/**
 * PATCH - 更新班级信息
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const client = getSupabaseClient();
    
    // 构建更新数据
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    
    // 科任（副班主任）
    if (body.subTeacherId !== undefined) {
      updateData.sub_teacher_id = body.subTeacherId || null;
      
      // 获取教师姓名
      if (body.subTeacherId) {
        const { data: teacher } = await client
          .from('teachers')
          .select('name')
          .eq('id', body.subTeacherId)
          .single();
        updateData.sub_teacher_name = teacher?.name || null;
      } else {
        updateData.sub_teacher_name = null;
      }
    }
    
    // 班主任
    if (body.headTeacherId !== undefined) {
      updateData.head_teacher_id = body.headTeacherId;
      
      if (body.headTeacherId) {
        const { data: teacher } = await client
          .from('teachers')
          .select('name')
          .eq('id', body.headTeacherId)
          .single();
        updateData.head_teacher_name = teacher?.name || null;
      }
    }
    
    // 教室
    if (body.classroomName !== undefined) {
      updateData.classroom_name = body.classroomName;
    }
    
    const { data, error: dbError } = await client
      .from('classes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (dbError) {
      console.error('Update error:', dbError);
      return NextResponse.json(error('更新失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    return NextResponse.json(success({
      id: data.id,
      subTeacherId: data.sub_teacher_id,
      subTeacherName: data.sub_teacher_name,
    }));
  } catch (err) {
    console.error('Failed to update class:', err);
    return NextResponse.json(error('更新班级失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}
