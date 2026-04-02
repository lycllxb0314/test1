/**
 * 学生荣誉申报 API
 *
 * GET: 获取申报列表
 * POST: 创建申报
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute } from '@/lib/auth';
import { honorCampaignService } from '@/services/honor-campaign.service';
import { success, error, ErrorCode } from '@/lib/api';
import type { CreateApplicationRequest, ApplicationQueryParams } from '@/types/honor-campaign';

// 获取申报列表
export const GET = protectedRoute(async (request: NextRequest, { user }) => {
  try {
    const { searchParams } = new URL(request.url);
    
    const params: ApplicationQueryParams = {
      campaignId: searchParams.get('campaignId') || undefined,
      studentId: searchParams.get('studentId') || undefined,
      classId: searchParams.get('classId') || undefined,
      applicantId: searchParams.get('applicantId') === 'me' ? user.id : searchParams.get('applicantId') || undefined,
      status: searchParams.get('status') as ApplicationQueryParams['status'] || undefined,
      currentStep: searchParams.get('currentStep') as ApplicationQueryParams['currentStep'] || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('pageSize') || '20'),
    };

    // 根据角色过滤
    if (user.role === 'head_teacher') {
      // 班主任只能看本班的申报
      // params.classId 需要从用户的班级信息获取
      params.classId = params.classId || user.classId;
    } else if (user.role === 'parent') {
      // 家长只能看自己的申报
      params.applicantId = user.id;
    }

    const result = await honorCampaignService.getApplications(params);
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '获取失败', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    return NextResponse.json(success({
      data: result.data!.data,
      pagination: {
        page: params.page,
        pageSize: params.pageSize,
        total: result.data!.total,
      },
    }, 'database'));
  } catch (err) {
    console.error('[API] GET /api/honor-applications error:', err);
    return NextResponse.json(error('获取申报列表失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

// 创建申报
export const POST = protectedRoute(async (request: NextRequest, { user }) => {
  try {
    // 只有家长可以创建申报
    if (user.role !== 'parent') {
      return NextResponse.json(error('只有家长可以申报', ErrorCode.FORBIDDEN), { status: 403 });
    }

    const body: CreateApplicationRequest = await request.json();

    // 验证必填字段
    if (!body.campaignId || !body.studentId) {
      return NextResponse.json(error('缺少必填字段', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    const result = await honorCampaignService.createApplication(body, user.id, user.name);
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '创建失败', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    return NextResponse.json(success(result.data!, 'database'));
  } catch (err) {
    console.error('[API] POST /api/honor-applications error:', err);
    return NextResponse.json(error('创建申报失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
