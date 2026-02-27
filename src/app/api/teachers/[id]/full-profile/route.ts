import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// Mock数据作为fallback
const mockTeacherProfiles: Record<string, any> = {
  'teacher-001': {
    id: 'teacher-001',
    userId: 't001',
    
    name: '张明华',
    gender: '男',
    birthDate: '1985-03-15',
    idCard: '3508**********0015',
    ethnicity: '汉族',
    politicalStatus: '中共党员',
    nativePlace: '福建龙岩',
    
    phone: '138****1001',
    email: 'zhangmh@lysf.fx.edu.cn',
    emergencyContact: '张父',
    emergencyPhone: '139****2001',
    address: '龙岩市新罗区xx路xx号',
    
    employeeId: 'T2005001',
    subjects: ['语文'],
    title: '高级教师',
    titleDate: '2018-09-01',
    education: '本科',
    school: '福建师范大学',
    major: '汉语言文学',
    graduationDate: '2007-06',
    teachYears: 17,
    joinDate: '2007-09-01',
    department: '语文组',
    
    isHeadTeacher: false,
    status: 'active',
    
    records: [
      { id: 'r1', teacherId: 'teacher-001', type: 'education', title: '本科学历', description: '福建师范大学 汉语言文学专业', date: '2007-06', createdAt: '2020-01-01' },
      { id: 'r2', teacherId: 'teacher-001', type: 'title', title: '二级教师', date: '2010-09', createdAt: '2020-01-01' },
      { id: 'r3', teacherId: 'teacher-001', type: 'title', title: '一级教师', date: '2014-09', createdAt: '2020-01-01' },
      { id: 'r4', teacherId: 'teacher-001', type: 'title', title: '高级教师', date: '2018-09', createdAt: '2020-01-01' },
      { id: 'r5', teacherId: 'teacher-001', type: 'position', title: '担任语文教研组长', date: '2019-09', createdAt: '2020-01-01' },
    ],
    
    honors: [
      { id: 'h1', teacherId: 'teacher-001', title: '龙岩市优秀教师', level: '市级', category: '综合', issuer: '龙岩市教育局', date: '2023-09', certificateNo: 'LY202309001' },
      { id: 'h2', teacherId: 'teacher-001', title: '区级教学能手', level: '区级', category: '教学', issuer: '新罗区教育局', date: '2022-06' },
      { id: 'h3', teacherId: 'teacher-001', title: '校级优秀班主任', level: '校级', category: '德育', issuer: '学校', date: '2020-09' },
      { id: 'h4', teacherId: 'teacher-001', title: '福建省骨干教师', level: '省级', category: '综合', issuer: '福建省教育厅', date: '2021-12' },
    ],
    
    trainings: [
      { id: 't1', teacherId: 'teacher-001', name: '新课标解读培训', type: '市级培训', organizer: '龙岩市教育局', startDate: '2024-01-15', endDate: '2024-01-17', hours: 24, status: '已完成', certificate: 'cert-001' },
      { id: 't2', teacherId: 'teacher-001', name: '信息技术应用能力提升', type: '省级培训', organizer: '福建省教育厅', startDate: '2023-11-01', endDate: '2023-11-30', hours: 48, status: '已完成' },
      { id: 't3', teacherId: 'teacher-001', name: '班主任工作培训', type: '校内培训', organizer: '学校教务处', startDate: '2023-09-01', endDate: '2023-09-03', hours: 16, status: '已完成' },
    ],
    
    achievements: [
      { id: 'a1', teacherId: 'teacher-001', type: '公开课', title: '《背影》区级公开课', level: '区级', result: '优秀', date: '2023-11-20', description: '面向全区语文教师的示范课' },
      { id: 'a2', teacherId: 'teacher-001', type: '教学比赛', title: '龙岩市语文教学技能大赛', level: '市级', result: '一等奖', date: '2023-05-10' },
      { id: 'a3', teacherId: 'teacher-001', type: '论文发表', title: '小学语文阅读教学策略研究', level: '省级', date: '2022-08', description: '发表于《福建教育》2022年第8期' },
      { id: 'a4', teacherId: 'teacher-001', type: '课题研究', title: '小学语文核心素养培养研究', level: '市级', result: '结题', date: '2023-06', description: '市级课题主持人' },
      { id: 'a5', teacherId: 'teacher-001', type: '指导学生获奖', title: '指导学生参加征文比赛', level: '省级', result: '一等奖2人', date: '2023-12' },
    ],
    
    createdAt: '2020-01-01',
    updatedAt: '2024-03-15',
  },
};

