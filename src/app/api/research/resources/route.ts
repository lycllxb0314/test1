/**
 * 教研资源API
 * 
 * GET: 查询资源（按主题或活动）
 * POST: 创建资源记录
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: 查询资源
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const themeId = searchParams.get('themeId');
    const activityId = searchParams.get('activityId');
    const resourceType = searchParams.get('resourceType');
    
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
    
    if (resourceType) {
      query = query.eq('resource_type', resourceType);
    }
    
    const { data: resources, error } = await query;
    
    if (error) {
      console.error('查询资源失败:', error);
      return NextResponse.json(
        { success: false, error: '查询资源失败' },
        { status: 500 }
      );
    }
    
    const formattedResources = (resources || []).map(r => ({
      id: r.id,
      title: r.title,
      type: r.type,
      resourceType: r.resource_type,
      size: r.size,
      fileUrl: r.file_url,
      fileName: r.file_name,
      fileKey: r.file_key,
      teacherName: r.teacher_name,
      activityTitle: r.activity_title,
      folderId: r.folder_id,
      themeId: r.theme_id,
      activityId: r.activity_id,
      createdAt: r.created_at,
    }));
    
    return NextResponse.json({
      success: true,
      data: formattedResources,
    });
    
  } catch (error) {
    console.error('查询资源失败:', error);
    return NextResponse.json(
      { success: false, error: '查询资源失败' },
      { status: 500 }
    );
  }
}

// POST: 创建资源记录
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      themeId,
      activityId,
      title,
      resourceType,
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
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }
    
    const { data: resource, error } = await supabase
      .from('research_resources')
      .insert({
        theme_id: themeId,
        activity_id: activityId,
        title,
        resource_type: resourceType || 'other',
        file_key: fileKey,
        file_url: fileUrl,
        file_name: fileName,
        type,
        size,
        teacher_name: teacherName,
        activity_title: activityTitle,
        source_type: sourceType,
      })
      .select()
      .single();
    
    if (error) {
      console.error('创建资源失败:', error);
      return NextResponse.json(
        { success: false, error: '创建资源失败' },
        { status: 500 }
      );
    }
    
    // 如果是教学设计，同步到资源库
    if (resourceType === 'lesson_design' && activityId) {
      // 检查是否已存在同名教学设计
      const { data: existing } = await supabase
        .from('lesson_designs')
        .select('id')
        .eq('title', title)
        .eq('activity_id', activityId)
        .single();
      
      if (!existing) {
        // 同步创建教学设计记录
        await supabase
          .from('lesson_designs')
          .insert({
            title,
            activity_id: activityId,
            teacher_id: null, // 需要从context获取
            content: '',
            status: 'draft',
          });
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        id: resource.id,
        title: resource.title,
        resourceType: resource.resource_type,
      },
    });
    
  } catch (error) {
    console.error('创建资源失败:', error);
    return NextResponse.json(
      { success: false, error: '创建资源失败' },
      { status: 500 }
    );
  }
}
