/**
 * 生字专项 API
 * POST /api/chinese-prep/character
 * 
 * 采用分段并行生成策略：每个生字单独调用LLM，并行执行，最后合并结果
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
  ExerciseItem,
} from '@/types/chinese-prep';

/** 单个生字的生成结果 */
interface SingleCharResult {
  character: CharacterInfo;
  ontology: OntologyDerivation;
  dictationList: DictationItem[];
  exercises: ExerciseItem[];
}

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

    // 并行生成每个生字的素材
    const results = await Promise.all(
      characters.map(char => generateSingleCharacter(client, char, grade))
    );

    // 合并结果
    const mergedResult = mergeResults(results, grade);

    return NextResponse.json(mergedResult);
  } catch (error) {
    console.error('[Character API Error]:', error);
    return NextResponse.json(
      { 
        characters: [], 
        similarGroups: [], 
        polyphonicChars: [], 
        dictationList: [],
        ontology: [],
        exercises: undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * 生成单个生字的完整素材
 */
async function generateSingleCharacter(
  client: LLMClient,
  char: string,
  grade: number
): Promise<SingleCharResult> {
  const prompt = buildSingleCharPrompt(char, grade);

  const response = await client.invoke(
    [{ role: 'user', content: prompt }],
    { temperature: 0.3 }
  );

  return parseSingleCharResponse(response.content, char);
}

/**
 * 构建单个生字的prompt
 */
function buildSingleCharPrompt(char: string, grade: number): string {
  return `分析生字"${char}"，适用${grade}年级。

请严格按照以下JSON格式输出，不要有任何多余文字：

{
  "character": {
    "char": "${char}",
    "pinyin": "字的拼音",
    "radical": "部首",
    "structure": "独体字/左右结构/上下结构等",
    "strokeCount": 笔画数,
    "strokeOrder": ["第1笔", "第2笔", ...],
    "strokeGuide": [
      {"name": "笔画名", "position": "起笔位置描述", "tip": "书写要领"}
    ],
    "words": ["组词1", "组词2"]
  },
  "ontology": {
    "char": "${char}",
    "recognition": {
      "formAnalysis": "字形分析",
      "phoneticClue": "读音线索",
      "writingGuide": "书写要点"
    },
    "understanding": {
      "meaning": "字义解释",
      "meaningEvolution": "字义演变",
      "semanticField": ["相关字1", "相关字2"],
      "collocation": ["搭配1", "搭配2"]
    },
    "application": {
      "basicWords": ["基础组词"],
      "advancedWords": ["拓展组词"],
      "sentences": [{"sentence": "造句示例", "type": "simple/compound/complex", "analysis": "句式分析"}]
    },
    "extension": {
      "relatedCharacters": ["相关字"],
      "culturalContext": "文化背景",
      "readingSuggestion": "阅读建议或诗句"
    }
  },
  "dictationList": [
    {"word": "组词1", "pinyin": "词语拼音", "mainChar": "${char}", "charPinyin": "字拼音", "difficulty": "easy/medium"},
    {"word": "组词2", "pinyin": "词语拼音", "mainChar": "${char}", "charPinyin": "字拼音", "difficulty": "easy/medium"}
  ],
  "exercises": [
    {
      "type": "pinyin_write",
      "typeName": "看拼音写汉字",
      "instruction": "根据拼音写出相应的汉字",
      "content": "字的拼音",
      "answer": "${char}",
      "difficulty": "easy",
      "relatedChar": "${char}"
    },
    {
      "type": "word_formation",
      "typeName": "组词",
      "instruction": "用下面的字组词",
      "content": "${char}",
      "answer": ["组词1", "组词2"],
      "difficulty": "easy",
      "relatedChar": "${char}"
    },
    {
      "type": "sentence_writing",
      "typeName": "写句子",
      "instruction": "用下面的词语写一个句子",
      "content": "组词1",
      "answer": "造句示例",
      "difficulty": "medium",
      "explanation": "句式说明",
      "relatedChar": "${char}"
    },
    {
      "type": "fill_blank",
      "typeName": "填空",
      "instruction": "在横线上填入合适的字",
      "content": "包含该字的句子或诗句，用___表示填空",
      "answer": "${char}",
      "difficulty": "medium",
      "explanation": "出处或提示",
      "relatedChar": "${char}"
    }
  ]
}

要求：
1. 只输出JSON，不要有任何解释
2. strokeGuide要详细，每个笔画都要有书写指导
3. 本体论ontology必须完整
4. exercises必须包含4道题：看拼音写汉字、组词、写句子（造句）、填空
5. dictationList生成2-3个组词用于听写`;
}

/**
 * 解析单个生字的响应
 */
function parseSingleCharResponse(content: string, char: string): SingleCharResult {
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

  try {
    const data = JSON.parse(jsonStr);
    
    // 默认值处理
    const character: CharacterInfo = {
      char: data.character?.char || char,
      pinyin: data.character?.pinyin || '',
      radical: data.character?.radical || '',
      structure: data.character?.structure || '独体字',
      strokeCount: data.character?.strokeCount || 0,
      strokeOrder: data.character?.strokeOrder || [],
      strokePaths: data.character?.strokePaths || [],
      strokeGuide: data.character?.strokeGuide || [],
      words: data.character?.words || [],
    };

    const ontology: OntologyDerivation = data.ontology || {
      char,
      recognition: { formAnalysis: '', phoneticClue: '', writingGuide: '' },
      understanding: { meaning: '', meaningEvolution: '', semanticField: [], collocation: [] },
      application: { basicWords: [], advancedWords: [], sentences: [] },
      extension: { relatedCharacters: [], culturalContext: '', readingSuggestion: '' },
    };

    const dictationList: DictationItem[] = data.dictationList || [];
    const exercises: ExerciseItem[] = data.exercises || [];

    return { character, ontology, dictationList, exercises };
  } catch (e) {
    console.error(`[JSON Parse Error for ${char}]`, e);
    
    // 返回默认值
    return {
      character: {
        char,
        pinyin: '',
        radical: '',
        structure: '独体字',
        strokeCount: 0,
        strokeOrder: [],
        strokePaths: [],
        strokeGuide: [],
        words: [],
      },
      ontology: {
        char,
        recognition: { formAnalysis: '', phoneticClue: '', writingGuide: '' },
        understanding: { meaning: '', meaningEvolution: '', semanticField: [], collocation: [] },
        application: { basicWords: [], advancedWords: [], sentences: [] },
        extension: { relatedCharacters: [], culturalContext: '', readingSuggestion: '' },
      },
      dictationList: [],
      exercises: [],
    };
  }
}

/**
 * 合并所有生字的结果
 */
function mergeResults(results: SingleCharResult[], grade: number): {
  characters: CharacterInfo[];
  similarGroups: SimilarCharGroup[];
  polyphonicChars: PolyphonicChar[];
  dictationList: DictationItem[];
  ontology: OntologyDerivation[];
  exercises?: ExerciseSet;
} {
  // 合并生字
  const characters = results.map(r => r.character);
  
  // 合并本体论
  const ontology = results.map(r => r.ontology);
  
  // 合并听写清单
  const dictationList = results.flatMap(r => r.dictationList);
  
  // 合并练习题，重新编号
  let exerciseId = 1;
  const allExercises: ExerciseItem[] = results.flatMap(r => 
    r.exercises.map(ex => ({
      ...ex,
      id: String(exerciseId++),
    }))
  );

  // 计算总分（每题10分）
  const totalScore = allExercises.length * 10;
  
  // 生成答案速查
  const answerKey = allExercises.map((ex, i) => {
    const answer = Array.isArray(ex.answer) ? ex.answer.join('、') : ex.answer;
    return `${i + 1}.${answer}`;
  }).join(' ');

  // 构建练习集
  const exercises: ExerciseSet | undefined = allExercises.length > 0 ? {
    title: `生字练习（${characters.length}个生字）`,
    grade,
    totalScore,
    timeSuggestion: `${Math.ceil(allExercises.length * 3 / 60)}分钟`,
    exercises: allExercises,
    answerKey,
  } : undefined;

  return {
    characters,
    similarGroups: [],  // 形近字需要额外处理
    polyphonicChars: [], // 多音字需要额外处理
    dictationList,
    ontology,
    exercises,
  };
}
