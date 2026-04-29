/**
 * 云教学课程详情 API
 * GET    - 获取课程详情
 * PUT    - 更新课程
 * DELETE - 删除课程
 */

import { NextRequest, NextResponse } from 'next/server';
import { success, error, ErrorCode } from '@/lib/api';
import { getService } from '@/lib/di';
import type { CloudCourseService } from '@/services/cloud-course.service';
import { SERVICE_IDENTIFIERS } from '@/lib/di/container';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const courseService = getService<CloudCourseService>(SERVICE_IDENTIFIERS.CloudCourseService);
    const course = await courseService.getCourseDetail(id);

    if (!course) {
      return NextResponse.json(error('课程不存在', ErrorCode.NOT_FOUND), { status: 404 });
    }

    return NextResponse.json(success(course, 'database'));
  } catch (err) {
    console.error('[CloudCourse Detail API] GET error:', err);
    return NextResponse.json(error('获取课程详情失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const courseService = getService<CloudCourseService>(SERVICE_IDENTIFIERS.CloudCourseService);
    const course = await courseService.updateCourse(id, body);

    if (!course) {
      return NextResponse.json(error('更新课程失败', ErrorCode.NOT_FOUND), { status: 404 });
    }

    return NextResponse.json(success(course, 'database'));
  } catch (err) {
    console.error('[CloudCourse Detail API] PUT error:', err);
    return NextResponse.json(error('更新课程失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const courseService = getService<CloudCourseService>(SERVICE_IDENTIFIERS.CloudCourseService);
    const deleted = await courseService.deleteCourse(id);

    if (!deleted) {
      return NextResponse.json(error('删除课程失败', ErrorCode.NOT_FOUND), { status: 404 });
    }

    return NextResponse.json(success({ id }, 'database'));
  } catch (err) {
    console.error('[CloudCourse Detail API] DELETE error:', err);
    return NextResponse.json(error('删除课程失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}
