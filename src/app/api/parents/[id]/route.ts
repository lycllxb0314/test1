/**
 * 家长详情 API
 * 
 * 功能：
 * - GET /api/parents/[id]: 获取单个家长详情
 * - PUT /api/parents/[id]: 更新家长信息
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { success, error, ErrorCode } from '@/lib/api-route-utils';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

// 关系名称映射
const RELATION_NAMES: Record<string, string> = {
  father: '父亲',
  mother: '母亲',
  grandfather: '爷爷/外公',
  grandmother: '奶奶/外婆',
  other: '其他',
};

/**
 * GET - 获取单个家长详情
 */
const handleGetParent = async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const params = await context.params;
    const id = params?.id;
    if (!id) {
      return NextResponse.json(error('缺少家长ID', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    const client = getSupabaseClient();

    const { data: parent, error: dbError } = await client
      .from('parents')
      .select('*')
      .eq('id', id)
      .single();

    if (dbError || !parent) {
      return NextResponse.json(error('家长不存在', ErrorCode.NOT_FOUND), { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: parent,
    });
  } catch (err) {
    console.error('Failed to fetch parent:', err);
    return NextResponse.json(error('获取家长信息失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
};

/**
 * PUT - 更新家长信息
 */
const handleUpdateParent = async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const params = await context.params;
    const id = params?.id;
    if (!id) {
      return NextResponse.json(error('缺少家长ID', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    const body = await request.json();
    const client = getSupabaseClient();

    // 检查家长是否存在
    const { data: existingParent, error: fetchError } = await client
      .from('parents')
      .select('id, phone')
      .eq('id', id)
      .single();

    if (fetchError || !existingParent) {
      return NextResponse.json(error('家长不存在', ErrorCode.NOT_FOUND), { status: 404 });
    }

    // 准备更新数据
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    // 基本信息
    if (body.name !== undefined) updateData.name = body.name;
    if (body.relation !== undefined) {
      updateData.relation = body.relation;
      updateData.relation_name = RELATION_NAMES[body.relation] || '其他';
    }
    
    // 联系方式
    if (body.phone !== undefined) updateData.phone = body.phone || null;
    if (body.wechat !== undefined) updateData.wechat = body.wechat || null;
    if (body.email !== undefined) updateData.email = body.email || null;
    
    // 个人信息（扩展）
    if (body.gender !== undefined) updateData.gender = body.gender || null;
    if (body.birth_date !== undefined) updateData.birth_date = body.birth_date || null;
    if (body.id_card !== undefined) updateData.id_card = body.id_card || null;
    if (body.education !== undefined) updateData.education = body.education || null;
    if (body.political_status !== undefined) updateData.political_status = body.political_status || null;
    
    // 地址信息
    if (body.household_address !== undefined) updateData.household_address = body.household_address || null;
    if (body.current_address !== undefined) updateData.current_address = body.current_address || null;
    
    // 紧急联系人
    if (body.emergency_contact !== undefined) updateData.emergency_contact = body.emergency_contact || null;
    if (body.emergency_phone !== undefined) updateData.emergency_phone = body.emergency_phone || null;
    
    // 工作信息
    if (body.occupation !== undefined) updateData.occupation = body.occupation || null;
    if (body.work_unit !== undefined) updateData.work_unit = body.work_unit || null;
    
    // 其他信息
    if (body.remark !== undefined) updateData.remark = body.remark || null;
    if (body.is_primary !== undefined) updateData.is_primary = body.is_primary;

    // 执行更新
    const { error: updateError } = await client
      .from('parents')
      .update(updateData)
      .eq('id', id);

    if (updateError) {
      return NextResponse.json(error('更新失败: ' + updateError.message, ErrorCode.DATABASE_ERROR), { status: 500 });
    }

    // 如果更新了手机号，同步更新users表
    if (body.phone !== undefined && body.phone && existingParent.phone) {
      await client
        .from('users')
        .update({ phone: body.phone, updated_at: new Date().toISOString() })
        .eq('phone', existingParent.phone)
        .eq('role', 'parent');
    }

    // 获取更新后的数据
    const { data: updatedParent } = await client
      .from('parents')
      .select('*')
      .eq('id', id)
      .single();

    return NextResponse.json({
      success: true,
      data: updatedParent,
      message: '更新成功',
    });
  } catch (err) {
    console.error('Failed to update parent:', err);
    return NextResponse.json(error('更新家长信息失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
};

export const GET = protectedRoute(handleGetParent);
export const PUT = protectedRoute(handleUpdateParent);
