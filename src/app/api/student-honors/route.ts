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
import type { StudentHonorRecord } from '@/repositories/misc.repository';
import { success, error, ErrorCode } from '@/lib/api';

/**
 * 将数据库字段映射为前端期望的驼峰格式
 */
function mapHonorToFrontend(record: StudentHonorRecord) {
  return {
    id: record.id,
    studentId: record.student_id,
    studentName: record.student_name,
    classId: record.class_id,
    className: record.class_name,
    title: record.title,
    level: record.level,
    category: record.category,
    issuer: record.issuer,
    date: record.date,
    certificateNo: record.certificate_no,
    description: record.description,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

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

  // 映射字段为驼峰格式
  const mappedData = result.data.data.map(mapHonorToFrontend);

  return NextResponse.json(success({
    data: mappedData,
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

  return NextResponse.json(success(mapHonorToFrontend(result.data!)));
}
