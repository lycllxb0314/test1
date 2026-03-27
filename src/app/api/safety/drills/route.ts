import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 类型定义
interface SafetyDrillRow {
  id: string;
  type: string;
  title: string;
  drill_date: string;
  location: string;
  participants: number | null;
  duration: number | null;
  result: string | null;
  issues: string[] | null;
  improvements: string[] | null;
  organizer: string;
  created_at: string;
}

/**
 * GET - 获取安全演练列表
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const year = searchParams.get('year');

    let query = client
      .from('safety_drills')
      .select('*')
      .order('drill_date', { ascending: false });

    if (type) query = query.eq('type', type);
    if (year) query = query.gte('drill_date', `${year}-01-01`).lte('drill_date', `${year}-12-31`);

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: (data || []).map((d: SafetyDrillRow) => ({
        id: d.id,
        type: d.type,
        title: d.title,
        drillDate: d.drill_date,
        location: d.location,
        participants: d.participants || 0,
        duration: d.duration,
        result: d.result,
        issues: d.issues || [],
        improvements: d.improvements || [],
        organizer: d.organizer,
        createdAt: d.created_at,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch safety drills:', error);
    return NextResponse.json({ success: false, error: '获取安全演练记录失败' }, { status: 500 });
  }
}

/**
 * POST - 创建安全演练记录
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const { data, error } = await client
      .from('safety_drills')
      .insert({
        type: body.type,
        title: body.title,
        drill_date: body.drillDate,
        location: body.location,
        participants: body.participants || 0,
        duration: body.duration,
        result: body.result,
        issues: body.issues || [],
        improvements: body.improvements || [],
        organizer: body.organizer,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Failed to create safety drill:', error);
    return NextResponse.json({ success: false, error: '创建安全演练记录失败' }, { status: 500 });
  }
}
