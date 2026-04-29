'use client';

/**
 * 课程学习页面
 * 
 * 录播课程：视频播放器 + 章节导航 + 进度追踪
 * 直播课程：跳转到在线云课堂
 * 
 * 路由参数：/cloud-course/learn/[id]
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/services/api-client';
import { VideoPlayer } from '@/components/cloud-course/VideoPlayer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ChevronLeft, Play, CheckCircle2, Clock, FileText,
  Video, Radio, BookOpen, Loader2,
} from 'lucide-react';
import type { CloudCourse, CloudCourseChapter, CloudCourseEnrollment } from '@/types/cloud-course';

type ChapterProgress = {
  chapterId: string;
  completed: boolean;
  currentTime: number;
  watchDuration: number;
};

export default function CourseLearnPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const courseId = params.id as string;

  const [course, setCourse] = useState<CloudCourse | null>(null);
  const [enrollment, setEnrollment] = useState<CloudCourseEnrollment | null>(null);
  const [chapterProgressMap, setChapterProgressMap] = useState<Record<string, ChapterProgress>>({});
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // 加载课程详情和选课信息
  useEffect(() => {
    if (!courseId) return;
    const load = async () => {
      try {
        // 获取课程详情（含章节）
        const courseRes = await apiClient.get<{ data: CloudCourse }>(`/cloud-course/courses/${courseId}`);
        if (courseRes.data?.data) {
          const c = courseRes.data.data;
          setCourse(c);
          // 默认选第一个有视频的章节
          const firstVideoChapter = c.chapters?.find(ch => ch.videoUrl);
          if (firstVideoChapter) {
            setActiveChapterId(firstVideoChapter.id);
          } else if (c.chapters?.length) {
            setActiveChapterId(c.chapters[0].id);
          }
        }

        // 获取选课记录
        if (user?.id) {
          const enrollRes = await apiClient.get<{ data: CloudCourseEnrollment[] }>(
            `/cloud-course/enrollments?userId=${user.id}&courseId=${courseId}`
          );
          if (enrollRes.data?.data?.length) {
            setEnrollment(enrollRes.data.data[0]);
          }
        }
      } catch (err) {
        console.error('[CourseLearnPage] load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId, user?.id]);

  // 当前播放章节
  const activeChapter = useMemo(() => {
    if (!course?.chapters || !activeChapterId) return null;
    return course.chapters.find(ch => ch.id === activeChapterId) || null;
  }, [course, activeChapterId]);

  // 整体进度
  const overallProgress = useMemo(() => {
    if (!course?.chapters?.length) return 0;
    const completedCount = course.chapters.filter(
      ch => chapterProgressMap[ch.id]?.completed
    ).length;
    return Math.round((completedCount / course.chapters.length) * 100);
  }, [course, chapterProgressMap]);

  // 保存进度到后端
  const saveProgress = useCallback(async (data: {
    currentTime: number;
    watchDuration: number;
    progress: number;
  }) => {
    if (!enrollment || !activeChapterId) return;

    const isCompleted = data.progress >= 90;

    setChapterProgressMap(prev => ({
      ...prev,
      [activeChapterId]: {
        chapterId: activeChapterId,
        completed: isCompleted || prev[activeChapterId]?.completed || false,
        currentTime: data.currentTime,
        watchDuration: data.watchDuration,
      },
    }));

    // 调用后端API保存
    try {
      await apiClient.put('/cloud-course/learning', {
        action: 'progress',
        enrollmentId: enrollment.id,
        chapterId: activeChapterId,
        watchDuration: Math.round(data.watchDuration),
        completed: isCompleted,
      });
    } catch (err) {
      console.error('[CourseLearnPage] save progress error:', err);
    }
  }, [enrollment, activeChapterId]);

  // 完成章节
  const onChapterComplete = useCallback(() => {
    if (!activeChapterId) return;
    setChapterProgressMap(prev => ({
      ...prev,
      [activeChapterId]: {
        ...prev[activeChapterId],
        chapterId: activeChapterId,
        completed: true,
        currentTime: prev[activeChapterId]?.currentTime || 0,
        watchDuration: prev[activeChapterId]?.watchDuration || 0,
      },
    }));
  }, [activeChapterId]);

  // 切换章节
  const handleChapterChange = useCallback((chapterId: string) => {
    setActiveChapterId(chapterId);
  }, []);

  // 格式化时长
  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return m > 0 ? `${m}分${s}秒` : `${s}秒`;
  };

  // Loading 状态
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <span className="text-muted-foreground">加载课程中...</span>
        </div>
      </div>
    );
  }

  // 课程不存在
  if (!course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-medium mb-2">课程不存在</h2>
          <Button variant="outline" onClick={() => router.back()}>返回</Button>
        </div>
      </div>
    );
  }

  // 直播课程跳转
  if (course.format === 'live') {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-primary text-primary-foreground px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-primary-foreground hover:bg-primary-foreground/10">
              <ChevronLeft className="h-4 w-4 mr-1" />返回
            </Button>
            <h1 className="text-lg font-bold">{course.title}</h1>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 py-12 text-center">
          <Radio className="h-16 w-16 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">{course.title}</h2>
          <p className="text-muted-foreground mb-6">这是一门直播课程，点击下方按钮进入在线云课堂</p>
          <Button size="lg" onClick={() => router.push(`/cloud-course/live/${courseId}`)}>
            <Video className="h-5 w-5 mr-2" />进入云课堂
          </Button>
        </div>
      </div>
    );
  }

  // 录播课程学习页面
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* 顶部导航栏 */}
      <header className="bg-card border-b border-border px-4 py-3 flex items-center gap-4 shrink-0">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ChevronLeft className="h-4 w-4 mr-1" />返回
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-medium truncate">{course.title}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <Progress value={overallProgress} className="w-20 h-1.5" />
            <span className="text-xs text-muted-foreground">{overallProgress}%</span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSidebarOpen(prev => !prev)}
        >
          {sidebarOpen ? '收起章节' : '展开章节'}
        </Button>
      </header>

      {/* 主体区域：视频 + 章节侧栏 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 视频区域 */}
        <div className="flex-1 flex flex-col min-w-0">
          {activeChapter?.videoUrl ? (
            <div className="flex-1 bg-black flex items-center justify-center">
              <div className="w-full max-h-[calc(100vh-120px)]">
                <VideoPlayer
                  src={activeChapter.videoUrl}
                  initialTime={chapterProgressMap[activeChapter.id]?.currentTime || 0}
                  duration={activeChapter.duration}
                  onProgressSave={saveProgress}
                  onComplete={onChapterComplete}
                  className="w-full aspect-video"
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 bg-muted/30 flex items-center justify-center">
              <div className="text-center">
                <FileText className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">本章节暂无视频内容</p>
                {activeChapter?.documentUrl && (
                  <Button variant="outline" size="sm" className="mt-3"
                    onClick={() => window.open(activeChapter.documentUrl!, '_blank')}>
                    查看文档资料
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* 当前章节信息 */}
          {activeChapter && (
            <div className="px-6 py-4 border-t border-border bg-card">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-medium">{activeChapter.title}</h2>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(activeChapter.duration)}
                    </span>
                    {chapterProgressMap[activeChapter.id]?.completed && (
                      <span className="flex items-center gap-1 text-emerald-600">
                        <CheckCircle2 className="h-3 w-3" />已完成
                      </span>
                    )}
                  </div>
                </div>
                {activeChapter.documentUrl && (
                  <Button variant="outline" size="sm"
                    onClick={() => window.open(activeChapter.documentUrl!, '_blank')}>
                    <FileText className="h-4 w-4 mr-1" />课件资料
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 章节侧栏 */}
        {sidebarOpen && (
          <aside className="w-72 border-l border-border bg-card flex flex-col shrink-0">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-medium">课程章节</h3>
              <div className="flex items-center gap-2 mt-1">
                <Progress value={overallProgress} className="flex-1 h-1.5" />
                <span className="text-xs text-muted-foreground">{overallProgress}%</span>
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2">
                {course.chapters?.map((chapter, index) => {
                  const isActive = chapter.id === activeChapterId;
                  const isCompleted = chapterProgressMap[chapter.id]?.completed;
                  const hasVideo = !!chapter.videoUrl;

                  return (
                    <button
                      key={chapter.id}
                      onClick={() => handleChapterChange(chapter.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-medium ${
                          isCompleted
                            ? 'bg-emerald-100 text-emerald-700'
                            : isActive
                              ? 'bg-primary/20 text-primary'
                              : 'bg-muted text-muted-foreground'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            index + 1
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-medium truncate ${isActive ? 'text-primary' : ''}`}>
                            {chapter.title}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                            {hasVideo && (
                              <span className="flex items-center gap-0.5">
                                <Play className="h-2.5 w-2.5" />视频
                              </span>
                            )}
                            {chapter.documentUrl && (
                              <span className="flex items-center gap-0.5">
                                <FileText className="h-2.5 w-2.5" />课件
                              </span>
                            )}
                            <span className="flex items-center gap-0.5">
                              <Clock className="h-2.5 w-2.5" />{formatDuration(chapter.duration)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </aside>
        )}
      </div>
    </div>
  );
}
