/**
 * 云教学课程 API
 * GET  - 获取课程列表（按域筛选）
 * POST - 创建课程
 */

import { NextRequest, NextResponse } from 'next/server';
import { success, error, ErrorCode } from '@/lib/api';
import { getService } from '@/lib/di';
import type { CloudCourseService } from '@/services/cloud-course.service';
import { SERVICE_IDENTIFIERS } from '@/lib/di/container';
import type { CourseDomain, CreateCloudCourseDTO } from '@/types/cloud-course';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain') as CourseDomain | null;
    const keyword = searchParams.get('keyword') || undefined;

    if (!domain) {
      return NextResponse.json(error('缺少 domain 参数', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    const courseService = getService<CloudCourseService>(SERVICE_IDENTIFIERS.CloudCourseService);
    const courses = await courseService.getCourses(domain, keyword);

    return NextResponse.json(success(courses, 'database'));
  } catch (err) {
    console.error('[CloudCourse API] GET error:', err);
    return NextResponse.json(error('获取课程列表失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { creatorId, creatorName, ...courseData } = body;

    if (!creatorId || !creatorName || !courseData.title || !courseData.domain) {
      return NextResponse.json(error('缺少必填字段', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    const courseService = getService<CloudCourseService>(SERVICE_IDENTIFIERS.CloudCourseService);
    const course = await courseService.createCourse(creatorId, creatorName, courseData as CreateCloudCourseDTO);

    if (!course) {
      return NextResponse.json(error('创建课程失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }

    return NextResponse.json(success(course, 'database'));
  } catch (err) {
    console.error('[CloudCourse API] POST error:', err);
    return NextResponse.json(error('创建课程失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}
