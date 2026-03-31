/**
 * 教师完整档案API路由
 * 
 * 架构：API Route → Service → Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { teacherService } from '@/services/teacher.service';
import { success, error, ErrorCode } from '@/lib/api';
import type { TeacherProfile } from '@/types';

/**
 * GET - 获取教师完整档案
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const result = await teacherService.getTeacherProfile(id);
    
    if (!result.success) {
      return NextResponse.json(
        error(result.error || '教师不存在', ErrorCode.NOT_FOUND),
        { status: 404 }
      );
    }

    return NextResponse.json(success(result.data, 'database'));
  } catch (err) {
    console.error('Failed to fetch teacher profile:', err);
    return NextResponse.json(
      error('获取教师档案失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

/**
 * PUT - 更新教师完整档案
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const result = await teacherService.updateTeacher(id, body);
    
    if (!result.success) {
      return NextResponse.json(
        error(result.error || '更新教师档案失败', ErrorCode.INTERNAL_ERROR),
        { status: 500 }
      );
    }
    
    return NextResponse.json(success(result.data, 'database'));
  } catch (err) {
    console.error('Failed to update teacher profile:', err);
    return NextResponse.json(
      error('更新教师档案失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}
