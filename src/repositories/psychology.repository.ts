/**
 * 心理数字人系统 Repository 层
 * 
 * 遵循六层架构，继承 BaseRepository
 */

import { BaseRepository, type QueryOptions, type PaginatedResult } from './base.repository';
import type {
  PsychologySession,
  PsychologySessionRow,
  PsychologyMessage,
  PsychologyMessageRow,
  PsychologyAlert,
  PsychologyAlertRow,
  PsychologyProfile,
  PsychologyProfileRow,
  SessionStatus,
  AlertLevel,
  AlertStatus,
} from '@/types/psychology';

// ============================================
// 会话 Repository
// ============================================

export class PsychologySessionRepository extends BaseRepository<PsychologySessionRow> {
  constructor() {
    super('psychology_sessions');
  }

  /**
   * 转换数据库行为业务类型
   */
  private toSession(row: PsychologySessionRow): PsychologySession {
    return {
      id: row.id,
      studentId: row.student_id,
      studentName: row.student_name,
      classId: row.class_id,
      className: row.class_name,
      grade: row.grade,
      status: row.status,
      riskLevel: row.risk_level,
      riskScore: row.risk_score,
      messageCount: row.message_count,
      avgEmotionScore: row.avg_emotion_score,
      emotionTrend: row.emotion_trend,
      startedAt: row.started_at,
      endedAt: row.ended_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * 根据学生ID获取活跃会话
   */
  async findActiveByStudentId(studentId: string): Promise<PsychologySession | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('student_id', studentId)
      .eq('status', 'active')
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return this.toSession(data as PsychologySessionRow);
  }

  /**
   * 根据学生ID获取会话列表
   */
  async findByStudentId(
    studentId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<PsychologySession[]> {
    let query = this.client
      .from(this.tableName)
      .select('*')
      .eq('student_id', studentId)
      .order('started_at', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[PsychologySessionRepository] findByStudentId error:', error.message);
      return [];
    }

    return (data || []).map(row => this.toSession(row as PsychologySessionRow));
  }

  /**
   * 创建会话
   */
  async createSession(session: {
    studentId: string;
    status?: SessionStatus;
  }): Promise<PsychologySession | null> {
    // 生成 UUID
    const id = crypto.randomUUID();
    
    const { data, error } = await this.client
      .from(this.tableName)
      .insert({
        id,
        student_id: session.studentId,
        status: session.status || 'active',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[PsychologySessionRepository] createSession error:', error.message);
      return null;
    }

    return this.toSession(data as PsychologySessionRow);
  }

  /**
   * 更新会话状态
   */
  async updateStatus(
    sessionId: string,
    status: SessionStatus,
    riskLevel?: string,
    riskScore?: number
  ): Promise<PsychologySession | null> {
    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'ended') {
      updateData.ended_at = new Date().toISOString();
    }
    if (riskLevel) {
      updateData.risk_level = riskLevel;
    }
    if (riskScore !== undefined) {
      updateData.risk_score = riskScore;
    }

    const { data, error } = await this.client
      .from(this.tableName)
      .update(updateData)
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      console.error('[PsychologySessionRepository] updateStatus error:', error.message);
      return null;
    }

    return this.toSession(data as PsychologySessionRow);
  }

  /**
   * 分页查询会话
   */
  async findPaginatedSessions(options: QueryOptions): Promise<PaginatedResult<PsychologySession>> {
    const result = await this.findPaginated(options);
    return {
      ...result,
      data: result.data.map(row => this.toSession(row as PsychologySessionRow)),
    };
  }
}

// ============================================
// 消息 Repository
// ============================================

export class PsychologyMessageRepository extends BaseRepository<PsychologyMessageRow> {
  constructor() {
    super('psychology_messages');
  }

  /**
   * 转换数据库行为业务类型
   */
  private toMessage(row: PsychologyMessageRow): PsychologyMessage {
    return {
      id: row.id,
      sessionId: row.session_id,
      role: row.role as 'user' | 'assistant' | 'system',
      content: row.content,
      emotionScore: row.emotion_score ?? undefined,
      emotionLabels: row.emotion_labels,
      riskKeywords: row.risk_keywords,
      riskLevel: row.risk_level,
      createdAt: row.created_at,
    };
  }

