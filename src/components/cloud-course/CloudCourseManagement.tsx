'use client';

/**
 * 云教学管理共享组件
 *
 * 支持两种管理模式：
 * - department: 部门级管理（教务处/德育处），完整 CRUD + 推送
 * - class: 班主任级管理，推送 + 查看本班学习情况
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
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { ImageUploader } from '@/components/ui/image-uploader';
import { FileUploadField } from '@/components/cloud-course/FileUploadField';
import {
  BookOpen, Plus, Send, Users, GraduationCap, Star,
  Play, Radio, Clock, Trash2, Eye, ExternalLink,
  Search, TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import type { CourseDomain, CloudCourse } from '@/types/cloud-course';

// ============================================
// 类型
// ============================================

type ManagementMode = 'department' | 'class';

type DomainConfig = {
  domain: CourseDomain;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
};

type CloudCourseManagementProps = {
  mode: ManagementMode;
  title: string;
  subtitle: string;
  domains: DomainConfig[];
  defaultDomain?: CourseDomain;
  creatableDomains?: DomainConfig[];
  classId?: string;
  className?: string;
};

// ============================================
// 域配置常量
// ============================================

export const DOMAIN_CONFIGS: Record<CourseDomain, DomainConfig> = {
  research: {
    domain: 'research', label: '教师研修', description: '教师专业发展与研修课程',
    icon: <GraduationCap className="h-5 w-5" />, color: 'bg-primary/10 text-primary',
  },
  parent: {
    domain: 'parent', label: '家长课程', description: '家长教育与家校共育课程',
    icon: <Users className="h-5 w-5" />, color: 'bg-emerald-50 text-emerald-700',
  },
  student: {
    domain: 'student', label: '学生课程', description: '学生拓展与素养提升课程',
    icon: <BookOpen className="h-5 w-5" />, color: 'bg-amber-50 text-amber-700',
  },
};

// ============================================
// 格式化工具
// ============================================

const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h${m}m` : m > 0 ? `${m}分钟` : '--';
};

// ============================================
// 课程卡片子组件
// ============================================

function CourseCard({
  course,
  domainConfig,
  onPublish,
  onDelete,
}: {
  course: CloudCourse;
  domainConfig: DomainConfig;
  onPublish: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const isLive = course.format === 'live';
  const learnPath = isLive ? `/cloud-course/live/${course.id}` : `/cloud-course/learn/${course.id}`;

  return (
    <Card className="overflow-hidden group hover:shadow-md transition-all duration-200 border-border/60">
      {/* 封面 */}
      <div className="h-36 relative overflow-hidden">
        {course.coverImage ? (
          <img src={course.coverImage} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className={`w-full h-full ${domainConfig.color} flex items-center justify-center`}>
            {domainConfig.icon}
          </div>
        )}
        <div className="absolute top-2.5 left-2.5 flex gap-1.5">
          {isLive ? (
            <Badge className="bg-red-500 text-white hover:bg-red-600 text-xs">
              <Radio className="h-3 w-3 mr-0.5" />直播
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-black/60 text-white text-xs">
              <Play className="h-3 w-3 mr-0.5" />录播
            </Badge>
          )}
          <Badge variant={course.status === 'published' ? 'default' : 'secondary'} className="text-xs">
            {course.status === 'published' ? '已发布' : '草稿'}
          </Badge>
        </div>
        {course.totalDuration > 0 && (
          <div className="absolute bottom-2.5 right-2.5">
            <Badge variant="secondary" className="bg-black/60 text-white text-xs">
              <Clock className="h-3 w-3 mr-0.5" />{formatDuration(course.totalDuration)}
            </Badge>
          </div>
        )}
      </div>
      {/* 内容 */}
      <CardContent className="p-4">
        <h3 className="font-medium text-sm line-clamp-2 mb-1.5 group-hover:text-primary transition-colors">
          {course.title}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3 min-h-[2rem]">{course.description}</p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
          <span>{course.creatorName}</span>
          <span className="flex items-center gap-0.5"><Users className="h-3 w-3" />{course.enrolledCount}</span>
          {course.rating > 0 && <span className="flex items-center gap-0.5"><Star className="h-3 w-3 text-amber-500" />{course.rating.toFixed(1)}</span>}
          {course.category && <span className="truncate">{course.category}</span>}
        </div>
        {/* 操作 */}
        <div className="flex items-center gap-2 pt-3 border-t border-border/60">
          {course.status === 'draft' && (
            <Button size="sm" variant="outline" onClick={() => onPublish(course.id)} className="flex-1">
              发布
            </Button>
          )}
          <Link href={learnPath} className="flex-1">
            <Button size="sm" variant="outline" className="w-full">
              <Eye className="h-3 w-3 mr-1" />预览
            </Button>
          </Link>
          <Button size="sm" variant="ghost" onClick={() => onDelete(course.id)} className="text-destructive hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// 域课程列表子组件
