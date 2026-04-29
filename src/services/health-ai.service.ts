/**
 * 健康 AI 服务
 *
 * 调用 LLM 大模型生成：
 * 1. 学生健康画像 AI 摘要、风险标签、优势标签
 * 2. 个性化健康处方（膳食建议 + 运动处方）
 *
 * 使用 coze-coding-dev-sdk 的 invoke() 非流式调用（后端离线生成场景）
 */
import { LLMClient, Config } from 'coze-coding-dev-sdk';

// 使用均衡型模型，兼顾质量和成本
const MODEL_ID = 'doubao-seed-2-0-lite-260215';

// ==================== 类型 ====================

type PortraitInput = {
  studentId: string;
  bmi?: number;
  bmiStatus?: string;
  fitnessLevel?: string;
  fitnessScore?: number;
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
};

type PortraitAIResult = {
  aiSummary: string;
  riskFactors: string[];
  strengths: string[];
  exerciseHabitScore: number;
};

type PrescriptionInput = {
  studentId: string;
  studentName?: string;
  age?: number;
  gender?: string;
  bmi?: number;
  bmiStatus?: string;
  fitnessLevel?: string;
  overallHealthScore?: number;
  riskFactors?: string[];
  strengths?: string[];
  sleepPattern?: string;
  dietPattern?: string;
  dentalCaries?: number;
  visionLeft?: number;
  visionRight?: number;
};

type PrescriptionAIResult = {
  dailyCaloriesTarget: number;
  nutritionAdvice: {
    carbs: { target: number; unit: string; description: string };
    protein: { target: number; unit: string; description: string };
    fat: { target: number; unit: string; description: string };
    vitamins: string[];
    minerals: string[];
  };
  dietTaboos: string[];
  mealSuggestions: {
    breakfast: string;
    lunch: string;
    dinner: string;
    snacks: string;
  };
  exerciseType: string;
  exerciseFrequency: number;
  exerciseDurationMin: number;
  exerciseIntensity: 'low' | 'medium' | 'high';
  exerciseNotes: string;
  aiSummary: string;
};

// ==================== LLM 客户端 ====================

function createLLMClient() {
  const config = new Config();
  return new LLMClient(config);
}

// ==================== 画像 AI 生成 ====================

export async function generatePortraitAI(input: PortraitInput): Promise<PortraitAIResult> {
  const client = createLLMClient();

  const systemPrompt = `你是一位专业的校园健康管理AI助手，擅长根据学生的体质数据、家长观察数据和体检数据，综合分析学生的健康状况。
你需要生成：
1. AI摘要：一段50-100字的综合健康评价
2. 风险因素：列出需要关注的风险点（0-4个）
3. 优势标签：列出学生的健康优势（0-4个）
4. 运动习惯评分：基于数据给出0-100的评分

请严格按照JSON格式输出，不要输出其他内容。`;

  const userPrompt = `请分析以下学生的健康数据，生成健康画像：

## 学生数据
- BMI: ${input.bmi ?? '未知'} (${formatBmiStatus(input.bmiStatus)})
- 体质等级: ${formatFitnessLevel(input.fitnessLevel)}
- 体质总分: ${input.fitnessScore ?? '未知'}
- 睡眠评分: ${input.sleepScore ?? '未知'} (模式: ${formatPattern(input.sleepPattern)})
- 饮食评分: ${input.dietScore ?? '未知'} (模式: ${formatPattern(input.dietPattern)})
- 运动习惯分: ${input.exerciseHabitScore ?? '未知'}
- 综合健康分: ${input.overallHealthScore ?? '未知'}

## 家长观察数据（近30天）
- 观察天数: ${input.observationDays ?? 0}
- 睡眠充足率: ${input.sleepSufficientRate != null ? Math.round(input.sleepSufficientRate * 100) + '%' : '未知'}
- 睡眠不足率: ${input.sleepInsufficientRate != null ? Math.round(input.sleepInsufficientRate * 100) + '%' : '未知'}
- 饮食均衡率: ${input.dietBalancedRate != null ? Math.round(input.dietBalancedRate * 100) + '%' : '未知'}
- 精力充沛率: ${input.energyEnergeticRate != null ? Math.round(input.energyEnergeticRate * 100) + '%' : '未知'}
- 经常疲劳率: ${input.energyTiredRate != null ? Math.round(input.energyTiredRate * 100) + '%' : '未知'}

## 体检数据
- 龋齿数: ${input.dentalCaries ?? '未知'}
- 脊柱正常: ${input.spineNormal === true ? '是' : input.spineNormal === false ? '异常' : '未知'}
- 左眼视力: ${input.visionLeft ?? '未知'}，右眼视力: ${input.visionRight ?? '未知'}
- 血压: ${input.systolicBp ?? '?'}/${input.diastolicBp ?? '?'} mmHg
- 心率: ${input.heartRate ?? '未知'} 次/分
- 色觉: ${input.colorBlindness ?? '正常'}

请输出JSON格式：
{
  "aiSummary": "综合健康评价（50-100字）",
  "riskFactors": ["风险因素1", "风险因素2"],
  "strengths": ["优势1", "优势2"],
  "exerciseHabitScore": 85
}`;

  try {
    const response = await client.invoke(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { model: MODEL_ID, temperature: 0.3 },
    );

    const parsed = parseJSONResponse<PortraitAIResult>(response.content);
    if (parsed) return parsed;

    // JSON 解析失败时返回基础结果
    return fallbackPortrait(input);
  } catch (err) {
    console.error('[HealthAIService] generatePortraitAI error:', err);
    return fallbackPortrait(input);
  }
}

