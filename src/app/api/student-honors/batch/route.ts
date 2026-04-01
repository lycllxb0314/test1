/**
 * 学生荣誉批量操作 API
 * 
 * PATCH: 批量更新荣誉
 * DELETE: 批量删除荣誉
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 */

import { NextRequest, NextResponse } from 'next/server';
import { studentHonorService } from '@/services/misc.service';
import { success, error, ErrorCode } from '@/lib/api';

/**
 * PATCH - 批量更新荣誉
 */
export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { ids, data } = body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json(
      error('请选择要更新的荣誉记录', ErrorCode.VALIDATION_ERROR),
      { status: 400 }
    );
  }

  if (!data || Object.keys(data).length === 0) {
    return NextResponse.json(
      error('请提供要更新的数据', ErrorCode.VALIDATION_ERROR),
      { status: 400 }
    );
  }

  // 映射字段：前端字段 -> 数据库字段
  const mappedData: Record<string, unknown> = {};
  if (data.level) mappedData.level = data.level;
  if (data.category) mappedData.category = data.category;
  if (data.issuer) mappedData.issuer = data.issuer;
  if (data.classId) mappedData.class_id = data.classId;
  if (data.className) mappedData.class_name = data.className;

  const result = await studentHonorService.batchUpdate(ids, mappedData);

  if (!result.success) {
    return NextResponse.json(
      error(result.error || '批量更新失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  return NextResponse.json(success({ 
    message: `成功更新 ${result.data!.count} 条记录`,
    count: result.data!.count 
  }));
}

/**
 * DELETE - 批量删除荣誉
 */
export async function DELETE(request: NextRequest) {
  const body = await request.json();
  const { ids } = body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json(
      error('请选择要删除的荣誉记录', ErrorCode.VALIDATION_ERROR),
      { status: 400 }
    );
  }

  const result = await studentHonorService.batchDelete(ids);

  if (!result.success) {
    return NextResponse.json(
      error(result.error || '批量删除失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  return NextResponse.json(success({ 
    message: `成功删除 ${result.data!.count} 条记录`,
    count: result.data!.count 
  }));
}
