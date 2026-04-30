// services/after-school-ai.service.ts
// 课后服务 AI 边车模式 - 核心业务逻辑层
// 使用 coze-coding-dev-sdk 调用大模型，SSE 流式输出优先

import { LLMClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import type { NextRequest } from 'next/server';
import { getService } from '@/lib/di';
import { SERVICE_IDENTIFIERS } from '@/lib/di';
import type { AfterSchoolEnrollmentService } from './after-school.service';
import type {
  ChatMessage,
  CopilotRequest,
  PredictionRequest,
  CoursePrediction,
  CourseGenerationRequest,
  GeneratedCourseContent,
  StudentFeedbackInput,
  HeatLevel,
} from '@/types/after-school-ai';
import type { AfterSchoolCourse } from '@/types/after-school';

// ==================== LLM 客户端工厂 ====================

function createLLMClient(request?: NextRequest) {
  const config = new Config();
  const customHeaders = request
    ? HeaderUtils.extractForwardHeaders(request.headers)
    : undefined;
  return new LLMClient(config, customHeaders);
}

// 默认使用均衡型模型
const DEFAULT_MODEL = 'doubao-seed-2-0-lite-260215';

// ==================== Feature 1: 智能选课助手 (家长端 Copilot) ====================

/**
 * 构建家长端 Copilot 的系统提示词
 * 将当前可选课程作为上下文注入
 */
async function buildCopilotSystemPrompt(studentGrade: number): Promise<string> {
  const service = getService<AfterSchoolEnrollmentService>(
    SERVICE_IDENTIFIERS.AfterSchoolEnrollmentService
  );
  const coursesResult = await service.getAvailableCourses(studentGrade);
  const courses = coursesResult.data || [];

  const courseList = courses
    .map((c: AfterSchoolCourse) => {
      const remain = c.maxStudents - c.currentStudents;
      return `- 《${c.name}》 上课时间:${c.dayOfWeek} ${c.startTime}-${c.endTime} 授课教师:${c.teacherName} 剩余名额:${remain}/${c.maxStudents}`;
    })
    .join('\n');

  return `你是"小课后"——一个温暖亲切的小学课后服务选课助手。你的任务是帮助家长为孩子挑选最合适的课后服务课程。

当前可选课程列表（${studentGrade}年级）：
${courseList || '暂无可选课程'}

回答要求：
1. 语气亲切自然，像朋友聊天一样
2. 直接推荐匹配的课程名称、时间、剩余名额
3. 如果名额紧张要提醒尽快选课
4. 如果家长提到的时间段没有课程，主动推荐相邻时间段的替代方案
5. 如果孩子有特殊兴趣，优先推荐对应的兴趣班
6. 回答简洁明了，不超过200字`;
}

/**
 * 家长端 Copilot 聊天（流式）
 * 返回 AsyncGenerator，供 API 层 SSE 输出
 */
export async function* streamCopilotChat(
  request: CopilotRequest,
  req?: NextRequest
): AsyncGenerator<string> {
  const client = createLLMClient(req);
  const systemPrompt = await buildCopilotSystemPrompt(request.studentGrade);

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...request.messages,
  ];

  const stream = client.stream(
    messages.map((m) => ({ role: m.role, content: m.content })),
    { model: DEFAULT_MODEL, temperature: 0.7 }
  );

  for await (const chunk of stream) {
    if (chunk.content) {
      yield chunk.content.toString();
    }
  }
}

/**
 * 家长端 Copilot 聊天（非流式，用于降级）
 */
export async function copilotChat(
  request: CopilotRequest,
  req?: NextRequest
): Promise<string> {
  const client = createLLMClient(req);
  const systemPrompt = await buildCopilotSystemPrompt(request.studentGrade);

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...request.messages,
  ];

  const response = await client.invoke(
    messages.map((m) => ({ role: m.role, content: m.content })),
    { model: DEFAULT_MODEL, temperature: 0.7 }
  );

  return response.content;
}

// ==================== Feature 2: 需求预测 (管理端) ====================

/**
 * 构建需求预测的系统提示词
 */
