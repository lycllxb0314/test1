/**
 * 心理数字人系统 Service 层
 * 
 * 遵循六层架构，继承 BaseService
 * 包含危机关键词检测、会话管理、预警处理等核心业务逻辑
 */

import { BaseService, type ServiceResult } from './base.service';
import {
  psychologySessionRepository,
  psychologyMessageRepository,
  psychologyAlertRepository,
  psychologyProfileRepository,
} from '@/repositories/psychology.repository';
import type {
  PsychologySession,
  PsychologyMessage,
  PsychologyAlert,
  PsychologyProfile,
  AlertStatistics,
  SessionStatus,
  AlertLevel,
  AlertStatus,
  AlertType,
} from '@/types/psychology';
import { CRISIS_KEYWORDS } from '@/types/psychology';

// ============================================
// 危机关键词检测服务
// ============================================

export type CrisisDetectionResult = {
  isCrisis: boolean;
  level: AlertLevel | null;
  keywords: string[];
  alertType: string;
  response: string;
};

/**
 * 检测文本中的危机关键词
 */
export function detectCrisis(text: string): CrisisDetectionResult {
  const result: CrisisDetectionResult = {
    isCrisis: false,
    level: null,
    keywords: [],
    alertType: 'other',
    response: '',
  };

  // 按优先级检查（红 > 橙 > 黄）
  const levels: AlertLevel[] = ['red', 'orange', 'yellow'];

  for (const level of levels) {
    const config = CRISIS_KEYWORDS[level];
    const foundKeywords = config.keywords.filter(keyword => text.includes(keyword));

    if (foundKeywords.length > 0) {
      result.isCrisis = true;
      result.level = level;
      result.keywords = foundKeywords;
      result.alertType = config.alertType;
      result.response = config.message;
      break;  // 找到最高级别后停止
    }
  }

  return result;
}

// ============================================
// 心理会话 Service
// ============================================

class PsychologySessionServiceClass extends BaseService {
  /**
   * 创建新会话
   */
  async createSession(studentId: string, sessionType?: string): Promise<ServiceResult<PsychologySession>> {
    try {
      // 检查是否有活跃会话
      const activeSession = await psychologySessionRepository.findActiveByStudentId(studentId);
      if (activeSession) {
        return this.ok(activeSession);
      }

      // 创建新会话
      const session = await psychologySessionRepository.createSession({
        studentId,
        sessionType: sessionType || 'chat',
      });

      if (!session) {
        return this.fail('创建会话失败', 'CREATE_ERROR');
      }

      return this.ok(session);
    } catch (error) {
      console.error('[PsychologySessionService] createSession error:', error);
      return this.fail('创建会话时发生错误', 'INTERNAL_ERROR');
    }
  }

  /**
   * 获取或创建活跃会话
   */
  async getOrCreateActiveSession(studentId: string): Promise<ServiceResult<PsychologySession>> {
    const activeSession = await psychologySessionRepository.findActiveByStudentId(studentId);
    if (activeSession) {
      return this.ok(activeSession);
    }
    return this.createSession(studentId);
  }

  /**
   * 结束会话
   */
  async endSession(
    sessionId: string,
    summary?: string,
    emotionAnalysis?: Record<string, unknown>
  ): Promise<ServiceResult<PsychologySession>> {
    try {
      const session = await psychologySessionRepository.updateStatus(
        sessionId,
        'ended',
        summary,
        emotionAnalysis
      );

      if (!session) {
        return this.fail('结束会话失败', 'UPDATE_ERROR');
      }

      return this.ok(session);
    } catch (error) {
      console.error('[PsychologySessionService] endSession error:', error);
      return this.fail('结束会话时发生错误', 'INTERNAL_ERROR');
    }
  }

  /**
   * 获取学生会话列表
   */
  async getStudentSessions(
    studentId: string,
    limit: number = 20
  ): Promise<ServiceResult<PsychologySession[]>> {
    try {
      const sessions = await psychologySessionRepository.findByStudentId(studentId, { limit });
      return this.ok(sessions);
    } catch (error) {
      console.error('[PsychologySessionService] getStudentSessions error:', error);
      return this.fail('获取会话列表失败', 'QUERY_ERROR');
    }
  }

