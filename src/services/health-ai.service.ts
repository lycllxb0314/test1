/**
 * 健康 AI 服务
 *
 * 调用 LLM 大模型生成：
 * 1. 学生健康画像 - 详细的综合健康分析报告
 * 2. 个性化健康处方 - 专业的膳食建议和运动处方
 *
 * 使用 coze-coding-dev-sdk 的 invoke() 非流式调用（后端离线生成场景）
 */
import { LLMClient, Config } from 'coze-coding-dev-sdk';
import type { ExerciseIntensity, PortraitDimensionAnalysis } from '@/types/health-management';

// 使用均衡型模型，兼顾质量和成本
const MODEL_ID = 'doubao-seed-2-0-lite-260215';

// ==================== 类型 ====================

type PortraitInput = {
  studentId: string;
  studentName?: string;
  age?: number;
  gender?: string;
  // 身体发育数据
  heightCm?: number;
  weightKg?: number;
  bmi?: number;
  bmiStatus?: string;
  fitnessLevel?: string;
  fitnessScore?: number;
  gradeLevel?: string;
  sleepScore?: number;
  sleepPattern?: string;
  dietScore?: number;
  dietPattern?: string;
  exerciseHabitScore?: number;
  overallHealthScore?: number;
  // 观察数据
  observationDays?: number;
  sleepSufficientRate?: number;
  sleepInsufficientRate?: number;
  dietBalancedRate?: number;
  dietOvereatingRate?: number;
  energyEnergeticRate?: number;
  energyTiredRate?: number;
  // 体检数据
  dentalCaries?: number;
  spineNormal?: boolean;
  visionLeft?: number;
  visionRight?: number;
  systolicBp?: number;
  diastolicBp?: number;
  heartRate?: number;
  colorBlindness?: string;
  hearingLeft?: string;
  hearingRight?: string;
  checkupNotes?: string;
  // 体质测试详细数据
  lungCapacity?: number;
  run50m?: number;
  run50x8?: number;
  sitReach?: number;
  ropeJump?: number;
  sitUp?: number;
};

type PortraitAIResult = {
  aiSummary: string;
  detailedAnalysis: {
    bmi?: PortraitDimensionAnalysis;
    fitness?: PortraitDimensionAnalysis;
    sleep?: PortraitDimensionAnalysis;
    diet?: PortraitDimensionAnalysis;
    exercise?: PortraitDimensionAnalysis;
  };
  riskFactors: string[];
  strengths: string[];
  improvementSuggestions: string[];
  exerciseHabitScore: number;
};

type PrescriptionInput = {
  studentId: string;
  studentName?: string;
  age?: number;
  gender?: string;
  heightCm?: number;
  weightKg?: number;
  bmi?: number;
  bmiStatus?: string;
  fitnessLevel?: string;
  fitnessScore?: number;
  overallHealthScore?: number;
  riskFactors?: string[];
  strengths?: string[];
  sleepPattern?: string;
  dietPattern?: string;
  dentalCaries?: number;
  spineNormal?: boolean;
  visionLeft?: number;
  visionRight?: number;
  systolicBp?: number;
  diastolicBp?: number;
  heartRate?: number;
  hearingLeft?: string;
  hearingRight?: string;
  lungCapacity?: number;
  run50m?: number;
  run50x8?: number;
  sitReach?: number;
  ropeJump?: number;
  sitUp?: number;
  detailedAnalysis?: PortraitAIResult['detailedAnalysis'] | import('@/types/health-management').PortraitDetailedAnalysis;
};

type PrescriptionAIResult = {
  dailyCaloriesTarget: number;
  nutritionAdvice: {
    carbs: { target: number; unit: string; description: string; reason: string };
    protein: { target: number; unit: string; description: string; reason: string };
    fat: { target: number; unit: string; description: string; reason: string };
    vitamins: string[];
    minerals: string[];
    hydrationAdvice: string;
  };
  dietTaboos: string[];
  dietTabooReasons: string[];
  mealSuggestions: {
    breakfast: string;
    lunch: string;
    dinner: string;
    snacks: string;
    cookingTips: string;
  };
  exerciseType: string;
  exerciseFrequency: number;
  exerciseDurationMin: number;
  exerciseIntensity: 'low' | 'medium' | 'high';
  exercisePlan: {
    warmUp: string;
    mainExercise: string;
    coolDown: string;
    weeklySchedule: string;
  };
  exerciseNotes: string;
  aiSummary: string;
  expectedOutcomes: string;
};

