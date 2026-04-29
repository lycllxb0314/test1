/**
 * 锻炼打卡数据 API
 * GET /api/health/exercise?startDate=xxx&endDate=xxx&classId=xxx&studentId=xxx&page=1&pageSize=50
 */
import { NextResponse } from 'next/server';
import { protectedRoute } from '@/lib/auth';
import { getSupabaseClient } from '@/storage/database/supabase-client';

type StudentRow = { id: string; name: string; student_no: string; class_name: string };
type RecordRow = {
  id: string; student_id: string; check_date: string; status: string;
  description: string | null; exercise_type: string; duration_min: number | null;
  intensity: string | null; created_at: string;
};
type StatsRow = { exercise_type: string; duration_min: number | null; intensity: string | null };

export const GET = protectedRoute(async (request) => {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const classId = searchParams.get('classId');
  const studentId = searchParams.get('studentId');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);

  const client = getSupabaseClient();

  // 先根据 classId 找到学生 ID 列表
  let studentIds: string[] = [];
  if (classId) {
    const { data: classStudents } = await client
      .from('students')
      .select('id')
      .eq('class_id', classId);
    studentIds = ((classStudents || []) as unknown as StudentRow[]).map(s => s.id);
    if (studentIds.length === 0) {
      return NextResponse.json({ success: true, data: [], pagination: { page, pageSize, total: 0, totalPages: 0 }, statistics: emptyStats() });
    }
  }

  // 查询有运动数据的打卡记录
  let query = client
    .from('habit_daily_records')
    .select('*', { count: 'exact' })
    .not('exercise_type', 'is', null)
    .order('check_date', { ascending: false });

  if (startDate) query = query.gte('check_date', startDate);
  if (endDate) query = query.lte('check_date', endDate);
  if (studentId) query = query.eq('student_id', studentId);
  if (studentIds.length > 0) query = query.in('student_id', studentIds);

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, count, error: dbError } = await query;

  if (dbError) {
    console.error('[HealthExerciseAPI] query error:', dbError.message);
    return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
  }

  // 收集所有 student_id，批量查询学生信息
  const rawRecords = (data || []) as unknown as RecordRow[];
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

  // 转换为前端友好的格式
  const records = rawRecords.map(row => {
    const s = studentMap.get(row.student_id);
    return {
      id: row.id,
      studentId: row.student_id,
      studentName: s?.name || '-',
      studentNo: s?.student_no || '-',
      className: s?.class_name || '-',
      checkDate: row.check_date,
      status: row.status,
      description: row.description,
      exerciseType: row.exercise_type,
      durationMin: row.duration_min,
      intensity: row.intensity,
      createdAt: row.created_at,
    };
  });

  // 统计（用全部匹配的记录，不分页）
  let statsQuery = client
    .from('habit_daily_records')
    .select('exercise_type, duration_min, intensity')
    .not('exercise_type', 'is', null);
  if (startDate) statsQuery = statsQuery.gte('check_date', startDate);
  if (endDate) statsQuery = statsQuery.lte('check_date', endDate);
  if (studentId) statsQuery = statsQuery.eq('student_id', studentId);
  if (studentIds.length > 0) statsQuery = statsQuery.in('student_id', studentIds);

  const { data: allRecords } = await statsQuery;
  const typedAllRecords = (allRecords || []) as unknown as StatsRow[];

  const stats = emptyStats();
  stats.totalRecords = typedAllRecords.length;
  typedAllRecords.forEach(r => {
    stats.totalDurationMin += r.duration_min || 0;
    if (r.exercise_type) stats.exerciseTypes[r.exercise_type] = (stats.exerciseTypes[r.exercise_type] || 0) + 1;
    if (r.intensity && r.intensity in stats.intensityDist) (stats.intensityDist as Record<string, number>)[r.intensity]++;
  });

  return NextResponse.json({
    success: true,
    data: records,
    pagination: { page, pageSize, total: count || 0, totalPages: Math.ceil((count || 0) / pageSize) },
    statistics: stats,
  });
});

function emptyStats() {
  return {
    totalRecords: 0,
    totalDurationMin: 0,
    exerciseTypes: {} as Record<string, number>,
    intensityDist: { low: 0, medium: 0, high: 0 } as Record<string, number>,
  };
}
