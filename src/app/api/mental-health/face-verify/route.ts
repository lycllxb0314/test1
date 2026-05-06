/**
 * 人脸验证接口
 * POST /api/mental-health/face-verify
 *
 * 请求体: { studentId: string, image: string (base64) }
 * 返回: { success: boolean, similarity: number, error?: string }
 */
import { NextRequest, NextResponse } from 'next/server';
import { mentalHealthService } from '@/services/mental-health.service';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { success, error, ErrorCode } from '@/lib/api';

export const dynamic = 'force-dynamic';

export const POST = async (request: NextRequest) => {
  try {
    // 验证登录状态
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json(error('请先登录', ErrorCode.UNAUTHORIZED), { status: 401 });
    }

    const client = getSupabaseClient();
    const { data: userRow, error: userErr } = await client
      .from('users')
      .select('phone, role')
      .eq('id', token)
      .single();

    if (userErr || !userRow || userRow.role !== 'parent') {
      return NextResponse.json(error('仅家长可访问', ErrorCode.FORBIDDEN), { status: 403 });
    }

    const body = await request.json();
    const { studentId, image } = body as { studentId?: string; image?: string };

    if (!studentId || !image) {
      return NextResponse.json(error('缺少学生ID或照片', ErrorCode.VALIDATION_ERROR), { status: 400 });
    }

    // 验证该学生确实属于该家长
    const children = await mentalHealthService.getParentChildren(userRow.phone as string);
    const isChild = children.some(c => c.studentId === studentId);
    if (!isChild) {
      return NextResponse.json(error('该学生不是您的孩子', ErrorCode.FORBIDDEN), { status: 403 });
    }

    // 执行人脸验证
    const result = await mentalHealthService.verifyFace(studentId, image);

    if (result.success) {
      return NextResponse.json(success({
        verified: true,
        similarity: result.similarity,
        studentId,
      }, 'database'));
    } else {
      return NextResponse.json(success({
        verified: false,
        similarity: result.similarity,
        error: result.error,
      }, 'database'));
    }
  } catch (err) {
    console.error('[mental-health/face-verify] POST error:', err);
    return NextResponse.json(error('人脸验证失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
};
