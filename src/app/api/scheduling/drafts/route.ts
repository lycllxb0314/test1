/**
 * 排课草稿管理 API
 * 
 * GET: 获取草稿列表
 * POST: 保存草稿
 * DELETE: 删除草稿
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const client = getSupabaseClient();

// 草稿数据结构
interface ScheduleDraft {
  id: string;
  name: string;
  description?: string;
  result: any; // 排课结果
  statistics: {
    totalSlots: number;
    filledSlots: number;
    totalClasses: number;
    averageTeacherHours: number;
    adjustmentsCount: number;
  };
  created_at: string;
  updated_at: string;
}

/**
 * 获取草稿列表
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const draftId = searchParams.get('id');
    
    // 获取单个草稿详情
    if (draftId) {
      const { data, error } = await client
        .from('schedule_drafts')
        .select('*')
        .eq('id', draftId)
        .single();
      
      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      
      return NextResponse.json({ success: true, data });
    }
    
    // 获取草稿列表
    const { data, error } = await client
      .from('schedule_drafts')
      .select('id, name, description, statistics, created_at, updated_at')
      .order('updated_at', { ascending: false })
      .limit(20);
    
    if (error) {
      // 表可能不存在，返回空列表
      if (error.code === '42P01') {
        return NextResponse.json({ success: true, data: [] });
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('获取草稿失败:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * 保存草稿
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description, result, assignments, statistics } = body;
    
    // 生成草稿名称
    const draftName = name || `排课草稿 ${new Date().toLocaleString('zh-CN', { 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })}`;
    
    const draftData = {
      name: draftName,
      description: description || '',
      result: result || {},
      assignments: assignments || [],
      statistics: statistics || {},
      updated_at: new Date().toISOString(),
    };
    
    // 更新或创建
    if (id) {
      const { data, error } = await client
        .from('schedule_drafts')
        .update(draftData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      
      return NextResponse.json({ success: true, data, message: '草稿已更新' });
    } else {
      const { data, error } = await client
        .from('schedule_drafts')
        .insert({
          ...draftData,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (error) {
        // 表可能不存在，尝试创建
        if (error.code === '42P01') {
          // 返回提示信息，让前端知道需要先创建表
          return NextResponse.json({ 
            success: false, 
            error: '草稿表尚未初始化，请先执行排课',
            needInit: true 
          }, { status: 500 });
        }
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      
      return NextResponse.json({ success: true, data, message: '草稿已保存' });
    }
  } catch (error: any) {
    console.error('保存草稿失败:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * 删除草稿
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const draftId = searchParams.get('id');
    
    if (!draftId) {
      return NextResponse.json({ success: false, error: '缺少草稿ID' }, { status: 400 });
    }
    
    const { error } = await client
      .from('schedule_drafts')
      .delete()
      .eq('id', draftId);
    
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, message: '草稿已删除' });
  } catch (error: any) {
    console.error('删除草稿失败:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
