/**
 * 安全演练详情 API
 * 
 * GET: 获取演练详情
 * PUT: 更新演练记录
 * DELETE: 删除演练记录
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute } from '@/lib/auth/route-protection';
import { safetyDrillService } from '@/services/safety.service';
import { success, error, ErrorCode } from '@/lib/api';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * GET - 获取演练详情
 */
export const GET = protectedRoute(async (request: NextRequest, { params }) => {
  const resolvedParams = await params;
  const id = resolvedParams?.id;
  
  if (!id) {
    return NextResponse.json(
      error('缺少演练ID', ErrorCode.BAD_REQUEST),
      { status: 400 }
    );
  }

  const result = await safetyDrillService.getById(id);

  if (!result.success || !result.data) {
    return NextResponse.json(
      error(result.error || '演练记录不存在', ErrorCode.NOT_FOUND),
      { status: 404 }
    );
  }

  const drill = result.data;
  return NextResponse.json(success({
    id: drill.id,
    type: drill.type,
    title: drill.title,
    drillDate: drill.drill_date,
    location: drill.location,
    participants: drill.participants,
    duration: drill.duration,
    result: drill.result,
    issues: drill.issues,
    improvements: drill.improvements,
    organizer: drill.organizer,
    createdAt: drill.created_at,
  }));
});

/**
 * PUT - 更新演练记录
 */
export const PUT = protectedRoute(async (request: NextRequest, { params }) => {
  const resolvedParams = await params;
  const id = resolvedParams?.id;
  
  if (!id) {
    return NextResponse.json(
      error('缺少演练ID', ErrorCode.BAD_REQUEST),
      { status: 400 }
    );
  }
  
  const body = await request.json();
  
  try {
    const client = getSupabaseClient();
    const { data, error: dbError } = await client
      .from('safety_drills')
      .update({
        title: body.title,
        type: body.type,
        drill_date: body.drillDate,
        location: body.location,
        participants: body.participants,
        duration: body.duration,
        result: body.result,
        issues: body.issues,
        improvements: body.improvements,
        organizer: body.organizer,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (dbError) {
      return NextResponse.json(
        error('更新演练记录失败', ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }
    
    return NextResponse.json(success(data));
  } catch {
    return NextResponse.json(
      error('更新演练记录失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }
});

/**
 * DELETE - 删除演练记录
 */
export const DELETE = protectedRoute(async (request: NextRequest, { params }) => {
  const resolvedParams = await params;
  const id = resolvedParams?.id;
  
  if (!id) {
    return NextResponse.json(
      error('缺少演练ID', ErrorCode.BAD_REQUEST),
      { status: 400 }
    );
  }
  
  try {
    const client = getSupabaseClient();
    const { error: dbError } = await client
      .from('safety_drills')
      .delete()
      .eq('id', id);
    
    if (dbError) {
      return NextResponse.json(
        error('删除演练记录失败', ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }
    
    return NextResponse.json(success({ deleted: true }));
  } catch {
    return NextResponse.json(
      error('删除演练记录失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }
});