  /**
   * 获取会话详情
   */
  async getSession(sessionId: string): Promise<ServiceResult<PsychologySession>> {
    const session = await psychologySessionRepository.findById(sessionId);
    if (!session) {
      return this.fail('会话不存在', 'NOT_FOUND');
    }
    return this.ok(session as unknown as PsychologySession);
  }
}

// ============================================
// 心理消息 Service
// ============================================

class PsychologyMessageServiceClass extends BaseService {
  /**
   * 添加消息
   */
  async addMessage(message: {
    sessionId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    audioUrl?: string;
    emotion?: string;
    emotionScore?: number;
    isCrisis?: boolean;
    crisisKeywords?: string[];
  }): Promise<ServiceResult<PsychologyMessage>> {
    try {
      const created = await psychologyMessageRepository.createMessage(message);
      if (!created) {
        return this.fail('添加消息失败', 'CREATE_ERROR');
      }
      return this.ok(created);
    } catch (error) {
      console.error('[PsychologyMessageService] addMessage error:', error);
      return this.fail('添加消息时发生错误', 'INTERNAL_ERROR');
    }
  }

  /**
   * 获取会话消息历史
   */
  async getSessionMessages(
    sessionId: string,
    limit: number = 50
  ): Promise<ServiceResult<PsychologyMessage[]>> {
    try {
      const messages = await psychologyMessageRepository.findBySessionId(sessionId, limit);
      return this.ok(messages);
    } catch (error) {
      console.error('[PsychologyMessageService] getSessionMessages error:', error);
      return this.fail('获取消息历史失败', 'QUERY_ERROR');
    }
  }

  /**
   * 获取对话历史格式（用于 LLM）
   */
  async getConversationHistory(
    sessionId: string,
    limit: number = 20
  ): Promise<Array<{ role: 'user' | 'assistant' | 'system'; content: string }>> {
    const messages = await psychologyMessageRepository.findBySessionId(sessionId, limit);
    return messages.map(m => ({
      role: m.role,
      content: m.content,
    }));
  }
}

// ============================================
// 心理预警 Service
// ============================================

class PsychologyAlertServiceClass extends BaseService {
  /**
   * 创建预警
   */
  async createAlert(alert: {
    sessionId?: string;
    studentId: string;
    alertLevel: AlertLevel;
    alertType: string;
    keywords: string[];
    content: string;
    context?: string;
  }): Promise<ServiceResult<PsychologyAlert>> {
    try {
      const created = await psychologyAlertRepository.createAlert(alert);
      if (!created) {
        return this.fail('创建预警失败', 'CREATE_ERROR');
      }
      return this.ok(created);
    } catch (error) {
      console.error('[PsychologyAlertService] createAlert error:', error);
      return this.fail('创建预警时发生错误', 'INTERNAL_ERROR');
    }
  }

  /**
   * 处理预警
   */
  async handleAlert(
    alertId: string,
    handler: {
      handlerId: string;
      handlerName: string;
      status: AlertStatus;
      handleNotes?: string;
    }
  ): Promise<ServiceResult<PsychologyAlert>> {
    try {
      const updated = await psychologyAlertRepository.handleAlert(alertId, handler);
      if (!updated) {
        return this.fail('处理预警失败', 'UPDATE_ERROR');
      }
      return this.ok(updated);
    } catch (error) {
      console.error('[PsychologyAlertService] handleAlert error:', error);
      return this.fail('处理预警时发生错误', 'INTERNAL_ERROR');
    }
  }

  /**
   * 获取待处理预警
   */
  async getPendingAlerts(limit: number = 50): Promise<ServiceResult<PsychologyAlert[]>> {
    try {
      const alerts = await psychologyAlertRepository.findByStatus('pending', { limit });
      return this.ok(alerts);
    } catch (error) {
      console.error('[PsychologyAlertService] getPendingAlerts error:', error);
      return this.fail('获取预警列表失败', 'QUERY_ERROR');
    }
  }

