/**
 * 基础课表 API
 * 
 * GET: 获取基础课表
 * POST: 创建基础课表
 * PUT: 更新基础课表
 * DELETE: 删除基础课表
 * 
 * ⚠️ 架构原则：
 * - 使用统一认证中间件
 * - 通过 Service 层访问数据，禁止直接操作数据库
 */

import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/auth/middleware';
import { ok, fail, serverError, paginated } from '@/lib/api';
import { scheduleService } from '@/services/academic.service';

/**
 * GET: 获取基础课表
 */
export const GET = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');
  const grade = searchParams.get('grade');

  try {
    const result = await scheduleService.getOfficialSchedule({
      grade: grade ? parseInt(grade) : undefined,
    });

    if (!result.success) {
      return fail(result.error || '获取基础课表失败');
    }

    // 手动分页
    const allData = result.data || [];
    const total = allData.length;
    const totalPages = Math.ceil(total / pageSize);
    const from = (page - 1) * pageSize;
    const to = from + pageSize;
    const paginatedData = allData.slice(from, to);

    // 格式化数据
    const formattedData = paginatedData.map(s => ({
      id: s.id,
      grade: s.grade,
      subject: s.subject,
      periodsPerWeek: 1, // 每条记录代表一节课
      semester: undefined,
      createdAt: s.created_at,
    }));

    return paginated(formattedData, total, page, pageSize);
  } catch (error) {
    console.error('获取基础课表失败:', error);
    return serverError('服务器错误');
  }
});

/**
 * POST: 创建基础课表
 */
export const POST = withAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();
    
    if (!body.grade || !body.subject) {
      return fail('缺少必要参数');
    }

    const result = await scheduleService.saveSlot({
      classId: body.classId || `temp-${Date.now()}`,
      className: body.className || '',
      grade: body.grade,
      weekDay: 1, // 默认值
      periodIndex: 1, // 默认值
      subject: body.subject,
    });

    if (!result.success) {
      return fail(result.error || '创建基础课表失败');
    }

    return ok({ id: `bs-${Date.now()}`, grade: body.grade, subject: body.subject });
  } catch (error) {
    console.error('创建基础课表失败:', error);
    return serverError('服务器错误');
  }
});

/**
 * PUT: 更新基础课表
 */
export const PUT = withAuth(async (request: NextRequest) => {
  try {
    const body = await request.json();
    
    if (!body.id) {
      return fail('缺少ID');
    }

    const result = await scheduleService.updateOfficialSlot(body.id, {
      subject: body.subject,
      teacherId: body.teacherId,
      teacherName: body.teacherName,
    });

    if (!result.success) {
      return fail(result.error || '更新基础课表失败');
    }

    return ok({ id: result.data!.id });
  } catch (error) {
    console.error('更新基础课表失败:', error);
    return serverError('服务器错误');
  }
});

/**
 * DELETE: 删除基础课表
 */
export const DELETE = withAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return fail('缺少ID');
    }

    // 通过清空课表格子来删除
    const result = await scheduleService.deleteSlot({
      classId: id, // 这里可能需要调整逻辑
      weekDay: 0,
      periodIndex: 0,
    });

    if (!result.success) {
      return fail(result.error || '删除基础课表失败');
    }

    return ok({ id, message: '删除成功' });
  } catch (error) {
    console.error('删除基础课表失败:', error);
    return serverError('服务器错误');
  }
});
