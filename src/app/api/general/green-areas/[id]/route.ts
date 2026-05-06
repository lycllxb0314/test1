import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const client = getSupabaseClient();
    const body = await request.json();

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.name !== undefined) updateData.name = body.name;
    if (body.areaSize !== undefined) updateData.area_size = body.areaSize;
    if (body.plants !== undefined) updateData.plants = body.plants;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.lastMaintainDate !== undefined) updateData.last_maintain_date = body.lastMaintainDate;
    if (body.nextMaintainDate !== undefined) updateData.next_maintain_date = body.nextMaintainDate;
    if (body.maintainerName !== undefined) updateData.maintainer_name = body.maintainerName;
    if (body.notes !== undefined) updateData.notes = body.notes;

    const { data, error } = await client.from('green_areas').update(updateData).eq('id', id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const client = getSupabaseClient();
    const { error } = await client.from('green_areas').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