async function buildPredictionPrompt(
  semester?: string
): Promise<{ systemPrompt: string; userPrompt: string }> {
  const service = getService<AfterSchoolEnrollmentService>(
    SERVICE_IDENTIFIERS.AfterSchoolEnrollmentService
  );
  const currentSemester = semester || '2025-2026-2';
  const coursesResult = await service.getAllCourses(currentSemester);
  const courses = coursesResult.data || [];

  const courseData = courses
    .map((c: AfterSchoolCourse) => ({
      name: c.name,
      category: c.category,
      targetGrades: c.targetGrades,
      maxStudents: c.maxStudents,
      currentEnrolled: c.currentStudents,
      dayOfWeek: c.dayOfWeek,
      teacher: c.teacherName,
    }))
    .map((c) => JSON.stringify(c))
    .join('\n');

  const systemPrompt = `你是一个教务数据分析专家。请根据提供的当前课后服务课程数据和报名情况，预测各课程的报名热度，并给出调配建议。

输出要求：严格输出 JSON 数组，每个元素包含：
- courseName: 课程名称
- predictedDemand: 预测需求人数（整数）
- heatLevel: 热度等级，只能是 "HOT"、"NORMAL" 或 "COLD"
- aiSuggestion: AI调配建议（30字以内）

判断依据：
- 当前报名率 > 80% → HOT
- 当前报名率 40%-80% → NORMAL
- 当前报名率 < 40% → COLD
- 综合考虑课程类别受欢迎程度、年级覆盖面、时间段竞争等

只输出 JSON 数组，不要输出任何其他内容。`;

  const userPrompt = `以下是当前学期（${currentSemester}）的课后服务课程数据：
${courseData}

请预测各课程的报名热度并给出调配建议。`;

  return { systemPrompt, userPrompt };
}

/**
 * 智能需求预测
 */
export async function predictCourseDemand(
  request: PredictionRequest,
  req?: NextRequest
): Promise<CoursePrediction[]> {
  const client = createLLMClient(req);
  const { systemPrompt, userPrompt } = await buildPredictionPrompt(request.semester);

  const response = await client.invoke(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    { model: DEFAULT_MODEL, temperature: 0.3 }
  );

  try {
    // 尝试从返回内容中提取 JSON 数组
    const content = response.content.trim();
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('AI 返回内容无法解析为 JSON 数组');
    }
    const predictions = JSON.parse(jsonMatch[0]) as CoursePrediction[];

    // 补充 courseId 和 currentCapacity/currentEnrolled
    const service = getService<AfterSchoolEnrollmentService>(
      SERVICE_IDENTIFIERS.AfterSchoolEnrollmentService
    );
    const coursesResult = await service.getAllCourses(request.semester || '2025-2026-2');
    const courses = coursesResult.data || [];
    const courseMap = new Map(courses.map((c: AfterSchoolCourse) => [c.name, c]));

    return predictions.map((p) => {
      const course = courseMap.get(p.courseName);
      return {
        ...p,
        courseId: course?.id || '',
        currentCapacity: course?.maxStudents || 0,
        currentEnrolled: course?.currentStudents || 0,
        heatLevel: (['HOT', 'NORMAL', 'COLD'].includes(p.heatLevel)
          ? p.heatLevel
          : 'NORMAL') as HeatLevel,
      };
    });
  } catch {
    console.error('[AfterSchoolAI] predictCourseDemand parse error:', response.content);
    return [];
  }
}

// ==================== Feature 3: 课程内容生成 (教师/教务端) ====================

/**
 * AI 生成课程详情内容（流式）
 */
export async function* streamGenerateCourseContent(
  request: CourseGenerationRequest,
  req?: NextRequest
): AsyncGenerator<string> {
  const client = createLLMClient(req);
  const gradesText = request.targetGrades.map((g) => `${g}年级`).join('、');

  const systemPrompt = `你是一个资深小学教研员。请为课后服务课程编写面向家长和学生的课程介绍。
要求：
1. 适合${gradesText}学生
2. 包含以下部分（用 Markdown 格式）：
   ## 课程亮点（50字内，1-2句话）
   ## 培养目标（3点，每点15字内）
   ## 课堂形式（简要描述上课方式）
   ## 课程简介（100字左右的详细介绍）
3. 语气活泼有吸引力，让家长和孩子都想参加
4. 不要输出任何课程之外的内容`;

  const userPrompt = `请为《${request.courseName}》生成课程详情。课程类别：${request.category}。${request.teacherName ? `授课教师：${request.teacherName}。` : ''}`;

  const stream = client.stream(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    { model: DEFAULT_MODEL, temperature: 0.8 }
  );

  for await (const chunk of stream) {
    if (chunk.content) {
      yield chunk.content.toString();
    }
  }
}

