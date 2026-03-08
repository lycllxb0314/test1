import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { type HabitCategory, habitCategoryNames } from '@/types';

/**
 * GET - 获取习惯之星候选列表
 * 查询参数：
 * - month: 月份 YYYY-MM（必填）
 * - status: pending, approved, rejected
 * - recommendType: full_star, category_star, progress_star
 * - grade: 年级
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const status = searchParams.get('status');
    const recommendType = searchParams.get('recommendType');
    const grade = searchParams.get('grade');

    if (!month) {
      return NextResponse.json({
        success: false,
        error: '缺少月份参数',
      }, { status: 400 });
    }

    // 构建查询
    let query = client
      .from('habit_star_candidates')
      .select('*')
      .eq('month', month)
      .order('recommend_score', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (recommendType) {
      query = query.eq('recommend_type', recommendType);
    }

    const { data, error } = await query.limit(200);

    if (error) {
      throw error;
    }

    // 如果有数据，获取学生信息补充
    let enrichedData = data || [];
    if (enrichedData.length > 0) {
      const studentIds = [...new Set(enrichedData.map(c => c.student_id).filter(Boolean))];
      
      if (studentIds.length > 0) {
        const { data: studentsData } = await client
          .from('students')
          .select('id, name, student_number, grade, class_id, class_name')
          .in('id', studentIds);
        
        const studentMap = (studentsData || []).reduce((acc, s) => {
          acc[s.id] = s;
          return acc;
        }, {} as Record<string, { name: string; student_number: string; grade: number; class_id: string; class_name: string }>);

        // 按年级过滤
        if (grade) {
          enrichedData = enrichedData.filter(c => {
            const student = studentMap[c.student_id];
            return student?.grade === parseInt(grade);
          });
        }
        
        // 补充学生信息
        enrichedData = enrichedData.map(candidate => {
          const student = studentMap[candidate.student_id];
          return {
            id: candidate.id,
            studentId: candidate.student_id,
            studentName: student?.name || '',
            studentNumber: student?.student_number || '',
            grade: student?.grade || 0,
            className: student?.class_name || '',
            month: candidate.month,
            totalScore: candidate.total_score,
            categoriesAchieved: candidate.categories_achieved || [],
            goalsCompletionRate: candidate.goals_completion_rate,
            improvementRate: candidate.improvement_rate,
            assessmentsCount: candidate.assessments_count,
            praiseCount: candidate.praise_count,
            recommendType: candidate.recommend_type,
            recommendReason: candidate.recommend_reason,
            recommendScore: candidate.recommend_score,
            status: candidate.status,
            reviewedAt: candidate.reviewed_at,
            reviewedBy: candidate.reviewed_by,
            reviewerName: candidate.reviewer_name,
            reviewNotes: candidate.review_notes,
            createdAt: candidate.created_at,
          };
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: enrichedData,
    });
  } catch (error) {
    console.error('Failed to fetch star candidates:', error);
    return NextResponse.json({
      success: false,
      error: '获取候选名单失败',
    }, { status: 500 });
  }
}

/**
 * POST - 生成习惯之星推荐（自动计算）
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    const { month, forceRegenerate = false } = body;

    if (!month) {
      return NextResponse.json({
        success: false,
        error: '缺少月份参数',
      }, { status: 400 });
    }

    // 检查是否已有推荐数据
    if (!forceRegenerate) {
      const { data: existing } = await client
        .from('habit_star_candidates')
        .select('id')
        .eq('month', month)
        .limit(1);

      if (existing && existing.length > 0) {
        return NextResponse.json({
          success: true,
          message: '本月推荐已生成，如需重新生成请使用强制模式',
          data: { count: existing.length },
        });
      }
    }

    // 如果强制重新生成，先删除旧数据
    if (forceRegenerate) {
      await client
        .from('habit_star_candidates')
        .delete()
        .eq('month', month);
    }

    // 获取本月所有学生的评价数据
    const monthStart = `${month}-01`;
    const [year, m] = month.split('-').map(Number);
    const nextMonth = m === 12 ? `${year + 1}-01` : `${year}-${(m + 1).toString().padStart(2, '0')}`;
    const monthEnd = `${nextMonth}-01`;

    // 1. 获取评价记录
    const { data: assessments } = await client
      .from('habit_assessments')
      .select('student_id, score, category, created_at')
      .gte('occurred_at', monthStart)
      .lt('occurred_at', monthEnd);

    // 2. 获取小目标数据
    const { data: goals } = await client
      .from('student_goals')
      .select('student_id, category, target_count, completed_count, status')
      .eq('month', month);

    // 3. 获取上月数据（用于计算提升）
    const prevMonth = m === 1 ? `${year - 1}-12` : `${year}-${(m - 1).toString().padStart(2, '0')}`;
    const prevMonthStart = `${prevMonth}-01`;
    const prevMonthEnd = monthStart;

    const { data: prevAssessments } = await client
      .from('habit_assessments')
      .select('student_id, score')
      .gte('occurred_at', prevMonthStart)
      .lt('occurred_at', prevMonthEnd);

    // 4. 获取学生列表
    const { data: students } = await client
      .from('students')
      .select('id, name, grade, class_name');

    if (!students || students.length === 0) {
      return NextResponse.json({
        success: true,
        message: '暂无学生数据',
        data: { candidates: [] },
      });
    }

    // 计算每个学生的数据
    const candidates: Array<{
      studentId: string;
      totalScore: number;
      categoriesAchieved: string[];
      goalsCompletionRate: number;
      improvementRate: number;
      assessmentsCount: number;
      praiseCount: number;
      recommendTypes: Array<{
        type: string;
        reason: string;
        score: number;
      }>;
    }> = [];

    for (const student of students) {
      const studentAssessments = (assessments || []).filter(a => a.student_id === student.id);
      const studentGoals = (goals || []).filter(g => g.student_id === student.id);
      const studentPrevAssessments = (prevAssessments || []).filter(a => a.student_id === student.id);

      // 计算得分
      const totalScore = studentAssessments.reduce((sum, a) => sum + (a.score || 0), 0);
      const assessmentsCount = studentAssessments.length;
      const praiseCount = studentAssessments.filter(a => a.score > 0).length;

      // 计算各类别达成率
      const categoryScores: Record<string, { total: number; count: number }> = {};
      const categories: HabitCategory[] = ['civilization', 'writing', 'reading', 'sports', 'safety', 'hygiene', 'aesthetic', 'labor'];
      
      for (const cat of categories) {
        const catAssessments = studentAssessments.filter(a => a.category === cat);
        categoryScores[cat] = {
          total: catAssessments.reduce((sum, a) => sum + (a.score > 0 ? 1 : 0), 0),
          count: catAssessments.length,
        };
      }

      // 目标完成率
      const goalsCompletionRate = studentGoals.length > 0
        ? studentGoals.reduce((sum, g) => sum + (g.target_count > 0 ? (g.completed_count / g.target_count) : 0), 0) / studentGoals.length * 100
        : 0;

      // 提升比例
      const prevScore = studentPrevAssessments.reduce((sum, a) => sum + (a.score || 0), 0);
      const improvementRate = prevScore > 0 ? ((totalScore - prevScore) / Math.abs(prevScore)) * 100 : 0;

      // 计算达成的类别（达到90%以上的类别）
      const categoriesAchieved: string[] = [];
      for (const [cat, scores] of Object.entries(categoryScores)) {
        if (scores.count >= 3 && scores.total / scores.count >= 0.9) {
          categoriesAchieved.push(cat);
        }
      }

      // 推荐类型判断
      const recommendTypes: Array<{ type: string; reason: string; score: number }> = [];

      // 1. 全习惯之星：八大习惯全部达标
      if (categoriesAchieved.length === 8) {
        recommendTypes.push({
          type: 'full_star',
          reason: '八大习惯全部达到优秀标准，表现卓越',
          score: 100,
        });
      }

      // 2. 单项习惯之星：某项习惯突出
      for (const cat of categoriesAchieved) {
        const catName = habitCategoryNames[cat as HabitCategory] || cat;
        recommendTypes.push({
          type: 'category_star',
          reason: `${catName}表现优秀，达标率超过90%`,
          score: 70 + categoryScores[cat].count,  // 基础分+次数加分
        });
      }

      // 3. 进步之星：提升比例超过20%
      if (improvementRate >= 20 && totalScore > 0) {
        recommendTypes.push({
          type: 'progress_star',
          reason: `本月进步显著，得分提升${improvementRate.toFixed(1)}%`,
          score: 60 + improvementRate * 0.5,
        });
      }

      if (recommendTypes.length > 0) {
        candidates.push({
          studentId: student.id,
          totalScore,
          categoriesAchieved,
          goalsCompletionRate,
          improvementRate,
          assessmentsCount,
          praiseCount,
          recommendTypes,
        });
      }
    }

    // 保存推荐数据
    const insertData = [];
    for (const candidate of candidates) {
      for (const rec of candidate.recommendTypes) {
        insertData.push({
          student_id: candidate.studentId,
          month,
          total_score: candidate.totalScore,
          categories_achieved: candidate.categoriesAchieved,
          goals_completion_rate: candidate.goalsCompletionRate,
          improvement_rate: candidate.improvementRate,
          assessments_count: candidate.assessmentsCount,
          praise_count: candidate.praiseCount,
          recommend_type: rec.type,
          recommend_reason: rec.reason,
          recommend_score: Math.min(100, rec.score),
          status: 'pending',
        });
      }
    }

    if (insertData.length > 0) {
      const { error: insertError } = await client
        .from('habit_star_candidates')
        .insert(insertData);

      if (insertError) {
        throw insertError;
      }
    }

    return NextResponse.json({
      success: true,
      message: `已生成 ${candidates.length} 名学生的 ${insertData.length} 条推荐记录`,
      data: {
        studentCount: candidates.length,
        recordCount: insertData.length,
      },
    });
  } catch (error) {
    console.error('Failed to generate star recommendations:', error);
    return NextResponse.json({
      success: false,
      error: '生成推荐失败',
    }, { status: 500 });
  }
}

/**
 * PATCH - 审核候选（批准/拒绝）
 */
export async function PATCH(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    const { id, status, reviewedBy, reviewerName, reviewNotes } = body;

    if (!id || !status || !reviewedBy || !reviewerName) {
      return NextResponse.json({
        success: false,
        error: '缺少必要参数',
      }, { status: 400 });
    }

    // 更新候选状态
    const { data, error } = await client
      .from('habit_star_candidates')
      .update({
        status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewedBy,
        reviewer_name: reviewerName,
        review_notes: reviewNotes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // 如果批准，同步到习惯之星表
    if (status === 'approved') {
      // 获取学生信息
      const { data: student } = await client
        .from('students')
        .select('grade')
        .eq('id', data.student_id)
        .single();

      await client
        .from('habit_stars')
        .insert({
          student_id: data.student_id,
          month: data.month,
          categories: data.categories_achieved,
          total_score: data.total_score,
          achievements: data.recommend_reason,
          grade: student?.grade,
        });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        status: data.status,
      },
    });
  } catch (error) {
    console.error('Failed to review candidate:', error);
    return NextResponse.json({
      success: false,
      error: '审核失败',
    }, { status: 500 });
  }
}