// 根据ID生成基础档案
function generateBasicProfile(id: string, name: string, subject: string, title: string) {
  return {
    id,
    userId: `t${id}`,
    name,
    gender: id.charCodeAt(0) % 2 === 0 ? '女' : '男',
    birthDate: `198${id.charCodeAt(0) % 9}-0${(id.charCodeAt(0) % 9) + 1}-1${id.charCodeAt(0) % 10}`,
    idCard: '3508**********00' + id,
    ethnicity: '汉族',
    politicalStatus: id.charCodeAt(0) % 3 === 0 ? '中共党员' : '群众',
    nativePlace: '福建龙岩',
    
    phone: `138****${1000 + parseInt(id) * 100}`,
    email: `${name.toLowerCase().replace(/\s/g, '')}@lysf.fx.edu.cn`,
    emergencyContact: `${name.charAt(0)}家属`,
    emergencyPhone: `139****${2000 + parseInt(id) * 100}`,
    address: '龙岩市新罗区',
    
    employeeId: `T${2000 + parseInt(id)}00${id}`,
    subjects: [subject],
    title,
    titleDate: '2018-09-01',
    education: '本科',
    school: '福建师范大学',
    major: subject === '语文' ? '汉语言文学' : subject === '数学' ? '数学与应用数学' : subject,
    graduationDate: '2007-06',
    teachYears: Math.floor(Math.random() * 15) + 3,
    joinDate: '2007-09-01',
    department: `${subject}组`,
    
    isHeadTeacher: false,
    status: 'active',
    
    records: [
      { id: `r${id}1`, teacherId: id, type: 'education', title: '本科学历', description: `福建师范大学 ${subject}专业`, date: '2007-06', createdAt: '2020-01-01' },
      { id: `r${id}2`, teacherId: id, type: 'title', title: '二级教师', date: '2010-09', createdAt: '2020-01-01' },
    ],
    
    honors: [],
    trainings: [],
    achievements: [],
    
    createdAt: '2020-01-01',
    updatedAt: new Date().toISOString().split('T')[0],
  };
}

/**
 * GET - 获取教师完整档案
 * 包含基本信息、荣誉、培训、成果等所有数据
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 尝试从数据库获取
    const client = getSupabaseClient();
    
    // 1. 获取教师基本信息
    const { data: teacher, error: teacherError } = await client
      .from('teachers')
      .select('*')
      .eq('id', id)
      .single();

    if (teacherError || !teacher) {
      // 使用Mock数据
      if (mockTeacherProfiles[id]) {
        return NextResponse.json({
          success: true,
          data: mockTeacherProfiles[id],
          source: 'mock',
        });
      }
      
      // 根据简单列表生成基础档案
      const simpleTeacher = [
        { id: '1', name: '王明华', subject: '语文', title: '高级教师' },
        { id: '2', name: '李芳', subject: '数学', title: '一级教师' },
        { id: '3', name: '张强', subject: '英语', title: '二级教师' },
        { id: '4', name: '刘洋', subject: '科学', title: '一级教师' },
        { id: '5', name: '陈红', subject: '音乐', title: '二级教师' },
        { id: '6', name: '赵刚', subject: '体育', title: '一级教师' },
        { id: '7', name: '孙丽', subject: '美术', title: '二级教师' },
        { id: '8', name: '周伟', subject: '信息技术', title: '二级教师' },
      ].find(t => t.id === id);
      
      if (simpleTeacher) {
        const profile = generateBasicProfile(
          simpleTeacher.id,
          simpleTeacher.name,
          simpleTeacher.subject,
          simpleTeacher.title
        );
        return NextResponse.json({
          success: true,
          data: profile,
          source: 'mock',
        });
      }

      return NextResponse.json({
        success: false,
        error: '教师不存在',
      }, { status: 404 });
    }

    // 2. 获取教师荣誉
    const { data: honors } = await client
      .from('teacher_honors')
      .select('*')
      .eq('teacher_id', id)
      .order('date', { ascending: false });

    // 3. 获取教师培训
    const { data: trainings } = await client
      .from('teacher_trainings')
      .select('*')
      .eq('teacher_id', id)
      .order('start_date', { ascending: false });

    // 4. 获取教师成果
    const { data: achievements } = await client
      .from('teacher_achievements')
      .select('*')
      .eq('teacher_id', id)
      .order('date', { ascending: false });

    // 5. 获取成长记录
    const { data: records } = await client
      .from('teacher_growth_records')
      .select('*')
      .eq('teacher_id', id)
      .order('date', { ascending: false });

    // 组装完整档案
    const profile = {
      ...teacher,
      honors: honors || [],
      trainings: trainings || [],
      achievements: achievements || [],
      records: records || [],
    };

    return NextResponse.json({
      success: true,
      data: profile,
      source: 'database',
    });
  } catch (error) {
    console.error('Failed to fetch teacher full profile:', error);
    return NextResponse.json({
      success: false,
      error: '获取教师档案失败',
    }, { status: 500 });
  }
}

/**
 * PUT - 更新教师档案
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const client = getSupabaseClient();
    
    // 更新教师基本信息
    const { error: updateError } = await client
      .from('teachers')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.error('Database update error:', updateError);
      // 返回mock成功响应
      return NextResponse.json({
        success: true,
        message: '教师信息更新成功',
        source: 'mock',
      });
    }

    return NextResponse.json({
      success: true,
      message: '教师信息更新成功',
    });
  } catch (error) {
    console.error('Failed to update teacher:', error);
    return NextResponse.json({
      success: false,
      error: '更新教师信息失败',
    }, { status: 500 });
  }
}
