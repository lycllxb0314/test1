import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET() {
  try {
    const client = getSupabaseClient();
    const { data, error } = await client.from('green_areas').select('*').order('name');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const mapped = (data || []).map(row => ({
      id: row.id,
      name: row.name,
      areaSize: row.area_size,
      plants: row.plants,
      status: row.status,
      lastMaintainDate: row.last_maintain_date,
      nextMaintainDate: row.next_maintain_date,
      maintainerId: row.maintainer_id,
      maintainerName: row.maintainer_name,
      notes: row.notes,
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
    const { name, areaSize, plants, status, lastMaintainDate, nextMaintainDate, maintainerName, notes } = body;

    if (!name) {
      return NextResponse.json({ error: '名称为必填项' }, { status: 400 });
    }

    const id = `ga${Date.now()}`;
    const { data, error } = await client.from('green_areas').insert({
      id, name, area_size: areaSize, plants,
      status: status || 'good',
      last_maintain_date: lastMaintainDate,
      next_maintain_date: nextMaintainDate,
      maintainer_name: maintainerName, notes,
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
