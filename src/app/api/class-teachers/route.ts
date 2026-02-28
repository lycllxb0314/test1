/**
 * 班级教师关系API
 * 
 * GET: 获取班级教师关系列表
 * POST: 创建班级教师关系
 */

import { NextRequest, NextResponse } from 'next/server';
import type { ClassTeacher, CreateClassTeacherRequest } from '@/types';
import { 
  MOCK_CLASS_TEACHERS,
  getMockClassTeachersByClassId,
  getMockClassTeachersByTeacherId,
  addMockClassTeacher,
} from '@/lib/mock/class-teachers.mock';
import { getMockClass } from '@/lib/mock/classes.mock';
import { getMockTeacher } from '@/lib/mock/teachers.mock';

// 当前学期
const CURRENT_SEMESTER = '2024-2025-1';

/**
 * GET /api/class-teachers
 * 获取班级教师关系列表
 * 
 * Query参数:
 * - classId: 班级ID（可选）
 * - teacherId: 教师ID（可选）
 * - semester: 学期（可选，默认当前学期）
 * - status: 状态过滤 active/expired（可选，默认active）
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const teacherId = searchParams.get('teacherId');
    const semester = searchParams.get('semester') || CURRENT_SEMESTER;
    const status = searchParams.get('status') as 'active' | 'expired' | null;
    
    let result: ClassTeacher[];
    
    if (classId) {
      // 按班级查询
      result = getMockClassTeachersByClassId(classId, status === 'expired');
    } else if (teacherId) {
      // 按教师查询
      result = getMockClassTeachersByTeacherId(teacherId, status === 'expired');
    } else {
      // 查询全部
      result = MOCK_CLASS_TEACHERS.filter(ct => {
        if (status && ct.status !== status) return false;
        if (semester && ct.semester !== semester) return false;
        return true;
      });
    }
    
    return NextResponse.json({
      success: true,
      data: result,
      total: result.length,
    });
  } catch (error) {
    console.error('获取班级教师关系失败:', error);
    return NextResponse.json(
      { success: false, error: '获取班级教师关系失败' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/class-teachers
 * 创建班级教师关系
 * 
 * 权限要求：教务主任(academic_director)
 * 
 * Body:
 * - classId: 班级ID
 * - teacherId: 教师ID
 * - position: 职位类型 head_teacher/subject_teacher
 * - subjects: 任教科目数组（科任时必填）
 * - semester: 学期（可选，默认当前学期）
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateClassTeacherRequest & { semester?: string } = await request.json();
    
    // 参数校验
    if (!body.classId || !body.teacherId || !body.position) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数：classId, teacherId, position' },
        { status: 400 }
      );
    }
    
    if (body.position === 'subject_teacher' && (!body.subjects || body.subjects.length === 0)) {
      return NextResponse.json(
        { success: false, error: '科任教师必须指定任教科目' },
        { status: 400 }
      );
    }
    
    // 获取班级和教师信息
    const classInfo = getMockClass(body.classId);
    if (!classInfo) {
      return NextResponse.json(
        { success: false, error: '班级不存在' },
        { status: 404 }
      );
    }
    
    const teacher = getMockTeacher(body.teacherId);
    if (!teacher) {
      return NextResponse.json(
        { success: false, error: '教师不存在' },
        { status: 404 }
      );
    }
    
    // 检查是否已存在关系
    const existing = MOCK_CLASS_TEACHERS.find(ct => 
      ct.classId === body.classId && 
      ct.teacherId === body.teacherId &&
      ct.semester === (body.semester || CURRENT_SEMESTER) &&
      ct.status === 'active'
    );
    
    if (existing) {
      return NextResponse.json(
        { success: false, error: '该教师与班级的关系已存在' },
        { status: 400 }
      );
    }
    
    // 如果是班主任，检查班级是否已有班主任
    if (body.position === 'head_teacher') {
      const existingHeadTeacher = MOCK_CLASS_TEACHERS.find(ct =>
        ct.classId === body.classId &&
        ct.position === 'head_teacher' &&
        ct.semester === (body.semester || CURRENT_SEMESTER) &&
        ct.status === 'active'
      );
      
      if (existingHeadTeacher) {
        return NextResponse.json(
          { success: false, error: '该班级已有班主任，请先移除现有班主任' },
          { status: 400 }
        );
      }
    }
    
    // 创建新关系
    const newClassTeacher: ClassTeacher = {
      id: `ct-${Date.now()}`,
      classId: body.classId,
      className: classInfo.name,
      grade: classInfo.grade,
      teacherId: body.teacherId,
      teacherName: teacher.name,
      position: body.position,
      subjects: body.subjects,
      semester: body.semester || CURRENT_SEMESTER,
      status: 'active',
      createdBy: 'system', // TODO: 从认证信息获取
      createdByName: '系统',
      createdAt: new Date().toISOString(),
    };
    
    addMockClassTeacher(newClassTeacher);
    
    return NextResponse.json({
      success: true,
      data: newClassTeacher,
      message: body.position === 'head_teacher' ? '班主任设置成功' : '科任教师设置成功',
    });
  } catch (error) {
    console.error('创建班级教师关系失败:', error);
    return NextResponse.json(
      { success: false, error: '创建班级教师关系失败' },
      { status: 500 }
    );
  }
}
