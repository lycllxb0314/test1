/**
 * 考试管理 API
 * 
 * GET: 获取考试列表
 * POST: 创建新考试
 */

import { NextRequest } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { ok, fail, serverError, paginated } from '@/lib/api-utils';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

// ==================== 类型定义 ====================

interface ExamSubject {
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number; // 分钟
}

interface ExamRoom {
  roomId: string;
  roomName: string;
  capacity: number;
  invigilatorId?: string;
  invigilatorName?: string;
}

interface Exam {
  id: string;
  name: string;
  type: string;
  semester: string;
  description?: string;
  grades: number[];
  subjects: ExamSubject[];
  examRooms: ExamRoom[];
  startDate: string;
  endDate: string;
  status: 'planning' | 'published' | 'in_progress' | 'completed' | 'cancelled';
  totalStudents: number;
  submittedCount: number;
  createdBy?: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

// 考试类型选项
const EXAM_TYPES = [
  { value: '期中考试', label: '期中考试' },
  { value: '期末考试', label: '期末考试' },
  { value: '单元测试', label: '单元测试' },
  { value: '月考', label: '月考' },
  { value: '模拟考试', label: '模拟考试' },
  { value: '竞赛', label: '竞赛' },
  { value: '技能测试', label: '技能测试' },
];

// 考试状态选项
const EXAM_STATUS = [
  { value: 'planning', label: '计划中', color: 'bg-gray-100 text-gray-700' },
  { value: 'published', label: '已发布', color: 'bg-blue-100 text-blue-700' },
  { value: 'in_progress', label: '进行中', color: 'bg-orange-100 text-orange-700' },
  { value: 'completed', label: '已完成', color: 'bg-green-100 text-green-700' },
  { value: 'cancelled', label: '已取消', color: 'bg-red-100 text-red-700' },
];

// ==================== GET: 获取考试列表 ====================

export const GET = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    // 分页参数
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const offset = (page - 1) * pageSize;
    
    // 筛选参数
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const semester = searchParams.get('semester');
    const grade = searchParams.get('grade');
    const keyword = searchParams.get('keyword');
    
    // 构建查询
    let query = client
      .from('exams')
      .select('*', { count: 'exact' });
    
    // 应用筛选
    if (status) {
      query = query.eq('status', status);
    }
    if (type) {
      query = query.eq('type', type);
    }
    if (semester) {
      query = query.eq('semester', semester);
    }
    if (keyword) {
      query = query.ilike('name', `%${keyword}%`);
    }
    
    // 排序和分页
    query = query.order('created_at', { ascending: false });
    query = query.range(offset, offset + pageSize - 1);
    
    const { data, error: dbError, count } = await query;
    
    if (dbError) {
      return fail('获取考试列表失败');
    }
    
    // 转换数据格式
    const exams = (data || []).map(mapExamFromDb);
    
    return paginated(exams, count || 0, page, pageSize);
  } catch (err) {
    console.error('获取考试列表失败:', err);
    return serverError('服务器错误');
  }
});

// ==================== POST: 创建考试 ====================

export const POST = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    
    // 验证必填字段
    if (!body.name || !body.type || !body.startDate) {
      return fail('缺少必填字段');
    }
    
    // 生成考试ID
    const examId = `exam${Date.now().toString(36)}`;
    
    // 构建考试数据
    const examData = {
      id: examId,
      name: body.name,
      type: body.type,
      semester: body.semester || getCurrentSemester(),
      description: body.description || null,
      grades: body.grades || [],
      subjects: body.subjects || [],
      exam_rooms: body.examRooms || [],
      start_date: body.startDate,
      end_date: body.endDate || body.startDate,
      status: body.status || 'planning',
      total_students: body.totalStudents || 0,
      submitted_count: 0,
      created_by: user.employeeId || user.id,
      created_by_name: user.name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      published_at: body.status === 'published' ? new Date().toISOString() : null,
    };
    
    const { data, error: dbError } = await client
      .from('exams')
      .insert(examData)
      .select()
      .single();
    
    if (dbError) {
      console.error('创建考试失败:', dbError);
      return fail('创建考试失败');
    }
    
    return ok(mapExamFromDb(data));
  } catch (err) {
    console.error('创建考试失败:', err);
    return serverError('服务器错误');
  }
});

// ==================== 辅助函数 ====================

function mapExamFromDb(dbExam: any): Exam {
  return {
    id: dbExam.id,
    name: dbExam.name,
    type: dbExam.type,
    semester: dbExam.semester || '',
    description: dbExam.description,
    grades: dbExam.grades || (dbExam.grade ? [dbExam.grade] : []),
    subjects: dbExam.subjects || [],
    examRooms: dbExam.exam_rooms || [],
    startDate: dbExam.start_date,
    endDate: dbExam.end_date,
    status: dbExam.status,
    totalStudents: dbExam.total_students || 0,
    submittedCount: dbExam.submitted_count || 0,
    createdBy: dbExam.created_by,
    createdByName: dbExam.created_by_name,
    createdAt: dbExam.created_at,
    updatedAt: dbExam.updated_at,
    publishedAt: dbExam.published_at,
  };
}

function getCurrentSemester(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  
  // 简单判断：2-8月为第二学期，9-1月为第一学期
  if (month >= 2 && month <= 8) {
    return `${year - 1}-${year}-2`;
  } else {
    if (month === 1) {
      return `${year - 1}-${year}-1`;
    }
    return `${year}-${year + 1}-1`;
  }
}
