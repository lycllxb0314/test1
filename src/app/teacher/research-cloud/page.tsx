'use client';

/**
 * 教师研修页面
 * 课程库浏览 + 我的研修 + 课程详情/学习
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
  BookOpen, Search, Play, Clock, Users, Star, Video, FileText, ChevronLeft,
} from 'lucide-react';
import Link from 'next/link';

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
    return h > 0 ? `${h}小时${m}分钟` : `${m}分钟`;
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
      <div className="bg-gradient-to-r from-primary/90 to-primary/70 text-primary-foreground px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-2">教师研修</h1>
          <p className="text-primary-foreground/80">专业发展 · 教学提升 · 学科前沿</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)}>
          <TabsList className="mb-6">
            <TabsTrigger value="catalog">研修课程库</TabsTrigger>
            <TabsTrigger value="my">我的研修</TabsTrigger>
            {selectedCourseId && <TabsTrigger value="detail">课程详情</TabsTrigger>}
          </TabsList>

          {/* 课程库 */}
          <TabsContent value="catalog">
            {/* 搜索栏 */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索研修课程..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* 课程卡片列表 */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-40 bg-muted rounded-t-lg" />
                    <CardContent className="p-4">
                      <div className="h-4 bg-muted rounded mb-2" />
                      <div className="h-3 bg-muted rounded w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : courses.length === 0 ? (
              <Card className="p-12 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">暂无研修课程</h3>
                <p className="text-muted-foreground">目前没有可用的研修课程</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.map(course => (
                  <Card key={course.id} className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleViewCourse(course.id)}>
                    {course.coverImage ? (
                      <div className="h-40 bg-muted overflow-hidden">
                        <img src={course.coverImage} alt={course.title} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="h-40 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                        <BookOpen className="h-12 w-12 text-primary/40" />
                      </div>
                    )}
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-sm line-clamp-2 flex-1">{course.title}</h3>
                        <Badge variant={course.format === 'live' ? 'default' : 'secondary'} className="ml-2 shrink-0">
                          {course.format === 'live' ? '直播' : '录播'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{course.description}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{course.enrolledCount}人学习</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDuration(course.totalDuration)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* 我的研修 */}
          <TabsContent value="my">
            {enrollLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="animate-pulse p-4">
                    <div className="h-4 bg-muted rounded mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </Card>
                ))}
              </div>
            ) : myEnrollments.length === 0 ? (
              <Card className="p-12 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">尚未参加研修</h3>
                <p className="text-muted-foreground mb-4">浏览课程库，选择感兴趣的课程开始学习</p>
                <Button onClick={() => setActiveTab('catalog')}>浏览课程</Button>
              </Card>
            ) : (
              <div className="space-y-3">
                {myEnrollments.map(enrollment => (
                  <Card key={enrollment.id} className="p-4 cursor-pointer hover:shadow-sm transition-shadow" onClick={() => handleViewCourse(enrollment.courseId)}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium">{enrollment.course?.title || '课程'}</h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <Badge variant={enrollment.status === 'completed' ? 'default' : 'secondary'}>
                            {enrollment.status === 'pushed' ? '待安排' : enrollment.status === 'scheduled' ? '已安排' : enrollment.status === 'learning' ? '学习中' : '已完成'}
                          </Badge>
                          {enrollment.course?.format === 'live' && (
                            <span className="flex items-center gap-1"><Video className="h-3 w-3" />直播</span>
                          )}
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

          {/* 课程详情 */}
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

  return (
    <div>
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ChevronLeft className="h-4 w-4 mr-1" />返回
      </Button>

      {/* 课程头部 */}
      <Card className="overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-2">{course.title}</h2>
              <p className="text-muted-foreground mb-4">{course.description}</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Users className="h-4 w-4" />{course.enrolledCount}人学习</span>
                <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{formatDuration(course.totalDuration)}</span>
                <span className="flex items-center gap-1"><Star className="h-4 w-4" />{course.rating}</span>
                <Badge>{course.format === 'live' ? '直播' : '录播'}</Badge>
              </div>
            </div>
            {!isEnrolled && (
              <Button onClick={onEnroll} className="ml-4">参加研修</Button>
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
      </Card>

      {/* 章节列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">课程章节 ({course.chapters?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {!course.chapters?.length ? (
            <p className="text-muted-foreground text-sm">暂无章节内容</p>
          ) : (
            <div className="space-y-2">
              {course.chapters.map((chapter, index) => (
                <div key={chapter.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">{index + 1}</span>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium">{chapter.title}</h4>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      {chapter.videoUrl && <span className="flex items-center gap-1"><Play className="h-3 w-3" />视频</span>}
                      {chapter.documentUrl && <span className="flex items-center gap-1"><FileText className="h-3 w-3" />文档</span>}
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDuration(chapter.duration)}</span>
                      {chapter.isFree && <Badge variant="outline" className="text-xs">免费</Badge>}
                    </div>
                  </div>
                  {isEnrolled && (
                    <Button variant="ghost" size="sm">学习</Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}小时${m}分钟` : `${m}分钟`;
}

import type { CloudCourse, CloudCourseEnrollment } from '@/types/cloud-course';
