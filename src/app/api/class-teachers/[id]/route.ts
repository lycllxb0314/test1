/**
 * 单个班级教师关系API
 * 
 * GET: 获取单个班级教师关系详情
 * PUT: 更新班级教师关系
 * DELETE: 删除班级教师关系
 */

import { NextRequest, NextResponse } from 'next/server';
import type { UpdateClassTeacherRequest } from '@/types';
import { 
  MOCK_CLASS_TEACHERS,
  updateMockClassTeacher,
  deleteMockClassTeacher,
} from '@/lib/mock/class-teachers.mock';

/**
 * GET /api/class-teachers/[id]
 * 获取单个班级教师关系详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const classTeacher = MOCK_CLASS_TEACHERS.find(ct => ct.id === id);
    
    if (!classTeacher) {
      return NextResponse.json(
        { success: false, error: '班级教师关系不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: classTeacher,
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
 * PUT /api/class-teachers/[id]
 * 更新班级教师关系
 * 
 * Body:
 * - subjects: 任教科目数组
 * - status: 状态 active/expired
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdateClassTeacherRequest = await request.json();
    
    const updated = updateMockClassTeacher(id, body);
    
    if (!updated) {
      return NextResponse.json(
        { success: false, error: '班级教师关系不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: updated,
      message: '更新成功',
    });
  } catch (error) {
    console.error('更新班级教师关系失败:', error);
    return NextResponse.json(
      { success: false, error: '更新班级教师关系失败' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/class-teachers/[id]
 * 删除班级教师关系
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const deleted = deleteMockClassTeacher(id);
    
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: '班级教师关系不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: '删除成功',
    });
  } catch (error) {
    console.error('删除班级教师关系失败:', error);
    return NextResponse.json(
      { success: false, error: '删除班级教师关系失败' },
      { status: 500 }
    );
  }
}