// ==================== LLM 客户端 ====================

function createLLMClient() {
  const config = new Config();
  return new LLMClient(config);
}

// ==================== 画像 AI 生成 ====================

export async function generatePortraitAI(input: PortraitInput): Promise<PortraitAIResult> {
  const client = createLLMClient();

  const systemPrompt = `你是一位资深的校园健康管理专家，拥有儿童青少年营养学、运动医学和发育心理学的专业背景。
你需要为学生生成一份专业、详尽的健康画像报告，报告将呈现给家长和班主任查看。

报告要求：
1. 语言专业但通俗易懂，家长能看懂
2. 分析要基于数据，有理有据
3. 建议要具体可行，符合小学生年龄特点
4. 每个维度的分析要包含：当前状态、原因分析、改善建议三部分
5. 综合健康分评估要客观公正

输出严格JSON格式，不要输出其他内容。`;

  const userPrompt = `请为以下学生生成详细的健康画像分析报告：

## 学生基本信息
- 学生: ${input.studentName || input.studentId}
- 年龄: ${input.age ?? 10}岁
- 性别: ${input.gender ?? '未知'}
- 年级: ${input.gradeLevel ?? '未知'}

## 身体发育数据
- 身高: ${input.heightCm ?? '未知'} cm
- 体重: ${input.weightKg ?? '未知'} kg
- BMI: ${input.bmi ?? '未知'} (${formatBmiStatus(input.bmiStatus)})
- 体质等级: ${formatFitnessLevel(input.fitnessLevel)}
- 体质总分: ${input.fitnessScore ?? '未知'}/100

## 生活方式数据
- 睡眠评分: ${input.sleepScore ?? '未知'}/100 (模式: ${formatPattern(input.sleepPattern)})
- 饮食评分: ${input.dietScore ?? '未知'}/100 (模式: ${formatPattern(input.dietPattern)})
- 运动习惯分: ${input.exerciseHabitScore ?? '未知'}/100

## 家长观察数据（近30天）
- 观察天数: ${input.observationDays ?? 0}天
- 睡眠充足率: ${input.sleepSufficientRate != null ? Math.round(input.sleepSufficientRate * 100) + '%' : '未知'}
- 睡眠不足率: ${input.sleepInsufficientRate != null ? Math.round(input.sleepInsufficientRate * 100) + '%' : '未知'}
- 饮食均衡率: ${input.dietBalancedRate != null ? Math.round(input.dietBalancedRate * 100) + '%' : '未知'}
- 饮食过量率: ${input.dietOvereatingRate != null ? Math.round(input.dietOvereatingRate * 100) + '%' : '未知'}
- 精力充沛率: ${input.energyEnergeticRate != null ? Math.round(input.energyEnergeticRate * 100) + '%' : '未知'}
- 经常疲劳率: ${input.energyTiredRate != null ? Math.round(input.energyTiredRate * 100) + '%' : '未知'}

## 体检数据
- 龋齿数: ${input.dentalCaries ?? '未知'}颗
- 脊柱正常: ${input.spineNormal === true ? '正常' : input.spineNormal === false ? '异常' : '未检查'}
- 视力: 左${input.visionLeft ?? '?'} / 右${input.visionRight ?? '?'}
- 听力: 左${input.hearingLeft ?? '?'} / 右${input.hearingRight ?? '?'}
- 血压: ${input.systolicBp ?? '?'}/${input.diastolicBp ?? '?'} mmHg
- 心率: ${input.heartRate ?? '未知'}次/分
- 色觉: ${input.colorBlindness ?? '未知'}
- 体检备注: ${input.checkupNotes ?? '无'}

## 体质测试详细数据
- 肺活量: ${input.lungCapacity ?? '未知'} ml
- 50米跑: ${input.run50m ?? '未知'} 秒
- 50米×8往返跑: ${input.run50x8 ?? '未知'} 秒
- 坐位体前屈: ${input.sitReach ?? '未知'} cm
- 跳绳: ${input.ropeJump ?? '未知'} 次/分钟
- 仰卧起坐: ${input.sitUp ?? '未知'} 次/分钟

## 综合健康分
- 当前综合分: ${input.overallHealthScore ?? '未知'}/100

请输出以下JSON格式（每个分析字段内容要详细，80-150字）：
{
  "aiSummary": "综合健康评价摘要（100-150字，概述整体健康状况、主要问题和改善方向）",
  "detailedAnalysis": {
    "bmi": {
      "status": "当前BMI状态描述",
      "analysis": "BMI数据的专业分析，包括与同龄人对比、可能的原因分析（80-120字）",
      "suggestion": "针对BMI的具体改善建议，包括饮食和运动方面的具体措施（80-120字）"
    },
    "fitness": {
      "level": "当前体质等级",
      "analysis": "体质测试数据的综合分析，哪些项目优秀、哪些需要加强（80-120字）",
      "suggestion": "提升体质的具体训练建议，包括重点项目和训练方法（80-120字）"
    },
    "sleep": {
      "pattern": "当前睡眠模式",
      "analysis": "睡眠数据分析，包括睡眠质量、时长是否达标、影响因素（80-120字）",
      "suggestion": "改善睡眠的具体建议，包括作息时间、睡前习惯等（80-120字）"
    },
    "diet": {
      "pattern": "当前饮食模式",
      "analysis": "饮食习惯分析，营养均衡程度、存在的问题（80-120字）",
      "suggestion": "改善饮食的具体建议，包括食物种类、进餐时间等（80-120字）"
    },
    "exercise": {
      "pattern": "当前运动模式",
      "analysis": "运动习惯分析，运动频率、强度是否达标（80-120字）",
      "suggestion": "建立良好运动习惯的具体建议（80-120字）"
    }
  },
  "riskFactors": ["具体风险因素1", "具体风险因素2", "...（0-5个，每个20字以内）"],
  "strengths": ["健康优势1", "健康优势2", "...（0-5个，每个20字以内）"],
  "improvementSuggestions": ["改进建议1", "改进建议2", "改进建议3", "（3-5条具体建议，每条30字以内）"],
  "exerciseHabitScore": 85
}`;

  try {
    const response = await client.invoke(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { model: MODEL_ID, temperature: 0.4 },
    );

    const parsed = parseJSONResponse<PortraitAIResult>(response.content);
    if (parsed) return sanitizePortraitResult(parsed);

    return fallbackPortrait(input);
  } catch (err) {
    console.error('[HealthAIService] generatePortraitAI error:', err);
    return fallbackPortrait(input);
  }
}

