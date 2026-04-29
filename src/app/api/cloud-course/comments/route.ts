import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { success, error, ErrorCode } from '@/lib/api';
import { protectedRoute, type ExtendedRouteContext } from '@/lib/auth/route-protection';

/** 数据库行 → 业务类型 */
function mapCommentFromRow(row: Record<string, unknown>) {
  return {
    id: row.id as string,
    courseId: row.course_id as string,
    chapterId: row.chapter_id as string | null,
    parentId: row.parent_id as string | null,
    userId: row.user_id as string,
    userName: row.user_name as string,
    userRole: row.user_role as string,
    content: row.content as string,
    likesCount: (row.likes_count as number) || 0,
    likedBy: (row.liked_by as string[]) || [],
    isPinned: (row.is_pinned as boolean) || false,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/** GET /api/cloud-course/comments?courseId=xxx&chapterId=xxx */
export const GET = protectedRoute(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const chapterId = searchParams.get('chapterId');

    if (!courseId) {
      return NextResponse.json(error('缺少 courseId', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    const client = getSupabaseClient();

    let query = client
      .from('cloud_course_comments')
      .select('*')
      .eq('course_id', courseId)
      .is('parent_id', null)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (chapterId) {
      query = query.eq('chapter_id', chapterId);
    } else {
      query = query.is('chapter_id', null);
    }

    const { data: topComments, error: fetchError } = await query;

    if (fetchError) {
      console.error('[Comments GET] fetch error:', fetchError.message);
      return NextResponse.json(error('获取评论失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }

    // 获取所有回复
    const topIds = (topComments || []).map((c: Record<string, unknown>) => c.id as string);
    const repliesMap: Record<string, unknown[]> = {};

    if (topIds.length > 0) {
      const { data: repliesData, error: repliesError } = await client
        .from('cloud_course_comments')
        .select('*')
        .in('parent_id', topIds)
        .order('created_at', { ascending: true });

      if (!repliesError && repliesData) {
        for (const r of repliesData) {
          const row = r as Record<string, unknown>;
          const pid = row.parent_id as string;
          if (!repliesMap[pid]) repliesMap[pid] = [];
          repliesMap[pid].push(mapCommentFromRow(row));
        }
      }
    }

    const result = (topComments || []).map((c: Record<string, unknown>) => ({
      ...mapCommentFromRow(c),
      replies: repliesMap[c.id as string] || [],
    }));

    return NextResponse.json(success(result, 'database'));
  } catch (err) {
    console.error('[Comments GET] unexpected error:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}, { optional: true });

/** POST /api/cloud-course/comments */
export const POST = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const body = await request.json();
    const { courseId, chapterId, parentId, content } = body as {
      courseId: string; chapterId?: string | null; parentId?: string | null; content: string;
    };

    if (!courseId || !content?.trim()) {
      return NextResponse.json(error('缺少必要参数', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    const client = getSupabaseClient();

    const insertData: Record<string, unknown> = {
      course_id: courseId,
      user_id: user.id,
      user_name: user.name || '匿名用户',
      user_role: user.role || 'parent',
      content: content.trim(),
    };

    if (chapterId) insertData.chapter_id = chapterId;
    if (parentId) insertData.parent_id = parentId;

    const { data, error: insertError } = await client
      .from('cloud_course_comments')
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error('[Comments POST] insert error:', insertError.message);
      return NextResponse.json(error('发表评论失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }

    return NextResponse.json(success(mapCommentFromRow(data as Record<string, unknown>), 'database'));
  } catch (err) {
    console.error('[Comments POST] unexpected error:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

/** DELETE /api/cloud-course/comments?id=xxx */
export const DELETE = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('id');

    if (!commentId) {
      return NextResponse.json(error('缺少评论ID', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    const client = getSupabaseClient();

    // 只能删除自己的评论
    const { error: deleteError } = await client
      .from('cloud_course_comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('[Comments DELETE] error:', deleteError.message);
      return NextResponse.json(error('删除评论失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }

    return NextResponse.json(success(null, 'database'));
  } catch (err) {
    console.error('[Comments DELETE] unexpected error:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});

/** PATCH /api/cloud-course/comments — 点赞/取消点赞 */
export const PATCH = protectedRoute(async (request: NextRequest, { user }: ExtendedRouteContext) => {
  try {
    const body = await request.json();
    const { commentId, action } = body as { commentId: string; action: 'like' | 'unlike' };

    if (!commentId || !action) {
      return NextResponse.json(error('缺少必要参数', ErrorCode.BAD_REQUEST), { status: 400 });
    }

    const client = getSupabaseClient();

    const { data: comment, error: fetchError } = await client
      .from('cloud_course_comments')
      .select('liked_by, likes_count')
      .eq('id', commentId)
      .single();

    if (fetchError || !comment) {
      return NextResponse.json(error('评论不存在', ErrorCode.NOT_FOUND), { status: 404 });
    }

    const row = comment as Record<string, unknown>;
    const likedBy: string[] = (row.liked_by as string[]) || [];
    const hasLiked = likedBy.includes(user.id);

    let newLikedBy: string[];
    let newCount: number;

    if (action === 'like' && !hasLiked) {
      newLikedBy = [...likedBy, user.id];
      newCount = ((row.likes_count as number) || 0) + 1;
    } else if (action === 'unlike' && hasLiked) {
      newLikedBy = likedBy.filter(id => id !== user.id);
      newCount = Math.max(0, ((row.likes_count as number) || 0) - 1);
    } else {
      return NextResponse.json(success(mapCommentFromRow(row), 'database'));
    }

    const { data: updated, error: updateError } = await client
      .from('cloud_course_comments')
      .update({ liked_by: newLikedBy, likes_count: newCount, updated_at: new Date().toISOString() })
      .eq('id', commentId)
      .select()
      .single();

    if (updateError) {
      console.error('[Comments PATCH] update error:', updateError.message);
      return NextResponse.json(error('操作失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
    }

    return NextResponse.json(success(mapCommentFromRow(updated as Record<string, unknown>), 'database'));
  } catch (err) {
    console.error('[Comments PATCH] unexpected error:', err);
    return NextResponse.json(error('服务器错误', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
});
