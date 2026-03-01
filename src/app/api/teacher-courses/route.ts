/**
 * 科任配置 API
 * 用于管理班级的各科目任课教师
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { 
  success, 
  error, 
  parseQueryParams, 
  createPagination,
  ErrorCode 
} from '@/lib/api-route-utils';

/**
 * GET - 获取科任配置
 * 查询参数：
 * - classId: 班级ID（必填）
 */
export async function GET(request: NextRequest) {
  const params = parseQueryParams(request);
  
  try {
    const client = getSupabaseClient();
    
    if (!params.classId) {
      return NextResponse.json(error('缺少班级ID', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    const { data, error: dbError } = await client
      .from('teacher_courses')
      .select('*')
      .eq('class_id', params.classId)
      .eq('is_active', true);
    
    if (dbError) {
      return NextResponse.json(error('查询失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    // 转换为驼峰格式
    const formattedData = (data || []).map(item => ({
      id: item.id,
      teacherId: item.teacher_id,
      teacherName: item.teacher_name,
      courseId: item.course_id,
      courseName: item.course_name,
      classId: item.class_id,
      className: item.class_name,
      subject: item.subject,
      weeklyHours: item.weekly_hours,
      isActive: item.is_active,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
    
    return NextResponse.json(success(formattedData));
  } catch (err) {
    console.error('Failed to fetch teacher courses:', err);
    return NextResponse.json(error('获取科任配置失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}

/**
 * POST - 保存科任配置
 * 请求体：
 * - classId: 班级ID
 * - className: 班级名称
 * - config: [{ subject, teacherId, weeklyHours }]
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { classId, className, config } = body;
    
    if (!classId || !config || !Array.isArray(config)) {
      return NextResponse.json(error('参数错误', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    const client = getSupabaseClient();
    
    // 先将该班级的所有科任配置设为无效
    await client
      .from('teacher_courses')
      .update({ is_active: false })
      .eq('class_id', classId);
    
    // 获取教师信息
    const teacherIds = config.map((c: { teacherId: string }) => c.teacherId).filter(Boolean);
    const { data: teachers } = await client
      .from('teachers')
      .select('id, name')
      .in('id', teacherIds);
    
    const teacherMap = new Map((teachers || []).map(t => [t.id, t.name]));
    
    // 插入新的配置
    const records = config
      .filter((c: { teacherId: string }) => c.teacherId)
      .map((c: { subject: string; teacherId: string; weeklyHours: number }) => ({
        id: crypto.randomUUID(),
        teacher_id: c.teacherId,
        teacher_name: teacherMap.get(c.teacherId) || '',
        class_id: classId,
        class_name: className,
        subject: c.subject,
        course_name: c.subject,
        weekly_hours: c.weeklyHours,
        is_active: true,
      }));
    
    if (records.length > 0) {
      const { error: insertError } = await client
        .from('teacher_courses')
        .insert(records);
      
      if (insertError) {
        console.error('Insert error:', insertError);
        return NextResponse.json(error('保存失败', ErrorCode.DATABASE_ERROR), { status: 500 });
      }
    }
    
    return NextResponse.json(success({ 
      message: '保存成功',
      count: records.length 
    }));
  } catch (err) {
    console.error('Failed to save teacher courses:', err);
    return NextResponse.json(error('保存科任配置失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}
