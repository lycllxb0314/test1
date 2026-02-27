import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * GET - 获取德育计划列表
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const semester = searchParams.get('semester');
    const type = searchParams.get('type');

    let query = client
      .from('moral_plans')
      .select('*')
      .order('created_at', { ascending: false });

    if (semester) query = query.eq('semester', semester);
    if (type) query = query.eq('type', type);

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: (data || []).map((p: any) => ({
        id: p.id,
        title: p.title,
        type: p.type,
        semester: p.semester,
        startDate: p.start_date,
        endDate: p.end_date,
        objectives: p.objectives || [],
        activities: p.activities || [],
        status: p.status,
        createdAt: p.created_at,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch moral plans:', error);
    return NextResponse.json({ success: false, error: '获取德育计划失败' }, { status: 500 });
  }
}

/**
 * POST - 创建德育计划
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const { data, error } = await client
      .from('moral_plans')
      .insert({
        title: body.title,
        type: body.type,
        semester: body.semester,
        start_date: body.startDate,
        end_date: body.endDate,
        objectives: body.objectives || [],
        activities: body.activities || [],
        status: 'draft',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Failed to create moral plan:', error);
    return NextResponse.json({ success: false, error: '创建德育计划失败' }, { status: 500 });
  }
}
