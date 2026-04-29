/**
 * 作业管理 API
 * 
 * GET - 获取作业列表
 * POST - 创建作业
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 * - 使用统一认证中间件
 */

import { NextRequest } from 'next/server';
import { getService, SERVICE_IDENTIFIERS } from '@/lib/di';
import { withAuth } from '@/lib/auth/middleware';
import { ok, fail, serverError } from '@/lib/api';
import type { HomeworkService } from '@/services/homework.service';

/**
 * GET - 获取作业列表
 */
export const GET = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  
  try {
    const homeworkService = getService<HomeworkService>(SERVICE_IDENTIFIERS.HomeworkService);
    
    const result = await homeworkService.getPaginated({
      filters: {
        teacherId: searchParams.get('teacherId') || undefined,
        classId: searchParams.get('classId') || undefined,
        subject: searchParams.get('subject') || undefined,
      },
    });

    if (!result.success) {
      return fail(result.error || '数据库查询失败');
    }

    const formattedData = result.data?.map(h => {
      const item = h as unknown as Record<string, unknown>;
      return {
        id: item.id,
        title: item.title,
        subject: item.subject,
        teacherId: item.teacherId,
        teacherName: item.teacherName,
        classId: item.classId,
        className: item.className,
        dueDate: item.dueDate,
        content: item.content,
        attachments: item.attachments || [],
        submissionCount: item.submissionCount || 0,
        totalStudents: item.totalStudents || 0,
        status: item.status,
        createdAt: item.createdAt,
      };
    }) || [];

    return ok(formattedData);
  } catch (err) {
    console.error('Failed to fetch homeworks:', err);
    return serverError('获取作业列表失败');
  }
});

/**
 * POST - 创建作业
 */
export const POST = withAuth(async (request: NextRequest) => {
  try {
    const homeworkService = getService<HomeworkService>(SERVICE_IDENTIFIERS.HomeworkService);
    const body = await request.json();

    const result = await homeworkService.create({
      title: body.title,
      subject: body.subject,
      teacherId: body.teacherId,
      teacherName: body.teacherName,
      classId: body.classId,
      className: body.className,
      dueDate: body.dueDate,
      attachments: body.attachments || [],
      status: 'published',
    });

    if (!result.success) {
      return fail(result.error || '创建作业失败');
    }

    const data = result.data as unknown as Record<string, unknown>;
    
    return ok({
      id: data?.id,
      title: data?.title,
      subject: data?.subject,
      teacherId: data?.teacherId,
      teacherName: data?.teacherName,
      classId: data?.classId,
      className: data?.className,
      dueDate: data?.dueDate,
      status: data?.status,
    });
  } catch (err) {
    console.error('Failed to create homework:', err);
    return serverError('创建作业失败');
  }
});
