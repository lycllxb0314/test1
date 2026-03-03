import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * GET - 获取教师详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;

    const { data, error } = await client
      .from('teachers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
      }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({
        success: false,
        error: '教师不存在',
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Failed to fetch teacher:', error);
    return NextResponse.json({
      success: false,
      error: '获取教师详情失败',
    }, { status: 500 });
  }
}

/**
 * PATCH - 部分更新教师信息
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;
    const body = await request.json();

    // 驼峰转下划线
    const dbData: Record<string, unknown> = {};
    
    // 基本字段映射
    if (body.name !== undefined) dbData.name = body.name;
    if (body.gender !== undefined) dbData.gender = body.gender;
    if (body.department !== undefined) dbData.department = body.department;
    if (body.title !== undefined) dbData.title = body.title;
    if (body.phone !== undefined) dbData.phone = body.phone;
    if (body.email !== undefined) dbData.email = body.email;
    if (body.status !== undefined) dbData.status = body.status;
    
    // 扩展字段映射
    if (body.birthDate !== undefined) dbData.birth_date = body.birthDate;
    if (body.idCard !== undefined) dbData.id_card = body.idCard;
    if (body.ethnicity !== undefined) dbData.ethnicity = body.ethnicity;
    if (body.politicalStatus !== undefined) dbData.political_status = body.politicalStatus;
    if (body.nativePlace !== undefined) dbData.native_place = body.nativePlace;
    if (body.emergencyContact !== undefined) dbData.emergency_contact = body.emergencyContact;
    if (body.emergencyPhone !== undefined) dbData.emergency_phone = body.emergencyPhone;
    if (body.address !== undefined) dbData.address = body.address;
    if (body.education !== undefined) dbData.education = body.education;
    if (body.school !== undefined) dbData.school = body.school;
    if (body.major !== undefined) dbData.major = body.major;
    if (body.graduationDate !== undefined) dbData.graduation_date = body.graduationDate;
    if (body.joinDate !== undefined) dbData.join_date = body.joinDate;
    if (body.titleDate !== undefined) dbData.title_date = body.titleDate;
    if (body.teachYears !== undefined) dbData.teach_years = body.teachYears;
    
    // 学科相关
    if (body.subject !== undefined) {
      dbData.primary_subject = body.subject;
      dbData.subjects = [body.subject];
    }
    if (body.teachableSubjects !== undefined) {
      dbData.subjects = body.teachableSubjects;
    }
    
    dbData.updated_at = new Date().toISOString();

    const { data, error } = await client
      .from('teachers')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
      message: '教师信息更新成功',
    });
  } catch (error) {
    console.error('Failed to update teacher:', error);
    return NextResponse.json({
      success: false,
      error: '更新教师信息失败',
    }, { status: 500 });
  }
}

/**
 * PUT - 更新教师信息（完整更新）
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;
    const body = await request.json();

    const { data, error } = await client
      .from('teachers')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
      message: '教师信息更新成功',
    });
  } catch (error) {
    console.error('Failed to update teacher:', error);
    return NextResponse.json({
      success: false,
      error: '更新教师信息失败',
    }, { status: 500 });
  }
}

/**
 * DELETE - 删除教师
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseClient();
    const { id } = await params;

    const { error } = await client
      .from('teachers')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: '教师删除成功',
    });
  } catch (error) {
    console.error('Failed to delete teacher:', error);
    return NextResponse.json({
      success: false,
      error: '删除教师失败',
    }, { status: 500 });
  }
}
