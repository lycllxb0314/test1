/**
 * 心理健康数据仓库
 * 
 * 管理聊天会话、消息、预警记录、授权密钥的数据访问
 */

import { BaseRepository } from './base.repository';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type {
  AuthorizationKey,
  ChatSession,
  MentalChatMessage,
  MentalHealthWarning,
} from '@/types/mental-health';

// ==================== 授权密钥 ====================

export class AuthKeyRepository extends BaseRepository<AuthorizationKey> {
  constructor() {
    super('mental_health_authorization_keys');
  }

  async findByKeyCode(keyCode: string): Promise<AuthorizationKey | null> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from(this.tableName)
      .select('*')
      .eq('key_code', keyCode)
      .eq('is_active', true)
      .single();

    if (error || !data) return null;
    return this.mapRow(data);
  }

  async incrementUsage(id: string): Promise<void> {
    const client = getSupabaseClient();
    await client.rpc('increment_auth_key_usage', { key_id: id });
  }

  async deactivate(id: string): Promise<void> {
    const client = getSupabaseClient();
    await client
      .from(this.tableName)
      .update({ is_active: false })
      .eq('id', id);
  }

  async findActiveByCreator(createdBy: string): Promise<AuthorizationKey[]> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from(this.tableName)
      .select('*')
      .eq('created_by', createdBy)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map(row => this.mapRow(row));
  }

  async findAllActive(): Promise<AuthorizationKey[]> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from(this.tableName)
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map(row => this.mapRow(row));
  }

  private mapRow(row: Record<string, unknown>): AuthorizationKey {
    return {
      id: row.id as string,
      keyCode: row.key_code as string,
      createdBy: row.created_by as string,
      createdByName: row.created_by_name as string,
      description: row.description as string | null,
      scope: row.scope as 'class' | 'student' | 'all',
      targetClassId: row.target_class_id as string | null,
      targetStudentId: row.target_student_id as string | null,
      maxUses: row.max_uses as number,
      usedCount: row.used_count as number,
      expiresAt: row.expires_at as string,
      isActive: row.is_active as boolean,
      createdAt: row.created_at as string,
    };
  }
}

// ==================== 聊天会话 ====================

export class ChatSessionRepository extends BaseRepository<ChatSession> {
  constructor() {
    super('mental_health_chat_sessions');
  }

