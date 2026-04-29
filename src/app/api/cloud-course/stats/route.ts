/**
 * 云教学课程统计 API
 * GET - 获取统计数据
 */

import { NextResponse } from 'next/server';
import { success, error, ErrorCode } from '@/lib/api';
import { getService } from '@/lib/di';
import type { CloudCourseService } from '@/services/cloud-course.service';
import { SERVICE_IDENTIFIERS } from '@/lib/di/container';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const courseService = getService<CloudCourseService>(SERVICE_IDENTIFIERS.CloudCourseService);
    const stats = await courseService.getStats();
    return NextResponse.json(success(stats, 'database'));
  } catch (err) {
    console.error('[CloudCourse Stats API] GET error:', err);
    return NextResponse.json(error('获取统计失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}
