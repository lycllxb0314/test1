/**
 * 教研资源 API
 * 
 * 功能：
 * - GET: 获取资源列表
 * - POST: 创建资源
 * - DELETE: 删除资源
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getUserFromSession } from '@/lib/auth/session';
import { success, error, ErrorCode } from '@/lib/api-route-utils';
import { S3Storage } from 'coze-coding-dev-sdk';

const supabase = getSupabaseClient();

// 初始化对象存储
const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: '',
  secretKey: '',
  bucketName: process.env.COZE_BUCKET_NAME,
  region: 'cn-beijing',
});

/**
 * GET - 获取资源列表
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const themeId = searchParams.get('themeId');
    const folderId = searchParams.get('folderId');
    
    let query = supabase
      .from('research_resources')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (themeId) {
      query = query.eq('theme_id', themeId);
    }
    
    if (folderId) {
      query = query.eq('folder_id', folderId);
    }
    
    const { data, error: dbError } = await query;
    
    if (dbError) {
      console.error('查询资源失败:', dbError);
      return NextResponse.json(error('查询失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data: data?.map(r => ({
        id: r.id,
        title: r.title,
        folderId: r.folder_id,
        type: r.type,
        size: r.size,
        fileKey: r.file_key,
        sourceType: r.source_type,
        sourceId: r.source_id,
        teacherName: r.teacher_name,
        activityTitle: r.activity_title,
        createdAt: r.created_at,
      })) || [],
    });
  } catch (err) {
    console.error('获取资源列表失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}

/**
 * POST - 创建资源
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromSession(request);
    if (!user) {
      return NextResponse.json(error('未登录', ErrorCode.UNAUTHORIZED), { status: 401 });
    }
    
    const body = await request.json();
    const { themeId, title, folderId, type, size, fileKey, sourceType, sourceId, teacherName, activityTitle, content } = body;
    
    if (!themeId || !title || !folderId) {
      return NextResponse.json(error('缺少必要参数', ErrorCode.BAD_REQUEST), { status: 400 });
    }
    
    const { data, error: dbError } = await supabase
      .from('research_resources')
      .insert({
        theme_id: themeId,
        title,
        folder_id: folderId,
        type: type || 'application/octet-stream',
        size,
        file_key: fileKey,
        source_type: sourceType || 'upload',
        source_id: sourceId,
        teacher_name: teacherName,
        activity_title: activityTitle,
        content: content ? JSON.stringify(content) : null,
        creator_id: user.id,
      })
      .select()
      .single();
    
    if (dbError) {
      console.error('创建资源失败:', dbError);
      return NextResponse.json(error('创建失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        title: data.title,
        folderId: data.folder_id,
        type: data.type,
        size: data.size,
        fileKey: data.file_key,
        sourceType: data.source_type,
        createdAt: data.created_at,
      },
    });
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
    const user = await getUserFromSession(request);
    if (!user) {
      return NextResponse.json(error('未登录', ErrorCode.UNAUTHORIZED), { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(error('缺少资源ID', ErrorCode.BAD_REQUEST), { status: 400 });
    }
    
    // 获取资源信息
    const { data: resource, error: fetchError } = await supabase
      .from('research_resources')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError || !resource) {
      return NextResponse.json(error('资源不存在', ErrorCode.NOT_FOUND), { status: 404 });
    }
    
    // 删除对象存储中的文件
    if (resource.file_key) {
      try {
        await storage.deleteFile({ fileKey: resource.file_key });
      } catch (e) {
        console.error('删除文件失败:', e);
        // 继续删除数据库记录
      }
    }
    
    // 删除数据库记录
    const { error: deleteError } = await supabase
      .from('research_resources')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      console.error('删除资源记录失败:', deleteError);
      return NextResponse.json(error('删除失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('删除资源失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}
