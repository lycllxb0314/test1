/**
 * 德育活动 API
 * 
 * GET: 获取活动列表
 * POST: 创建新活动（德育处）
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 * - 使用统一认证中间件
 */

import { NextRequest, NextResponse } from 'next/server';
import { getService, SERVICE_IDENTIFIERS } from '@/lib/di';
import { withAuth } from '@/lib/auth/middleware';
import { paginated, fail, serverError } from '@/lib/api';
import type { MoralActivityService } from '@/services/moral.service';
import type { User } from '@/types';

// 年级名称映射
const GRADE_NAMES = ['', '一年级', '二年级', '三年级', '四年级', '五年级', '六年级'];

/**
 * GET: 获取活动列表
 */
export const GET = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || undefined;
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');

  try {
    const moralService = getService<MoralActivityService>(SERVICE_IDENTIFIERS.MoralActivityService);
    
    const result = await moralService.getPaginated({
      pagination: { page, pageSize },
      filters: {
        status,
      },
    });
    
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    
    // 格式化数据
    const formattedData = (result.data || []).map(activity => {
      const item = activity as unknown as Record<string, unknown>;
      return {
        id: item.id,
        title: item.title,
        content: item.content,
        targetGrades: item.targetGrades || [],
        targetGradeNames: ((item.targetGrades || []) as number[]).map(g => GRADE_NAMES[g] || `${g}年级`),
        targetRoles: item.targetRoles || ['head_teacher', 'grade_leader'],
        requireSubmission: item.requireSubmission,
        submissionDeadline: item.submissionDeadline,
        status: item.status,
        organizerId: item.organizerId,
        organizerName: item.organizerName,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };
    });
    
    return paginated(formattedData, result.pagination?.total || 0, page, pageSize);
  } catch (error) {
    console.error('获取德育活动列表失败:', error);
    return serverError('服务器错误');
  }
});

/**
 * POST: 创建新活动
 */
export const POST = withAuth(async (request: NextRequest) => {
  try {
    const moralService = getService<MoralActivityService>(SERVICE_IDENTIFIERS.MoralActivityService);
    const body = await request.json();
    
    if (!body.title) {
      return fail('活动标题不能为空');
    }
    
    const result = await moralService.create({
      title: body.title,
      content: body.content,
      type: body.type || 'theme_education',
      targetGrades: body.targetGrades || [],
      targetRoles: body.targetRoles || ['head_teacher'],
      requireSubmission: body.requireSubmission || false,
      submissionDeadline: body.submissionDeadline,
      organizerId: body.organizerId,
      organizerName: body.organizerName,
      status: 'planned',
    });
    
    if (!result.success) {
      return fail(result.error || '创建活动失败');
    }
    
    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('创建德育活动失败:', error);
    return serverError('服务器错误');
  }
});