  /**
   * 根据会话ID获取消息列表
   */
  async findBySessionId(sessionId: string, limit: number = 50): Promise<PsychologyMessage[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('[PsychologyMessageRepository] findBySessionId error:', error.message);
      return [];
    }

    return (data || []).map(row => this.toMessage(row as PsychologyMessageRow));
  }

  /**
   * 创建消息
   */
  async createMessage(message: {
    sessionId: string;
    role: string;
    content: string;
    emotionScore?: number;
    emotionLabels?: string[];
    riskKeywords?: string[];
    riskLevel?: string;
  }): Promise<PsychologyMessage | null> {
    const id = crypto.randomUUID();
    
    const { data, error } = await this.client
      .from(this.tableName)
      .insert({
        id,
        session_id: message.sessionId,
        role: message.role,
        content: message.content,
        emotion_score: message.emotionScore,
        emotion_labels: message.emotionLabels || [],
        risk_keywords: message.riskKeywords || [],
        risk_level: message.riskLevel,
      })
      .select()
      .single();

    if (error) {
      console.error('[PsychologyMessageRepository] createMessage error:', error.message);
      return null;
    }

    return this.toMessage(data as PsychologyMessageRow);
  }

  /**
   * 获取会话的最后一条消息
   */
  async findLastBySessionId(sessionId: string): Promise<PsychologyMessage | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return this.toMessage(data as PsychologyMessageRow);
  }
}

// ============================================
// 预警 Repository
// ============================================

export class PsychologyAlertRepository extends BaseRepository<PsychologyAlertRow> {
  constructor() {
    super('psychology_alerts');
  }

  /**
   * 转换数据库行为业务类型
   */
  private toAlert(row: PsychologyAlertRow): PsychologyAlert {
    return {
      id: row.id,
      sessionId: row.session_id,
      studentId: row.student_id,
      alertLevel: row.alert_level,
      alertType: row.alert_type,
      keywords: JSON.parse(row.keywords || '[]'),
      content: row.content,
      context: row.context,
      status: row.status,
      handlerId: row.handler_id,
      handlerName: row.handler_name,
      handledAt: row.handled_at,
      handleNotes: row.handle_notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

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
  }): Promise<PsychologyAlert | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .insert({
        session_id: alert.sessionId,
        student_id: alert.studentId,
        alert_level: alert.alertLevel,
        alert_type: alert.alertType,
        keywords: JSON.stringify(alert.keywords),
        content: alert.content,
        context: alert.context,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('[PsychologyAlertRepository] createAlert error:', error.message);
      return null;
    }

    return this.toAlert(data as PsychologyAlertRow);
  }

  /**
   * 根据状态获取预警列表
   */
  async findByStatus(
    status: AlertStatus,
    options?: { limit?: number; offset?: number }
  ): Promise<PsychologyAlert[]> {
    let query = this.client
      .from(this.tableName)
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[PsychologyAlertRepository] findByStatus error:', error.message);
      return [];
    }

