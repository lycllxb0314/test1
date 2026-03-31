/**
 * 通讯录 API
 * 
 * GET: 获取通讯录列表
 * POST: 创建通讯录条目
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 * - 使用 protectedRoute 进行认证保护
 */

import { NextRequest, NextResponse } from 'next/server';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth';
import { contactService } from '@/services/contact.service';
import { success, error, ErrorCode } from '@/lib/api';

/**
 * GET - 获取通讯录列表
 */
export const GET = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get('keyword') || undefined;
  const type = searchParams.get('type') || undefined;
  const department = searchParams.get('department') || undefined;

  const result = await contactService.getList({ keyword, type, department });

  if (!result.success || !result.data) {
    return NextResponse.json(
      error(result.error || '获取通讯录列表失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  const formattedData = result.data.map((contact) => ({
    id: contact.id,
    name: contact.name,
    type: contact.type,
    phone: contact.phone,
    email: contact.email,
    department: contact.department,
    position: contact.position,
    createdAt: contact.created_at,
  }));

  return NextResponse.json(success(formattedData));
});

/**
 * POST - 创建通讯录条目
 */
export const POST = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  const body = await request.json();

  const result = await contactService.create({
    name: body.name,
    type: body.type,
    phone: body.phone,
    email: body.email,
    department: body.department,
    position: body.position,
  });

  if (!result.success) {
    return NextResponse.json(
      error(result.error || '创建通讯录条目失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  return NextResponse.json(success(result.data));
});
