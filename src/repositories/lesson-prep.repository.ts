/**
 * 备课中心 Repository
 * 
 * @module repositories/lesson-prep.repository
 */

import { BaseRepository } from './base.repository';
import type { QueryOptions, PaginatedResult } from './base.repository';
import type {
  PrepDocument,
  PrepDocumentRow,
  PrepDocumentQueryParams,
  CreatePrepDocumentParams,
  UpdatePrepDocumentParams,
} from '@/types/lesson-prep';

/**
 * 备课文档 Repository
 */
export class LessonPrepRepository extends BaseRepository<PrepDocumentRow> {
  constructor() {
    super('prep_documents');
  }

  /**
   * 行类型转业务模型
   */
  private toModel(row: PrepDocumentRow): PrepDocument {
    return {
      id: row.id,
      teacherId: row.teacher_id,
      teacherName: row.teacher_name,
      subject: row.subject,
      docType: row.doc_type,
      title: row.title,
      content: row.content,
      metadata: row.metadata,
      status: row.status,
      version: row.version,
      tags: row.tags,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      publishedAt: row.published_at,
    };
  }

  /**
   * 业务模型转行类型
   */
  private toRow(data: Partial<PrepDocument>): Partial<PrepDocumentRow> {
    const row: Partial<PrepDocumentRow> = {};
    
    if (data.teacherId !== undefined) row.teacher_id = data.teacherId;
    if (data.teacherName !== undefined) row.teacher_name = data.teacherName;
    if (data.subject !== undefined) row.subject = data.subject;
    if (data.docType !== undefined) row.doc_type = data.docType;
    if (data.title !== undefined) row.title = data.title;
    if (data.content !== undefined) row.content = data.content;
    if (data.metadata !== undefined) row.metadata = data.metadata;
    if (data.status !== undefined) row.status = data.status;
    if (data.version !== undefined) row.version = data.version;
    if (data.tags !== undefined) row.tags = data.tags;
    if (data.publishedAt !== undefined) row.published_at = data.publishedAt;
    
    return row;
  }

  /**
   * 根据ID获取备课文档
   */
  async getDocumentById(id: string): Promise<PrepDocument | null> {
    const row = await this.findById(id);
    return row ? this.toModel(row) : null;
  }

  /**
   * 分页查询备课文档
   */
  async queryDocuments(params: PrepDocumentQueryParams): Promise<PaginatedResult<PrepDocument>> {
    const { page = 1, pageSize = 20, teacherId, subject, docType, status, grade, keyword } = params;
    
    const queryOptions: QueryOptions = {
      select: '*',
      pagination: { page, pageSize },
      orderBy: { column: 'updated_at', ascending: false },
    };

    const filters: Record<string, unknown> = {};
    if (teacherId) filters.teacher_id = teacherId;
    if (subject) filters.subject = subject;
    if (docType) filters.doc_type = docType;
    if (status) filters.status = status;
    
    queryOptions.filters = filters;

    if (keyword) {
      queryOptions.search = {
        fields: ['title', 'teacher_name'],
        value: keyword,
      };
    }

    const result = await this.findPaginated(queryOptions);
    
    return {
      ...result,
      data: result.data.map(row => this.toModel(row)),
    };
  }

  /**
   * 获取教师的备课文档
   */
  async getDocumentsByTeacher(teacherId: string, limit: number = 20): Promise<PrepDocument[]> {
    const rows = await this.findWhere({ teacher_id: teacherId });
    return rows.slice(0, limit).map(row => this.toModel(row));
  }

  /**
   * 创建备课文档
   */
  async createDocument(params: CreatePrepDocumentParams): Promise<PrepDocument> {
    const row = await this.create({
      teacher_id: params.teacherId,
      teacher_name: params.teacherName,
      subject: params.subject,
      doc_type: params.docType,
      title: params.title,
      content: params.content,
      metadata: params.metadata || {},
      status: 'draft',
      version: 1,
      tags: params.tags || [],
    } as Partial<PrepDocumentRow>);

    if (!row) {
      throw new Error('创建备课文档失败');
    }

    return this.toModel(row);
  }

  /**
   * 更新备课文档
   */
  async updateDocument(id: string, params: UpdatePrepDocumentParams): Promise<PrepDocument | null> {
    const updateData: Partial<PrepDocument> = {};
    
    if (params.title !== undefined) updateData.title = params.title;
    if (params.content !== undefined) updateData.content = params.content;
    if (params.metadata !== undefined) updateData.metadata = params.metadata;
    if (params.tags !== undefined) updateData.tags = params.tags;
    if (params.status !== undefined) {
      updateData.status = params.status;
      if (params.status === 'published') {
        updateData.publishedAt = new Date().toISOString();
      }
    }

    const row = await this.update(id, this.toRow(updateData));
    return row ? this.toModel(row) : null;
  }

  /**
   * 发布备课文档
   */
  async publishDocument(id: string): Promise<PrepDocument | null> {
    return this.updateDocument(id, { status: 'published' });
  }

  /**
   * 归档备课文档
   */
  async archiveDocument(id: string): Promise<PrepDocument | null> {
    return this.updateDocument(id, { status: 'archived' });
  }

  /**
   * 删除备课文档
   */
  async deleteDocument(id: string): Promise<boolean> {
    return this.delete(id);
  }

  /**
   * 增加版本号
   */
  async incrementVersion(id: string): Promise<PrepDocument | null> {
    const doc = await this.getDocumentById(id);
    if (!doc) return null;

    const row = await this.update(id, {
      version: doc.version + 1,
    } as Partial<PrepDocumentRow>);

    return row ? this.toModel(row) : null;
  }

  /**
   * 按学科统计文档数
   */
  async countBySubject(teacherId: string): Promise<Record<string, number>> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('subject')
      .eq('teacher_id', teacherId);

    if (error || !data) {
      return {};
    }

    const counts: Record<string, number> = {};
    for (const row of data) {
      const subject = row.subject as string;
      counts[subject] = (counts[subject] || 0) + 1;
    }

    return counts;
  }

  /**
   * 按类型统计文档数
   */
  async countByDocType(teacherId: string): Promise<Record<string, number>> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('doc_type')
      .eq('teacher_id', teacherId);

    if (error || !data) {
      return {};
    }

    const counts: Record<string, number> = {};
    for (const row of data) {
      const docType = row.doc_type as string;
      counts[docType] = (counts[docType] || 0) + 1;
    }

    return counts;
  }
}

/** 备课文档 Repository 实例 */
export const lessonPrepRepository = new LessonPrepRepository();
