'use client';

/**
 * 云教学管理共享组件
 *
 * 支持两种管理模式：
 * - department: 部门级管理（教务处/德育处），完整 CRUD + 推送
 * - class: 班主任级管理，仅推送 + 查看本班学习情况
 */

import { useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  useCloudCourseStats,
  useCloudCourseActions,
  useCloudCourses,
  useCloudCourseEnrollments,
} from '@/hooks/useCloudCourse';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  BookOpen, Plus, Send, Users, GraduationCap, Star,
} from 'lucide-react';
import type { CourseDomain } from '@/types/cloud-course';

// ============================================
// 类型
// ============================================

type ManagementMode = 'department' | 'class';

type DomainConfig = {
  domain: CourseDomain;
  label: string;
  description: string;
};

type CloudCourseManagementProps = {
  /** 管理模式 */
  mode: ManagementMode;
  /** 页面标题 */
  title: string;
  /** 页面副标题 */
  subtitle: string;
  /** 可管理的课程域 */
  domains: DomainConfig[];
  /** 新建课程时默认域 */
  defaultDomain?: CourseDomain;
  /** 新建课程时可选的域列表（不传则取 domains） */
  creatableDomains?: DomainConfig[];
  /** 班主任模式下的班级ID（mode=class时必传） */
  classId?: string;
  /** 班主任模式下的班级名称 */
  className?: string;
};

// ============================================
// 域配置常量
// ============================================

export const DOMAIN_CONFIGS: Record<CourseDomain, DomainConfig> = {
  research: { domain: 'research', label: '教师研修', description: '教师专业发展与研修课程' },
  parent: { domain: 'parent', label: '家长课程', description: '家长教育与家校共育课程' },
  student: { domain: 'student', label: '学生课程', description: '学生拓展与素养提升课程' },
};

// ============================================
// 课程列表子组件
// ============================================

