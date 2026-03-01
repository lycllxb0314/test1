import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { StudentFullProfile, Parent, HabitCategory } from '@/types';

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
    const count = categoryCounts[c.category];
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
      // 各类别得分
      categoryScores: [
        { category: 'civilization' as HabitCategory, categoryName: '文明习惯', score: 95, maxScore: 100, rate: 95, trend: 'stable' },
        { category: 'writing' as HabitCategory, categoryName: '书写习惯', score: 88, maxScore: 100, rate: 88, trend: 'up' },
        { category: 'reading' as HabitCategory, categoryName: '阅读习惯', score: 92, maxScore: 100, rate: 92, trend: 'up' },
        { category: 'sports' as HabitCategory, categoryName: '运动习惯', score: 90, maxScore: 100, rate: 90, trend: 'stable' },
        { category: 'safety' as HabitCategory, categoryName: '安全习惯', score: 95, maxScore: 100, rate: 95, trend: 'stable' },
        { category: 'hygiene' as HabitCategory, categoryName: '卫生习惯', score: 93, maxScore: 100, rate: 93, trend: 'up' },
        { category: 'aesthetic' as HabitCategory, categoryName: '审美习惯', score: 85, maxScore: 100, rate: 85, trend: 'stable' },
        { category: 'labor' as HabitCategory, categoryName: '劳动习惯', score: 96, maxScore: 100, rate: 96, trend: 'up' },
      ],
      // 习惯评价记录（全过程）
      recentAssessments: [
        { id: 'ha1', studentId: 's001', studentName: '张三', classId: 'c6-1', className: '六年级1班', category: 'civilization' as HabitCategory, type: 'praise', title: '主动问好', content: '见到老师主动问好，表现文明礼貌', score: 2, scene: 'campus', recorderId: 't001', recorderName: '王明华', recorderRole: 'teacher', occurredAt: '2024-11-18', createdAt: '2024-11-18' },
        { id: 'ha2', studentId: 's001', studentName: '张三', classId: 'c6-1', className: '六年级1班', category: 'labor' as HabitCategory, type: 'praise', title: '认真打扫教室', content: '值日时认真负责，把教室打扫得干干净净', score: 3, scene: 'classroom', recorderId: 't001', recorderName: '王明华', recorderRole: 'teacher', occurredAt: '2024-11-15', createdAt: '2024-11-15' },
        { id: 'ha3', studentId: 's001', studentName: '张三', classId: 'c6-1', className: '六年级1班', category: 'writing' as HabitCategory, type: 'improve', title: '书写需加强', content: '作业书写不够工整，需要加强练习', score: -1, scene: 'classroom', recorderId: 't002', recorderName: '李芳', recorderRole: 'teacher', occurredAt: '2024-11-10', createdAt: '2024-11-10' },
        { id: 'ha4', studentId: 's001', studentName: '张三', classId: 'c6-1', className: '六年级1班', category: 'reading' as HabitCategory, type: 'praise', title: '积极阅读课外书', content: '本学期已阅读10本课外书，阅读习惯良好', score: 5, scene: 'home', recorderId: 'p1', recorderName: '张父', recorderRole: 'parent', occurredAt: '2024-11-05', createdAt: '2024-11-05' },
      ],
      // 月度小目标
      monthlyGoals: [
        { month: '2024-11', category: 'writing' as HabitCategory, goal: '每天练习钢笔字20分钟', achieved: true },
        { month: '2024-10', category: 'reading' as HabitCategory, goal: '阅读2本课外书', achieved: true },
        { month: '2024-09', category: 'sports' as HabitCategory, goal: '每天跳绳100个', achieved: true },
      ],
      // 习惯之星记录
      habitStarRecords: [
        { month: '2024-03', category: 'labor' as HabitCategory, level: 'class' },
        { month: '2024-05', level: 'grade' },
        { month: '2024-09', category: 'civilization' as HabitCategory, level: 'school' },
      ],
    },
    
    moralPerformance: {
      // 行为评价统计
      behaviorStats: {
        praiseCount: 28,
        improveCount: 3,
        behaviorScore: 92,
      },
      // 德育活动参与
      activities: [
        { id: 'ma1', title: '国庆升旗仪式', type: '德育活动', date: '2024-10-01', role: '护旗手', achievement: '优秀护旗手' },
        { id: 'ma2', title: '学雷锋志愿服务', type: '少先队活动', date: '2024-03-05', role: '志愿者' },
        { id: 'ma3', title: '重阳节敬老活动', type: '德育活动', date: '2024-10-11', role: '表演者', achievement: '优秀表演奖' },
        { id: 'ma4', title: '环保知识竞赛', type: '学校活动', date: '2024-04-22', achievement: '二等奖' },
      ],
      // 志愿服务记录
      volunteerRecords: [
        { id: 'vr1', activity: '社区环境整治', hours: 2, date: '2024-09-15' },
        { id: 'vr2', activity: '图书馆志愿服务', hours: 3, date: '2024-08-20' },
        { id: 'vr3', activity: '敬老院慰问', hours: 2, date: '2024-10-11' },
      ],
      // 德育预警（权限控制：德育主任、班主任、家长可见）
      warnings: [
        { id: 'mw1', type: '行为关注', level: 'info', content: '近期课堂专注度有所下降，需要关注', createdAt: '2024-11-10' },
      ],
      // 综合素质评价
      comprehensiveEvaluation: [
        { semester: '2024-2025-1', moralScore: 92, socialScore: 88, volunteerScore: 90, totalScore: 90, level: '优秀', comment: '德育表现优秀，积极参与各类活动，习惯养成良好。' },
        { semester: '2023-2024-2', moralScore: 90, socialScore: 85, volunteerScore: 88, totalScore: 88, level: '优秀', comment: '德育表现良好，有进步空间。' },
      ],
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
      categoryScores: [
        { category: 'civilization' as HabitCategory, categoryName: '文明习惯', score: 98, maxScore: 100, rate: 98, trend: 'stable' },
        { category: 'writing' as HabitCategory, categoryName: '书写习惯', score: 96, maxScore: 100, rate: 96, trend: 'up' },
        { category: 'reading' as HabitCategory, categoryName: '阅读习惯', score: 97, maxScore: 100, rate: 97, trend: 'up' },
        { category: 'sports' as HabitCategory, categoryName: '运动习惯', score: 92, maxScore: 100, rate: 92, trend: 'stable' },
        { category: 'safety' as HabitCategory, categoryName: '安全习惯', score: 98, maxScore: 100, rate: 98, trend: 'stable' },
        { category: 'hygiene' as HabitCategory, categoryName: '卫生习惯', score: 95, maxScore: 100, rate: 95, trend: 'stable' },
        { category: 'aesthetic' as HabitCategory, categoryName: '审美习惯', score: 90, maxScore: 100, rate: 90, trend: 'up' },
        { category: 'labor' as HabitCategory, categoryName: '劳动习惯', score: 94, maxScore: 100, rate: 94, trend: 'stable' },
      ],
      recentAssessments: [
        { id: 'ha5', studentId: 's002', studentName: '李四', classId: 'c6-1', className: '六年级1班', category: 'reading' as HabitCategory, type: 'praise', title: '阅读达人', content: '本学期已阅读15本课外书，阅读量全班第一', score: 5, scene: 'home', recorderId: 'p3', recorderName: '李父', recorderRole: 'parent', occurredAt: '2024-11-18', createdAt: '2024-11-18' },
      ],
      monthlyGoals: [
        { month: '2024-11', category: 'sports' as HabitCategory, goal: '每天跑步1公里', achieved: false },
        { month: '2024-10', category: 'reading' as HabitCategory, goal: '阅读3本课外书', achieved: true },
      ],
      habitStarRecords: [
        { month: '2024-01', category: 'reading' as HabitCategory, level: 'class' },
        { month: '2024-03', level: 'grade' },
        { month: '2024-05', category: 'writing' as HabitCategory, level: 'school' },
        { month: '2024-09', level: 'school' },
        { month: '2024-10', category: 'reading' as HabitCategory, level: 'school' },
      ],
    },
    
    moralPerformance: {
      behaviorStats: {
        praiseCount: 35,
        improveCount: 0,
        behaviorScore: 98,
      },
      activities: [
        { id: 'ma5', title: '国庆升旗仪式', type: '德育活动', date: '2024-10-01', role: '主持人' },
        { id: 'ma6', title: '环保知识竞赛', type: '学校活动', date: '2024-04-22', achievement: '一等奖' },
        { id: 'ma7', title: '读书节活动', type: '学校活动', date: '2024-04-15', achievement: '最佳朗读者' },
      ],
      volunteerRecords: [
        { id: 'vr4', activity: '社区环境整治', hours: 3, date: '2024-09-15' },
        { id: 'vr5', activity: '图书馆志愿服务', hours: 5, date: '2024-08-20' },
      ],
      warnings: [],
      comprehensiveEvaluation: [
        { semester: '2024-2025-1', moralScore: 98, socialScore: 95, volunteerScore: 96, totalScore: 96, level: '优秀', comment: '德育表现优秀，是同学们的榜样。' },
      ],
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
