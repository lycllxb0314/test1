/**
 * SOP 模板详情 API
 * GET    - 获取模板详情
 * PUT    - 更新模板
 * DELETE - 删除模板
 */

import { NextRequest, NextResponse } from 'next/server';
import { classSopService } from '@/services/class-sop.service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const template = await classSopService.template.getTemplate(id);
    
    if (!template) {
      return NextResponse.json(
        { success: false, error: 'SOP 模板不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error('获取 SOP 模板详情失败:', error);
    return NextResponse.json(
      { success: false, error: '获取 SOP 模板详情失败' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
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
    
    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error('更新 SOP 模板失败:', error);
    return NextResponse.json(
      { success: false, error: '更新 SOP 模板失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    await classSopService.template.deleteTemplate(id);
    
    return NextResponse.json({
      success: true,
      message: 'SOP 模板已删除',
    });
  } catch (error) {
    console.error('删除 SOP 模板失败:', error);
    return NextResponse.json(
      { success: false, error: '删除 SOP 模板失败' },
      { status: 500 }
    );
  }
}
