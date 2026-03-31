/**
 * 班级学生列表 API
 * 
 * GET - 获取指定班级的所有学生
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 * - 使用统一认证中间件
 */

import { NextRequest, NextResponse } from 'next/server';
import { getService, SERVICE_IDENTIFIERS } from '@/lib/di';
import { withAuthAndParams } from '@/lib/auth/middleware';
import { success, error, ErrorCode } from '@/lib/api';
import type { StudentService } from '@/services/student.service';

/**
 * GET - 获取班级学生列表
 */
export const GET = withAuthAndParams(async (
  request: NextRequest,
  { params }
) => {
  try {
    const id = params.id as string;
    const studentService = getService<StudentService>(SERVICE_IDENTIFIERS.StudentService);
    
    const result = await studentService.getStudentsByClass(id);
    
    if (!result.success) {
      return NextResponse.json(
        error(result.error || '获取学生列表失败', ErrorCode.DATABASE_ERROR),
        { status: 500 }
      );
    }
    
    // 转换为驼峰格式
    const formattedData = result.data?.map(student => {
      const s = student as unknown as Record<string, unknown>;
      return {
        id: s.id,
        name: s.name,
        studentNumber: s.studentNumber,
        grade: s.grade,
        classId: s.classId,
        className: s.className,
      };
    }) || [];
    
    return NextResponse.json(success(formattedData));
  } catch (err) {
    console.error('Failed to fetch class students:', err);
    return NextResponse.json(
      error('获取学生列表失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
});
