/**
 * TTS 语音合成 API
 * 
 * 短生命周期函数：接收文本，返回音频 URL
 * 使用 coze-coding-dev-sdk TTSClient
 */

import { NextRequest, NextResponse } from 'next/server';
import { TTSClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

export const runtime = 'nodejs';
export const maxDuration = 15; // 最大执行时间 15 秒

/**
 * 适合儿童陪伴的女性语音
 */
const CHILD_FRIENDLY_VOICES = {
  // 默认：温柔女声
  default: 'zh_female_xueayi_saturn_bigtts',
  // 可爱女孩
  cute: 'saturn_zh_female_keainvsheng_tob',
  // 活泼公主
  playful: 'saturn_zh_female_tiaopigongzhu_tob',
  // 知性大姐姐
  intellectual: 'zh_female_vv_uranus_bigtts',
};

/**
 * POST /api/psychology/tts
 * 
 * 请求体：
 * - text: string (要合成的文本)
 * - speaker?: string (语音风格: default | cute | playful | intellectual)
 * - speed?: number (语速调整 -50 到 100)
 * 
 * 返回：
 * - audioUrl: string (音频 URL)
 * - audioData?: string (base64 编码的音频数据，可选)
 * - success: boolean
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, speaker = 'default', speed = 0, returnBase64 = false } = body;

    if (!text) {
      return NextResponse.json(
        { success: false, error: '缺少文本内容' },
        { status: 400 }
      );
    }

    // 限制文本长度
    const maxLength = 500;
    const truncatedText = text.length > maxLength 
      ? text.substring(0, maxLength) + '...' 
      : text;

    // 提取请求头用于追踪
    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);

    // 初始化 TTS 客户端
    const config = new Config();
    const ttsClient = new TTSClient(config, customHeaders);

    // 选择语音
    const voiceId = CHILD_FRIENDLY_VOICES[speaker as keyof typeof CHILD_FRIENDLY_VOICES] 
      || CHILD_FRIENDLY_VOICES.default;

    // 调用 TTS 服务
    const result = await ttsClient.synthesize({
      uid: `psychology_tts_${Date.now()}`,
      text: truncatedText,
      speaker: voiceId,
      audioFormat: 'mp3',
      sampleRate: 24000,
      speechRate: speed,
    });

    const response: {
      success: boolean;
      audioUrl: string;
      audioData?: string;
    } = {
      success: true,
      audioUrl: result.audioUri,
    };

    // 如果需要返回 base64 数据（用于前端直接播放）
    if (returnBase64) {
      try {
        const audioResponse = await fetch(result.audioUri);
        if (audioResponse.ok) {
          const arrayBuffer = await audioResponse.arrayBuffer();
          const base64Audio = Buffer.from(arrayBuffer).toString('base64');
          response.audioData = `data:audio/mp3;base64,${base64Audio}`;
        }
      } catch (error) {
        console.warn('[TTS API] Failed to fetch audio data:', error);
        // 不影响主流程，只是不返回 base64
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('[TTS API] Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : '语音合成失败';
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
