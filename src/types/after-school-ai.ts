// types/after-school-ai.ts
// 课后服务 AI 边车模式 - 类型定义

import type { AfterSchoolCourse } from './after-school';

// ==================== Feature 1: 智能客服 (家长端 Copilot) ====================

export type ChatRole = 'user' | 'assistant' | 'system';

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type CopilotRequest = {
  messages: ChatMessage[];
  studentGrade: number;
  studentId?: string;
};

// ==================== Feature 2: 需求预测 (管理端) ====================

export type HeatLevel = 'HOT' | 'NORMAL' | 'COLD';

export type CoursePrediction = {
  courseId: string;
  courseName: string;
  predictedDemand: number;
  currentCapacity: number;
  currentEnrolled: number;
  heatLevel: HeatLevel;
  aiSuggestion: string;
};

export type PredictionRequest = {
  semester?: string;
};

// ==================== Feature 3: 课程生成 (教师/教务端) ====================

export type CourseGenerationRequest = {
  courseName: string;
  targetGrades: number[];
  category: string;
  teacherName?: string;
};

export type GeneratedCourseContent = {
  highlights: string;
  objectives: string[];
  format: string;
  description: string;
};

// ==================== Feature 4: 智能评语反馈 (教师端) ====================

export type FeedbackTag =
  | '专注认真'
  | '思维活跃'
  | '乐于助人'
  | '动手能力强'
  | '进步明显'
  | '团队协作'
  | '创意丰富'
  | '遵守纪律'
  | '积极发言'
  | '耐心细致';

export type StudentFeedbackInput = {
  studentName: string;
  courseName: string;
  selectedTags: FeedbackTag[];
  attendanceRate: number;
};

// ==================== AI API 统一请求/响应 ====================

export type AIAction = 'chat' | 'predict' | 'generate-content' | 'generate-feedback';

export type AIRequest = {
  action: AIAction;
  payload: CopilotRequest | PredictionRequest | CourseGenerationRequest | StudentFeedbackInput;
};
