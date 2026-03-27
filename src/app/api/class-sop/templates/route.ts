/**
 * SOP 模板 API
 * GET  - 获取模板列表
 * POST - 创建模板
 */

import { NextRequest, NextResponse } from 'next/server';
import { classSopService } from '@/services/class-sop.service';
import { SOPCategory } from '@/types/class-sop';

export async function GET(request: NextRequest) {
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
    
    return NextResponse.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error('获取 SOP 模板列表失败:', error);
    return NextResponse.json(
      { success: false, error: '获取 SOP 模板列表失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 验证必填字段
    if (!body.name || !body.category || !body.description) {
      return NextResponse.json(
        { success: false, error: '缺少必填字段' },
        { status: 400 }
      );
    }
    
    if (!body.steps || body.steps.length === 0) {
      return NextResponse.json(
        { success: false, error: '至少需要一个步骤' },
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
    });
    
    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error('创建 SOP 模板失败:', error);
    return NextResponse.json(
      { success: false, error: '创建 SOP 模板失败' },
      { status: 500 }
    );
  }
}
