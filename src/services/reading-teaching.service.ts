/**
 * 朗读教学 Service
 * 
 * 基于王崧舟老师朗读教学思想设计
 * 核心理念：朗读主体 = 朗读意愿 × 朗读体验 × 朗读技巧
 * 
 * @module services/reading-teaching.service
 */

import { BaseService, ServiceResult } from './base.service';
import { LLMClient, TTSClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import type {
  ReadingToneType,
  ReadingToneFeatures,
  ReadingWillingness,
  ReadingExperience,
  ReadingSkills,
  EmotionalReadingModel,
  DemonstrationStrategy,
  PreparationStrategy,
  GenreAwarenessStrategy,
  IntegrationStrategy,
  ReadingAnnotation,
  ReadingAudio,
  ReadingGuidance,
  ReadingTeachingPlan,
  ReadingRequest,
  ReadingResponse,
} from '@/types/chinese-prep';

/** TTS 发音人 */
const TTS_SPEAKER = 'zh_female_xueayi_saturn_bigtts';

/** 文体朗读特征配置 */
const GENRE_FEATURES: Record<ReadingToneType, ReadingToneFeatures> = {
  '古诗': {
    type: '古诗',
    rhythm: '韵律感强，节奏鲜明，讲究平仄',
    intonation: '抑扬顿挫，声情并茂',
    pause: '依句读停顿，押韵处适当延长',
    stress: '关键字词重读，突出意境',
    example: '春风/又绿/江南岸，明月/何时/照我还。',
  },
  '散文': {
    type: '散文',
    rhythm: '舒缓自然，行云流水',
    intonation: '情真意切，娓娓道来',
    pause: '依文意自然停顿，留白适度',
    stress: '情感关键词重读，点染意境',
    example: '我与父亲不相见已二年余了，我最不能忘记的是他的背影。',
  },
  '童话': {
    type: '童话',
    rhythm: '生动活泼，富有童趣',
    intonation: '夸张有变化，角色鲜明',
    pause: '情节转折处适当停顿',
    stress: '对话、动词重读，突出画面感',
    example: '"救命啊！救命啊！"小鸭子拼命地游着。',
  },
  '小说': {
    type: '小说',
    rhythm: '张弛有度，扣人心弦',
    intonation: '人物鲜明，情节跌宕',
    pause: '悬念处停顿，留有余味',
    stress: '人物语言、心理描写重读',
    example: '她猛地回过头，看到了那张熟悉的面孔。',
  },
  '说明文': {
    type: '说明文',
    rhythm: '清晰平稳，条理分明',
    intonation: '客观准确，不夸张',
    pause: '段落、层次间清晰停顿',
    stress: '数据、专业术语适当重读',
    example: '地球公转一周的时间约为365天。',
  },
  '议论文': {
    type: '议论文',
    rhythm: '铿锵有力，层层递进',
    intonation: '逻辑严密，气势磅礴',
    pause: '论点论据之间适当停顿',
    stress: '论点、关键词重读，增强说服力',
    example: '所以说，读书不仅要读进去，还要跳出来。',
  },
};

/**
 * 朗读教学服务
 */
export class ReadingTeachingService extends BaseService {
  private llmClient: LLMClient;
  private ttsClient: TTSClient;

  constructor(customHeaders?: Record<string, string>) {
    super();
    const config = new Config();
    this.llmClient = new LLMClient(config, customHeaders);
    this.ttsClient = new TTSClient(config, customHeaders);
  }

  /**
   * 判断文体类型
   */
  detectGenre(text: string, title: string): ReadingToneType {
    const combinedText = `${title}\n${text}`.toLowerCase();
    
    // 古诗特征
    if (/[\u4e00-\u9fa5]{5,7}[,，。]?[\u4e00-\u9fa5]{5,7}/.test(text) || 
        title.includes('诗') || title.includes('词') ||
        /唐诗|宋词|古诗|绝句|律诗/.test(combinedText)) {
      return '古诗';
    }
    
    // 童话特征
    if (/童话|寓言|故事/.test(title) ||
        /很久以前|从前|有一天/.test(combinedText) ||
        /["「"].*["」"]/.test(text)) {
      return '童话';
    }
    
    // 小说特征
    if (/小说|节选/.test(title) ||
        /他说|她说|心想|突然/.test(combinedText)) {
      return '小说';
    }
    
    // 说明文特征
    if (/说明|介绍|特点|方法|步骤/.test(title) ||
        /首先|其次|然后|最后|第一|第二/.test(combinedText) ||
        /\d+%|\d+年|\d+米|\d+千克/.test(text)) {
      return '说明文';
    }
    
    // 议论文特征
    if (/论|议|说/.test(title) ||
        /我认为|所以|因此|总之|综上所述/.test(combinedText)) {
      return '议论文';
    }
    
    // 默认散文
    return '散文';
  }

  /**
   * 获取文体朗读特征
   */
  getGenreFeatures(genre: ReadingToneType): ReadingToneFeatures {
    return GENRE_FEATURES[genre];
  }

  /**
   * 生成完整朗读教学方案
   */
  async generateReadingPlan(request: ReadingRequest): Promise<ServiceResult<ReadingTeachingPlan>> {
    const { text, title, grade, generateOptions } = request;
    
    // 判断文体
    const genre = request.genre || this.detectGenre(text, title);
    const genreFeatures = this.getGenreFeatures(genre);
    
    try {
      // 构建 prompt
      const prompt = this.buildReadingPrompt(text, title, grade, genre, generateOptions);
      
      // 调用 LLM
      const response = await this.llmClient.invoke(
        [{ role: 'user', content: prompt }],
        { model: 'doubao-seed-2-0-pro-260215', temperature: 0.6 }
      );
      
      // 解析响应
      const parsedResult = this.parseReadingResponse(response.content, text, title, genre);
      
      // 生成范读音频
      const audios: ReadingAudio[] = [];
      if (generateOptions.audios) {
        const audioResults = await this.generateAudios(text);
        audios.push(...audioResults);
      }
      
      const plan: ReadingTeachingPlan = {
        title,
        genre,
        ontology: parsedResult.ontology,
        subjectCultivation: parsedResult.subjectCultivation,
        emotionalModel: parsedResult.emotionalModel,
        strategies: {
          demonstration: parsedResult.demonstration,
          preparation: parsedResult.preparation,
          genreAwareness: {
            genre,
            features: genreFeatures,
            commonMistakes: parsedResult.commonMistakes,
            excellentExamples: parsedResult.excellentExamples,
          },
          integration: parsedResult.integration,
        },
        audios,
        annotation: parsedResult.annotation,
        guidance: parsedResult.guidance,
      };
      
      return this.ok(plan);
    } catch (error) {
      console.error('[ReadingTeachingService] generateReadingPlan error:', error);
      return this.fail('生成朗读教学方案失败', 'GENERATION_FAILED');
    }
  }

  /**
   * 构建朗读教学 prompt
   */
  private buildReadingPrompt(
    text: string,
    title: string,
    grade: number,
    genre: ReadingToneType,
    options: ReadingRequest['generateOptions']
  ): string {
    const sections: string[] = [];
    
    sections.push(`你是王崧舟老师风格的朗读教学专家，请为以下课文设计朗读教学方案。

【课文信息】
- 标题：${title}
- 年级：${grade}年级
- 文体：${genre}
- 内容：
${text}

【核心教学理念】
1. 朗读目的：为了人，而非为了读。通过声音让学生成为更好的"朗读者"，在倾诉与感受中塑造言语人格。
2. 朗读主体 = 朗读意愿 × 朗读体验 × 朗读技巧，三者缺一不可。
3. 情感朗读模型：感悟→想象→求气→创调→反听（五个闭环环节）。
4. 四大教学策略：示范、备课、文体意识、融合。

请按以下 JSON 格式输出完整的朗读教学方案：`);

    sections.push(`
{
  "ontology": {
    "whyTeach": "为什么教这篇课文朗读（结合文体特点和学生学情）",
    "teachingPurpose": "朗读教学的具体目的",
    "valueOrientation": "价值取向（如何通过朗读落实立德树人）"
  },
  
  "subjectCultivation": {
    "willingness": {
      "selfConnection": "文本与学生的连接点",
      "emotionalTrigger": "情感共鸣的触发点",
      "awakeningPhrases": ["唤醒表达欲望的话术1", "话术2"],
      "introductionScript": "完整的导入语设计"
    },
    "experience": {
      "listeningGuide": {
        "focusPoints": ["听什么要点1", "要点2"],
        "guidance": "怎么听的具体指导",
        "reflection": "听后思考的问题"
      },
      "imaginationRestore": {
        "scenes": [
          {
            "text": "原文片段",
            "scene": "画面描述",
            "sensoryDetails": ["视觉细节", "听觉细节"],
            "emotionalAtmosphere": "情感氛围"
          }
        ],
        "guidanceScript": "想象引导语"
      },
      "situationRestore": {
        "background": "情境背景",
        "characters": ["人物/角色1", "角色2"],
        "emotionalJourney": "情感走向"
      }
    },
    "skills": {
      "stress": {
        "points": [
          {
            "text": "重读的文字",
            "type": "logic或emotion或grammar",
            "reason": "重读原因",
            "method": "强调方法"
          }
        ],
        "teachingScript": "重音教学话术"
      },
      "rhythm": {
        "overall": "整体节奏",
        "variations": [
          {
            "segment": "片段",
            "rhythm": "节奏特点",
            "reason": "原因"
          }
        ],
        "teachingScript": "节奏教学话术"
      },
      "intonation": {
        "emotionalTones": [
          {
            "emotion": "情感类型",
            "tone": "语调特点",
            "example": "示例"
          }
        ],
        "teachingScript": "语调教学话术"
      },
      "pause": {
        "points": [
          {
            "position": "停顿位置",
            "type": "short或medium或long",
            "reason": "停顿原因",
            "effect": "停顿效果"
          }
        ],
        "teachingScript": "停顿教学话术"
      }
    }
  },
  
  "emotionalModel": {
    "comprehension": {
      "emotionalTone": "情感基调",
      "emotionalThread": "情感线索",
      "emotionalKeywords": ["情感关键词1", "关键词2"],
      "guidanceScript": "感悟引导语"
    },
    "imagination": {
      "coreScenes": ["核心画面1", "画面2"],
      "guidanceScript": "想象引导语"
    },
    "breathControl": {
      "breathType": "气息类型",
      "breathPoints": ["气息要点1", "要点2"],
      "practiceMethod": "练习方法",
      "guidanceScript": "求气指导语"
    },
    "toneCreation": {
      "speed": "语速建议",
      "intonation": "语调走向",
      "flow": "语流特征",
      "guidanceScript": "创调指导语"
    },
    "selfMonitoring": {
      "checkpoints": ["反听要点1", "要点2"],
      "selfEvalCriteria": ["自评标准1", "标准2"],
      "improvementTips": ["改进建议1", "建议2"],
      "guidanceScript": "反听指导语"
    }
  },
  
  "demonstration": {
    "keyPoints": ["范读要点1", "要点2"],
    "beforeScript": "范读前引导语",
    "afterScript": "范读后讨论语",
    "observationPoints": ["学生观察要点1", "要点2"]
  },
  
  "preparation": {
    "emotionalArc": "情感走向预设",
    "speedChanges": [
      {
        "position": "位置",
        "speed": "语速",
        "reason": "原因"
      }
    ],
    "stressMarks": [
      {
        "text": "文字",
        "type": "类型",
        "reason": "原因"
      }
    ],
    "pauseDesign": [
      {
        "position": "位置",
        "duration": "时长",
        "reason": "原因"
      }
    ],
    "noteTemplate": "朗读笔记模板"
  },
  
  "commonMistakes": ["该文体常见误读1", "误读2"],
  "excellentExamples": ["优秀范读特点1", "特点2"],
  
  "integration": {
    "firstReading": {
      "purpose": "初读目的",
      "method": "初读方法",
      "guidanceScript": "初读引导语"
    },
    "intensiveReading": {
      "purpose": "精读目的",
      "method": "精读方法",
      "guidanceScript": "精读引导语"
    },
    "appreciativeReading": {
      "purpose": "品读目的",
      "method": "品读方法",
      "guidanceScript": "品读引导语"
    },
    "fluentReading": {
      "purpose": "熟读目的",
      "method": "熟读方法",
      "guidanceScript": "熟读引导语"
    }
  },
  
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
    "overallGuide": "整体朗读基调说明",
    "segmentGuides": [
      {
        "segment": "第一段",
        "guidance": "朗读建议",
        "keyPoints": ["要点1", "要点2"]
      }
    ],
    "chorusGuide": {
      "preparation": "齐读准备话术",
      "startSignal": "起始信号",
      "duringReading": ["过程中提示1", "提示2"],
      "ending": "结束话术"
    },
    "commonIssues": [
      {
        "issue": "问题",
        "cause": "原因",
        "solution": "解决方案",
        "exampleCorrection": "示范纠正话术"
      }
    ]
  }
}

只输出 JSON，不要有其他内容。`);

    return sections.join('\n\n');
  }

  /**
   * 解析 LLM 响应
   */
  private parseReadingResponse(
    content: string,
    originalText: string,
    title: string,
    genre: ReadingToneType
  ): {
    ontology: ReadingTeachingPlan['ontology'];
    subjectCultivation: ReadingTeachingPlan['subjectCultivation'];
    emotionalModel: EmotionalReadingModel;
    demonstration: DemonstrationStrategy;
    preparation: PreparationStrategy;
    commonMistakes: string[];
    excellentExamples: string[];
    integration: IntegrationStrategy;
    annotation: ReadingAnnotation;
    guidance: ReadingGuidance;
  } {
    // 默认值
    const defaultOntology = {
      whyTeach: `培养学生的${genre}朗读能力，提升语感素养`,
      teachingPurpose: '让学生在朗读中感受文本情感，提升语言表达能力',
      valueOrientation: '通过朗读落实立德树人，培养学生的审美情趣和人文素养',
    };
    
    const defaultWillingness: ReadingWillingness = {
      selfConnection: '文本内容与学生的生活经验相联系',
      emotionalTrigger: '文中的情感点能引起学生共鸣',
      awakeningPhrases: ['让我们一起来感受这篇课文', '请同学们用心去读'],
      introductionScript: '同学们，今天我们来学习这篇课文，请大家用心感受...',
    };
    
    const defaultExperience: ReadingExperience = {
      listeningGuide: {
        focusPoints: ['注意语速', '感受情感'],
        guidance: '请同学们闭上眼睛，用心聆听',
        reflection: '你听到了什么？感受到了什么？',
      },
      imaginationRestore: {
        scenes: [],
        guidanceScript: '请同学们想象画面...',
      },
      situationRestore: {
        background: '',
        characters: [],
        emotionalJourney: '',
      },
    };
    
    const defaultSkills: ReadingSkills = {
      stress: { points: [], teachingScript: '' },
      rhythm: { overall: '', variations: [], teachingScript: '' },
      intonation: { emotionalTones: [], teachingScript: '' },
      pause: { points: [], teachingScript: '' },
    };
    
    const defaultEmotionalModel: EmotionalReadingModel = {
      comprehension: {
        emotionalTone: '',
        emotionalThread: '',
        emotionalKeywords: [],
        guidanceScript: '',
      },
      imagination: {
        coreScenes: [],
        guidanceScript: '',
      },
      breathControl: {
        breathType: '',
        breathPoints: [],
        practiceMethod: '',
        guidanceScript: '',
      },
      toneCreation: {
        speed: '',
        intonation: '',
        flow: '',
        guidanceScript: '',
      },
      selfMonitoring: {
        checkpoints: [],
        selfEvalCriteria: [],
        improvementTips: [],
        guidanceScript: '',
      },
    };
    
    const defaultDemonstration: DemonstrationStrategy = {
      keyPoints: [],
      beforeScript: '',
      afterScript: '',
      observationPoints: [],
    };
    
    const defaultPreparation: PreparationStrategy = {
      emotionalArc: '',
      speedChanges: [],
      stressMarks: [],
      pauseDesign: [],
      noteTemplate: '',
    };
    
    const defaultIntegration: IntegrationStrategy = {
      firstReading: { purpose: '', method: '', guidanceScript: '' },
      intensiveReading: { purpose: '', method: '', guidanceScript: '' },
      appreciativeReading: { purpose: '', method: '', guidanceScript: '' },
      fluentReading: { purpose: '', method: '', guidanceScript: '' },
    };
    
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
        preparation: '同学们，请做好朗读准备...',
        startSignal: '预备——起！',
        duringReading: [],
        ending: '读得真好！',
      },
      commonIssues: [],
    };

    try {
      // 提取 JSON - 使用更健壮的方法
      let jsonStr = content;
      
      // 尝试找到代码块中的 JSON
      const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1].trim();
      } else {
        // 找到第一个 { 和最后一个 }
        const firstBrace = content.indexOf('{');
        const lastBrace = content.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          jsonStr = content.slice(firstBrace, lastBrace + 1);
        }
      }
      
      // 清理 JSON 字符串中的常见问题
      // 1. 移除末尾逗号（在 } 或 ] 之前的逗号）
      jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');
      // 2. 移除控制字符
      jsonStr = jsonStr.replace(/[\x00-\x1F\x7F]/g, '');
      // 3. 修复常见的引号问题 - 将中文引号转为英文引号（在JSON值中）
      // jsonStr = jsonStr.replace(/[""]/g, '"');
      
      let data: Record<string, unknown>;
      try {
        data = JSON.parse(jsonStr);
      } catch (parseError) {
        // 提取错误位置
        const errorMatch = String(parseError).match(/position (\d+)/);
        const errorPos = errorMatch ? parseInt(errorMatch[1]) : -1;
        console.error('[ReadingTeachingService] JSON parse error:', parseError);
        if (errorPos > 0 && errorPos < jsonStr.length) {
          const context = jsonStr.slice(Math.max(0, errorPos - 50), Math.min(jsonStr.length, errorPos + 50));
          console.error('[ReadingTeachingService] Error context:', context);
          console.error('[ReadingTeachingService] Character at error pos:', JSON.stringify(jsonStr[errorPos]));
        }
        // 返回默认值
        return {
          ontology: defaultOntology,
          subjectCultivation: {
            willingness: defaultWillingness,
            experience: defaultExperience,
            skills: defaultSkills,
          },
          emotionalModel: defaultEmotionalModel,
          demonstration: defaultDemonstration,
          preparation: defaultPreparation,
          commonMistakes: [],
          excellentExamples: [],
          integration: defaultIntegration,
          annotation: defaultAnnotation,
          guidance: defaultGuidance,
        };
      }

      return {
        ontology: {
          whyTeach: (data.ontology as Record<string, unknown>)?.whyTeach as string || defaultOntology.whyTeach,
          teachingPurpose: (data.ontology as Record<string, unknown>)?.teachingPurpose as string || defaultOntology.teachingPurpose,
          valueOrientation: (data.ontology as Record<string, unknown>)?.valueOrientation as string || defaultOntology.valueOrientation,
        },
        subjectCultivation: {
          willingness: (data.subjectCultivation as Record<string, unknown>)?.willingness as ReadingWillingness || defaultWillingness,
          experience: (data.subjectCultivation as Record<string, unknown>)?.experience as ReadingExperience || defaultExperience,
          skills: (data.subjectCultivation as Record<string, unknown>)?.skills as ReadingSkills || defaultSkills,
        },
        emotionalModel: data.emotionalModel as EmotionalReadingModel || defaultEmotionalModel,
        demonstration: data.demonstration as DemonstrationStrategy || defaultDemonstration,
        preparation: data.preparation as PreparationStrategy || defaultPreparation,
        commonMistakes: (data.commonMistakes as string[]) || [],
        excellentExamples: (data.excellentExamples as string[]) || [],
        integration: data.integration as IntegrationStrategy || defaultIntegration,
        annotation: data.annotation as ReadingAnnotation || defaultAnnotation,
        guidance: data.guidance as ReadingGuidance || defaultGuidance,
      };
    } catch (error) {
      console.error('[ReadingTeachingService] parseReadingResponse error:', error);
      return {
        ontology: defaultOntology,
        subjectCultivation: {
          willingness: defaultWillingness,
          experience: defaultExperience,
          skills: defaultSkills,
        },
        emotionalModel: defaultEmotionalModel,
        demonstration: defaultDemonstration,
        preparation: defaultPreparation,
        commonMistakes: [],
        excellentExamples: [],
        integration: defaultIntegration,
        annotation: defaultAnnotation,
        guidance: defaultGuidance,
      };
    }
  }

  /**
   * 生成范读音频
   */
  private async generateAudios(text: string): Promise<ReadingAudio[]> {
    const audios: ReadingAudio[] = [];
    const speeds: Array<{ speed: 'slow' | 'standard' | 'expressive'; rate: number }> = [
      { speed: 'slow', rate: -20 },
      { speed: 'standard', rate: 0 },
      { speed: 'expressive', rate: 10 },
    ];

    for (const { speed, rate } of speeds) {
      try {
        const response = await this.ttsClient.synthesize({
          uid: 'reading-teaching',
          text,
          speaker: TTS_SPEAKER,
          speechRate: rate,
        });

        audios.push({
          speed,
          audioUrl: response.audioUri,
          duration: response.audioSize,
          annotation: {
            text,
            pauses: [],
            stresses: [],
            emotionPoints: [],
          },
        });
      } catch (error) {
        console.error(`[ReadingTeachingService] TTS error for ${speed}:`, error);
      }
    }

    return audios;
  }
}

/** 朗读教学服务实例工厂 */
export function createReadingTeachingService(customHeaders?: Record<string, string>): ReadingTeachingService {
  return new ReadingTeachingService(customHeaders);
}
