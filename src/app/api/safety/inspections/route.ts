import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 类型定义
interface SafetyInspectionRow {
  id: string;
  type: string;
  location: string;
  inspector: string;
  inspection_date: string;
  issues: Array<{ description: string; severity: string }> | null;
  status: string;
  resolved_at: string | null;
  notes: string | null;
  created_at: string;
}

/**
 * GET - 获取安全检查记录列表
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const location = searchParams.get('location');

    let query = client
      .from('safety_inspections')
      .select('*')
      .order('inspection_date', { ascending: false });

    if (type) query = query.eq('type', type);
    if (status) query = query.eq('status', status);
    if (location) query = query.ilike('location', `%${location}%`);

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: (data || []).map((i: SafetyInspectionRow) => ({
        id: i.id,
        type: i.type,
        location: i.location,
        inspector: i.inspector,
        inspectionDate: i.inspection_date,
        issues: i.issues || [],
        status: i.status,
        resolvedAt: i.resolved_at,
        notes: i.notes,
        createdAt: i.created_at,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch safety inspections:', error);
    return NextResponse.json({ success: false, error: '获取安全检查记录失败' }, { status: 500 });
  }
}

/**
 * POST - 创建安全检查记录
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const { data, error } = await client
      .from('safety_inspections')
      .insert({
        type: body.type,
        location: body.location,
        inspector: body.inspector,
        inspection_date: body.inspectionDate,
        issues: body.issues || [],
        status: 'pending',
        notes: body.notes,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Failed to create safety inspection:', error);
    return NextResponse.json({ success: false, error: '创建安全检查记录失败' }, { status: 500 });
  }
}
