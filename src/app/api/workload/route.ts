/**
 * 工作量统计 API
 * 
 * GET: 获取工作量统计
 * - action=batch: 批量获取教师工作量
 * - action=teacher: 获取单个教师工作量详情
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 */

import { NextRequest, NextResponse } from 'next/server';
import { success, error, ErrorCode } from '@/lib/api';
import { 
  calculateTeacherWorkload, 
  getTeachersWorkload 
} from '@/lib/workload-service';

/**
 * GET - 获取工作量统计
 * 
 * Query params:
 * - action: 'batch' | 'teacher'
 * - semester: 学期 (如 2025-2026-2)
 * - month: 月份 (1-12)
 * - grade: 年级筛选 (1-6)
 * - teacherId: 教师ID (action=teacher 时必填)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'batch';
  const semester = searchParams.get('semester') || '2025-2026-2';
  const monthParam = searchParams.get('month');
  const gradeParam = searchParams.get('grade');
  const teacherId = searchParams.get('teacherId');

  const month = monthParam ? parseInt(monthParam) : new Date().getMonth() + 1;
  const grade = gradeParam ? parseInt(gradeParam) : undefined;

  try {
    if (action === 'batch') {
      // 批量获取教师工作量
      const workloads = await getTeachersWorkload({
        semester,
        month,
        grade,
      });

      return NextResponse.json(success(workloads));
    } else if (action === 'teacher') {
      // 获取单个教师工作量详情
      if (!teacherId) {
        return NextResponse.json(
          error('缺少教师ID', ErrorCode.VALIDATION_ERROR),
          { status: 400 }
        );
      }

      const workload = await calculateTeacherWorkload(teacherId, semester, month);

      return NextResponse.json(success(workload));
    } else {
      return NextResponse.json(
        error('无效的 action 参数', ErrorCode.VALIDATION_ERROR),
        { status: 400 }
      );
    }
  } catch (err) {
    console.error('工作量统计 API 错误:', err);
    return NextResponse.json(
      error('服务器错误', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}
