/**
 * 更新数据库中缺失字段的API
 * 用于补充已迁移数据中缺失的 phone、email、parent_name 等字段
 */

import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import {
  MASTER_TEACHERS,
  MASTER_STUDENTS,
} from '@/lib/mock/master-data';

export async function POST() {
  const client = getSupabaseClient();
  const results: { table: string; updated: number }[] = [];

  try {
    // 1. 更新教师的 phone 和 email
    console.log('Updating teachers phone and email...');
    const phonePrefixes = ['138', '139', '136', '135', '134', '133', '132', '131', '130', '150'];
    
    for (let i = 0; i < MASTER_TEACHERS.length; i++) {
      const t = MASTER_TEACHERS[i];
      const phoneSuffix = String(1000 + i).slice(-4); // 确保是4位
      await client
        .from('teachers')
        .update({
          phone: `${phonePrefixes[i % phonePrefixes.length]}****${phoneSuffix}`,
          email: `${t.name.toLowerCase().replace(/\s/g, '')}@lysf.fx.edu.cn`,
        })
        .eq('id', t.id);
    }
    results.push({ table: 'teachers', updated: MASTER_TEACHERS.length });

    // 2. 更新学生的 parent_name 和 parent_phone
    console.log('Updating students parent info...');
    const studentPhonePrefixes = ['138', '139', '136', '135', '186', '187', '150', '151', '152', '188'];
    
    for (let i = 0; i < MASTER_STUDENTS.length; i++) {
      const s = MASTER_STUDENTS[i];
      const phoneSuffix = String(8000 + i).slice(-4); // 确保是4位
      await client
        .from('students')
        .update({
          parent_name: s.gender === 'male' ? `${s.name.charAt(0)}先生` : `${s.name.charAt(0)}女士`,
          parent_phone: `${studentPhonePrefixes[i % studentPhonePrefixes.length]}****${phoneSuffix}`,
        })
        .eq('id', s.id);
    }
    results.push({ table: 'students', updated: MASTER_STUDENTS.length });

    return NextResponse.json({
      success: true,
      message: '字段更新完成',
      results,
    });
  } catch (error) {
    console.error('Update fields error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '更新失败',
    }, { status: 500 });
  }
}
