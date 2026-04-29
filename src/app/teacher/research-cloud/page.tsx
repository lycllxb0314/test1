'use client';

/**
 * 教师研修页面
 * 
 * 课程库浏览 + 我的研修 + 课程详情
 * 录播课程 → 跳转到 /cloud-course/learn/[id]
 * 直播课程 → 跳转到 /cloud-course/live/[id]
 */

import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCloudCourses, useCloudCourseEnrollments, useCloudCourseDetail } from '@/hooks/useCloudCourse';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  BookOpen, Search, Play, Clock, Users, Star, Video, FileText,
  ChevronLeft, Radio, ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import type { CloudCourse, CloudCourseEnrollment } from '@/types/cloud-course';

type TabKey = 'catalog' | 'my' | 'detail';

export default function ResearchPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('catalog');
  const [keyword, setKeyword] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const { courses, loading } = useCloudCourses('research', keyword || undefined);
  const { enrollments, loading: enrollLoading, enroll } = useCloudCourseEnrollments(user?.id || null);
  const { course: detailCourse, loading: detailLoading } = useCloudCourseDetail(selectedCourseId);

  const myEnrollments = useMemo(() =>
    enrollments.filter(e => e.course?.domain === 'research'),
    [enrollments]
  );

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h${m}m` : m > 0 ? `${m}分钟` : '暂无';
  };

  const handleViewCourse = (courseId: string) => {
    setSelectedCourseId(courseId);
    setActiveTab('detail');
  };

  const handleEnroll = async (courseId: string) => {
    const result = await enroll(courseId);
    if (result) {
      setSelectedCourseId(courseId);
      setActiveTab('detail');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 头部 */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b border-border px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-1">教师研修</h1>
          <p className="text-muted-foreground">专业发展 · 教学提升 · 学科前沿</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)}>
          <TabsList className="mb-6">
            <TabsTrigger value="catalog">研修课程库</TabsTrigger>
            <TabsTrigger value="my">我的研修</TabsTrigger>
            {selectedCourseId && <TabsTrigger value="detail">课程详情</TabsTrigger>}
          </TabsList>

          {/* ========== 课程库 ========== */}
          <TabsContent value="catalog">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索研修课程..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-44 bg-muted rounded-t-lg" />
                    <CardContent className="p-4">
                      <div className="h-4 bg-muted rounded mb-2" />
                      <div className="h-3 bg-muted rounded w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : courses.length === 0 ? (
              <Card className="p-16 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">暂无研修课程</h3>
                <p className="text-muted-foreground">目前没有可用的研修课程</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {courses.map(course => (
                  <Card
                    key={course.id}
                    className="overflow-hidden cursor-pointer group hover:shadow-lg transition-all duration-200 border-border/60"
                    onClick={() => handleViewCourse(course.id)}
                  >
                    {/* 封面区域 */}
                    <div className="h-44 relative overflow-hidden">
                      {course.coverImage ? (
                        <img src={course.coverImage} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/8 via-primary/4 to-muted flex items-center justify-center">
                          <BookOpen className="h-10 w-10 text-primary/20" />
                        </div>
                      )}
                      {/* 格式标签 */}
                      <div className="absolute top-3 left-3">
                        {course.format === 'live' ? (
                          <Badge className="bg-red-500 text-white hover:bg-red-600">
                            <Radio className="h-3 w-3 mr-1" />直播
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-black/60 text-white hover:bg-black/70">
                            <Play className="h-3 w-3 mr-1" />录播
                          </Badge>
                        )}
                      </div>
                      {/* 时长标签 */}
                      {course.totalDuration > 0 && (
                        <div className="absolute bottom-3 right-3">
                          <Badge variant="secondary" className="bg-black/60 text-white text-xs">
                            {formatDuration(course.totalDuration)}
                          </Badge>
                        </div>
                      )}
                    </div>
                    {/* 内容区域 */}
                    <CardContent className="p-4">
                      <h3 className="font-medium text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                        {course.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{course.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{course.enrolledCount}人</span>
                          {course.rating > 0 && (
                            <span className="flex items-center gap-1"><Star className="h-3 w-3 text-amber-500" />{course.rating.toFixed(1)}</span>
                          )}
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ========== 我的研修 ========== */}
          <TabsContent value="my">
            {enrollLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="animate-pulse p-4"><div className="h-4 bg-muted rounded mb-2" /></Card>
                ))}
              </div>
            ) : myEnrollments.length === 0 ? (
              <Card className="p-16 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">尚未参加研修</h3>
                <p className="text-muted-foreground mb-4">浏览课程库，选择感兴趣的课程开始学习</p>
                <Button onClick={() => setActiveTab('catalog')}>浏览课程</Button>
              </Card>
            ) : (
              <div className="space-y-3">
                {myEnrollments.map(enrollment => {
                  const isLive = enrollment.course?.format === 'live';
                  const learnPath = isLive
                    ? `/cloud-course/live/${enrollment.courseId}`
                    : `/cloud-course/learn/${enrollment.courseId}`;

                  return (
                    <Card key={enrollment.id} className="p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-center gap-4">
                        {/* 格式图标 */}
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${
                          isLive ? 'bg-red-50 text-red-600' : 'bg-primary/10 text-primary'
                        }`}>
                          {isLive ? <Radio className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                        </div>
                        {/* 信息 */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm truncate">{enrollment.course?.title || '课程'}</h3>
                          <div className="flex items-center gap-3 mt-1.5">
                            <Badge variant={enrollment.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                              {enrollment.status === 'completed' ? '已完成' : enrollment.status === 'learning' ? '学习中' : '已选课'}
                            </Badge>
                            {isLive && <Badge variant="outline" className="text-xs text-red-600">直播</Badge>}
                          </div>
                        </div>
                        {/* 进度/操作 */}
                        <div className="flex items-center gap-4 shrink-0">
                          {!isLive && enrollment.progress < 100 && (
                            <div className="text-right">
                              <div className="text-sm font-medium">{Math.round(enrollment.progress)}%</div>
                              <Progress value={enrollment.progress} className="w-20 h-1.5 mt-1" />
                            </div>
                          )}
                          <Link href={learnPath}>
                            <Button size="sm">
                              {enrollment.status === 'completed' ? '回顾' : isLive ? '进入课堂' : '继续学习'}
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ========== 课程详情 ========== */}
          <TabsContent value="detail">
            {selectedCourseId && (
              <CourseDetail
                courseId={selectedCourseId}
                course={detailCourse}
                loading={detailLoading}
                isEnrolled={myEnrollments.some(e => e.courseId === selectedCourseId)}
                enrollment={myEnrollments.find(e => e.courseId === selectedCourseId) || null}
                onEnroll={() => handleEnroll(selectedCourseId)}
                onBack={() => setActiveTab('catalog')}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/** 课程详情组件 */
function CourseDetail({ courseId, course, loading, isEnrolled, enrollment, onEnroll, onBack }: {
  courseId: string;
  course: CloudCourse | null;
  loading: boolean;
  isEnrolled: boolean;
  enrollment: CloudCourseEnrollment | null;
  onEnroll: () => void;
  onBack: () => void;
}) {
  if (loading) {
    return <Card className="p-8 animate-pulse"><div className="h-6 bg-muted rounded mb-4" /><div className="h-4 bg-muted rounded w-2/3" /></Card>;
  }
  if (!course) {
    return <Card className="p-8 text-center"><p>课程不存在</p></Card>;
  }

  const isLive = course.format === 'live';
  const learnPath = isLive ? `/cloud-course/live/${courseId}` : `/cloud-course/learn/${courseId}`;
  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h${m}m` : m > 0 ? `${m}分钟` : '暂无';
  };

  return (
    <div>
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ChevronLeft className="h-4 w-4 mr-1" />返回
      </Button>

      {/* 课程头部 */}
      <Card className="overflow-hidden mb-6">
        <div className="flex flex-col md:flex-row">
          {/* 封面 */}
          <div className="md:w-80 h-48 md:h-auto shrink-0 bg-gradient-to-br from-primary/8 to-muted flex items-center justify-center">
            {course.coverImage ? (
              <img src={course.coverImage} alt={course.title} className="w-full h-full object-cover" />
            ) : (
              <BookOpen className="h-16 w-16 text-primary/20" />
            )}
          </div>
          {/* 信息 */}
          <div className="flex-1 p-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {isLive ? (
                    <Badge className="bg-red-500 text-white"><Radio className="h-3 w-3 mr-1" />直播</Badge>
                  ) : (
                    <Badge variant="secondary"><Play className="h-3 w-3 mr-1" />录播</Badge>
                  )}
                  {course.category && <Badge variant="outline">{course.category}</Badge>}
                </div>
                <h2 className="text-xl font-bold">{course.title}</h2>
              </div>
              {isEnrolled ? (
                <Link href={learnPath}>
                  <Button>{isLive ? '进入课堂' : '开始学习'}</Button>
                </Link>
              ) : (
                <Button onClick={onEnroll}>参加研修</Button>
              )}
            </div>
            <p className="text-muted-foreground text-sm mb-4">{course.description}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{course.creatorName}</span>
              <span className="flex items-center gap-1"><Users className="h-4 w-4" />{course.enrolledCount}人</span>
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{formatDuration(course.totalDuration)}</span>
              {course.rating > 0 && (
                <span className="flex items-center gap-1"><Star className="h-4 w-4 text-amber-500" />{course.rating.toFixed(1)}</span>
              )}
            </div>
            {isEnrolled && enrollment && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">学习进度</span>
                  <span className="text-sm font-medium">{Math.round(enrollment.progress)}%</span>
                </div>
                <Progress value={enrollment.progress} className="h-2" />
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* 章节列表 */}
      <Card>
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-medium">课程章节 ({course.chapters?.length || 0})</h3>
        </div>
        <div className="p-4">
          {!course.chapters?.length ? (
            <p className="text-muted-foreground text-sm text-center py-8">暂无章节内容</p>
          ) : (
            <div className="space-y-1">
              {course.chapters.map((chapter, index) => {
                const chapterLearnPath = isLive
                  ? `/cloud-course/live/${courseId}`
                  : `/cloud-course/learn/${courseId}`;

                return (
                  <Link
                    key={chapter.id}
                    href={isEnrolled ? chapterLearnPath : '#'}
                    onClick={e => { if (!isEnrolled) e.preventDefault(); }}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      isEnrolled ? 'hover:bg-muted/50 cursor-pointer' : 'opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <span className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary shrink-0">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium">{chapter.title}</h4>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                        {chapter.videoUrl && <span className="flex items-center gap-0.5"><Play className="h-3 w-3" />视频</span>}
                        {chapter.documentUrl && <span className="flex items-center gap-0.5"><FileText className="h-3 w-3" />课件</span>}
                        <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{formatDuration(chapter.duration)}</span>
                      </div>
                    </div>
                    {isEnrolled && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
