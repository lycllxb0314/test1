import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { StudentFullProfile, Parent } from '@/types';

/**
 * Mock学生完整档案数据
 */
const mockStudentProfiles: Record<string, StudentFullProfile> = {
  's001': {
    id: 's001',
    studentNo: '2024001',
    name: '张三',
    gender: 'male',
    birthDate: '2012-05-15',
    idCard: '3508**********0515',
    ethnicity: '汉族',
    nativePlace: '福建龙岩',
    politicalStatus: '少先队员',
    
    grade: 6,
    gradeName: '六年级',
    classId: 'c6-1',
    className: '六年级1班',
    classNumber: 1,
    enrollmentDate: '2018-09-01',
    studentType: '普通',
    
    phone: '138****1001',
    address: '龙岩市新罗区东城街道',
    homeAddress: '龙岩市新罗区东城街道xx路xx号',
    
    familyType: '核心家庭',
    parents: [
      { id: 'p1', name: '张父', relationship: '父亲', phone: '139****2001', isPrimary: true, wechat: 'zhangpa' },
      { id: 'p2', name: '张母', relationship: '母亲', phone: '139****2002', isPrimary: false, wechat: 'zhangma' },
    ],
    emergencyContact: '张父',
    emergencyPhone: '139****2001',
    
    headTeacherId: 't001',
    headTeacherName: '王明华',
    
    status: '在校',
    
    academicRecords: [
      { id: 'ar1', studentId: 's001', semester: '2024-2025-1', examType: '期中', subject: '语文', score: 92, level: '优秀', classRank: 5, gradeRank: 28, createdAt: '2024-11-15' },
      { id: 'ar2', studentId: 's001', semester: '2024-2025-1', examType: '期中', subject: '数学', score: 88, level: '良好', classRank: 8, gradeRank: 45, createdAt: '2024-11-15' },
      { id: 'ar3', studentId: 's001', semester: '2024-2025-1', examType: '期中', subject: '英语', score: 95, level: '优秀', classRank: 3, gradeRank: 15, createdAt: '2024-11-15' },
      { id: 'ar4', studentId: 's001', semester: '2023-2024-2', examType: '期末', subject: '语文', score: 90, level: '优秀', classRank: 6, gradeRank: 32, createdAt: '2024-06-25' },
      { id: 'ar5', studentId: 's001', semester: '2023-2024-2', examType: '期末', subject: '数学', score: 85, level: '良好', classRank: 10, gradeRank: 52, createdAt: '2024-06-25' },
    ],
    
    honors: [
      { id: 'h1', studentId: 's001', title: '校级三好学生', level: '校级', category: '综合', issuer: '学校', date: '2024-06' },
      { id: 'h2', studentId: 's001', title: '学习之星', level: '班级', category: '学习', issuer: '六年级1班', date: '2024-11' },
      { id: 'h3', studentId: 's001', title: '区级作文比赛二等奖', level: '区级', category: '学习', issuer: '新罗区教育局', date: '2024-04' },
      { id: 'h4', studentId: 's001', title: '习惯之星', level: '校级', category: '德育', issuer: '学校', date: '2024-03' },
    ],
    
    growthRecords: [
      { id: 'gr1', studentId: 's001', type: '入学', title: '入学登记', description: '一年级入学', date: '2018-09-01', createdAt: '2018-09-01' },
      { id: 'gr2', studentId: 's001', type: '表彰', title: '获得三好学生', description: '2023-2024学年校级三好学生', date: '2024-06-30', createdAt: '2024-06-30' },
      { id: 'gr3', studentId: 's001', type: '家访', title: '家访记录', description: '了解学生家庭情况和学习环境', date: '2024-10-15', operator: '王明华', createdAt: '2024-10-15' },
    ],
    
    habitProfile: {
      overallScore: 92,
      level: '优秀',
      habitStarCount: 3,
      monthlyStars: ['2024-03', '2024-05', '2024-09'],
    },
    
    moralRecords: [
      { id: 'mr1', studentId: 's001', type: '表扬', title: '主动打扫卫生', content: '主动帮助班级打扫卫生', score: 2, date: '2024-10-20', recorder: '王明华', createdAt: '2024-10-20' },
      { id: 'mr2', studentId: 's001', type: '志愿服务', title: '参加社区志愿服务', content: '参与社区环境整治活动', score: 3, date: '2024-09-15', recorder: '王明华', createdAt: '2024-09-15' },
    ],
    
    attendanceStats: {
      totalDays: 180,
      presentDays: 178,
      absentDays: 2,
      lateDays: 0,
      earlyLeaveDays: 0,
      attendanceRate: 98.89,
    },
    
    createdAt: '2018-09-01',
    updatedAt: '2024-11-20',
  },
  's002': {
    id: 's002',
    studentNo: '2024002',
    name: '李四',
    gender: 'female',
    birthDate: '2012-08-22',
    ethnicity: '汉族',
    nativePlace: '福建龙岩',
    politicalStatus: '少先队员',
    
    grade: 6,
    gradeName: '六年级',
    classId: 'c6-1',
    className: '六年级1班',
    classNumber: 1,
    enrollmentDate: '2018-09-01',
    
    familyType: '核心家庭',
    parents: [
      { id: 'p3', name: '李父', relationship: '父亲', phone: '137****3001', isPrimary: true },
      { id: 'p4', name: '李母', relationship: '母亲', phone: '137****3002', isPrimary: false },
    ],
    emergencyContact: '李母',
    emergencyPhone: '137****3002',
    
    headTeacherId: 't001',
    headTeacherName: '王明华',
    
    status: '在校',
    
    academicRecords: [
      { id: 'ar6', studentId: 's002', semester: '2024-2025-1', examType: '期中', subject: '语文', score: 95, level: '优秀', classRank: 2, gradeRank: 12, createdAt: '2024-11-15' },
      { id: 'ar7', studentId: 's002', semester: '2024-2025-1', examType: '期中', subject: '数学', score: 98, level: '优秀', classRank: 1, gradeRank: 5, createdAt: '2024-11-15' },
    ],
    
    honors: [
      { id: 'h5', studentId: 's002', title: '市级数学竞赛一等奖', level: '市级', category: '学习', issuer: '龙岩市教育局', date: '2024-05' },
      { id: 'h6', studentId: 's002', title: '校级三好学生', level: '校级', category: '综合', issuer: '学校', date: '2024-06' },
    ],
    
    growthRecords: [
      { id: 'gr4', studentId: 's002', type: '入学', title: '入学登记', date: '2018-09-01', createdAt: '2018-09-01' },
    ],
    
    habitProfile: {
      overallScore: 95,
      level: '优秀',
      habitStarCount: 5,
      monthlyStars: ['2024-01', '2024-03', '2024-05', '2024-09', '2024-10'],
    },
    
    moralRecords: [],
    
    attendanceStats: {
      totalDays: 180,
      presentDays: 180,
      absentDays: 0,
      lateDays: 0,
      earlyLeaveDays: 0,
      attendanceRate: 100,
    },
    
    createdAt: '2018-09-01',
    updatedAt: '2024-11-20',
  },
};

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

    // 尝试从数据库获取完整档案
    // 首先获取学生基本信息
    const { data: student, error: studentError } = await client
      .from('students')
      .select('*')
      .eq('id', id)
      .single();

    if (studentError || !student) {
      // 数据库查询失败，使用Mock数据
      const mockProfile = mockStudentProfiles[id];
      if (!mockProfile) {
        // 如果没有对应的Mock数据，生成一个基础档案
        const mockStudent = Object.values(mockStudentProfiles).find(
          s => s.id === id || s.studentNo === id
        );
        
        if (!mockStudent) {
          return NextResponse.json({
            success: false,
            error: '学生不存在',
          }, { status: 404 });
        }
        
        return NextResponse.json({
          success: true,
          data: mockStudent,
          source: 'mock',
        });
      }

      return NextResponse.json({
        success: true,
        data: mockProfile,
        source: 'mock',
      });
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

    // 组装完整档案
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
      gradeName: student.grade_name,
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
      
      headTeacherId: student.head_teacher_id,
      headTeacherName: student.head_teacher_name,
      
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
      // Mock模式：返回模拟成功响应
      const mockProfile = mockStudentProfiles[id];
      if (mockProfile) {
        return NextResponse.json({
          success: true,
          data: { ...mockProfile, ...body, updatedAt: new Date().toISOString() },
          message: '学生信息更新成功（模拟）',
          source: 'mock',
        });
      }
      
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
