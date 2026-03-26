/**
 * 学生荣誉管理 API
 * 
 * 功能：
 * - GET: 获取学生荣誉列表（支持筛选、分页、统计）
 * - POST: 创建学生荣誉
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getUserFromSession } from '@/lib/auth/session';
import { success, error, ErrorCode } from '@/lib/api-route-utils';

/** 荣誉级别 */
type HonorLevel = '国家级' | '省级' | '市级' | '区级' | '校级' | '班级';

/** 荣誉类别 */
type HonorCategory = '综合' | '学习' | '德育' | '体育' | '艺术' | '劳动' | '科技';

/** 荣誉输入 */
interface HonorInput {
  studentId: string;
  studentName: string;
  className?: string;
  grade?: string;
  title: string;
  level: HonorLevel;
  category: HonorCategory;
  issuer?: string;
  date: string;
  certificateNo?: string;
  description?: string;
}

/**
 * GET - 获取学生荣誉列表
 * 
 * 查询参数：
 * - studentId: 按学生筛选
 * - level: 按级别筛选
 * - category: 按类别筛选
 * - grade: 按年级筛选
 * - className: 按班级筛选
 * - year: 按年份筛选
 * - page: 页码
 * - pageSize: 每页数量
 * - statistics: 是否返回统计数据
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    const studentId = searchParams.get('studentId');
    const level = searchParams.get('level');
    const category = searchParams.get('category');
    const grade = searchParams.get('grade');
    const className = searchParams.get('className');
    const year = searchParams.get('year');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const needStatistics = searchParams.get('statistics') === 'true';
    
    // 构建基础查询
    let query = supabase
      .from('student_honors')
      .select('*', { count: 'exact' });
    
    // 筛选条件
    if (studentId) {
      query = query.eq('student_id', studentId);
    }
    if (level) {
      query = query.eq('level', level);
    }
    if (category) {
      query = query.eq('category', category);
    }
    if (grade) {
      query = query.eq('grade', grade);
    }
    if (className) {
      query = query.eq('class_name', className);
    }
    if (year) {
      query = query.gte('date', `${year}-01-01`).lte('date', `${year}-12-31`);
    }
    
    // 分页
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    query = query
      .order('date', { ascending: false })
      .range(from, to);
    
    const { data, error: fetchError, count } = await query;
    
    if (fetchError) {
      console.error('获取荣誉列表失败:', fetchError);
      return NextResponse.json(error('获取荣誉列表失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    // 转换数据格式（驼峰命名）
    const honors = (data || []).map((item: Record<string, unknown>) => ({
      id: item.id,
      studentId: item.student_id,
      studentName: item.student_name,
      className: item.class_name,
      grade: item.grade,
      title: item.title,
      level: item.level,
      category: item.category,
      issuer: item.issuer,
      date: item.date,
      certificateNo: item.certificate_no,
      description: item.description,
      createdAt: item.created_at,
    }));
    
    // 如果需要统计数据
    let statistics = null;
    if (needStatistics) {
      statistics = await getStatistics(supabase, year);
    }
    
    return NextResponse.json({
      success: true,
      data: honors,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
      statistics,
    });
  } catch (err) {
    console.error('学生荣誉API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}

/**
 * POST - 创建学生荣誉
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const user = await getUserFromSession(request);
    
    if (!user) {
      return NextResponse.json(error('未登录', ErrorCode.UNAUTHORIZED), { status: 401 });
    }
    
    const body: HonorInput = await request.json();
    
    // 验证必填字段
    if (!body.studentId || !body.studentName || !body.title || !body.level || !body.category || !body.date) {
      return NextResponse.json(error('缺少必填字段', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    // 创建荣誉记录
    const { data, error: createError } = await supabase
      .from('student_honors')
      .insert({
        student_id: body.studentId,
        student_name: body.studentName,
        class_name: body.className,
        grade: body.grade,
        title: body.title,
        level: body.level,
        category: body.category,
        issuer: body.issuer,
        date: body.date,
        certificate_no: body.certificateNo,
        description: body.description,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (createError) {
      console.error('创建荣誉失败:', createError);
      return NextResponse.json(error('创建荣誉失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    return NextResponse.json(success(data, 'database'));
  } catch (err) {
    console.error('创建荣誉API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}

/**
 * 获取统计数据
 */
async function getStatistics(supabase: any, year?: string | null) {
  try {
    // 基础查询
    let baseQuery = supabase.from('student_honors').select('*');
    if (year) {
      baseQuery = baseQuery.gte('date', `${year}-01-01`).lte('date', `${year}-12-31`);
    }
    
    const { data: allHonors, error } = await baseQuery;
    
    if (error || !allHonors) {
      return null;
    }
    
    // 按级别统计
    const byLevel: Record<string, number> = {};
    const levelOrder = ['国家级', '省级', '市级', '区级', '校级', '班级'];
    levelOrder.forEach(level => {
      byLevel[level] = allHonors.filter((h: Record<string, unknown>) => h.level === level).length;
    });
    
    // 按类别统计
    const byCategory: Record<string, number> = {};
    const categories = ['综合', '学习', '德育', '体育', '艺术', '劳动', '科技'];
    categories.forEach(cat => {
      byCategory[cat] = allHonors.filter((h: Record<string, unknown>) => h.category === cat).length;
    });
    
    // 按年级统计
    const byGrade: Record<string, number> = {};
    const gradeOrder = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'];
    gradeOrder.forEach(g => {
      byGrade[g] = allHonors.filter((h: Record<string, unknown>) => h.grade === g).length;
    });
    
    // 按月份统计（本年度）
    const byMonth: Record<string, number> = {};
    const currentYear = year || new Date().getFullYear().toString();
    for (let m = 1; m <= 12; m++) {
      const monthStr = m.toString().padStart(2, '0');
      byMonth[monthStr] = allHonors.filter((h: Record<string, unknown>) => 
        (h.date as string).startsWith(`${currentYear}-${monthStr}`)
      ).length;
    }
    
    // 获取获奖学生数（去重）
    const uniqueStudents = new Set(allHonors.map((h: Record<string, unknown>) => h.student_id));
    
    // Top学生（获奖最多的学生）
    const studentHonorCount: Record<string, { count: number; name: string }> = {};
    allHonors.forEach((h: Record<string, unknown>) => {
      const sid = h.student_id as string;
      if (!studentHonorCount[sid]) {
        studentHonorCount[sid] = { count: 0, name: h.student_name as string };
      }
      studentHonorCount[sid].count++;
    });
    
    const topStudents = Object.entries(studentHonorCount)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([id, data]) => ({ studentId: id, studentName: data.name, count: data.count }));
    
    return {
      total: allHonors.length,
      uniqueStudents: uniqueStudents.size,
      byLevel,
      byCategory,
      byGrade,
      byMonth,
      topStudents,
    };
  } catch (err) {
    console.error('获取统计数据失败:', err);
    return null;
  }
}
