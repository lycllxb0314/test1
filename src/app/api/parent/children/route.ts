/**
 * 家长端子女信息 API
 * 
 * 获取当前登录家长的子女信息
 */

import { NextRequest, NextResponse } from 'next/server';
import { parentService } from '@/services/parent.service';
import { error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';

/**
 * GET - 获取当前家长的子女信息
 */
export const GET = protectedRoute(async (request: NextRequest, context: ExtendedRouteContext) => {
  try {
    const user = context.user;
    
    if (!user) {
      return NextResponse.json(error('未登录', ErrorCode.UNAUTHORIZED), { status: 401 });
    }
    
    // 家长角色直接获取子女信息
    if (user.role === 'parent') {
      const result = await parentService.getChildrenByUser(user.id);
      
      if (!result.success) {
        return NextResponse.json(error(result.error || '获取子女信息失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
      }
      
      // 格式化返回数据
      const children = (result.data || []).map(child => ({
        id: child.student_id,
        name: child.student_name,
        classId: child.class_id,
        className: child.class_name,
      }));
      
      return NextResponse.json({ success: true, data: children });
    }
    
    // 其他角色暂不支持
    return NextResponse.json({ success: true, data: [] });
  } catch (err) {
    console.error('获取子女信息失败:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