// ==================== 处方 AI 生成 ====================

export async function generatePrescriptionAI(input: PrescriptionInput): Promise<PrescriptionAIResult> {
  const client = createLLMClient();

  const systemPrompt = `你是一位资深的儿童青少年营养师和运动指导师，拥有丰富的校园健康管理经验。
你需要为小学生（6-12岁）生成一份个性化、可执行的健康处方报告。

处方要求：
1. 膳食建议要具体到每日三餐的食材搭配，家长可直接照做
2. 营养目标要科学合理，符合儿童生长发育需求
3. 运动处方要安全可行，考虑学生实际情况
4. 每项建议都要说明原因，让家长理解为什么这么做
5. 饮食禁忌要结合学生健康数据给出合理解释

【关键约束】以下字段必须是严格的数值类型，禁止包含任何中文或文字描述：
- dailyCaloriesTarget: 整数（如 1800），单位kcal
- exerciseFrequency: 整数（如 4），表示每周运动次数
- exerciseDurationMin: 整数（如 30），表示每次运动分钟数
- nutritionAdvice中的target: 整数

输出严格JSON格式，不要输出其他内容。数值字段必须是纯数字！`;

  const detailedAnalysisText = input.detailedAnalysis
    ? `
## 详细健康分析
### BMI分析: ${input.detailedAnalysis.bmi?.analysis || '未知'}
### 体质分析: ${input.detailedAnalysis.fitness?.analysis || '未知'}
### 睡眠分析: ${input.detailedAnalysis.sleep?.analysis || '未知'}
### 饮食分析: ${input.detailedAnalysis.diet?.analysis || '未知'}
### 运动分析: ${input.detailedAnalysis.exercise?.analysis || '未知'}
`
    : '';

  const userPrompt = `请为以下学生生成详细、个性化的健康处方：

## 学生基本信息
- 学生: ${input.studentName || input.studentId}
- 年龄: ${input.age ?? 10}岁
- 性别: ${input.gender ?? '未知'}
- 身高: ${input.heightCm ?? '未知'} cm
- 体重: ${input.weightKg ?? '未知'} kg

## 身体健康数据
- BMI: ${input.bmi ?? '未知'} (${formatBmiStatus(input.bmiStatus)})
- 体质等级: ${formatFitnessLevel(input.fitnessLevel)}
- 体质总分: ${input.fitnessScore ?? '未知'}/100
- 综合健康分: ${input.overallHealthScore ?? '未知'}/100

## 健康画像
- 风险因素: ${(input.riskFactors || []).join('、') || '无'}
- 健康优势: ${(input.strengths || []).join('、') || '无'}
- 睡眠模式: ${formatPattern(input.sleepPattern)}
- 饮食模式: ${formatPattern(input.dietPattern)}

## 体检数据
- 龋齿数: ${input.dentalCaries ?? '未知'}颗
- 脊柱正常: ${input.spineNormal === true ? '正常' : input.spineNormal === false ? '异常' : '未检查'}
- 视力: 左${input.visionLeft ?? '?'} / 右${input.visionRight ?? '?'}
- 听力: 左${input.hearingLeft ?? '?'} / 右${input.hearingRight ?? '?'}
- 血压: ${input.systolicBp ?? '?'}/${input.diastolicBp ?? '?'} mmHg
- 心率: ${input.heartRate ?? '未知'}次/分

## 体质测试详细数据
- 肺活量: ${input.lungCapacity ?? '未知'} ml
- 50米跑: ${input.run50m ?? '未知'} 秒
- 50米×8往返跑: ${input.run50x8 ?? '未知'} 秒
- 坐位体前屈: ${input.sitReach ?? '未知'} cm
- 跳绳: ${input.ropeJump ?? '未知'} 次/分钟
- 仰卧起坐: ${input.sitUp ?? '未知'} 次/分钟
${detailedAnalysisText}

请输出以下JSON格式：
{
  "dailyCaloriesTarget": 1800,
  "nutritionAdvice": {
    "carbs": { 
      "target": 250, 
      "unit": "g", 
      "description": "碳水摄入建议（30字内）",
      "reason": "为什么这样建议（50字内）"
    },
    "protein": { 
      "target": 55, 
      "unit": "g", 
      "description": "蛋白质摄入建议",
      "reason": "建议原因"
    },
    "fat": { 
      "target": 55, 
      "unit": "g", 
      "description": "脂肪摄入建议",
      "reason": "建议原因"
    },
    "vitamins": ["维生素D", "维生素C"],
    "minerals": ["钙", "铁"],
    "hydrationAdvice": "每日饮水建议（30字内）"
  },
  "dietTaboos": ["高糖饮料", "油炸食品"],
  "dietTabooReasons": ["原因说明1", "原因说明2"],
  "mealSuggestions": {
    "breakfast": "早餐详细建议：包括具体食材和做法（如：燕麦粥+水煮蛋+牛奶+香蕉）",
    "lunch": "午餐详细建议",
    "dinner": "晚餐详细建议",
    "snacks": "健康零食建议",
    "cookingTips": "烹饪建议（如：少油少盐、蒸煮为主等，30字内）"
  },
  "exerciseType": "综合运动（有氧+力量+柔韧）",
  "exerciseFrequency": 4,
  "exerciseDurationMin": 35,
  "exerciseIntensity": "medium",
  "exercisePlan": {
    "warmUp": "热身运动内容和时长（如：5分钟慢跑+关节活动）",
    "mainExercise": "主要运动内容详细描述（如：20分钟跳绳+10分钟仰卧起坐）",
    "coolDown": "放松运动内容和时长",
    "weeklySchedule": "一周运动安排（如：周一三五跳绳，周二四跑步）"
  },
  "exerciseNotes": "运动注意事项（50字内）",
  "aiSummary": "处方摘要（80-120字，说明处方的主要目标和预期效果）",
  "expectedOutcomes": "预期改善效果（如：坚持4周后体重下降、睡眠改善等，50字内）"
}

注意：exerciseFrequency必须是1-7之间的整数，exerciseDurationMin必须是10-60之间的整数！`;

  try {
    const response = await client.invoke(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { model: MODEL_ID, temperature: 0.5 },
    );

    const parsed = parseJSONResponse<PrescriptionAIResult>(response.content);
    if (parsed) return sanitizePrescriptionResult(parsed);

    return fallbackPrescription(input);
  } catch (err) {
    console.error('[HealthAIService] generatePrescriptionAI error:', err);
    return fallbackPrescription(input);
  }
}

