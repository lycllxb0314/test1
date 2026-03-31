/**
 * 德育活动详情 API
 * 
 * GET: 获取活动详情
 * PUT: 更新活动
 * DELETE: 删除活动
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 * - 使用统一认证中间件
 */

import { NextRequest, NextResponse } from 'next/server';
import { getService, SERVICE_IDENTIFIERS } from '@/lib/di';
import { withAuthAndParams } from '@/lib/auth/middleware';
import { ok, fail, notFound, serverError } from '@/lib/api';
import type { MoralActivityService } from '@/services/moral.service';

/**
 * GET: 获取活动详情
 */
export const GET = withAuthAndParams(async (request: NextRequest, { params }) => {
  const { id } = params;
  
  try {
    const moralService = getService<MoralActivityService>(SERVICE_IDENTIFIERS.MoralActivityService);
    
    const result = await moralService.getById(id as string);
    
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
      content: item.content,
      type: item.type,
      targetGrades: item.targetGrades || [],
      targetRoles: item.targetRoles || [],
      requireSubmission: item.requireSubmission,
      submissionDeadline: item.submissionDeadline,
      status: item.status,
      organizerId: item.organizerId,
      organizerName: item.organizerName,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    });
  } catch (error) {
    console.error('获取德育活动详情失败:', error);
    return serverError('服务器错误');
  }
});

/**
 * PUT: 更新活动
 */
export const PUT = withAuthAndParams(async (request: NextRequest, { params }) => {
  const { id } = params;
  
  try {
    const moralService = getService<MoralActivityService>(SERVICE_IDENTIFIERS.MoralActivityService);
    const body = await request.json();
    
    const result = await moralService.update(id as string, body);
    
    if (!result.success) {
      if (result.code === 'NOT_FOUND') {
        return notFound('活动不存在');
      }
      return fail(result.error || '更新活动失败');
    }
    
    return ok(result.data);
  } catch (error) {
    console.error('更新德育活动失败:', error);
    return serverError('服务器错误');
  }
});

/**
 * DELETE: 删除活动
 */
export const DELETE = withAuthAndParams(async (request: NextRequest, { params }) => {
  const { id } = params;
  
  try {
    const moralService = getService<MoralActivityService>(SERVICE_IDENTIFIERS.MoralActivityService);
    
    const result = await moralService.delete(id as string);
    
    if (!result.success) {
      if (result.code === 'NOT_FOUND') {
        return notFound('活动不存在');
      }
      return fail(result.error || '删除活动失败');
    }
    
    return ok({ id: id as string, message: '删除成功' });
  } catch (error) {
    console.error('删除德育活动失败:', error);
    return serverError('服务器错误');
  }
});
