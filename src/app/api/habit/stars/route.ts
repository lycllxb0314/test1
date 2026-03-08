/**
 * 习惯之星 API
 * 
 * GET /api/habit/stars - 获取习惯之星列表
 * POST /api/habit/stars - 创建习惯之星（德育处评选）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 数据库返回类型
interface HabitStarRecord {
  id: string;
  class_id: string;
  student_id: string;
  month: string;
  academic_year: string;
  category: string;
  score: number | null;
  rank: number | null;
  nomination_reason: string | null;
  photo_url: string | null;
  approved_by: string | null;
  created_at: string;
}

// 请求数据类型
interface StarRequest {
  classId: string;
  studentId: string;
  month: string;
  academicYear: string;
  category: string;
  score?: number;
  rank?: number;
  nominationReason?: string;
  photoUrl?: string;
  approvedBy?: string;
}

export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    const classId = searchParams.get('classId');
    const studentId = searchParams.get('studentId');
    const month = searchParams.get('month');
    const academicYear = searchParams.get('academicYear');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    let query = client
      .from('habit_stars')
      .select('*');
    
    if (classId) {
      query = query.eq('class_id', classId);
    }
    if (studentId) {
      query = query.eq('student_id', studentId);
    }
    if (month) {
      query = query.eq('month', month);
    }
    if (academicYear) {
      query = query.eq('academic_year', academicYear);
    }
    if (category) {
      query = query.eq('category', category);
    }
    
    query = query
      .order('created_at', { ascending: false })
      .limit(limit);
    
    const { data, error } = await query;
    
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    const formattedData = (data || []).map((s: HabitStarRecord) => ({
      id: s.id,
      classId: s.class_id,
      studentId: s.student_id,
      month: s.month,
      academicYear: s.academic_year,
      category: s.category,
      score: s.score,
      rank: s.rank,
      nominationReason: s.nomination_reason,
      photoUrl: s.photo_url,
      approvedBy: s.approved_by,
      createdAt: s.created_at,
    }));
    
    // 统计
    const statistics = {
      total: formattedData.length,
      byCategory: {} as Record<string, number>,
      byClass: {} as Record<string, number>,
    };
    
    formattedData.forEach(s => {
      statistics.byCategory[s.category] = (statistics.byCategory[s.category] || 0) + 1;
      statistics.byClass[s.classId] = (statistics.byClass[s.classId] || 0) + 1;
    });
    
    return NextResponse.json({
      success: true,
      data: formattedData,
      statistics,
    });
  } catch (error) {
    console.error('Failed to fetch stars:', error);
    return NextResponse.json({ success: false, error: '获取习惯之星列表失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    
    // 支持批量创建
    const stars: StarRequest[] = Array.isArray(body.stars) ? body.stars : [body];
    
    const insertData = stars.map((s: StarRequest) => ({
      class_id: s.classId,
      student_id: s.studentId,
      month: s.month,
      academic_year: s.academicYear,
      category: s.category,
      score: s.score || null,
      rank: s.rank || null,
      nomination_reason: s.nominationReason || null,
      photo_url: s.photoUrl || null,
      approved_by: s.approvedBy || null,
    }));
    
    const { data, error } = await client
      .from('habit_stars')
      .insert(insertData)
      .select();
    
    if (error) {
      // 检查是否是重复创建
      if (error.code === '23505') {
        return NextResponse.json({ 
          success: false, 
          error: '该学生本月已当选该类别的习惯之星' 
        }, { status: 400 });
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    const formattedData = (data || []).map((s: HabitStarRecord) => ({
      id: s.id,
      classId: s.class_id,
      studentId: s.student_id,
      month: s.month,
      academicYear: s.academic_year,
      category: s.category,
      score: s.score,
      rank: s.rank,
      nominationReason: s.nomination_reason,
      photoUrl: s.photo_url,
      approvedBy: s.approved_by,
      createdAt: s.created_at,
    }));
    
    return NextResponse.json({
      success: true,
      data: formattedData,
      message: '习惯之星评选成功',
    });
  } catch (error) {
    console.error('Failed to create stars:', error);
    return NextResponse.json({ success: false, error: '创建习惯之星失败' }, { status: 500 });
  }
}