// ==================== 辅助函数 ====================

function parseJSONResponse<T>(content: string): T | null {
  try {
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : content;
    return JSON.parse(jsonStr) as T;
  } catch {
    const start = content.indexOf('{');
    const end = content.lastIndexOf('}');
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(content.slice(start, end + 1)) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}

/** 清洗画像AI结果 */
function sanitizePortraitResult(result: PortraitAIResult): PortraitAIResult {
  return {
    aiSummary: String(result.aiSummary || ''),
    detailedAnalysis: {
      bmi: result.detailedAnalysis?.bmi ? {
        status: String(result.detailedAnalysis.bmi.status || ''),
        analysis: String(result.detailedAnalysis.bmi.analysis || '暂无详细分析'),
        suggestion: String(result.detailedAnalysis.bmi.suggestion || '保持均衡饮食和适量运动'),
      } : undefined,
      fitness: result.detailedAnalysis?.fitness ? {
        level: String(result.detailedAnalysis.fitness.level || ''),
        analysis: String(result.detailedAnalysis.fitness.analysis || '暂无详细分析'),
        suggestion: String(result.detailedAnalysis.fitness.suggestion || '加强体育锻炼'),
      } : undefined,
      sleep: result.detailedAnalysis?.sleep ? {
        pattern: String(result.detailedAnalysis.sleep.pattern || ''),
        analysis: String(result.detailedAnalysis.sleep.analysis || '暂无详细分析'),
        suggestion: String(result.detailedAnalysis.sleep.suggestion || '保证充足睡眠'),
      } : undefined,
      diet: result.detailedAnalysis?.diet ? {
        pattern: String(result.detailedAnalysis.diet.pattern || ''),
        analysis: String(result.detailedAnalysis.diet.analysis || '暂无详细分析'),
        suggestion: String(result.detailedAnalysis.diet.suggestion || '均衡饮食'),
      } : undefined,
      exercise: result.detailedAnalysis?.exercise ? {
        pattern: String(result.detailedAnalysis.exercise.pattern || ''),
        analysis: String(result.detailedAnalysis.exercise.analysis || '暂无详细分析'),
        suggestion: String(result.detailedAnalysis.exercise.suggestion || '增加运动量'),
      } : undefined,
    },
    riskFactors: Array.isArray(result.riskFactors) ? result.riskFactors.map(String).filter(Boolean) : [],
    strengths: Array.isArray(result.strengths) ? result.strengths.map(String).filter(Boolean) : [],
    improvementSuggestions: Array.isArray(result.improvementSuggestions)
      ? result.improvementSuggestions.map(String).filter(Boolean)
      : ['保持良好作息', '均衡饮食', '适量运动'],
    exerciseHabitScore: clampInt(result.exerciseHabitScore, 0, 100, 70),
  };
}

/** 清洗处方AI结果 */
function sanitizePrescriptionResult(result: PrescriptionAIResult): PrescriptionAIResult {
  const sanitized: PrescriptionAIResult = {
    dailyCaloriesTarget: clampInt(result.dailyCaloriesTarget, 1200, 3000, 1800),
    nutritionAdvice: {
      carbs: {
        target: clampInt(result.nutritionAdvice?.carbs?.target, 100, 500, 250),
        unit: 'g',
        description: String(result.nutritionAdvice?.carbs?.description || '均衡碳水'),
        reason: String(result.nutritionAdvice?.carbs?.reason || '维持日常能量需求'),
      },
      protein: {
        target: clampInt(result.nutritionAdvice?.protein?.target, 20, 150, 55),
        unit: 'g',
        description: String(result.nutritionAdvice?.protein?.description || '优质蛋白'),
        reason: String(result.nutritionAdvice?.protein?.reason || '促进生长发育'),
      },
      fat: {
        target: clampInt(result.nutritionAdvice?.fat?.target, 20, 150, 55),
        unit: 'g',
        description: String(result.nutritionAdvice?.fat?.description || '适量脂肪'),
        reason: String(result.nutritionAdvice?.fat?.reason || '维持正常代谢'),
      },
      vitamins: Array.isArray(result.nutritionAdvice?.vitamins) ? result.nutritionAdvice.vitamins.map(String) : ['维生素D', '维生素C'],
      minerals: Array.isArray(result.nutritionAdvice?.minerals) ? result.nutritionAdvice.minerals.map(String) : ['钙', '铁'],
      hydrationAdvice: String(result.nutritionAdvice?.hydrationAdvice || '每日饮水1000-1500ml'),
    },
    dietTaboos: Array.isArray(result.dietTaboos) ? result.dietTaboos.map(String) : [],
    dietTabooReasons: Array.isArray(result.dietTabooReasons) ? result.dietTabooReasons.map(String) : [],
    mealSuggestions: {
      breakfast: String(result.mealSuggestions?.breakfast || '全麦面包+牛奶+鸡蛋'),
      lunch: String(result.mealSuggestions?.lunch || '米饭+鸡肉+蔬菜'),
      dinner: String(result.mealSuggestions?.dinner || '杂粮粥+鱼肉+蔬菜'),
      snacks: String(result.mealSuggestions?.snacks || '水果+坚果'),
      cookingTips: String(result.mealSuggestions?.cookingTips || '少油少盐，蒸煮为主'),
    },
    exerciseType: String(result.exerciseType || '综合运动'),
    exerciseFrequency: clampInt(result.exerciseFrequency, 1, 7, 4),
    exerciseDurationMin: clampInt(result.exerciseDurationMin, 10, 60, 30),
    exerciseIntensity: validateEnum<ExerciseIntensity>(result.exerciseIntensity, ['low', 'medium', 'high'], 'medium'),
    exercisePlan: {
      warmUp: String(result.exercisePlan?.warmUp || '5分钟热身运动'),
      mainExercise: String(result.exercisePlan?.mainExercise || '有氧运动20分钟+力量训练10分钟'),
      coolDown: String(result.exercisePlan?.coolDown || '5分钟拉伸放松'),
      weeklySchedule: String(result.exercisePlan?.weeklySchedule || '每周运动4次，间隔休息'),
    },
    exerciseNotes: String(result.exerciseNotes || '运动前热身，运动后拉伸'),
    aiSummary: String(result.aiSummary || ''),
    expectedOutcomes: String(result.expectedOutcomes || '坚持执行可改善健康状况'),
  };
  return sanitized;
}

function clampInt(value: unknown, min: number, max: number, defaultValue: number): number {
  if (value == null) return defaultValue;
  const num = typeof value === 'number' ? value : parseInt(String(value), 10);
  if (isNaN(num)) return defaultValue;
  return Math.max(min, Math.min(max, num));
}

function validateEnum<T extends string>(value: unknown, validValues: T[], defaultValue: T): T {
  if (typeof value === 'string' && validValues.includes(value as T)) return value as T;
  return defaultValue;
}

function formatBmiStatus(status?: string): string {
  const map: Record<string, string> = { underweight: '偏瘦', normal: '正常', overweight: '偏胖', obese: '肥胖' };
  return map[status || ''] || status || '未知';
}

function formatFitnessLevel(level?: string): string {
  const map: Record<string, string> = { excellent: '优秀', good: '良好', pass: '及格', fail: '不及格' };
  return map[level || ''] || level || '未知';
}

function formatPattern(pattern?: string): string {
  const map: Record<string, string> = { good: '良好', normal: '一般', poor: '较差', balanced: '均衡' };
  return map[pattern || ''] || pattern || '未知';
}

/** 画像兜底逻辑 */
function fallbackPortrait(input: PortraitInput): PortraitAIResult {
  const riskFactors: string[] = [];
  const strengths: string[] = [];
  const improvementSuggestions: string[] = [];

  if (input.bmiStatus === 'underweight') riskFactors.push('体重偏轻');
  else if (input.bmiStatus === 'overweight') riskFactors.push('体重偏重');
  else if (input.bmiStatus === 'obese') riskFactors.push('肥胖风险');
  else if (input.bmiStatus === 'normal') strengths.push('BMI正常');

  if (input.fitnessLevel === 'fail') riskFactors.push('体质测试不及格');
  else if (input.fitnessLevel === 'excellent') strengths.push('体质优秀');
  else if (input.fitnessLevel === 'good') strengths.push('体质良好');

  if (input.sleepInsufficientRate != null && input.sleepInsufficientRate >= 0.3) riskFactors.push('睡眠不足');
  if (input.sleepSufficientRate != null && input.sleepSufficientRate >= 0.7) strengths.push('睡眠充足');
  if (input.dietBalancedRate != null && input.dietBalancedRate < 0.3) riskFactors.push('饮食不均衡');
  if (input.energyTiredRate != null && input.energyTiredRate >= 0.3) riskFactors.push('经常疲劳');
  if (input.energyEnergeticRate != null && input.energyEnergeticRate >= 0.5) strengths.push('精力充沛');

  improvementSuggestions.push('保持规律作息', '均衡饮食营养', '每天运动30分钟');

  const summary = `该生综合健康评分为${input.overallHealthScore ?? 70}分。` +
    (riskFactors.length > 0 ? `需要关注以下方面：${riskFactors.join('、')}。` : '') +
    (strengths.length > 0 ? `健康优势：${strengths.join('、')}。` : '') +
    '建议继续保持良好的生活习惯，针对问题方面加强改善。';

  return {
    aiSummary: summary,
    detailedAnalysis: {
      bmi: {
        status: formatBmiStatus(input.bmiStatus),
        analysis: `当前BMI为${input.bmi ?? '未知'}，属于${formatBmiStatus(input.bmiStatus)}范围。需要关注体重管理。`,
        suggestion: '保持均衡饮食，适量运动，维持健康体重。',
      },
      fitness: {
        level: formatFitnessLevel(input.fitnessLevel),
        analysis: `体质测试等级为${formatFitnessLevel(input.fitnessLevel)}，得分${input.fitnessScore ?? '未知'}分。`,
        suggestion: '加强体育锻炼，重点提升弱项。',
      },
      sleep: {
        pattern: formatPattern(input.sleepPattern),
        analysis: `睡眠评分为${input.sleepScore ?? '未知'}分，睡眠模式${formatPattern(input.sleepPattern)}。`,
        suggestion: '保证每天9-10小时睡眠，固定作息时间。',
      },
      diet: {
        pattern: formatPattern(input.dietPattern),
        analysis: `饮食评分为${input.dietScore ?? '未知'}分，饮食习惯${formatPattern(input.dietPattern)}。`,
        suggestion: '均衡饮食，多吃蔬果，少吃零食。',
      },
      exercise: {
        pattern: '需要改善',
        analysis: `运动习惯评分为${input.exerciseHabitScore ?? '未知'}分。`,
        suggestion: '增加运动频率，每周至少运动4次。',
      },
    },
    riskFactors,
    strengths,
    improvementSuggestions,
    exerciseHabitScore: input.exerciseHabitScore ?? Math.round((input.overallHealthScore ?? 70) * 0.8),
  };
}

/** 处方兜底逻辑 */
function fallbackPrescription(input: PrescriptionInput): PrescriptionAIResult {
  const isUnderweight = input.bmiStatus === 'underweight';
  const isOverweight = input.bmiStatus === 'overweight' || input.bmiStatus === 'obese';
  const isLowFitness = input.fitnessLevel === 'fail' || input.fitnessLevel === 'pass';

  return {
    dailyCaloriesTarget: isUnderweight ? 2000 : isOverweight ? 1500 : 1800,
    nutritionAdvice: {
      carbs: {
        target: isUnderweight ? 300 : isOverweight ? 200 : 250,
        unit: 'g',
        description: isUnderweight ? '适当增加碳水摄入' : isOverweight ? '控制碳水摄入' : '均衡碳水摄入',
        reason: isUnderweight ? '增加热量摄入促进增重' : isOverweight ? '减少热量摄入控制体重' : '维持日常能量需求',
      },
      protein: {
        target: 55,
        unit: 'g',
        description: '保证优质蛋白摄入',
        reason: '促进儿童生长发育',
      },
      fat: {
        target: isUnderweight ? 70 : isOverweight ? 45 : 55,
        unit: 'g',
        description: isUnderweight ? '适量健康脂肪' : isOverweight ? '减少脂肪摄入' : '适量脂肪摄入',
        reason: isUnderweight ? '增加热量摄入' : isOverweight ? '控制热量摄入' : '维持正常代谢',
      },
      vitamins: ['维生素D', '维生素C', '维生素B族'],
      minerals: ['钙', '铁', '锌'],
      hydrationAdvice: '每日饮水1000-1500ml，避免含糖饮料',
    },
    dietTaboos: isOverweight ? ['高糖饮料', '油炸食品', '零食', '快餐'] : ['含糖饮料', '油炸食品'],
    dietTabooReasons: isOverweight ? ['增加肥胖风险', '高热量低营养', '影响正餐食欲', '营养不均衡'] : ['影响钙吸收', '增加心血管风险'],
    mealSuggestions: {
      breakfast: isUnderweight ? '全麦面包+鸡蛋+牛奶+坚果+水果' : '燕麦粥+水煮蛋+牛奶+蔬菜',
      lunch: isUnderweight ? '米饭+鸡胸肉+蔬菜+水果+酸奶' : '糙米饭+鱼肉+蔬菜+汤',
      dinner: isUnderweight ? '面条+牛肉+蔬菜汤' : '杂粮粥+豆腐+蔬菜',
      snacks: isOverweight ? '黄瓜、番茄' : '水果+坚果+酸奶',
      cookingTips: '少油少盐，蒸煮为主，避免油炸',
    },
    exerciseType: isLowFitness ? '体能训练' : '综合运动',
    exerciseFrequency: isLowFitness ? 5 : 4,
    exerciseDurationMin: isLowFitness ? 40 : 30,
    exerciseIntensity: isLowFitness ? 'medium' : 'medium',
    exercisePlan: {
      warmUp: '5分钟慢跑+关节活动',
      mainExercise: isLowFitness ? '20分钟有氧运动+15分钟力量训练' : '15分钟跳绳+10分钟仰卧起坐',
      coolDown: '5分钟拉伸放松',
      weeklySchedule: isLowFitness ? '周一至周五每天运动，周末休息' : '周一三五跳绳，周二四跑步，周末休息',
    },
    exerciseNotes: isLowFitness ? '从低强度开始，循序渐进增加运动量' : '运动前热身，运动后拉伸，避免受伤',
    aiSummary: `基于学生健康画像，本处方${isOverweight ? '侧重控制热量摄入，配合有氧运动' : isUnderweight ? '侧重增加营养摄入，配合力量训练' : '注重营养均衡，保持运动习惯'}。建议坚持执行4-6周后复评。`,
    expectedOutcomes: '坚持执行4周后，预期体质改善、精力更充沛、睡眠质量提升。',
  };
}
