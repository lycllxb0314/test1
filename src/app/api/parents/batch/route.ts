/**
 * 家长批量操作 API
 * 
 * 功能：
 * - POST /api/parents/batch: 批量操作（开通账号、重置密码）
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { error, ErrorCode } from '@/lib/api-route-utils';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

/**
 * 生成默认密码（手机号后6位）
 */
function generateDefaultPassword(phone?: string): string {
  if (phone && phone.length >= 6) {
    return phone.slice(-6);
  }
  return Math.random().toString(36).slice(-8);
}

/**
 * 简单的密码加密（实际生产环境应使用bcrypt）
 */
function encryptPassword(password: string): string {
  // 使用简单的base64编码，生产环境应使用bcrypt
  return Buffer.from(password).toString('base64');
}

/**
 * POST - 批量操作
 */
const handleBatchOperation = async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const body = await request.json();
    const client = getSupabaseClient();
    
    const { action, parentIds } = body;
    
    if (!action || !parentIds || !Array.isArray(parentIds) || parentIds.length === 0) {
      return NextResponse.json(error('缺少必要参数', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
      data: [] as any[],
    };
    
    switch (action) {
      case 'create_accounts':
        // 批量开通账号
        for (const parentId of parentIds) {
          try {
            // 获取家长信息
            const { data: parent, error: fetchError } = await client
              .from('parents')
              .select('*')
              .eq('id', parentId)
              .single();
            
            if (fetchError || !parent) {
              results.failed++;
              results.errors.push(`家长 ${parentId} 不存在`);
              continue;
            }
            
            if (parent.has_account) {
              results.failed++;
              results.errors.push(`家长 ${parent.name} 已有账号`);
              continue;
            }
            
            // 生成默认密码
            const defaultPassword = generateDefaultPassword(parent.phone);
            const encryptedPassword = encryptPassword(defaultPassword);
            
            // 创建用户账号
            const accountId = `user-parent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const { error: userError } = await client
              .from('users')
              .insert({
                id: accountId,
                name: parent.name,
                role: 'parent',
                phone: parent.phone,
                password: encryptedPassword,
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
            
            if (userError) {
              results.failed++;
              results.errors.push(`家长 ${parent.name} 创建账号失败: ${userError.message}`);
              continue;
            }
            
            // 更新家长记录
            const { error: updateError } = await client
              .from('parents')
              .update({
                has_account: true,
                account_id: accountId,
                password: encryptedPassword,
                updated_at: new Date().toISOString(),
              })
              .eq('id', parentId);
            
            if (updateError) {
              results.failed++;
              results.errors.push(`家长 ${parent.name} 更新状态失败`);
              continue;
            }
            
            results.success++;
            results.data.push({
              id: parentId,
              name: parent.name,
              phone: parent.phone,
              defaultPassword,
            });
          } catch (err) {
            results.failed++;
            results.errors.push(`处理家长 ${parentId} 时出错`);
          }
        }
        break;
      
      case 'reset_passwords':
        // 批量重置密码
        for (const parentId of parentIds) {
          try {
            // 获取家长信息
            const { data: parent, error: fetchError } = await client
              .from('parents')
              .select('*')
              .eq('id', parentId)
              .single();
            
            if (fetchError || !parent) {
              results.failed++;
              results.errors.push(`家长 ${parentId} 不存在`);
              continue;
            }
            
            if (!parent.has_account) {
              results.failed++;
              results.errors.push(`家长 ${parent.name} 未开通账号`);
              continue;
            }
            
            // 生成新密码
            const newPassword = generateDefaultPassword(parent.phone);
            const encryptedPassword = encryptPassword(newPassword);
            
            // 更新家长密码
            const { error: updateError } = await client
              .from('parents')
              .update({
                password: encryptedPassword,
                updated_at: new Date().toISOString(),
              })
              .eq('id', parentId);
            
            if (updateError) {
              results.failed++;
              results.errors.push(`家长 ${parent.name} 重置密码失败`);
              continue;
            }
            
            // 更新用户表密码
            if (parent.account_id) {
              await client
                .from('users')
                .update({
                  password: encryptedPassword,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', parent.account_id);
            }
            
            results.success++;
            results.data.push({
              id: parentId,
              name: parent.name,
              phone: parent.phone,
              newPassword,
            });
          } catch (err) {
            results.failed++;
            results.errors.push(`处理家长 ${parentId} 时出错`);
          }
        }
        break;
      
      case 'set_primary':
        // 批量设置主要联系人
        for (const parentId of parentIds) {
          try {
            const { data: parent, error: fetchError } = await client
              .from('parents')
              .select('student_id, name')
              .eq('id', parentId)
              .single();
            
            if (fetchError || !parent) {
              results.failed++;
              results.errors.push(`家长 ${parentId} 不存在`);
              continue;
            }
            
            // 取消该学生其他家长的主要联系人标记
            await client
              .from('parents')
              .update({ is_primary: false })
              .eq('student_id', parent.student_id);
            
            // 设置当前家长为主要联系人
            const { error: updateError } = await client
              .from('parents')
              .update({
                is_primary: true,
                updated_at: new Date().toISOString(),
              })
              .eq('id', parentId);
            
            if (updateError) {
              results.failed++;
              results.errors.push(`家长 ${parent.name} 设置失败`);
              continue;
            }
            
            results.success++;
          } catch (err) {
            results.failed++;
            results.errors.push(`处理家长 ${parentId} 时出错`);
          }
        }
        break;
      
      case 'delete':
        // 批量删除家长
        for (const parentId of parentIds) {
          try {
            const { error: deleteError } = await client
              .from('parents')
              .delete()
              .eq('id', parentId);
            
            if (deleteError) {
              results.failed++;
              results.errors.push(`删除家长 ${parentId} 失败`);
              continue;
            }
            
            results.success++;
          } catch (err) {
            results.failed++;
            results.errors.push(`处理家长 ${parentId} 时出错`);
          }
        }
        break;
      
      default:
        return NextResponse.json(error('未知操作类型', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      message: `批量操作完成：成功 ${results.success} 条，失败 ${results.failed} 条`,
      data: results,
    });
  } catch (err) {
    console.error('Failed to batch operation:', err);
    return NextResponse.json(error('批量操作失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
};

export const POST = protectedRoute(handleBatchOperation);
