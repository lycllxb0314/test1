/**
 * 云教学选课/推送 API
 * GET  - 获取选课记录
 * POST - 选课 / 推送课程
 */

import { NextRequest, NextResponse } from 'next/server';
import { success, error, ErrorCode } from '@/lib/api';
import { getService } from '@/lib/di';
import type { CloudCourseEnrollmentService } from '@/services/cloud-course.service';
import { SERVICE_IDENTIFIERS } from '@/lib/di/container';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const studentId = searchParams.get('studentId');

    const enrollmentService = getService<CloudCourseEnrollmentService>(SERVICE_IDENTIFIERS.CloudCourseEnrollmentService);

    if (studentId && userId) {
      // 家长获取子女课程
      const enrollments = await enrollmentService.getStudentEnrollments(userId, studentId);
      return NextResponse.json(success(enrollments, 'database'));
    }

    if (userId) {
      // 获取用户选课记录
      const enrollments = await enrollmentService.getUserEnrollments(userId);
      return NextResponse.json(success(enrollments, 'database'));
    }

    return NextResponse.json(error('缺少 userId 参数', ErrorCode.BAD_REQUEST), { status: 400 });
  } catch (err) {
    console.error('[CloudCourse Enrollment API] GET error:', err);
    return NextResponse.json(error('获取选课记录失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const enrollmentService = getService<CloudCourseEnrollmentService>(SERVICE_IDENTIFIERS.CloudCourseEnrollmentService);

    // 推送课程
    if (body.action === 'push') {
      const { pushedBy, pusherName, ...pushData } = body;
      if (!pushedBy || !pusherName || !pushData.courseId || !pushData.targetType || !pushData.targetIds) {
        return NextResponse.json(error('缺少推送必填字段', ErrorCode.BAD_REQUEST), { status: 400 });
      }
      const result = await enrollmentService.pushCourse(pushedBy, pusherName, pushData);
      if (!result) {
        return NextResponse.json(error('推送课程失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
      }
      return NextResponse.json(success(result, 'database'));
    }

    // 家长为学生选课
    if (body.studentId) {
      const enrollment = await enrollmentService.enrollForStudent(
        body.userId, body.studentId, body.courseId, body.source || 'pushed'
      );
      if (!enrollment) {
        return NextResponse.json(error('选课失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
      }
      return NextResponse.json(success(enrollment, 'database'));
    }

    // 用户自主选课
    if (!body.userId || !body.courseId) {
      return NextResponse.json(error('缺少选课必填字段', ErrorCode.BAD_REQUEST), { status: 400 });
    }
    const enrollment = await enrollmentService.enroll(body.userId, body.courseId, body.source || 'self');
    if (!enrollment) {
      return NextResponse.json(error('选课失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    return NextResponse.json(success(enrollment, 'database'));
  } catch (err) {
    console.error('[CloudCourse Enrollment API] POST error:', err);
    return NextResponse.json(error('选课操作失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}
