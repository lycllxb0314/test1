/**
 * 附小少年服务
 *
 * 处理五大类别学生展示数据的业务逻辑
 */

import { BaseService, ServiceResult } from './base.service';
import { studentShowcaseRepository } from '@/repositories/student-showcase.repository';
import type {
  StudentShowcase,
  StudentShowcaseFormData,
  StudentShowcaseRow,
  ShowcaseCategory,
} from '@/types/student-showcase';
import { mapRowToModel, mapModelToRow } from '@/types/student-showcase';

export class StudentShowcaseService extends BaseService {
  async getList(category?: ShowcaseCategory, limit: number = 50): Promise<ServiceResult<StudentShowcase[]>> {
    try {
      const rows = category
        ? await studentShowcaseRepository.findByCategory(category, limit)
        : await studentShowcaseRepository.findActive(limit);
      const data = rows.map(mapRowToModel);
      return this.ok(data);
    } catch (error) {
      console.error('[StudentShowcaseService] getList error:', error);
      return this.fail('获取附小少年数据失败');
    }
  }

  async getListForAdmin(includeInactive: boolean = false, limit: number = 200): Promise<ServiceResult<StudentShowcase[]>> {
    try {
      const rows = await studentShowcaseRepository.findAllForAdmin(includeInactive, limit);
      const data = rows.map(mapRowToModel);
      return this.ok(data);
    } catch (error) {
      console.error('[StudentShowcaseService] getListForAdmin error:', error);
      return this.fail('获取附小少年数据失败');
    }
  }

  async getById(id: string): Promise<ServiceResult<StudentShowcase>> {
    try {
      const row = await studentShowcaseRepository.findById(id);
      if (!row) return this.fail('记录不存在', 'NOT_FOUND');
      return this.ok(mapRowToModel(row as StudentShowcaseRow));
    } catch (error) {
      console.error('[StudentShowcaseService] getById error:', error);
      return this.fail('获取详情失败');
    }
  }

  async create(data: StudentShowcaseFormData): Promise<ServiceResult<StudentShowcase>> {
    try {
      const row = await studentShowcaseRepository.create({
        ...mapModelToRow(data),
        is_active: data.isActive ?? true,
        sort_order: data.sortOrder || 0,
      });
      if (!row) return this.fail('创建失败');
      return this.ok(mapRowToModel(row as StudentShowcaseRow));
    } catch (error) {
      console.error('[StudentShowcaseService] create error:', error);
      return this.fail('创建失败');
    }
  }

  async update(id: string, data: Partial<StudentShowcaseFormData>): Promise<ServiceResult<StudentShowcase>> {
    try {
      const row = await studentShowcaseRepository.update(id, mapModelToRow(data));
      if (!row) return this.fail('更新失败');
      return this.ok(mapRowToModel(row as StudentShowcaseRow));
    } catch (error) {
      console.error('[StudentShowcaseService] update error:', error);
      return this.fail('更新失败');
    }
  }

  async delete(id: string): Promise<ServiceResult<boolean>> {
    try {
      const success = await studentShowcaseRepository.delete(id);
      return this.ok(success);
    } catch (error) {
      console.error('[StudentShowcaseService] delete error:', error);
      return this.fail('删除失败');
    }
  }
}

export const studentShowcaseService = new StudentShowcaseService();
