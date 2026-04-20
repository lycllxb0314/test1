/**
 * 卓越教师服务
 *
 * 处理名师风采、教师团队、教师获奖的业务逻辑
 */

import { BaseService, ServiceResult } from './base.service';
import {
  teacherProfileRepository,
  teacherTeamRepository,
  teacherAwardRepository,
} from '@/repositories/teacher-excellence.repository';
import type {
  TeacherProfile,
  TeacherProfileFormData,
  TeacherTeam,
  TeacherTeamFormData,
  TeacherAward,
  TeacherAwardFormData,
  TeacherProfileRow,
  TeacherTeamRow,
  TeacherAwardRow,
} from '@/types/teacher-excellence';
import {
  mapProfileRowToModel,
  mapProfileModelToRow,
  mapTeamRowToModel,
  mapTeamModelToRow,
  mapAwardRowToModel,
  mapAwardModelToRow,
} from '@/types/teacher-excellence';

// ==================== 名师风采服务 ====================

export class TeacherProfileService extends BaseService {
  async getList(limit: number = 50): Promise<ServiceResult<TeacherProfile[]>> {
    try {
      const rows = await teacherProfileRepository.findActive(limit);
      const data = rows.map(mapProfileRowToModel);
      return this.ok(data);
    } catch (error) {
      console.error('[TeacherProfileService] getList error:', error);
      return this.fail('获取名师风采数据失败');
    }
  }

  async getListForAdmin(includeInactive: boolean = false, limit: number = 100): Promise<ServiceResult<TeacherProfile[]>> {
    try {
      const rows = await teacherProfileRepository.findAllForAdmin(includeInactive, limit);
      const data = rows.map(mapProfileRowToModel);
      return this.ok(data);
    } catch (error) {
      console.error('[TeacherProfileService] getListForAdmin error:', error);
      return this.fail('获取名师风采数据失败');
    }
  }

  async getById(id: string): Promise<ServiceResult<TeacherProfile>> {
    try {
      const row = await teacherProfileRepository.findById(id);
      if (!row) return this.fail('名师风采记录不存在', 'NOT_FOUND');
      return this.ok(mapProfileRowToModel(row as TeacherProfileRow));
    } catch (error) {
      console.error('[TeacherProfileService] getById error:', error);
      return this.fail('获取名师风采详情失败');
    }
  }

  async create(data: TeacherProfileFormData): Promise<ServiceResult<TeacherProfile>> {
    try {
      const row = await teacherProfileRepository.create({
        ...mapProfileModelToRow(data),
        is_active: data.isActive ?? true,
        sort_order: data.sortOrder || 0,
      });
      if (!row) return this.fail('创建名师风采失败');
      return this.ok(mapProfileRowToModel(row as TeacherProfileRow));
    } catch (error) {
      console.error('[TeacherProfileService] create error:', error);
      return this.fail('创建名师风采失败');
    }
  }

  async update(id: string, data: Partial<TeacherProfileFormData>): Promise<ServiceResult<TeacherProfile>> {
    try {
      const row = await teacherProfileRepository.update(id, mapProfileModelToRow(data));
      if (!row) return this.fail('更新名师风采失败');
      return this.ok(mapProfileRowToModel(row as TeacherProfileRow));
    } catch (error) {
      console.error('[TeacherProfileService] update error:', error);
      return this.fail('更新名师风采失败');
    }
  }

  async delete(id: string): Promise<ServiceResult<boolean>> {
    try {
      const success = await teacherProfileRepository.delete(id);
      return this.ok(success);
    } catch (error) {
      console.error('[TeacherProfileService] delete error:', error);
      return this.fail('删除名师风采失败');
    }
  }
}

// ==================== 教师团队服务 ====================

export class TeacherTeamService extends BaseService {
  async getList(limit: number = 50): Promise<ServiceResult<TeacherTeam[]>> {
    try {
      const rows = await teacherTeamRepository.findActive(limit);
      const data = rows.map(mapTeamRowToModel);
      return this.ok(data);
    } catch (error) {
      console.error('[TeacherTeamService] getList error:', error);
      return this.fail('获取教师团队数据失败');
    }
  }

  async getListForAdmin(includeInactive: boolean = false, limit: number = 100): Promise<ServiceResult<TeacherTeam[]>> {
    try {
      const rows = await teacherTeamRepository.findAllForAdmin(includeInactive, limit);
      const data = rows.map(mapTeamRowToModel);
      return this.ok(data);
    } catch (error) {
      console.error('[TeacherTeamService] getListForAdmin error:', error);
      return this.fail('获取教师团队数据失败');
    }
  }

