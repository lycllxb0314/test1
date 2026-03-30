/**
 * 数学备课方案生成 API
 * 
 * 基于四维分析生成本质-过程-思想-结构+教学路径
 * 
 * @module app/api/math-prep/generate
 */

import { NextRequest, NextResponse } from 'next/server';
import { mathPrepService } from '@/services/math-prep.service';
import type { MathPrepRequest } from '@/types/math-prep';

/**
 * POST /api/math-prep/generate
 * 生成数学备课方案
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { contentId, grade, semester, domain, unitName, contentName, contentKey } = body;

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

    const result = await mathPrepService.generateMathPrepPlan(prepRequest);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('[API] math-prep/generate POST error:', error);
    return NextResponse.json(
      { success: false, error: '生成备课方案失败' },
      { status: 500 }
    );
  }
}
