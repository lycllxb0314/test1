/**
 * 学生荣誉详情 API
 * 
 * GET: 获取学生荣誉详情
 * PUT: 更新学生荣誉
 * DELETE: 删除学生荣誉
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 */

import { NextRequest, NextResponse } from 'next/server';
import { studentHonorService } from '@/services/misc.service';
import { success, error, ErrorCode } from '@/lib/api';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET - 获取学生荣誉详情
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const result = await studentHonorService.getById(id);

  if (!result.success || !result.data) {
    return NextResponse.json(
      error(result.error || '获取学生荣誉详情失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  return NextResponse.json(success(result.data));
}

/**
 * PUT - 更新学生荣誉
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json();

  const result = await studentHonorService.update(id, {
    student_id: body.studentId,
    student_name: body.studentName,
    honor_type: body.honorType,
    honor_name: body.honorName,
    honor_level: body.honorLevel,
    award_date: body.awardDate,
    description: body.description,
    certificate_no: body.certificateNo,
    issuer: body.issuer,
  });

  if (!result.success) {
    return NextResponse.json(
      error(result.error || '更新学生荣誉失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  return NextResponse.json(success(result.data));
}

/**
 * DELETE - 删除学生荣誉
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const result = await studentHonorService.delete(id);

  if (!result.success) {
    return NextResponse.json(
      error(result.error || '删除学生荣誉失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  return NextResponse.json(success({ deleted: true }));
}
