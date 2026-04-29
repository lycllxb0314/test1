/**
 * 云教学直播会话 API
 * GET  - 获取直播列表
 * POST - 创建直播会话
 */

import { NextRequest, NextResponse } from 'next/server';
import { success, error, ErrorCode } from '@/lib/api';
import { getService } from '@/lib/di';
import type { CloudLiveSessionService } from '@/services/cloud-course.service';
import { SERVICE_IDENTIFIERS } from '@/lib/di/container';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const upcoming = searchParams.get('upcoming');

    const liveService = getService<CloudLiveSessionService>(SERVICE_IDENTIFIERS.CloudLiveSessionService);

    if (upcoming === 'true') {
      const sessions = await liveService.getUpcomingSessions();
      return NextResponse.json(success(sessions, 'database'));
    }

    if (courseId) {
      const sessions = await liveService.getSessionsByCourse(courseId);
      return NextResponse.json(success(sessions, 'database'));
    }

    return NextResponse.json(error('缺少查询参数', ErrorCode.BAD_REQUEST), { status: 400 });
  } catch (err) {
    console.error('[CloudCourse Live API] GET error:', err);
    return NextResponse.json(error('获取直播列表失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.courseId || !body.title || !body.scheduledAt) {
      return NextResponse.json(error('缺少必填字段', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    const liveService = getService<CloudLiveSessionService>(SERVICE_IDENTIFIERS.CloudLiveSessionService);
    const session = await liveService.createSession(body.courseId, body);

    if (!session) {
      return NextResponse.json(error('创建直播会话失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }

    return NextResponse.json(success(session, 'database'));
  } catch (err) {
    console.error('[CloudCourse Live API] POST error:', err);
    return NextResponse.json(error('创建直播会话失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}
