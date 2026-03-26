/**
 * 学生完整档案 API
 * 
 * 数据源：Supabase 数据库（唯一数据源）
 * v3.0: 移除Mock fallback，数据库失败时返回错误响应
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { StudentFullProfile, HabitCategory } from '@/types';

// 习惯类别配置
const HABIT_CATEGORIES: { category: HabitCategory; categoryName: string }[] = [
  { category: 'civilization', categoryName: '文明习惯' },
  { category: 'writing', categoryName: '书写习惯' },
  { category: 'reading', categoryName: '阅读习惯' },
  { category: 'sports', categoryName: '运动习惯' },
  { category: 'safety', categoryName: '安全习惯' },
  { category: 'hygiene', categoryName: '卫生习惯' },
  { category: 'aesthetic', categoryName: '审美习惯' },
  { category: 'labor', categoryName: '劳动习惯' },
];

/**
 * 根据习惯评价记录构建习惯档案
 */
function buildHabitProfile(assessments: Array<{
  id: string;
  student_id: string;
  student_name?: string;
  class_id?: string;
  class_name?: string;
  category: string;
  type: string;
  title: string;
  content?: string;
  score: number;
  scene?: string;
  occurred_at?: string;
  created_at: string;
}>): StudentFullProfile['habitProfile'] {
  // 计算各类别的分数
  const categoryScores: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};
  
  // 初始化
  HABIT_CATEGORIES.forEach(c => {
    categoryScores[c.category] = 0;
    categoryCounts[c.category] = 0;
  });
  
  // 累计分数
  assessments.forEach(a => {
    if (categoryScores[a.category] !== undefined) {
      categoryScores[a.category] += a.score;
      categoryCounts[a.category]++;
    }
  });
  
  // 计算星级数量（总分>=20为班级级，>=50为校级，>=80为年级级）
  const totalPositiveScore = assessments
    .filter(a => a.score > 0)
    .reduce((sum, a) => sum + a.score, 0);
  const habitStarCount = Math.min(5, Math.floor(totalPositiveScore / 15));
  
  // 构建各类别评价
  const habitEvaluations = HABIT_CATEGORIES.map(c => {
    const baseScore = 80;
    const earnedScore = categoryScores[c.category];
    const bonusScore = Math.min(20, earnedScore * 2);
    const finalScore = Math.min(100, Math.max(0, baseScore + bonusScore));
    
    return {
      category: c.category,
      categoryName: c.categoryName,
      score: finalScore,
      maxScore: 100,
      rate: finalScore,
      trend: (earnedScore > 0 ? 'up' : 'stable') as 'up' | 'stable' | 'down',
    };
  });
  
  // 构建最近评价记录
  const recentAssessments = assessments.slice(0, 10).map(a => ({
    id: a.id,
    studentId: a.student_id,
    studentName: a.student_name || '',
    classId: a.class_id || '',
    className: a.class_name || '',
    category: a.category as HabitCategory,
    type: a.type as 'praise' | 'improve',
    title: a.title,
    content: a.content || '',
    score: a.score,
    scene: (a.scene || 'campus') as 'campus' | 'classroom' | 'home' | 'activity' | 'other',
    recorderId: '',
    recorderName: '',
    recorderRole: 'teacher' as const,
    occurredAt: a.occurred_at || a.created_at,
    createdAt: a.created_at,
  }));
  
  return {
    overallScore: Math.round(habitEvaluations.reduce((sum, e) => sum + e.rate, 0) / habitEvaluations.length),
    level: (habitStarCount >= 4 ? '优秀' : habitStarCount >= 3 ? '良好' : habitStarCount >= 2 ? '合格' : '待提高') as '优秀' | '良好' | '合格' | '待提高',
    habitStarCount,
    monthlyStars: [],
    categoryScores: habitEvaluations,
    recentAssessments,
  };
}

