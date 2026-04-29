'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare, ThumbsUp, Reply, Trash2, Send,
  ChevronDown, ChevronUp, Pin, MoreHorizontal,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { apiClient } from '@/services/api-client';
import type { CloudCourseComment } from '@/types/cloud-course';

/* ─── 工具函数 ─── */

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}天前`;
  return new Date(dateStr).toLocaleDateString('zh-CN');
}

function getRoleLabel(role: string): string {
  const map: Record<string, string> = {
    parent: '家长', teacher: '教师', head_teacher: '班主任',
    principal: '校长', student: '学生',
  };
  return map[role] || role;
}

function getRoleColor(role: string): string {
  const map: Record<string, string> = {
    parent: 'bg-[#5C7A72]/10 text-[#5C7A72]',
    teacher: 'bg-[#A0785A]/10 text-[#A0785A]',
    head_teacher: 'bg-[#A0785A]/10 text-[#A0785A]',
    principal: 'bg-[#C9A96E]/10 text-[#C9A96E]',
    student: 'bg-[#C8956C]/10 text-[#C8956C]',
  };
  return map[role] || 'bg-muted text-muted-foreground';
}

/* ─── CommentItem ─── */

type CommentItemProps = {
  comment: CloudCourseComment;
  currentUserId: string;
  onReply: (comment: CloudCourseComment) => void;
  onLike: (commentId: string, action: 'like' | 'unlike') => void;
  onDelete: (commentId: string) => void;
  depth?: number;
};

function CommentItem({ comment, currentUserId, onReply, onLike, onDelete, depth = 0 }: CommentItemProps) {
  const [showReplies, setShowReplies] = useState(true);
  const isOwn = comment.userId === currentUserId;
  const hasLiked = comment.likedBy.includes(currentUserId);
  const isReply = depth > 0;

  return (
    <div className={`${isReply ? 'ml-10 border-l-2 border-border/40 pl-4' : ''}`}>
      <div className="flex gap-3 py-3">
        {/* 头像 */}
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className={`text-xs font-medium ${getRoleColor(comment.userRole)}`}>
            {comment.userName?.slice(0, 1) || '?'}
          </AvatarFallback>
        </Avatar>

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-foreground">{comment.userName}</span>
            <Badge variant="outline" className={`text-[9px] h-4 px-1.5 ${getRoleColor(comment.userRole)}`}>
              {getRoleLabel(comment.userRole)}
            </Badge>
            {comment.isPinned && (
              <Pin className="h-3 w-3 text-[#C9A96E]" />
            )}
            <span className="text-[10px] text-muted-foreground">{timeAgo(comment.createdAt)}</span>
          </div>

          <div className="mt-1.5 text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap break-words">
            {comment.content}
          </div>

          {/* 操作栏 */}
          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={() => onLike(comment.id, hasLiked ? 'unlike' : 'like')}
              className={`flex items-center gap-1 text-xs transition-colors ${hasLiked ? 'text-[#C9A96E]' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
              {comment.likesCount > 0 && <span>{comment.likesCount}</span>}
            </button>
            <button
              onClick={() => onReply(comment)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Reply className="h-3.5 w-3.5" />
              回复
            </button>
            {isOwn && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="text-muted-foreground hover:text-foreground transition-colors">
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onDelete(comment.id)} className="text-destructive">
                    <Trash2 className="h-3.5 w-3.5 mr-2" />删除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* 回复列表 */}
          {comment.replies && comment.replies.length > 0 && !isReply && (
            <div className="mt-1">
              {showReplies ? (
                <>
                  {comment.replies.map(reply => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      currentUserId={currentUserId}
                      onReply={onReply}
                      onLike={onLike}
                      onDelete={onDelete}
                      depth={depth + 1}
                    />
                  ))}
                  {comment.replies.length > 2 && (
                    <button
                      onClick={() => setShowReplies(false)}
                      className="text-xs text-muted-foreground hover:text-foreground mt-1 transition-colors"
                    >
                      收起回复
                    </button>
                  )}
                </>
              ) : (
                <button
                  onClick={() => setShowReplies(true)}
                  className="text-xs text-primary hover:text-primary/80 mt-1 transition-colors"
                >
                  展开 {comment.replies.length} 条回复
                </button>
              )}
            </div>
          )}

          {/* 深层回复（depth > 0）不嵌套 */}
          {comment.replies && comment.replies.length > 0 && isReply && (
            <div className="mt-1">
              {comment.replies.map(reply => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  currentUserId={currentUserId}
                  onReply={onReply}
                  onLike={onLike}
                  onDelete={onDelete}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── CourseComments 主组件 ─── */

type CourseCommentsProps = {
  courseId: string;
  chapterId?: string | null;
};

export function CourseComments({ courseId, chapterId }: CourseCommentsProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<CloudCourseComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<CloudCourseComment | null>(null);
  const [sortOrder, setSortOrder] = useState<'latest' | 'popular'>('latest');

  // 加载评论
  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ courseId });
      if (chapterId) params.set('chapterId', chapterId);
      const res = await apiClient.get<CloudCourseComment[]>(`/cloud-course/comments?${params}`);
      if (res.success && res.data) {
        setComments(res.data);
      }
    } catch (err) {
      console.error('[CourseComments] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [courseId, chapterId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // 排序
  const sortedComments = useMemo(() => {
    if (sortOrder === 'popular') {
      return [...comments].sort((a, b) => b.likesCount - a.likesCount);
    }
    return comments; // 默认按时间（pinned 在前），API 已排好
  }, [comments, sortOrder]);

  // 发表评论
  const handleSubmit = useCallback(async () => {
    if (!inputValue.trim() || !user) return;
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        courseId,
        content: inputValue.trim(),
      };
      if (replyTo) {
        body.parentId = replyTo.id;
      }
      if (chapterId) {
        body.chapterId = chapterId;
      }

      const res = await apiClient.post<CloudCourseComment>('/cloud-course/comments', body);
      if (res.success && res.data) {
        if (replyTo) {
          // 添加到对应父评论的 replies
          setComments(prev => prev.map(c => {
            if (c.id === replyTo.id) {
              return { ...c, replies: [...(c.replies || []), res.data!] };
            }
            return c;
          }));
        } else {
          setComments(prev => [res.data!, ...prev]);
        }
        setInputValue('');
        setReplyTo(null);
      }
    } catch (err) {
      console.error('[CourseComments] submit error:', err);
    } finally {
      setSubmitting(false);
    }
  }, [inputValue, user, courseId, chapterId, replyTo]);

  // 点赞
  const handleLike = useCallback(async (commentId: string, action: 'like' | 'unlike') => {
    if (!user) return;
    // 乐观更新
    const updateComment = (c: CloudCourseComment): CloudCourseComment => {
      if (c.id === commentId) {
        const newLikedBy = action === 'like'
          ? [...c.likedBy, user.id]
          : c.likedBy.filter(id => id !== user.id);
        return {
          ...c,
          likesCount: action === 'like' ? c.likesCount + 1 : Math.max(0, c.likesCount - 1),
          likedBy: newLikedBy,
        };
      }
      if (c.replies) {
        return { ...c, replies: c.replies.map(updateComment) };
      }
      return c;
    };
    setComments(prev => prev.map(updateComment));

    try {
      await apiClient.patch('/cloud-course/comments', { commentId, action });
    } catch {
      // 回滚
      fetchComments();
    }
  }, [user, fetchComments]);

  // 删除
  const handleDelete = useCallback(async (commentId: string) => {
    if (!user) return;
    // 乐观删除
    const removeComment = (cs: CloudCourseComment[]): CloudCourseComment[] =>
      cs.filter(c => c.id !== commentId).map(c => ({
        ...c,
        replies: c.replies ? removeComment(c.replies) : [],
      }));
    setComments(prev => removeComment(prev));

    try {
      await apiClient.delete(`/cloud-course/comments?id=${commentId}`);
    } catch {
      fetchComments();
    }
  }, [user, fetchComments]);

  // 回复
  const handleReply = useCallback((comment: CloudCourseComment) => {
    setReplyTo(comment);
    setInputValue('');
    // 滚动到输入框
    document.getElementById('comment-input-area')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  // 统计
  const totalComments = useMemo(() => {
    let count = comments.length;
    for (const c of comments) {
      count += (c.replies?.length || 0);
    }
    return count;
  }, [comments]);

  return (
    <div className="space-y-4">
      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold">交流讨论</h2>
          <span className="text-xs text-muted-foreground">({totalComments})</span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <button
            onClick={() => setSortOrder('latest')}
            className={`px-2.5 py-1 rounded-md transition-colors ${sortOrder === 'latest' ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}
          >
            最新
          </button>
          <button
            onClick={() => setSortOrder('popular')}
            className={`px-2.5 py-1 rounded-md transition-colors ${sortOrder === 'popular' ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}
          >
            最热
          </button>
        </div>
      </div>

      {/* 提示语 */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#C9A96E]/5 rounded-lg border border-[#C9A96E]/15 text-xs text-[#A0785A]">
        <span className="text-base">💡</span>
        <span>分享你的妙招和心得，与大家一起交流成长</span>
      </div>

      {/* 评论输入区 */}
      <div id="comment-input-area" className="space-y-2">
        {replyTo && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-1.5">
            <Reply className="h-3 w-3" />
            <span>回复 <span className="font-medium text-foreground">{replyTo.userName}</span></span>
            <button onClick={() => setReplyTo(null)} className="ml-auto hover:text-foreground">取消</button>
          </div>
        )}
        <div className="flex gap-3">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
              {user?.name?.slice(0, 1) || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder={replyTo ? `回复 ${replyTo.userName}...` : '分享你的妙招、心得或疑问...'}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              rows={3}
              className="resize-none text-sm"
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleSubmit();
                }
              }}
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">Ctrl+Enter 发送</span>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!inputValue.trim() || submitting}
              >
                <Send className="h-3.5 w-3.5 mr-1" />
                {submitting ? '发送中...' : '发送'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 评论列表 */}
      {loading ? (
        <div className="py-12 text-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">加载评论...</p>
        </div>
      ) : sortedComments.length === 0 ? (
        <div className="py-12 text-center">
          <MessageSquare className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">还没有人发言</p>
          <p className="text-xs text-muted-foreground mt-1">来做第一个分享妙招的人吧！</p>
        </div>
      ) : (
        <div className="divide-y divide-border/40">
          {sortedComments.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={user?.id || ''}
              onReply={handleReply}
              onLike={handleLike}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
