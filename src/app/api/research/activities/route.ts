/**
 * 教研活动 API
 * 
 * GET: 获取活动列表
 * POST: 创建新活动
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 * - 使用统一认证中间件
 */

import { NextRequest, NextResponse } from 'next/server';
import { getService, SERVICE_IDENTIFIERS } from '@/lib/di';
import { withAuth } from '@/lib/auth/middleware';
import { paginated, fail, serverError, ok } from '@/lib/api';
import type { ResearchActivityService } from '@/services/research.service';

/**
 * GET: 获取活动列表
 */
export const GET = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || undefined;
  const type = searchParams.get('type') || undefined;
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');

  try {
    const researchService = getService<ResearchActivityService>(SERVICE_IDENTIFIERS.ResearchActivityService);
    
    const result = await researchService.getPaginated({
      pagination: { page, pageSize },
      filters: {
        status,
        type,
      },
    });
    
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    
    const formattedData = (result.data || []).map(activity => {
      const item = activity as unknown as Record<string, unknown>;
      return {
        id: item.id,
        title: item.title,
        type: item.type,
        status: item.status,
        hostId: item.hostId,
        hostName: item.hostName,
        scheduledAt: item.scheduledAt,
        location: item.location,
        description: item.description,
        participantIds: item.participantIds || [],
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };
    });
    
    return paginated(formattedData, result.pagination?.total || 0, page, pageSize);
  } catch (error) {
    console.error('获取教研活动列表失败:', error);
    return serverError('服务器错误');
  }
});

/**
 * POST: 创建新活动
 */
export const POST = withAuth(async (request: NextRequest) => {
  try {
    const researchService = getService<ResearchActivityService>(SERVICE_IDENTIFIERS.ResearchActivityService);
    const body = await request.json();
    
    if (!body.title || !body.type) {
      return fail('活动标题和类型不能为空');
    }
    
    const result = await researchService.create({
      title: body.title,
      type: body.type,
      status: body.status || 'scheduled',
      hostId: body.hostId,
      hostName: body.hostName,
      scheduledAt: body.scheduledAt,
      location: body.location,
      description: body.description,
      participantIds: body.participantIds || [],
    });
    
    if (!result.success) {
      return fail(result.error || '创建活动失败');
    }
    
    return ok(result.data);
  } catch (error) {
    console.error('创建教研活动失败:', error);
    return serverError('服务器错误');
  }
});
