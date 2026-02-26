import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 获取所有流程配置
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    
    let query = client
      .from('workflow_configs')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (type) {
      query = query.eq('type', type);
    }
    
    const { data, error } = await query;
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error('Failed to fetch workflow configs:', error);
    return NextResponse.json({
      success: false,
      error: '获取流程配置失败',
    }, { status: 500 });
  }
}

// 创建或更新流程配置
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    const { id, type, name, description, steps, conditions, isActive, createdBy } = body;
    
    if (!type || !name || !steps || steps.length === 0) {
      return NextResponse.json({
        success: false,
        error: '缺少必要参数',
      }, { status: 400 });
    }
    
    if (id) {
      // 更新现有配置
      const { data, error } = await client
        .from('workflow_configs')
        .update({
          type,
          name,
          description,
          steps,
          conditions,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        return NextResponse.json({
          success: false,
          error: error.message,
        }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        data,
        message: '流程配置已更新',
      });
    } else {
      // 如果设置为激活，先将同类型的其他配置设为非活跃
      if (isActive !== false) {
        await client
          .from('workflow_configs')
          .update({ is_active: false })
          .eq('type', type);
      }
      
      // 创建新配置
      const { data, error } = await client
        .from('workflow_configs')
        .insert({
          type,
          name,
          description,
          steps,
          conditions,
          is_active: isActive !== false,
          created_by: createdBy,
        })
        .select()
        .single();
      
      if (error) {
        return NextResponse.json({
          success: false,
          error: error.message,
        }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        data,
        message: '流程配置已创建',
      });
    }
  } catch (error) {
    console.error('Failed to save workflow config:', error);
    return NextResponse.json({
      success: false,
      error: '保存流程配置失败',
    }, { status: 500 });
  }
}

// 删除流程配置
export async function DELETE(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: '缺少配置ID',
      }, { status: 400 });
    }
    
    const { error } = await client
      .from('workflow_configs')
      .delete()
      .eq('id', parseInt(id));
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: '流程配置已删除',
    });
  } catch (error) {
    console.error('Failed to delete workflow config:', error);
    return NextResponse.json({
      success: false,
      error: '删除流程配置失败',
    }, { status: 500 });
  }
}
