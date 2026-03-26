/**
 * 教研资源API
 * 
 * 功能：
 * - GET: 查询资源（按主题、活动、来源类型）
 * - POST: 创建资源记录
 * - DELETE: 删除资源
 * 
 * 资源来源：
 * - activity: 来自教研活动的资源（教学设计、课例等）
 * - theme_direct: 直接上传到主题的资源（其他资源）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getUserFromSession } from '@/lib/auth/session';
import { success, error, ErrorCode } from '@/lib/api-route-utils';

const supabase = getSupabaseClient();

/**
 * GET - 查询资源
 * 
 * 查询参数：
 * - themeId: 主题ID
 * - activityId: 活动ID
 * - resourceType: 资源类型（lesson_design, excellent_case, academic_paper, courseware, other）
 * - sourceType: 来源类型（activity, theme_direct）
 * - folderId: 文件夹ID（等同于 resourceType）
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const themeId = searchParams.get('themeId');
    const activityId = searchParams.get('activityId');
    const resourceType = searchParams.get('resourceType');
    const sourceType = searchParams.get('sourceType');
    const folderId = searchParams.get('folderId');
    
    let query = supabase
      .from('research_resources')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (themeId) {
      query = query.eq('theme_id', themeId);
    }
    
    if (activityId) {
      query = query.eq('activity_id', activityId);
    }
    
    // resourceType 和 folderId 是同一个概念
    const folder = resourceType || folderId;
    if (folder) {
      query = query.eq('resource_type', folder);
    }
    
    if (sourceType) {
      query = query.eq('source_type', sourceType);
    }
    
    const { data: resources, error: dbError } = await query;
    
    if (dbError) {
      console.error('查询资源失败:', dbError);
      return NextResponse.json(error('查询资源失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    const formattedResources = (resources || []).map(r => ({
      id: r.id,
      title: r.title,
      type: r.type,
      resourceType: r.resource_type,
      folderId: r.resource_type, // folderId 与 resourceType 相同
      size: r.size,
      fileUrl: r.file_url,
      fileName: r.file_name,
      fileKey: r.file_key,
      teacherName: r.teacher_name,
      activityTitle: r.activity_title,
      activityId: r.activity_id,
      themeId: r.theme_id,
      sourceType: r.source_type || 'theme_direct', // 默认为主题直接上传
      createdAt: r.created_at,
    }));
    
    return NextResponse.json(success(formattedResources));
    
  } catch (err) {
    console.error('查询资源失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}

/**
 * POST - 创建资源记录
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromSession(request);
    
    const body = await request.json();
    
    const {
      themeId,
      activityId,
      title,
      resourceType,
      folderId,
      fileKey,
      fileUrl,
      fileName,
      type,
      size,
      teacherName,
      activityTitle,
      sourceType,
    } = body;
    
    if (!title || !themeId) {
      return NextResponse.json(error('缺少必要参数', ErrorCode.BAD_REQUEST), { status: 400 });
    }
    
    // resourceType 和 folderId 取其一
    const finalResourceType = resourceType || folderId || 'other';
    
    const { data: resource, error: dbError } = await supabase
      .from('research_resources')
      .insert({
        theme_id: themeId,
        activity_id: activityId || null,
        title,
        resource_type: finalResourceType,
        file_key: fileKey,
        file_url: fileUrl,
        file_name: fileName,
        type: type || 'application/octet-stream',
        size: size || 0,
        teacher_name: teacherName || user?.name || null,
        activity_title: activityTitle || null,
        source_type: sourceType || 'theme_direct',
      })
      .select()
      .single();
    
    if (dbError) {
      console.error('创建资源失败:', dbError);
      return NextResponse.json(error('创建资源失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    // 如果是教学设计且来自活动，同步到教学设计表
    if (finalResourceType === 'lesson_design' && activityId && sourceType === 'activity') {
      const { data: existing } = await supabase
        .from('lesson_designs')
        .select('id')
        .eq('title', title)
        .eq('activity_id', activityId)
        .single();
      
      if (!existing) {
        await supabase
          .from('lesson_designs')
          .insert({
            title,
            activity_id: activityId,
            teacher_id: null,
            content: {},
            status: 'draft',
          });
      }
    }
    
    return NextResponse.json(success({
      id: resource.id,
      title: resource.title,
      resourceType: resource.resource_type,
      sourceType: resource.source_type,
    }));
    
  } catch (err) {
    console.error('创建资源失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}

/**
 * DELETE - 删除资源
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      // 尝试从路径获取 ID
      const pathParts = request.nextUrl.pathname.split('/');
      const resourceId = pathParts[pathParts.length - 1];
      
      if (!resourceId || resourceId === 'resources') {
        return NextResponse.json(error('缺少资源ID', ErrorCode.BAD_REQUEST), { status: 400 });
      }
      
      const { error: dbError } = await supabase
        .from('research_resources')
        .delete()
        .eq('id', resourceId);
      
      if (dbError) {
        console.error('删除资源失败:', dbError);
        return NextResponse.json(error('删除资源失败', ErrorCode.DATABASE_ERROR), { status: 500 });
      }
      
      return NextResponse.json(success({ id: resourceId }));
    }
    
    const { error: dbError } = await supabase
      .from('research_resources')
      .delete()
      .eq('id', id);
    
    if (dbError) {
      console.error('删除资源失败:', dbError);
      return NextResponse.json(error('删除资源失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    return NextResponse.json(success({ id }));
    
  } catch (err) {
    console.error('删除资源失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}
