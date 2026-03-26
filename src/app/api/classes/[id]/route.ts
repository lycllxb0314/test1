/**
 * 单个班级 API
 * 用于更新班级信息（包括科任）
 */

import { NextRequest } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { ok, fail, serverError, notFound } from '@/lib/api-utils';

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
      return notFound('班级不存在');
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
    
    return ok(formattedData);
  } catch (err) {
    console.error('Failed to fetch class:', err);
    return serverError('获取班级失败');
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
    
    // 先获取当前班级信息
    const { data: currentClass, error: fetchError } = await client
      .from('classes')
      .select('head_teacher_id, sub_teacher_id')
      .eq('id', id)
      .single();
    
    if (fetchError || !currentClass) {
      return notFound('班级不存在');
    }
    
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
    
    // 更新班级信息
    const { data, error: dbError } = await client
      .from('classes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (dbError) {
      console.error('Update error:', dbError);
      return fail('更新失败');
    }
    
    // 同步更新 teachers 表的 head_teacher_class_ids
    // 1. 清除原班主任的关联
    if (currentClass.head_teacher_id && currentClass.head_teacher_id !== body.headTeacherId) {
      const { data: oldTeacher } = await client
        .from('teachers')
        .select('head_teacher_class_ids')
        .eq('id', currentClass.head_teacher_id)
        .single();
      
      if (oldTeacher && oldTeacher.head_teacher_class_ids) {
        const newIds = (oldTeacher.head_teacher_class_ids as string[]).filter(cid => cid !== id);
        await client
          .from('teachers')
          .update({ head_teacher_class_ids: newIds })
          .eq('id', currentClass.head_teacher_id);
      }
    }
    
    // 2. 添加新班主任的关联
    if (body.headTeacherId && body.headTeacherId !== currentClass.head_teacher_id) {
      const { data: newTeacher } = await client
        .from('teachers')
        .select('head_teacher_class_ids')
        .eq('id', body.headTeacherId)
        .single();
      
      if (newTeacher) {
        const existingIds = (newTeacher.head_teacher_class_ids as string[]) || [];
        if (!existingIds.includes(id)) {
          await client
            .from('teachers')
            .update({ head_teacher_class_ids: [...existingIds, id] })
            .eq('id', body.headTeacherId);
        }
      }
    }
    
    return ok({
      id: data.id,
      subTeacherId: data.sub_teacher_id,
      subTeacherName: data.sub_teacher_name,
    });
  } catch (err) {
    console.error('Failed to update class:', err);
    return serverError('更新班级失败');
  }
}
