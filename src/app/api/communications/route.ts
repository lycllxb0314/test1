/**
 * 通讯录 API
 * 
 * GET: 获取通讯录列表
 * POST: 创建通讯录条目
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { success, error, ErrorCode } from '@/lib/api';

/**
 * GET - 获取通讯录列表
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get('keyword') || undefined;
  
  const client = getSupabaseClient();
  let query = client.from('contacts').select('*').order('name');
  
  if (keyword) {
    query = query.or(`name.ilike.%${keyword}%,phone.ilike.%${keyword}%,department.ilike.%${keyword}%`);
  }
  
  const { data, error: dbError } = await query;
  
  if (dbError) {
    return NextResponse.json(
      error('获取通讯录列表失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }
  
  return NextResponse.json(success(data || []));
}

/**
 * POST - 创建通讯录条目
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  
  const client = getSupabaseClient();
  const { data, error: dbError } = await client
    .from('contacts')
    .insert({
      name: body.name,
      type: body.type,
      phone: body.phone,
      email: body.email,
      department: body.department,
      position: body.position,
    })
    .select()
    .single();
  
  if (dbError || !data) {
    return NextResponse.json(
      error('创建通讯录条目失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }
  
  return NextResponse.json(success(data));
}
