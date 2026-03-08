/**
 * 习惯之星 API
 * 
 * GET /api/habit/stars - 获取习惯之星列表
 * POST /api/habit/stars - 创建习惯之星（德育处评选）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 数据库返回类型（匹配实际表结构）
interface HabitStarRecord {
  id: string;
  student_id: string;
  month: string;
  categories: string[] | null;
  total_score: number | null;
  achievements: string | null;
  grade: number | null;
  created_at: string;
}

export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    const studentId = searchParams.get('studentId');
    const month = searchParams.get('month');
    const grade = searchParams.get('grade');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    let query = client
      .from('habit_stars')
      .select('*');
    
    if (studentId) {
      query = query.eq('student_id', studentId);
    }
    if (month) {
      query = query.eq('month', month);
    }
    if (grade) {
      query = query.eq('grade', parseInt(grade));
    }
    
    query = query
      .order('created_at', { ascending: false })
      .limit(limit);
    
    const { data, error } = await query;
    
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    // 获取学生信息以关联班级
    const studentIds = [...new Set((data || []).map((s: HabitStarRecord) => s.student_id))];
    const { data: students } = await client
      .from('students')
      .select('id, name, class_id, class_name, grade')
      .in('id', studentIds);
    
    const studentMap: Record<string, { name: string; classId: string; className: string; grade: number }> = {};
    (students || []).forEach(s => {
      studentMap[s.id] = {
        name: s.name,
        classId: s.class_id,
        className: s.class_name,
        grade: s.grade,
      };
    });
    
    const formattedData = (data || []).map((s: HabitStarRecord) => {
      const student = studentMap[s.student_id] || {};
      return {
        id: s.id,
        studentId: s.student_id,
        studentName: student.name || '未知',
        classId: student.classId || '',
        className: student.className || '',
        grade: student.grade || s.grade || 0,
        month: s.month,
        categories: s.categories || [],
        score: s.total_score,
        achievements: s.achievements,
        createdAt: s.created_at,
      };
    });
    
    // 统计
    const statistics = {
      total: formattedData.length,
      byCategory: {} as Record<string, number>,
      byClass: {} as Record<string, number>,
    };
    
    formattedData.forEach(s => {
      if (s.categories && Array.isArray(s.categories)) {
        s.categories.forEach((cat: string) => {
          statistics.byCategory[cat] = (statistics.byCategory[cat] || 0) + 1;
        });
      }
      if (s.classId) {
        statistics.byClass[s.classId] = (statistics.byClass[s.classId] || 0) + 1;
      }
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
    
    const { studentId, month, categories, score, achievements, grade } = body;
    
    if (!studentId || !month) {
      return NextResponse.json({ 
        success: false, 
        error: '学生ID和月份为必填项' 
      }, { status: 400 });
    }
    
    // 获取学生信息
    const { data: student } = await client
      .from('students')
      .select('id, name, grade')
      .eq('id', studentId)
      .single();
    
    if (!student) {
      return NextResponse.json({ 
        success: false, 
        error: '学生不存在' 
      }, { status: 400 });
    }
    
    const { data, error } = await client
      .from('habit_stars')
      .insert({
        id: `star_${studentId}_${month}`,
        student_id: studentId,
        month,
        categories: categories || [],
        total_score: score || null,
        achievements: achievements || null,
        grade: grade || student.grade,
        created_at: new Date().toISOString(),
      })
      .select();
    
    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ 
          success: false, 
          error: '该学生本月已是习惯之星' 
        }, { status: 400 });
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        id: data[0].id,
        studentId: data[0].student_id,
        month: data[0].month,
        categories: data[0].categories,
        score: data[0].total_score,
        achievements: data[0].achievements,
      },
      message: '习惯之星评选成功',
    });
  } catch (error) {
    console.error('Failed to create star:', error);
    return NextResponse.json({ success: false, error: '创建习惯之星失败' }, { status: 500 });
  }
}
