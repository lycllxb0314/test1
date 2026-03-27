/**
 * 审批人选项 API
 * 
 * 获取校长室领导列表（用于请假审批人选择）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';
import { success, error, ErrorCode } from '@/lib/api';

/**
 * GET - 获取审批人选项
 * 
 * 返回校长室领导列表：
 * - 校长 (principal)
 * - 书记 (secretary)
 * - 教学副校长 (academic_vice_principal)
 * - 德育副校长 (moral_vice_principal)
 * - 总务副校长 (general_vice_principal)
 */
export const GET = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const client = getSupabaseClient();
    
    // 查询校长室角色的用户
    const leaderRoles = [
      'principal',
      'secretary', 
      'academic_vice_principal',
      'moral_vice_principal',
      'general_vice_principal',
    ];
    
    const { data, error: dbError } = await client
      .from('users')
      .select('employee_id, name, role, department, position')
      .in('role', leaderRoles)
      .eq('status', 'active')
      .order('role');
    
    if (dbError) {
      console.error('获取审批人列表失败:', dbError);
      return NextResponse.json(error('获取审批人列表失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    // 角色名称映射
    const roleNames: Record<string, string> = {
      principal: '校长',
      secretary: '书记',
      academic_vice_principal: '教学副校长',
      moral_vice_principal: '德育副校长',
      general_vice_principal: '总务副校长',
    };
    
    // 转换数据格式
    const approvers = (data || []).map(user => ({
      employeeId: user.employee_id,
      name: user.name,
      role: user.role,
      roleName: roleNames[user.role] || user.role,
      department: user.department,
      position: user.position,
    }));
    
    return NextResponse.json(success(approvers, 'database'));
    
  } catch (err) {
    console.error('获取审批人列表失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
