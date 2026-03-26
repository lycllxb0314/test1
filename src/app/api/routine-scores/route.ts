/**
 * 班级常规评分 API
 * 
 * 功能：
 * - GET: 获取班级常规评分记录（支持统计）
 * - POST: 创建评分记录
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getUserFromSession } from '@/lib/auth/session';
import { success, error, ErrorCode } from '@/lib/api-route-utils';

/** 评分维度 */
type ScoreCategory = '文明礼仪' | '遵守纪律' | '班容班貌' | '环境卫生' | '文体活动' | '学习习惯';

/** 评分记录 */
interface ScoreRecord {
  classId: string;
  className: string;
  grade: number;
  date: string;
  category: ScoreCategory;
  score: number;
  maxScore: number;
  teacherId: string;
  teacherName: string;
  remark?: string;
}

/**
 * GET - 获取班级常规评分记录
 * 
 * 查询参数：
 * - classId: 按班级筛选
 * - grade: 按年级筛选
 * - category: 按评分维度筛选
 * - startDate/endDate: 日期范围
 * - summary: 是否返回汇总统计
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    const classId = searchParams.get('classId');
    const grade = searchParams.get('grade');
    const category = searchParams.get('category');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const needSummary = searchParams.get('summary') === 'true';
    
    // 构建查询
    let query = supabase
      .from('routine_scores')
      .select('*', { count: 'exact' });
    
    // 筛选条件
    if (classId) {
      query = query.eq('class_id', classId);
    }
    if (grade) {
      query = query.eq('grade', parseInt(grade));
    }
    if (category) {
      query = query.eq('category', category);
    }
    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }
    
    query = query.order('date', { ascending: false });
    
    const { data, error: fetchError, count } = await query;
    
    if (fetchError) {
      console.error('获取评分记录失败:', fetchError);
      return NextResponse.json(error('获取评分记录失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    // 转换数据格式
    const records = (data || []).map((item: Record<string, unknown>) => ({
      id: item.id,
      classId: item.class_id,
      className: item.class_name,
      grade: item.grade,
      date: item.date,
      category: item.category,
      score: item.score,
      maxScore: item.max_score,
      teacherId: item.teacher_id,
      teacherName: item.teacher_name,
      remark: item.remark,
      createdAt: item.created_at,
    }));
    
    // 如果需要汇总统计
    let summary = null;
    if (needSummary && records.length > 0) {
      // 按班级汇总
      const byClass: Record<string, { className: string; grade: number; totalScore: number; count: number; avgScore: number }> = {};
      
      // 按维度汇总
      const byCategory: Record<string, { totalScore: number; count: number }> = {};
      
      // 按年级汇总
      const byGrade: Record<number, { totalScore: number; count: number }> = {};
      
      records.forEach((r: typeof records[0]) => {
        const classId = r.classId as string;
        const className = r.className as string;
        const grade = r.grade as number;
        const category = r.category as string;
        const score = r.score as number;
        const maxScore = r.maxScore as number;
        
        // 按班级
        if (!byClass[classId]) {
          byClass[classId] = { className, grade, totalScore: 0, count: 0, avgScore: 0 };
        }
        byClass[classId].totalScore += score;
        byClass[classId].count++;
        
        // 按维度
        if (!byCategory[category]) {
          byCategory[category] = { totalScore: 0, count: 0 };
        }
        byCategory[category].totalScore += score;
        byCategory[category].count++;
        
        // 按年级
        if (!byGrade[grade]) {
          byGrade[grade] = { totalScore: 0, count: 0 };
        }
        byGrade[grade].totalScore += score;
        byGrade[grade].count++;
      });
      
      // 计算平均分
      Object.values(byClass).forEach(c => {
        c.avgScore = Math.round((c.totalScore / c.count) * 100) / 100;
      });
      
      // 班级排名
      const classRanking = Object.entries(byClass)
        .map(([id, data]) => ({ classId: id, ...data }))
        .sort((a, b) => b.avgScore - a.avgScore);
      
      summary = {
        totalRecords: records.length,
        byCategory,
        byGrade,
        classRanking,
      };
    }
    
    return NextResponse.json({
      success: true,
      data: records,
      count,
      summary,
    });
  } catch (err) {
    console.error('班级常规评分API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}

/**
 * POST - 创建评分记录
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const user = await getUserFromSession(request);
    
    if (!user) {
      return NextResponse.json(error('未登录', ErrorCode.UNAUTHORIZED), { status: 401 });
    }
    
    const body = await request.json();
    
    // 验证必填字段
    if (!body.classId || !body.className || !body.grade || !body.date || !body.category || body.score === undefined) {
      return NextResponse.json(error('缺少必填字段', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    // 创建评分记录
    const { data, error: createError } = await supabase
      .from('routine_scores')
      .insert({
        class_id: body.classId,
        class_name: body.className,
        grade: body.grade,
        date: body.date,
        category: body.category,
        score: body.score,
        max_score: body.maxScore || 10,
        teacher_id: user.id,
        teacher_name: user.name,
        remark: body.remark,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (createError) {
      console.error('创建评分记录失败:', createError);
      return NextResponse.json(error('创建评分记录失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    return NextResponse.json(success(data, 'database'));
  } catch (err) {
    console.error('创建评分记录API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}
