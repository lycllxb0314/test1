/**
 * 数学备课 Service
 * 
 * 基于论文《小学数学教学"教什么"》本体论推导设计
 * 核心理念：本质、过程、思想、结构 + 教学路径
 * 
 * @module services/math-prep.service
 */

import { BaseService, ServiceResult } from './base.service';
import { LLMClient, Config } from 'coze-coding-dev-sdk';
import { repairJsonParsedObject } from '@/lib/latex-normalize';
import type {
  MathPrepPlan,
  MathPrepRequest,
  EssenceAnalysis,
  ProcessRestoration,
  ThoughtRevelation,
  StructureConnection,
  TeachingPath,
  MathDomain,
} from '@/types/math-prep';

/** 最大重试次数 */
const MAX_RETRIES = 3;

/**
 * 数学备课服务
 */
export class MathPrepService extends BaseService {
  private llmClient: LLMClient;

  constructor(customHeaders?: Record<string, string>) {
    super();
    const config = new Config();
    this.llmClient = new LLMClient(config, customHeaders);
  }

  /**
   * 生成完整数学备课方案 - 并行生成策略 + 空值重试
   */
  async generateMathPrepPlan(request: MathPrepRequest): Promise<ServiceResult<MathPrepPlan>> {
    const { grade, semester, domain, unitName, contentName, contentKey } = request;

    try {
      // 并行生成五个模块（带重试）
      const [essenceResult, processResult, thoughtResult, structureResult, pathResult] = await Promise.all([
        this.generateWithRetry('essence', () => this.generateEssenceAnalysis(grade, domain, contentName), contentName),
        this.generateWithRetry('process', () => this.generateProcessRestoration(grade, domain, contentName), contentName),
        this.generateWithRetry('thought', () => this.generateThoughtRevelation(grade, domain, contentName), contentName),
        this.generateWithRetry('structure', () => this.generateStructureConnection(grade, domain, contentName), contentName),
        this.generateWithRetry('path', () => this.generateTeachingPath(grade, domain, contentName), contentName),
      ]);

      const plan: MathPrepPlan = {
        contentInfo: {
          grade,
          semester,
          domain,
          unitName,
          contentName,
        },
        essence: essenceResult,
        process: processResult,
        thought: thoughtResult,
        structure: structureResult,
        teachingPath: pathResult,
      };

      return this.ok(plan);
    } catch (error) {
      console.error('[MathPrepService] generateMathPrepPlan error:', error);
      return this.fail('生成数学备课方案失败', 'GENERATION_FAILED');
    }
  }

  /**
   * 带重试的生成函数
   */
  private async generateWithRetry<T>(
    dimension: string,
    generator: () => Promise<T>,
    contentName: string,
    isEmptyChecker?: (result: T) => boolean
  ): Promise<T> {
    // 使用默认的空值检查器
    const checker = isEmptyChecker || ((result: T) => this.isEmpty(result));
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      console.log(`[MathPrepService] 生成${dimension}，第${attempt}次尝试...`);
      
      try {
        const result = await generator();
        
        if (!checker(result)) {
          console.log(`[MathPrepService] ${dimension}生成成功`);
          return result;
        }
        
        console.warn(`[MathPrepService] ${dimension}第${attempt}次生成为空，准备重试...`);
        
        // 如果不是最后一次尝试，等待一段时间再重试
        if (attempt < MAX_RETRIES) {
          await this.delay(500 * attempt); // 递增延迟
        }
      } catch (error) {
        console.error(`[MathPrepService] ${dimension}第${attempt}次生成失败:`, error);
        if (attempt < MAX_RETRIES) {
          await this.delay(500 * attempt);
        }
      }
    }
    
