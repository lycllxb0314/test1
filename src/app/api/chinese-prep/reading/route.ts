/**
 * 朗读教学 API
 * 
 * POST /api/chinese-prep/reading
 * 
 * 基于王崧舟老师朗读教学思想设计
 * 核心理念：朗读主体 = 朗读意愿 × 朗读体验 × 朗读技巧
 */

import { NextRequest, NextResponse } from 'next/server';
import { HeaderUtils } from 'coze-coding-dev-sdk';
import { createReadingTeachingService } from '@/services/reading-teaching.service';
import type { ReadingRequest, ReadingToneType } from '@/types/chinese-prep';
import { success, error, ErrorCode } from '@/lib/api';

export async function POST(request: NextRequest) {
  try {
    const body: ReadingRequest = await request.json();
    const { text, title, grade, generateOptions } = body;

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        error('请提供课文内容', ErrorCode.BAD_REQUEST),
        { status: 400 }
      );
    }

    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        error('请提供课文标题', ErrorCode.BAD_REQUEST),
        { status: 400 }
      );
    }

    // 提取请求头
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    
    // 创建服务实例
    const readingService = createReadingTeachingService(customHeaders);
    
    // 判断文体（如果未提供）
    const genre = body.genre || readingService.detectGenre(text, title);
    
    // 生成朗读教学方案
    const result = await readingService.generateReadingPlan({
      text,
      title,
      grade: grade || 4,
      genre: genre as ReadingToneType,
      generateOptions: generateOptions || {
        willingness: true,
        experience: true,
        skills: true,
        emotionalModel: true,
        strategies: true,
        audios: true,
      },
    });

    if (!result.success) {
      return NextResponse.json(
        error(result.error || '生成失败', ErrorCode.INTERNAL_ERROR),
        { status: 500 }
      );
    }

    return NextResponse.json(success(result.data));
  } catch (err) {
    console.error('[Reading API Error]:', err);
    return NextResponse.json(
      error('朗读教学方案生成失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}

/**
 * 获取文体朗读特征
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const genre = searchParams.get('genre') as ReadingToneType | null;
    
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const readingService = createReadingTeachingService(customHeaders);
    
    if (genre) {
      const features = readingService.getGenreFeatures(genre);
      return NextResponse.json(success(features));
    }
    
    // 返回所有文体特征
    const allFeatures = {
      '古诗': readingService.getGenreFeatures('古诗'),
      '散文': readingService.getGenreFeatures('散文'),
      '童话': readingService.getGenreFeatures('童话'),
      '小说': readingService.getGenreFeatures('小说'),
      '说明文': readingService.getGenreFeatures('说明文'),
      '议论文': readingService.getGenreFeatures('议论文'),
    };
    
    return NextResponse.json(success(allFeatures));
  } catch (err) {
    console.error('[Reading API GET Error]:', err);
    return NextResponse.json(
      error('获取文体特征失败', ErrorCode.INTERNAL_ERROR),
      { status: 500 }
    );
  }
}
