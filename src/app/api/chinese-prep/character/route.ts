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
  OntologyDerivation,
  ExerciseSet,
  GradeSentenceRequirement,
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
    const result = parseCharacterResponse(response.content, characters, grade, generateOptions);

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
        exercises: null,
        sentenceRequirements: null,
      },
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
  // 根据年级确定造句要求
  const sentenceReqs = getSentenceRequirements(grade);
  
  let prompt = `请分析以下生字：${characters.join('、')}，适用${grade}年级。

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
      "strokeGuide": [
        {"name": "撇", "position": "左上起笔，向左下行笔", "tip": "起笔重，收笔轻"},
        {"name": "撇钩", "position": "横中线上方起笔", "tip": "注意与第一撇的区别"},
        {"name": "横", "position": "横中线偏上", "tip": "中间略细"},
        {"name": "点", "position": "竖中线左侧下方", "tip": "轻点即可"},
        {"name": "横", "position": "横中线偏下", "tip": "稍长"},
        {"name": "点", "position": "竖中线右侧下方", "tip": "与左点对称"}
      ],
      "words": ["小舟", "扁舟", "轻舟", "舟船"]
    }
  ]`;

  // 形近字辨析
  if (options.similarChars) {
    prompt += `,
  "similarGroups": [
    {
      "baseChar": "舟",
      "similarChars": [
        {"char": "丹", "pinyin": "dān", "difference": "丹比舟多一点", "example": "丹心"}
      ],
      "analysis": "舟像一只小船，丹多一点像药丸"
    }
  ]`;
  }

  // 多音字
  if (options.polyphonic) {
    prompt += `,
  "polyphonicChars": [
    {
      "char": "了",
      "readings": [
        {"pinyin": "le", "meaning": "表示完成", "example": "走了、完了"},
        {"pinyin": "liǎo", "meaning": "明白、结束", "example": "了解、了结"}
      ]
    }
  ]`;
  }

  // 听写清单
  if (options.dictation) {
    prompt += `,
  "dictationList": [
    {"char": "舟", "pinyin": "zhōu", "words": ["小舟", "轻舟"], "difficulty": "easy"}
  ]`;
  }

  // 本体论推导
  if (options.ontology) {
    prompt += `,
  "ontology": [
    {
      "char": "舟",
      "recognition": {
        "formAnalysis": "象形字，像一只小船的形状",
        "phoneticClue": "声旁为舟，表示读音",
        "writingGuide": "上宽下窄，两点对称"
      },
      "understanding": {
        "meaning": "船",
        "meaningEvolution": "本义为船，引申为载运、承载",
        "semanticField": ["船", "舰", "艇", "舶"],
        "collocation": ["小舟", "轻舟", "扁舟", "舟船"]
      },
      "application": {
        "basicWords": ["小舟", "轻舟"],
        "advancedWords": ["扁舟", "一叶扁舟", "同舟共济"],
        "sentences": [
          {"sentence": "小舟在湖面上轻轻飘荡。", "type": "simple", "analysis": "简单的主谓句，适合低年级"}
        ]
      },
      "extension": {
        "relatedCharacters": ["船", "舰"],
        "culturalContext": "舟是中国古代重要的交通工具，'刻舟求剑'等成语都与舟有关",
        "readingSuggestion": "推荐阅读《轻舟已过万重山》"
      }
    }
  ]`;
  }

  // 配套练习
  if (options.exercises) {
    prompt += `,
  "exercises": {
    "title": "生字练习",
    "grade": ${grade},
    "totalScore": 100,
    "timeSuggestion": "20分钟",
    "exercises": [
      {
        "id": "1",
        "type": "pinyin_write",
        "typeName": "看拼音写汉字",
        "instruction": "根据拼音写出正确的汉字",
        "content": "zhōu（  ）",
        "answer": "舟",
        "difficulty": "easy",
        "relatedChar": "舟"
      },
      {
        "id": "2",
        "type": "word_formation",
        "typeName": "组词",
        "instruction": "用下面的字组词",
        "content": "舟：____、____",
        "answer": ["小舟", "轻舟"],
        "difficulty": "easy",
        "relatedChar": "舟"
      },
      {
        "id": "3",
        "type": "fill_blank",
        "typeName": "填空",
        "instruction": "根据课文内容填空",
        "content": "一（  ）小舟",
        "answer": "叶",
        "difficulty": "medium",
        "explanation": "量词搭配：一叶扁舟",
        "relatedChar": "舟"
      }
    ],
    "answerKey": "1. 舟  2. 小舟、轻舟  3. 叶"
  }`;
  }

  // 造句要求和示例
  if (options.sentences) {
    prompt += `,
  "sentenceRequirements": {
    "grade": ${grade},
    "sentenceCount": ${sentenceReqs.sentenceCount},
    "sentenceType": "${sentenceReqs.sentenceType}",
    "requirements": ${JSON.stringify(sentenceReqs.requirements)}
  }`;
  }

  prompt += `
}

注意：
1. 只输出JSON，不要有任何解释
2. strokeGuide是书写指导，要具体说明每个笔画在田字格中的位置和书写技巧
3. 必须包含所有输入的生字信息
4. 形近字要找出字形相近易混淆的字
5. 多音字只列出输入生字中是多音字的（如果没有多音字则数组为空）
6. 听写清单按难度分级
7. 本体论推导要符合"认知→理解→应用→拓展"的教学规律
8. 造句要符合${grade}年级学生的认知水平：${sentenceReqs.sentenceType}
9. 练习题要多样化，包括看拼音写汉字、组词、填空、选择等类型`;

  return prompt;
}

/** 获取年级造句要求 */
function getSentenceRequirements(grade: number): GradeSentenceRequirement {
  if (grade <= 2) {
    return {
      grade,
      sentenceCount: 2,
      sentenceType: '简单句',
      requirements: [
        '使用主谓宾结构',
        '句子通顺完整',
        '字数10-15字左右',
        '使用学过的词语'
      ]
    };
  } else if (grade <= 4) {
    return {
      grade,
      sentenceCount: 3,
      sentenceType: '复杂句',
      requirements: [
        '使用修饰语丰富句子',
        '可使用关联词',
        '字数15-25字左右',
        '表达完整意思'
      ]
    };
  } else {
    return {
      grade,
      sentenceCount: 3,
      sentenceType: '修辞句/成语句',
      requirements: [
        '使用修辞手法（比喻、拟人等）',
        '可使用成语',
        '字数20-30字左右',
        '表达生动形象'
      ]
    };
  }
}

/** 解析响应 */
function parseCharacterResponse(
  content: string,
  inputChars: string[],
  grade: number,
  options: CharacterRequest['generateOptions']
): {
  characters: CharacterInfo[];
  similarGroups: SimilarCharGroup[];
  polyphonicChars: PolyphonicChar[];
  dictationList: DictationItem[];
  ontology?: OntologyDerivation[];
  exercises?: ExerciseSet;
  sentenceRequirements?: GradeSentenceRequirement;
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
      ontology: options.ontology ? (data.ontology || []) : undefined,
      exercises: options.exercises ? (data.exercises || undefined) : undefined,
      sentenceRequirements: options.sentences ? (data.sentenceRequirements || getSentenceRequirements(grade)) : undefined,
    };
  } catch (e) {
    console.error('[JSON Parse Error]:', e, '\nContent:', content.substring(0, 500));
    
    // 解析失败，返回空结果
    return {
      characters: [],
      similarGroups: [],
      polyphonicChars: [],
      dictationList: [],
      ontology: [],
      exercises: undefined,
      sentenceRequirements: getSentenceRequirements(grade),
    };
  }
}
