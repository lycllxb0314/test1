/**
 * 学生荣誉 API
 * 
 * GET: 获取学生荣誉列表
 * POST: 创建学生荣誉
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 */

import { NextRequest, NextResponse } from 'next/server';
import { studentHonorService } from '@/services/misc.service';
import { success, error, ErrorCode } from '@/lib/api';

/**
 * GET - 获取学生荣誉列表
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId') || undefined;
  const classId = searchParams.get('classId') || undefined;
  const honorType = searchParams.get('honorType') || searchParams.get('category') || undefined;
  const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
  const pageSize = searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!) : 20;

  const result = await studentHonorService.getList({ studentId, classId, honorType, page, pageSize });

  if (!result.success || !result.data) {
    return NextResponse.json(
      error(result.error || '获取学生荣誉列表失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  return NextResponse.json(success({
    data: result.data.data,
    pagination: {
      total: result.data.total,
      page: result.data.page,
      pageSize: result.data.pageSize,
      totalPages: result.data.totalPages,
    },
  }));
}

/**
 * POST - 创建学生荣誉
 */
export async function POST(request: NextRequest) {
  const body = await request.json();

  // 映射字段：前端字段 -> 数据库字段
  const result = await studentHonorService.create({
    id: body.id || `honor-${Date.now()}`,
    student_id: body.studentId,
    student_name: body.studentName,
    class_id: body.classId,
    class_name: body.className,
    title: body.title || body.honorName,
    level: body.level || body.honorLevel,
    category: body.category || body.honorType,
    issuer: body.issuer,
    date: body.date || body.awardDate,
    certificate_no: body.certificateNo,
    description: body.description,
  });

  if (!result.success) {
    return NextResponse.json(
      error(result.error || '创建学生荣誉失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  return NextResponse.json(success(result.data));
}
