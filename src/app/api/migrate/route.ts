import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { mockUsers, mockClasses } from '@/data/mock';

/**
 * POST - 迁移mock数据到数据库
 * 用于初始化数据库数据
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    const { type } = body;

    const results: Record<string, { success: boolean; count: number; error?: string }> = {};

    // 迁移用户数据
    if (!type || type === 'users') {
      try {
        const usersData = mockUsers.map(user => ({
          id: user.id,
          name: user.name,
          role: user.role,
          phone: user.phone,
          email: user.email,
          department: user.department,
          position: user.position,
          class_id: user.classId,
          class_name: user.className,
          subjects: user.subjects,
          avatar: user.avatar,
          children: user.children,
          status: 'active',
          password: '123456', // 默认密码
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

        // 批量插入，遇到冲突则更新
        const { error: usersError } = await client
          .from('users')
          .upsert(usersData, { onConflict: 'id' });

        if (usersError) {
          results.users = { success: false, count: 0, error: usersError.message };
        } else {
          results.users = { success: true, count: usersData.length };
        }
      } catch (e) {
        results.users = { success: false, count: 0, error: String(e) };
      }
    }

    // 迁移班级数据
    if (!type || type === 'classes') {
      try {
        const classesData = mockClasses.map(cls => ({
          id: cls.id,
          name: cls.name,
          grade: cls.grade,
          head_teacher_id: cls.headTeacherId,
          head_teacher_name: cls.headTeacherName,
          student_count: cls.studentCount,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

        const { error: classesError } = await client
          .from('classes')
          .upsert(classesData, { onConflict: 'id' });

        if (classesError) {
          results.classes = { success: false, count: 0, error: classesError.message };
        } else {
          results.classes = { success: true, count: classesData.length };
        }
      } catch (e) {
        results.classes = { success: false, count: 0, error: String(e) };
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
      message: '数据迁移完成',
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({
      success: false,
      error: '数据迁移失败',
    }, { status: 500 });
  }
}

/**
 * GET - 检查数据库状态
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();

    // 检查各表的数据量
    const [usersResult, classesResult, teachersResult, studentsResult] = await Promise.all([
      client.from('users').select('id', { count: 'exact', head: true }),
      client.from('classes').select('id', { count: 'exact', head: true }),
      client.from('teachers').select('id', { count: 'exact', head: true }),
      client.from('students').select('id', { count: 'exact', head: true }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        users: usersResult.count || 0,
        classes: classesResult.count || 0,
        teachers: teachersResult.count || 0,
        students: studentsResult.count || 0,
      },
    });
  } catch (error) {
    console.error('Check status error:', error);
    return NextResponse.json({
      success: false,
      error: '检查数据库状态失败',
    }, { status: 500 });
  }
}
