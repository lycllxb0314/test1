/**
 * SOP 模板详情 API
 * GET    - 获取模板详情
 * PUT    - 更新模板
 * DELETE - 删除模板
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 * - 使用 protectedRoute 进行认证保护
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';
import { classSopService } from '@/services/class-sop.service';
import { success, error, ErrorCode } from '@/lib/api';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET - 获取模板详情
 */
export const GET = protectedRoute(async (
  request: NextRequest,
  context: ExtendedRouteContext
) => {
  try {
    const { id } = await (context as ExtendedRouteContext & RouteParams).params;
    const template = await classSopService.template.getTemplate(id);
    
    if (!template) {
      return NextResponse.json(
        error('SOP 模板不存在', ErrorCode.NOT_FOUND),
        { status: 404 }
      );
    }
    
    return NextResponse.json(success(template));
  } catch (err) {
    console.error('获取 SOP 模板详情失败:', err);
    return NextResponse.json(
      error('获取 SOP 模板详情失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }
});

/**
 * PUT - 更新模板
 */
export const PUT = protectedRoute(async (
  request: NextRequest,
  context: ExtendedRouteContext
) => {
  try {
    const { id } = await (context as ExtendedRouteContext & RouteParams).params;
    const body = await request.json();
    
    const template = await classSopService.template.updateTemplate(id, {
      name: body.name,
      category: body.category,
      description: body.description,
      steps: body.steps,
      applicableRoles: body.applicableRoles,
      evidenceRequired: body.evidenceRequired,
      timeoutMinutes: body.timeoutMinutes,
      isActive: body.isActive,
    });
    
    return NextResponse.json(success(template));
  } catch (err) {
    console.error('更新 SOP 模板失败:', err);
    return NextResponse.json(
      error('更新 SOP 模板失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }
});

/**
 * DELETE - 删除模板
 */
export const DELETE = protectedRoute(async (
  request: NextRequest,
  context: ExtendedRouteContext
) => {
  try {
    const { id } = await (context as ExtendedRouteContext & RouteParams).params;
    await classSopService.template.deleteTemplate(id);
    
    return NextResponse.json(success({ deleted: true }));
  } catch (err) {
    console.error('删除 SOP 模板失败:', err);
    return NextResponse.json(
      error('删除 SOP 模板失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }
});