  async findByStudentId(studentId: string): Promise<ChatSession[]> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from(this.tableName)
      .select('*')
      .eq('student_id', studentId)
      .neq('student_deleted', true)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map(row => this.mapRow(row));
  }

  async findByAnonymousId(anonymousId: string): Promise<ChatSession | null> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from(this.tableName)
      .select('*')
      .eq('anonymous_id', anonymousId)
      .single();

    if (error || !data) return null;
    return this.mapRow(data);
  }

  async findById(id: string): Promise<ChatSession | null> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return this.mapRow(data);
  }

  async createSession(studentId: string, anonymousId: string, title?: string): Promise<ChatSession> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from(this.tableName)
      .insert({
        student_id: studentId,
        anonymous_id: anonymousId,
        title: title || '新的对话',
      })
      .select()
      .single();

    if (error) throw new Error(`创建会话失败: ${error.message}`);
    return this.mapRow(data);
  }

  async updateTitle(id: string, title: string): Promise<void> {
    const client = getSupabaseClient();
    await client
      .from(this.tableName)
      .update({ title, updated_at: new Date().toISOString() })
      .eq('id', id);
  }

  async updateEmotion(id: string, emotionLevel: string, summary?: string): Promise<void> {
    const client = getSupabaseClient();
    await client
      .from(this.tableName)
      .update({
        emotion_level: emotionLevel,
        emotion_summary: summary,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
  }

  async incrementTurn(id: string): Promise<void> {
    const client = getSupabaseClient();
    const session = await this.findById(id);
    if (session) {
      await client
        .from(this.tableName)
        .update({ turn_count: session.turnCount + 1 })
        .eq('id', id);
    }
  }

  async closeSession(id: string): Promise<void> {
    const client = getSupabaseClient();
    await client
      .from(this.tableName)
      .update({
        is_closed: true,
        closed_at: new Date().toISOString(),
      })
      .eq('id', id);
  }

  /** 软删除：对学生隐藏会话，后端数据保留（预警等不受影响） */
  async softDeleteByStudent(id: string): Promise<void> {
    const client = getSupabaseClient();
    // 标记会话为学生已删除
    await client
      .from(this.tableName)
      .update({ student_deleted: true })
      .eq('id', id);
    // 标记关联消息为学生已删除
    await client
      .from('mental_health_messages')
      .update({ student_deleted: true })
      .eq('session_id', id);
  }

  async countByFilter(studentIds?: string[]): Promise<number> {
    const client = getSupabaseClient();
    let query = client.from(this.tableName).select('id', { count: 'exact', head: true });
    if (studentIds && studentIds.length > 0) {
      query = query.in('student_id', studentIds);
    }
    const { count } = await query;
    return count ?? 0;
  }

  async countActiveByFilter(studentIds?: string[]): Promise<number> {
    const client = getSupabaseClient();
    let query = client.from(this.tableName).select('id', { count: 'exact', head: true }).eq('is_closed', false);
    if (studentIds && studentIds.length > 0) {
      query = query.in('student_id', studentIds);
    }
    const { count } = await query;
    return count ?? 0;
  }

  async findByClassId(classId: string, studentIds: string[]): Promise<ChatSession[]> {
    if (studentIds.length === 0) return [];
    const client = getSupabaseClient();
    const { data, error } = await client
      .from(this.tableName)
      .select('*')
      .in('student_id', studentIds)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map(row => this.mapRow(row));
  }

  // 获取所有会话（支持分页）
  async findAllPaginated(page: number, pageSize: number): Promise<{ sessions: ChatSession[]; total: number }> {
    const client = getSupabaseClient();
    const offset = (page - 1) * pageSize;

    // 获取总数
    const { count } = await client
      .from(this.tableName)
      .select('id', { count: 'exact', head: true });

    // 获取分页数据
    const { data, error } = await client
      .from(this.tableName)
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error || !data) return { sessions: [], total: 0 };
    return { sessions: data.map(row => this.mapRow(row)), total: count ?? 0 };
  }

  async countByEmotionLevel(studentIds: string[]): Promise<Record<string, number>> {
    if (studentIds.length === 0) return {};
    const client = getSupabaseClient();
    const { data, error } = await client
      .from(this.tableName)
      .select('emotion_level')
      .in('student_id', studentIds);

    if (error || !data) return {};
    const counts: Record<string, number> = { green: 0, yellow: 0, red: 0 };
    for (const row of data) {
      const level = row.emotion_level as string;
      if (level in counts) counts[level]++;
    }
    return counts;
  }

  private mapRow(row: Record<string, unknown>): ChatSession {
    return {
      id: row.id as string,
      studentId: row.student_id as string,
      anonymousId: row.anonymous_id as string,
      title: row.title as string,
      emotionLevel: row.emotion_level as 'green' | 'yellow' | 'red',
      emotionSummary: row.emotion_summary as string | null,
      turnCount: row.turn_count as number,
      isClosed: row.is_closed as boolean,
      closedAt: row.closed_at as string | null,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  }
}

// ==================== 聊天消息 ====================

export class MentalChatMessageRepository extends BaseRepository<MentalChatMessage> {
  constructor() {
    super('mental_health_messages');
  }

  async findBySessionId(sessionId: string, excludeStudentDeleted = false): Promise<MentalChatMessage[]> {
    const client = getSupabaseClient();
    let query = client
      .from(this.tableName)
      .select('*')
      .eq('session_id', sessionId);

    if (excludeStudentDeleted) {
      query = query.neq('student_deleted', true);
    }

    const { data, error } = await query.order('created_at', { ascending: true });

    if (error || !data) return [];
    return data.map(row => this.mapRow(row));
  }

  async createMessage(params: {
    sessionId: string;
    role: string;
    content: string;
    desensitizedContent?: string;
    sensitivityFlag?: string;
    sensitivityTags?: string[];
  }): Promise<MentalChatMessage> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from(this.tableName)
      .insert({
        session_id: params.sessionId,
        role: params.role,
        content: params.content,
        desensitized_content: params.desensitizedContent || params.content,
        sensitivity_flag: params.sensitivityFlag || 'safe',
        sensitivity_tags: params.sensitivityTags || [],
      })
      .select()
      .single();

    if (error) throw new Error(`创建消息失败: ${error.message}`);
    return this.mapRow(data);
  }

  async findSensitiveBySessionId(sessionId: string): Promise<MentalChatMessage[]> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from(this.tableName)
      .select('*')
      .eq('session_id', sessionId)
      .in('sensitivity_flag', ['sensitive', 'critical'])
      .order('created_at', { ascending: true });

    if (error || !data) return [];
    return data.map(row => this.mapRow(row));
  }

  private mapRow(row: Record<string, unknown>): MentalChatMessage {
    return {
      id: row.id as string,
      sessionId: row.session_id as string,
      role: row.role as 'user' | 'assistant' | 'system',
      content: row.content as string,
      desensitizedContent: row.desensitized_content as string,
      sensitivityFlag: row.sensitivity_flag as 'safe' | 'sensitive' | 'critical',
      sensitivityTags: row.sensitivity_tags as string[],
      createdAt: row.created_at as string,
    };
  }
}

// ==================== 预警记录 ====================