/**
 * AI 生成课程详情内容（非流式）
 */
export async function generateCourseContent(
  request: CourseGenerationRequest,
  req?: NextRequest
): Promise<GeneratedCourseContent> {
  const client = createLLMClient(req);
  const gradesText = request.targetGrades.map((g) => `${g}年级`).join('、');

  const systemPrompt = `你是一个资深小学教研员。请为课后服务课程生成结构化的课程内容。
严格输出以下 JSON 格式：
{
  "highlights": "课程亮点，50字内",
  "objectives": ["目标1", "目标2", "目标3"],
  "format": "课堂形式描述，30字内",
  "description": "课程简介，100字内"
}
只输出 JSON，不要输出其他内容。`;

  const userPrompt = `为《${request.courseName}》生成课程内容。适合${gradesText}。类别：${request.category}。`;

  const response = await client.invoke(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    { model: DEFAULT_MODEL, temperature: 0.7 }
  );

  try {
    const content = response.content.trim();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI 返回内容无法解析为 JSON');
    }
    return JSON.parse(jsonMatch[0]) as GeneratedCourseContent;
  } catch {
    return {
      highlights: `${request.courseName}，精彩等你来！`,
      objectives: ['培养兴趣', '提升能力', '快乐成长'],
      format: '互动教学+实践操作',
      description: `${request.courseName}是一门面向${gradesText}学生的课后服务课程，旨在通过丰富多样的活动激发学习兴趣，培养综合素养。`,
    };
  }
}

// ==================== Feature 4: 智能评语反馈 (教师端) ====================

/**
 * AI 生成个性化期末评语（流式）
 */
export async function* streamGenerateFeedback(
  input: StudentFeedbackInput,
  req?: NextRequest
): AsyncGenerator<string> {
  const client = createLLMClient(req);

  const systemPrompt = `你是一个温柔、懂教育的小学老师。请根据以下标签和出勤率，为家长写一段期末课后服务评语。

学生姓名：${input.studentName}
课程：${input.courseName}
本学期表现标签：${input.selectedTags.join('、')}
出勤率：${input.attendanceRate}%

要求：
1. 100字左右
2. 以鼓励为主，语气温暖真诚
3. 不要像机器生成的，要像老师亲自写的
4. 结构为：肯定优点 + 具体表现 + 未来期许
5. 不要使用"该生"这种公文用语，用"XX"代替学生姓名或直接省略姓名自然叙述`;

  const stream = client.stream(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: '请生成期末评语' },
    ],
    { model: DEFAULT_MODEL, temperature: 0.9 }
  );

  for await (const chunk of stream) {
    if (chunk.content) {
      yield chunk.content.toString();
    }
  }
}

/**
 * AI 生成个性化期末评语（非流式）
 */
export async function generateFeedback(
  input: StudentFeedbackInput,
  req?: NextRequest
): Promise<string> {
  const client = createLLMClient(req);

  const systemPrompt = `你是一个温柔、懂教育的小学老师。请根据标签和出勤率，为家长写一段期末课后服务评语。

学生姓名：${input.studentName}
课程：${input.courseName}
本学期表现标签：${input.selectedTags.join('、')}
出勤率：${input.attendanceRate}%

要求：100字左右，以鼓励为主，语气温暖真诚，像老师亲自写的。结构：肯定优点+具体表现+未来期许。不用"该生"这种公文用语。`;

  const response = await client.invoke(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: '请生成期末评语' },
    ],
    { model: DEFAULT_MODEL, temperature: 0.9 }
  );

  return response.content;
}
