/**
 * 教学资源库 Service 层
 * 
 * 六层架构第二层：业务逻辑层
 * 负责处理业务规则、数据转换和跨 Repository 协调
 * 
 * @module services/teaching-resource
 */

import { teachingResourceRepository } from '@/repositories/teaching-resource.repository';
import type {
  TeachingResource,
  CreateResourceRequest,
  UpdateResourceRequest,
  ResourceQueryParams,
  ResourceListItem,
  ResourceStatistics,
  ResourceCategory,
  ResourceType,
  CharacterResourceContent,
  ReadingResourceContent,
} from '@/types/teaching-resource';

// ==================== 常量定义 ====================

/** 资源分类名称映射 */
export const CATEGORY_NAMES: Record<ResourceCategory, string> = {
  chinese_character: '语文·生字专项',
  chinese_reading: '语文·朗读教学',
  chinese_writing: '语文·习作专项',
  chinese_chat: '语文·备课智能体',
  math: '数学·备课中心',
  math_concept: '数学·概念教学',
  math_problem: '数学·问题设计',
  lesson_plan: '教案',
  courseware: '课件',
  video: '视频',
  other: '其他',
};

/** 资源类型名称映射 */
export const TYPE_NAMES: Record<ResourceType, string> = {
  character_card: '生字卡片',
  stroke_animation: '笔顺动画',
  ontology_derivation: '本体论推导',
  dictation_list: '听写清单',
  exercise_set: '配套练习',
  reading_audio: '范读音频',
  reading_annotation: '朗读标注',
  reading_guidance: '朗读指导',
  writing_outline: '写作提纲',
  writing_material: '写作素材',
  writing_task: '分层任务',
  text_analysis: '文本解读',
  lesson_design: '教学设计',
  question_design: '问题设计',
  full_package: '完整资源包',
  lesson_plan_file: '教案文件',
  courseware_file: '课件文件',
  video_file: '视频文件',
  document_file: '文档文件',
  other: '其他',
};

// ==================== Service 类 ====================

/**
 * 教学资源 Service
 */
export class TeachingResourceService {
  /**
   * 创建资源
   */
  async createResource(
    teacherId: string,
    teacherName: string | undefined,
    request: CreateResourceRequest
  ): Promise<TeachingResource> {
    // 验证必填字段
    if (!request.title?.trim()) {
      throw new Error('资源标题不能为空');
    }
    if (!request.content || Object.keys(request.content).length === 0) {
      throw new Error('资源内容不能为空');
    }

    // 创建资源
    return teachingResourceRepository.create({
      ...request,
      teacherId,
      teacherName,
    });
  }

  /**
   * 保存生字专项资源
   */
  async saveCharacterResource(
    teacherId: string,
    teacherName: string | undefined,
    data: {
      characters: string[];
      grade: number;
      content: CharacterResourceContent;
    }
  ): Promise<TeachingResource> {
    const { characters, grade, content } = data;

    // 生成标题
    const title = `生字教学资源：${characters.join('、')}`;

    // 生成描述
    const description = `${grade}年级生字专项教学素材，包含${characters.length}个生字的卡片、本体论推导、听写清单和配套练习。`;

    return this.createResource(teacherId, teacherName, {
      category: 'chinese_character',
      type: 'full_package',
      subject: '语文',
      grade,
      title,
      description,
      content: content as unknown as Record<string, unknown>,
      lessonTitle: characters.join('、'),
    });
  }

  /**
   * 保存朗读教学资源
   */
  async saveReadingResource(
    teacherId: string,
    teacherName: string | undefined,
    data: {
      lessonInfo: ReadingResourceContent['lessonInfo'];
      content: ReadingResourceContent;
    }
  ): Promise<TeachingResource> {
    const { lessonInfo, content } = data;

    // 生成标题
    const title = `朗读教学资源：${lessonInfo.title}`;

    // 生成描述
    const description = `${lessonInfo.grade}年级《${lessonInfo.title}》朗读教学素材，包含本体论推导、朗读主体培育、情感朗读模型、教学策略和范读音频。`;

    return this.createResource(teacherId, teacherName, {
      category: 'chinese_reading',
      type: 'full_package',
      subject: '语文',
      grade: lessonInfo.grade,
      title,
      description,
      content: content as unknown as Record<string, unknown>,
      lessonTitle: lessonInfo.title,
    });
  }

  /**
   * 保存习作教学资源
   */
  async saveWritingResource(
    teacherId: string,
    teacherName: string | undefined,
    data: {
      lessonInfo: {
        title: string;
        grade: number;
        writingType: string;
        unit: string;
      };
      writingContent: Record<string, unknown>;
    }
  ): Promise<TeachingResource> {
    const { lessonInfo, writingContent } = data;

    // 生成标题
    const title = `习作教学资源：${lessonInfo.title}`;

    // 生成描述
    const description = `${lessonInfo.grade}年级《${lessonInfo.title}》习作教学素材，包含写作提纲、好词好句、分层任务、评改指导和常见问题预设。`;

    return this.createResource(teacherId, teacherName, {
      category: 'chinese_writing',
      type: 'full_package',
      subject: '语文',
      grade: lessonInfo.grade,
      title,
      description,
      content: writingContent,
      lessonTitle: lessonInfo.title,
    });
  }

  /**
   * 获取资源详情
   */
  async getResource(id: string): Promise<TeachingResource | null> {
    const resource = await teachingResourceRepository.findById(id);
    
    if (resource) {
      // 增加查看次数
      await teachingResourceRepository.incrementViewCount(id);
    }

    return resource;
  }

  /**
   * 查询资源列表
   */
  async getResources(
    teacherId: string | undefined,
    params: ResourceQueryParams
  ): Promise<{ items: ResourceListItem[]; total: number }> {
    return teachingResourceRepository.findMany({
      ...params,
      ...(teacherId && { teacherId }),
    });
  }

  /**
   * 更新资源
   */
  async updateResource(
    id: string,
    teacherId: string,
    data: UpdateResourceRequest
  ): Promise<TeachingResource> {
    // 验证资源归属
    const existing = await teachingResourceRepository.findById(id);
    if (!existing) {
      throw new Error('资源不存在');
    }
    if (existing.teacherId !== teacherId) {
      throw new Error('无权修改此资源');
    }

    return teachingResourceRepository.update(id, data);
  }

  /**
   * 删除资源
   */
  async deleteResource(id: string, teacherId: string): Promise<void> {
    // 验证资源归属
    const existing = await teachingResourceRepository.findById(id);
    if (!existing) {
      throw new Error('资源不存在');
    }
    if (existing.teacherId !== teacherId) {
      throw new Error('无权删除此资源');
    }

    await teachingResourceRepository.delete(id);
  }

  /**
   * 获取统计数据
   */
  async getStatistics(teacherId: string): Promise<ResourceStatistics> {
    return teachingResourceRepository.getStatistics(teacherId);
  }

  /**
   * 标记资源已使用
   */
  async markAsUsed(id: string): Promise<void> {
    await teachingResourceRepository.incrementUseCount(id);
  }

  /**
   * 发布资源
   */
  async publishResource(id: string, teacherId: string): Promise<TeachingResource> {
    return this.updateResource(id, teacherId, { status: 'published' });
  }

  /**
   * 归档资源
   */
  async archiveResource(id: string, teacherId: string): Promise<TeachingResource> {
    return this.updateResource(id, teacherId, { status: 'archived' });
  }
}

// ==================== 单例导出 ====================

export const teachingResourceService = new TeachingResourceService();
