/**
 * 教研活动详情 API
 * 
 * GET: 获取活动详情
 * PUT: 更新活动
 * DELETE: 删除活动
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 * - 使用统一认证中间件
 */

import { NextRequest } from 'next/server';
import { getService, SERVICE_IDENTIFIERS } from '@/lib/di';
import { withAuthAndParams } from '@/lib/auth/middleware';
import { ok, fail, notFound, serverError } from '@/lib/api';
import type { ResearchActivityService } from '@/services/research.service';

/**
 * GET: 获取活动详情
 */
export const GET = withAuthAndParams(async (request: NextRequest, { params }) => {
  const { id } = params;
  
  try {
    const researchService = getService<ResearchActivityService>(SERVICE_IDENTIFIERS.ResearchActivityService);
    
    const result = await researchService.getDetail(id as string);
    
    if (!result.success) {
      if (result.code === 'NOT_FOUND') {
        return notFound('活动不存在');
      }
      return fail(result.error || '获取活动详情失败');
    }
    
    const item = result.data as unknown as Record<string, unknown>;
    
    return ok({
      id: item.id,
      title: item.title,
      type: item.type,
      status: item.status,
      organizerId: item.organizerId,
      organizerName: item.organizerName,
      startDate: item.startDate,
      endDate: item.endDate,
      description: item.description,
      participants: item.participants || [],
      stages: item.stages || [],
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    });
  } catch (error) {
    console.error('获取教研活动详情失败:', error);
    return serverError('服务器错误');
  }
});

/**
 * PUT: 更新活动
 */
export const PUT = withAuthAndParams(async (request: NextRequest, { params }) => {
  const { id } = params;
  
  try {
    const researchService = getService<ResearchActivityService>(SERVICE_IDENTIFIERS.ResearchActivityService);
    const body = await request.json();
    
    const result = await researchService.update(id as string, body);
    
    if (!result.success) {
      if (result.code === 'NOT_FOUND') {
        return notFound('活动不存在');
      }
      return fail(result.error || '更新活动失败');
    }
    
    return ok(result.data);
  } catch (error) {
    console.error('更新教研活动失败:', error);
    return serverError('服务器错误');
  }
});

/**
 * DELETE: 删除活动
 */
export const DELETE = withAuthAndParams(async (request: NextRequest, { params }) => {
  const { id } = params;
  
  try {
    const researchService = getService<ResearchActivityService>(SERVICE_IDENTIFIERS.ResearchActivityService);
    
    const result = await researchService.delete(id as string);
    
    if (!result.success) {
      if (result.code === 'NOT_FOUND') {
        return notFound('活动不存在');
      }
      return fail(result.error || '删除活动失败');
    }
    
    return ok({ id: id as string, message: '删除成功' });
  } catch (error) {
    console.error('删除教研活动失败:', error);
    return serverError('服务器错误');
  }
});
