/**
 * 家长数据迁移脚本
 * 
 * 为学生表添加 parents JSON 字段，并生成模拟家长数据
 */

import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

interface MigrationResult {
  step: string;
  status: 'success' | 'error' | 'skipped';
  message?: string;
  count?: number;
}

export async function POST() {
  const client = getSupabaseClient();
  const results: MigrationResult[] = [];

  try {
    // 1. 获取所有学生
    console.log('Fetching students...');
    const { data: students, error: fetchError } = await client
      .from('students')
      .select('*');

    if (fetchError) {
      results.push({ step: 'fetch_students', status: 'error', message: fetchError.message });
      return NextResponse.json({ results });
    }

    results.push({ step: 'fetch_students', status: 'success', count: students?.length || 0 });

    if (!students || students.length === 0) {
      results.push({ step: 'migrate_parents', status: 'skipped', message: '没有学生数据' });
      return NextResponse.json({ results });
    }

    // 2. 为每个学生生成家长数据
    const phonePrefixes = ['138', '139', '136', '135', '186', '187', '150', '151', '152', '188'];
    const relationships = ['父亲', '母亲'];
    
    let updatedCount = 0;
    
    for (const student of students) {
      // 检查是否已有 parents 字段
      if (student.parents && Array.isArray(student.parents) && student.parents.length > 0) {
        continue; // 已有家长数据，跳过
      }

      // 生成家长数据
      const parents = [];
      
      // 父亲
      const fatherPhone = `${phonePrefixes[Math.floor(Math.random() * phonePrefixes.length)]}****${String(1000 + Math.floor(Math.random() * 9000)).slice(1)}`;
      parents.push({
        id: `${student.id}_parent_father`,
        name: `${student.name.charAt(0)}先生`,
        relationship: '父亲',
        phone: fatherPhone,
        isPrimary: true,
        wechat: '',
      });

      // 母亲
      const motherPhone = `${phonePrefixes[Math.floor(Math.random() * phonePrefixes.length)]}****${String(1000 + Math.floor(Math.random() * 9000)).slice(1)}`;
      parents.push({
        id: `${student.id}_parent_mother`,
        name: `${student.name.charAt(0)}女士`,
        relationship: '母亲',
        phone: motherPhone,
        isPrimary: false,
        wechat: '',
      });

      // 更新学生记录
      const { error: updateError } = await client
        .from('students')
        .update({ parents })
        .eq('id', student.id);

      if (!updateError) {
        updatedCount++;
      }
    }

    results.push({ 
      step: 'migrate_parents', 
      status: 'success', 
      count: updatedCount,
      message: `已为 ${updatedCount} 名学生添加家长数据`
    });

    return NextResponse.json({ 
      success: true, 
      results,
      summary: {
        totalStudents: students.length,
        updatedStudents: updatedCount,
      }
    });
  } catch (err) {
    console.error('Migration error:', err);
    return NextResponse.json({ 
      success: false, 
      results: [...results, { step: 'error', status: 'error', message: String(err) }]
    });
  }
}
