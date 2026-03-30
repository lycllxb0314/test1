/**
 * 课文数据服务
 * 
 * 从预置数据库中读取小学语文课文信息
 * 数据按年级、学期、单元分类存储
 */

import { getSupabaseClient } from '@/storage/database/supabase-client';

// ==================== 类型定义 ====================

/** 服务结果类型 */
type ServiceResult<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
  code?: string;
};

/** 课文信息 */
export type TextbookLesson = {
  id: number;
  grade: number;
  semester: '上册' | '下册';
  unitNumber: number;
  unitTheme: string | null;
  lessonNumber: number;
  title: string;
  genre: '古诗' | '散文' | '童话' | '小说' | '说明文' | '议论文' | '其他';
  author: string | null;
  content: string | null;
  isRequired: boolean;
};

/** 单元分组 */
export type UnitGroup = {
  unitNumber: number;
  unitTheme: string;
  lessons: TextbookLesson[];
};

// ==================== 服务类 ====================

/**
 * 课文数据服务
 */
export class TextbookService {
  /**
   * 获取指定年级学期的课文列表（按单元分组）
   */
  async getLessonsByVolume(
    grade: number,
    semester: '上册' | '下册'
  ): Promise<ServiceResult<UnitGroup[]>> {
    try {
      const supabase = getSupabaseClient();
      
      const { data, error } = await supabase
        .from('textbook_lessons')
        .select('*')
        .eq('grade', grade)
        .eq('semester', semester)
        .order('unit_number', { ascending: true })
        .order('lesson_number', { ascending: true });
      
      if (error) {
        console.error('[TextbookService] getLessonsByVolume error:', error);
        return this.fail('获取课文列表失败', 'DATABASE_ERROR');
      }
      
      if (!data || data.length === 0) {
        return this.ok([]);
      }
      
      // 按单元分组
      const unitMap = new Map<number, UnitGroup>();
      
      for (const lesson of data) {
        const unitNum = lesson.unit_number;
        
        if (!unitMap.has(unitNum)) {
          unitMap.set(unitNum, {
            unitNumber: unitNum,
            unitTheme: lesson.unit_theme || `第${unitNum}单元`,
            lessons: [],
          });
        }
        
        unitMap.get(unitNum)!.lessons.push({
          id: lesson.id,
          grade: lesson.grade,
          semester: lesson.semester as '上册' | '下册',
          unitNumber: lesson.unit_number,
          unitTheme: lesson.unit_theme,
          lessonNumber: lesson.lesson_number,
          title: lesson.title,
          genre: lesson.genre as TextbookLesson['genre'],
          author: lesson.author,
          content: lesson.content,
          isRequired: lesson.is_required,
        });
      }
      
      return this.ok(Array.from(unitMap.values()));
    } catch (error) {
      console.error('[TextbookService] getLessonsByVolume error:', error);
      return this.fail('获取课文列表失败', 'INTERNAL_ERROR');
    }
  }

  /**
   * 获取指定课文的详细内容
   */
  async getLessonById(lessonId: number): Promise<ServiceResult<TextbookLesson | null>> {
    try {
      const supabase = getSupabaseClient();
      
      const { data, error } = await supabase
        .from('textbook_lessons')
        .select('*')
        .eq('id', lessonId)
        .single();
      
      if (error) {
        console.error('[TextbookService] getLessonById error:', error);
        return this.fail('获取课文内容失败', 'DATABASE_ERROR');
      }
      
      if (!data) {
        return this.ok(null);
      }
      
      return this.ok({
        id: data.id,
        grade: data.grade,
        semester: data.semester as '上册' | '下册',
        unitNumber: data.unit_number,
        unitTheme: data.unit_theme,
        lessonNumber: data.lesson_number,
        title: data.title,
        genre: data.genre as TextbookLesson['genre'],
        author: data.author,
        content: data.content,
        isRequired: data.is_required,
      });
    } catch (error) {
      console.error('[TextbookService] getLessonById error:', error);
      return this.fail('获取课文内容失败', 'INTERNAL_ERROR');
    }
  }

  /**
   * 搜索课文
   */
  async searchLessons(
    keyword: string,
    grade?: number,
    semester?: '上册' | '下册'
  ): Promise<ServiceResult<TextbookLesson[]>> {
    try {
      const supabase = getSupabaseClient();
      
      let query = supabase
        .from('textbook_lessons')
        .select('*')
        .ilike('title', `%${keyword}%`)
        .order('grade', { ascending: true })
        .order('unit_number', { ascending: true });
      
      if (grade) {
        query = query.eq('grade', grade);
      }
      
      if (semester) {
        query = query.eq('semester', semester);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('[TextbookService] searchLessons error:', error);
        return this.fail('搜索课文失败', 'DATABASE_ERROR');
      }
      
      const lessons = (data || []).map(item => ({
        id: item.id,
        grade: item.grade,
        semester: item.semester as '上册' | '下册',
        unitNumber: item.unit_number,
        unitTheme: item.unit_theme,
        lessonNumber: item.lesson_number,
        title: item.title,
        genre: item.genre as TextbookLesson['genre'],
        author: item.author,
        content: item.content,
        isRequired: item.is_required,
      }));
      
      return this.ok(lessons);
    } catch (error) {
      console.error('[TextbookService] searchLessons error:', error);
      return this.fail('搜索课文失败', 'INTERNAL_ERROR');
    }
  }
  
  // ==================== 辅助方法 ====================
  
  protected ok<T>(data: T): ServiceResult<T> {
    return { success: true, data };
  }
  
  protected fail<T = never>(
    error: string,
    code?: string
  ): ServiceResult<T> {
    return { success: false, error, code };
  }
}

/** 课文数据服务实例工厂 */
export function createTextbookService(): TextbookService {
  return new TextbookService();
}
