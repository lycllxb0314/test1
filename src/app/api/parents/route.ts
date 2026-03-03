/**
 * 家长管理 API
 * 
 * 功能：
 * - GET: 获取家长列表（支持分页、搜索、筛选）
 * - POST: 创建家长（单个或批量导入）
 * - PUT: 更新家长信息
 * - DELETE: 删除家长
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { success, error, parseQueryParams, ErrorCode } from '@/lib/api-route-utils';
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
 * 生成家长ID
 */
function generateParentId(): string {
  return `parent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 生成默认密码（手机号后6位，没有手机号则生成随机密码）
 */
function generateDefaultPassword(phone?: string): string {
  if (phone && phone.length >= 6) {
    return phone.slice(-6);
  }
  return Math.random().toString(36).slice(-8);
}

/**
 * GET - 获取家长列表
 */
const handleGetParents = async (request: NextRequest, { user }: ExtendedRouteContext) => {
  const params = parseQueryParams(request);
  
  try {
    const client = getSupabaseClient();
    
    // 构建查询
    let query = client
      .from('parents')
      .select('*', { count: 'exact' });
    
    // 搜索过滤
    if (params.search) {
      query = query.or(`name.ilike.%${params.search}%,student_name.ilike.%${params.search}%,phone.ilike.%${params.search}%`);
    }
    
    // 班级筛选
    if (params.classId && params.classId !== 'all') {
      query = query.eq('class_id', params.classId);
    }
    
    // 学生筛选
    if (params.studentId && params.studentId !== 'all') {
      query = query.eq('student_id', params.studentId);
    }
    
    // 关系筛选
    if (params.relation && params.relation !== 'all') {
      query = query.eq('relation', params.relation);
    }
    
    // 账号状态筛选
    if (params.hasAccount !== undefined && params.hasAccount !== 'all') {
      query = query.eq('has_account', params.hasAccount === 'true');
    }
    
    // 分页
    const page = parseInt(String(params.page || '1'));
    const pageSize = parseInt(String(params.pageSize || '20'));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    query = query.range(from, to).order('created_at', { ascending: false });
    
    const { data: parents, error: dbError, count } = await query;
    
    if (dbError) {
      return NextResponse.json(error('数据库查询失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    // 计算统计信息
    const { data: statsData } = await client
      .from('parents')
      .select('has_account, is_primary, relation');
    
    const statistics = {
      total: count || 0,
      hasAccountCount: statsData?.filter(p => p.has_account).length || 0,
      primaryParentCount: statsData?.filter(p => p.is_primary).length || 0,
      relationDistribution: statsData?.reduce((acc, p) => {
        acc[p.relation] = (acc[p.relation] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
    
    return NextResponse.json({
      success: true,
      data: parents,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
      statistics,
    });
  } catch (err) {
    console.error('Failed to fetch parents:', err);
    return NextResponse.json(error('获取家长列表失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
};

/**
 * POST - 创建家长（单个或批量）
 */
const handleCreateParent = async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const body = await request.json();
    const client = getSupabaseClient();
    
    // 批量导入
    if (Array.isArray(body.parents)) {
      const results = {
        success: 0,
        failed: 0,
        errors: [] as string[],
      };
      
      for (const parentData of body.parents) {
        try {
          // 验证学生是否存在
          const { data: student } = await client
            .from('students')
            .select('id, name, class_id, class_name')
            .eq('id', parentData.student_id)
            .single();
          
          if (!student) {
            results.failed++;
            results.errors.push(`学生 ${parentData.student_id} 不存在`);
            continue;
          }
          
          // 创建家长记录
          const newParent = {
            id: generateParentId(),
            student_id: parentData.student_id,
            student_name: student.name,
            class_id: student.class_id,
            class_name: student.class_name,
            name: parentData.name,
            relation: parentData.relation || 'other',
            relation_name: RELATION_NAMES[parentData.relation] || '其他',
            phone: parentData.phone,
            wechat: parentData.wechat,
            id_card: parentData.id_card,
            occupation: parentData.occupation,
            work_unit: parentData.work_unit,
            is_primary: parentData.is_primary || false,
            has_account: false,
            status: 'active',
          };
          
          const { error: insertError } = await client
            .from('parents')
            .insert(newParent);
          
          if (insertError) {
            results.failed++;
            results.errors.push(`家长 ${parentData.name} 创建失败: ${insertError.message}`);
          } else {
            results.success++;
          }
        } catch (err) {
          results.failed++;
          results.errors.push(`处理家长 ${parentData.name} 时出错`);
        }
      }
      
      return NextResponse.json({
        success: true,
        message: `批量导入完成：成功 ${results.success} 条，失败 ${results.failed} 条`,
        data: results,
      });
    }
    
    // 单个创建
    if (!body.student_id || !body.name || !body.relation) {
      return NextResponse.json(error('缺少必填字段', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    // 获取学生信息
    const { data: student, error: fetchError } = await client
      .from('students')
      .select('id, name, class_id, class_name')
      .eq('id', body.student_id)
      .single();
    
    if (fetchError || !student) {
      return NextResponse.json(error('学生不存在', ErrorCode.NOT_FOUND), { status: 404 });
    }
    
    // 如果设置为主要联系人，先取消该学生其他家长的主要联系人标记
    if (body.is_primary) {
      await client
        .from('parents')
        .update({ is_primary: false })
        .eq('student_id', body.student_id);
    }
    
    // 创建家长记录
    const newParent = {
      id: generateParentId(),
      student_id: body.student_id,
      student_name: student.name,
      class_id: student.class_id,
      class_name: student.class_name,
      name: body.name,
      relation: body.relation,
      relation_name: RELATION_NAMES[body.relation] || '其他',
      phone: body.phone,
      wechat: body.wechat,
      id_card: body.id_card,
      occupation: body.occupation,
      work_unit: body.work_unit,
      is_primary: body.is_primary || false,
      has_account: false,
      status: 'active',
    };
    
    const { data, error: insertError } = await client
      .from('parents')
      .insert(newParent)
      .select()
      .single();
    
    if (insertError) {
      return NextResponse.json(error('创建家长失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: '家长创建成功',
      data,
    });
  } catch (err) {
    console.error('Failed to create parent:', err);
    return NextResponse.json(error('创建家长失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
};

/**
 * PUT - 更新家长信息
 */
const handleUpdateParent = async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const body = await request.json();
    const client = getSupabaseClient();
    
    if (!body.id) {
      return NextResponse.json(error('缺少家长ID', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    // 如果设置为主要联系人，先取消该学生其他家长的主要联系人标记
    if (body.is_primary) {
      const { data: parent } = await client
        .from('parents')
        .select('student_id')
        .eq('id', body.id)
        .single();
      
      if (parent) {
        await client
          .from('parents')
          .update({ is_primary: false })
          .eq('student_id', parent.student_id);
      }
    }
    
    // 更新家长信息
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    
    if (body.name) updateData.name = body.name;
    if (body.relation) {
      updateData.relation = body.relation;
      updateData.relation_name = RELATION_NAMES[body.relation] || '其他';
    }
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.wechat !== undefined) updateData.wechat = body.wechat;
    if (body.id_card !== undefined) updateData.id_card = body.id_card;
    if (body.occupation !== undefined) updateData.occupation = body.occupation;
    if (body.work_unit !== undefined) updateData.work_unit = body.work_unit;
    if (body.is_primary !== undefined) updateData.is_primary = body.is_primary;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.remark !== undefined) updateData.remark = body.remark;
    
    const { data, error: updateError } = await client
      .from('parents')
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single();
    
    if (updateError) {
      return NextResponse.json(error('更新家长信息失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: '家长信息更新成功',
      data,
    });
  } catch (err) {
    console.error('Failed to update parent:', err);
    return NextResponse.json(error('更新家长信息失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
};

/**
 * DELETE - 删除家长
 */
const handleDeleteParent = async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const params = parseQueryParams(request);
    const client = getSupabaseClient();
    
    const parentId = params.id;
    if (!parentId) {
      return NextResponse.json(error('缺少家长ID', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    const { error: deleteError } = await client
      .from('parents')
      .delete()
      .eq('id', parentId);
    
    if (deleteError) {
      return NextResponse.json(error('删除家长失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: '家长删除成功',
    });
  } catch (err) {
    console.error('Failed to delete parent:', err);
    return NextResponse.json(error('删除家长失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
};

// 路由处理
export const GET = protectedRoute(handleGetParents);
export const POST = protectedRoute(handleCreateParent);
export const PUT = protectedRoute(handleUpdateParent);
export const DELETE = protectedRoute(handleDeleteParent);