/**
 * GET - 获取学生完整档案
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = getSupabaseClient();

    // 获取学生基本信息
    const { data: student, error: studentError } = await client
      .from('students')
      .select('*')
      .eq('id', id)
      .single();

    if (studentError || !student) {
      return NextResponse.json({
        success: false,
        error: '学生不存在',
      }, { status: 404 });
    }

    // 获取学业记录
    const { data: academicRecords } = await client
      .from('student_academic_records')
      .select('*')
      .eq('student_id', id)
      .order('created_at', { ascending: false });

    // 获取荣誉记录
    const { data: honors } = await client
      .from('student_honors')
      .select('*')
      .eq('student_id', id)
      .order('date', { ascending: false });

    // 获取成长记录
    const { data: growthRecords } = await client
      .from('student_growth_records')
      .select('*')
      .eq('student_id', id)
      .order('date', { ascending: false });

    // 获取德育记录
    const { data: moralRecords } = await client
      .from('student_moral_records')
      .select('*')
      .eq('student_id', id)
      .order('date', { ascending: false });

    // 获取习惯评价记录
    const { data: habitAssessments } = await client
      .from('student_habit_assessments')
      .select('*')
      .eq('student_id', id)
      .order('occurred_at', { ascending: false });

    // 获取班主任信息（从班级表）
    let headTeacherId: string | undefined;
    let headTeacherName: string | undefined;
    
    if (student.class_id) {
      const { data: classData } = await client
        .from('classes')
        .select('head_teacher_id, head_teacher_name')
        .eq('id', student.class_id)
        .single();
      
      if (classData) {
        headTeacherId = classData.head_teacher_id;
        headTeacherName = classData.head_teacher_name;
      }
    }

    // 组装完整档案
    // 年级名称映射
    const gradeNames: Record<number, string> = {
      1: '一年级', 2: '二年级', 3: '三年级',
      4: '四年级', 5: '五年级', 6: '六年级',
    };
    
    const fullProfile: StudentFullProfile = {
      id: student.id,
      studentNo: student.student_no,
      name: student.name,
      gender: student.gender,
      birthDate: student.birth_date,
      idCard: student.id_card,
      ethnicity: student.ethnicity,
      nativePlace: student.native_place,
      politicalStatus: student.political_status,
      
      grade: student.grade,
      gradeName: gradeNames[student.grade] || `${student.grade}年级`,
      classId: student.class_id,
      className: student.class_name,
      classNumber: student.class_number,
      enrollmentDate: student.enrollment_date,
      studentType: student.student_type,
      
      phone: student.phone,
      address: student.address,
      homeAddress: student.home_address,
      
      familyType: student.family_type,
      parents: student.parents || [],
      emergencyContact: student.emergency_contact,
      emergencyPhone: student.emergency_phone,
      
      headTeacherId: headTeacherId,
      headTeacherName: headTeacherName,
      
      status: student.status,
      statusReason: student.status_reason,
      
      academicRecords: (academicRecords || []).map(ar => ({
        id: ar.id,
        studentId: ar.student_id,
        semester: ar.semester,
        examType: ar.exam_type,
        subject: ar.subject,
        score: ar.score,
        level: ar.level,
        classRank: ar.class_rank,
        gradeRank: ar.grade_rank,
        progress: ar.progress,
        teacherComment: ar.teacher_comment,
        createdAt: ar.created_at,
      })),
      
      honors: (honors || []).map(h => ({
        id: h.id,
        studentId: h.student_id,
        title: h.title,
        level: h.level,
        category: h.category,
        issuer: h.issuer,
        date: h.date,
        certificateNo: h.certificate_no,
        description: h.description,
      })),
      
      growthRecords: (growthRecords || []).map(gr => ({
        id: gr.id,
        studentId: gr.student_id,
        type: gr.type,
        title: gr.title,
        description: gr.description,
        date: gr.date,
        operator: gr.operator,
        attachments: gr.attachments,
        createdAt: gr.created_at,
      })),
      
      moralRecords: (moralRecords || []).map(mr => ({
        id: mr.id,
        studentId: mr.student_id,
        type: mr.type,
        title: mr.title,
        content: mr.content,
        score: mr.score,
        date: mr.date,
        recorder: mr.recorder,
        createdAt: mr.created_at,
      })),
      
      // 习惯评价数据
      habitProfile: buildHabitProfile(habitAssessments || []),
      
      createdAt: student.created_at,
      updatedAt: student.updated_at,
    };

    return NextResponse.json({
      success: true,
      data: fullProfile,
      source: 'database',
    });
  } catch (error) {
    console.error('Failed to fetch student profile:', error);
    return NextResponse.json({
      success: false,
      error: '获取学生档案失败',
    }, { status: 500 });
  }
}

/**
 * PUT - 更新学生信息
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const client = getSupabaseClient();

    // 构建更新数据（只更新基本信息字段）
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // 允许更新的字段
    const allowedFields = [
      'phone', 'address', 'homeAddress', 'emergencyContact', 'emergencyPhone',
      'parents', 'familyType', 'status', 'statusReason'
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        // 转换为数据库字段名
        const dbField = field.replace(/([A-Z])/g, '_$1').toLowerCase();
        updateData[dbField] = body[field];
      }
    }

    const { data, error } = await client
      .from('students')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
      message: '学生信息更新成功',
    });
  } catch (error) {
    console.error('Failed to update student:', error);
    return NextResponse.json({
      success: false,
      error: '更新学生信息失败',
    }, { status: 500 });
  }
}
