/**
 * 学生习惯档案 API
 * 
 * 架构：API Route → Service → Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { studentService } from '@/services/student.service';
import { habitStatisticsService } from '@/services/habit.ext.service';
import { error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

/**
 * GET - 获取学生习惯档案
 */
export const GET = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const params = await context.params;
    const id = params?.id;
    
    if (!id) {
      return NextResponse.json(error('缺少学生ID', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    // 获取学生基本信息
    const studentResult = await studentService.getStudent(id);
    
    if (!studentResult.success) {
      const statusCode = studentResult.code === 'NOT_FOUND' ? 404 : 500;
      return NextResponse.json(error(studentResult.error || '学生不存在', studentResult.code as ErrorCode), { status: statusCode });
    }
    
    // 获取学生习惯统计
    const habitResult = await habitStatisticsService.getStatistics({ studentId: id });
    
    return NextResponse.json({
      success: true,
      data: {
        student: studentResult.data,
        habitStats: habitResult.data,
      },
    });
  } catch (err) {
    console.error('获取学生习惯档案失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
