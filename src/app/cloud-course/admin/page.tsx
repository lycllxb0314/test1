'use client';

/**
 * 云教学管理页面
 * 课程CRUD + 推送管理 + 数据统计
 */

import { useState } from 'react';
import { useCloudCourseStats, useCloudCourseActions, useCloudCourses } from '@/hooks/useCloudCourse';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  BookOpen, Plus, Send, BarChart3, Users, GraduationCap, Star, Clock,
} from 'lucide-react';

export default function CloudCourseAdminPage() {
  const [activeTab, setActiveTab] = useState('courses');
  const { stats, loading: statsLoading } = useCloudCourseStats();
  const { createCourse, publishCourse, deleteCourse } = useCloudCourseActions();

  const [researchKeyword, setResearchKeyword] = useState('');
  const [parentKeyword, setParentKeyword] = useState('');
  const [studentKeyword, setStudentKeyword] = useState('');

  const { courses: researchCourses } = useCloudCourses('research', researchKeyword || undefined);
  const { courses: parentCourses } = useCloudCourses('parent', parentKeyword || undefined);
  const { courses: studentCourses } = useCloudCourses('student', studentKeyword || undefined);

  // 新建课程表单
  const [showCreate, setShowCreate] = useState(false);
  const [newCourse, setNewCourse] = useState({
    title: '', description: '', domain: 'research' as 'research' | 'parent' | 'student', format: 'recorded' as 'live' | 'recorded',
    category: '', targetAudience: '',
  });

  const handleCreate = async () => {
    if (!newCourse.title) return;
    const result = await createCourse({
      ...newCourse,
      creatorId: 'admin',
      creatorName: '管理员',
    });
    if (result) {
      setShowCreate(false);
      setNewCourse({ title: '', description: '', domain: 'research', format: 'recorded', category: '', targetAudience: '' });
    }
  };

  // 推送表单
  const [showPush, setShowPush] = useState(false);
  const [pushData, setPushData] = useState({
    courseId: '', targetType: 'class' as 'class' | 'grade' | 'individual', targetIds: '', message: '',
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-primary/90 to-primary/70 text-primary-foreground px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-2">云教学管理</h1>
          <p className="text-primary-foreground/80">课程管理 · 推送管理 · 数据统计</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* 统计概览 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <BookOpen className="h-6 w-6 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">{stats?.totalCourses || 0}</div>
              <div className="text-xs text-muted-foreground">总课程数</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">{stats?.totalEnrollments || 0}</div>
              <div className="text-xs text-muted-foreground">总选课数</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <GraduationCap className="h-6 w-6 text-amber-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">{stats?.totalCompletions || 0}</div>
              <div className="text-xs text-muted-foreground">完成数</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Star className="h-6 w-6 text-orange-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{stats?.averageRating?.toFixed(1) || '0.0'}</div>
              <div className="text-xs text-muted-foreground">平均评分</div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="courses">课程管理</TabsTrigger>
            <TabsTrigger value="push">推送管理</TabsTrigger>
          </TabsList>

          {/* 课程管理 */}
          <TabsContent value="courses">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">全部课程</h2>
              <Dialog open={showCreate} onOpenChange={setShowCreate}>
                <DialogTrigger asChild>
                  <Button><Plus className="h-4 w-4 mr-1" />新建课程</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>新建课程</DialogTitle></DialogHeader>
                  <div className="space-y-4 mt-4">
                    <Input placeholder="课程标题" value={newCourse.title} onChange={e => setNewCourse(p => ({ ...p, title: e.target.value }))} />
                    <Textarea placeholder="课程描述" value={newCourse.description} onChange={e => setNewCourse(p => ({ ...p, description: e.target.value }))} />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-muted-foreground mb-1 block">课程域</label>
                        <select className="w-full border rounded-md p-2 text-sm" value={newCourse.domain} onChange={e => setNewCourse(p => ({ ...p, domain: e.target.value as 'research' | 'parent' | 'student' }))}>
                          <option value="research">教师研修</option>
                          <option value="parent">家长课程</option>
                          <option value="student">学生课程</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground mb-1 block">课程形态</label>
                        <select className="w-full border rounded-md p-2 text-sm" value={newCourse.format} onChange={e => setNewCourse(p => ({ ...p, format: e.target.value as 'live' | 'recorded' }))}>
                          <option value="recorded">录播(慕课)</option>
                          <option value="live">直播</option>
                        </select>
                      </div>
                    </div>
                    <Input placeholder="分类" value={newCourse.category} onChange={e => setNewCourse(p => ({ ...p, category: e.target.value }))} />
                    <Button onClick={handleCreate} className="w-full">创建</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* 三域课程列表 */}
            {[
              { label: '教师研修', courses: researchCourses, domain: 'research' as const },
              { label: '家长课程', courses: parentCourses, domain: 'parent' as const },
              { label: '学生课程', courses: studentCourses, domain: 'student' as const },
            ].map(section => (
              <div key={section.domain} className="mb-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">{section.label} ({section.courses.length})</h3>
                {section.courses.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">暂无课程</p>
                ) : (
                  <div className="space-y-2">
                    {section.courses.map(course => (
                      <Card key={course.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-sm">{course.title}</h4>
                              <Badge variant={course.status === 'published' ? 'default' : 'secondary'}>
                                {course.status === 'published' ? '已发布' : course.status === 'draft' ? '草稿' : course.status}
                              </Badge>
                              <Badge variant={course.format === 'live' ? 'default' : 'outline'}>
                                {course.format === 'live' ? '直播' : '录播'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span>{course.creatorName}</span>
                              <span><Users className="h-3 w-3 inline mr-1" />{course.enrolledCount}人</span>
                              <span><Star className="h-3 w-3 inline mr-1" />{course.rating}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {course.status === 'draft' && (
                              <Button size="sm" variant="outline" onClick={() => publishCourse(course.id)}>发布</Button>
                            )}
                            <Button size="sm" variant="ghost" onClick={() => deleteCourse(course.id)}>删除</Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </TabsContent>

          {/* 推送管理 */}
          <TabsContent value="push">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">推送课程给学生家长</h2>
              <div className="space-y-4">
                <Input placeholder="课程ID" value={pushData.courseId} onChange={e => setPushData(p => ({ ...p, courseId: e.target.value }))} />
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">推送目标类型</label>
                  <select className="w-full border rounded-md p-2 text-sm" value={pushData.targetType} onChange={e => setPushData(p => ({ ...p, targetType: e.target.value as 'class' | 'grade' | 'individual' }))}>
                    <option value="class">按班级</option>
                    <option value="grade">按年级</option>
                    <option value="individual">按个人</option>
                  </select>
                </div>
                <Input placeholder="目标ID（多个用逗号分隔）" value={pushData.targetIds} onChange={e => setPushData(p => ({ ...p, targetIds: e.target.value }))} />
                <Textarea placeholder="推送说明" value={pushData.message} onChange={e => setPushData(p => ({ ...p, message: e.target.value }))} />
                <Button className="w-full">
                  <Send className="h-4 w-4 mr-1" />推送
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
