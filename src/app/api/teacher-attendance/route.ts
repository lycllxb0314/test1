/**
 * 教师考勤 API
 * 
 * GET: 获取教师考勤
 * POST: 记录考勤
 * 
 * ⚠️ 架构原则：
 * - 使用统一认证中间件
 */

import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { ok, fail, serverError } from '@/lib/api';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * GET: 获取教师考勤
 */
export const GET = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const teacherId = searchParams.get('teacherId');
  const month = searchParams.get('month');

  try {
    const client = getSupabaseClient();
    
    let query = client
      .from('teacher_attendance')
      .select('*')
      .order('date', { ascending: false });
    
    if (date) {
      query = query.eq('date', date);
    }
    if (teacherId) {
      query = query.eq('teacher_id', teacherId);
    }
    if (month) {
      query = query.gte('date', `${month}-01`).lte('date', `${month}-31`);
    }
    
    const { data, error } = await query;
    
    if (error) {
      return fail(error.message);
    }
    
    const formattedData = (data || []).map(r => ({
      id: r.id,
      teacherId: r.teacher_id,
      teacherName: r.teacher_name,
      date: r.date,
      checkInTime: r.check_in_time,
      checkOutTime: r.check_out_time,
      status: r.status,
      remarks: r.remarks,
      createdAt: r.created_at,
    }));
    
    return ok(formattedData);
  } catch (error) {
    console.error('获取教师考勤失败:', error);
    return serverError('服务器错误');
  }
});

/**
 * POST: 记录考勤
 */
export const POST = withAuth(async (request: NextRequest) => {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    
    if (!body.teacherId || !body.date) {
      return fail('缺少必要参数');
    }
    
    const { data, error } = await client
      .from('teacher_attendance')
      .upsert({
        id: body.id || `ta-${Date.now()}`,
        teacher_id: body.teacherId,
        teacher_name: body.teacherName,
        date: body.date,
        check_in_time: body.checkInTime,
        check_out_time: body.checkOutTime,
        status: body.status || 'present',
        remarks: body.remarks,
      })
      .select()
      .single();
    
    if (error) {
      return fail(error.message);
    }
    
    return ok({
      id: data.id,
      teacherId: data.teacher_id,
      date: data.date,
      status: data.status,
    });
  } catch (error) {
    console.error('记录考勤失败:', error);
    return serverError('服务器错误');
  }
});
