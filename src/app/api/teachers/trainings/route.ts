/**
 * 教师培训 API
 * 
 * 架构：API Route → Service → Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { teacherService } from '@/services/teacher.service';
import { success, error, ErrorCode } from '@/lib/api';

/**
 * GET - 获取教师培训列表
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    const type = searchParams.get('type') || undefined;
    const status = searchParams.get('status') || undefined;

    const result = await teacherService.getTrainings(teacherId || undefined, type, status);
    
    if (!result.success) {
      return NextResponse.json(
        error(result.error || '获取教师培训失败', ErrorCode.INTERNAL_ERROR),
        { status: 500 }
      );
    }

    return NextResponse.json(success(result.data, 'database'));
  } catch (err) {
    console.error('Failed to fetch teacher trainings:', err);
    return NextResponse.json(
      error('获取教师培训失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

/**
 * POST - 添加教师培训
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await teacherService.createTraining(body);

    if (!result.success) {
      return NextResponse.json(
        error(result.error || '添加培训失败', ErrorCode.INTERNAL_ERROR),
        { status: 500 }
      );
    }

    return NextResponse.json(success(result.data, 'database'));
  } catch (err) {
    console.error('Failed to create teacher training:', err);
    return NextResponse.json(
      error('添加培训失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

/**
 * PUT - 更新教师培训
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...params } = body;
    
    const result = await teacherService.updateTraining(id, params);

    if (!result.success) {
      return NextResponse.json(
        error(result.error || '更新培训失败', ErrorCode.INTERNAL_ERROR),
        { status: 500 }
      );
    }

    return NextResponse.json(success(result.data, 'database'));
  } catch (err) {
    console.error('Failed to update teacher training:', err);
    return NextResponse.json(
      error('更新培训失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

/**
 * DELETE - 删除教师培训
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        error('缺少培训ID', ErrorCode.BAD_REQUEST),
        { status: 400 }
      );
    }

    const result = await teacherService.deleteTraining(id);

    if (!result.success) {
      return NextResponse.json(
        error(result.error || '删除培训失败', ErrorCode.INTERNAL_ERROR),
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: '培训已删除' });
  } catch (err) {
    console.error('Failed to delete teacher training:', err);
    return NextResponse.json(
      error('删除培训失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}
