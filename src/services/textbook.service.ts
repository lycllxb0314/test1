/**
 * 课文数据服务
 * 
 * 通过网络搜索获取小学语文各册课文信息
 * 
 * @module services/textbook-service
 */

import { BaseService, ServiceResult } from './base.service';
import { SearchClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';

/** 课文信息 */
export type TextbookLesson = {
  /** 课文ID */
  id: string;
  /** 课文标题 */
  title: string;
  /** 所属年级 */
  grade: number;
  /** 所属学期 (上/下) */
  semester: '上册' | '下册';
  /** 课文内容 */
  content: string;
  /** 文体类型 */
  genre: '古诗' | '散文' | '童话' | '小说' | '说明文' | '议论文' | '其他';
  /** 作者（如有） */
  author?: string;
  /** 单元名称 */
  unit?: string;
};

/** 册别信息 */
export type TextbookVolume = {
  /** 年级 */
  grade: number;
  /** 学期 */
  semester: '上册' | '下册';
  /** 册别名称 */
  name: string;
  /** 课文列表 */
  lessons: TextbookLesson[];
};

/** 教材版本 */
export type TextbookEdition = {
  /** 版本名称 */
  name: string;
  /** 出版社 */
  publisher: string;
  /** 册别列表 */
  volumes: TextbookVolume[];
};

/**
 * 课文数据服务
 */
export class TextbookService extends BaseService {
  private searchClient: SearchClient;

  constructor(customHeaders?: Record<string, string>) {
    super();
    const config = new Config();
    this.searchClient = new SearchClient(config, customHeaders);
  }

  /**
   * 搜索指定年级学期的课文列表
   */
  async searchLessonsByVolume(
    grade: number,
    semester: '上册' | '下册'
  ): Promise<ServiceResult<TextbookLesson[]>> {
    const gradeText = this.getGradeText(grade);
    const query = `人教版小学语文${gradeText}${semester}课文目录 全部课文标题`;
    
    try {
      const response = await this.searchClient.webSearch(query, 10, true);
      
      if (!response.web_items || response.web_items.length === 0) {
        return this.ok([]);
      }

      // 从搜索结果中提取课文信息
      const lessons = this.extractLessonsFromSearch(response.web_items, grade, semester);
      
      return this.ok(lessons);
    } catch (error) {
      console.error('[TextbookService] searchLessonsByVolume error:', error);
      return this.fail('搜索课文失败', 'SEARCH_FAILED');
    }
  }

  /**
   * 搜索指定课文的详细内容
   */
  async searchLessonContent(
    title: string,
    grade: number,
    semester: '上册' | '下册'
  ): Promise<ServiceResult<TextbookLesson | null>> {
    const gradeText = this.getGradeText(grade);
    const query = `人教版小学语文${gradeText}${semester}《${title}》课文原文`;
    
    try {
      const response = await this.searchClient.webSearch(query, 5, true);
      
      if (!response.web_items || response.web_items.length === 0) {
        return this.ok(null);
      }

      // 从搜索结果中提取课文内容
      const lesson = this.extractLessonContent(response.web_items, title, grade, semester);
      
      return this.ok(lesson);
    } catch (error) {
      console.error('[TextbookService] searchLessonContent error:', error);
      return this.fail('搜索课文内容失败', 'SEARCH_FAILED');
    }
  }

  /**
   * 批量搜索某册所有课文
   */
  async searchAllLessonsInVolume(
    grade: number,
    semester: '上册' | '下册'
  ): Promise<ServiceResult<TextbookLesson[]>> {
    // 首先获取课文列表
    const listResult = await this.searchLessonsByVolume(grade, semester);
    
    if (!listResult.success || !listResult.data || listResult.data.length === 0) {
      return listResult;
    }

    const lessons = listResult.data;
    
    // 逐个获取课文内容（限制并发，每次最多3个）
    const results: TextbookLesson[] = [];
    const batchSize = 3;
    
    for (let i = 0; i < lessons.length; i += batchSize) {
      const batch = lessons.slice(i, i + batchSize);
      const batchPromises = batch.map(async (lesson) => {
        const contentResult = await this.searchLessonContent(lesson.title, grade, semester);
        if (contentResult.success && contentResult.data) {
          return contentResult.data;
        }
        return lesson;
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // 添加小延迟避免请求过快
      if (i + batchSize < lessons.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return this.ok(results);
  }

  /**
   * 从搜索结果中提取课文列表
   */
  private extractLessonsFromSearch(
    webItems: Array<{ title: string; snippet: string; content?: string }>,
    grade: number,
    semester: '上册' | '下册'
  ): TextbookLesson[] {
    const lessons: TextbookLesson[] = [];
    const seen = new Set<string>();
    
    for (const item of webItems) {
      const text = item.content || item.snippet || '';
      
      // 尝试匹配课文标题模式
      // 常见格式：1. 春天 / 第一课 春天 / 第1课《春天》
      const patterns = [
        /第[一二三四五六七八九十\d]+[课课]?\s*[《]?([^《》\n]{2,10})[》]?/g,
        /[\d]+\.\s*[《]?([^《》\n]{2,10})[》]?/g,
        /[《]([^《》]{2,10})[》]/g,
      ];
      
      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(text)) !== null) {
          const title = match[1].trim();
          
          // 过滤无效标题
          if (this.isValidLessonTitle(title) && !seen.has(title)) {
            seen.add(title);
            lessons.push({
              id: `lesson-${grade}-${semester === '上册' ? 1 : 2}-${lessons.length + 1}`,
              title,
              grade,
              semester,
              content: '',
              genre: this.detectGenre(title),
            });
          }
        }
      }
    }
    
    return lessons;
  }

  /**
   * 从搜索结果中提取课文内容
   */
  private extractLessonContent(
    webItems: Array<{ title: string; snippet: string; content?: string; url?: string }>,
    lessonTitle: string,
    grade: number,
    semester: '上册' | '下册'
  ): TextbookLesson | null {
    for (const item of webItems) {
      const text = item.content || item.snippet || '';
      
      // 尝试提取课文正文（通常在特定标记之间）
      const contentPatterns = [
        /课文原文[：:]\s*([\s\S]{50,2000})/,
        /原文[：:]\s*([\s\S]{50,2000})/,
        /全文[：:]\s*([\s\S]{50,2000})/,
        /正文[：:]\s*([\s\S]{50,2000})/,
      ];
      
      for (const pattern of contentPatterns) {
        const match = text.match(pattern);
        if (match && match[1].length > 30) {
          let content = match[1]
            .replace(/<[^>]+>/g, '') // 移除HTML标签
            .replace(/\s+/g, ' ') // 合并空白
            .trim();
          
          // 截取合理长度
          if (content.length > 500) {
            content = content.slice(0, 500);
          }
          
          return {
            id: `lesson-${grade}-${semester === '上册' ? 1 : 2}-1`,
            title: lessonTitle,
            grade,
            semester,
            content,
            genre: this.detectGenre(lessonTitle),
          };
        }
      }
    }
    
    // 如果没有找到内容，返回基本信息
    return {
      id: `lesson-${grade}-${semester === '上册' ? 1 : 2}-1`,
      title: lessonTitle,
      grade,
      semester,
      content: '（内容获取中，请稍后重试或手动输入）',
      genre: this.detectGenre(lessonTitle),
    };
  }

  /**
   * 判断是否是有效的课文标题
   */
  private isValidLessonTitle(title: string): boolean {
    // 排除一些常见的非课文标题
    const invalidPatterns = [
      /^第[一二三四五六七八九十\d]+[单元课]/,
      /^语文$/,
      /^数学$/,
      /^英语$/,
      /^目录$/,
      /^练习$/,
      /^口语交际$/,
      /^习作$/,
      /^语文园地/,
      /^快乐读书吧$/,
      /^综合性学习/,
      /^单元\s*第/,  // "单元 第X课"
      /^单元\s*课文/,  // "单元 课文X"
      /^\d+$/,  // 纯数字
      /^[【\[\】\]]/,  // 以方括号开头结尾
      /】$/,  // 以特殊符号结尾
      /^\d+W/,  // 类似 "07W" 格式
      /义务教育/,  // 教材说明
      /教科书/,
    ];
    
    for (const pattern of invalidPatterns) {
      if (pattern.test(title)) {
        return false;
      }
    }
    
    // 必须是中文为主
    const chineseCount = (title.match(/[\u4e00-\u9fa5]/g) || []).length;
    if (chineseCount < title.length * 0.6) {
      return false;
    }
    
    // 标题长度在2-10字之间
    return title.length >= 2 && title.length <= 10;
  }

  /**
   * 根据标题判断文体
   */
  private detectGenre(title: string): TextbookLesson['genre'] {
    // 古诗特征
    if (/诗|词|曲|咏|望|思|送|忆|登/.test(title)) {
      return '古诗';
    }
    
    // 童话特征
    if (/童话|故事|王子|公主|小[动物]|森林/.test(title)) {
      return '童话';
    }
    
    // 小说/寓言特征
    if (/小说|寓言|三国|水浒|红楼/.test(title)) {
      return '小说';
    }
    
    // 说明文特征
    if (/说明|介绍|百科|科学|自然|动物|植物/.test(title)) {
      return '说明文';
    }
    
    // 默认散文
    return '散文';
  }

  /**
   * 获取年级文字描述
   */
  private getGradeText(grade: number): string {
    const gradeNames: Record<number, string> = {
      1: '一年级',
      2: '二年级',
      3: '三年级',
      4: '四年级',
      5: '五年级',
      6: '六年级',
    };
    return gradeNames[grade] || `${grade}年级`;
  }
}

/** 课文数据服务实例工厂 */
export function createTextbookService(customHeaders?: Record<string, string>): TextbookService {
  return new TextbookService(customHeaders);
}
