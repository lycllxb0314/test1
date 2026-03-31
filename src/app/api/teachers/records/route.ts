/**
 * 教师成长记录 API
 * 
 * 架构：API Route → Service → Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { teacherService } from '@/services/teacher.service';
import { success, error, ErrorCode } from '@/lib/api';

/**
 * GET - 获取教师成长记录列表
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');

    const result = await teacherService.getRecords(teacherId || undefined);
    
    if (!result.success) {
      return NextResponse.json(
        error(result.error || '获取教师成长记录失败', ErrorCode.INTERNAL_ERROR),
        { status: 500 }
      );
    }

    return NextResponse.json(success(result.data, 'database'));
  } catch (err) {
    console.error('Failed to fetch teacher records:', err);
    return NextResponse.json(
      error('获取教师成长记录失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

/**
 * POST - 添加教师成长记录
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await teacherService.createRecord(body);

    if (!result.success) {
      return NextResponse.json(
        error(result.error || '添加记录失败', ErrorCode.INTERNAL_ERROR),
        { status: 500 }
      );
    }

    return NextResponse.json(success(result.data, 'database'));
  } catch (err) {
    console.error('Failed to create teacher record:', err);
    return NextResponse.json(
      error('添加记录失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

/**
 * PUT - 更新教师成长记录
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...params } = body;
    
    const result = await teacherService.updateRecord(id, params);

    if (!result.success) {
      return NextResponse.json(
        error(result.error || '更新记录失败', ErrorCode.INTERNAL_ERROR),
        { status: 500 }
      );
    }

    return NextResponse.json(success(result.data, 'database'));
  } catch (err) {
    console.error('Failed to update teacher record:', err);
    return NextResponse.json(
      error('更新记录失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

/**
 * DELETE - 删除教师成长记录
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        error('缺少记录ID', ErrorCode.BAD_REQUEST),
        { status: 400 }
      );
    }

    const result = await teacherService.deleteRecord(id);

    if (!result.success) {
      return NextResponse.json(
        error(result.error || '删除记录失败', ErrorCode.INTERNAL_ERROR),
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, source: 'database' });
  } catch (err) {
    console.error('Failed to delete teacher record:', err);
    return NextResponse.json(
      error('删除记录失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}
