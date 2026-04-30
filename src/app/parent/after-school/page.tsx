'use client';

/**
 * 家长端 - 课后服务选课
 *
 * 设计原则：极简、零门槛、防误操作
 * - 只展示孩子能上的课（按年级筛选）
 * - 一键选课/退课，系统自动校验时间冲突
 * - 名额实时更新，无需教师审批
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/services/api-client';
import type { ApiResponse } from '@/services/api-client';
import {
  BookOpen,
  Clock,
  MapPin,
  User,
  Users,
  CheckCircle2,
  XCircle,
  Loader2,
  CalendarDays,
  AlertCircle,
  RefreshCw,
  MessageCircle,
  Send,
  X,
  Sparkles,
} from 'lucide-react';
import type { AfterSchoolCourse, CourseEnrollment } from '@/types/after-school';
import { CATEGORY_CONFIG as CAT_CFG, DAY_LABELS } from '@/types/after-school';
import { useCopilotChat } from '@/hooks/useAfterSchoolAI';

// 图标映射
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  care: <Clock className="h-4 w-4" />,
  interest: <BookOpen className="h-4 w-4" />,
  art: <BookOpen className="h-4 w-4" />,
  sports: <Users className="h-4 w-4" />,
  tech: <BookOpen className="h-4 w-4" />,
  academic: <BookOpen className="h-4 w-4" />,
};

const DAY_NAMES = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export default function ParentAfterSchoolPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<AfterSchoolCourse[]>([]);
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ type: 'enroll' | 'cancel'; course: AfterSchoolCourse } | null>(null);
  const [childInfo, setChildInfo] = useState<{ id: string; name: string; grade: number; className: string } | null>(null);

  // 加载家长子女信息
  useEffect(() => {
    const fetchChildInfo = async () => {
      try {
        const res = await apiClient.get<ApiResponse<Record<string, unknown>[]>>('/parent/children');
        if (res.success && res.data && Array.isArray(res.data) && res.data.length > 0) {
          const child = res.data[0];
          setChildInfo({
            id: (child.id as string) || '',
            name: (child.name as string) || '',
            grade: Number(child.grade) || 1,
            className: (child.className as string) || (child.class_name as string) || '',
          });
        }
      } catch {
        // 忽略
      }
    };
    fetchChildInfo();
  }, []);

  // 加载可选课程
  const fetchCourses = async () => {
    if (!childInfo) return;
    setLoading(true);
    try {
      const res = await apiClient.get<ApiResponse<AfterSchoolCourse[]>>(`/after-school/courses?grade=${childInfo.grade}`);
      if (res.success && res.data) {
        setCourses(Array.isArray(res.data) ? res.data : []);
      }
    } catch {
      toast.error('加载课程失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载已选课程
  const fetchEnrollments = async () => {
    if (!childInfo) return;
    try {
      const res = await apiClient.get<ApiResponse<CourseEnrollment[]>>(`/after-school/enrollments?studentId=${childInfo.id}`);
      if (res.success && res.data) {
        setEnrollments(Array.isArray(res.data) ? res.data : []);
      }
    } catch {
      // 静默处理
    }
  };

  useEffect(() => {
    if (childInfo) {
      fetchCourses();
      fetchEnrollments();
    }
  }, [childInfo]);

  // AI Copilot 聊天
  const { messages, isStreaming, sendMessage, clearMessages } = useCopilotChat(childInfo?.grade || 1);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendChat = () => {
    const text = chatInput.trim();
    if (!text || isStreaming) return;
    sendMessage(text);
    setChatInput('');
  };

  // 已选课程的 ID 集合
  const enrolledCourseIds = new Set(enrollments.filter(e => e.status === 'success').map(e => e.courseId));

  // 一键选课
  const handleEnroll = async (course: AfterSchoolCourse) => {
    if (!childInfo) return;
    setEnrolling(course.id);
    try {
      const res = await apiClient.post<ApiResponse<Record<string, unknown>>>('/after-school/enroll', {
        courseId: course.id,
        studentId: childInfo.id,
        studentName: childInfo.name,
        className: childInfo.className,
      });
      if (res.success) {
        toast.success(`已成功选报「${course.name}」`);
        setConfirmDialog(null);
        fetchCourses();
        fetchEnrollments();
      } else {
        toast.error(res.error || '选课失败');
      }
    } catch {
      toast.error('系统繁忙，请重试');
    } finally {
      setEnrolling(null);
    }
  };

  // 退课
  const handleCancel = async (course: AfterSchoolCourse) => {
    if (!childInfo) return;
    setCancelling(course.id);
    try {
      const res = await apiClient.delete<ApiResponse<null>>('/after-school/enroll', {
        courseId: course.id,
        studentId: childInfo.id,
        cancelReason: '家长主动退课',
      });
      if (res.success) {
        toast.success(`已退选「${course.name}」`);
        setConfirmDialog(null);
        fetchCourses();
        fetchEnrollments();
      } else {
        toast.error(res.error || '退课失败');
      }
    } catch {
      toast.error('系统繁忙，请重试');
    } finally {
      setCancelling(null);
    }
  };

  // 渲染课程卡片
  const renderCourseCard = (course: AfterSchoolCourse) => {
    const isEnrolled = enrolledCourseIds.has(course.id);
    const isFull = course.currentStudents >= course.maxStudents;
    const remaining = course.maxStudents - course.currentStudents;
    const catCfg = CAT_CFG[course.category] || CAT_CFG.interest;
    const catIcon = CATEGORY_ICONS[course.category] || <BookOpen className="h-4 w-4" />;

    return (
      <Card key={course.id} className={`overflow-hidden transition-all duration-200 ${isEnrolled ? 'ring-2 ring-[#5C7A72]/30' : 'hover:shadow-md'}`}>
        {/* 顶部色条 */}
        <div className={`h-1.5 ${isEnrolled ? 'bg-[#5C7A72]' : 'bg-muted'} `} />

        <CardContent className="p-4 space-y-3">
          {/* 标题行 */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">{course.name}</h3>
              <div className={`inline-flex items-center gap-1 text-xs mt-1 ${catCfg.color}`}>
                {catIcon}
                <span>{catCfg.label}</span>
              </div>
            </div>
            {isEnrolled ? (
              <Badge className="bg-[#5C7A72]/10 text-[#5C7A72] border-[#5C7A72]/30 text-xs">已选报</Badge>
            ) : isFull ? (
              <Badge variant="destructive" className="text-xs">名额已满</Badge>
            ) : (
              <Badge variant="outline" className="text-xs text-[#C9A96E] border-[#C9A96E]/30">
                余 {remaining} 人
              </Badge>
            )}
          </div>

          {/* 详细信息 */}
          <div className="space-y-1.5 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <User className="h-3.5 w-3.5" />
              <span>{course.teacherName}</span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-3.5 w-3.5" />
              <span>{DAY_NAMES[course.dayOfWeek] || DAY_LABELS[course.dayOfWeek]} {course.startTime}-{course.endTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" />
              <span>{course.classroom}</span>
            </div>
          </div>

          {/* 课程简介 */}
          {course.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{course.description}</p>
          )}

          {/* 名额进度条 */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>报名进度</span>
              <span>{course.currentStudents}/{course.maxStudents}</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isFull ? 'bg-destructive' : course.currentStudents / course.maxStudents > 0.8 ? 'bg-[#C9A96E]' : 'bg-[#5C7A72]'
                }`}
                style={{ width: `${Math.min((course.currentStudents / course.maxStudents) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2 pt-1">
            {isEnrolled ? (
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => setConfirmDialog({ type: 'cancel', course })}
                disabled={cancelling === course.id}
              >
                {cancelling === course.id ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <XCircle className="h-3.5 w-3.5 mr-1" />}
                退选
              </Button>
            ) : (
              <Button
                size="sm"
                className="flex-1 bg-[#5C7A72] hover:bg-[#4A6A62] text-white"
                onClick={() => setConfirmDialog({ type: 'enroll', course })}
                disabled={isFull || enrolling === course.id}
              >
                {enrolling === course.id ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                ) : isFull ? (
                  '已被抢空'
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                )}
                {enrolling === course.id ? '提交中...' : isFull ? '已被抢空' : '一键选课'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // 确认弹窗
  const renderConfirmDialog = () => {
    if (!confirmDialog) return null;
    const { type, course } = confirmDialog;
    const remaining = course.maxStudents - course.currentStudents;

    return (
      <Dialog open={!!confirmDialog} onOpenChange={() => setConfirmDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{type === 'enroll' ? '确认选课' : '确认退选'}</DialogTitle>
            <DialogDescription>
              {type === 'enroll'
                ? `确定为 ${childInfo?.name} 选报以下课程？`
                : `确定退选以下课程？退课后名额将释放给其他同学。`}
            </DialogDescription>
          </DialogHeader>

          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <p className="font-medium text-foreground">{course.name}</p>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>授课教师：{course.teacherName}</p>
              <p>上课时间：{DAY_NAMES[course.dayOfWeek] || DAY_LABELS[course.dayOfWeek]} {course.startTime}-{course.endTime}</p>
              <p>上课地点：{course.classroom}</p>
              {type === 'enroll' && <p>剩余名额：{remaining} 人</p>}
            </div>
          </div>

          {type === 'enroll' && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700">
                选课后系统将自动校验时间冲突，同一时段只能选一门课。选课成功后如需调整，请先退选再重新选课。
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>取消</Button>
            {type === 'enroll' ? (
              <Button
                className="bg-[#5C7A72] hover:bg-[#4A6A62] text-white"
                onClick={() => handleEnroll(course)}
                disabled={enrolling === course.id}
              >
                {enrolling === course.id && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
                确认选课
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={() => handleCancel(course)}
                disabled={cancelling === course.id}
              >
                {cancelling === course.id && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
                确认退选
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  if (!childInfo && !loading) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
        <p className="text-muted-foreground">未关联子女信息，无法使用选课功能</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* 页头 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">课后服务选课</h1>
          <p className="text-muted-foreground mt-1">
            {childInfo ? `${childInfo.name} · ${childInfo.className}` : '加载中...'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => { fetchCourses(); fetchEnrollments(); }}>
          <RefreshCw className="h-3.5 w-3.5 mr-1" />刷新
        </Button>
      </div>

      <Tabs defaultValue="available">
        <TabsList>
          <TabsTrigger value="available">
            可选课程
            {courses.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[10px] h-4 px-1">{courses.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="enrolled">
            已选课程
            {enrolledCourseIds.size > 0 && (
              <Badge className="ml-1.5 bg-[#5C7A72] text-[10px] h-4 px-1">{enrolledCourseIds.size}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* 可选课程列表 */}
        <TabsContent value="available" className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground">当前年级暂无可选课程</p>
              <p className="text-sm text-muted-foreground mt-1">请等待教务处发布课程</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courses.map(renderCourseCard)}
            </div>
          )}
        </TabsContent>

        {/* 已选课程列表 */}
        <TabsContent value="enrolled" className="mt-4">
          {enrollments.filter(e => e.status === 'success').length === 0 ? (
            <div className="text-center py-16">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground">暂未选报任何课程</p>
              <p className="text-sm text-muted-foreground mt-1">点击"可选课程"开始选课</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {enrollments
                .filter(e => e.status === 'success')
                .map(enrollment => {
                  const course = courses.find(c => c.id === enrollment.courseId);
                  if (!course) return null;
                  return renderCourseCard(course);
                })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {renderConfirmDialog()}

      {/* AI 智能选课助手 - 浮动按钮 */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#5C7A72] text-white px-4 py-3 rounded-full shadow-lg hover:bg-[#4A6A62] transition-all hover:scale-105"
        >
          <Sparkles className="h-5 w-5" />
          <span className="text-sm font-medium">选课助手</span>
        </button>
      )}

      {/* AI 聊天面板 */}
      {chatOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-h-[520px] bg-background border border-border rounded-xl shadow-xl flex flex-col overflow-hidden">
          {/* 面板头部 */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#5C7A72] text-white">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">AI 选课助手</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={clearMessages} className="p-1 hover:bg-white/20 rounded" title="清空对话">
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setChatOpen(false)} className="p-1 hover:bg-white/20 rounded">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* 消息区域 */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[300px] max-h-[380px]">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">您好！我是AI选课助手</p>
                <p className="text-xs text-muted-foreground mt-1">可以问我课程推荐、时间安排等问题</p>
                <div className="mt-4 space-y-2">
                  {['有哪些适合的课程？', '帮我推荐周一的课程', '名额最多的课是哪个？'].map((q) => (
                    <button
                      key={q}
                      onClick={() => { setChatInput(q); }}
                      className="block w-full text-left text-xs bg-muted/50 hover:bg-muted rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'bg-[#5C7A72] text-white'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {isStreaming && messages[messages.length - 1]?.content === '' && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-3 py-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* 输入区域 */}
          <div className="border-t border-border p-3">
            <div className="flex items-center gap-2">
              <Input
                value={chatInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setChatInput(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendChat();
                  }
                }}
                placeholder="输入您的问题..."
                className="flex-1 h-9 text-sm"
                disabled={isStreaming}
              />
              <Button
                size="sm"
                onClick={handleSendChat}
                disabled={isStreaming || !chatInput.trim()}
                className="bg-[#5C7A72] hover:bg-[#4A6A62] text-white h-9 w-9 p-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
