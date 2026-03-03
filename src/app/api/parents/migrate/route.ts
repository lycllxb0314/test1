/**
 * 家长数据迁移 API
 * 
 * 将 students 表中的 parents JSON 字段数据迁移到独立的 parents 表
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

// 关系名称映射
const RELATION_NAMES: Record<string, string> = {
  father: '父亲',
  mother: '母亲',
  grandfather: '爷爷/外公',
  grandmother: '奶奶/外婆',
  other: '其他',
};

/**
 * POST - 执行数据迁移
 */
const handleMigrate = async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const client = getSupabaseClient();
    
    // 检查parents表是否存在数据
    const { data: existingParents, error: checkError } = await client
      .from('parents')
      .select('id')
      .limit(1);
    
    if (existingParents && existingParents.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'parents表已有数据，请先清空后再执行迁移',
      });
    }
    
    // 获取所有学生数据
    const { data: students, error: fetchError } = await client
      .from('students')
      .select('id, name, class_id, class_name, grade, parents');
    
    if (fetchError) {
      return NextResponse.json({
        success: false,
        message: '获取学生数据失败',
        error: fetchError.message,
      });
    }
    
    let migratedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];
    
    for (const student of students || []) {
      const studentParents = student.parents as Array<{
        id?: string;
        name: string;
        relation?: string;
        relationship?: string;
        phone?: string;
        wechat?: string;
        email?: string;
        isPrimary?: boolean;
      }> || [];
      
      if (studentParents.length === 0) {
        skippedCount++;
        continue;
      }
      
      for (const parent of studentParents) {
        try {
          const relation = parent.relation || 'other';
          const parentId = parent.id || `parent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          const newParent = {
            id: parentId,
            student_id: student.id,
            student_name: student.name,
            class_id: student.class_id,
            class_name: student.class_name,
            name: parent.name,
            relation: relation,
            relation_name: RELATION_NAMES[relation] || parent.relationship || '其他',
            phone: parent.phone || null,
            wechat: parent.wechat || null,
            is_primary: parent.isPrimary || false,
            has_account: false,
            status: 'active',
          };
          
          const { error: insertError } = await client
            .from('parents')
            .insert(newParent);
          
          if (insertError) {
            errors.push(`学生 ${student.name} 的家长 ${parent.name} 迁移失败: ${insertError.message}`);
          } else {
            migratedCount++;
          }
        } catch (err) {
          errors.push(`处理学生 ${student.name} 的家长时出错`);
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `迁移完成：成功迁移 ${migratedCount} 条家长记录，跳过 ${skippedCount} 个无家长的学生`,
      data: {
        migratedCount,
        skippedCount,
        errorCount: errors.length,
        errors: errors.slice(0, 10), // 只返回前10条错误
      },
    });
  } catch (err) {
    console.error('Migration failed:', err);
    return NextResponse.json({
      success: false,
      message: '迁移失败',
      error: String(err),
    });
  }
};

export const POST = protectedRoute(handleMigrate);