// ==================== 处方 AI 生成 ====================

export async function generatePrescriptionAI(input: PrescriptionInput): Promise<PrescriptionAIResult> {
  const client = createLLMClient();

  const systemPrompt = `你是一位专业的校园营养师和运动指导师AI助手，擅长根据学生的健康画像数据，生成个性化的膳食建议和运动处方。
目标对象是小学生（6-12岁），请确保所有建议适合该年龄段。

你需要生成：
1. 每日热量目标
2. 营养建议（碳水/蛋白质/脂肪摄入目标 + 维生素/矿物质建议）
3. 饮食禁忌
4. 一日三餐+零食建议
5. 运动处方（运动类型、频率、时长、强度、注意事项）
6. 处方摘要

请严格按照JSON格式输出，不要输出其他内容。`;

  const userPrompt = `请为以下学生生成个性化健康处方：

## 学生基本信息
- 年龄: ${input.age ?? 10}岁
- 性别: ${input.gender ?? '未知'}
- BMI: ${input.bmi ?? '未知'} (${formatBmiStatus(input.bmiStatus)})

## 健康画像
- 体质等级: ${formatFitnessLevel(input.fitnessLevel)}
- 综合健康分: ${input.overallHealthScore ?? '未知'}/100
- 风险因素: ${(input.riskFactors || []).join('、') || '无'}
- 优势: ${(input.strengths || []).join('、') || '无'}
- 睡眠模式: ${formatPattern(input.sleepPattern)}
- 饮食模式: ${formatPattern(input.dietPattern)}

## 体检关注
- 龋齿数: ${input.dentalCaries ?? '未知'}
- 视力: 左${input.visionLeft ?? '?'} / 右${input.visionRight ?? '?'}

请输出JSON格式：
{
  "dailyCaloriesTarget": 1800,
  "nutritionAdvice": {
    "carbs": { "target": 250, "unit": "g", "description": "保持均衡碳水摄入" },
    "protein": { "target": 55, "unit": "g", "description": "保证优质蛋白" },
    "fat": { "target": 55, "unit": "g", "description": "健康脂肪适量" },
    "vitamins": ["维生素D", "维生素C"],
    "minerals": ["钙", "铁"]
  },
  "dietTaboos": ["高糖饮料", "油炸食品"],
  "mealSuggestions": {
    "breakfast": "燕麦粥+鸡蛋+牛奶+水果",
    "lunch": "米饭+鸡胸肉+蔬菜+汤",
    "dinner": "杂粮粥+鱼肉+蔬菜",
    "snacks": "水果+坚果"
  },
  "exerciseType": "综合运动",
  "exerciseFrequency": 4,
  "exerciseDurationMin": 35,
  "exerciseIntensity": "medium",
  "exerciseNotes": "注意事项...",
  "aiSummary": "处方摘要（30-60字）"
}`;

  try {
    const response = await client.invoke(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { model: MODEL_ID, temperature: 0.4 },
    );

    const parsed = parseJSONResponse<PrescriptionAIResult>(response.content);
    if (parsed) return parsed;

    // JSON 解析失败时返回基础结果
    return fallbackPrescription(input);
  } catch (err) {
    console.error('[HealthAIService] generatePrescriptionAI error:', err);
    return fallbackPrescription(input);
  }
}

// ==================== 辅助函数 ====================

