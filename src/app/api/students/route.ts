/**
 * 学生批量查询 API
 * 用于根据ID列表批量获取学生信息
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { success, error, ErrorCode } from '@/lib/api-route-utils';

/**
 * GET - 批量获取学生信息
 * 查询参数：
 * - ids: 学生ID列表，逗号分隔
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');
    
    if (!idsParam) {
      return NextResponse.json(error('缺少学生ID参数', ErrorCode.BAD_REQUEST), { status: 400 });
    }
    
    const ids = idsParam.split(',').filter(Boolean);
    
    if (ids.length === 0) {
      return NextResponse.json(success([]));
    }
    
    const client = getSupabaseClient();
    
    const { data, error: dbError } = await client
      .from('students')
      .select('id, name, student_number, grade, class_id, class_name')
      .in('id', ids);
    
    if (dbError) {
      console.error('Failed to fetch students:', dbError);
      return NextResponse.json(error('获取学生信息失败', ErrorCode.DATABASE_ERROR), { status: 500 });
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
    console.error('Failed to fetch students:', err);
    return NextResponse.json(error('获取学生信息失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}
