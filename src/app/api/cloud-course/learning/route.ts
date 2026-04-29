/**
 * 云教学学习进度 API
 * PUT - 安排学习 / 更新进度
 */

import { NextRequest, NextResponse } from 'next/server';
import { success, error, ErrorCode } from '@/lib/api';
import { getService } from '@/lib/di';
import type { CloudCourseEnrollmentService, CloudLearningRecordService } from '@/services/cloud-course.service';
import { SERVICE_IDENTIFIERS } from '@/lib/di/container';

export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const enrollmentService = getService<CloudCourseEnrollmentService>(SERVICE_IDENTIFIERS.CloudCourseEnrollmentService);
    const learningService = getService<CloudLearningRecordService>(SERVICE_IDENTIFIERS.CloudLearningRecordService);

    // 安排学习
    if (body.action === 'schedule') {
      const result = await enrollmentService.scheduleLearning({
        enrollmentId: body.enrollmentId,
        scheduledAt: body.scheduledAt,
      });
      if (!result) {
        return NextResponse.json(error('安排学习失败', ErrorCode.NOT_FOUND), { status: 404 });
      }
      return NextResponse.json(success(result, 'database'));
    }

    // 开始学习章节
    if (body.action === 'start') {
      const record = await learningService.startLearning(body.enrollmentId, body.chapterId, body.recordType);
      if (!record) {
        return NextResponse.json(error('开始学习失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
      }
      return NextResponse.json(success(record, 'database'));
    }

    // 完成学习章节
    if (body.action === 'complete') {
      const record = await learningService.completeLearning(body.recordId, body.watchDuration, body.quizScore);
      if (!record) {
        return NextResponse.json(error('完成学习失败', ErrorCode.NOT_FOUND), { status: 404 });
      }

      // 更新总体进度
      await enrollmentService.updateProgress({
        enrollmentId: body.enrollmentId,
        chapterId: body.chapterId,
        completed: true,
      });

      return NextResponse.json(success(record, 'database'));
    }

    // 更新进度
    if (body.action === 'progress') {
      const result = await enrollmentService.updateProgress({
        enrollmentId: body.enrollmentId,
        chapterId: body.chapterId,
        watchDuration: body.watchDuration,
        completed: body.completed,
      });
      if (!result) {
        return NextResponse.json(error('更新进度失败', ErrorCode.NOT_FOUND), { status: 404 });
      }
      return NextResponse.json(success(result, 'database'));
    }

    return NextResponse.json(error('未知操作', ErrorCode.BAD_REQUEST), { status: 400 });
  } catch (err) {
    console.error('[CloudCourse Learning API] PUT error:', err);
    return NextResponse.json(error('学习操作失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}

/** 获取学习记录 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const enrollmentId = searchParams.get('enrollmentId');

    if (!enrollmentId) {
      return NextResponse.json(error('缺少 enrollmentId', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    const learningService = getService<CloudLearningRecordService>(SERVICE_IDENTIFIERS.CloudLearningRecordService);
    const records = await learningService.getRecords(enrollmentId);

    return NextResponse.json(success(records, 'database'));
  } catch (err) {
    console.error('[CloudCourse Learning API] GET error:', err);
    return NextResponse.json(error('获取学习记录失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}
