import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    let query = client.from('environment_areas').select('*').order('name');
    if (type) query = query.eq('area_type', type);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const mapped = (data || []).map(row => ({
      id: row.id,
      name: row.name,
      areaType: row.area_type,
      status: row.status,
      cleanerId: row.cleaner_id,
      cleanerName: row.cleaner_name,
      lastCleanTime: row.last_clean_time,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return NextResponse.json({ success: true, data: mapped });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    const { name, areaType, status, cleanerName, description } = body;

    if (!name || !areaType) {
      return NextResponse.json({ error: '名称和区域类型为必填项' }, { status: 400 });
    }

    const id = `ea${Date.now()}`;
    const { data, error } = await client.from('environment_areas').insert({
      id, name, area_type: areaType, status: status || 'good',
      cleaner_name: cleanerName, description,
      last_clean_time: new Date().toISOString(),
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
