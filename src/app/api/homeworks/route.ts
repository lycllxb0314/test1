/**
 * 作业管理 API
 *
 * GET  - 获取作业列表
 * POST - 创建作业
 */

import { withRoute } from '@/lib/api';
import { getService, SERVICE_IDENTIFIERS } from '@/lib/di';
import { ApiError } from '@/lib/api-error';
import type { HomeworkService } from '@/services/homework.service';

/**
 * GET - 获取作业列表
 */
export const GET = withRoute(
  async (req) => {
    const { searchParams } = new URL(req.url);
    const homeworkService = getService<HomeworkService>(SERVICE_IDENTIFIERS.HomeworkService);

    const result = await homeworkService.getPaginated({
      filters: {
        teacherId: searchParams.get('teacherId') || undefined,
        classId: searchParams.get('classId') || undefined,
        subject: searchParams.get('subject') || undefined,
      },
    });

    if (!result.success) {
      throw ApiError.Internal(result.error || '数据库查询失败');
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

    return formattedData;
  },
  { requireAuth: true }
);

/**
 * POST - 创建作业
 */
export const POST = withRoute(
  async (req) => {
    const homeworkService = getService<HomeworkService>(SERVICE_IDENTIFIERS.HomeworkService);
    const body = await req.json();

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
      throw ApiError.BadRequest(result.error || '创建作业失败');
    }

    const data = result.data as unknown as Record<string, unknown>;

    return {
      id: data?.id,
      title: data?.title,
      subject: data?.subject,
      teacherId: data?.teacherId,
      teacherName: data?.teacherName,
      classId: data?.classId,
      className: data?.className,
      dueDate: data?.dueDate,
      status: data?.status,
    };
  },
  { requireAuth: true }
);
