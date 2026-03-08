/**
 * 班级学生列表 API
 * 用于获取指定班级的所有学生
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { success, error, ErrorCode } from '@/lib/api-route-utils';

/**
 * GET - 获取班级学生列表
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getSupabaseClient();
    
    const { data, error: dbError } = await client
      .from('students')
      .select('id, name, student_number, grade, class_id, class_name')
      .eq('class_id', id)
      .order('student_number', { ascending: true });
    
    if (dbError) {
      console.error('Failed to fetch students:', dbError);
      return NextResponse.json(error('获取学生列表失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    // 转换为驼峰格式
    const formattedData = (data || []).map(student => ({
      id: student.id,
      name: student.name,
      studentNumber: student.student_number,
      grade: student.grade,
      classId: student.class_id,
      className: student.class_name,
    }));
    
    return NextResponse.json(success(formattedData));
  } catch (err) {
    console.error('Failed to fetch class students:', err);
    return NextResponse.json(error('获取学生列表失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}
