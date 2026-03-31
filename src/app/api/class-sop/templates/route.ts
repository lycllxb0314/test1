/**
 * SOP 模板 API
 * GET  - 获取模板列表
 * POST - 创建模板
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 * - 使用 protectedRoute 进行认证保护
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';
import { classSopService } from '@/services/class-sop.service';
import { SOPCategory } from '@/types/class-sop';
import { success, error, ErrorCode } from '@/lib/api';

/**
 * GET - 获取 SOP 模板列表
 */
export const GET = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') as SOPCategory | null;
    const isActive = searchParams.get('isActive');
    const isSystem = searchParams.get('isSystem');
    const search = searchParams.get('search');
    
    const templates = await classSopService.template.getTemplates({
      category: category || undefined,
      isActive: isActive ? isActive === 'true' : undefined,
      isSystem: isSystem ? isSystem === 'true' : undefined,
      search: search || undefined,
    });
    
    return NextResponse.json(success(templates));
  } catch (err) {
    console.error('获取 SOP 模板列表失败:', err);
    return NextResponse.json(
      error('获取 SOP 模板列表失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }
});

/**
 * POST - 创建 SOP 模板
 */
export const POST = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const body = await request.json();
    
    // 验证必填字段
    if (!body.name || !body.category || !body.description) {
      return NextResponse.json(
        error('缺少必填字段', ErrorCode.VALIDATION_ERROR),
        { status: 400 }
      );
    }
    
    if (!body.steps || body.steps.length === 0) {
      return NextResponse.json(
        error('至少需要一个步骤', ErrorCode.VALIDATION_ERROR),
        { status: 400 }
      );
    }
    
    const template = await classSopService.template.createTemplate({
      name: body.name,
      category: body.category,
      description: body.description,
      steps: body.steps,
      applicableRoles: body.applicableRoles,
      evidenceRequired: body.evidenceRequired,
      timeoutMinutes: body.timeoutMinutes,
    }, {
      creatorId: user.id,
    });
    
    return NextResponse.json(success(template));
  } catch (err) {
    console.error('创建 SOP 模板失败:', err);
    return NextResponse.json(
      error('创建 SOP 模板失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }
});