  async getById(id: string): Promise<ServiceResult<TeacherTeam>> {
    try {
      const row = await teacherTeamRepository.findById(id);
      if (!row) return this.fail('教师团队记录不存在', 'NOT_FOUND');
      return this.ok(mapTeamRowToModel(row as TeacherTeamRow));
    } catch (error) {
      console.error('[TeacherTeamService] getById error:', error);
      return this.fail('获取教师团队详情失败');
    }
  }

  async create(data: TeacherTeamFormData): Promise<ServiceResult<TeacherTeam>> {
    try {
      const row = await teacherTeamRepository.create({
        ...mapTeamModelToRow(data),
        is_active: data.isActive ?? true,
        sort_order: data.sortOrder || 0,
      });
      if (!row) return this.fail('创建教师团队失败');
      return this.ok(mapTeamRowToModel(row as TeacherTeamRow));
    } catch (error) {
      console.error('[TeacherTeamService] create error:', error);
      return this.fail('创建教师团队失败');
    }
  }

  async update(id: string, data: Partial<TeacherTeamFormData>): Promise<ServiceResult<TeacherTeam>> {
    try {
      const row = await teacherTeamRepository.update(id, mapTeamModelToRow(data));
      if (!row) return this.fail('更新教师团队失败');
      return this.ok(mapTeamRowToModel(row as TeacherTeamRow));
    } catch (error) {
      console.error('[TeacherTeamService] update error:', error);
      return this.fail('更新教师团队失败');
    }
  }

  async delete(id: string): Promise<ServiceResult<boolean>> {
    try {
      const success = await teacherTeamRepository.delete(id);
      return this.ok(success);
    } catch (error) {
      console.error('[TeacherTeamService] delete error:', error);
      return this.fail('删除教师团队失败');
    }
  }
}

// ==================== 教师获奖服务 ====================

export class TeacherAwardService extends BaseService {
  async getList(limit: number = 50): Promise<ServiceResult<TeacherAward[]>> {
    try {
      const rows = await teacherAwardRepository.findActive(limit);
      const data = rows.map(mapAwardRowToModel);
      return this.ok(data);
    } catch (error) {
      console.error('[TeacherAwardService] getList error:', error);
      return this.fail('获取教师获奖数据失败');
    }
  }

  async getListForAdmin(includeInactive: boolean = false, limit: number = 100): Promise<ServiceResult<TeacherAward[]>> {
    try {
      const rows = await teacherAwardRepository.findAllForAdmin(includeInactive, limit);
      const data = rows.map(mapAwardRowToModel);
      return this.ok(data);
    } catch (error) {
      console.error('[TeacherAwardService] getListForAdmin error:', error);
      return this.fail('获取教师获奖数据失败');
    }
  }

  async getById(id: string): Promise<ServiceResult<TeacherAward>> {
    try {
      const row = await teacherAwardRepository.findById(id);
      if (!row) return this.fail('教师获奖记录不存在', 'NOT_FOUND');
      return this.ok(mapAwardRowToModel(row as TeacherAwardRow));
    } catch (error) {
      console.error('[TeacherAwardService] getById error:', error);
      return this.fail('获取教师获奖详情失败');
    }
  }

  async create(data: TeacherAwardFormData): Promise<ServiceResult<TeacherAward>> {
    try {
      const row = await teacherAwardRepository.create({
        ...mapAwardModelToRow(data),
        is_active: data.isActive ?? true,
        sort_order: data.sortOrder || 0,
      });
      if (!row) return this.fail('创建教师获奖失败');
      return this.ok(mapAwardRowToModel(row as TeacherAwardRow));
    } catch (error) {
      console.error('[TeacherAwardService] create error:', error);
      return this.fail('创建教师获奖失败');
    }
  }

  async update(id: string, data: Partial<TeacherAwardFormData>): Promise<ServiceResult<TeacherAward>> {
    try {
      const row = await teacherAwardRepository.update(id, mapAwardModelToRow(data));
      if (!row) return this.fail('更新教师获奖失败');
      return this.ok(mapAwardRowToModel(row as TeacherAwardRow));
    } catch (error) {
      console.error('[TeacherAwardService] update error:', error);
      return this.fail('更新教师获奖失败');
    }
  }

  async delete(id: string): Promise<ServiceResult<boolean>> {
    try {
      const success = await teacherAwardRepository.delete(id);
      return this.ok(success);
    } catch (error) {
      console.error('[TeacherAwardService] delete error:', error);
      return this.fail('删除教师获奖失败');
    }
  }
}

// 单例导出
export const teacherProfileService = new TeacherProfileService();
export const teacherTeamService = new TeacherTeamService();
export const teacherAwardService = new TeacherAwardService();
