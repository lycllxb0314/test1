/**
 * 生字专项 API
 * POST /api/chinese-prep/character
 */

import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import type {
  CharacterInfo,
  SimilarCharGroup,
  PolyphonicChar,
  DictationItem,
  CharacterRequest,
  OntologyDerivation,
  ExerciseSet,
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

    // 构建 prompt - 简化版本
    const prompt = buildSimplePrompt(characters, grade, generateOptions);

    const response = await client.invoke(
      [{ role: 'user', content: prompt }],
      { temperature: 0.3 }
    );

    // 解析响应
    const result = parseResponse(response.content, characters);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Character API Error]:', error);
    return NextResponse.json(
      { 
        characters: [], 
        similarGroups: [], 
        polyphonicChars: [], 
        dictationList: [],
        ontology: [],
      },
      { status: 500 }
    );
  }
}

/** 构建简化prompt */
function buildSimplePrompt(
  characters: string[],
  grade: number,
  options: CharacterRequest['generateOptions']
): string {
  const charList = characters.join('、');
  
  return `分析生字：${charList}，适用${grade}年级。

请严格按照以下JSON格式输出，不要有任何多余文字：

{
  "characters": [
    {
      "char": "舟",
      "pinyin": "zhōu",
      "radical": "舟",
      "structure": "独体字",
      "strokeCount": 6,
      "strokeOrder": ["撇", "撇钩", "横", "点", "横", "点"],
      "strokeGuide": [
        {"name": "撇", "position": "左上起笔向左下", "tip": "起笔重收笔轻"},
        {"name": "撇钩", "position": "横中线上方", "tip": "末端出钩"},
        {"name": "横", "position": "横中线偏上", "tip": "平稳"},
        {"name": "点", "position": "竖中线左侧", "tip": "轻点"},
        {"name": "横", "position": "横中线偏下", "tip": "稍长"},
        {"name": "点", "position": "竖中线右侧", "tip": "对称"}
      ],
      "words": ["小舟", "轻舟"]
    }
  ],
  "ontology": [
    {
      "char": "舟",
      "recognition": {
        "formAnalysis": "象形字，像小船形状",
        "phoneticClue": "独体字",
        "writingGuide": "上宽下窄，两点对称"
      },
      "understanding": {
        "meaning": "船",
        "meaningEvolution": "本义为船",
        "semanticField": ["船", "舰"],
        "collocation": ["小舟", "轻舟"]
      },
      "application": {
        "basicWords": ["小舟"],
        "advancedWords": ["轻舟"],
        "sentences": [{"sentence": "小舟在湖面上飘荡。", "type": "simple", "analysis": "简单句"}]
      },
      "extension": {
        "relatedCharacters": ["船"],
        "culturalContext": "古代交通工具",
        "readingSuggestion": "轻舟已过万重山"
      }
    }
  ],
  "similarGroups": [],
  "polyphonicChars": [],
  "dictationList": [{"char": "舟", "pinyin": "zhōu", "words": ["小舟"], "difficulty": "easy"}]
}

要求：
1. 只输出JSON，不要有解释
2. 必须包含所有输入生字
3. strokeGuide要有书写指导
4. 本体论ontology必须完整`;
}

/** 解析响应 - 简化版 */
function parseResponse(
  content: string,
  inputChars: string[]
): {
  characters: CharacterInfo[];
  similarGroups: SimilarCharGroup[];
  polyphonicChars: PolyphonicChar[];
  dictationList: DictationItem[];
  ontology: OntologyDerivation[];
} {
  let jsonStr = content;
  
  // 提取JSON
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }
  
  // 找到JSON对象
  const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    jsonStr = objectMatch[0];
  }

  // 尝试解析
  try {
    const data = JSON.parse(jsonStr);
    
    return {
      characters: data.characters || [],
      similarGroups: data.similarGroups || [],
      polyphonicChars: data.polyphonicChars || [],
      dictationList: data.dictationList || [],
      ontology: data.ontology || [],
    };
  } catch (e) {
    console.error('[JSON Parse Error]', e);
    
    // 如果解析失败，尝试逐个提取字符
    const extracted: CharacterInfo[] = [];
    
    for (const char of inputChars) {
      // 尝试找到该字符的信息
      const charPattern = new RegExp(`"char"\\s*:\\s*"${char}"[\\s\\S]{0,500}?\\}`, 'g');
      const matches = jsonStr.match(charPattern);
      
      if (matches) {
        for (const match of matches) {
          try {
            const obj = JSON.parse('{' + match + '}');
            if (obj.char && obj.pinyin) {
              extracted.push({
                char: obj.char,
                pinyin: obj.pinyin,
                radical: obj.radical || '',
                structure: obj.structure || '独体字',
                strokeCount: obj.strokeCount || 0,
                strokeOrder: obj.strokeOrder || [],
                strokePaths: obj.strokePaths || [],
                strokeGuide: obj.strokeGuide || [],
                words: obj.words || []
              });
              break;
            }
          } catch (err) {
            continue;
          }
        }
      }
    }
    
    return {
      characters: extracted,
      similarGroups: [],
      polyphonicChars: [],
      dictationList: [],
      ontology: [],
    };
  }
}
