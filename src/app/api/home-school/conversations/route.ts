import { NextRequest, NextResponse } from 'next/server';
import { homeSchoolService } from '@/services/home-school.service';
import { authenticateRequest } from '@/lib/auth/auth-middleware';
import { success, error, ErrorCode } from '@/lib/api';

// GET /api/home-school/sessions - 获取会话列表
export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (!authResult.success || !authResult.user) {
    return NextResponse.json(error('请先登录', ErrorCode.UNAUTHORIZED), { status: 401 });
  }

  const teacherId = authResult.user.id;
  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get('conversationId');

  try {
    if (conversationId) {
      // 获取单个会话的消息
      const messages = await homeSchoolService.getConversationMessages(conversationId);
      return NextResponse.json(success(messages));
    } else {
      // 获取会话列表
      const conversations = await homeSchoolService.getTeacherConversations(teacherId);
      return NextResponse.json(success(conversations));
    }
  } catch (err) {
    console.error('[HomeSchool Sessions API] Error:', err);
    return NextResponse.json(error('获取失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}

// DELETE /api/home-school/sessions - 删除会话
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
    await homeSchoolService.softDeleteConversation(conversationId);
    return NextResponse.json(success(null));
  } catch (err) {
    console.error('[HomeSchool Sessions API] Delete error:', err);
    return NextResponse.json(error('删除失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}
