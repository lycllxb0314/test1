// 家校沟通助手 Repository

import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { HomeSchoolConversation, HomeSchoolMessage, HomeSchoolWarning, ContextType, EmotionLevel, RiskLevel, TriggerType, WarningRiskLevel, WarningTriggerType } from '@/types/home-school';

// 数据库行类型
type ConversationRow = {
  id: string;
  teacher_id: string;
  class_id: string | null;
  title: string | null;
  student_id: string | null;
  student_name: string | null;
  context_type: string;
  emotion_level: string;
  teacher_deleted: boolean;
  created_at: string;
  updated_at: string;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  teacher_deleted: boolean;
  created_at: string;
};

function mapConversation(row: ConversationRow): HomeSchoolConversation {
  return {
    id: row.id,
    teacherId: row.teacher_id,
    classId: row.class_id,
    title: row.title,
    studentId: row.student_id,
    studentName: row.student_name,
    contextType: row.context_type as ContextType,
    emotionLevel: row.emotion_level as EmotionLevel,
    teacherDeleted: row.teacher_deleted,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMessage(row: MessageRow): HomeSchoolMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    role: row.role as 'user' | 'assistant',
    content: row.content,
    teacherDeleted: row.teacher_deleted,
    createdAt: row.created_at,
  };
}

export const homeSchoolRepository = {
  // 创建会话
  async createConversation(params: {
    id: string;
    teacherId: string;
    classId?: string;
    studentId?: string;
    studentName?: string;
    contextType?: ContextType;
    title?: string;
  }): Promise<HomeSchoolConversation> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('home_school_conversations')
      .insert({
        id: params.id,
        teacher_id: params.teacherId,
        class_id: params.classId || null,
        student_id: params.studentId || null,
        student_name: params.studentName || null,
        context_type: params.contextType || 'general',
        title: params.title || null,
      })
      .select()
      .single();

    if (error) throw error;
    return mapConversation(data as ConversationRow);
  },

  // 获取教师的会话列表
  async findByTeacherId(teacherId: string): Promise<HomeSchoolConversation[]> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('home_school_conversations')
      .select('*')
      .eq('teacher_id', teacherId)
      .eq('teacher_deleted', false)
      .order('updated_at', { ascending: false });

    if (error) return [];
    return (data || []).map(mapConversation);
  },

  // 获取会话详情
  async findById(id: string): Promise<HomeSchoolConversation | null> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('home_school_conversations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return mapConversation(data as ConversationRow);
  },

  // 根据会话ID获取（别名，兼容service）
  async findByConversationId(id: string): Promise<HomeSchoolConversation | null> {
    return this.findById(id);
  },

  // 更新会话
  async updateConversation(id: string, updates: {
    title?: string;
    emotionLevel?: EmotionLevel;
    studentName?: string;
  }): Promise<void> {
    const client = getSupabaseClient();
    await client
      .from('home_school_conversations')
      .update({
        title: updates.title,
        emotion_level: updates.emotionLevel,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
  },

  // 软删除会话（教师端）
  async softDeleteByTeacher(id: string): Promise<void> {
    const client = getSupabaseClient();
    await client
      .from('home_school_conversations')
      .update({ teacher_deleted: true })
      .eq('id', id);
    await client
      .from('home_school_messages')
      .update({ teacher_deleted: true })
      .eq('conversation_id', id);
  },

  // 添加消息
  async addMessage(params: {
    id: string;
    conversationId: string;
    role: 'user' | 'assistant';
    content: string;
  }): Promise<HomeSchoolMessage> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('home_school_messages')
      .insert({
        id: params.id,
        conversation_id: params.conversationId,
        role: params.role,
        content: params.content,
      })
      .select()
      .single();

    if (error) throw error;
    return mapMessage(data as MessageRow);
  },

  // 获取会话消息
  async getMessages(conversationId: string, excludeTeacherDeleted = true): Promise<HomeSchoolMessage[]> {
    const client = getSupabaseClient();
    let query = client
      .from('home_school_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (excludeTeacherDeleted) {
      query = query.eq('teacher_deleted', false);
    }

    const { data, error } = await query;
    if (error) return [];
    return (data || []).map(mapMessage);
  },

  // ==================== 预警相关 ====================

  // 创建预警
  async createWarning(params: {
    id: string;
    conversationId: string;
    teacherId: string;
    teacherName?: string;
    classId?: string;
    className?: string;
    studentId?: string;
    studentName?: string;
    riskLevel: RiskLevel;
    triggerType: TriggerType;
    triggerSummary: string;
    recommendation?: string;
  }): Promise<HomeSchoolWarning> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('home_school_warnings')
      .insert({
        id: params.id,
        conversation_id: params.conversationId,
        teacher_id: params.teacherId,
        teacher_name: params.teacherName || null,
        class_id: params.classId || null,
        class_name: params.className || null,
        student_id: params.studentId || null,
        student_name: params.studentName || null,
        risk_level: params.riskLevel,
        trigger_type: params.triggerType,
        trigger_summary: params.triggerSummary,
        recommendation: params.recommendation || null,
      })
      .select()
      .single();

    if (error) throw error;
    return (data as Record<string, unknown>) as HomeSchoolWarning;
  },

  // 根据会话ID查找预警（返回该会话所有预警）
  async findWarningByConversationId(conversationId: string): Promise<HomeSchoolWarning[]> {
    const client = getSupabaseClient();
    const { data, error } = await client
      .from('home_school_warnings')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return (data as Record<string, unknown>[]) as HomeSchoolWarning[];
  },

  // 升级预警
  async updateWarning(id: string, updates: {
    riskLevel?: RiskLevel;
    triggerType?: string;
    triggerSummary?: string;
    recommendation?: string;
  }): Promise<void> {
    const client = getSupabaseClient();
    await client
      .from('home_school_warnings')
      .update({
        risk_level: updates.riskLevel,
        trigger_type: updates.triggerType,
        trigger_summary: updates.triggerSummary,
        recommendation: updates.recommendation,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
  },

  // 获取预警列表
  async getWarnings(filters?: {
    isHandled?: boolean;
    riskLevel?: RiskLevel;
  }): Promise<HomeSchoolWarning[]> {
    const client = getSupabaseClient();
    let query = client
      .from('home_school_warnings')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.isHandled !== undefined) {
      query = query.eq('is_handled', filters.isHandled);
    }
    if (filters?.riskLevel) {
      query = query.eq('risk_level', filters.riskLevel);
    }

    const { data, error } = await query;
    if (error || !data) return [];
    return data.map(row => ({
      id: row.id as string,
      conversationId: row.conversation_id as string,
      teacherId: row.teacher_id as string,
      teacherName: row.teacher_name as string | null,
      classId: row.class_id as string | null,
      className: row.class_name as string | null,
      studentId: row.student_id as string | null,
      studentName: row.student_name as string | null,
      riskLevel: row.risk_level as WarningRiskLevel,
      triggerType: row.trigger_type as WarningTriggerType,
      triggerSummary: row.trigger_summary as string,
      recommendation: row.recommendation as string | null,
      isHandled: row.is_handled as boolean,
      handlerId: row.handler_id as string | null,
      handlerName: row.handler_name as string | null,
      handleNote: row.handle_note as string | null,
      handledAt: row.handled_at as string | null,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    }));
  },

  // 处理预警
  async handleWarning(id: string, handlerId: string, handlerName: string, note: string): Promise<void> {
    const client = getSupabaseClient();
    await client
      .from('home_school_warnings')
      .update({
        is_handled: true,
        handler_id: handlerId,
        handler_name: handlerName,
        handle_note: note,
        handled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
  },
};
