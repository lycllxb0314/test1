import { NextRequest } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { ok, serverError } from '@/lib/api-utils';

/**
 * GET - 获取空间预约列表
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const spaceId = searchParams.get('spaceId');
    const applicantId = searchParams.get('applicantId');
    const date = searchParams.get('date');
    const status = searchParams.get('status');

    let query = client
      .from('space_reservations')
      .select('*')
      .order('created_at', { ascending: false });

    if (spaceId) query = query.eq('space_id', spaceId);
    if (applicantId) query = query.eq('applicant_id', applicantId);
    if (date) query = query.eq('reservation_date', date);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;

    if (error) throw error;

    return ok((data || []).map((r: any) => ({
      id: r.id,
      spaceId: r.space_id,
      spaceName: r.space_name,
      applicantId: r.applicant_id,
      applicantName: r.applicant_name,
      reservationDate: r.reservation_date,
      startTime: r.start_time,
      endTime: r.end_time,
      purpose: r.purpose,
      participants: r.participants || 0,
      status: r.status,
      approvedBy: r.approved_by,
      createdAt: r.created_at,
    })));
  } catch (error) {
    console.error('Failed to fetch space reservations:', error);
    return serverError('获取空间预约列表失败');
  }
}

/**
 * POST - 创建空间预约
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const { data, error } = await client
      .from('space_reservations')
      .insert({
        space_id: body.spaceId,
        space_name: body.spaceName,
        applicant_id: body.applicantId,
        applicant_name: body.applicantName,
        reservation_date: body.reservationDate,
        start_time: body.startTime,
        end_time: body.endTime,
        purpose: body.purpose,
        participants: body.participants || 0,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    return ok(data);
  } catch (error) {
    console.error('Failed to create space reservation:', error);
    return serverError('创建空间预约失败');
  }
}
