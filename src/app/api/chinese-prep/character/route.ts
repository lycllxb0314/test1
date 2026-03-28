/**
 * 生字专项 API
 * 
 * POST /api/chinese-prep/character
 * 
 * 生成生字教学素材：笔顺、田字格、形近字、多音字、听写清单
 */

import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import type {
  CharacterInfo,
  SimilarCharGroup,
  PolyphonicChar,
  DictationItem,
  CharacterRequest,
} from '@/types/chinese-prep';

export async function POST(request: NextRequest) {
  try {
    const body: CharacterRequest = await request.json();
    const { characters, grade, generateOptions } = body;

    if (!characters || characters.length === 0) {
      return NextResponse.json(
        { success: false, error: '请提供生字列表' },
        { status: 400 }
      );
    }

    const customHeaders = HeaderUtils.extractForwardHeaders(request.headers);
    const config = new Config();
    const client = new LLMClient(config, customHeaders);

    // 构建 prompt
    const prompt = buildCharacterPrompt(characters, grade, generateOptions);

    const response = await client.invoke(
      [{ role: 'user', content: prompt }],
      { temperature: 0.3 }
    );

    // 解析响应
    const result = parseCharacterResponse(response.content, characters);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Character API Error]:', error);
    return NextResponse.json(
      { characters: [], similarGroups: [], polyphonicChars: [], dictationList: [] },
      { status: 500 }
    );
  }
}

/** 构建 prompt */
function buildCharacterPrompt(
  characters: string[],
  grade: number,
  options: CharacterRequest['generateOptions']
): string {
  return `请分析以下生字：${characters.join('、')}，适用${grade}年级。

请严格按以下JSON格式输出，不要有任何多余内容：

{
  "characters": [
    {
      "char": "舟",
      "pinyin": "zhōu",
      "radical": "舟",
      "structure": "独体字",
      "strokeCount": 6,
      "strokeOrder": ["撇", "撇钩", "横", "点", "横", "点"],
      "words": ["小舟", "扁舟", "轻舟", "舟船"]
    }
  ],
  "similarGroups": [
    {
      "baseChar": "舟",
      "similarChars": [
        {"char": "丹", "pinyin": "dān", "difference": "丹比舟多一点", "example": "丹心"}
      ],
      "analysis": "舟像一只小船，丹多一点像药丸"
    }
  ],
  "polyphonicChars": [
    {
      "char": "了",
      "readings": [
        {"pinyin": "le", "meaning": "表示完成", "example": "走了、完了"},
        {"pinyin": "liǎo", "meaning": "明白、结束", "example": "了解、了结"}
      ]
    }
  ],
  "dictationList": [
    {"char": "舟", "pinyin": "zhōu", "words": ["小舟", "轻舟"], "difficulty": "easy"}
  ]
}

注意：
1. 只输出JSON，不要有任何解释
2. 必须包含所有输入的生字信息
3. 形近字要找出字形相近易混淆的字
4. 多音字只列出输入生字中是多音字的（如果没有多音字则数组为空）
5. 听写清单按难度分级`;
}

/** 解析响应 */
function parseCharacterResponse(
  content: string,
  inputChars: string[]
): {
  characters: CharacterInfo[];
  similarGroups: SimilarCharGroup[];
  polyphonicChars: PolyphonicChar[];
  dictationList: DictationItem[];
} {
  // 尝试提取 JSON
  let jsonStr = content;
  
  // 如果包含 markdown 代码块，提取其中的 JSON
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }
  
  // 尝试找到 JSON 对象
  const jsonObjectMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (jsonObjectMatch) {
    jsonStr = jsonObjectMatch[0];
  }

  try {
    const data = JSON.parse(jsonStr);
    
    return {
      characters: data.characters || [],
      similarGroups: data.similarGroups || [],
      polyphonicChars: data.polyphonicChars || [],
      dictationList: data.dictationList || [],
    };
  } catch (e) {
    console.error('[JSON Parse Error]:', e, '\nContent:', content.substring(0, 500));
    
    // 解析失败，返回空结果
    return {
      characters: [],
      similarGroups: [],
      polyphonicChars: [],
      dictationList: [],
    };
  }
}