export class MentalHealthWarningRepository extends BaseRepository<MentalHealthWarning> {
  constructor() {
    super('mental_health_warnings');
  }

  async findByStudentId(studentId: string): Promise<MentalHealthWarning[]> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from(this.tableName)
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map(row => this.mapRow(row));
  }

  async findUnread(): Promise<MentalHealthWarning[]> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from(this.tableName)
      .select('*')
      .eq('is_read', false)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map(row => this.mapRow(row));
  }

  async findUnreadByClass(studentIds: string[]): Promise<MentalHealthWarning[]> {
    if (studentIds.length === 0) return [];
    const client = getSupabaseClient();
    const { data, error } = await client
      .from(this.tableName)
      .select('*')
      .in('student_id', studentIds)
      .eq('is_read', false)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map(row => this.mapRow(row));
  }

  async findBySessionId(sessionId: string): Promise<MentalHealthWarning | null> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from(this.tableName)
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return this.mapRow(data);
  }

  async upgradeWarning(id: string, params: {
    severity?: string;
    warningType?: string;
    title?: string;
    description?: string;
    keywords?: string[];
  }): Promise<void> {
    const client = getSupabaseClient();
    const updateData: Record<string, unknown> = {};
    if (params.severity) updateData.severity = params.severity;
    if (params.warningType) updateData.warning_type = params.warningType;
    if (params.title) updateData.title = params.title;
    if (params.description) updateData.description = params.description;
    if (params.keywords) updateData.keywords = params.keywords;

    await client
      .from(this.tableName)
      .update(updateData)
      .eq('id', id);
  }

  async createWarning(params: {
    studentId: string;
    sessionId?: string;
    warningType: string;
    severity: string;
    title: string;
    description: string;
    keywords: string[];
  }): Promise<MentalHealthWarning> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from(this.tableName)
      .insert({
        student_id: params.studentId,
        session_id: params.sessionId || null,
        warning_type: params.warningType,
        severity: params.severity,
        title: params.title,
        description: params.description,
        keywords: params.keywords,
      })
      .select()
      .single();

    if (error) throw new Error(`创建预警失败: ${error.message}`);
    return this.mapRow(data);
  }

  async markAsRead(id: string, readBy: string): Promise<void> {
    const client = getSupabaseClient();
    await client
      .from(this.tableName)
      .update({
        is_read: true,
        read_by: readBy,
        read_at: new Date().toISOString(),
      })
      .eq('id', id);
  }

  async markAsHandled(id: string, handledBy: string, note: string): Promise<void> {
    const client = getSupabaseClient();
    await client
      .from(this.tableName)
      .update({
        is_handled: true,
        handled_by: handledBy,
        handled_at: new Date().toISOString(),
        handle_note: note,
      })
      .eq('id', id);
  }

  async countBySeverity(studentIds?: string[]): Promise<Record<string, number>> {
    const client = getSupabaseClient();
    let query = client.from(this.tableName).select('severity');

    if (studentIds && studentIds.length > 0) {
      query = query.in('student_id', studentIds);
    }

    const { data, error } = await query;
    if (error || !data) return { yellow: 0, red: 0 };

    const counts: Record<string, number> = { yellow: 0, red: 0 };
    for (const row of data) {
      const sev = row.severity as string;
      if (sev in counts) counts[sev]++;
    }
    return counts;
  }

  async countUnread(studentIds?: string[]): Promise<number> {
    const client = getSupabaseClient();
    let query = client
      .from(this.tableName)
      .select('id', { count: 'exact', head: true })
      .eq('is_read', false);

    if (studentIds && studentIds.length > 0) {
      query = query.in('student_id', studentIds);
    }

    const { count, error } = await query;
    if (error) return 0;
    return count ?? 0;
  }

  async findWarnings(studentIds?: string[]): Promise<MentalHealthWarning[]> {
    const client = getSupabaseClient();
    let query = client
      .from(this.tableName)
      .select('*');

    if (studentIds && studentIds.length > 0) {
      query = query.in('student_id', studentIds);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map(row => this.mapRow(row));
  }

  private mapRow(row: Record<string, unknown>): MentalHealthWarning {
    return {
      id: row.id as string,
      studentId: row.student_id as string,
      sessionId: row.session_id as string | null,
      warningType: row.warning_type as 'red_line' | 'sensitive' | 'trend',
      severity: row.severity as 'yellow' | 'red',
      title: row.title as string,
      description: row.description as string,
      keywords: row.keywords as string[],
      isRead: row.is_read as boolean,
      readBy: row.read_by as string | null,
      readAt: row.read_at as string | null,
      isHandled: row.is_handled as boolean,
      handledBy: row.handled_by as string | null,
      handledAt: row.handled_at as string | null,
      handleNote: row.handle_note as string | null,
      createdAt: row.created_at as string,
    };
  }
}