function parseJSONResponse<T>(content: string): T | null {
  try {
    // 尝试提取 JSON 块（可能被 markdown 代码块包裹）
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : content;
    return JSON.parse(jsonStr) as T;
  } catch {
    // 尝试找到第一个 { 和最后一个 }
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

/** 画像兜底逻辑（LLM 不可用时） */
function fallbackPortrait(input: PortraitInput): PortraitAIResult {
  const riskFactors: string[] = [];
  const strengths: string[] = [];

  if (input.bmiStatus === 'underweight') riskFactors.push('偏瘦');
  else if (input.bmiStatus === 'overweight') riskFactors.push('偏胖');
  else if (input.bmiStatus === 'obese') riskFactors.push('肥胖');
  else if (input.bmiStatus === 'normal') strengths.push('BMI正常');

  if (input.fitnessLevel === 'fail') riskFactors.push('体质不及格');
  else if (input.fitnessLevel === 'excellent' || input.fitnessLevel === 'good') strengths.push(`体质${formatFitnessLevel(input.fitnessLevel)}`);

  if (input.sleepInsufficientRate != null && input.sleepInsufficientRate >= 0.3) riskFactors.push('睡眠不足');
  if (input.sleepSufficientRate != null && input.sleepSufficientRate >= 0.7) strengths.push('睡眠充足');
  if (input.dietBalancedRate != null && input.dietBalancedRate < 0.3) riskFactors.push('饮食不均衡');
  if (input.energyTiredRate != null && input.energyTiredRate >= 0.3) riskFactors.push('经常疲劳');
  if (input.energyEnergeticRate != null && input.energyEnergeticRate >= 0.5) strengths.push('精力充沛');

  const summary = `综合健康分${input.overallHealthScore ?? '未知'}分。` +
    (riskFactors.length > 0 ? `需关注：${riskFactors.join('、')}。` : '') +
    (strengths.length > 0 ? `优势：${strengths.join('、')}。` : '');

  return {
    aiSummary: summary,
    riskFactors,
    strengths,
    exerciseHabitScore: input.exerciseHabitScore ?? Math.round((input.overallHealthScore ?? 70) * 0.8),
  };
}

/** 处方兜底逻辑（LLM 不可用时） */
function fallbackPrescription(input: PrescriptionInput): PrescriptionAIResult {
  const isUnderweight = input.bmiStatus === 'underweight';
  const isOverweight = input.bmiStatus === 'overweight' || input.bmiStatus === 'obese';
  const isLowFitness = input.fitnessLevel === 'fail' || input.fitnessLevel === 'pass';

  return {
    dailyCaloriesTarget: isUnderweight ? 2000 : isOverweight ? 1500 : 1800,
    nutritionAdvice: {
      carbs: { target: isUnderweight ? 300 : isOverweight ? 200 : 250, unit: 'g', description: isUnderweight ? '适当增加碳水' : isOverweight ? '控制碳水' : '均衡碳水' },
      protein: { target: 55, unit: 'g', description: '保证优质蛋白' },
      fat: { target: isUnderweight ? 70 : isOverweight ? 45 : 55, unit: 'g', description: isUnderweight ? '适量健康脂肪' : isOverweight ? '减少脂肪' : '适量脂肪' },
      vitamins: ['维生素D', '维生素C'],
      minerals: ['钙', '铁'],
    },
    dietTaboos: isOverweight ? ['高糖饮料', '油炸食品', '零食'] : isUnderweight ? [] : ['含糖饮料', '油炸食品'],
    mealSuggestions: isUnderweight
      ? { breakfast: '全麦面包+鸡蛋+牛奶+坚果', lunch: '米饭+鸡胸肉+蔬菜+水果', dinner: '面条+鱼肉+蔬菜汤', snacks: '酸奶+水果' }
      : { breakfast: '燕麦粥+鸡蛋+蔬菜', lunch: '糙米饭+鱼肉+蔬菜', dinner: '杂粮粥+豆腐+蔬菜', snacks: '水果' },
    exerciseType: isLowFitness ? '体能训练' : '综合运动',
    exerciseFrequency: isLowFitness ? 5 : 4,
    exerciseDurationMin: isLowFitness ? 40 : 30,
    exerciseIntensity: isLowFitness ? 'medium' : 'low',
    exerciseNotes: isLowFitness ? '重点加强体能，从低强度有氧开始' : '保持运动习惯',
    aiSummary: `基于健康画像的综合处方，${isOverweight ? '侧重控制热量摄入' : isUnderweight ? '侧重增加营养' : '均衡膳食'}，${isLowFitness ? '加强体能训练' : '保持运动习惯'}。`,
  };
}
