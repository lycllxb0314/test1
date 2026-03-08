/**
 * 习惯规则配置 API
 * 
 * GET /api/habit/rules - 获取规则配置
 * POST /api/habit/rules - 创建/更新规则配置
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    const academicYear = searchParams.get('academicYear');
    const semester = searchParams.get('semester');
    
    let query = client
      .from('habit_system_rules')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (academicYear) {
      query = query.eq('academic_year', academicYear);
    }
    if (semester) {
      query = query.eq('semester', semester);
    }
    
    const { data, error } = await query;
    
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    const formattedData = (data || []).map(r => ({
      id: r.id,
      academicYear: r.academic_year,
      semester: r.semester,
      startDate: r.start_date,
      endDate: r.end_date,
      monthlyDeadline: r.monthly_deadline,
      checkFrequency: r.check_frequency,
      makeUpDays: r.make_up_days,
      passThreshold: r.pass_threshold,
      starQuotaPerClass: r.star_quota_per_class,
      isActive: r.is_active,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
    
    return NextResponse.json({
      success: true,
      data: formattedData,
    });
  } catch (error) {
    console.error('Failed to fetch habit rules:', error);
    return NextResponse.json({ success: false, error: '获取规则配置失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    
    const {
      academicYear,
      semester,
      startDate,
      endDate,
      monthlyDeadline,
      checkFrequency,
      makeUpDays,
      passThreshold,
      starQuotaPerClass,
    } = body;
    
    if (!academicYear || !semester || !startDate || !endDate) {
      return NextResponse.json({ success: false, error: '学年、学期、开始日期、结束日期为必填项' }, { status: 400 });
    }
    
    // Upsert（存在则更新，不存在则创建）
    const { data, error } = await client
      .from('habit_system_rules')
      .upsert({
        academic_year: academicYear,
        semester,
        start_date: startDate,
        end_date: endDate,
        monthly_deadline: monthlyDeadline || 25,
        check_frequency: checkFrequency || 'daily',
        make_up_days: makeUpDays || 3,
        pass_threshold: passThreshold || 80,
        star_quota_per_class: starQuotaPerClass || 5,
        is_active: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'academic_year,semester'
      })
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        academicYear: data.academic_year,
        semester: data.semester,
        startDate: data.start_date,
        endDate: data.end_date,
        monthlyDeadline: data.monthly_deadline,
        checkFrequency: data.check_frequency,
        makeUpDays: data.make_up_days,
        passThreshold: data.pass_threshold,
        starQuotaPerClass: data.star_quota_per_class,
      },
      message: '规则配置保存成功',
    });
  } catch (error) {
    console.error('Failed to save habit rules:', error);
    return NextResponse.json({ success: false, error: '保存规则配置失败' }, { status: 500 });
  }
}
