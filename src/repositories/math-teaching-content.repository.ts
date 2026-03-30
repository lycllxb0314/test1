/**
 * 数学教学内容 Repository
 * 
 * 负责数学教学内容的数据库操作
 * 
 * @module repositories/math-teaching-content.repository
 */

import { BaseRepository, type QueryOptions, type PaginatedResult } from './base.repository';
import type {
  MathTeachingContent,
  MathTeachingContentRow,
  MathDomain,
  Semester,
  UnitGroup,
} from '@/types/math-prep';

/**
 * 数学教学内容 Repository
 */
export class MathTeachingContentRepository extends BaseRepository<MathTeachingContentRow> {
  constructor() {
    super('math_teaching_contents');
  }

  /**
   * 行转实体
   */
  private toEntity(row: MathTeachingContentRow): MathTeachingContent {
    return {
      id: row.id,
      grade: row.grade,
      semester: row.semester,
      domain: row.domain,
      unitName: row.unit_name,
      unitOrder: row.unit_order,
      contentName: row.content_name,
      contentKey: row.content_key,
      lessonType: row.lesson_type,
      priorKnowledge: row.prior_knowledge || [],
      subsequentExtension: row.subsequent_extension || [],
      coreCompetencies: row.core_competencies || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * 实体转行
   */
  private toRow(entity: Partial<MathTeachingContent>): Partial<MathTeachingContentRow> {
    return {
      id: entity.id,
      grade: entity.grade,
      semester: entity.semester,
      domain: entity.domain,
      unit_name: entity.unitName,
      unit_order: entity.unitOrder,
      content_name: entity.contentName,
      content_key: entity.contentKey,
      lesson_type: entity.lessonType,
      prior_knowledge: entity.priorKnowledge,
      subsequent_extension: entity.subsequentExtension,
      core_competencies: entity.coreCompetencies,
    };
  }

  /**
   * 按年级学期查询教学内容
   */
  async findByGradeAndSemester(
    grade: number,
    semester: Semester
  ): Promise<MathTeachingContent[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('grade', grade)
      .eq('semester', semester)
      .order('unit_order', { ascending: true });

    if (error) {
      console.error('[MathTeachingContentRepository] findByGradeAndSemester error:', error.message);
      return [];
    }

    return (data || []).map(this.toEntity);
  }

  /**
   * 按单元分组查询
   */
  async findGroupedByUnit(
    grade: number,
    semester: Semester
  ): Promise<UnitGroup[]> {
    const contents = await this.findByGradeAndSemester(grade, semester);

    const unitMap = new Map<number, UnitGroup>();

    contents.forEach((content) => {
      if (!unitMap.has(content.unitOrder)) {
        unitMap.set(content.unitOrder, {
          unitOrder: content.unitOrder,
          unitName: content.unitName,
          domain: content.domain,
          contents: [],
        });
      }
      unitMap.get(content.unitOrder)!.contents.push(content);
    });

    return Array.from(unitMap.values()).sort((a, b) => a.unitOrder - b.unitOrder);
  }

  /**
   * 按 ID 查询实体
   */
  async findEntityById(id: string): Promise<MathTeachingContent | null> {
    const row = await super.findById(id);
    return row ? this.toEntity(row) : null;
  }

  /**
   * 按 contentKey 查询
   */
  async findByContentKey(contentKey: string): Promise<MathTeachingContent | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('content_key', contentKey)
      .single();

    if (error) {
      console.error('[MathTeachingContentRepository] findByContentKey error:', error.message);
      return null;
    }

    return data ? this.toEntity(data as MathTeachingContentRow) : null;
  }

  /**
   * 按知识领域查询
   */
  async findByDomain(
    grade: number,
    semester: Semester,
    domain: MathDomain
  ): Promise<MathTeachingContent[]> {
    const contents = await this.findByGradeAndSemester(grade, semester);
    return contents.filter((c) => c.domain === domain);
  }

  /**
   * 创建教学内容
   */
  async createContent(
    content: Omit<MathTeachingContent, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<MathTeachingContent | null> {
    const row = this.toRow(content) as MathTeachingContentRow;
    const result = await super.create(row);
    return result ? this.toEntity(result) : null;
  }

  /**
   * 批量创建教学内容
   */
  async createManyContents(
    contents: Array<Omit<MathTeachingContent, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<MathTeachingContent[]> {
    const rows = contents.map((c) => this.toRow(c) as MathTeachingContentRow);
    const results = await super.createMany(rows);
    return results.map(this.toEntity);
  }

  /**
   * 更新教学内容
   */
  async updateContent(
    id: string,
    content: Partial<MathTeachingContent>
  ): Promise<MathTeachingContent | null> {
    const row = this.toRow(content);
    const result = await super.update(id, row);
    return result ? this.toEntity(result) : null;
  }

  /**
   * 删除教学内容
   */
  async deleteContent(id: string): Promise<boolean> {
    return super.delete(id);
  }

  /**
   * 获取所有年级列表
   */
  async getAvailableGrades(): Promise<number[]> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('grade')
      .order('grade', { ascending: true });

    if (error) {
      console.error('[MathTeachingContentRepository] getAvailableGrades error:', error.message);
      return [];
    }

    const grades = new Set((data || []).map((d) => d.grade));
    return Array.from(grades).sort((a, b) => a - b);
  }

  /**
   * 统计教学内容数量
   */
  async countByGrade(grade: number, semester?: Semester): Promise<number> {
    let query = this.client
      .from(this.tableName)
      .select('*', { count: 'exact', head: true })
      .eq('grade', grade);

    if (semester) {
      query = query.eq('semester', semester);
    }

    const { count, error } = await query;

    if (error) {
      console.error('[MathTeachingContentRepository] countByGrade error:', error.message);
      return 0;
    }

    return count || 0;
  }
}

// 导出单例
export const mathTeachingContentRepository = new MathTeachingContentRepository();
