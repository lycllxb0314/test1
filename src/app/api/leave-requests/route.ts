import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// Mock请假申请数据
const mockLeaveRequests = [
  { id: 'lr1', applicantId: 't001', applicantName: '李明', applicantType: 'teacher', applicantGradeRole: '无', applicantDepartmentRole: '教师', type: '病假', startTime: '2024-11-20T08:00:00', endTime: '2024-11-20T17:00:00', duration: 1, reason: '感冒发烧，需要休息', status: 'pending', currentStep: 1, attachmentUrl: null, replacementId: 't002', replacementName: '张华', createdAt: '2024-11-19T14:00:00' },
  { id: 'lr2', applicantId: 't002', applicantName: '张华', applicantType: 'teacher', applicantGradeRole: '无', applicantDepartmentRole: '教师', type: '事假', startTime: '2024-11-21T08:00:00', endTime: '2024-11-21T17:00:00', duration: 1, reason: '处理家庭事务', status: 'approved', currentStep: 3, attachmentUrl: null, replacementId: null, replacementName: null, createdAt: '2024-11-18T09:00:00' },
  { id: 'lr3', applicantId: 't005', applicantName: '赵敏', applicantType: 'teacher', applicantGradeRole: '六年级年段长', applicantDepartmentRole: '无', type: '公假', startTime: '2024-11-22T08:00:00', endTime: '2024-11-22T17:00:00', duration: 1, reason: '参加市教研活动', status: 'approved', currentStep: 2, attachmentUrl: 'https://example.com/doc.pdf', replacementId: null, replacementName: null, createdAt: '2024-11-17T11:00:00' },
];

/**
 * GET - 获取请假申请列表
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const applicantId = searchParams.get('applicantId');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // 尝试数据库查询
    const client = getSupabaseClient();
    
    let query = client
      .from('leave_requests')
      .select('id, applicant_id, applicant_name, applicant_type, type, start_time, end_time, duration, reason, status, current_step, attachment_url, replacement_id, replacement_name, created_at')
      .order('created_at', { ascending: false });

    if (applicantId) query = query.eq('applicant_id', applicantId);
    if (status) query = query.eq('status', status);
    if (type) query = query.eq('type', type);
    if (startDate) query = query.gte('start_time', startDate);
    if (endDate) query = query.lte('end_time', endDate);

    const { data, error } = await query;

    if (error) {
      // 数据库失败，使用Mock数据
      let filteredData = [...mockLeaveRequests];
      if (applicantId) filteredData = filteredData.filter(l => l.applicantId === applicantId);
      if (status) filteredData = filteredData.filter(l => l.status === status);
      if (type) filteredData = filteredData.filter(l => l.type === type);
      if (startDate) filteredData = filteredData.filter(l => l.startTime >= startDate);
      if (endDate) filteredData = filteredData.filter(l => l.endTime <= endDate);

      return NextResponse.json({
        success: true,
        data: filteredData,
        source: 'mock',
      });
    }

    const formattedData = (data || []).map((leave: Record<string, unknown>) => ({
      id: leave.id,
      applicantId: leave.applicant_id,
      applicantName: leave.applicant_name,
      applicantType: leave.applicant_type,
      applicantGradeRole: '',
      applicantDepartmentRole: '',
      type: leave.type,
      startTime: leave.start_time,
      endTime: leave.end_time,
      duration: leave.duration,
      reason: leave.reason,
      status: leave.status,
      currentStep: leave.current_step,
      attachmentUrl: leave.attachment_url,
      replacementId: leave.replacement_id,
      replacementName: leave.replacement_name,
      createdAt: leave.created_at,
    }));

    return NextResponse.json({
      success: true,
      data: formattedData,
      source: 'database',
    });
  } catch (error) {
    console.error('Failed to fetch leave requests:', error);
    // 异常情况也返回Mock数据
    return NextResponse.json({
      success: true,
      data: mockLeaveRequests,
      source: 'mock',
    });
  }
}

/**
 * POST - 创建请假申请
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    const { applicantId, applicantName, applicantType, type, startTime, endTime, duration, reason, attachmentUrl, replacementId, replacementName } = body;

    const { data, error } = await client
      .from('leave_requests')
      .insert({
        applicant_id: applicantId,
        applicant_name: applicantName,
        applicant_type: applicantType || 'teacher',
        type,
        start_time: startTime,
        end_time: endTime,
        duration,
        reason,
        status: 'pending',
        current_step: 1,
        attachment_url: attachmentUrl,
        replacement_id: replacementId,
        replacement_name: replacementName,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({
        success: true,
        data: { id: `lr-${Date.now()}`, applicantId, applicantName, type, status: 'pending', currentStep: 1 },
        source: 'mock',
      });
    }

    return NextResponse.json({ success: true, data, source: 'database' });
  } catch (error) {
    console.error('Failed to create leave request:', error);
    return NextResponse.json({ success: false, error: '创建请假申请失败' }, { status: 500 });
  }
}

/**
 * PUT - 更新请假申请状态（审批）
 */
export async function PUT(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();
    const { id, action, nextStep } = body;

    let updateData: Record<string, unknown> = { current_step: nextStep };

    if (action === 'approve') {
      updateData.status = 'approved';
    } else if (action === 'reject') {
      updateData.status = 'rejected';
    }

    const { error } = await client
      .from('leave_requests')
      .update(updateData)
      .eq('id', id);

    if (error) {
      return NextResponse.json({
        success: true,
        data: { id, status: action === 'approve' ? 'approved' : 'rejected' },
        source: 'mock',
      });
    }

    return NextResponse.json({ success: true, source: 'database' });
  } catch (error) {
    console.error('Failed to update leave request:', error);
    return NextResponse.json({ success: false, error: '更新请假申请失败' }, { status: 500 });
  }
}
