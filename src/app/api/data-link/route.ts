import { NextRequest, NextResponse } from 'next/server';
import { dataLinkService } from '@/services/data-link-service';

/**
 * POST - 数据关联操作
 * 请求体：
 * - action: 操作类型
 * - params: 操作参数
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, params } = body;

    let result;

    switch (action) {
      case 'leave-to-schedule':
        // 请假通过后触发调课
        result = await dataLinkService.triggerScheduleAdjustment(params.leaveInstanceId);
        break;

      case 'sync-schedule':
        // 调课完成后同步课表
        result = await dataLinkService.syncScheduleAfterAdjustment(params.adjustmentId);
        break;

      case 'booking-maintenance':
        // 教室预约关联维修申请
        result = await dataLinkService.linkBookingToMaintenance(
          params.bookingId,
          params.maintenanceId
        );
        break;

      case 'sync-student-habit':
        // 学生习惯数据同步
        result = await dataLinkService.syncStudentHabitData(params.studentId);
        break;

      case 'sync-teacher-research':
        // 教师教研数据同步
        result = await dataLinkService.syncTeacherResearchData(params.teacherId);
        break;

      case 'update-class-stats':
        // 班级习惯统计更新
        result = await dataLinkService.updateClassHabitStats(params.classId, params.month);
        break;

      default:
        return NextResponse.json({
          success: false,
          error: '未知的操作类型',
        }, { status: 400 });
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Data link operation failed:', error);
    return NextResponse.json({
      success: false,
      error: '数据关联操作失败',
    }, { status: 500 });
  }
}
