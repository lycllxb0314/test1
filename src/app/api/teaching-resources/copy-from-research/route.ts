/**
 * 从教研活动复制资源到备课中心 API
 * 
 * POST: 复制教研资源到个人资源库
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 */

import { NextRequest, NextResponse } from 'next/server';
import { researchResourceService } from '@/services/research.service';
import { teachingResourceRepository } from '@/repositories/teaching-resource.repository';
import { success, error, ErrorCode } from '@/lib/api';

/**
 * POST - 复制教研资源到个人资源库
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { resourceId, teacherId, subject } = body;

  if (!resourceId || !teacherId) {
    return NextResponse.json(
      error('缺少必要参数', ErrorCode.VALIDATION_ERROR),
      { status: 400 }
    );
  }

  // 先获取教研资源
  const resourceResult = await researchResourceService.getById(resourceId);
  if (!resourceResult.success || !resourceResult.data) {
    return NextResponse.json(
      error('获取教研资源失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  // 创建教学资源
  const resource = resourceResult.data;
  const result = await teachingResourceRepository.create({
    teacherId,
    teacherName: '',
    category: 'other',
    type: 'document_file',
    subject: subject || '通用',
    grade: 0,
    title: resource.title,
    description: resource.description || '',
    content: resource.content ? JSON.parse(JSON.stringify(resource.content)) : {},
    fileUrl: resource.fileUrl,
  });

  if (!result) {
    return NextResponse.json(
      error('复制资源失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  return NextResponse.json(success(result));
}
