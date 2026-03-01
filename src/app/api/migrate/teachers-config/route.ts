/**
 * 数据库迁移API - 添加教师课时配置字段
 * 
 * 向teachers表添加以下字段：
 * - role: 教师角色（head_teacher/subject_teacher/skill_teacher）
 * - primary_subject: 主教学科
 * - secondary_subjects: 兼教学科
 * - total_weekly_hours: 总周课时
 * - main_class_count: 主教班级数
 * - main_subject_hours: 主学科课时
 * - teachable_grades: 可任教年级
 * - teachable_subjects: 可任教科目
 * - additional_roles: 兼任职务
 */

import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function POST() {
  const client = getSupabaseClient();
  const results: string[] = [];
  const errors: string[] = [];

  // 需要添加的列定义
  const columnsToAdd = [
    { name: 'role', type: 'text', default: "'subject_teacher'" },
    { name: 'primary_subject', type: 'text', default: 'null' },
    { name: 'secondary_subjects', type: 'text[]', default: "'{}'::text[]" },
    { name: 'total_weekly_hours', type: 'integer', default: '15' },
    { name: 'main_class_count', type: 'integer', default: '0' },
    { name: 'main_subject_hours', type: 'integer', default: '0' },
    { name: 'teachable_grades', type: 'integer[]', default: "'{1,2,3,4,5,6}'::integer[]" },
    { name: 'teachable_subjects', type: 'jsonb', default: "'[]'::jsonb" },
    { name: 'additional_roles', type: 'jsonb', default: "'[]'::jsonb" },
  ];

  try {
    // 首先检查表是否存在
    const { data: tableCheck, error: tableError } = await client
      .from('teachers')
      .select('id')
      .limit(1);
    
    if (tableError) {
      return NextResponse.json(
        { success: false, error: `teachers表不存在或无法访问: ${tableError.message}` },
        { status: 500 }
      );
    }

    results.push('teachers表存在');

    // 使用RPC执行原始SQL添加列
    // 注意：Supabase通常不允许直接执行DDL，需要通过特殊方式
    
    // 方案：直接尝试更新数据，如果列不存在则报错
    // 我们使用一个变通方法：创建一个临时表来检测列是否存在
    
    for (const col of columnsToAdd) {
      try {
        // 尝试查询该列是否存在
        const testQuery = `
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'teachers' AND column_name = '${col.name}'
        `;
        
        // 由于无法直接执行SQL，我们尝试更新并捕获错误
        // 如果列已存在，更新不会报错
        // 如果列不存在，我们需要通过其他方式添加
        
        // 先尝试一个简单的更新来检测列是否存在
        const { error: testError } = await client
          .from('teachers')
          .update({ [col.name]: col.default })
          .eq('id', '00000000-0000-0000-0000-000000000000')
          .limit(1);
        
        if (testError && testError.message.includes('Could not find')) {
          // 列不存在，需要添加
          results.push(`列 ${col.name} 不存在，需要通过数据库迁移添加`);
        } else if (testError && !testError.message.includes('Could not find')) {
          // 其他错误（如找不到记录）表示列已存在
          results.push(`列 ${col.name} 已存在`);
        } else {
          results.push(`列 ${col.name} 已存在`);
        }
      } catch (e: any) {
        errors.push(`检查列 ${col.name} 失败: ${e.message}`);
      }
    }

    // 由于Supabase客户端不支持DDL操作，我们需要返回指示
    return NextResponse.json({
      success: false,
      message: '需要在Supabase控制台手动执行数据库迁移',
      instructions: {
        step1: '登录Supabase控制台',
        step2: '进入SQL Editor',
        step3: '执行以下SQL语句',
        sql: generateMigrationSQL(),
      },
      results,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error: any) {
    console.error('迁移检查失败:', error);
    return NextResponse.json(
      { success: false, error: error.message || '迁移检查失败' },
      { status: 500 }
    );
  }
}

function generateMigrationSQL(): string {
  return `
-- 教师课时配置字段迁移
-- 执行前请备份数据

-- 1. 添加教师角色字段
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS role text DEFAULT 'subject_teacher';

-- 2. 添加主教学科字段
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS primary_subject text;

-- 3. 添加兼教学科字段
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS secondary_subjects text[] DEFAULT '{}'::text[];

-- 4. 添加总周课时字段
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS total_weekly_hours integer DEFAULT 15;

-- 5. 添加主教班级数字段
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS main_class_count integer DEFAULT 0;

-- 6. 添加主学科课时字段
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS main_subject_hours integer DEFAULT 0;

-- 7. 添加可任教年级字段
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS teachable_grades integer[] DEFAULT '{1,2,3,4,5,6}'::integer[];

-- 8. 添加可任教科目字段（JSON数组）
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS teachable_subjects jsonb DEFAULT '[]'::jsonb;

-- 9. 添加兼任职务字段
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS additional_roles jsonb DEFAULT '[]'::jsonb;

-- 10. 根据现有subjects字段更新primary_subject
UPDATE teachers 
SET primary_subject = CASE 
  WHEN subjects::text LIKE '%语文%' THEN '语文'
  WHEN subjects::text LIKE '%数学%' THEN '数学'
  WHEN subjects::text LIKE '%英语%' THEN '英语'
  WHEN subjects::text LIKE '%体育%' THEN '体育'
  WHEN subjects::text LIKE '%音乐%' THEN '音乐'
  WHEN subjects::text LIKE '%美术%' THEN '美术'
  WHEN subjects::text LIKE '%科学%' THEN '科学'
  WHEN subjects::text LIKE '%道德与法治%' THEN '道德与法治'
  ELSE null
END
WHERE primary_subject IS NULL;

-- 11. 创建索引以提升查询性能
CREATE INDEX IF NOT EXISTS idx_teachers_role ON teachers(role);
CREATE INDEX IF NOT EXISTS idx_teachers_primary_subject ON teachers(primary_subject);

-- 完成
SELECT 'Migration completed successfully' as status;
`.trim();
}
