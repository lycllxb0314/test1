/**
 * ASR 实时转写 API
 * 
 * 短生命周期函数：接收音频数据，返回转写文本
 * 使用 coze-coding-dev-sdk ASRClient
 */

import { NextRequest, NextResponse } from 'next/server';
import { ASRClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { ok, fail } from '@/lib/api';

export const runtime = 'nodejs';
export const maxDuration = 10; // 最大执行时间 10 秒

/**
 * POST /api/psychology/asr
 * 
 * 请求体：
 * - audioData: string (base64 编码的音频数据)
 * - format?: 'wav' | 'mp3' | 'ogg_opus' | 'm4a'
 * 
 * 返回：
 * - text: string (识别文本)
 * - duration?: number (音频时长毫秒)
 * - success: boolean
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { audioData, format = 'wav' } = body;

    if (!audioData) {
      return NextResponse.json(
        { success: false, error: '缺少音频数据' },
        { status: 400 }
      );
    }

    // 提取请求头用于追踪
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);

    // 初始化 ASR 客户端
    const config = new Config();
    const asrClient = new ASRClient(config, customHeaders);

    // 调用 ASR 服务
    const result = await asrClient.recognize({
      uid: `psychology_${Date.now()}`,
      base64Data: audioData,
    });

    return NextResponse.json({
      success: true,
      data: {
        text: result.text,
        duration: result.duration,
      },
    });
  } catch (error) {
    console.error('[ASR API] Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : '语音识别失败';
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
