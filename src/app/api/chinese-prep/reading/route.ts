/**
 * 朗读教学 API
 * 
 * POST /api/chinese-prep/reading
 * 
 * 生成范读音频、朗读标注、课堂指导话术
 */

import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, TTSClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import type {
  ReadingSpeed,
  ReadingAnnotation,
  ReadingAudio,
  ReadingGuidance,
  ReadingRequest,
} from '@/types/chinese-prep';

/** TTS 发音人 */
const SPEAKER = 'zh_female_xueayi_saturn_bigtts';

export async function POST(request: NextRequest) {
  try {
    const body: ReadingRequest = await request.json();
    const { text, title, grade, generateOptions } = body;

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: '请提供课文内容' },
        { status: 400 }
      );
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const llmClient = new LLMClient(config, customHeaders);
    const ttsClient = new TTSClient(config, customHeaders);

    // 1. 生成朗读指导方案
    const prompt = buildReadingPrompt(text, title, grade);
    const response = await llmClient.invoke(
      [{ role: 'user', content: prompt }],
      { temperature: 0.5 }
    );

    const { annotation, guidance } = parseReadingResponse(response.content, text);

    // 2. 生成范读音频
    const audios: ReadingAudio[] = [];

    if (generateOptions.slowReading) {
      const audio = await generateAudio(ttsClient, text, -20);
      if (audio) audios.push({ speed: 'slow', ...audio, annotation });
    }

    if (generateOptions.standardReading) {
      const audio = await generateAudio(ttsClient, text, 0);
      if (audio) audios.push({ speed: 'standard', ...audio, annotation });
    }

    if (generateOptions.expressiveReading) {
      const audio = await generateAudio(ttsClient, text, 10);
      if (audio) audios.push({ speed: 'expressive', ...audio, annotation });
    }

    return NextResponse.json({
      title,
      audios,
      fullAnnotation: annotation,
      guidance,
    });
  } catch (error) {
    console.error('[Reading API Error]:', error);
    return NextResponse.json(
      { title: '', audios: [], fullAnnotation: { text: '', pauses: [], stresses: [], emotionPoints: [] }, guidance: { overallGuide: '', segmentGuides: [], chorusGuide: { preparation: '', startSignal: '', duringReading: [], ending: '' }, commonIssues: [] } },
      { status: 500 }
    );
  }
}

/** 构建 prompt */
function buildReadingPrompt(text: string, title: string, grade: number): string {
  return `作为朗读教学专家，请为以下课文设计朗读教学方案。

课文标题：${title}
年级：${grade}年级
课文内容：
${text}

请严格按以下JSON格式输出：

{
  "annotation": {
    "text": "${title}",
    "pauses": [
      {"position": 5, "type": "short", "reason": "自然换气"}
    ],
    "stresses": [
      {"start": 0, "end": 2, "text": "关键词", "type": "logic", "reason": "强调重点"}
    ],
    "emotionPoints": [
      {"position": 10, "emotion": "深情", "intensity": "medium"}
    ]
  },
  "guidance": {
    "overallGuide": "整体朗读基调说明...",
    "segmentGuides": [
      {
        "segment": "第一段",
        "guidance": "具体朗读建议",
        "keyPoints": ["要点1", "要点2"]
      }
    ],
    "chorusGuide": {
      "preparation": "同学们，请做好朗读准备...",
      "startSignal": "预备——起！",
      "duringReading": ["注意节奏", "声音洪亮"],
      "ending": "读得真好！"
    },
    "commonIssues": [
      {
        "issue": "拖音",
        "cause": "习惯性拉长尾音",
        "solution": "示范正常语速",
        "exampleCorrection": "听老师怎么读..."
      }
    ]
  }
}

只输出JSON，不要有其他内容。`;
}

/** 解析响应 */
function parseReadingResponse(
  content: string,
  originalText: string
): { annotation: ReadingAnnotation; guidance: ReadingGuidance } {
  // 默认值
  const defaultAnnotation: ReadingAnnotation = {
    text: originalText,
    pauses: [],
    stresses: [],
    emotionPoints: [],
  };
  
  const defaultGuidance: ReadingGuidance = {
    overallGuide: '',
    segmentGuides: [],
    chorusGuide: {
      preparation: '',
      startSignal: '',
      duringReading: [],
      ending: '',
    },
    commonIssues: [],
  };

  try {
    // 提取 JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { annotation: defaultAnnotation, guidance: defaultGuidance };

    const data = JSON.parse(jsonMatch[0]);

    return {
      annotation: data.annotation || defaultAnnotation,
      guidance: data.guidance || defaultGuidance,
    };
  } catch (e) {
    console.error('[Reading Parse Error]:', e);
    return { annotation: defaultAnnotation, guidance: defaultGuidance };
  }
}

/** 生成音频 */
async function generateAudio(
  ttsClient: TTSClient,
  text: string,
  speechRate: number
): Promise<{ audioUrl: string; duration: number } | null> {
  try {
    const response = await ttsClient.synthesize({
      uid: 'reading',
      text,
      speaker: SPEAKER,
      speechRate,
    });

    return {
      audioUrl: response.audioUri,
      duration: response.audioSize,
    };
  } catch (error) {
    console.error('[TTS Error]:', error);
    return null;
  }
}
