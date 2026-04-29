'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/services/api-client';
import { VideoPlayer } from '@/components/cloud-course/VideoPlayer';
import { CourseComments } from '@/components/cloud-course/CourseComments';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BookOpen, ChevronLeft, Clock, CheckCircle2, Play,
  FileText, Radio, Video, Loader2, List, MessageSquare,
} from 'lucide-react';
import { parseVideoUrl } from '@/components/cloud-course/VideoPlayer';
import type { CloudCourse, CloudCourseEnrollment } from '@/types/cloud-course';

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
  const [showChapters, setShowChapters] = useState(false);

  // 加载课程详情和选课信息
  useEffect(() => {
    if (!courseId) return;
    const load = async () => {
      try {
        const courseRes = await apiClient.get<CloudCourse>(`/cloud-course/courses/${courseId}`);
        if (courseRes.success && courseRes.data) {
          const c = courseRes.data;
          setCourse(c);
          const firstVideoChapter = c.chapters?.find(ch => ch.videoUrl);
          if (firstVideoChapter) {
            setActiveChapterId(firstVideoChapter.id);
          } else if (c.chapters?.length) {
            setActiveChapterId(c.chapters[0].id);
          }
        }

        if (user?.id) {
          const enrollRes = await apiClient.get<CloudCourseEnrollment[]>(
            `/cloud-course/enrollments?userId=${user.id}&courseId=${courseId}`
          );
          if (enrollRes.success && enrollRes.data?.length) {
            setEnrollment(enrollRes.data[0]);
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
    setShowChapters(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="text-primary-foreground hover:bg-primary-foreground/10">
              <ChevronLeft className="h-4 w-4 mr-1" />返回
            </Button>
            <h1 className="text-lg font-bold">{course.title}</h1>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-6 py-12 text-center">
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

  // 录播课程学习页面 — 滚动布局
  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航栏 */}
      <header className="bg-card border-b border-border px-4 py-3 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
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
          {course.chapters && course.chapters.length > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowChapters(prev => !prev)}
            >
              <List className="h-4 w-4 mr-1" />
              {showChapters ? '收起' : '章节'}
            </Button>
          )}
        </div>
      </header>

      {/* 章节选择面板（可折叠） */}
      {showChapters && course.chapters && (
        <div className="bg-card border-b border-border sticky top-[57px] z-20">
          <div className="max-w-4xl mx-auto">
            <ScrollArea className="max-h-72">
              <div className="p-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {course.chapters.map((chapter, index) => {
                  const isActive = chapter.id === activeChapterId;
                  const isCompleted = chapterProgressMap[chapter.id]?.completed;

                  return (
                    <button
                      key={chapter.id}
                      onClick={() => handleChapterChange(chapter.id)}
                      className={`text-left px-3 py-2.5 rounded-lg border transition-colors ${
                        isActive
                          ? 'border-primary bg-primary/5'
                          : isCompleted
                            ? 'border-[#5C7A72]/30 bg-[#5C7A72]/5'
                            : 'border-border hover:border-muted-foreground/40'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-medium ${
                          isCompleted
                            ? 'bg-[#5C7A72]/20 text-[#5C7A72]'
                            : isActive
                              ? 'bg-primary/20 text-primary'
                              : 'bg-muted text-muted-foreground'
                        }`}>
                          {isCompleted ? <CheckCircle2 className="h-3 w-3" /> : index + 1}
                        </div>
                        <span className={`text-xs font-medium truncate ${isActive ? 'text-primary' : ''}`}>
                          {chapter.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 ml-7 text-[10px] text-muted-foreground">
                        {chapter.videoUrl && (
                          <span className="flex items-center gap-0.5">
                            <Play className="h-2.5 w-2.5" />
                            {(() => { const info = parseVideoUrl(chapter.videoUrl); return info.platform || '视频'; })()}
                          </span>
                        )}
                        <span className="flex items-center gap-0.5">
                          <Clock className="h-2.5 w-2.5" />{formatDuration(chapter.duration)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}

      {/* 主内容区 — 可滚动 */}
      <main className="max-w-4xl mx-auto">
        {/* 视频播放器 */}
        <div className="bg-black">
          {activeChapter?.videoUrl ? (
            <VideoPlayer
              src={activeChapter.videoUrl}
              initialTime={chapterProgressMap[activeChapter.id]?.currentTime || 0}
              duration={activeChapter.duration}
              onProgressSave={saveProgress}
              onComplete={onChapterComplete}
              className="w-full aspect-video"
            />
          ) : (
            <div className="w-full aspect-video bg-muted/30 flex items-center justify-center">
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
        </div>

        {/* 章节信息 + 快速导航 */}
        <div className="px-6 py-4 border-b border-border bg-card">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              {activeChapter && (
                <>
                  <h2 className="font-medium text-foreground">{activeChapter.title}</h2>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-[10px] h-4">
                      第 {(course.chapters?.findIndex(ch => ch.id === activeChapter.id) || 0) + 1} / {course.chapters?.length || 0} 章
                    </Badge>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(activeChapter.duration)}
                    </span>
                    {chapterProgressMap[activeChapter.id]?.completed && (
                      <span className="flex items-center gap-1 text-[#5C7A72]">
                        <CheckCircle2 className="h-3 w-3" />已完成
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {activeChapter?.documentUrl && (
                <Button variant="outline" size="sm"
                  onClick={() => window.open(activeChapter.documentUrl!, '_blank')}>
                  <FileText className="h-4 w-4 mr-1" />课件资料
                </Button>
              )}
              {/* 上一章/下一章 */}
              {course.chapters && course.chapters.length > 1 && activeChapterId && (() => {
                const idx = course.chapters.findIndex(ch => ch.id === activeChapterId);
                const prev = idx > 0 ? course.chapters[idx - 1] : null;
                const next = idx < course.chapters.length - 1 ? course.chapters[idx + 1] : null;
                return (
                  <>
                    {prev && (
                      <Button variant="outline" size="sm" onClick={() => handleChapterChange(prev.id)}>
                        上一章
                      </Button>
                    )}
                    {next && (
                      <Button size="sm" onClick={() => handleChapterChange(next.id)}>
                        下一章
                      </Button>
                    )}
                  </>
                );
              })()}
            </div>
          </div>

          {/* 章节横向快速导航 */}
          {course.chapters && course.chapters.length > 1 && (
            <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-1">
              {course.chapters.map((chapter, idx) => {
                const isActive = chapter.id === activeChapterId;
                const isCompleted = chapterProgressMap[chapter.id]?.completed;
                return (
                  <button
                    key={chapter.id}
                    onClick={() => handleChapterChange(chapter.id)}
                    className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : isCompleted
                          ? 'bg-[#5C7A72]/10 text-[#5C7A72]'
                          : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 评论区 */}
        <div className="px-6 py-6">
          <CourseComments courseId={courseId} chapterId={activeChapterId} />
        </div>

        {/* 底部间距 */}
        <div className="h-12" />
      </main>
    </div>
  );
}
