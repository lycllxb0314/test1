/**
 * 工作量统计 API
 * 
 * GET: 获取教师工作量统计
 * - 单个教师工作量
 * - 月度汇总
 * - 批量查询
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  calculateTeacherWorkload,
  getTeacherMonthlyWorkloadSummary,
  getTeachersWorkload,
  MOCK_TEACHER_WORKLOAD,
  MOCK_MONTHLY_SUMMARY,
} from '@/lib/workload-service';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const teacherId = searchParams.get('teacherId');
  const semester = searchParams.get('semester') || '2024-2025-1';
  const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined;
  const grade = searchParams.get('grade') ? parseInt(searchParams.get('grade')!) : undefined;

  try {
    switch (action) {
      case 'teacher': {
        if (!teacherId) {
          return NextResponse.json({
            success: false,
            message: '缺少教师ID',
          }, { status: 400 });
        }
        
        const workload = await calculateTeacherWorkload(teacherId, semester, month);
        return NextResponse.json({
          success: true,
          data: workload,
        });
      }
      
      case 'monthly-summary': {
        if (!teacherId || !month) {
          return NextResponse.json({
            success: false,
            message: '缺少教师ID或月份',
          }, { status: 400 });
        }
        
        const summary = await getTeacherMonthlyWorkloadSummary(teacherId, semester, month);
        return NextResponse.json({
          success: true,
          data: summary,
        });
      }
      
      case 'batch': {
        const workloads = await getTeachersWorkload({
          teacherId: teacherId || undefined,
          semester,
          month,
          grade,
        });
        
        return NextResponse.json({
          success: true,
          data: workloads,
          statistics: {
            total: workloads.length,
            avgWorkload: workloads.reduce((sum, w) => sum + w.totalWorkload, 0) / workloads.length,
            avgVariance: workloads.reduce((sum, w) => sum + w.variance, 0) / workloads.length,
          },
        });
      }
      
      case 'mock': {
        // 返回Mock数据用于测试
        return NextResponse.json({
          success: true,
          data: {
            workload: MOCK_TEACHER_WORKLOAD,
            monthlySummary: MOCK_MONTHLY_SUMMARY,
          },
        });
      }
      
      default: {
        // 默认返回批量查询
        const workloads = await getTeachersWorkload({
          semester,
          month,
          grade,
        });
        
        return NextResponse.json({
          success: true,
          data: workloads,
        });
      }
    }
  } catch (error) {
    console.error('工作量计算失败:', error);
    
    // 返回Mock数据作为fallback
    return NextResponse.json({
      success: true,
      data: MOCK_TEACHER_WORKLOAD,
      source: 'mock',
      message: '数据库查询失败，返回模拟数据',
    });
  }
}
