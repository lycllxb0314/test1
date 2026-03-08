/**
 * 习惯养成统计 API
 * 
 * GET /api/habit/statistics - 获取统计数据
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    const classId = searchParams.get('classId');
    const studentId = searchParams.get('studentId');
    const month = searchParams.get('month');
    const academicYear = searchParams.get('academicYear');
    
    // 并行获取各项统计数据
    const [
      studentGoalsResult,
      recordsResult,
      starsResult,
      goalsByCategoryResult,
    ] = await Promise.all([
      // 学生目标统计
      client
        .from('habit_student_goals')
        .select('status, approval_status', { count: 'exact' })
        .eq('class_id', classId || '')
        .eq('month', month || ''),
      
      // 打卡记录统计
      client
        .from('habit_daily_records')
        .select('status', { count: 'exact' })
        .eq('student_id', studentId || '')
        .eq('month', month || ''),
      
      // 习惯之星统计
      client
        .from('habit_stars')
        .select('category', { count: 'exact' })
        .eq('class_id', classId || '')
        .eq('month', month || ''),
      
      // 各类别目标数量
      client
        .from('habit_goal_templates')
        .select('category', { count: 'exact' }),
    ]);
    
    // 处理学生目标统计
    const studentGoals = studentGoalsResult.data || [];
    const studentGoalsStats = {
      total: studentGoals.length,
      approved: studentGoals.filter(g => g.approval_status === 'approved').length,
      pending: studentGoals.filter(g => g.approval_status === 'pending').length,
      rejected: studentGoals.filter(g => g.approval_status === 'rejected').length,
    };
    
    // 处理打卡记录统计
    const records = recordsResult.data || [];
    const recordsStats = {
      total: records.length,
      completed: records.filter(r => r.status === 'completed').length,
      pending: records.filter(r => r.status === 'pending').length,
      missed: records.filter(r => r.status === 'missed').length,
      makeUp: records.filter(r => r.status === 'make_up').length,
      completionRate: records.length > 0 
        ? Math.round((records.filter(r => r.status === 'completed').length / records.length) * 100)
        : 0,
    };
    
    // 处理习惯之星统计
    const stars = starsResult.data || [];
    const starsStats = {
      total: stars.length,
      byCategory: {} as Record<string, number>,
    };
    stars.forEach(s => {
      starsStats.byCategory[s.category] = (starsStats.byCategory[s.category] || 0) + 1;
    });
    
    // 处理目标库统计
    const goalsByCategory = goalsByCategoryResult.data || [];
    const goalsStats = {
      total: goalsByCategory.length,
      byCategory: {} as Record<string, number>,
    };
    goalsByCategory.forEach(g => {
      goalsStats.byCategory[g.category] = (goalsStats.byCategory[g.category] || 0) + 1;
    });
    
    return NextResponse.json({
      success: true,
      data: {
        studentGoals: studentGoalsStats,
        records: recordsStats,
        stars: starsStats,
        goals: goalsStats,
      },
    });
  } catch (error) {
    console.error('Failed to fetch statistics:', error);
    return NextResponse.json({ success: false, error: '获取统计数据失败' }, { status: 500 });
  }
}
