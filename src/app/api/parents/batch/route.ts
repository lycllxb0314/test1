/**
 * 家长批量操作 API
 * 
 * 功能：
 * - POST /api/parents/batch: 批量操作（开通账号、重置密码）
 * 
 * 家长账号说明：
 * - 家长没有工号(employee_id)，仅通过手机号登录
 * - parents表与users表通过phone字段关联
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { error, ErrorCode } from '@/lib/api-route-utils';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';
import bcrypt from 'bcryptjs';

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
            
            // 检查手机号是否存在
            if (!parent.phone) {
              results.failed++;
              results.errors.push(`家长 ${parent.name} 没有手机号，无法开通账号`);
              continue;
            }
            
            // 检查是否已有账号（通过phone关联）
            const { data: existingUser } = await client
              .from('users')
              .select('id')
              .eq('phone', parent.phone)
              .eq('role', 'parent')
              .single();
            
            if (existingUser) {
              // 已有账号，更新parents表状态
              await client
                .from('parents')
                .update({
                  has_account: true,
                  account_id: existingUser.id,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', parentId);
              
              results.failed++;
              results.errors.push(`家长 ${parent.name} 已有账号（手机号: ${parent.phone}）`);
              continue;
            }
            
            // 生成默认密码
            const defaultPassword = generateDefaultPassword(parent.phone);
            const passwordHash = await bcrypt.hash(defaultPassword, 10);
            
            // 创建用户账号（家长没有employee_id，通过phone登录）
            const accountId = crypto.randomUUID();
            const { error: userError } = await client
              .from('users')
              .insert({
                id: accountId,
                name: parent.name,
                role: 'parent',
                phone: parent.phone,
                password_hash: passwordHash,
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
                password: defaultPassword, // 存储明文密码用于展示（可选，也可只存储hash）
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
            
            if (!parent.has_account || !parent.phone) {
              results.failed++;
              results.errors.push(`家长 ${parent.name} 未开通账号或没有手机号`);
              continue;
            }
            
            // 生成新密码
            const newPassword = generateDefaultPassword(parent.phone);
            const passwordHash = await bcrypt.hash(newPassword, 10);
            
            // 更新家长记录
            const { error: updateError } = await client
              .from('parents')
              .update({
                password: newPassword,
                updated_at: new Date().toISOString(),
              })
              .eq('id', parentId);
            
            if (updateError) {
              results.failed++;
              results.errors.push(`家长 ${parent.name} 重置密码失败`);
              continue;
            }
            
            // 通过phone关联更新users表密码
            const { error: userUpdateError } = await client
              .from('users')
              .update({
                password_hash: passwordHash,
                updated_at: new Date().toISOString(),
              })
              .eq('phone', parent.phone)
              .eq('role', 'parent');
            
            if (userUpdateError) {
              results.failed++;
              results.errors.push(`家长 ${parent.name} 更新用户表密码失败`);
              continue;
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
              .select('id, student_id, name')
              .eq('id', parentId)
              .single();
            
            if (fetchError || !parent) {
              results.failed++;
              results.errors.push(`家长 ${parentId} 不存在`);
              continue;
            }
            
            // 先清除该学生的其他主要联系人
            await client
              .from('parents')
              .update({ is_primary: false })
              .eq('student_id', parent.student_id);
            
            // 设置当前家长为主要联系人
            const { error: updateError } = await client
              .from('parents')
              .update({ is_primary: true, updated_at: new Date().toISOString() })
              .eq('id', parentId);
            
            if (updateError) {
              results.failed++;
              results.errors.push(`家长 ${parent.name} 设置主要联系人失败`);
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
            // 获取家长信息
            const { data: parent, error: fetchError } = await client
              .from('parents')
              .select('id, name, has_account, account_id, phone')
              .eq('id', parentId)
              .single();
            
            if (fetchError || !parent) {
              results.failed++;
              results.errors.push(`家长 ${parentId} 不存在`);
              continue;
            }
            
            // 如果有账号，同时删除users表中的记录
            if (parent.has_account && parent.phone) {
              await client
                .from('users')
                .delete()
                .eq('phone', parent.phone)
                .eq('role', 'parent');
            }
            
            // 删除家长记录
            const { error: deleteError } = await client
              .from('parents')
              .delete()
              .eq('id', parentId);
            
            if (deleteError) {
              results.failed++;
              results.errors.push(`家长 ${parent.name} 删除失败`);
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
        return NextResponse.json(error('未知的操作类型', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      data: results,
      message: `${action} 完成：成功 ${results.success} 个，失败 ${results.failed} 个`,
    });
  } catch (err) {
    console.error('Batch operation error:', err);
    return NextResponse.json(error('操作失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
};

export const POST = protectedRoute(handleBatchOperation);
