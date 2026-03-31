/**
 * 课程表 API
 * 
 * GET: 获取课程表
 * POST: 创建课程
 * 
 * ⚠️ 架构原则：
 * - 使用统一认证中间件
 * - 禁止在 API 层直接操作数据库（应通过 Service 层）
 */

import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { ok, fail, serverError } from '@/lib/api';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * GET: 获取课程表
 */
export const GET = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const classId = searchParams.get('classId');
  const teacherId = searchParams.get('teacherId');
  const semester = searchParams.get('semester');

  try {
    const client = getSupabaseClient();
    
    let query = client
      .from('schedules')
      .select('*')
      .order('day_of_week')
      .order('period');
    
    if (classId) {
      query = query.eq('class_id', classId);
    }
    if (teacherId) {
      query = query.eq('teacher_id', teacherId);
    }
    if (semester) {
      query = query.eq('semester', semester);
    }
    
    const { data, error } = await query;
    
    if (error) {
      return fail(error.message);
    }
    
    const formattedData = (data || []).map(s => ({
      id: s.id,
      classId: s.class_id,
      className: s.class_name,
      teacherId: s.teacher_id,
      teacherName: s.teacher_name,
      subject: s.subject,
      dayOfWeek: s.day_of_week,
      period: s.period,
      semester: s.semester,
      classroom: s.classroom,
    }));
    
    return ok(formattedData);
  } catch (error) {
    console.error('获取课程表失败:', error);
    return serverError('服务器错误');
  }
});

/**
 * POST: 创建课程
 */
export const POST = withAuth(async (request: NextRequest) => {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    
    if (!body.classId || !body.subject || !body.teacherId) {
      return fail('缺少必要参数');
    }
    
    const { data, error } = await client
      .from('schedules')
      .insert({
        id: `sch-${Date.now()}`,
        class_id: body.classId,
        class_name: body.className,
        teacher_id: body.teacherId,
        teacher_name: body.teacherName,
        subject: body.subject,
        day_of_week: body.dayOfWeek,
        period: body.period,
        semester: body.semester,
        classroom: body.classroom,
      })
      .select()
      .single();
    
    if (error) {
      return fail(error.message);
    }
    
    return ok({
      id: data.id,
      classId: data.class_id,
      subject: data.subject,
      teacherId: data.teacher_id,
    });
  } catch (error) {
    console.error('创建课程失败:', error);
    return serverError('服务器错误');
  }
});
