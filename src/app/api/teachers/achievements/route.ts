/**
 * 教师成果 API
 * 
 * 架构：API Route → Service → Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { teacherService } from '@/services/teacher.service';
import { success, error, ErrorCode } from '@/lib/api';

/**
 * GET - 获取教师成果列表
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    const type = searchParams.get('type') || undefined;
    const level = searchParams.get('level') || undefined;

    const result = await teacherService.getAchievements(teacherId || undefined, type, level);
    
    if (!result.success) {
      return NextResponse.json(
        error(result.error || '获取教师成果失败', ErrorCode.INTERNAL_ERROR),
        { status: 500 }
      );
    }

    return NextResponse.json(success(result.data, 'database'));
  } catch (err) {
    console.error('Failed to fetch teacher achievements:', err);
    return NextResponse.json(
      error('获取教师成果失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

/**
 * POST - 添加教师成果
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await teacherService.createAchievement(body);

    if (!result.success) {
      return NextResponse.json(
        error(result.error || '添加成果失败', ErrorCode.INTERNAL_ERROR),
        { status: 500 }
      );
    }

    return NextResponse.json(success(result.data, 'database'));
  } catch (err) {
    console.error('Failed to create teacher achievement:', err);
    return NextResponse.json(
      error('添加成果失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

/**
 * PUT - 更新教师成果
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...params } = body;
    
    const result = await teacherService.updateAchievement(id, params);

    if (!result.success) {
      return NextResponse.json(
        error(result.error || '更新成果失败', ErrorCode.INTERNAL_ERROR),
        { status: 500 }
      );
    }

    return NextResponse.json(success(result.data, 'database'));
  } catch (err) {
    console.error('Failed to update teacher achievement:', err);
    return NextResponse.json(
      error('更新成果失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

/**
 * DELETE - 删除教师成果
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        error('缺少成果ID', ErrorCode.BAD_REQUEST),
        { status: 400 }
      );
    }

    const result = await teacherService.deleteAchievement(id);

    if (!result.success) {
      return NextResponse.json(
        error(result.error || '删除成果失败', ErrorCode.INTERNAL_ERROR),
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: '成果已删除' });
  } catch (err) {
    console.error('Failed to delete teacher achievement:', err);
    return NextResponse.json(
      error('删除成果失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}
