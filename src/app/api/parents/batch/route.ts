/**
 * 批量操作家长 API
 * 
 * 架构：API Route → Service → Repository
 * 
 * 支持的操作：
 * - create_accounts: 批量开通账号
 * - reset_passwords: 批量重置密码
 * - set_primary: 批量设置主要联系人
 * - 批量创建家长（默认）
 */

import { NextRequest, NextResponse } from 'next/server';
import { parentService } from '@/services/parent.service';
import { error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

/**
 * POST - 批量操作
 */
export const POST = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const body = await request.json();
    const { action, parentIds, parents } = body;
    
    // 根据操作类型执行不同的批量操作
    switch (action) {
      case 'create_accounts': {
        if (!parentIds || !Array.isArray(parentIds) || parentIds.length === 0) {
          return NextResponse.json(error('请选择要开通账号的家长', ErrorCode.VALIDATION_ERROR), { status: 400 });
        }
        
        const result = await parentService.batchCreateAccounts(parentIds);
        
        if (!result.success) {
          return NextResponse.json(error(result.error || '开通账号失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
        }
        
        return NextResponse.json({
          success: true,
          data: result.data,
          message: `成功开通 ${result.data?.success || 0} 个账号`,
        });
      }
      
      case 'reset_passwords': {
        if (!parentIds || !Array.isArray(parentIds) || parentIds.length === 0) {
          return NextResponse.json(error('请选择要重置密码的家长', ErrorCode.VALIDATION_ERROR), { status: 400 });
        }
        
        const result = await parentService.batchResetPasswords(parentIds);
        
        if (!result.success) {
          return NextResponse.json(error(result.error || '重置密码失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
        }
        
        return NextResponse.json({
          success: true,
          data: result.data,
          message: `成功重置 ${result.data?.success || 0} 个密码`,
        });
      }
      
      case 'set_primary': {
        if (!parentIds || !Array.isArray(parentIds) || parentIds.length === 0) {
          return NextResponse.json(error('请选择要设置的家长', ErrorCode.VALIDATION_ERROR), { status: 400 });
        }
        
        const result = await parentService.batchSetPrimary(parentIds);
        
        if (!result.success) {
          return NextResponse.json(error(result.error || '设置失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
        }
        
        return NextResponse.json({
          success: true,
          data: result.data,
          message: `成功设置 ${result.data?.success || 0} 位主要联系人`,
        });
      }
      
      default: {
        // 默认：批量创建家长
        const parentsList = Array.isArray(body) ? body : parents || [];
        
        if (parentsList.length === 0) {
          return NextResponse.json(error('请提供家长数据', ErrorCode.VALIDATION_ERROR), { status: 400 });
        }
        
        const result = await parentService.batchCreate(parentsList);
        
        if (!result.success) {
          return NextResponse.json(error(result.error || '批量创建失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
        }
        
        return NextResponse.json({
          success: true,
          data: result.data,
          message: `成功创建 ${result.data?.success || 0} 个家长账号`,
        });
      }
    }
  } catch (err) {
    console.error('批量操作家长API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
