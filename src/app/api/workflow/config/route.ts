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
    
    if (type && type !== 'all') {
      query = query.eq('type', type);
    }
    
    const { data, error } = await query;
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
      }, { status: 500 });
    }
    
    // 转换数据格式
    const configs = (data || []).map(item => ({
      id: item.id,
      type: item.type,
      name: item.name,
      description: item.description,
      version: item.version || 1,
      isActive: item.is_active,
      nodes: item.nodes || item.steps || [],
      startNodeId: item.start_node_id,
      endNodeId: item.end_node_id,
      formFields: item.form_fields,
      createdBy: item.created_by,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
    
    return NextResponse.json({
      success: true,
      data: configs,
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
    const { 
      id, 
      type, 
      name, 
      description, 
      nodes, 
      steps, // 兼容旧格式
      startNodeId, 
      endNodeId, 
      formFields,
      isActive, 
      createdBy 
    } = body;
    
    // 支持新旧两种格式
    const flowNodes = nodes || steps;
    
    if (!type || !name || !flowNodes || flowNodes.length === 0) {
      return NextResponse.json({
        success: false,
        error: '缺少必要参数：类型、名称、节点',
      }, { status: 400 });
    }
    
    // 验证流程结构
    const startNode = flowNodes.find((n: any) => n.type === 'start');
    const endNode = flowNodes.find((n: any) => n.type === 'end');
    
    if (!startNode || !endNode) {
      return NextResponse.json({
        success: false,
        error: '流程必须包含开始和结束节点',
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
          nodes: flowNodes,
          start_node_id: startNodeId || startNode.id,
          end_node_id: endNodeId || endNode.id,
          form_fields: formFields,
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
        data: {
          ...data,
          nodes: data.nodes || data.steps,
          startNodeId: data.start_node_id,
          endNodeId: data.end_node_id,
        },
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
          nodes: flowNodes,
          steps: flowNodes, // 兼容旧字段
          start_node_id: startNodeId || startNode.id,
          end_node_id: endNodeId || endNode.id,
          form_fields: formFields,
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
        data: {
          ...data,
          nodes: data.nodes || data.steps,
          startNodeId: data.start_node_id,
          endNodeId: data.end_node_id,
        },
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
    
    // 检查是否有关联的流程实例
    const { data: instances } = await client
      .from('workflow_instances')
      .select('id')
      .eq('config_id', parseInt(id))
      .limit(1);
    
    if (instances && instances.length > 0) {
      return NextResponse.json({
        success: false,
        error: '该流程已有申请实例，无法删除',
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
