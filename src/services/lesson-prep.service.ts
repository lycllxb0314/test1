/**
 * 备课中心 Service
 * 
 * @module services/lesson-prep.service
 */

import { BaseService, ServiceResult, PaginatedServiceResult } from './base.service';
import { lessonPrepRepository } from '@/repositories/lesson-prep.repository';
import type {
  PrepDocument,
  PrepDocumentQueryParams,
  CreatePrepDocumentParams,
  UpdatePrepDocumentParams,
  SubjectType,
  PrepDocType,
  TextInterpretation,
  LessonDesign,
  ClassroomStrategy,
  CHINESE_TEACHING_PHILOSOPHY,
} from '@/types/lesson-prep';
import { SUBJECT_CONFIGS } from '@/types/lesson-prep';

/**
 * 备课中心服务
 */
export class LessonPrepService extends BaseService {
  /**
   * 获取学科配置
   */
  getSubjectConfigs(): ServiceResult<typeof SUBJECT_CONFIGS> {
    return this.ok(SUBJECT_CONFIGS);
  }

  /**
   * 获取单个学科配置
   */
  getSubjectConfig(subject: SubjectType): ServiceResult<typeof SUBJECT_CONFIGS[number] | null> {
    const config = SUBJECT_CONFIGS.find(c => c.type === subject);
    return this.ok(config || null);
  }

  /**
   * 获取备课文档详情
   */
  async getDocument(id: string): Promise<ServiceResult<PrepDocument>> {
    const doc = await lessonPrepRepository.getDocumentById(id);
    
    if (!doc) {
      return this.fail('备课文档不存在', 'NOT_FOUND');
    }
    
    return this.ok(doc);
  }

