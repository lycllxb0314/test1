/**
 * 单个资源操作 API
 * 
 * DELETE: 删除指定资源
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { success, error, ErrorCode } from '@/lib/api-route-utils';

const supabase = getSupabaseClient();

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(error('缺少资源ID', ErrorCode.BAD_REQUEST), { status: 400 });
    }
    
    // 先获取资源信息，以便删除对象存储中的文件
    const { data: resource, error: fetchError } = await supabase
      .from('research_resources')
      .select('file_key, source_type')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      console.error('获取资源失败:', fetchError);
      return NextResponse.json(error('资源不存在', ErrorCode.NOT_FOUND), { status: 404 });
    }
    
    // 只允许删除主题直接上传的资源，活动资源需要从活动端删除
    // if (resource.source_type === 'activity') {
    //   return NextResponse.json(error('活动资源请从活动端删除', ErrorCode.FORBIDDEN), { status: 403 });
    // }
    
    // 删除数据库记录
    const { error: dbError } = await supabase
      .from('research_resources')
      .delete()
      .eq('id', id);
    
    if (dbError) {
      console.error('删除资源失败:', dbError);
      return NextResponse.json(error('删除资源失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    // TODO: 如果需要，可以同时删除对象存储中的文件
    // 这里暂时只删除数据库记录
    
    return NextResponse.json(success({ id }));
    
  } catch (err) {
    console.error('删除资源失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const { data: resource, error: dbError } = await supabase
      .from('research_resources')
      .select('*')
      .eq('id', id)
      .single();
    
    if (dbError) {
      return NextResponse.json(error('资源不存在', ErrorCode.NOT_FOUND), { status: 404 });
    }
    
    return NextResponse.json(success({
      id: resource.id,
      title: resource.title,
      type: resource.type,
      resourceType: resource.resource_type,
      folderId: resource.resource_type,
      size: resource.size,
      fileUrl: resource.file_url,
      fileName: resource.file_name,
      fileKey: resource.file_key,
      teacherName: resource.teacher_name,
      activityTitle: resource.activity_title,
      activityId: resource.activity_id,
      themeId: resource.theme_id,
      sourceType: resource.source_type || 'theme_direct',
      createdAt: resource.created_at,
    }));
    
  } catch (err) {
    console.error('获取资源失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}
