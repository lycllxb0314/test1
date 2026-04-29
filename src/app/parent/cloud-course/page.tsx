'use client';

/**
 * 家长云教学页面
 * 家长课程 + 子女课程（待安排/学习中/进度查看）
 */

import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCloudCourses, useCloudCourseEnrollments, useCloudCourseDetail } from '@/hooks/useCloudCourse';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  BookOpen, Search, Play, Clock, Users, Star, Video, FileText,
  GraduationCap, Baby, CalendarCheck,
} from 'lucide-react';
import Link from 'next/link';
import type { CloudCourse, CloudCourseEnrollment } from '@/types/cloud-course';

export default function ParentCloudCoursePage() {
  const { user } = useAuth();
  const [keyword, setKeyword] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const { courses, loading } = useCloudCourses('parent', keyword || undefined);
  const { enrollments, loading: enrollLoading, enroll, enrollForStudent } = useCloudCourseEnrollments(user?.id || null);
  const { course: detailCourse, loading: detailLoading } = useCloudCourseDetail(selectedCourseId);

  // 分类
  const parentEnrollments = useMemo(() =>
    enrollments.filter(e => e.role === 'learner'),
    [enrollments]
  );

  const studentEnrollments = useMemo(() =>
    enrollments.filter(e => e.role === 'manager'),
    [enrollments]
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

  const handleScheduleForStudent = async (enrollmentId: string, courseId: string) => {
    // 直接安排学习
    const now = new Date().toISOString();
    const res = await fetch('/api/cloud-course/learning', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'schedule', enrollmentId, scheduledAt: now }),
    });
    const data = await res.json();
    if (data.success) {
      // 刷新列表
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 头部 */}
      <div className="bg-gradient-to-r from-primary/90 to-primary/70 text-primary-foreground px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-2">云教学</h1>
          <p className="text-primary-foreground/80">家长课堂 · 子女学习管理</p>
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

          {/* 家长课程库 */}
          <TabsContent value="parent-courses">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="搜索家长课程..." value={keyword} onChange={(e) => setKeyword(e.target.value)} className="pl-10" />
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => <Card key={i} className="animate-pulse"><div className="h-40 bg-muted rounded-t-lg" /><CardContent className="p-4"><div className="h-4 bg-muted rounded mb-2" /></CardContent></Card>)}
              </div>
            ) : courses.length === 0 ? (
              <Card className="p-12 text-center">
                <Baby className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">暂无家长课程</h3>
                <p className="text-muted-foreground">目前没有可用的家长课程</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.map(course => (
                  <Card key={course.id} className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
                    {course.coverImage ? (
                      <div className="h-40 bg-muted overflow-hidden"><img src={course.coverImage} alt={course.title} className="w-full h-full object-cover" /></div>
                    ) : (
                      <div className="h-40 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center"><Baby className="h-12 w-12 text-primary/40" /></div>
                    )}
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-sm line-clamp-2 flex-1">{course.title}</h3>
                        <Badge variant={course.format === 'live' ? 'default' : 'secondary'} className="ml-2 shrink-0">{course.format === 'live' ? '直播' : '录播'}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{course.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground"><Users className="h-3 w-3" />{course.enrolledCount}人</span>
                        <Button size="sm" onClick={() => handleEnroll(course.id)}>参加学习</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* 待安排的学生课程 */}
          <TabsContent value="student-pending">
            {pendingEnrollments.length === 0 ? (
              <Card className="p-12 text-center">
                <CalendarCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">暂无待安排课程</h3>
                <p className="text-muted-foreground">老师推送的课程会出现在这里</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {pendingEnrollments.map(enrollment => (
                  <Card key={enrollment.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium">{enrollment.course?.title || '课程'}</h3>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <Badge variant="outline">{enrollment.course?.format === 'live' ? '直播' : '录播'}</Badge>
                          {enrollment.studentName && <span>学生: {enrollment.studentName}</span>}
                        </div>
                      </div>
                      <Button onClick={() => handleScheduleForStudent(enrollment.id, enrollment.courseId)}>
                        安排学习
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* 子女学习中 */}
          <TabsContent value="student-learning">
            {activeEnrollments.length === 0 ? (
              <Card className="p-12 text-center">
                <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">暂无进行中的课程</h3>
                <p className="text-muted-foreground">安排子女学习后，这里会显示学习进度</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {activeEnrollments.map(enrollment => (
                  <Card key={enrollment.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium">{enrollment.course?.title || '课程'}</h3>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <Badge>{enrollment.status === 'learning' ? '学习中' : '已安排'}</Badge>
                          {enrollment.studentName && <span>学生: {enrollment.studentName}</span>}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{Math.round(enrollment.progress)}%</div>
                        <Progress value={enrollment.progress} className="w-24 h-2 mt-1" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* 我的课程 */}
          <TabsContent value="my-learning">
            {parentEnrollments.length === 0 ? (
              <Card className="p-12 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">尚未参加课程</h3>
                <p className="text-muted-foreground">浏览家长课程库，开始学习</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {parentEnrollments.map(enrollment => (
                  <Card key={enrollment.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium">{enrollment.course?.title || '课程'}</h3>
                        <Badge variant={enrollment.status === 'completed' ? 'default' : 'secondary'} className="mt-1">
                          {enrollment.status === 'completed' ? '已完成' : '学习中'}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{Math.round(enrollment.progress)}%</div>
                        <Progress value={enrollment.progress} className="w-24 h-2 mt-1" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
