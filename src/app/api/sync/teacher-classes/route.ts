/**
 * 同步教师-班级关联数据
 * 从 classes 表同步到 teachers 表的 head_teacher_class_ids 字段
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { success, error, ErrorCode } from '@/lib/api-route-utils';

/**
 * POST - 执行同步
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    
    // 1. 获取所有班级
    const { data: classes, error: classesError } = await client
      .from('classes')
      .select('id, head_teacher_id');
    
    if (classesError) {
      return NextResponse.json(error('获取班级失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    // 2. 构建教师-班级映射
    const teacherClassesMap = new Map<string, string[]>();
    
    for (const cls of classes || []) {
      if (cls.head_teacher_id) {
        const existing = teacherClassesMap.get(cls.head_teacher_id) || [];
        existing.push(cls.id);
        teacherClassesMap.set(cls.head_teacher_id, existing);
      }
    }
    
    // 3. 批量更新教师表
    let updatedCount = 0;
    const errors: string[] = [];
    
    for (const [teacherId, classIds] of teacherClassesMap) {
      const { error: updateError } = await client
        .from('teachers')
        .update({ head_teacher_class_ids: classIds })
        .eq('id', teacherId);
      
      if (updateError) {
        errors.push(`教师 ${teacherId} 更新失败: ${updateError.message}`);
      } else {
        updatedCount++;
      }
    }
    
    return NextResponse.json(success({
      message: `同步完成，更新了 ${updatedCount} 名教师的班主任班级关联`,
      totalTeachers: teacherClassesMap.size,
      updatedCount,
      errors: errors.length > 0 ? errors : undefined,
    }));
  } catch (err) {
    console.error('Sync failed:', err);
    return NextResponse.json(error('同步失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}
