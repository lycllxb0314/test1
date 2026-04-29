'use client';

/**
 * 家长云教学页面
 * 
 * 家长课程（自主选课学习）+ 子女课程（待安排/学习中/进度查看）
 * 录播 → /cloud-course/learn/[id]
 * 直播 → /cloud-course/live/[id]
 */

import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCloudCourses, useCloudCourseEnrollments } from '@/hooks/useCloudCourse';
import type { CloudCourse } from '@/types/cloud-course';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  BookOpen, Search, Play, Clock, Users, Star,
  Baby, CalendarCheck, GraduationCap, ArrowRight, Radio,
} from 'lucide-react';
import Link from 'next/link';

export default function ParentCloudCoursePage() {
  const { user } = useAuth();
  const [keyword, setKeyword] = useState('');

  const { courses, loading } = useCloudCourses('parent', keyword || undefined);
  const { enrollments, loading: enrollLoading, enroll } = useCloudCourseEnrollments(user?.id || null);

  // 构建课程信息缓存，用于补充 enrollment 中缺失的 course 字段
  const courseMap = useMemo(() => {
    const map = new Map<string, CloudCourse>();
    courses.forEach(c => map.set(c.id, c));
    enrollments.forEach(e => { if (e.course) map.set(e.courseId, e.course); });
    return map;
  }, [courses, enrollments]);

  // 为 enrollment 补充 course 信息
  const enrichedEnrollments = useMemo(() =>
    enrollments.map(e => ({
      ...e,
      course: e.course || courseMap.get(e.courseId),
    })),
    [enrollments, courseMap]
  );

  const parentEnrollments = useMemo(() =>
    enrichedEnrollments.filter(e => e.role === 'learner'),
    [enrichedEnrollments]
  );

  const studentEnrollments = useMemo(() =>
    enrichedEnrollments.filter(e => e.role === 'manager'),
    [enrichedEnrollments]
  );

  const pendingEnrollments = useMemo(() =>
    studentEnrollments.filter(e => e.status === 'pushed'),
    [studentEnrollments]
  );

  const activeEnrollments = useMemo(() =>
    studentEnrollments.filter(e => e.status === 'scheduled' || e.status === 'learning'),
    [studentEnrollments]
  );

  const handleEnroll = async (courseId: string) => {
    await enroll(courseId);
  };

  const handleScheduleForStudent = async (enrollmentId: string) => {
    const now = new Date().toISOString();
    const res = await fetch('/api/cloud-course/learning', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'schedule', enrollmentId, scheduledAt: now }),
    });
    const data = await res.json();
    if (data.success) {
      window.location.reload();
    }
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h${m}m` : m > 0 ? `${m}分钟` : '暂无';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 头部 */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b border-border px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-1">云教学</h1>
          <p className="text-muted-foreground">家长课堂 · 子女学习管理</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        <Tabs defaultValue="parent-courses">
          <TabsList className="mb-6">
            <TabsTrigger value="parent-courses">家长课程</TabsTrigger>
            <TabsTrigger value="student-pending">
              待安排 {pendingEnrollments.length > 0 && <Badge className="ml-1" variant="destructive">{pendingEnrollments.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="student-learning">子女学习</TabsTrigger>
            <TabsTrigger value="my-learning">我的课程</TabsTrigger>
          </TabsList>

          {/* ========== 家长课程库 ========== */}
          <TabsContent value="parent-courses">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="搜索家长课程..." value={keyword} onChange={(e) => setKeyword(e.target.value)} className="pl-10" />
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3].map(i => <Card key={i} className="animate-pulse"><div className="h-44 bg-muted rounded-t-lg" /><CardContent className="p-4"><div className="h-4 bg-muted rounded mb-2" /></CardContent></Card>)}
              </div>
            ) : courses.length === 0 ? (
              <Card className="p-16 text-center">
                <Baby className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">暂无家长课程</h3>
                <p className="text-muted-foreground">目前没有可用的家长课程</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {courses.map(course => {
                  const isLive = course.format === 'live';
                  const alreadyEnrolled = parentEnrollments.some(e => e.courseId === course.id);

                  return (
                    <Card key={course.id} className="overflow-hidden group hover:shadow-lg transition-all duration-200 border-border/60">
                      <div className="h-44 relative overflow-hidden">
                        {course.coverImage ? (
                          <img src={course.coverImage} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/8 to-muted flex items-center justify-center">
                            <Baby className="h-10 w-10 text-primary/20" />
                          </div>
                        )}
                        <div className="absolute top-3 left-3">
                          {isLive ? (
                            <Badge className="bg-red-500 text-white"><Radio className="h-3 w-3 mr-1" />直播</Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-black/60 text-white"><Play className="h-3 w-3 mr-1" />录播</Badge>
                          )}
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-medium text-sm line-clamp-2 mb-2">{course.title}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{course.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" />{course.enrolledCount}人
                          </span>
                          {alreadyEnrolled ? (
                            <Link href={isLive ? `/cloud-course/live/${course.id}` : `/cloud-course/learn/${course.id}`}>
                              <Button size="sm">继续学习</Button>
                            </Link>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => handleEnroll(course.id)}>参加学习</Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ========== 待安排的学生课程 ========== */}
          <TabsContent value="student-pending">
            {pendingEnrollments.length === 0 ? (
              <Card className="p-16 text-center">
                <CalendarCheck className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">暂无待安排课程</h3>
                <p className="text-muted-foreground">老师推送的课程会出现在这里</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {pendingEnrollments.map(enrollment => {
                  const course = enrollment.course;
                  const isLive = course?.format === 'live';

                  return (
                    <Card key={enrollment.id} className="overflow-hidden border-border/60 hover:border-border transition-colors">
                      <div className="flex">
                        <div className="w-28 h-20 shrink-0 relative overflow-hidden bg-muted">
                          {course?.coverImage ? (
                            <img src={course.coverImage} alt={course.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-primary/5">
                              {isLive ? <Radio className="h-5 w-5 text-primary/30" /> : <Play className="h-5 w-5 text-primary/30" />}
                            </div>
                          )}
                          <div className="absolute top-1 left-1">
                            <Badge className="text-[9px] h-4 px-1" variant={isLive ? 'destructive' : 'secondary'}>
                              {isLive ? '直播' : '录播'}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0 p-3 flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm truncate">{course?.title || '课程'}</h3>
                            {course?.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{course.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1.5">
                              {enrollment.studentName && <span className="text-xs text-muted-foreground">学生: {enrollment.studentName}</span>}
                            </div>
                          </div>
                          <Button size="sm" onClick={() => handleScheduleForStudent(enrollment.id)}>
                            安排学习
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ========== 子女学习中 ========== */}
          <TabsContent value="student-learning">
            {activeEnrollments.length === 0 ? (
              <Card className="p-16 text-center">
                <GraduationCap className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">暂无进行中的课程</h3>
                <p className="text-muted-foreground">安排子女学习后，这里会显示学习进度</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {activeEnrollments.map(enrollment => {
                  const course = enrollment.course;
                  const isLive = course?.format === 'live';
                  const learnPath = isLive
                    ? `/cloud-course/live/${enrollment.courseId}`
                    : `/cloud-course/learn/${enrollment.courseId}`;

                  return (
                    <Card key={enrollment.id} className="overflow-hidden border-border/60 hover:border-border transition-colors">
                      <div className="flex">
                        <div className="w-28 h-20 shrink-0 relative overflow-hidden bg-muted">
                          {course?.coverImage ? (
                            <img src={course.coverImage} alt={course.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-[#5C7A72]/5">
                              <GraduationCap className="h-5 w-5 text-[#5C7A72]/30" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 p-3 flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm truncate">{course?.title || '课程'}</h3>
                            {course?.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{course.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1.5">
                              <Badge variant="secondary" className="text-[10px] h-4">{enrollment.status === 'learning' ? '学习中' : '已安排'}</Badge>
                              {enrollment.studentName && <span className="text-xs text-muted-foreground">{enrollment.studentName}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <div className="text-sm font-medium">{Math.round(enrollment.progress)}%</div>
                              <Progress value={enrollment.progress} className="w-16 h-1.5 mt-1" />
                            </div>
                            <Link href={learnPath}>
                              <Button size="sm">{isLive ? '进入课堂' : '查看'}</Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ========== 我的课程 ========== */}
          <TabsContent value="my-learning">
            {parentEnrollments.length === 0 ? (
              <Card className="p-16 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">尚未参加课程</h3>
                <p className="text-muted-foreground">浏览家长课程库，开始学习</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {parentEnrollments.map(enrollment => {
                  const course = enrollment.course;
                  const isLive = course?.format === 'live';
                  const learnPath = isLive
                    ? `/cloud-course/live/${enrollment.courseId}`
                    : `/cloud-course/learn/${enrollment.courseId}`;

                  return (
                    <Card key={enrollment.id} className="overflow-hidden border-border/60 hover:border-border transition-colors">
                      <div className="flex">
                        {/* 封面缩略图 */}
                        <div className="w-32 h-24 shrink-0 relative overflow-hidden bg-muted">
                          {course?.coverImage ? (
                            <img src={course.coverImage} alt={course.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-primary/5">
                              {isLive ? <Radio className="h-6 w-6 text-primary/30" /> : <Play className="h-6 w-6 text-primary/30" />}
                            </div>
                          )}
                          <div className="absolute top-1 left-1">
                            <Badge className="text-[9px] h-4 px-1" variant={isLive ? 'destructive' : 'secondary'}>
                              {isLive ? '直播' : '录播'}
                            </Badge>
                          </div>
                        </div>
                        {/* 课程信息 */}
                        <div className="flex-1 min-w-0 p-3 flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm truncate">{course?.title || '课程'}</h3>
                            {course?.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{course.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1.5">
                              <Badge variant={enrollment.status === 'completed' ? 'default' : 'secondary'} className="text-[10px] h-4">
                                {enrollment.status === 'completed' ? '已完成' : '学习中'}
                              </Badge>
                              {course?.category && (
                                <span className="text-[10px] text-muted-foreground">{course.category}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <div className="text-sm font-medium">{Math.round(enrollment.progress)}%</div>
                              <Progress value={enrollment.progress} className="w-16 h-1.5 mt-1" />
                            </div>
                            <Link href={learnPath}>
                              <Button size="sm">{enrollment.status === 'completed' ? '回顾' : isLive ? '进入课堂' : '继续学习'}</Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