  /**
   * 分页查询备课文档
   */
  async queryDocuments(params: PrepDocumentQueryParams): Promise<PaginatedServiceResult<PrepDocument>> {
    const result = await lessonPrepRepository.queryDocuments(params);
    
    return {
      success: true,
      data: result.data,
      pagination: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  /**
   * 获取教师的备课文档
   */
  async getTeacherDocuments(teacherId: string, limit?: number): Promise<ServiceResult<PrepDocument[]>> {
    const docs = await lessonPrepRepository.getDocumentsByTeacher(teacherId, limit);
    return this.ok(docs);
  }

  /**
   * 创建备课文档
   */
  async createDocument(params: CreatePrepDocumentParams): Promise<ServiceResult<PrepDocument>> {
    // 验证学科类型
    const validSubject = SUBJECT_CONFIGS.some(c => c.type === params.subject);
    if (!validSubject) {
      return this.fail('无效的学科类型', 'INVALID_SUBJECT');
    }

    // 验证文档类型
    const validDocTypes: PrepDocType[] = [
      'text_interpretation',
      'lesson_design',
      'teaching_reflection',
      'resource_material',
      'classroom_strategy',
    ];
    if (!validDocTypes.includes(params.docType)) {
      return this.fail('无效的文档类型', 'INVALID_DOC_TYPE');
    }

    try {
      const doc = await lessonPrepRepository.createDocument(params);
      return this.ok(doc);
    } catch (error) {
      return this.fail('创建备课文档失败', 'CREATE_FAILED');
    }
  }

  /**
   * 更新备课文档
   */
  async updateDocument(id: string, params: UpdatePrepDocumentParams): Promise<ServiceResult<PrepDocument>> {
    const existing = await lessonPrepRepository.getDocumentById(id);
    if (!existing) {
      return this.fail('备课文档不存在', 'NOT_FOUND');
    }

    const doc = await lessonPrepRepository.updateDocument(id, params);
    
    if (!doc) {
      return this.fail('更新备课文档失败', 'UPDATE_FAILED');
    }
    
    return this.ok(doc);
  }

  /**
   * 发布备课文档
   */
  async publishDocument(id: string): Promise<ServiceResult<PrepDocument>> {
    const existing = await lessonPrepRepository.getDocumentById(id);
    if (!existing) {
      return this.fail('备课文档不存在', 'NOT_FOUND');
    }

    if (existing.status === 'published') {
      return this.fail('文档已发布', 'ALREADY_PUBLISHED');
    }

    const doc = await lessonPrepRepository.publishDocument(id);
    
    if (!doc) {
      return this.fail('发布失败', 'PUBLISH_FAILED');
    }
    
    return this.ok(doc);
  }

  /**
   * 归档备课文档
   */
  async archiveDocument(id: string): Promise<ServiceResult<PrepDocument>> {
    const existing = await lessonPrepRepository.getDocumentById(id);
    if (!existing) {
      return this.fail('备课文档不存在', 'NOT_FOUND');
    }

    const doc = await lessonPrepRepository.archiveDocument(id);
    
    if (!doc) {
      return this.fail('归档失败', 'ARCHIVE_FAILED');
    }
    
    return this.ok(doc);
  }

  /**
   * 删除备课文档
   */
  async deleteDocument(id: string): Promise<ServiceResult<boolean>> {
    const existing = await lessonPrepRepository.getDocumentById(id);
    if (!existing) {
      return this.fail('备课文档不存在', 'NOT_FOUND');
    }

    const success = await lessonPrepRepository.deleteDocument(id);
    
    if (!success) {
      return this.fail('删除失败', 'DELETE_FAILED');
    }
    
    return this.ok(true);
  }

  /**
   * 获取教师的文档统计
   */
  async getTeacherStatistics(teacherId: string): Promise<ServiceResult<{
    totalDocs: number;
    bySubject: Record<string, number>;
    byDocType: Record<string, number>;
    byStatus: Record<string, number>;
  }>> {
    const [bySubject, byDocType] = await Promise.all([
      lessonPrepRepository.countBySubject(teacherId),
      lessonPrepRepository.countByDocType(teacherId),
    ]);

    const totalDocs = Object.values(bySubject).reduce((a, b) => a + b, 0);

    return this.ok({
      totalDocs,
      bySubject,
      byDocType,
      byStatus: {}, // 简化实现
    });
  }

  /**
   * 创建文本解读文档（语文学科专用）
   */
  async createTextInterpretation(params: {
    teacherId: string;
    teacherName: string;
    title: string;
    textTitle: string;
    grade?: number;
  }): Promise<ServiceResult<PrepDocument>> {
    // 创建文本解读模板
    const template = {
      textTitle: params.textTitle,
      interpretation: {
        avoidStereotype: {
          identifiedPatterns: [],
          uniquePoints: [],
          deepMeaning: '',
        },
        tripleRole: {
          readerPerspective: '',
          teacherPerspective: '',
          studentPerspective: '',
          integration: '',
        },
        fourSystems: {
          themeSystem: '',
          contentSystem: '',
          methodSystem: '',
          emotionSystem: '',
        },
        textSensitivity: {
          keyWords: [],
          rhetoric: [],
          punctuation: [],
          blanks: [],
        },
        teachingValue: {
          firstLevel: '',
          secondLevel: '',
          thirdLevel: '',
          application: '',
        },
      },
      teachingPoints: [],
    };

    return this.createDocument({
      teacherId: params.teacherId,
      teacherName: params.teacherName,
      subject: 'chinese',
      docType: 'text_interpretation',
      title: params.title,
      content: template,
      metadata: {
        grade: params.grade,
      },
      tags: ['文本解读', '语文'],
    });
  }

  /**
   * 创建教学设计文档
   */
  async createLessonDesign(params: {
    teacherId: string;
    teacherName: string;
    subject: SubjectType;
    title: string;
    grade: number;
    lessonTitle: string;
    teachingHours?: number;
  }): Promise<ServiceResult<PrepDocument>> {
    // 创建教学设计模板
    const template: LessonDesign = {
      id: '',
      documentId: '',
      grade: params.grade,
      subject: params.subject,
      lessonTitle: params.lessonTitle,
      teachingObjectives: [],
      keyPoints: [],
      difficulties: [],
      teachingMethods: [],
      teachingProcess: [
        {
          id: 'step-1',
          order: 1,
          name: '导入新课',
          duration: 5,
          type: 'import',
          activities: [],
          teacherActions: [],
          studentActions: [],
          designIntent: '',
        },
        {
          id: 'step-2',
          order: 2,
          name: '新授内容',
          duration: 25,
          type: 'new_content',
          activities: [],
          teacherActions: [],
          studentActions: [],
          designIntent: '',
        },
        {
          id: 'step-3',
          order: 3,
          name: '课堂小结',
          duration: 5,
          type: 'summary',
          activities: [],
          teacherActions: [],
          studentActions: [],
          designIntent: '',
        },
      ],
      boardDesign: '',
      homeworkDesign: [],
      reflection: '',
      createdAt: '',
      updatedAt: '',
    };

    return this.createDocument({
      teacherId: params.teacherId,
      teacherName: params.teacherName,
      subject: params.subject,
      docType: 'lesson_design',
      title: params.title,
      content: template,
      metadata: {
        grade: params.grade,
        teachingHours: params.teachingHours || 1,
      },
      tags: ['教学设计'],
    });
  }

  /**
   * 创建课堂策略文档
   */
  async createClassroomStrategy(params: {
    teacherId: string;
    teacherName: string;
    subject: SubjectType;
    title: string;
    grade?: number;
  }): Promise<ServiceResult<PrepDocument>> {
    // 创建课堂策略模板
    const template: ClassroomStrategy = {
      id: '',
      documentId: '',
      stateStrategy: [],
      structureStrategy: {
        surfaceContent: '',
        focusPoints: {
          firstLevel: '',
          secondLevel: '',
          selectionReason: '',
        },
        progressionLogic: '',
      },
      rhythmStrategy: {
        risingPoints: [],
        settlingZones: [],
        transition: '',
      },
      questionDesign: [],
      evaluationLanguage: [],
      createdAt: '',
      updatedAt: '',
    };

    return this.createDocument({
      teacherId: params.teacherId,
      teacherName: params.teacherName,
      subject: params.subject,
      docType: 'classroom_strategy',
      title: params.title,
      content: template,
      metadata: {
        grade: params.grade,
      },
      tags: ['课堂策略'],
    });
  }
}

/** 备课中心服务实例 */
export const lessonPrepService = new LessonPrepService();
