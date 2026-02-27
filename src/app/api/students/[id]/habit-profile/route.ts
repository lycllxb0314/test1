import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { habitCategoryNames, type HabitCategory } from '@/types';

/**
 * GET - 获取学生习惯档案
 * 整合学生各习惯类别得分、荣誉统计、成长轨迹等数据
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') || new Date().getFullYear().toString();

    // 1. 获取学生基本信息
    const { data: student, error: studentError } = await client
      .from('students')
      .select('id, name, class_id, class_name, grade')
      .eq('id', id)
      .single();

    if (studentError || !student) {
      return NextResponse.json({
        success: false,
        error: '学生不存在',
      }, { status: 404 });
    }

    // 2. 获取各习惯类别的评价记录统计
    const categories = Object.keys(habitCategoryNames) as HabitCategory[];
    const categoryScores: {
      category: HabitCategory;
      score: number;
      maxScore: number;
      rate: number;
      trend: 'up' | 'down' | 'stable';
    }[] = [];

    for (const category of categories) {
      // 获取该类别的评价记录
      const { data: assessments } = await client
        .from('habit_assessments')
        .select('score')
        .eq('student_id', id)
        .eq('category', category);

      const totalScore = (assessments || []).reduce((sum, a) => sum + (a.score || 0), 0);
      const maxScore = 100; // 每个类别满分100

      // 计算趋势（对比上月）
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const { data: lastMonthAssessments } = await client
        .from('habit_assessments')
        .select('score')
        .eq('student_id', id)
        .eq('category', category)
        .gte('occurred_at', lastMonth.toISOString());

      const lastMonthScore = (lastMonthAssessments || []).reduce((sum, a) => sum + (a.score || 0), 0);

      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (totalScore > lastMonthScore + 5) {
        trend = 'up';
      } else if (totalScore < lastMonthScore - 5) {
        trend = 'down';
      }

      categoryScores.push({
        category,
        score: totalScore,
        maxScore,
        rate: maxScore > 0 ? Math.min(100, (totalScore / maxScore) * 100) : 0,
        trend,
      });
    }

    // 3. 计算总体评价
    const totalScore = categoryScores.reduce((sum, c) => sum + c.score, 0);
    const totalMaxScore = categoryScores.reduce((sum, c) => sum + c.maxScore, 0);
    const overallRate = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;

    let level: '优秀' | '良好' | '合格' | '待提高' = '待提高';
    if (overallRate >= 90) {
      level = '优秀';
    } else if (overallRate >= 75) {
      level = '良好';
    } else if (overallRate >= 60) {
      level = '合格';
    }

    // 4. 获取习惯之星荣誉
    const { data: stars } = await client
      .from('habit_stars')
      .select('month')
      .eq('student_id', id);

    // 5. 获取月度趋势数据
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const month = new Date();
      month.setMonth(month.getMonth() - i);
      const monthStr = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
      
      const { data: monthAssessments } = await client
        .from('habit_assessments')
        .select('score')
        .eq('student_id', id)
        .gte('occurred_at', `${monthStr}-01`)
        .lt('occurred_at', `${monthStr}-32`);

      const monthScore = (monthAssessments || []).reduce((sum, a) => sum + (a.score || 0), 0);

      months.push({
        month: monthStr,
        rate: monthScore,
      });
    }

    // 6. 分析突出表现和待改进项
    const sortedCategories = [...categoryScores].sort((a, b) => b.rate - a.rate);
    const highlights = sortedCategories.slice(0, 2).map(c => ({
      category: c.category,
      description: `${habitCategoryNames[c.category]}表现优秀，达成率${c.rate.toFixed(1)}%`,
    }));

    const improvements = sortedCategories.slice(-2).filter(c => c.rate < 60).map(c => ({
      category: c.category,
      suggestion: `建议加强${habitCategoryNames[c.category]}的培养`,
    }));

    // 组装完整的习惯档案
    const profile = {
      studentId: id,
      studentName: student.name,
      classId: student.class_id,
      className: student.class_name,
      grade: student.grade,

      // 各习惯类别得分
      categoryScores,

      // 总体评价
      totalScore,
      totalMaxScore,
      overallRate,
      level,

      // 荣誉统计
      habitStarCount: (stars || []).length,
      monthlyStars: (stars || []).map(s => s.month),

      // 成长轨迹
      monthlyTrend: months,

      // 突出表现
      highlights,

      // 待改进
      improvements,

      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error('Failed to fetch student habit profile:', error);
    return NextResponse.json({
      success: false,
      error: '获取学生习惯档案失败',
    }, { status: 500 });
  }
}