function CourseList({ domain, label }: { domain: CourseDomain; label: string }) {
  const { courses } = useCloudCourses(domain);
  const { publishCourse, deleteCourse } = useCloudCourseActions();

  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">
        {label} ({courses.length})
      </h3>
      {courses.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">暂无课程</p>
      ) : (
        <div className="space-y-2">
          {courses.map(course => (
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
                    {course.category && <span>{course.category}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {course.status === 'draft' && (
                    <Button size="sm" variant="outline" onClick={() => publishCourse(course.id)}>
                      发布
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => deleteCourse(course.id)}>
                    删除
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// 主组件
// ============================================

export function CloudCourseManagement({
  mode,
  title,
  subtitle,
  domains,
  defaultDomain,
  creatableDomains,
  classId,
  className,
}: CloudCourseManagementProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(mode === 'class' ? 'push' : 'courses');
  const { stats } = useCloudCourseStats();
  const { createCourse, publishCourse, deleteCourse } = useCloudCourseActions();

  // 获取所有域的课程（用于推送选择器）
  const { courses: researchCourses } = useCloudCourses('research');
  const { courses: parentCourses } = useCloudCourses('parent');
  const { courses: studentCourses } = useCloudCourses('student');

  const allCourses = useMemo(() => [
    ...researchCourses, ...parentCourses, ...studentCourses,
  ], [researchCourses, parentCourses, studentCourses]);

  // 可推送的课程列表（只显示已发布的且属于本管理域的）
  const pushableCourses = useMemo(() => {
    const domainSet = new Set(domains.map(d => d.domain));
    return allCourses.filter(c => c.status === 'published' && domainSet.has(c.domain));
  }, [allCourses, domains]);

  // 班主任模式下获取选课记录
  const { enrollments, pushCourse } = useCloudCourseEnrollments(
    mode === 'class' ? user?.id || null : null,
  );

  // 班主任模式 - 筛选本班家长和学生课程相关选课
  const classEnrollments = useMemo(() => {
    if (mode !== 'class') return [];
    const domainSet = new Set(domains.map(d => d.domain));
    return enrollments.filter(e => e.course?.domain && domainSet.has(e.course.domain));
  }, [mode, enrollments, domains]);

  // 新建课程表单
  const effectiveCreatableDomains = creatableDomains || domains;
  const [showCreate, setShowCreate] = useState(false);
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    domain: (defaultDomain || effectiveCreatableDomains[0]?.domain || 'research') as CourseDomain,
    format: 'recorded' as 'live' | 'recorded',
    category: '',
    targetAudience: '',
  });

  const handleCreate = useCallback(async () => {
    if (!newCourse.title) return;
    const result = await createCourse({
      ...newCourse,
      creatorId: user?.id || 'admin',
      creatorName: user?.name || '管理员',
    });
    if (result) {
      setShowCreate(false);
      setNewCourse({
        title: '', description: '',
        domain: (defaultDomain || effectiveCreatableDomains[0]?.domain || 'research') as CourseDomain,
        format: 'recorded', category: '', targetAudience: '',
      });
    }
  }, [newCourse, createCourse, user, defaultDomain, effectiveCreatableDomains]);

  // 推送表单
  const [pushData, setPushData] = useState({
    courseId: '',
    targetType: 'class' as 'class' | 'grade' | 'individual',
    targetIds: '',
    message: '',
  });

  const handlePush = useCallback(async () => {
    if (!pushData.courseId) return;
    await pushCourse({
      courseId: pushData.courseId,
      targetType: mode === 'class' ? 'class' : pushData.targetType,
      targetIds: mode === 'class' && classId ? [classId] : pushData.targetIds.split(',').map(s => s.trim()).filter(Boolean),
      message: pushData.message,
      pushedBy: user?.id || '',
      pusherName: user?.name || '',
    });
    setPushData({ courseId: '', targetType: 'class', targetIds: '', message: '' });
  }, [pushData, pushCourse, mode, classId, user]);

  return (
    <div className="min-h-screen bg-background">
      {/* 头部 */}
      <div className="bg-gradient-to-r from-primary/90 to-primary/70 text-primary-foreground px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-2">{title}</h1>
          <p className="text-primary-foreground/80">{subtitle}</p>
          {mode === 'class' && className && (
            <p className="text-primary-foreground/60 text-sm mt-1">当前班级：{className}</p>
          )}
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

        {/* 标签页 */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            {mode === 'department' && <TabsTrigger value="courses">课程管理</TabsTrigger>}
            <TabsTrigger value="push">推送管理</TabsTrigger>
            {mode === 'class' && <TabsTrigger value="progress">学习进度</TabsTrigger>}
          </TabsList>

          {/* ========== 课程管理（部门模式） ========== */}
          {mode === 'department' && (
            <TabsContent value="courses">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">课程管理</h2>
                <Dialog open={showCreate} onOpenChange={setShowCreate}>
                  <DialogTrigger asChild>
                    <Button><Plus className="h-4 w-4 mr-1" />新建课程</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>新建课程</DialogTitle></DialogHeader>
                    <div className="space-y-4 mt-4">
                      <Input
                        placeholder="课程标题"
                        value={newCourse.title}
                        onChange={e => setNewCourse(p => ({ ...p, title: e.target.value }))}
                      />
                      <Textarea
                        placeholder="课程描述"
                        value={newCourse.description}
                        onChange={e => setNewCourse(p => ({ ...p, description: e.target.value }))}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-muted-foreground mb-1 block">课程域</label>
                          <select
                            className="w-full border rounded-md p-2 text-sm"
                            value={newCourse.domain}
                            onChange={e => setNewCourse(p => ({ ...p, domain: e.target.value as CourseDomain }))}
                          >
                            {effectiveCreatableDomains.map(dc => (
                              <option key={dc.domain} value={dc.domain}>{dc.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-sm text-muted-foreground mb-1 block">课程形态</label>
                          <select
                            className="w-full border rounded-md p-2 text-sm"
                            value={newCourse.format}
                            onChange={e => setNewCourse(p => ({ ...p, format: e.target.value as 'live' | 'recorded' }))}
                          >
                            <option value="recorded">录播(慕课)</option>
                            <option value="live">直播</option>
                          </select>
                        </div>
                      </div>
                      <Input
                        placeholder="分类（如：语文教研、安全教育）"
                        value={newCourse.category}
                        onChange={e => setNewCourse(p => ({ ...p, category: e.target.value }))}
                      />
                      <Input
                        placeholder="目标受众（如：全校教师、一年级家长）"
                        value={newCourse.targetAudience}
                        onChange={e => setNewCourse(p => ({ ...p, targetAudience: e.target.value }))}
                      />
                      <Button onClick={handleCreate} className="w-full">创建</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* 各域课程列表 */}
              {domains.map(dc => (
                <CourseList key={dc.domain} domain={dc.domain} label={dc.label} />
              ))}
            </TabsContent>
          )}

          {/* ========== 推送管理 ========== */}
          <TabsContent value="push">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">
                推送课程{mode === 'class' ? '给本班学生家长' : '给目标群体'}
              </h2>
              <div className="space-y-4">
                {/* 课程选择 */}
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">选择课程</label>
                  {pushableCourses.length > 0 ? (
                    <select
                      className="w-full border rounded-md p-2 text-sm"
                      value={pushData.courseId}
                      onChange={e => setPushData(p => ({ ...p, courseId: e.target.value }))}
                    >
                      <option value="">-- 请选择课程 --</option>
                      {pushableCourses.map(c => (
                        <option key={c.id} value={c.id}>
                          [{DOMAIN_CONFIGS[c.domain]?.label || c.domain}] {c.title}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      placeholder="课程ID（暂无已发布课程）"
                      value={pushData.courseId}
                      onChange={e => setPushData(p => ({ ...p, courseId: e.target.value }))}
                    />
                  )}
                </div>

                {/* 推送目标（部门模式才可选） */}
                {mode === 'department' && (
                  <>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">推送目标类型</label>
                      <select
                        className="w-full border rounded-md p-2 text-sm"
                        value={pushData.targetType}
                        onChange={e => setPushData(p => ({ ...p, targetType: e.target.value as 'class' | 'grade' | 'individual' }))}
                      >
                        <option value="class">按班级</option>
                        <option value="grade">按年级</option>
                        <option value="individual">按个人</option>
                      </select>
                    </div>
                    <Input
                      placeholder="目标ID（多个用逗号分隔）"
                      value={pushData.targetIds}
                      onChange={e => setPushData(p => ({ ...p, targetIds: e.target.value }))}
                    />
                  </>
                )}

                {mode === 'class' && className && (
                  <div className="text-sm text-muted-foreground bg-muted/50 rounded-md p-3">
                    将推送给 <span className="font-medium text-foreground">{className}</span> 全体学生家长
                  </div>
                )}

                <Textarea
                  placeholder="推送说明（可选）"
                  value={pushData.message}
                  onChange={e => setPushData(p => ({ ...p, message: e.target.value }))}
                />
                <Button className="w-full" onClick={handlePush} disabled={!pushData.courseId}>
                  <Send className="h-4 w-4 mr-1" />
                  {mode === 'class' ? '推送给我班' : '推送'}
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* ========== 学习进度（班主任模式） ========== */}
          {mode === 'class' && (
            <TabsContent value="progress">
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">本班学生学习进度</h2>
                {classEnrollments.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">暂无学生学习记录</p>
                ) : (
                  <div className="space-y-3">
                    {classEnrollments.map(enrollment => (
                      <div key={enrollment.id} className="flex items-center justify-between border-b pb-3">
                        <div>
                          <div className="font-medium text-sm">{enrollment.course?.title || '未知课程'}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {enrollment.targetStudentId ? `学生ID: ${enrollment.targetStudentId}` : ''}
                            {enrollment.scheduledAt && ` | 计划时间: ${new Date(enrollment.scheduledAt).toLocaleDateString()}`}
                          </div>
                        </div>
                        <Badge variant={
                          enrollment.status === 'completed' ? 'default' :
                          enrollment.status === 'learning' ? 'secondary' :
                          enrollment.status === 'scheduled' ? 'outline' :
                          'destructive'
                        }>
                          {enrollment.status === 'pushed' ? '待安排' :
                           enrollment.status === 'scheduled' ? '已安排' :
                           enrollment.status === 'learning' ? '学习中' :
                           enrollment.status === 'completed' ? '已完成' : enrollment.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
