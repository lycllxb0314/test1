/**
 * 数学备课方案生成 API
 * 
 * 基于四维分析生成本质-过程-思想-结构+教学路径
 * 自动保存到资源库和共享数据集
 * 
 * @module app/api/math-prep/generate
 */

import { NextRequest, NextResponse } from 'next/server';
import { mathPrepService } from '@/services/math-prep.service';
import { teachingResourceRepository } from '@/repositories/teaching-resource.repository';
import { createSharedResourceService } from '@/services/shared-resource.service';
import type { MathPrepRequest } from '@/types/math-prep';

/**
 * POST /api/math-prep/generate
 * 生成数学备课方案
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { contentId, grade, semester, domain, unitName, contentName, contentKey, teacherId, teacherName } = body;

    if (!grade || !semester || !domain || !contentName) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    const prepRequest: MathPrepRequest = {
      contentId: contentId || '',
      grade: parseInt(grade, 10),
      semester,
      domain,
      unitName: unitName || '',
      contentName,
      contentKey: contentKey || contentName,
    };

    // 生成备课方案
    const result = await mathPrepService.generateMathPrepPlan(prepRequest);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    const plan = result.data!;

    // 并行保存：个人资源库 + 共享数据集
    const [savedResource] = await Promise.all([
      // 保存到个人资源库
      teachingResourceRepository.create({
        teacherId: teacherId || 'system',
        category: 'math',
        title: contentName,
        grade: parseInt(grade, 10),
        unit: unitName || '',
        content: {
          contentInfo: plan.contentInfo,
          essence: plan.essence,
          process: plan.process,
          thought: plan.thought,
          structure: plan.structure,
          teachingPath: plan.teachingPath,
        },
        isShared: false,
      }),
      // 保存到共享数据集
      createSharedResourceService().createIfNotExists({
        category: 'math',
        grade: parseInt(grade, 10),
        topicKey: contentKey || contentName,
        title: contentName,
        unit: unitName,
        content: {
          contentInfo: plan.contentInfo,
          essence: plan.essence,
          process: plan.process,
          thought: plan.thought,
          structure: plan.structure,
          teachingPath: plan.teachingPath,
        },
        createdBy: teacherId,
        createdByName: teacherName,
      }),
    ]);

    return NextResponse.json({ 
      success: true, 
      data: plan,
      resourceId: savedResource.id,
    });
  } catch (error) {
    console.error('[API] math-prep/generate POST error:', error);
    return NextResponse.json(
      { success: false, error: '生成备课方案失败' },
      { status: 500 }
    );
  }
}
