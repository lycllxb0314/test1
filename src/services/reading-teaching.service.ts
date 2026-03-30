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
        { model: 'deepseek-v3-2-251201', temperature: 0.6 }
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
    return `你是王崧舟老师风格的朗读教学专家。请为以下课文设计朗读教学方案。

【课文信息】
标题：${title}
年级：${grade}年级
文体：${genre}

【课文原文】
${text}

【核心要求】
1. 所有分析必须引用原文的具体句子或词语，禁止泛泛而谈
2. 每个教学话术都要可直接用于课堂，具有可操作性
3. 朗读技巧标注要精确到具体字词位置
4. 结合${grade}年级学生的认知水平设计

【输出格式】
请严格按照以下JSON格式输出（只输出JSON，不要其他内容）：

{
  "ontology": {
    "whyTeach": "必须引用原文1-2句，说明为什么这篇课文值得朗读教学",
    "teachingPurpose": "具体的、可测量的朗读教学目标（不要超过3条）",
    "valueOrientation": "通过朗读这篇课文，学生在情感态度价值观方面的具体收获"
  },
  
  "willingness": {
    "connectionPoint": "原文中哪句话或哪个场景最能引起学生的共鸣？引用原文说明",
    "emotionalHook": "设计一个3-5句的导入语，直接引用原文，激发学生朗读欲望",
    "motivationQuestions": ["问题1：引用原文的具体内容提问", "问题2：针对学生生活经验提问"]
  },
  
  "experience": {
    "listeningFocus": [
      {"原文片段": "引用原文", "听什么": "具体要学生注意听的内容"},
      {"原文片段": "引用原文", "听什么": "具体要学生注意听的内容"}
    ],
    "imaginationGuide": {
      "原文片段": "引用需要想象的原文",
      "画面描述": "引导学生想象的具体画面",
      "感官细节": ["视觉：...", "听觉：..."],
      "引导话术": "完整的想象引导语（2-3句话）"
    },
    "emotionExperience": {
      "情感基调": "用一个词概括全文情感",
      "情感变化": [
        {"原文": "引用原文", "情感": "情感类型", "变化原因": "为什么变化"}
      ]
    }
  },
  
  "skills": {
    "stress": [
      {"原文": "引用要重读的字词", "重读类型": "逻辑重音/情感重音/语法重音", "重读原因": "结合上下文说明", "教学话术": "教学生如何重读这句话"}
    ],
    "pause": [
      {"位置": "引用原文并在停顿处用|标记", "停顿时长": "短停顿(1秒)/中停顿(2秒)/长停顿(3秒)", "停顿原因": "为什么这里要停顿"}
    ],
    "intonation": [
      {"原文": "引用原文", "语调": "升调/降调/平调/曲折调", "情感": "表达什么情感", "教学话术": "如何指导学生读出这个语调"}
    ],
    "speed": [
      {"原文范围": "引用原文范围", "语速": "快/中/慢", "原因": "结合内容说明语速变化原因"}
    ]
  },
  
  "emotionalModel": {
    "comprehension": {
      "情感基调": "全文情感基调",
      "关键情感词": ["从原文中提取3-5个情感关键词"],
      "感悟引导": "设计引导学生感悟情感的话术（引用原文）"
    },
    "imagination": {
      "核心画面": ["画面1：引用原文并描述", "画面2：引用原文并描述"],
      "想象引导": "完整的想象引导话术"
    },
    "breathControl": {
      "气息类型": "深气息/浅气息/连续气息",
      "换气点": [
        {"原文位置": "引用原文", "换气方式": "偷气/抢气/深吸气", "原因": "为什么这样换气"}
      ]
    },
    "toneCreation": {
      "整体语速": "快/中/慢",
      "整体语调": "特点描述",
      "声音色彩": "明亮/柔和/深沉等"
    }
  },
  
  "strategies": {
    "genreFeatures": {
      "文体": "该课文的文体类型",
      "朗读特点": "该文体朗读的具体特点",
      "注意事项": ["注意点1", "注意点2"]
    },
    "teachingSteps": [
      {"环节": "初读", "目标": "具体目标", "方法": "具体方法", "话术": "教学话术"},
      {"环节": "精读", "目标": "具体目标", "方法": "具体方法", "话术": "教学话术"},
      {"环节": "品读", "目标": "具体目标", "方法": "具体方法", "话术": "教学话术"},
      {"环节": "熟读", "目标": "具体目标", "方法": "具体方法", "话术": "教学话术"}
    ]
  },
  
  "guidance": {
    "chorusGuide": {
      "准备话术": "齐读前的准备指导",
      "开始信号": "开始齐读的口令",
      "结束话术": "齐读结束后的点评"
    },
    "commonMistakes": [
      {"误读表现": "学生可能怎么读错", "原因": "为什么会读错", "纠正方法": "如何纠正", "示范话术": "教师示范的话术"}
    ]
  }
}

【重要提示】
1. 禁止输出空话、套话，每个字段都要有具体内容
2. "原文"、"引用原文"字段必须来自课文原文，不能编造
3. 教学话术要口语化、可直接用于课堂
4. 技巧标注要覆盖课文的主要段落，不能只标注开头

只输出JSON，不要有任何其他文字。`;
  }

  /**
   * 解析 LLM 响应 - 适配新格式
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
    // 默认值定义
    const defaults = {
      ontology: {
        whyTeach: `培养学生的${genre}朗读能力，提升语感素养`,
        teachingPurpose: '让学生在朗读中感受文本情感，提升语言表达能力',
        valueOrientation: '通过朗读落实立德树人，培养学生的审美情趣和人文素养',
      },
      willingness: {
        selfConnection: '',
        emotionalTrigger: '',
        awakeningPhrases: [] as string[],
        introductionScript: '',
      },
      experience: {
        listeningGuide: {
          focusPoints: [] as string[],
          guidance: '',
          reflection: '',
        },
        imaginationRestore: {
          scenes: [] as Array<{ text: string; scene: string; sensoryDetails: string[]; emotionalAtmosphere: string }>,
          guidanceScript: '',
        },
        situationRestore: {
          background: '',
          characters: [] as string[],
          emotionalJourney: '',
        },
      },
      skills: {
        stress: { points: [] as Array<{ text: string; type: 'logic' | 'emotion' | 'grammar'; reason: string; method: string }>, teachingScript: '' },
        rhythm: { overall: '', variations: [] as Array<{ segment: string; rhythm: string; reason: string }>, teachingScript: '' },
        intonation: { emotionalTones: [] as Array<{ emotion: string; tone: string; example: string }>, teachingScript: '' },
        pause: { points: [] as Array<{ position: string; type: 'short' | 'medium' | 'long'; reason: string; effect: string }>, teachingScript: '' },
      },
      emotionalModel: {
        comprehension: {
          emotionalTone: '',
          emotionalThread: '',
          emotionalKeywords: [] as string[],
          guidanceScript: '',
        },
        imagination: {
          coreScenes: [] as string[],
          guidanceScript: '',
        },
        breathControl: {
          breathType: '',
          breathPoints: [] as string[],
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
          checkpoints: [] as string[],
          selfEvalCriteria: [] as string[],
          improvementTips: [] as string[],
          guidanceScript: '',
        },
      },
      demonstration: {
        keyPoints: [] as string[],
        beforeScript: '',
        afterScript: '',
        observationPoints: [] as string[],
      },
      preparation: {
        emotionalArc: '',
        speedChanges: [] as Array<{ position: string; speed: string; reason: string }>,
        stressMarks: [] as Array<{ text: string; type: string; reason: string }>,
        pauseDesign: [] as Array<{ position: string; duration: string; reason: string }>,
        noteTemplate: '',
      },
      integration: {
        firstReading: { purpose: '', method: '', guidanceScript: '' },
        intensiveReading: { purpose: '', method: '', guidanceScript: '' },
        appreciativeReading: { purpose: '', method: '', guidanceScript: '' },
        fluentReading: { purpose: '', method: '', guidanceScript: '' },
      },
      annotation: {
        text: originalText,
        pauses: [] as Array<{ position: number; type: 'short' | 'medium' | 'long'; reason: string }>,
        stresses: [] as Array<{ start: number; end: number; text: string; type: 'logic' | 'emotion' | 'grammar'; reason: string }>,
        emotionPoints: [] as Array<{ position: number; emotion: string; intensity: 'light' | 'medium' | 'strong' }>,
      },
      guidance: {
        overallGuide: '',
        segmentGuides: [] as Array<{ segment: string; guidance: string; keyPoints: string[] }>,
        chorusGuide: {
          preparation: '同学们，请做好朗读准备...',
          startSignal: '预备——起！',
          duringReading: [] as string[],
          ending: '读得真好！',
        },
        commonIssues: [] as Array<{ issue: string; cause: string; solution: string; exampleCorrection: string }>,
      },
      commonMistakes: [] as string[],
      excellentExamples: [] as string[],
    };

    try {
      // 提取 JSON
      let jsonStr = content;
      const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1].trim();
      } else {
        const firstBrace = content.indexOf('{');
        const lastBrace = content.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          jsonStr = content.slice(firstBrace, lastBrace + 1);
        }
      }
      
      // 清理 JSON
      jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1').replace(/[\x00-\x1F\x7F]/g, '');
      
      let data: Record<string, unknown>;
      try {
        data = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error('[ReadingTeachingService] JSON parse error:', parseError);
        return this.buildDefaultResult(defaults, genre);
      }

      // 解析新格式并映射到原有类型
      const parsed = this.mapNewFormatToOld(data, defaults, originalText, genre);
      return parsed;
    } catch (error) {
      console.error('[ReadingTeachingService] parseReadingResponse error:', error);
      return this.buildDefaultResult(defaults, genre);
    }
  }

  /**
   * 将新格式映射到原有类型
   */
  private mapNewFormatToOld(
    data: Record<string, unknown>,
    defaults: ReturnType<typeof this.createDefaults>,
    originalText: string,
    genre: ReadingToneType
  ): ReturnType<typeof this.parseReadingResponse> {
    const d = this.createDefaults(genre);
    
    // 解析本体论
    const ontologyData = data.ontology as Record<string, unknown> | undefined;
    const ontology = {
      whyTeach: ontologyData?.whyTeach as string || d.ontology.whyTeach,
      teachingPurpose: ontologyData?.teachingPurpose as string || d.ontology.teachingPurpose,
      valueOrientation: ontologyData?.valueOrientation as string || d.ontology.valueOrientation,
    };

    // 解析朗读意愿
    const willingnessData = data.willingness as Record<string, unknown> | undefined;
    const willingness = {
      selfConnection: willingnessData?.connectionPoint as string || '',
      emotionalTrigger: willingnessData?.emotionalHook as string || '',
      awakeningPhrases: (willingnessData?.motivationQuestions as string[]) || [],
      introductionScript: willingnessData?.emotionalHook as string || '',
    };

    // 解析朗读体验
    const experienceData = data.experience as Record<string, unknown> | undefined;
    const listeningFocus = experienceData?.listeningFocus as Array<Record<string, string>> | undefined;
    const imaginationGuide = experienceData?.imaginationGuide as Record<string, unknown> | undefined;
    const emotionExperience = experienceData?.emotionExperience as Record<string, unknown> | undefined;
    
    const experience = {
      listeningGuide: {
        focusPoints: listeningFocus?.map(item => item['听什么'] || item['原文片段'] || '') || [],
        guidance: listeningFocus?.map(item => `听"${item['原文片段']}"时注意${item['听什么']}`).join('；') || '',
        reflection: '',
      },
      imaginationRestore: {
        scenes: imaginationGuide ? [{
          text: imaginationGuide['原文片段'] as string || '',
          scene: imaginationGuide['画面描述'] as string || '',
          sensoryDetails: (imaginationGuide['感官细节'] as string[]) || [],
          emotionalAtmosphere: '',
        }] : [],
        guidanceScript: imaginationGuide?.['引导话术'] as string || '',
      },
      situationRestore: {
        background: '',
        characters: [],
        emotionalJourney: (emotionExperience?.['情感变化'] as Array<Record<string, string>>)?.map(
          item => `${item['原文']}：${item['情感']}`
        ).join(' → ') || '',
      },
    };

    // 解析朗读技巧
    const skillsData = data.skills as Record<string, unknown> | undefined;
    const stressData = skillsData?.stress as Array<Record<string, string>> | undefined;
    const pauseData = skillsData?.pause as Array<Record<string, string>> | undefined;
    const intonationData = skillsData?.intonation as Array<Record<string, string>> | undefined;
    const speedData = skillsData?.speed as Array<Record<string, string>> | undefined;
    
    // 辅助函数：转换重音类型
    const convertStressType = (typeStr: string): 'logic' | 'emotion' | 'grammar' => {
      if (typeStr.includes('逻辑')) return 'logic';
      if (typeStr.includes('情感')) return 'emotion';
      if (typeStr.includes('语法')) return 'grammar';
      return 'logic';
    };
    
    // 辅助函数：转换停顿类型
    const convertPauseType = (typeStr: string): 'short' | 'medium' | 'long' => {
      if (typeStr.includes('短')) return 'short';
      if (typeStr.includes('长')) return 'long';
      return 'medium';
    };
    
    const skills = {
      stress: {
        points: stressData?.map(item => ({
          text: item['原文'] || '',
          type: convertStressType(item['重读类型'] || ''),
          reason: item['重读原因'] || '',
          method: item['教学话术'] || '',
        })) || [],
        teachingScript: stressData?.[0]?.['教学话术'] || '',
      },
      rhythm: {
        overall: speedData?.map(item => `${item['原文范围']}：${item['语速']}`).join('；') || '',
        variations: speedData?.map(item => ({
          segment: item['原文范围'] || '',
          rhythm: item['语速'] || '',
          reason: item['原因'] || '',
        })) || [],
        teachingScript: '',
      },
      intonation: {
        emotionalTones: intonationData?.map(item => ({
          emotion: item['情感'] || '',
          tone: item['语调'] || '',
          example: item['原文'] || '',
        })) || [],
        teachingScript: intonationData?.[0]?.['教学话术'] || '',
      },
      pause: {
        points: pauseData?.map(item => ({
          position: item['位置'] || '',
          type: convertPauseType(item['停顿时长'] || ''),
          reason: item['停顿原因'] || '',
          effect: '',
        })) || [],
        teachingScript: '',
      },
    };

    // 解析情感模型
    const emotionalData = data.emotionalModel as Record<string, unknown> | undefined;
    const comprehensionData = emotionalData?.comprehension as Record<string, unknown> | undefined;
    const imaginationData = emotionalData?.imagination as Record<string, unknown> | undefined;
    const breathData = emotionalData?.breathControl as Record<string, unknown> | undefined;
    const toneData = emotionalData?.toneCreation as Record<string, unknown> | undefined;
    
    const emotionalModel = {
      comprehension: {
        emotionalTone: comprehensionData?.['情感基调'] as string || '',
        emotionalThread: '',
        emotionalKeywords: (comprehensionData?.['关键情感词'] as string[]) || [],
        guidanceScript: comprehensionData?.['感悟引导'] as string || '',
      },
      imagination: {
        coreScenes: (imaginationData?.['核心画面'] as string[]) || [],
        guidanceScript: imaginationData?.['想象引导'] as string || '',
      },
      breathControl: {
        breathType: breathData?.['气息类型'] as string || '',
        breathPoints: (breathData?.['换气点'] as Array<Record<string, string>>)?.map(
          item => `${item['原文位置']}：${item['换气方式']}`
        ) || [],
        practiceMethod: '',
        guidanceScript: '',
      },
      toneCreation: {
        speed: toneData?.['整体语速'] as string || '',
        intonation: toneData?.['整体语调'] as string || '',
        flow: toneData?.['声音色彩'] as string || '',
        guidanceScript: '',
      },
      selfMonitoring: {
        checkpoints: [],
        selfEvalCriteria: [],
        improvementTips: [],
        guidanceScript: '',
      },
    };

    // 解析教学策略
    const strategiesData = data.strategies as Record<string, unknown> | undefined;
    const genreFeatures = strategiesData?.genreFeatures as Record<string, unknown> | undefined;
    const teachingSteps = strategiesData?.teachingSteps as Array<Record<string, string>> | undefined;
    
    const integration = {
      firstReading: teachingSteps?.find(s => s['环节'] === '初读') ? {
        purpose: teachingSteps.find(s => s['环节'] === '初读')?.['目标'] || '',
        method: teachingSteps.find(s => s['环节'] === '初读')?.['方法'] || '',
        guidanceScript: teachingSteps.find(s => s['环节'] === '初读')?.['话术'] || '',
      } : d.integration.firstReading,
      intensiveReading: teachingSteps?.find(s => s['环节'] === '精读') ? {
        purpose: teachingSteps.find(s => s['环节'] === '精读')?.['目标'] || '',
        method: teachingSteps.find(s => s['环节'] === '精读')?.['方法'] || '',
        guidanceScript: teachingSteps.find(s => s['环节'] === '精读')?.['话术'] || '',
      } : d.integration.intensiveReading,
      appreciativeReading: teachingSteps?.find(s => s['环节'] === '品读') ? {
        purpose: teachingSteps.find(s => s['环节'] === '品读')?.['目标'] || '',
        method: teachingSteps.find(s => s['环节'] === '品读')?.['方法'] || '',
        guidanceScript: teachingSteps.find(s => s['环节'] === '品读')?.['话术'] || '',
      } : d.integration.appreciativeReading,
      fluentReading: teachingSteps?.find(s => s['环节'] === '熟读') ? {
        purpose: teachingSteps.find(s => s['环节'] === '熟读')?.['目标'] || '',
        method: teachingSteps.find(s => s['环节'] === '熟读')?.['方法'] || '',
        guidanceScript: teachingSteps.find(s => s['环节'] === '熟读')?.['话术'] || '',
      } : d.integration.fluentReading,
    };

    const commonMistakes = (genreFeatures?.['注意事项'] as string[]) || [];
    const excellentExamples: string[] = [];

    // 解析课堂指导
    const guidanceData = data.guidance as Record<string, unknown> | undefined;
    const chorusGuideData = guidanceData?.chorusGuide as Record<string, string> | undefined;
    const commonMistakesData = guidanceData?.commonMistakes as Array<Record<string, string>> | undefined;
    
    const guidance = {
      overallGuide: '',
      segmentGuides: [],
      chorusGuide: {
        preparation: chorusGuideData?.['准备话术'] || d.guidance.chorusGuide.preparation,
        startSignal: chorusGuideData?.['开始信号'] || d.guidance.chorusGuide.startSignal,
        duringReading: [],
        ending: chorusGuideData?.['结束话术'] || d.guidance.chorusGuide.ending,
      },
      commonIssues: commonMistakesData?.map(item => ({
        issue: item['误读表现'] || '',
        cause: item['原因'] || '',
        solution: item['纠正方法'] || '',
        exampleCorrection: item['示范话术'] || '',
      })) || [],
    };

    // 示范策略
    const demonstration = {
      keyPoints: [],
      beforeScript: '',
      afterScript: '',
      observationPoints: [],
    };

    // 备课策略
    const preparation = {
      emotionalArc: '',
      speedChanges: skills.rhythm.variations.map(v => ({
        position: v.segment,
        speed: v.rhythm,
        reason: v.reason,
      })),
      stressMarks: skills.stress.points.map(p => ({
        text: p.text,
        type: p.type,
        reason: p.reason,
      })),
      pauseDesign: skills.pause.points.map(p => ({
        position: p.position,
        duration: p.type === 'short' ? '1秒' : p.type === 'long' ? '3秒' : '2秒',
        reason: p.reason,
      })),
      noteTemplate: '',
    };

    // 朗读标注
    const annotation = {
      text: originalText,
      pauses: [],
      stresses: [],
      emotionPoints: [],
    };

    return {
      ontology,
      subjectCultivation: {
        willingness,
        experience,
        skills,
      },
      emotionalModel,
      demonstration,
      preparation,
      commonMistakes,
      excellentExamples,
      integration,
      annotation,
      guidance,
    };
  }

  /**
   * 创建默认值
   */
  private createDefaults(genre: ReadingToneType) {
    return {
      ontology: {
        whyTeach: `培养学生的${genre}朗读能力，提升语感素养`,
        teachingPurpose: '让学生在朗读中感受文本情感，提升语言表达能力',
        valueOrientation: '通过朗读落实立德树人，培养学生的审美情趣和人文素养',
      },
      willingness: {
        selfConnection: '',
        emotionalTrigger: '',
        awakeningPhrases: [] as string[],
        introductionScript: '',
      },
      experience: {
        listeningGuide: {
          focusPoints: [] as string[],
          guidance: '',
          reflection: '',
        },
        imaginationRestore: {
          scenes: [] as Array<{ text: string; scene: string; sensoryDetails: string[]; emotionalAtmosphere: string }>,
          guidanceScript: '',
        },
        situationRestore: {
          background: '',
          characters: [] as string[],
          emotionalJourney: '',
        },
      },
      skills: {
        stress: { points: [] as Array<{ text: string; type: 'logic' | 'emotion' | 'grammar'; reason: string; method: string }>, teachingScript: '' },
        rhythm: { overall: '', variations: [] as Array<{ segment: string; rhythm: string; reason: string }>, teachingScript: '' },
        intonation: { emotionalTones: [] as Array<{ emotion: string; tone: string; example: string }>, teachingScript: '' },
        pause: { points: [] as Array<{ position: string; type: 'short' | 'medium' | 'long'; reason: string; effect: string }>, teachingScript: '' },
      },
      emotionalModel: {
        comprehension: {
          emotionalTone: '',
          emotionalThread: '',
          emotionalKeywords: [] as string[],
          guidanceScript: '',
        },
        imagination: {
          coreScenes: [] as string[],
          guidanceScript: '',
        },
        breathControl: {
          breathType: '',
          breathPoints: [] as string[],
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
          checkpoints: [] as string[],
          selfEvalCriteria: [] as string[],
          improvementTips: [] as string[],
          guidanceScript: '',
        },
      },
      demonstration: {
        keyPoints: [] as string[],
        beforeScript: '',
        afterScript: '',
        observationPoints: [] as string[],
      },
      preparation: {
        emotionalArc: '',
        speedChanges: [] as Array<{ position: string; speed: string; reason: string }>,
        stressMarks: [] as Array<{ text: string; type: string; reason: string }>,
        pauseDesign: [] as Array<{ position: string; duration: string; reason: string }>,
        noteTemplate: '',
      },
      integration: {
        firstReading: { purpose: '', method: '', guidanceScript: '' },
        intensiveReading: { purpose: '', method: '', guidanceScript: '' },
        appreciativeReading: { purpose: '', method: '', guidanceScript: '' },
        fluentReading: { purpose: '', method: '', guidanceScript: '' },
      },
      annotation: {
        text: '',
        pauses: [] as Array<{ position: number; type: 'short' | 'medium' | 'long'; reason: string }>,
        stresses: [] as Array<{ start: number; end: number; text: string; type: 'logic' | 'emotion' | 'grammar'; reason: string }>,
        emotionPoints: [] as Array<{ position: number; emotion: string; intensity: 'light' | 'medium' | 'strong' }>,
      },
      guidance: {
        overallGuide: '',
        segmentGuides: [] as Array<{ segment: string; guidance: string; keyPoints: string[] }>,
        chorusGuide: {
          preparation: '同学们，请做好朗读准备...',
          startSignal: '预备——起！',
          duringReading: [] as string[],
          ending: '读得真好！',
        },
        commonIssues: [] as Array<{ issue: string; cause: string; solution: string; exampleCorrection: string }>,
      },
      commonMistakes: [] as string[],
      excellentExamples: [] as string[],
    };
  }

  /**
   * 构建默认结果
   */
  private buildDefaultResult(
    defaults: ReturnType<typeof this.createDefaults>,
    genre: ReadingToneType
  ): ReturnType<typeof this.parseReadingResponse> {
    return {
      ontology: defaults.ontology,
      subjectCultivation: {
        willingness: defaults.willingness,
        experience: defaults.experience,
        skills: defaults.skills,
      },
      emotionalModel: defaults.emotionalModel,
      demonstration: defaults.demonstration,
      preparation: defaults.preparation,
      commonMistakes: defaults.commonMistakes,
      excellentExamples: defaults.excellentExamples,
      integration: defaults.integration,
      annotation: defaults.annotation,
      guidance: defaults.guidance,
    };
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
