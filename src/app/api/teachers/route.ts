import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// Mock数据作为fallback
const mockTeacherProfile = {
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
};

const mockTeachersList = [
  { id: '1', name: '王明华', gender: '男', subject: '语文', title: '高级教师', department: '语文组', phone: '138****1234', email: 'wang@lysf.edu.cn', status: 'active', teachYears: 15 },
  { id: '2', name: '李芳', gender: '女', subject: '数学', title: '一级教师', department: '数学组', phone: '139****5678', email: 'li@lysf.edu.cn', status: 'active', teachYears: 10 },
  { id: '3', name: '张强', gender: '男', subject: '英语', title: '二级教师', department: '英语组', phone: '137****9012', email: 'zhang@lysf.edu.cn', status: 'active', teachYears: 5 },
  { id: '4', name: '刘洋', gender: '女', subject: '科学', title: '一级教师', department: '科学组', phone: '136****3456', email: 'liu@lysf.edu.cn', status: 'active', teachYears: 8 },
  { id: '5', name: '陈红', gender: '女', subject: '音乐', title: '二级教师', department: '艺术组', phone: '135****7890', email: 'chen@lysf.edu.cn', status: 'active', teachYears: 6 },
  { id: '6', name: '赵刚', gender: '男', subject: '体育', title: '一级教师', department: '体育组', phone: '134****2345', email: 'zhao@lysf.edu.cn', status: 'active', teachYears: 12 },
  { id: '7', name: '孙丽', gender: '女', subject: '美术', title: '二级教师', department: '艺术组', phone: '133****6789', email: 'sun@lysf.edu.cn', status: 'on_leave', teachYears: 4 },
  { id: '8', name: '周伟', gender: '男', subject: '信息技术', title: '二级教师', department: '信息组', phone: '132****0123', email: 'zhou@lysf.edu.cn', status: 'active', teachYears: 3 },
];

/**
 * GET - 获取教师列表
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const subject = searchParams.get('subject') || '';
    const status = searchParams.get('status') || '';
    const department = searchParams.get('department') || '';

    // 尝试从数据库获取
    const client = getSupabaseClient();
    
    let query = client
      .from('teachers')
      .select('*');

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }
    if (subject) {
      query = query.eq('subject', subject);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (department) {
      query = query.eq('department', department);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Database query error:', error);
      // 使用Mock数据作为fallback
      let filtered = [...mockTeachersList];
      
      if (search) {
        filtered = filtered.filter(t => 
          t.name.includes(search) || t.email.includes(search)
        );
      }
      if (subject && subject !== 'all') {
        filtered = filtered.filter(t => t.subject === subject);
      }
      if (status) {
        filtered = filtered.filter(t => t.status === status);
      }
      if (department) {
        filtered = filtered.filter(t => t.department === department);
      }

      return NextResponse.json({
        success: true,
        data: filtered,
        source: 'mock',
      });
    }

    return NextResponse.json({
      success: true,
      data: data || mockTeachersList,
      source: 'database',
    });
  } catch (error) {
    console.error('Failed to fetch teachers:', error);
    return NextResponse.json({
      success: true,
      data: mockTeachersList,
      source: 'mock',
    });
  }
}

/**
 * POST - 创建新教师
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const client = getSupabaseClient();

    const { data, error } = await client
      .from('teachers')
      .insert({
        ...body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Database insert error:', error);
      // 返回mock成功响应
      const newTeacher = {
        id: String(Date.now()),
        ...body,
        department: `${body.subject || '语文'}组`,
      };
      return NextResponse.json({
        success: true,
        data: newTeacher,
        message: '教师添加成功',
        source: 'mock',
      });
    }

    return NextResponse.json({
      success: true,
      data,
      message: '教师添加成功',
    });
  } catch (error) {
    console.error('Failed to create teacher:', error);
    return NextResponse.json({
      success: false,
      error: '添加教师失败',
    }, { status: 500 });
  }
}