// ============================================

function DomainCourseSection({
  domain,
  domainConfig,
}: {
  domain: CourseDomain;
  domainConfig: DomainConfig;
}) {
  const { courses } = useCloudCourses(domain);
  const { publishCourse, deleteCourse } = useCloudCourseActions();
  const [keyword, setKeyword] = useState('');

  const filtered = useMemo(() => {
    if (!keyword) return courses;
    const kw = keyword.toLowerCase();
    return courses.filter(c =>
      c.title.toLowerCase().includes(kw) ||
      c.description.toLowerCase().includes(kw) ||
      c.category?.toLowerCase().includes(kw)
    );
  }, [courses, keyword]);

  return (
    <div className="mb-8">
      {/* 域标题栏 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg ${domainConfig.color} flex items-center justify-center`}>
            {domainConfig.icon}
          </div>
          <div>
            <h3 className="font-medium">{domainConfig.label}</h3>
            <p className="text-xs text-muted-foreground">{domainConfig.description} · {courses.length} 门课程</p>
          </div>
        </div>
        <div className="relative w-56">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder={`搜索${domainConfig.label}...`}
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      {/* 课程卡片网格 */}
      {filtered.length === 0 ? (
        <Card className="p-10 text-center border-dashed">
          <div className={`w-12 h-12 rounded-xl ${domainConfig.color} flex items-center justify-center mx-auto mb-3`}>
            {domainConfig.icon}
          </div>
          <p className="text-sm text-muted-foreground">{keyword ? '没有匹配的课程' : `暂无${domainConfig.label}课程`}</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(course => (
            <CourseCard
              key={course.id}
              course={course}
              domainConfig={domainConfig}
              onPublish={publishCourse}
              onDelete={deleteCourse}
            />
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

  // 获取所有域的课程用于推送选择器
  const { courses: researchCourses } = useCloudCourses('research');
  const { courses: parentCourses } = useCloudCourses('parent');
  const { courses: studentCourses } = useCloudCourses('student');

  const allCourses = useMemo(() => [
    ...researchCourses, ...parentCourses, ...studentCourses,
  ], [researchCourses, parentCourses, studentCourses]);

  const pushableCourses = useMemo(() => {
    const domainSet = new Set(domains.map(d => d.domain));
    return allCourses.filter(c => c.status === 'published' && domainSet.has(c.domain));
  }, [allCourses, domains]);

  // 班主任模式
  const { enrollments, pushCourse } = useCloudCourseEnrollments(
    mode === 'class' ? user?.id || null : null,
  );

  const classEnrollments = useMemo(() => {
    if (mode !== 'class') return [];
    const domainSet = new Set(domains.map(d => d.domain));
    return enrollments.filter(e => e.course?.domain && domainSet.has(e.course.domain));
  }, [mode, enrollments, domains]);

  // ===== 新建课程 =====
  const effectiveCreatableDomains = creatableDomains || domains;
  const [showCreate, setShowCreate] = useState(false);
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    domain: (defaultDomain || effectiveCreatableDomains[0]?.domain || 'research') as CourseDomain,
    format: 'recorded' as 'live' | 'recorded',
    category: '',
    targetAudience: '',
    coverImage: '',
  });
  const [chapters, setChapters] = useState<Array<{
    title: string; videoUrl: string; documentUrl: string; duration: number;
  }>>([]);

  const addChapter = () => {
    setChapters(prev => [...prev, { title: '', videoUrl: '', documentUrl: '', duration: 0 }]);
  };

  const updateChapter = (index: number, field: string, value: string | number) => {
    setChapters(prev => prev.map((ch, i) => i === index ? { ...ch, [field]: value } : ch));
  };

  const removeChapter = (index: number) => {
    setChapters(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreate = useCallback(async () => {
    if (!newCourse.title) return;
    const result = await createCourse({
      ...newCourse,
      creatorId: user?.id || 'admin',
      creatorName: user?.name || '管理员',
      chapters: chapters.filter(ch => ch.title).map((ch, i) => ({
        title: ch.title,
        sortOrder: i + 1,
        videoUrl: ch.videoUrl || null,
        documentUrl: ch.documentUrl || null,
        duration: ch.duration || 0,
      })),
    });
    if (result) {
      setShowCreate(false);
      setNewCourse({
        title: '', description: '',
        domain: (defaultDomain || effectiveCreatableDomains[0]?.domain || 'research') as CourseDomain,
        format: 'recorded', category: '', targetAudience: '', coverImage: '',
      });
      setChapters([]);
    }
  }, [newCourse, chapters, createCourse, user, defaultDomain, effectiveCreatableDomains]);

  // ===== 推送 =====
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

  // 选中的推送课程详情
  const selectedPushCourse = useMemo(() => {
    if (!pushData.courseId) return null;
    return allCourses.find(c => c.id === pushData.courseId) || null;
  }, [pushData.courseId, allCourses]);

  // 班主任进度统计
  const progressStats = useMemo(() => {
    if (mode !== 'class') return null;
    const total = classEnrollments.length;
    const completed = classEnrollments.filter(e => e.status === 'completed').length;
    const learning = classEnrollments.filter(e => e.status === 'learning').length;
    const pending = classEnrollments.filter(e => e.status === 'pushed' || e.status === 'scheduled').length;
    return { total, completed, learning, pending };
  }, [mode, classEnrollments]);

  return (
    <div className="min-h-screen bg-background">
      {/* 头部 */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b border-border px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1">{title}</h1>
              <p className="text-muted-foreground">{subtitle}</p>
              {mode === 'class' && className && (
                <p className="text-xs text-muted-foreground mt-1">当前班级：{className}</p>
              )}
            </div>
            {mode === 'department' && (
              <Dialog open={showCreate} onOpenChange={setShowCreate}>
                <DialogTrigger asChild>
                  <Button><Plus className="h-4 w-4 mr-1.5" />新建课程</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                  <DialogHeader><DialogTitle>新建课程</DialogTitle></DialogHeader>
                  <div className="space-y-5 mt-4">
                    {/* 基本信息 */}
                    <div className="space-y-3">
                      <Input placeholder="课程标题" value={newCourse.title} onChange={e => setNewCourse(p => ({ ...p, title: e.target.value }))} />
                      <Textarea placeholder="课程描述" value={newCourse.description} onChange={e => setNewCourse(p => ({ ...p, description: e.target.value }))} rows={3} />
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">课程域</label>
                          <select className="w-full border rounded-md p-2 text-sm" value={newCourse.domain} onChange={e => setNewCourse(p => ({ ...p, domain: e.target.value as CourseDomain }))}>
                            {effectiveCreatableDomains.map(dc => <option key={dc.domain} value={dc.domain}>{dc.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">课程形态</label>
                          <select className="w-full border rounded-md p-2 text-sm" value={newCourse.format} onChange={e => setNewCourse(p => ({ ...p, format: e.target.value as 'live' | 'recorded' }))}>
                            <option value="recorded">录播(慕课)</option>
                            <option value="live">直播</option>
                          </select>
                        </div>
                      </div>
                      <ImageUploader
                        value={newCourse.coverImage || undefined}
                        onChange={(url) => setNewCourse(p => ({ ...p, coverImage: url || '' }))}
                        folder="cloud-course/covers"
                        className="w-full"
                      />
                      <Input placeholder="分类（如：语文教研、安全教育）" value={newCourse.category} onChange={e => setNewCourse(p => ({ ...p, category: e.target.value }))} />
                      <Input placeholder="目标受众（如：全校教师、一年级家长）" value={newCourse.targetAudience} onChange={e => setNewCourse(p => ({ ...p, targetAudience: e.target.value }))} />
                    </div>

                    {/* 章节管理（录播） */}
                    {newCourse.format === 'recorded' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">课程章节</label>
                          <Button size="sm" variant="outline" onClick={addChapter}>
                            <Plus className="h-3 w-3 mr-1" />添加章节
                          </Button>
                        </div>
                        {chapters.length === 0 ? (
                          <p className="text-xs text-muted-foreground py-3 text-center border border-dashed rounded-lg">
                            点击"添加章节"创建课程内容，每个章节可关联视频链接
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {chapters.map((ch, i) => (
                              <div key={i} className="border rounded-lg p-3 space-y-2 relative">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium text-muted-foreground">第 {i + 1} 章</span>
                                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-muted-foreground" onClick={() => removeChapter(i)}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                                <Input placeholder="章节标题" value={ch.title} onChange={e => updateChapter(i, 'title', e.target.value)} className="h-8 text-sm" />
                                <div className="flex gap-2">
                                  <div className="flex-1">
                                    <FileUploadField
                                      value={ch.videoUrl}
                                      onChange={(url) => updateChapter(i, 'videoUrl', url)}
                                      category="video"
                                      folder="cloud-course/videos"
                                      placeholder="视频链接（MP4/HLS）"
                                      iconType="video"
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <FileUploadField
                                      value={ch.documentUrl}
                                      onChange={(url) => updateChapter(i, 'documentUrl', url)}
                                      category="document"
                                      folder="cloud-course/courseware"
                                      placeholder="课件链接（可选）"
                                      iconType="document"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <Button onClick={handleCreate} className="w-full" disabled={!newCourse.title}>
                      创建课程
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-border/40">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-xl font-bold">{stats?.totalCourses || 0}</div>
                <div className="text-xs text-muted-foreground">总课程</div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/40">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Users className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <div className="text-xl font-bold">{stats?.totalEnrollments || 0}</div>
                <div className="text-xs text-muted-foreground">总选课</div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/40">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <div className="text-xl font-bold">{stats?.totalCompletions || 0}</div>
                <div className="text-xs text-muted-foreground">已完成</div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/40">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                <Star className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <div className="text-xl font-bold">{stats?.averageRating?.toFixed(1) || '0.0'}</div>
                <div className="text-xs text-muted-foreground">平均评分</div>
              </div>
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
              {domains.map(dc => (
                <DomainCourseSection key={dc.domain} domain={dc.domain} domainConfig={dc} />
              ))}
            </TabsContent>
          )}

          {/* ========== 推送管理 ========== */}
          <TabsContent value="push">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 推送表单 */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">
                  推送课程{mode === 'class' ? '给本班家长' : '给目标群体'}
                </h2>
                <div className="space-y-4">
                  {/* 课程选择 */}
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">选择课程</label>
                    {pushableCourses.length > 0 ? (
                      <select
                        className="w-full border rounded-lg p-2.5 text-sm"
                        value={pushData.courseId}
                        onChange={e => setPushData(p => ({ ...p, courseId: e.target.value }))}
                      >
                        <option value="">-- 请选择课程 --</option>
                        {pushableCourses.map(c => (
                          <option key={c.id} value={c.id}>
                            [{DOMAIN_CONFIGS[c.domain]?.label}] {c.title}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="text-sm text-muted-foreground py-6 text-center border border-dashed rounded-lg">
                        暂无已发布课程可推送，请先创建并发布课程
                      </div>
                    )}
                  </div>

                  {/* 选中课程预览 */}
                  {selectedPushCourse && (
                    <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg">
                      <div className={`w-10 h-10 rounded-lg ${DOMAIN_CONFIGS[selectedPushCourse.domain]?.color || 'bg-muted'} flex items-center justify-center shrink-0`}>
                        {DOMAIN_CONFIGS[selectedPushCourse.domain]?.icon || <BookOpen className="h-5 w-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium truncate">{selectedPushCourse.title}</h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <Badge variant="outline" className="text-xs h-5">
                            {selectedPushCourse.format === 'live' ? '直播' : '录播'}
                          </Badge>
                          <span><Users className="h-3 w-3 inline mr-0.5" />{selectedPushCourse.enrolledCount}人已选</span>
                        </div>
                      </div>
                      <Link href={selectedPushCourse.format === 'live' ? `/cloud-course/live/${selectedPushCourse.id}` : `/cloud-course/learn/${selectedPushCourse.id}`} target="_blank">
                        <Button size="sm" variant="ghost"><ExternalLink className="h-3.5 w-3.5" /></Button>
                      </Link>
                    </div>
                  )}

                  {/* 推送目标 */}
                  {mode === 'department' && (
                    <>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block">推送目标类型</label>
                        <select
                          className="w-full border rounded-lg p-2.5 text-sm"
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
                    <div className="text-sm bg-muted/40 rounded-lg p-3 flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>推送给 <span className="font-medium">{className}</span> 全体学生家长</span>
                    </div>
                  )}

                  <Textarea
                    placeholder="推送说明（可选，如：请在本周内完成学习）"
                    value={pushData.message}
                    onChange={e => setPushData(p => ({ ...p, message: e.target.value }))}
                    rows={3}
                  />
                  <Button className="w-full" onClick={handlePush} disabled={!pushData.courseId}>
                    <Send className="h-4 w-4 mr-1.5" />
                    {mode === 'class' ? '推送给我班' : '推送'}
                  </Button>
                </div>
              </Card>

              {/* 推送记录/统计 */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">推送概览</h2>
                <div className="space-y-4">
                  {domains.map(dc => {
                    const domainCourses = allCourses.filter(c => c.domain === dc.domain && c.status === 'published');
                    return (
                      <div key={dc.domain} className="flex items-center gap-3 p-3 rounded-lg border border-border/40">
                        <div className={`w-9 h-9 rounded-lg ${dc.color} flex items-center justify-center shrink-0`}>
                          {dc.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium">{dc.label}</h4>
                          <p className="text-xs text-muted-foreground">{domainCourses.length} 门已发布</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">{domainCourses.reduce((s, c) => s + c.enrolledCount, 0)}</div>
                          <div className="text-xs text-muted-foreground">总选课</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* ========== 学习进度（班主任模式） ========== */}
          {mode === 'class' && (
            <TabsContent value="progress">
              {/* 进度统计 */}
              {progressStats && (
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <Card className="border-border/40">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold">{progressStats.total}</div>
                      <div className="text-xs text-muted-foreground">总推送</div>
                    </CardContent>
                  </Card>
                  <Card className="border-emerald-200/40">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-emerald-600">{progressStats.completed}</div>
                      <div className="text-xs text-muted-foreground">已完成</div>
                    </CardContent>
                  </Card>
                  <Card className="border-primary/20">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-primary">{progressStats.learning}</div>
                      <div className="text-xs text-muted-foreground">学习中</div>
                    </CardContent>
                  </Card>
                  <Card className="border-amber-200/40">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-amber-600">{progressStats.pending}</div>
                      <div className="text-xs text-muted-foreground">待安排</div>
                    </CardContent>
                  </Card>
                </div>
              )}

              <Card>
                <div className="px-6 py-4 border-b border-border">
                  <h2 className="font-medium">本班课程学习进度</h2>
                </div>
                {classEnrollments.length === 0 ? (
                  <div className="p-12 text-center">
                    <TrendingUp className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">暂无学习记录</p>
                    <p className="text-xs text-muted-foreground mt-1">推送课程后，学习进度会在这里展示</p>
                  </div>
                ) : (
                  <ScrollArea className="max-h-[600px]">
                    <div className="divide-y divide-border/60">
                      {classEnrollments.map(enrollment => {
                        const isLive = enrollment.course?.format === 'live';
                        const learnPath = isLive
                          ? `/cloud-course/live/${enrollment.courseId}`
                          : `/cloud-course/learn/${enrollment.courseId}`;

                        return (
                          <div key={enrollment.id} className="px-6 py-4 flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-lg ${
                              enrollment.course?.domain === 'parent'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-700'
                            } flex items-center justify-center shrink-0`}>
                              {isLive ? <Radio className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-medium truncate">{enrollment.course?.title || '未知课程'}</h4>
                                <Badge variant="outline" className="text-xs shrink-0">
                                  {DOMAIN_CONFIGS[enrollment.course?.domain || 'student']?.label || '课程'}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 mt-1.5">
                                <Progress value={enrollment.progress} className="flex-1 h-1.5" />
                                <span className="text-xs text-muted-foreground w-10 text-right">{Math.round(enrollment.progress)}%</span>
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                {enrollment.studentName && <span>学生：{enrollment.studentName}</span>}
                                {enrollment.scheduledAt && <span>安排于 {new Date(enrollment.scheduledAt).toLocaleDateString()}</span>}
                              </div>
                            </div>
                            <Badge variant={
                              enrollment.status === 'completed' ? 'default' :
                              enrollment.status === 'learning' ? 'secondary' :
                              enrollment.status === 'scheduled' ? 'outline' :
                              'destructive'
                            } className="shrink-0">
                              {enrollment.status === 'pushed' ? '待安排' :
                               enrollment.status === 'scheduled' ? '已安排' :
                               enrollment.status === 'learning' ? '学习中' :
                               enrollment.status === 'completed' ? '已完成' : enrollment.status}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
