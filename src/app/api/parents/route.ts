/**
 * 家长 API 路由
 * 
 * 数据源：从 students 表的 parents 字段提取家长信息
 * 家长从属学生 → 从属班级
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { 
  success, 
  error, 
  parseQueryParams,
  ErrorCode 
} from '@/lib/api-route-utils';
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
 * GET - 获取家长列表
 * 
 * 查询参数：
 * - search: 搜索关键词（家长姓名、学生姓名、电话）
 * - classId: 班级筛选
 * - studentId: 学生筛选
 * - relation: 关系筛选
 * - hasAccount: 是否有账号
 */
const handleGetParents = async (request: NextRequest, { user }: ExtendedRouteContext) => {
  const params = parseQueryParams(request);
  
  try {
    const client = getSupabaseClient();
    
    // 获取学生数据（包含家长信息）
    let query = client
      .from('students')
      .select('id, name, class_id, grade, parents, class_name, status');
    
    // 应用筛选
    if (params.classId && params.classId !== 'all') {
      query = query.eq('class_id', params.classId);
    }
    if (params.studentId && params.studentId !== 'all') {
      query = query.eq('id', params.studentId);
    }
    
    const { data: students, error: dbError } = await query;
    
    if (dbError) {
      return NextResponse.json(error('数据库查询失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    // 提取家长信息
    const parentsList: Array<{
      id: string;
      name: string;
      relation: string;
      relationName: string;
      phone?: string;
      wechat?: string;
      email?: string;
      isPrimary: boolean;
      hasAccount: boolean;
      studentId: string;
      studentName: string;
      classId: string;
      className: string;
      grade: number;
    }> = [];
    
    (students || []).forEach(student => {
      const studentParents = student.parents as Array<{
        id: string;
        name: string;
        relation?: string;
        relationship?: string;
        phone?: string;
        wechat?: string;
        email?: string;
        isPrimary?: boolean;
      }> || [];
      
      studentParents.forEach(parent => {
        const relation = parent.relation || 'other';
        const relationName = RELATION_NAMES[relation] || parent.relationship || '其他';
        
        // 搜索过滤
        if (params.search) {
          const term = params.search.toLowerCase();
          const matchName = parent.name?.toLowerCase().includes(term);
          const matchStudentName = student.name?.toLowerCase().includes(term);
          const matchPhone = parent.phone?.includes(term);
          if (!matchName && !matchStudentName && !matchPhone) {
            return; // 跳过不匹配的
          }
        }
        
        // 关系过滤
        if (params.relation && params.relation !== 'all' && relation !== params.relation) {
          return;
        }
        
        parentsList.push({
          id: parent.id,
          name: parent.name,
          relation: relation,
          relationName: relationName,
          phone: parent.phone,
          wechat: parent.wechat,
          email: parent.email,
          isPrimary: parent.isPrimary || false,
          hasAccount: false, // TODO: 从用户表检查
          studentId: student.id,
          studentName: student.name,
          classId: student.class_id,
          className: student.class_name || '',
          grade: student.grade || 1,
        });
      });
    });
    
    // 计算统计信息
    const statistics = {
      total: parentsList.length,
      hasAccountCount: parentsList.filter(p => p.hasAccount).length,
      primaryParentCount: parentsList.filter(p => p.isPrimary).length,
      relationDistribution: parentsList.reduce((acc, p) => {
        acc[p.relation] = (acc[p.relation] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      classCount: new Set(parentsList.map(p => p.classId)).size,
    };
    
    return NextResponse.json({
      success: true,
      data: parentsList,
      statistics,
    });
  } catch (err) {
    console.error('Failed to fetch parents:', err);
    return NextResponse.json(error('获取家长列表失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
};

/**
 * POST - 创建/添加家长
 */
const handleCreateParent = async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const body = await request.json();
    const client = getSupabaseClient();
    
    // 验证必填字段
    if (!body.student_id || !body.name || !body.relation) {
      return NextResponse.json(error('缺少必填字段', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    // 获取学生当前数据
    const { data: student, error: fetchError } = await client
      .from('students')
      .select('parents')
      .eq('id', body.student_id)
      .single();
    
    if (fetchError || !student) {
      return NextResponse.json(error('学生不存在', ErrorCode.NOT_FOUND), { status: 404 });
    }
    
    // 新家长数据
    const newParent = {
      id: `parent-${Date.now()}`,
      name: body.name,
      relation: body.relation,
      relationship: RELATION_NAMES[body.relation] || '其他',
      phone: body.phone,
      wechat: body.wechat,
      email: body.email,
      isPrimary: body.is_primary || false,
    };
    
    // 更新家长列表
    const currentParents = student.parents || [];
    const updatedParents = [...currentParents, newParent];
    
    // 如果设置为主要联系人，取消其他家长的主要联系人标记
    if (newParent.isPrimary) {
      updatedParents.forEach((p, index) => {
        if (index < updatedParents.length - 1) {
          p.isPrimary = false;
        }
      });
    }
    
    // 更新数据库
    const { error: updateError } = await client
      .from('students')
      .update({ parents: updatedParents })
      .eq('id', body.student_id);
    
    if (updateError) {
      return NextResponse.json(error('添加家长失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    return NextResponse.json(success({
      ...newParent,
      student_id: body.student_id,
    }));
  } catch (err) {
    console.error('Failed to create parent:', err);
    return NextResponse.json(error('操作失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
};

// 导出受保护的路由处理器
export const GET = protectedRoute(handleGetParents, { 
  module: 'academic', 
  permission: 'view',
  optional: true,
});

export const POST = protectedRoute(handleCreateParent, { 
  module: 'academic', 
  permission: 'manage',
});