    // 所有重试都失败，返回默认值并记录警告
    console.warn(`[MathPrepService] ${dimension}经过${MAX_RETRIES}次重试仍为空，使用默认值`);
    return this.getDefaultByDimension(dimension, contentName) as T;
  }

  /**
   * 检查结果是否为空
   */
  private isEmpty(result: unknown): boolean {
    if (!result) return true;
    
    // 检查对象的关键字段是否都为空
    if (typeof result === 'object') {
      const obj = result as Record<string, unknown>;
      
      // 本质挖掘：检查定义和本质属性
      if ('conceptCore' in obj) {
        const core = obj.conceptCore as Record<string, unknown>;
        return !core?.definition && (!core?.essentialAttributes || (core.essentialAttributes as unknown[]).length === 0);
      }
      
      // 过程还原：检查知识起源
      if ('knowledgeOrigin' in obj) {
        const origin = obj.knowledgeOrigin as Record<string, unknown>;
        return !origin?.historicalBackground && !origin?.causeOfEmergence;
      }
      
      // 思想显影：检查隐含思想
      if ('implicitThoughts' in obj) {
        const thoughts = obj.implicitThoughts as unknown[];
        return !thoughts || thoughts.length === 0;
      }
      
      // 结构贯通：检查纵向连接
      if ('verticalConnection' in obj) {
        const vertical = obj.verticalConnection as Record<string, unknown>;
        const prior = vertical?.priorLink as Record<string, unknown>;
        const subsequent = vertical?.subsequentLink as Record<string, unknown>;
        return !prior?.content && !subsequent?.content && !vertical?.developmentContext;
      }
      
      // 教学路径：检查目标和阶段
      if ('objectives' in obj && 'phases' in obj) {
        const objectives = obj.objectives as unknown[];
        const phases = obj.phases as unknown[];
        return (!objectives || objectives.length === 0) && (!phases || phases.length === 0);
      }
    }
    
    return false;
  }

  /**
   * 根据维度获取默认值
   */
  private getDefaultByDimension(dimension: string, contentName: string): unknown {
    switch (dimension) {
      case 'essence':
        return this.getDefaultEssenceAnalysis(contentName);
      case 'process':
        return this.getDefaultProcessRestoration();
      case 'thought':
        return this.getDefaultThoughtRevelation();
      case 'structure':
        return this.getDefaultStructureConnection();
      case 'path':
        return this.getDefaultTeachingPath();
      default:
        return null;
    }
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 生成本质挖掘
   */
  private async generateEssenceAnalysis(
    grade: number,
    domain: MathDomain,
    contentName: string
  ): Promise<EssenceAnalysis> {
    const prompt = this.buildEssencePrompt(grade, domain, contentName);
    console.log('[MathPrepService] 生成本质挖掘...');
    const response = await this.llmClient.invoke(
      [{ role: 'user', content: prompt }],
      { model: 'deepseek-v3-2-251201', temperature: 0.6 }
    );
    console.log('[MathPrepService] 本质挖掘响应长度:', response.content?.length);
    const json = this.extractJSON(response.content);
    console.log('[MathPrepService] 本质挖掘JSON解析结果:', JSON.stringify(json).substring(0, 200));
    return this.parseEssenceAnalysis(json);
  }

  /**
   * 生成过程还原
   */
  private async generateProcessRestoration(
    grade: number,
    domain: MathDomain,
    contentName: string
  ): Promise<ProcessRestoration> {
    const prompt = this.buildProcessPrompt(grade, domain, contentName);
    console.log('[MathPrepService] 生成过程还原...');
    const response = await this.llmClient.invoke(
      [{ role: 'user', content: prompt }],
      { model: 'deepseek-v3-2-251201', temperature: 0.6 }
    );
    console.log('[MathPrepService] 过程还原响应长度:', response.content?.length);
    return this.parseProcessRestoration(this.extractJSON(response.content));
  }

  /**
   * 生成思想显影
   */
  private async generateThoughtRevelation(
    grade: number,
    domain: MathDomain,
    contentName: string
  ): Promise<ThoughtRevelation> {
    const prompt = this.buildThoughtPrompt(grade, domain, contentName);
    console.log('[MathPrepService] 生成思想显影...');
    const response = await this.llmClient.invoke(
      [{ role: 'user', content: prompt }],
      { model: 'deepseek-v3-2-251201', temperature: 0.6 }
    );
    console.log('[MathPrepService] 思想显影响应长度:', response.content?.length);
    return this.parseThoughtRevelation(this.extractJSON(response.content));
  }

  /**
   * 生成结构贯通
   */
  private async generateStructureConnection(
    grade: number,
    domain: MathDomain,
    contentName: string
  ): Promise<StructureConnection> {
    const prompt = this.buildStructurePrompt(grade, domain, contentName);
    console.log('[MathPrepService] 生成结构贯通...');
    const response = await this.llmClient.invoke(
      [{ role: 'user', content: prompt }],
      { model: 'deepseek-v3-2-251201', temperature: 0.6 }
    );
    console.log('[MathPrepService] 结构贯通响应长度:', response.content?.length);
    return this.parseStructureConnection(this.extractJSON(response.content));
  }

  /**
   * 生成教学路径
   */
  private async generateTeachingPath(
    grade: number,
    domain: MathDomain,
    contentName: string
  ): Promise<TeachingPath> {
    const prompt = this.buildTeachingPathPrompt(grade, domain, contentName);
    console.log('[MathPrepService] 生成教学路径...');
    const response = await this.llmClient.invoke(
      [{ role: 'user', content: prompt }],
      { model: 'deepseek-v3-2-251201', temperature: 0.7 }
    );
    console.log('[MathPrepService] 教学路径响应长度:', response.content?.length);
    const json = this.extractJSON(response.content);
    console.log('[MathPrepService] 教学路径JSON解析结果:', JSON.stringify(json).substring(0, 300));
    const parsed = this.parseTeachingPath(json);
    console.log('[MathPrepService] 教学路径解析完成，phases数量:', parsed.phases?.length);
    return parsed;
  }

  // ==================== Prompt 构建 ====================

  private buildEssencePrompt(grade: number, domain: MathDomain, contentName: string): string {
    return `你是小学数学教育专家。请为"${grade}年级《${contentName}》"进行本质挖掘分析。

【知识领域】${domain}
【教学内容】${contentName}
【年级】${grade}年级

【核心任务】挖掘这个数学知识的本质属性，不是让学生背诵定义，而是理解"它到底是什么"。

【重要】必须严格输出JSON格式，不要有任何其他文字说明。

【输出格式示例】
{
  "conceptCore": {
    "definition": "这里写数学定义",
    "essentialAttributes": ["本质属性1", "本质属性2"],
    "nonEssentialAttributes": ["非本质属性"]
  },
  "connotationAnalysis": {
    "coreElements": ["核心要素1", "核心要素2"],
    "keyFeatures": ["关键特征"],
    "difficultPoints": ["理解难点"]
  },
  "extensionDefinition": {
    "scope": "适用范围",
    "specialCases": ["特殊情况"],
    "boundaries": "边界说明"
  },
  "examples": {
    "positiveExamples": [{"content": "正例", "explanation": "说明"}],
    "negativeExamples": [{"content": "反例", "explanation": "说明"}],
    "distinctionPoints": ["辨析要点"]
  }
}`;
  }

  private buildProcessPrompt(grade: number, domain: MathDomain, contentName: string): string {
    return `你是小学数学教育专家。请为"${grade}年级《${contentName}》"进行过程还原分析。

【知识领域】${domain}
【教学内容】${contentName}

【核心任务】还原这个知识是如何被创造/发现的，让学生经历"再创造"。

【输出JSON格式】
{
  "knowledgeOrigin": {
    "historicalBackground": "历史背景",
    "causeOfEmergence": "产生原因",
    "problemSolved": "解决的问题"
  },
  "predecessorConfusion": {
    "difficulties": ["困难1"],
    "attemptedMethods": ["尝试方法"],
    "failureReasons": ["失败原因"]
  },
  "thinkingTransition": {
    "breakthroughKey": "突破关键",
    "mindsetShift": "思维转变",
    "methodInnovation": "方法创新"
  },
  "recreationDesign": {
    "thinkingProcess": ["思考步骤1", "步骤2"],
    "inquiryActivities": ["探究活动"],
    "guidanceStrategies": ["引导策略"]
  }
}
只输出JSON。`;
  }

  private buildThoughtPrompt(grade: number, domain: MathDomain, contentName: string): string {
    return `你是小学数学教育专家。请为"${grade}年级《${contentName}》"进行思想显影分析。

【知识领域】${domain}
【教学内容】${contentName}

【核心任务】挖掘这个知识背后隐藏的数学思想方法。

【常见数学思想】符号化、方程、转化、数形结合、分类、对应、函数、模型、归纳、演绎等

【输出JSON格式】
{
  "implicitThoughts": [
    {"name": "思想名称", "description": "描述", "manifestation": "具体体现", "level": "core"}
  ],
  "infiltrationPoints": [
    {"teachingPhase": "教学环节", "thought": "渗透思想", "method": "方法", "script": "话术"}
  ],
  "thoughtSystem": {
    "mainThread": "主线思想",
    "supportingThoughts": ["支撑思想"],
    "thoughtNetwork": "思想关系网络"
  }
}
只输出JSON。`;
  }

  private buildStructurePrompt(grade: number, domain: MathDomain, contentName: string): string {
    return `你是小学数学教育专家。请为"${grade}年级《${contentName}》"进行结构贯通分析。

【知识领域】${domain}
【教学内容】${contentName}

【核心任务】找到知识与前后知识的联系，构建知识网络，找到统一框架。

【输出JSON格式】
{
  "verticalConnection": {
    "priorLink": {"content": "前置知识", "connectionPoint": "连接点", "bridgingMethod": "衔接方法"},
    "subsequentLink": {"content": "后续知识", "connectionPoint": "连接点", "extensionDirection": "延伸方向"},
    "developmentContext": "发展脉络"
  },
  "horizontalConnection": {
    "relatedKnowledge": [{"content": "相关知识", "commonality": "共同点", "difference": "不同点"}],
    "methodTransfer": ["方法迁移"]
  },
  "unifiedFramework": {
    "superordinateConcept": "上位概念",
    "unifiedStructure": "统一结构",
    "generalUnderstanding": "概括理解"
  }
}
只输出JSON。`;
  }

  private buildTeachingPathPrompt(grade: number, domain: MathDomain, contentName: string): string {
    return `你是小学数学教学设计专家。请为"${grade}年级《${contentName}》"设计完整的教学方案。

【知识领域】${domain}

【教学目标撰写要求】
- 省略主语"学生"，直接以动词开头
- 知识目标：理解...、掌握...、认识...
- 能力目标：能够运用...、学会...的方法、提高...能力
- 思维目标：经历...过程、体会...思想、发展...能力
- 情感目标：感受...价值、体验...乐趣

【重要】必须严格输出JSON格式，不要有任何其他文字说明。

【输出格式】
{
  "objectives": [
    {"dimension": "knowledge", "content": "知识目标内容"},
    {"dimension": "ability", "content": "能力目标内容"},
    {"dimension": "thinking", "content": "思维目标内容"},
    {"dimension": "emotion", "content": "情感目标内容"}
  ],
  "keyDifficulty": {
    "keyPoints": [{"content": "教学重点内容", "strategy": "突破策略"}],
    "difficulties": [{"content": "教学难点内容", "breakthrough": "突破方法"}]
  },
  "phases": [
    {"name": "导入", "duration": 5, "activities": ["活动描述"], "designIntent": "设计意图"},
    {"name": "探究", "duration": 15, "activities": ["探究活动1", "探究活动2"], "designIntent": "设计意图"},
    {"name": "归纳", "duration": 10, "activities": ["归纳活动"], "designIntent": "设计意图"},
    {"name": "应用", "duration": 8, "activities": ["应用练习"], "designIntent": "设计意图"},
    {"name": "总结", "duration": 2, "activities": ["总结活动"], "designIntent": "设计意图"}
  ],
  "keyQuestionDesign": [
    {"question": "关键问题内容", "purpose": "提问目的"}
  ],
  "studentActivityDesign": [
    {"activity": "学生活动描述", "form": "individual"}
  ]
}`;
  }

  // ==================== 解析方法 ====================

  private extractJSON(content: string): Record<string, unknown> {
    if (!content) {
      console.error('[MathPrepService] extractJSON: 内容为空');
      return {};
    }
    
    let jsonStr = content;
    
    // 尝试从代码块中提取
    const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    } else {
      // 提取第一个 { 到最后一个 } 之间的内容
      const firstBrace = content.indexOf('{');
      const lastBrace = content.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonStr = content.slice(firstBrace, lastBrace + 1);
      }
    }
    
    // 备份原始字符串用于调试
    const originalJsonStr = jsonStr;
    
    try {
      // 第一次尝试：直接解析
      return repairJsonParsedObject(JSON.parse(jsonStr)) as Record<string, unknown>;
    } catch (e1) {
      console.log('[MathPrepService] 第一次JSON解析失败，尝试修复...');
      
      try {
        // 修复策略1：处理中文引号和特殊字符
        let fixed = jsonStr;
        // 处理字符串值中的中文引号
        fixed = fixed.replace(/"([^"]*)"/g, (match, p1) => {
          const inner = p1
            .replace(/[""]/g, "'")
            .replace(/['']/g, "'")
            .replace(/\\/g, '\\\\');
          return `"${inner}"`;
        });
        
        // 清理常见问题
        fixed = fixed
          .replace(/,(\s*[}\]])/g, '$1')  // 尾随逗号
          .replace(/[\u0000-\u001F]/g, ' ') // 控制字符
          .trim();
        
        return repairJsonParsedObject(JSON.parse(fixed)) as Record<string, unknown>;
      } catch (e2) {
        console.log('[MathPrepService] JSON修复失败，尝试正则提取...');
        
        // 修复策略2：使用更宽松的解析
        try {
          // 移除所有换行，但保留字符串内的空格
          let cleaned = originalJsonStr
            .replace(/\n/g, ' ')
            .replace(/\r/g, '')
            .replace(/\t/g, ' ')
            .replace(/,\s*([}\]])/g, '$1');
          
          return repairJsonParsedObject(JSON.parse(cleaned)) as Record<string, unknown>;
        } catch (e3) {
          console.error('[MathPrepService] JSON解析最终失败:', e3);
          console.error('[MathPrepService] 问题JSON片段:', originalJsonStr.substring(0, 500));
          return {};
        }
      }
    }
  }

  private parseEssenceAnalysis(data: Record<string, unknown>): EssenceAnalysis {
    const conceptCore = (data.conceptCore as Record<string, unknown>) || {};
    const connotation = (data.connotationAnalysis as Record<string, unknown>) || {};
    const extension = (data.extensionDefinition as Record<string, unknown>) || {};
    const examples = (data.examples as Record<string, unknown>) || {};
    return {
      conceptCore: {
        definition: (conceptCore.definition as string) || '',
        essentialAttributes: (conceptCore.essentialAttributes as string[]) || [],
        nonEssentialAttributes: (conceptCore.nonEssentialAttributes as string[]) || [],
      },
      connotationAnalysis: {
        coreElements: (connotation.coreElements as string[]) || [],
        keyFeatures: (connotation.keyFeatures as string[]) || [],
        difficultPoints: (connotation.difficultPoints as string[]) || [],
      },
      extensionDefinition: {
        scope: (extension.scope as string) || '',
        specialCases: (extension.specialCases as string[]) || [],
        boundaries: (extension.boundaries as string) || '',
      },
      examples: {
        positiveExamples: (examples.positiveExamples as Array<{ content: string; explanation: string }>) || [],
        negativeExamples: (examples.negativeExamples as Array<{ content: string; explanation: string }>) || [],
        distinctionPoints: (examples.distinctionPoints as string[]) || [],
      },
    };
  }

  private parseProcessRestoration(data: Record<string, unknown>): ProcessRestoration {
    const origin = (data.knowledgeOrigin as Record<string, unknown>) || {};
    const confusion = (data.predecessorConfusion as Record<string, unknown>) || {};
    const transition = (data.thinkingTransition as Record<string, unknown>) || {};
    const recreation = (data.recreationDesign as Record<string, unknown>) || {};
    return {
      knowledgeOrigin: {
        historicalBackground: (origin.historicalBackground as string) || '',
        causeOfEmergence: (origin.causeOfEmergence as string) || '',
        problemSolved: (origin.problemSolved as string) || '',
      },
      predecessorConfusion: {
        difficulties: (confusion.difficulties as string[]) || [],
        attemptedMethods: (confusion.attemptedMethods as string[]) || [],
        failureReasons: (confusion.failureReasons as string[]) || [],
      },
      thinkingTransition: {
        breakthroughKey: (transition.breakthroughKey as string) || '',
        mindsetShift: (transition.mindsetShift as string) || '',
        methodInnovation: (transition.methodInnovation as string) || '',
      },
      recreationDesign: {
        thinkingProcess: (recreation.thinkingProcess as string[]) || [],
        inquiryActivities: (recreation.inquiryActivities as string[]) || [],
        guidanceStrategies: (recreation.guidanceStrategies as string[]) || [],
      },
    };
  }

  private parseThoughtRevelation(data: Record<string, unknown>): ThoughtRevelation {
    const thoughts = (data.implicitThoughts as Array<Record<string, unknown>>) || [];
    const points = (data.infiltrationPoints as Array<Record<string, unknown>>) || [];
    const system = (data.thoughtSystem as Record<string, unknown>) || {};
    return {
      implicitThoughts: thoughts.map((t) => ({
        name: (t.name as string) || '',
        description: (t.description as string) || '',
        manifestation: (t.manifestation as string) || '',
        level: (t.level as 'core' | 'secondary') || 'secondary',
      })),
      infiltrationPoints: points.map((p) => ({
        teachingPhase: (p.teachingPhase as string) || '',
        thought: (p.thought as string) || '',
        method: (p.method as string) || '',
        script: (p.script as string) || '',
      })),
      thoughtSystem: {
        mainThread: (system.mainThread as string) || '',
        supportingThoughts: (system.supportingThoughts as string[]) || [],
        thoughtNetwork: (system.thoughtNetwork as string) || '',
      },
    };
  }

  private parseStructureConnection(data: Record<string, unknown>): StructureConnection {
    const vertical = (data.verticalConnection as Record<string, unknown>) || {};
    const horizontal = (data.horizontalConnection as Record<string, unknown>) || {};
    const unified = (data.unifiedFramework as Record<string, unknown>) || {};
    const prior = (vertical.priorLink as Record<string, unknown>) || {};
    const subsequent = (vertical.subsequentLink as Record<string, unknown>) || {};
    return {
      verticalConnection: {
        priorLink: {
          content: (prior.content as string) || '',
          connectionPoint: (prior.connectionPoint as string) || '',
          bridgingMethod: (prior.bridgingMethod as string) || '',
        },
        subsequentLink: {
          content: (subsequent.content as string) || '',
          connectionPoint: (subsequent.connectionPoint as string) || '',
          extensionDirection: (subsequent.extensionDirection as string) || '',
        },
        developmentContext: (vertical.developmentContext as string) || '',
      },
      horizontalConnection: {
        relatedKnowledge: (horizontal.relatedKnowledge as Array<{ content: string; commonality: string; difference: string }>) || [],
        methodTransfer: (horizontal.methodTransfer as string[]) || [],
      },
      unifiedFramework: {
        superordinateConcept: (unified.superordinateConcept as string) || '',
        unifiedStructure: (unified.unifiedStructure as string) || '',
        generalUnderstanding: (unified.generalUnderstanding as string) || '',
      },
    };
  }

  private parseTeachingPath(data: Record<string, unknown>): TeachingPath {
    const objectives = (data.objectives as Array<Record<string, unknown>>) || [];
    const keyDifficulty = (data.keyDifficulty as Record<string, unknown>) || {};
    const phases = (data.phases as Array<Record<string, unknown>>) || [];
    const questions = (data.keyQuestionDesign as Array<Record<string, unknown>>) || [];
    const activities = (data.studentActivityDesign as Array<Record<string, unknown>>) || [];
    const evaluations = (data.evaluationSuggestions as Array<Record<string, unknown>>) || [];
    const keyPoints = (keyDifficulty.keyPoints as Array<Record<string, unknown>>) || [];
    const difficulties = (keyDifficulty.difficulties as Array<Record<string, unknown>>) || [];
    return {
      objectives: objectives.map((o) => ({
        dimension: (o.dimension as 'knowledge' | 'ability' | 'emotion' | 'thinking') || 'knowledge',
        content: (o.content as string) || '',
        behavior: (o.behavior as string) || '',
        degree: (o.degree as string) || '',
      })),
      keyDifficulty: {
        keyPoints: keyPoints.map((k) => ({
          content: (k.content as string) || '',
          reason: (k.reason as string) || '',
          strategy: (k.strategy as string) || '',
        })),
        difficulties: difficulties.map((d) => ({
          content: (d.content as string) || '',
          cause: (d.cause as string) || '',
          breakthrough: (d.breakthrough as string) || '',
        })),
      },
      phases: phases.map((p) => ({
        name: (p.name as string) || '',
        duration: (p.duration as number) || 5,
        purpose: (p.purpose as string) || '',
        activities: (p.activities as string[]) || [],
        teacherActions: (p.teacherActions as string[]) || [],
        keyQuestions: (p.keyQuestions as string[]) || [],
        designIntent: (p.designIntent as string) || '',
      })),
      keyQuestionDesign: questions.map((q) => ({
        question: (q.question as string) || '',
        purpose: (q.purpose as string) || '',
        expectedResponse: (q.expectedResponse as string) || '',
        followUp: (q.followUp as string) || '',
      })),
      studentActivityDesign: activities.map((a) => ({
        activity: (a.activity as string) || '',
        form: (a.form as 'individual' | 'pair' | 'group' | 'whole_class') || 'individual',
        materials: (a.materials as string[]) || [],
        guidance: (a.guidance as string) || '',
      })),
      evaluationSuggestions: evaluations.map((e) => ({
        aspect: (e.aspect as string) || '',
        method: (e.method as string) || '',
        criteria: (e.criteria as string) || '',
      })),
    };
  }

  // ==================== 默认值 ====================

  private getDefaultEssenceAnalysis(contentName: string): EssenceAnalysis {
    return {
      conceptCore: { definition: '', essentialAttributes: [], nonEssentialAttributes: [] },
      connotationAnalysis: { coreElements: [], keyFeatures: [], difficultPoints: [] },
      extensionDefinition: { scope: '', specialCases: [], boundaries: '' },
      examples: { positiveExamples: [], negativeExamples: [], distinctionPoints: [] },
    };
  }

  private getDefaultProcessRestoration(): ProcessRestoration {
    return {
      knowledgeOrigin: { historicalBackground: '', causeOfEmergence: '', problemSolved: '' },
      predecessorConfusion: { difficulties: [], attemptedMethods: [], failureReasons: [] },
      thinkingTransition: { breakthroughKey: '', mindsetShift: '', methodInnovation: '' },
      recreationDesign: { thinkingProcess: [], inquiryActivities: [], guidanceStrategies: [] },
    };
  }

  private getDefaultThoughtRevelation(): ThoughtRevelation {
    return {
      implicitThoughts: [],
      infiltrationPoints: [],
      thoughtSystem: { mainThread: '', supportingThoughts: [], thoughtNetwork: '' },
    };
  }

  private getDefaultStructureConnection(): StructureConnection {
    return {
      verticalConnection: {
        priorLink: { content: '', connectionPoint: '', bridgingMethod: '' },
        subsequentLink: { content: '', connectionPoint: '', extensionDirection: '' },
        developmentContext: '',
      },
      horizontalConnection: { relatedKnowledge: [], methodTransfer: [] },
      unifiedFramework: { superordinateConcept: '', unifiedStructure: '', generalUnderstanding: '' },
    };
  }

  private getDefaultTeachingPath(): TeachingPath {
    return {
      objectives: [],
      keyDifficulty: { keyPoints: [], difficulties: [] },
      phases: [],
      keyQuestionDesign: [],
      studentActivityDesign: [],
      evaluationSuggestions: [],
    };
  }
}

export const mathPrepService = new MathPrepService();
