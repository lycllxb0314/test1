import { NextRequest, NextResponse } from 'next/server';
import { homeSchoolService } from '@/services/home-school.service';
import { authenticateRequest } from '@/lib/auth/auth-middleware';
import { success, error, ErrorCode } from '@/lib/api';

// GET /api/home-school/conversations - 获取会话列表
// GET /api/home-school/conversations?conversationId=xxx - 获取会话详情（含消息）
// GET /api/home-school/conversations?all=true - 获取所有会话（德育处用）
export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (!authResult.success || !authResult.user) {
    return NextResponse.json(error('请先登录', ErrorCode.UNAUTHORIZED), { status: 401 });
  }

  const teacherId = authResult.user.id;
  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get('conversationId');
  const getAll = searchParams.get('all');

  try {
    if (conversationId) {
      // 获取会话详情（含消息）—— 与心理健康系统对齐
      const detail = await homeSchoolService.getSessionDetail(conversationId, true);
      if (!detail) {
        return NextResponse.json(error('会话不存在', ErrorCode.NOT_FOUND), { status: 404 });
      }
      return NextResponse.json(success(detail));
    } else if (getAll === 'true') {
      // 获取所有会话列表（德育处用）
      const conversations = await homeSchoolService.getAllConversations();
      return NextResponse.json(success(conversations));
    } else {
      // 获取教师的会话列表
      const conversations = await homeSchoolService.getTeacherConversations(teacherId);
      return NextResponse.json(success(conversations));
    }
  } catch (err) {
    console.error('[HomeSchool Conversations API] Error:', err);
    return NextResponse.json(error('获取失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}

// DELETE /api/home-school/conversations - 软删除会话（教师端）
export async function DELETE(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (!authResult.success || !authResult.user) {
    return NextResponse.json(error('请先登录', ErrorCode.UNAUTHORIZED), { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get('conversationId');

  if (!conversationId) {
    return NextResponse.json(error('缺少会话ID', ErrorCode.BAD_REQUEST), { status: 400 });
  }

  try {
    // 软删除：仅对教师端隐藏，后端数据和预警不受影响
    await homeSchoolService.softDeleteConversation(conversationId);
    return NextResponse.json(success(null));
  } catch (err) {
    console.error('[HomeSchool Conversations API] Delete error:', err);
    return NextResponse.json(error('删除失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}
