/**
 * 云教学推送目标 API
 * GET /api/cloud-course/push-targets
 *
 * 返回年级-班级层级数据，含学生数和家长数
 * 用于推送管理的目标选择器
 */

import { NextRequest, NextResponse } from 'next/server';
import { success, error, ErrorCode } from '@/lib/api';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export const dynamic = 'force-dynamic';

const GRADE_NAMES = ['', '一年级', '二年级', '三年级', '四年级', '五年级', '六年级'];

export async function GET(_request: NextRequest) {
  try {
    const client = getSupabaseClient();

    // 1. 获取所有活跃班级
    const { data: classes, error: classError } = await client
      .from('classes')
      .select('id, name, grade, class_number, status')
      .eq('status', 'active')
      .order('grade')
      .order('class_number');

    if (classError) {
      console.error('[PushTargets] classes error:', classError.message);
      return NextResponse.json(error('获取班级数据失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }

    // 2. 按班级统计学生数（在校状态）
    const { data: studentCounts, error: scError } = await client
      .from('students')
      .select('class_id')
      .eq('status', '在校');

    // 3. 按班级统计家长数
    const { data: parentCounts, error: pcError } = await client
      .from('parents')
      .select('class_id')
      .not('class_id', 'is', null)
      .neq('status', '停用');

    if (scError) console.error('[PushTargets] student count error:', scError.message);
    if (pcError) console.error('[PushTargets] parent count error:', pcError.message);

    // 统计学生数
    const studentMap = new Map<string, number>();
    for (const s of (studentCounts || [])) {
      const cid = s.class_id as string;
      studentMap.set(cid, (studentMap.get(cid) || 0) + 1);
    }

    // 统计家长数
    const parentMap = new Map<string, number>();
    for (const p of (parentCounts || [])) {
      const cid = p.class_id as string;
      parentMap.set(cid, (parentMap.get(cid) || 0) + 1);
    }

    // 4. 按年级分组
    const gradeMap = new Map<number, {
      grade: number;
      gradeName: string;
      classes: Array<{
        id: string;
        name: string;
        studentCount: number;
        parentCount: number;
      }>;
    }>();

    for (const cls of (classes || [])) {
      const g = cls.grade as number;
      if (!gradeMap.has(g)) {
        gradeMap.set(g, {
          grade: g,
          gradeName: GRADE_NAMES[g] || `${g}年级`,
          classes: [],
        });
      }
      gradeMap.get(g)!.classes.push({
        id: cls.id as string,
        name: cls.name as string,
        studentCount: studentMap.get(cls.id) || 0,
        parentCount: parentMap.get(cls.id) || 0,
      });
    }

    const result = Array.from(gradeMap.values()).sort((a, b) => a.grade - b.grade);

    return NextResponse.json(success(result, 'database'));
  } catch (err) {
    console.error('[PushTargets] GET error:', err);
    return NextResponse.json(error('获取推送目标数据失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}
