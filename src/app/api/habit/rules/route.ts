/**
 * 习惯规则配置 API
 * 
 * 架构：API Route → Service → Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { habitRuleService } from '@/services/habit.ext.service';
import { error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

/**
 * GET - 获取规则配置
 */
export const GET = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const { searchParams } = new URL(request.url);
    
    const result = await habitRuleService.getList({
      academicYear: searchParams.get('academicYear') || undefined,
      semester: searchParams.get('semester') || undefined,
    });
    
    if (!result.success) {
      return NextResponse.json(error(result.error || '获取规则配置失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }
    
    return NextResponse.json({ success: true, data: result.data });
  } catch (err) {
    console.error('习惯规则API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

/**
 * POST - 创建/更新规则配置
 */
export const POST = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const body = await request.json();
    
    const result = await habitRuleService.upsert({
      academicYear: body.academicYear,
      semester: body.semester,
      startDate: body.startDate,
      endDate: body.endDate,
      monthlyDeadline: body.monthlyDeadline,
      checkFrequency: body.checkFrequency,
      makeUpDays: body.makeUpDays,
      passThreshold: body.passThreshold,
      starQuotaPerClass: body.starQuotaPerClass,
    });
    
    if (!result.success) {
      const statusCode = result.code === 'VALIDATION_ERROR' ? 400 : 500;
      return NextResponse.json(error(result.error || '保存规则配置失败', result.code as ErrorCode), { status: statusCode });
    }
    
    return NextResponse.json({
      success: true,
      data: result.data,
      message: '规则配置保存成功',
    });
  } catch (err) {
    console.error('保存习惯规则API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
