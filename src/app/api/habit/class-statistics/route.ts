/**
 * 习惯养成班级统计 API
 * 
 * GET /api/habit/class-statistics - 获取各班级习惯养成统计数据
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 年级名称映射
const GRADE_NAMES = ['', '一年级', '二年级', '三年级', '四年级', '五年级', '六年级'];

export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    const grade = searchParams.get('grade');
    const month = searchParams.get('month') || new Date().toISOString().slice(0, 7);
    const academicYear = searchParams.get('academicYear');
    
    // 获取所有班级
    let classQuery = client
      .from('classes')
      .select('id, name, grade, grade_name, class_number, head_teacher_name, student_count, status')
      .eq('status', 'active')
      .order('grade')
      .order('class_number');
    
    if (grade && grade !== 'all') {
      classQuery = classQuery.eq('grade', parseInt(grade));
    }
    
    const { data: classes, error: classError } = await classQuery;
    
    if (classError) {
      return NextResponse.json({ success: false, error: classError.message }, { status: 500 });
    }
    
    if (!classes || classes.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        statistics: {
          totalClasses: 0,
          totalStudents: 0,
          totalGoals: 0,
          totalRecords: 0,
          avgCompletionRate: 0,
          totalStars: 0,
        },
      });
    }
    
    const classIds = classes.map(c => c.id);
    
    // 并行获取各班级的统计数据
    const [goalsResult, recordsResult, starsResult] = await Promise.all([
      // 各班级学生目标
      client
        .from('habit_student_goals')
        .select('class_id, status, approval_status, category')
        .in('class_id', classIds)
        .eq('month', month),
      
      // 各班级打卡记录
      client
        .from('habit_daily_records')
        .select('student_id, status, category')
        .eq('month', month),
      
      // 各班级习惯之星
      client
        .from('habit_stars')
        .select('class_id, category')
        .in('class_id', classIds)
        .eq('month', month),
    ]);
    
    const goals = goalsResult.data || [];
    const records = recordsResult.data || [];
    const stars = starsResult.data || [];
    
    // 获取学生班级映射
    const studentIds = [...new Set(records.map(r => r.student_id))];
    const { data: students } = await client
      .from('students')
      .select('id, class_id')
      .in('id', studentIds);
    
    const studentClassMap: Record<string, string> = {};
    (students || []).forEach(s => {
      studentClassMap[s.id] = s.class_id;
    });
    
    // 按班级聚合统计
    const classStatsMap: Record<string, {
      goalsTotal: number;
      goalsApproved: number;
      goalsByCategory: Record<string, number>;
      recordsCompleted: number;
      recordsMissed: number;
      starsCount: number;
      starsByCategory: Record<string, number>;
    }> = {};
    
    // 初始化
    classIds.forEach(id => {
      classStatsMap[id] = {
        goalsTotal: 0,
        goalsApproved: 0,
        goalsByCategory: {},
        recordsCompleted: 0,
        recordsMissed: 0,
        starsCount: 0,
        starsByCategory: {},
      };
    });
    
    // 统计目标
    goals.forEach(g => {
      if (classStatsMap[g.class_id]) {
        classStatsMap[g.class_id].goalsTotal++;
        if (g.approval_status === 'approved') {
          classStatsMap[g.class_id].goalsApproved++;
        }
        if (g.category) {
          classStatsMap[g.class_id].goalsByCategory[g.category] = 
            (classStatsMap[g.class_id].goalsByCategory[g.category] || 0) + 1;
        }
      }
    });
    
    // 统计打卡记录
    records.forEach(r => {
      const classId = studentClassMap[r.student_id];
      if (classId && classStatsMap[classId]) {
        if (r.status === 'completed') {
          classStatsMap[classId].recordsCompleted++;
        } else if (r.status === 'missed') {
          classStatsMap[classId].recordsMissed++;
        }
      }
    });
    
    // 统计习惯之星
    stars.forEach(s => {
      if (classStatsMap[s.class_id]) {
        classStatsMap[s.class_id].starsCount++;
        if (s.category) {
          classStatsMap[s.class_id].starsByCategory[s.category] = 
            (classStatsMap[s.class_id].starsByCategory[s.category] || 0) + 1;
        }
      }
    });
    
    // 组装班级统计数据
    const classStatistics = classes.map(c => {
      const stats = classStatsMap[c.id];
      const totalRecords = stats.recordsCompleted + stats.recordsMissed;
      const completionRate = totalRecords > 0 
        ? Math.round((stats.recordsCompleted / totalRecords) * 100) 
        : 0;
      
      return {
        id: c.id,
        name: c.name,
        grade: c.grade,
        gradeName: c.grade_name || GRADE_NAMES[c.grade] || '',
        classNumber: c.class_number,
        headTeacherName: c.head_teacher_name,
        studentCount: c.student_count || 0,
        status: c.status,
        habitStats: {
          goalsTotal: stats.goalsTotal,
          goalsApproved: stats.goalsApproved,
          goalsByCategory: stats.goalsByCategory,
          recordsCompleted: stats.recordsCompleted,
          recordsMissed: stats.recordsMissed,
          completionRate,
          starsCount: stats.starsCount,
          starsByCategory: stats.starsByCategory,
        },
      };
    });
    
    // 计算总体统计
    const totalStats = {
      totalClasses: classes.length,
      totalStudents: classes.reduce((sum, c) => sum + (c.student_count || 0), 0),
      totalGoals: goals.length,
      totalRecords: records.length,
      totalCompleted: records.filter(r => r.status === 'completed').length,
      totalMissed: records.filter(r => r.status === 'missed').length,
      totalStars: stars.length,
      avgCompletionRate: 0,
      byGrade: {} as Record<number, {
        classCount: number;
        studentCount: number;
        goalsTotal: number;
        completionRate: number;
        starsCount: number;
      }>,
    };
    
    // 计算平均完成率
    const rates = classStatistics.filter(c => c.habitStats.goalsTotal > 0).map(c => c.habitStats.completionRate);
    totalStats.avgCompletionRate = rates.length > 0 
      ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) 
      : 0;
    
    // 按年级汇总
    classStatistics.forEach(c => {
      if (!totalStats.byGrade[c.grade]) {
        totalStats.byGrade[c.grade] = {
          classCount: 0,
          studentCount: 0,
          goalsTotal: 0,
          completionRate: 0,
          starsCount: 0,
        };
      }
      totalStats.byGrade[c.grade].classCount++;
      totalStats.byGrade[c.grade].studentCount += c.studentCount;
      totalStats.byGrade[c.grade].goalsTotal += c.habitStats.goalsTotal;
      totalStats.byGrade[c.grade].starsCount += c.habitStats.starsCount;
    });
    
    // 计算各年级平均完成率
    Object.keys(totalStats.byGrade).forEach(gradeKey => {
      const gradeClasses = classStatistics.filter(c => c.grade === parseInt(gradeKey) && c.habitStats.goalsTotal > 0);
      if (gradeClasses.length > 0) {
        const avgRate = gradeClasses.reduce((sum, c) => sum + c.habitStats.completionRate, 0) / gradeClasses.length;
        totalStats.byGrade[parseInt(gradeKey)].completionRate = Math.round(avgRate);
      }
    });
    
    return NextResponse.json({
      success: true,
      data: classStatistics,
      month,
      statistics: totalStats,
    });
  } catch (error) {
    console.error('Failed to fetch class statistics:', error);
    return NextResponse.json({ success: false, error: '获取班级统计数据失败' }, { status: 500 });
  }
}
