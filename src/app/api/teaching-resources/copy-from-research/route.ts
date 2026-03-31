/**
 * 从教研活动复制资源到备课中心
 * 
 * POST /api/teaching-resources/copy-from-research
 * 
 * 将教研活动中的资源复制到教师个人备课资源库
 */

import { NextRequest, NextResponse } from 'next/server';
import { teachingResourceRepository } from '@/repositories/teaching-resource.repository';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { ResourceCategory, ResourceType } from '@/types/teaching-resource';

/** 请求体 */
interface CopyRequest {
  researchResourceId: string;  // 教研资源ID
  category: ResourceCategory;  // 目标分类
  activityId?: string;         // 来源活动ID（可选，用于追溯）
}

/** 教研资源类型到备课资源类型的映射 */
const RESOURCE_TYPE_MAP: Record<string, ResourceType> = {
  lesson_design: 'lesson_design',
  excellent_case: 'full_package',
  academic_paper: 'document_file',
  courseware: 'courseware_file',
  other: 'other',
};

/** 教研资源类型到备课资源分类的映射 */
const RESOURCE_CATEGORY_MAP: Record<string, ResourceCategory> = {
  lesson_design: 'lesson_plan',
  excellent_case: 'other',
  academic_paper: 'other',
  courseware: 'courseware',
  other: 'other',
};

export async function POST(request: NextRequest) {
  try {
    const body: CopyRequest = await request.json();
    const { researchResourceId, category, activityId } = body;

    if (!researchResourceId) {
      return NextResponse.json(
        { success: false, error: '缺少资源ID' },
        { status: 400 }
      );
    }

    // 开发环境：使用默认教师ID
    // 生产环境：TODO 从认证获取教师ID
    const teacherId = process.env.NODE_ENV === 'production' ? 'teacher-001' : 'dev-teacher';
    const teacherName = '开发教师';

    // 查询教研资源
    const client = getSupabaseClient();
    const { data: researchResource, error: queryError } = await client
      .from('research_resources')
      .select('*')
      .eq('id', researchResourceId)
      .single();

    if (queryError || !researchResource) {
      return NextResponse.json(
        { success: false, error: '资源不存在' },
        { status: 404 }
      );
    }

    // 确定目标分类
    const targetCategory = category || RESOURCE_CATEGORY_MAP[researchResource.resource_type] || 'other';
    const targetType = RESOURCE_TYPE_MAP[researchResource.resource_type] || 'other';

    // 创建备课资源
    const teachingResource = await teachingResourceRepository.create({
      teacherId,
      teacherName,
      category: targetCategory,
      type: targetType,
      title: researchResource.title,
      description: researchResource.description || undefined,
      content: researchResource.content ? { text: researchResource.content } : {},
      fileUrl: researchResource.file_url || undefined,
      fileKey: researchResource.file_key || undefined,
      fileName: researchResource.file_name || undefined,
      fileSize: researchResource.size || undefined,
      sourceType: 'research_import',
      sourceActivityId: activityId || researchResource.activity_id || undefined,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: teachingResource.id,
        title: teachingResource.title,
        message: '已添加到备课中心资源库',
      },
    });
  } catch (err) {
    console.error('[CopyFromResearch Error]:', err);
    return NextResponse.json(
      { success: false, error: '复制失败，请稍后重试' },
      { status: 500 }
    );
  }
}