  /**
   * 获取最近预警
   */
  async getRecentAlerts(limit: number = 20): Promise<ServiceResult<PsychologyAlert[]>> {
    try {
      const alerts = await psychologyAlertRepository.findRecent(limit);
      return this.ok(alerts);
    } catch (error) {
      console.error('[PsychologyAlertService] getRecentAlerts error:', error);
      return this.fail('获取预警列表失败', 'QUERY_ERROR');
    }
  }

  /**
   * 获取预警统计
   */
  async getStatistics(): Promise<ServiceResult<AlertStatistics>> {
    try {
      const stats = await psychologyAlertRepository.getStatistics();
      const recentAlerts = await psychologyAlertRepository.findRecent(10);

      return this.ok({
        ...stats,
        byType: {} as Record<AlertType, number>, // 暂时返回空对象
        recentAlerts,
      });
    } catch (error) {
      console.error('[PsychologyAlertService] getStatistics error:', error);
      return this.fail('获取统计数据失败', 'QUERY_ERROR');
    }
  }

  /**
   * 自动创建预警（基于危机检测结果）
   */
  async autoCreateAlert(
    studentId: string,
    sessionId: string,
    detectionResult: CrisisDetectionResult,
    originalText: string
  ): Promise<ServiceResult<PsychologyAlert | null>> {
    if (!detectionResult.isCrisis || !detectionResult.level) {
      return this.ok(null);
    }

    return this.createAlert({
      sessionId,
      studentId,
      alertLevel: detectionResult.level,
      alertType: detectionResult.alertType,
      keywords: detectionResult.keywords,
      content: `检测到危机关键词：${detectionResult.keywords.join('、')}`,
      context: originalText,
    });
  }
}

// ============================================
// 心理档案 Service
// ============================================

class PsychologyProfileServiceClass extends BaseService {
  /**
   * 获取学生档案
   */
  async getProfile(studentId: string): Promise<ServiceResult<PsychologyProfile | null>> {
    try {
      const profile = await psychologyProfileRepository.findByStudentId(studentId);
      return this.ok(profile);
    } catch (error) {
      console.error('[PsychologyProfileService] getProfile error:', error);
      return this.fail('获取档案失败', 'QUERY_ERROR');
    }
  }

  /**
   * 更新档案
   */
  async updateProfile(
    studentId: string,
    updates: {
      riskLevel?: string;
      personalityTraits?: Record<string, number>;
      emotionalPatterns?: Record<string, unknown>;
      interests?: string[];
      concerns?: string[];
      notes?: string;
    }
  ): Promise<ServiceResult<PsychologyProfile>> {
    try {
      const profile = await psychologyProfileRepository.upsertProfile({
        studentId,
        ...updates,
      });

      if (!profile) {
        return this.fail('更新档案失败', 'UPDATE_ERROR');
      }

      return this.ok(profile);
    } catch (error) {
      console.error('[PsychologyProfileService] updateProfile error:', error);
      return this.fail('更新档案时发生错误', 'INTERNAL_ERROR');
    }
  }

  /**
   * 更新会话统计
   */
  async updateSessionStats(studentId: string, duration: number): Promise<ServiceResult<boolean>> {
    try {
      const success = await psychologyProfileRepository.updateSessionStats(studentId, duration);
      return this.ok(success);
    } catch (error) {
      console.error('[PsychologyProfileService] updateSessionStats error:', error);
      return this.fail('更新统计失败', 'UPDATE_ERROR');
    }
  }
}

// ============================================
// 导出单例实例
// ============================================

export const psychologySessionService = new PsychologySessionServiceClass();
export const psychologyMessageService = new PsychologyMessageServiceClass();
export const psychologyAlertService = new PsychologyAlertServiceClass();
export const psychologyProfileService = new PsychologyProfileServiceClass();

// 导出类型供 DI 使用
export type { PsychologySessionServiceClass as PsychologySessionService };
export type { PsychologyMessageServiceClass as PsychologyMessageService };
export type { PsychologyAlertServiceClass as PsychologyAlertService };
export type { PsychologyProfileServiceClass as PsychologyProfileService };