    return (data || []).map(row => this.toAlert(row as PsychologyAlertRow));
  }

  /**
   * 获取最近预警
   */
  async findRecent(limit: number = 20): Promise<PsychologyAlert[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[PsychologyAlertRepository] findRecent error:', error.message);
      return [];
    }

    return (data || []).map(row => this.toAlert(row as PsychologyAlertRow));
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
  ): Promise<PsychologyAlert | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .update({
        status: handler.status,
        handler_id: handler.handlerId,
        handler_name: handler.handlerName,
        handled_at: new Date().toISOString(),
        handle_notes: handler.handleNotes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', alertId)
      .select()
      .single();

    if (error) {
      console.error('[PsychologyAlertRepository] handleAlert error:', error.message);
      return null;
    }

    return this.toAlert(data as PsychologyAlertRow);
  }

  /**
   * 统计预警数量
   */
  async getStatistics(): Promise<{
    total: number;
    byLevel: Record<AlertLevel, number>;
    byStatus: Record<AlertStatus, number>;
  }> {
    // 获取总数
    const { count: total, error: totalError } = await this.client
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });

    if (totalError) {
      console.error('[PsychologyAlertRepository] getStatistics error:', totalError.message);
      return { total: 0, byLevel: { red: 0, orange: 0, yellow: 0 }, byStatus: { pending: 0, processing: 0, resolved: 0, closed: 0 } };
    }

    // 按级别统计
    const byLevel: Record<AlertLevel, number> = { red: 0, orange: 0, yellow: 0 };
    for (const level of ['red', 'orange', 'yellow'] as AlertLevel[]) {
      const { count } = await this.client
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .eq('alert_level', level);
      byLevel[level] = count || 0;
    }

    // 按状态统计
    const byStatus: Record<AlertStatus, number> = { pending: 0, processing: 0, resolved: 0, closed: 0 };
    for (const status of ['pending', 'processing', 'resolved', 'closed'] as AlertStatus[]) {
      const { count } = await this.client
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .eq('status', status);
      byStatus[status] = count || 0;
    }

    return { total: total || 0, byLevel, byStatus };
  }
}

// ============================================
// 档案 Repository
// ============================================

export class PsychologyProfileRepository extends BaseRepository<PsychologyProfileRow> {
  constructor() {
    super('psychology_profiles');
  }

  /**
   * 转换数据库行为业务类型
   */
  private toProfile(row: PsychologyProfileRow): PsychologyProfile {
    return {
      id: row.id,
      studentId: row.student_id,
      riskLevel: row.risk_level,
      personalityTraits: JSON.parse(row.personality_traits || '{}'),
      emotionalPatterns: JSON.parse(row.emotional_patterns || '{}'),
      interests: row.interests ? JSON.parse(row.interests) : [],
      concerns: row.concerns ? JSON.parse(row.concerns) : [],
      lastSessionAt: row.last_session_at,
      totalSessions: row.total_sessions,
      totalDuration: row.total_duration,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * 根据学生ID获取档案
   */
  async findByStudentId(studentId: string): Promise<PsychologyProfile | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('student_id', studentId)
      .single();

    if (error || !data) {
      return null;
    }

    return this.toProfile(data as PsychologyProfileRow);
  }

  /**
   * 创建或更新档案
   */
  async upsertProfile(profile: {
    studentId: string;
    riskLevel?: string;
    personalityTraits?: Record<string, number>;
    emotionalPatterns?: Record<string, unknown>;
    interests?: string[];
    concerns?: string[];
    notes?: string;
  }): Promise<PsychologyProfile | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .upsert({
        student_id: profile.studentId,
        risk_level: profile.riskLevel || 'normal',
        personality_traits: JSON.stringify(profile.personalityTraits || {}),
        emotional_patterns: JSON.stringify(profile.emotionalPatterns || {}),
        interests: JSON.stringify(profile.interests || []),
        concerns: JSON.stringify(profile.concerns || []),
        notes: profile.notes,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'student_id' })
      .select()
      .single();

    if (error) {
      console.error('[PsychologyProfileRepository] upsertProfile error:', error.message);
      return null;
    }

    return this.toProfile(data as PsychologyProfileRow);
  }

  /**
   * 更新会话统计
   */
  async updateSessionStats(studentId: string, duration: number): Promise<boolean> {
    const existing = await this.findByStudentId(studentId);

    if (existing) {
      const { error } = await this.client
        .from(this.tableName)
        .update({
          total_sessions: existing.totalSessions + 1,
          total_duration: existing.totalDuration + duration,
          last_session_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('student_id', studentId);

      return !error;
    } else {
      // 创建新档案
      const result = await this.upsertProfile({
        studentId,
        totalSessions: 1,
        totalDuration: duration,
      } as Parameters<typeof this.upsertProfile>[0]);
      return !!result;
    }
  }
}

// ============================================
// 导出单例实例
// ============================================

export const psychologySessionRepository = new PsychologySessionRepository();
export const psychologyMessageRepository = new PsychologyMessageRepository();
export const psychologyAlertRepository = new PsychologyAlertRepository();
export const psychologyProfileRepository = new PsychologyProfileRepository();
