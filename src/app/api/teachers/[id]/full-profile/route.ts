/**
 * 教师完整档案API路由
 * 
 * 数据源：Supabase 数据库（唯一数据源）
 * v3.0: 移除Mock fallback，数据库失败时返回错误响应
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { success, error, ErrorCode } from '@/lib/api';
import type { TeacherProfile } from '@/types';

/**
 * GET - 获取教师完整档案
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getSupabaseClient();
    
    // 1. 获取教师基本信息
    const { data: teacher, error: teacherError } = await client
      .from('teachers')
      .select('*')
      .eq('id', id)
      .single();

    if (teacherError || !teacher) {
      return NextResponse.json(
        error('教师不存在', ErrorCode.NOT_FOUND),
        { status: 404 }
      );
    }

    // 2. 并行获取关联数据
    const [honorsResult, trainingsResult, achievementsResult, recordsResult] = await Promise.all([
      client.from('teacher_honors').select('*').eq('teacher_id', id).order('date', { ascending: false }),
      client.from('teacher_trainings').select('*').eq('teacher_id', id).order('start_date', { ascending: false }),
      client.from('teacher_achievements').select('*').eq('teacher_id', id).order('date', { ascending: false }),
      client.from('teacher_records').select('*').eq('teacher_id', id).order('date', { ascending: false }),
    ]);

    // 3. 组装完整档案
    const fullProfile: TeacherProfile = {
      ...teacher,
      honors: honorsResult.data || [],
      trainings: trainingsResult.data || [],
      achievements: achievementsResult.data || [],
      records: recordsResult.data || [],
    };

    return NextResponse.json(success(fullProfile, 'database'));
  } catch (err) {
    console.error('Failed to fetch teacher profile:', err);
    return NextResponse.json(
      error('获取教师档案失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

/**
 * PUT - 更新教师完整档案
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const client = getSupabaseClient();
    
    // 更新基本信息
    const { data, error: dbError } = await client
      .from('teachers')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (dbError) {
      return NextResponse.json(
        error('更新教师档案失败: ' + dbError.message, ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }
    
    return NextResponse.json(success(data, 'database'));
  } catch (err) {
    console.error('Failed to update teacher profile:', err);
    return NextResponse.json(
      error('更新教师档案失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}
