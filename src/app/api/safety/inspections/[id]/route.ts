/**
 * 安全检查详情 API
 * 
 * GET: 获取检查详情
 * PUT: 更新检查记录
 * DELETE: 删除检查记录
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute } from '@/lib/auth/route-protection';
import { safetyInspectionService } from '@/services/safety.service';
import { success, error, ErrorCode } from '@/lib/api';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * GET - 获取检查详情
 */
export const GET = protectedRoute(async (request: NextRequest, { params }) => {
  const resolvedParams = await params;
  const id = resolvedParams?.id;
  
  if (!id) {
    return NextResponse.json(
      error('缺少检查ID', ErrorCode.BAD_REQUEST),
      { status: 400 }
    );
  }

  const result = await safetyInspectionService.getById(id);

  if (!result.success || !result.data) {
    return NextResponse.json(
      error(result.error || '检查记录不存在', ErrorCode.NOT_FOUND),
      { status: 404 }
    );
  }

  const inspection = result.data;
  return NextResponse.json(success({
    id: inspection.id,
    inspector: inspection.inspector,
    inspectionDate: inspection.inspection_date,
    area: inspection.area,
    type: inspection.type,
    status: inspection.status,
    issues: inspection.issues,
    resolved: inspection.resolved,
    resolvedAt: inspection.resolved_at,
    resolvedBy: inspection.resolved_by,
    notes: inspection.notes,
    createdAt: inspection.created_at,
  }));
});

/**
 * PUT - 更新检查记录
 */
export const PUT = protectedRoute(async (request: NextRequest, { params }) => {
  const resolvedParams = await params;
  const id = resolvedParams?.id;
  
  if (!id) {
    return NextResponse.json(
      error('缺少检查ID', ErrorCode.BAD_REQUEST),
      { status: 400 }
    );
  }
  
  const body = await request.json();
  
  try {
    const client = getSupabaseClient();
    const { data, error: dbError } = await client
      .from('safety_inspections')
      .update({
        status: body.status,
        issues: body.issues,
        notes: body.notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (dbError) {
      return NextResponse.json(
        error('更新检查记录失败', ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }
    
    return NextResponse.json(success(data));
  } catch {
    return NextResponse.json(
      error('更新检查记录失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }
});

/**
 * DELETE - 删除检查记录
 */
export const DELETE = protectedRoute(async (request: NextRequest, { params }) => {
  const resolvedParams = await params;
  const id = resolvedParams?.id;
  
  if (!id) {
    return NextResponse.json(
      error('缺少检查ID', ErrorCode.BAD_REQUEST),
      { status: 400 }
    );
  }
  
  try {
    const client = getSupabaseClient();
    const { error: dbError } = await client
      .from('safety_inspections')
      .delete()
      .eq('id', id);
    
    if (dbError) {
      return NextResponse.json(
        error('删除检查记录失败', ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }
    
    return NextResponse.json(success({ deleted: true }));
  } catch {
    return NextResponse.json(
      error('删除检查记录失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }
});
