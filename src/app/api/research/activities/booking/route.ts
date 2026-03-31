/**
 * 教研活动预约 API
 * 
 * POST: 创建预约
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 * - 使用统一认证中间件
 */

import { NextRequest } from 'next/server';
import { getService, SERVICE_IDENTIFIERS } from '@/lib/di';
import { withAuth } from '@/lib/auth/middleware';
import { ok, fail, serverError } from '@/lib/api';
import type { ResearchActivityService } from '@/services/research.service';

/**
 * POST: 创建预约
 */
export const POST = withAuth(async (request: NextRequest) => {
  try {
    const researchService = getService<ResearchActivityService>(SERVICE_IDENTIFIERS.ResearchActivityService);
    const body = await request.json();
    
    if (!body.roomId || !body.date || !body.timeSlot) {
      return fail('请填写完整的预约信息');
    }
    
    // 创建预约（通过Service层处理）
    const result = await researchService.create({
      title: `教研活动预约 - ${body.date}`,
      type: 'lesson_research',
      status: 'planned',
      // 附加预约信息
      ...body,
    });
    
    if (!result.success) {
      return fail(result.error || '预约失败');
    }
    
    return ok({
      success: true,
      booking: result.data,
      message: '预约成功',
    });
  } catch (error) {
    console.error('创建预约失败:', error);
    return serverError('服务器错误');
  }
});
