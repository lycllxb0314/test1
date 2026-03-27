/**
 * 学生荣誉单项操作 API
 * 
 * 功能：
 * - GET: 获取单个荣誉详情
 * - PUT: 更新荣誉
 * - DELETE: 删除荣誉
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getUserFromSession } from '@/lib/auth/session';
import { success, error, ErrorCode } from '@/lib/api';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET - 获取单个荣誉详情
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = getSupabaseClient();
    const { id } = await params;
    
    const { data, error: fetchError } = await supabase
      .from('student_honors')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(error('荣誉不存在', ErrorCode.NOT_FOUND), { status: 404 });
      }
      console.error('获取荣誉详情失败:', fetchError);
      return NextResponse.json(error('获取荣誉详情失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    // 转换为驼峰命名
    const honor = {
      id: data.id,
      studentId: data.student_id,
      studentName: data.student_name,
      className: data.class_name,
      grade: data.grade,
      title: data.title,
      level: data.level,
      category: data.category,
      issuer: data.issuer,
      date: data.date,
      certificateNo: data.certificate_no,
      description: data.description,
      createdAt: data.created_at,
    };
    
    return NextResponse.json({ success: true, data: honor });
  } catch (err) {
    console.error('获取荣誉详情API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}

/**
 * PUT - 更新荣誉
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = getSupabaseClient();
    const user = await getUserFromSession(request);
    const { id } = await params;
    
    if (!user) {
      return NextResponse.json(error('未登录', ErrorCode.UNAUTHORIZED), { status: 401 });
    }
    
    const body = await request.json();
    
    // 构建更新对象
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    
    // 只更新提供的字段
    if (body.studentId !== undefined) updateData.student_id = body.studentId;
    if (body.studentName !== undefined) updateData.student_name = body.studentName;
    if (body.className !== undefined) updateData.class_name = body.className;
    if (body.grade !== undefined) updateData.grade = body.grade;
    if (body.title !== undefined) updateData.title = body.title;
    if (body.level !== undefined) updateData.level = body.level;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.issuer !== undefined) updateData.issuer = body.issuer;
    if (body.date !== undefined) updateData.date = body.date;
    if (body.certificateNo !== undefined) updateData.certificate_no = body.certificateNo;
    if (body.description !== undefined) updateData.description = body.description;
    
    const { data, error: updateError } = await supabase
      .from('student_honors')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (updateError) {
      console.error('更新荣誉失败:', updateError);
      return NextResponse.json(error('更新荣誉失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    if (!data) {
      return NextResponse.json(error('荣誉不存在', ErrorCode.NOT_FOUND), { status: 404 });
    }
    
    return NextResponse.json(success(data, 'database'));
  } catch (err) {
    console.error('更新荣誉API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}

/**
 * DELETE - 删除荣誉
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = getSupabaseClient();
    const user = await getUserFromSession(request);
    const { id } = await params;
    
    if (!user) {
      return NextResponse.json(error('未登录', ErrorCode.UNAUTHORIZED), { status: 401 });
    }
    
    // 先检查是否存在
    const { data: existing } = await supabase
      .from('student_honors')
      .select('id')
      .eq('id', id)
      .single();
    
    if (!existing) {
      return NextResponse.json(error('荣誉不存在', ErrorCode.NOT_FOUND), { status: 404 });
    }
    
    // 删除
    const { error: deleteError } = await supabase
      .from('student_honors')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      console.error('删除荣誉失败:', deleteError);
      return NextResponse.json(error('删除荣誉失败', ErrorCode.DATABASE_ERROR), { status: 500 });
    }
    
    return NextResponse.json({ success: true, message: '删除成功' });
  } catch (err) {
    console.error('删除荣誉API错误:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}
