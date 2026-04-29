/**
 * 家长每日观察 API (管理端)
 * GET  /api/health/observations?startDate=xxx&endDate=xxx&classId=xxx&studentId=xxx&page=1&pageSize=50&mode=admin
 * GET  /api/health/observations?studentId=xxx&days=30  (家长/学生端)
 * POST /api/health/observations  创建/更新观察数据
 */
import { NextResponse } from 'next/server';
import { protectedRoute } from '@/lib/auth';
import { healthManagementService } from '@/services/health-management.service';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { CreateObservationDTO } from '@/types/health-management';

type ObservationRow = {
  id: string;
  parent_id: string;
  student_id: string;
  observation_date: string;
  sleep_quality: string;
  diet_quality: string;
  energy_level: string;
  note: string | null;
  created_at: string;
  updated_at: string;
};

type StudentRow = { id: string; name: string; student_no: string; class_name: string };

const SLEEP_LABELS: Record<string, string> = { sufficient: '充足', normal: '一般', insufficient: '不足' };
const DIET_LABELS: Record<string, string> = { balanced: '均衡', normal: '一般', overeating: '暴食' };
const ENERGY_LABELS: Record<string, string> = { energetic: '充沛', normal: '正常', tired: '疲惫' };

export const GET = protectedRoute(async (request) => {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode');

  // 管理端列表查询
  if (mode === 'admin') {
    return handleAdminQuery(searchParams);
  }

  // 学生/家长端查询
  const studentId = searchParams.get('studentId');
  const parentId = searchParams.get('parentId');
  const days = parseInt(searchParams.get('days') || '30', 10);

  if (studentId) {
    const result = await healthManagementService.getObservationsByStudentId(studentId, days);
    return NextResponse.json({ success: result.success, data: result.data });
  }

  if (parentId) {
    const result = await healthManagementService.getObservationsByParentId(parentId, days);
    return NextResponse.json({ success: result.success, data: result.data });
  }

  return NextResponse.json({ success: false, error: '需要 studentId 或 parentId 参数' }, { status: 400 });
});

async function handleAdminQuery(searchParams: URLSearchParams) {
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const classId = searchParams.get('classId');
  const studentId = searchParams.get('studentId');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);

  const client = getSupabaseClient();

  // 按 classId 找学生
  let studentIds: string[] = [];
  if (classId) {
    const { data: classStudents } = await client
      .from('students')
      .select('id')
      .eq('class_id', classId);
    studentIds = ((classStudents || []) as unknown as StudentRow[]).map(s => s.id);
    if (studentIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: { page, pageSize, total: 0, totalPages: 0 },
        statistics: emptyObsStats(),
      });
    }
  }

  // 查询观察记录
  let query = client
    .from('parent_daily_observations')
    .select('*', { count: 'exact' })
    .order('observation_date', { ascending: false });

  if (startDate) query = query.gte('observation_date', startDate);
  if (endDate) query = query.lte('observation_date', endDate);
  if (studentId) query = query.eq('student_id', studentId);
  if (studentIds.length > 0) query = query.in('student_id', studentIds);

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, count, error: dbError } = await query;

  if (dbError) {
    console.error('[ObservationsAPI] admin query error:', dbError.message);
    return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
  }

  const rawRecords = (data || []) as unknown as ObservationRow[];

  // 批量查询学生信息
  const uniqueStudentIds = [...new Set(rawRecords.map(r => r.student_id))];
  const studentMap = new Map<string, StudentRow>();
  if (uniqueStudentIds.length > 0) {
    const { data: students } = await client
      .from('students')
      .select('id, name, student_no, class_name')
      .in('id', uniqueStudentIds);
    (students || []).forEach((s: unknown) => {
      const row = s as StudentRow;
      studentMap.set(row.id, row);
    });
  }

  // 转换格式
  const records = rawRecords.map(row => {
    const s = studentMap.get(row.student_id);
    return {
      id: row.id,
      studentId: row.student_id,
      studentName: s?.name || '-',
      studentNo: s?.student_no || '-',
      className: s?.class_name || '-',
      parentId: row.parent_id,
      observationDate: row.observation_date,
      sleepQuality: row.sleep_quality,
      sleepQualityLabel: SLEEP_LABELS[row.sleep_quality] || row.sleep_quality,
      dietQuality: row.diet_quality,
      dietQualityLabel: DIET_LABELS[row.diet_quality] || row.diet_quality,
      energyLevel: row.energy_level,
      energyLevelLabel: ENERGY_LABELS[row.energy_level] || row.energy_level,
      note: row.note,
      createdAt: row.created_at,
    };
  });

  // 统计（全量查询不分页）
  let statsQuery = client
    .from('parent_daily_observations')
    .select('sleep_quality, diet_quality, energy_level');
  if (startDate) statsQuery = statsQuery.gte('observation_date', startDate);
  if (endDate) statsQuery = statsQuery.lte('observation_date', endDate);
  if (studentId) statsQuery = statsQuery.eq('student_id', studentId);
  if (studentIds.length > 0) statsQuery = statsQuery.in('student_id', studentIds);

  const { data: allRecords } = await statsQuery;
  const typedAll = (allRecords || []) as unknown as { sleep_quality: string; diet_quality: string; energy_level: string }[];

  const stats = emptyObsStats();
  stats.totalRecords = typedAll.length;
  for (const r of typedAll) {
    if (r.sleep_quality) stats.sleepDist[r.sleep_quality] = (stats.sleepDist[r.sleep_quality] || 0) + 1;
    if (r.diet_quality) stats.dietDist[r.diet_quality] = (stats.dietDist[r.diet_quality] || 0) + 1;
    if (r.energy_level) stats.energyDist[r.energy_level] = (stats.energyDist[r.energy_level] || 0) + 1;
  }

  return NextResponse.json({
    success: true,
    data: records,
    pagination: { page, pageSize, total: count || 0, totalPages: Math.ceil((count || 0) / pageSize) },
    statistics: stats,
  });
}

function emptyObsStats() {
  return {
    totalRecords: 0,
    sleepDist: {} as Record<string, number>,
    dietDist: {} as Record<string, number>,
    energyDist: {} as Record<string, number>,
  };
}

export const POST = protectedRoute(async (request, { user }) => {
  const body: CreateObservationDTO & { parentId?: string; studentId: string } = await request.json();

  const parentId = body.parentId || user.id;
  const studentId = body.studentId;

  if (!studentId) {
    return NextResponse.json({ success: false, error: '缺少 studentId' }, { status: 400 });
  }

  const result = await healthManagementService.createOrUpdateObservation(parentId, studentId, {
    studentId,
    observationDate: body.observationDate,
    sleepQuality: body.sleepQuality,
    dietQuality: body.dietQuality,
    energyLevel: body.energyLevel,
    note: body.note,
  });

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  }
  return NextResponse.json({ success: true, data: result.data }, { status: 201 });
});
