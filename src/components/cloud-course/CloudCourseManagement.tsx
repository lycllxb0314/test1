'use client';

import { useState, useMemo, useCallback, useEffect, memo, useRef } from 'react';
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
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { ImageUploader } from '@/components/ui/image-uploader';
import { FileUploadField } from '@/components/cloud-course/FileUploadField';
import {
  BookOpen, Plus, Send, Users, GraduationCap, Star,
  Play, Radio, Clock, Trash2, Eye, ExternalLink,
  Search, TrendingUp, Edit3,
} from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/services/api-client';
import type { CourseDomain, CloudCourse, CloudCourseChapter } from '@/types/cloud-course';

/* ─── 常量配置 ─── */

type DomainConfig = { domain: CourseDomain; label: string; color: string; icon: React.ReactNode };

export const DOMAIN_CONFIGS: Record<string, DomainConfig> = {
  research: { domain: 'research', label: '教师研修', color: 'bg-blue-100 text-blue-700', icon: <GraduationCap className="h-5 w-5" /> },
  parent:   { domain: 'parent',   label: '家长课程', color: 'bg-emerald-100 text-emerald-700', icon: <Users className="h-5 w-5" /> },
  student:  { domain: 'student',  label: '学生课程', color: 'bg-amber-100 text-amber-700', icon: <BookOpen className="h-5 w-5" /> },
};

type ModeConfig = {
  department: { domains: DomainConfig[] };
  class: { domains: DomainConfig[] };
};

const MODE_CONFIGS: ModeConfig = {
  department: {
    domains: [DOMAIN_CONFIGS.research, DOMAIN_CONFIGS.parent, DOMAIN_CONFIGS.student],
  },
  class: {
    domains: [DOMAIN_CONFIGS.parent, DOMAIN_CONFIGS.student],
  },
};

/* ─── CourseCard（memo） ─── */

type CourseCardProps = {
  course: CloudCourse;
  domainConfig: DomainConfig;
  onPublish: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (course: CloudCourse) => void;
};

const CourseCard = memo(function CourseCard({ course, domainConfig, onPublish, onDelete, onEdit }: CourseCardProps) {
  const learnPath = course.format === 'live'
    ? `/cloud-course/live/${course.id}`
    : `/cloud-course/learn/${course.id}`;

  return (
    <Card className="group overflow-hidden border-border/60 hover:border-border transition-colors">
      {/* 封面 */}
      <div className="relative aspect-video bg-muted">
        {course.coverImage ? (
          <img src={course.coverImage} alt={course.title} className="w-full h-full object-cover" />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${domainConfig.color}`}>
            {domainConfig.icon}
          </div>
        )}
        <div className="absolute top-2 left-2 flex gap-1">
          <Badge variant="secondary" className="text-[10px] h-5 bg-background/90 backdrop-blur-sm">
            {course.format === 'live' ? <><Radio className="h-2.5 w-2.5 mr-0.5" />直播</> : <><Play className="h-2.5 w-2.5 mr-0.5" />录播</>}
          </Badge>
          <Badge variant="outline" className={`text-[10px] h-5 ${course.status === 'published' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
            {course.status === 'published' ? '已发布' : '草稿'}
          </Badge>
        </div>
        {course.totalDuration > 0 && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
            <Clock className="h-2.5 w-2.5 inline mr-0.5" />{Math.round(course.totalDuration / 60)}分钟
          </div>
        )}
      </div>

      {/* 信息 */}
      <div className="p-3 space-y-2">
        <h3 className="text-sm font-medium leading-tight line-clamp-2">{course.title}</h3>
        {course.description && <p className="text-xs text-muted-foreground line-clamp-2">{course.description}</p>}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {course.totalChapters > 0 && <span>{course.totalChapters}章节</span>}
          {course.enrolledCount > 0 && <span><Users className="h-2.5 w-2.5 inline" />{course.enrolledCount}人</span>}
          {course.rating > 0 && <span><Star className="h-2.5 w-2.5 inline text-amber-500" />{course.rating.toFixed(1)}</span>}
        </div>
        {/* 操作 */}
        <div className="flex items-center gap-2 pt-3 border-t border-border/60">
          {course.status === 'draft' && (
            <Button size="sm" variant="outline" onClick={() => onPublish(course.id)} className="flex-1">发布</Button>
          )}
          <Button size="sm" variant="outline" onClick={() => onEdit(course)} className="flex-1">
            <Edit3 className="h-3 w-3 mr-1" />编辑
          </Button>
          <Link href={learnPath} className="flex-1">
            <Button size="sm" variant="outline" className="w-full"><Eye className="h-3 w-3 mr-1" />预览</Button>
          </Link>
          <Button size="sm" variant="ghost" onClick={() => onDelete(course.id)} className="text-destructive hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
});

/* ─── DomainCourseSection（memo） ─── */

type DomainCourseSectionProps = {
  domain: CourseDomain;
  domainConfig: DomainConfig;
  includeDraft?: boolean;
  onMutation?: () => void;
  onEdit: (course: CloudCourse) => void;
};

const DomainCourseSection = memo(function DomainCourseSection({
  domain, domainConfig, includeDraft, onMutation, onEdit,
}: DomainCourseSectionProps) {
  const { courses, refresh } = useCloudCourses(domain, undefined, includeDraft || undefined);
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

  const handlePublish = useCallback(async (id: string) => {
    await publishCourse(id);
    refresh();
    onMutation?.();
  }, [publishCourse, refresh, onMutation]);

  const handleDelete = useCallback(async (id: string) => {
    await deleteCourse(id);
    refresh();
    onMutation?.();
  }, [deleteCourse, refresh, onMutation]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg ${domainConfig.color} flex items-center justify-center`}>
            {domainConfig.icon}
          </div>
          <div>
            <h2 className="text-base font-semibold">{domainConfig.label}</h2>
            <p className="text-xs text-muted-foreground">{filtered.length} 门课程</p>
          </div>
        </div>
        <div className="relative w-56">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="搜索课程..." value={keyword} onChange={e => setKeyword(e.target.value)} className="pl-8 h-8 text-sm" />
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">暂无课程</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(course => (
            <CourseCard key={course.id} course={course} domainConfig={domainConfig} onPublish={handlePublish} onDelete={handleDelete} onEdit={onEdit} />
          ))}
        </div>
      )}
    </div>
  );
});

/* ─── CoursesTab（课程管理 Tab 内容） ─── */

type CoursesTabProps = {
  domains: DomainConfig[];
  includeDraft: boolean;
  onMutation: () => void;
  onEdit: (course: CloudCourse) => void;
};

const CoursesTab = memo(function CoursesTab({ domains, includeDraft, onMutation, onEdit }: CoursesTabProps) {
  return (
    <div className="space-y-8">
      {domains.map(dc => (
        <DomainCourseSection key={dc.domain} domain={dc.domain} domainConfig={dc} includeDraft={includeDraft} onMutation={onMutation} onEdit={onEdit} />
      ))}
    </div>
  );
});

/* ─── PushTab（推送管理 Tab 内容） ─── */

type PushTabProps = {
  mode: 'department' | 'class';
  domains: DomainConfig[];
  classId?: string;
  className?: string;
  onPushed: () => void;
};

const PushTab = memo(function PushTab({ mode, domains, classId, className, onPushed }: PushTabProps) {
  const { user } = useAuth();
  const { pushCourse } = useCloudCourseActions();

  // 推送表单
  const [pushData, setPushData] = useState({
    courseId: '',
    targetType: 'grade' as 'class' | 'grade',
    selectedGrades: [] as number[],
    selectedClassIds: [] as string[],
    message: '',
  });

  // 年级班级数据（只加载一次，缓存）
  const [gradesData, setGradesData] = useState<Array<{
    grade: number; gradeName: string;
    classes: Array<{ id: string; name: string; studentCount: number; parentCount: number }>;
  }>>([]);
  const [gradesLoading, setGradesLoading] = useState(false);
  const gradesLoadedRef = useRef(false);

  useEffect(() => {
    if (gradesLoadedRef.current) return;
    const fetchTargets = async () => {
      setGradesLoading(true);
      try {
        const res = await apiClient.get<Array<{
          grade: number; gradeName: string;
          classes: Array<{ id: string; name: string; studentCount: number; parentCount: number }>;
        }>>('/cloud-course/push-targets');
        if (res.success && res.data) {
          setGradesData(res.data);
          gradesLoadedRef.current = true;
        }
      } catch (err) {
        console.error('[PushTab] fetch push targets error:', err);
      } finally {
        setGradesLoading(false);
      }
    };
    fetchTargets();
  }, []);

  // 可推送课程
  const pushableCourses = useMemo(() => {
    const domainSet = new Set(domains.map(d => d.domain));
    const allCourses: CloudCourse[] = [];
    // 不在组件顶层调 hooks，用 API 拉已发布课程
    return allCourses; // 占位，下面用 useEffect 拉取
  }, [domains]);

  const [publishedCourses, setPublishedCourses] = useState<CloudCourse[]>([]);
  const coursesLoadedRef = useRef(false);

  useEffect(() => {
    if (coursesLoadedRef.current) return;
    const fetchCourses = async () => {
      const results: CloudCourse[] = [];
      for (const d of domains) {
        try {
          const res = await apiClient.get<CloudCourse[]>(`/cloud-course/courses?domain=${d.domain}`);
          if (res.success && res.data) {
            results.push(...res.data.filter(c => c.status === 'published'));
          }
        } catch { /* skip */ }
      }
      setPublishedCourses(results);
      coursesLoadedRef.current = true;
    };
    fetchCourses();
  }, [domains]);

  // 选中课程
  const selectedPushCourse = useMemo(
    () => publishedCourses.find(c => c.id === pushData.courseId),
    [publishedCourses, pushData.courseId]
  );

  // 推送目标统计
  const pushTargetStats = useMemo(() => {
    if (pushData.targetType === 'grade') {
      const selected = gradesData.filter(g => pushData.selectedGrades.includes(g.grade));
      const classes = selected.flatMap(g => g.classes);
      return { gradeCount: selected.length, classCount: classes.length, studentCount: classes.reduce((s, c) => s + c.studentCount, 0), parentCount: classes.reduce((s, c) => s + c.parentCount, 0) };
    }
    const selectedClasses = gradesData.flatMap(g => g.classes).filter(c => pushData.selectedClassIds.includes(c.id));
    return { gradeCount: 0, classCount: selectedClasses.length, studentCount: selectedClasses.reduce((s, c) => s + c.studentCount, 0), parentCount: selectedClasses.reduce((s, c) => s + c.parentCount, 0) };
  }, [pushData.targetType, pushData.selectedGrades, pushData.selectedClassIds, gradesData]);

  const toggleGrade = useCallback((grade: number) => {
    setPushData(prev => {
      const isSelected = prev.selectedGrades.includes(grade);
      const newGrades = isSelected ? prev.selectedGrades.filter(g => g !== grade) : [...prev.selectedGrades, grade];
      const gradeClasses = gradesData.find(g => g.grade === grade)?.classes.map(c => c.id) || [];
      const newClassIds = isSelected
        ? prev.selectedClassIds.filter(id => !gradeClasses.includes(id))
        : [...new Set([...prev.selectedClassIds, ...gradeClasses])];
      return { ...prev, selectedGrades: newGrades, selectedClassIds: newClassIds };
    });
  }, [gradesData]);

  const toggleClass = useCallback((classId: string) => {
    setPushData(prev => ({
      ...prev,
      selectedClassIds: prev.selectedClassIds.includes(classId)
        ? prev.selectedClassIds.filter(id => id !== classId)
        : [...prev.selectedClassIds, classId],
    }));
  }, []);

  const handlePush = useCallback(async () => {
    if (!pushData.courseId) return;

    let targetType: 'class' | 'grade';
    let targetIds: string[];

    if (mode === 'class') {
      targetType = 'class';
      targetIds = classId ? [classId] : [];
    } else if (pushData.targetType === 'grade') {
      targetType = 'grade';
      targetIds = pushData.selectedGrades.map(String);
    } else {
      targetType = 'class';
      targetIds = pushData.selectedClassIds;
    }

    if (targetIds.length === 0) return;

    await pushCourse({
      courseId: pushData.courseId,
      targetType,
      targetIds,
      message: pushData.message,
      pushedBy: user?.id || '',
      pusherName: user?.name || '',
    });
    setPushData({ courseId: '', targetType: 'grade', selectedGrades: [], selectedClassIds: [], message: '' });
    onPushed();
  }, [pushData, pushCourse, mode, classId, user, onPushed]);

  return (
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
            {publishedCourses.length > 0 ? (
              <select className="w-full border rounded-lg p-2.5 text-sm" value={pushData.courseId} onChange={e => setPushData(p => ({ ...p, courseId: e.target.value }))}>
                <option value="">-- 请选择课程 --</option>
                {publishedCourses.map(c => (
                  <option key={c.id} value={c.id}>[{DOMAIN_CONFIGS[c.domain]?.label}] {c.title}</option>
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
                  <Badge variant="outline" className="text-xs h-5">{selectedPushCourse.format === 'live' ? '直播' : '录播'}</Badge>
                  <span><Users className="h-3 w-3 inline mr-0.5" />{selectedPushCourse.enrolledCount}人已选</span>
                </div>
              </div>
              <Link href={selectedPushCourse.format === 'live' ? `/cloud-course/live/${selectedPushCourse.id}` : `/cloud-course/learn/${selectedPushCourse.id}`} target="_blank">
                <Button size="sm" variant="ghost"><ExternalLink className="h-3.5 w-3.5" /></Button>
              </Link>
            </div>
          )}

          {/* 推送目标（部门模式） */}
          {mode === 'department' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">推送方式</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setPushData(p => ({ ...p, targetType: 'grade' }))} className={`flex-1 px-3 py-2 rounded-lg border text-sm transition-colors ${pushData.targetType === 'grade' ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-border text-muted-foreground hover:border-muted-foreground/40'}`}>按年级</button>
                  <button type="button" onClick={() => setPushData(p => ({ ...p, targetType: 'class' }))} className={`flex-1 px-3 py-2 rounded-lg border text-sm transition-colors ${pushData.targetType === 'class' ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-border text-muted-foreground hover:border-muted-foreground/40'}`}>按班级</button>
                </div>
              </div>

              {gradesLoading ? (
                <div className="py-6 text-center text-sm text-muted-foreground">加载年级班级数据...</div>
              ) : gradesData.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">暂无班级数据</div>
              ) : pushData.targetType === 'grade' ? (
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">选择年级（勾选后自动包含该年级所有班级）</label>
                  <div className="space-y-1.5">
                    {gradesData.map(g => {
                      const isSelected = pushData.selectedGrades.includes(g.grade);
                      const studentCount = g.classes.reduce((s, c) => s + c.studentCount, 0);
                      return (
                        <button key={g.grade} type="button" onClick={() => toggleGrade(g.grade)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors ${isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/40'}`}>
                          <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isSelected ? 'bg-primary border-primary' : 'border-muted-foreground/40'}`}>
                            {isSelected && <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                          </div>
                          <div className="flex-1"><span className="text-sm font-medium">{g.gradeName}</span><span className="text-xs text-muted-foreground ml-2">{g.classes.length}个班</span></div>
                          <span className="text-xs text-muted-foreground">{studentCount}名学生</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">选择班级</label>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {gradesData.map(g => (
                      <div key={g.grade}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <button type="button" onClick={() => toggleGrade(g.grade)} className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">{g.gradeName}</button>
                          <span className="text-xs text-muted-foreground/50">全选</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          {g.classes.map(cls => {
                            const isSelected = pushData.selectedClassIds.includes(cls.id);
                            return (
                              <button key={cls.id} type="button" onClick={() => toggleClass(cls.id)} className={`flex items-center gap-2 px-2.5 py-2 rounded-md border text-left text-sm transition-colors ${isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/40'}`}>
                                <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${isSelected ? 'bg-primary border-primary' : 'border-muted-foreground/40'}`}>
                                  {isSelected && <svg className="w-2.5 h-2.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                </div>
                                <span className="text-sm truncate flex-1">{cls.name}</span>
                                <span className="text-[10px] text-muted-foreground shrink-0">{cls.studentCount}人</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pushTargetStats.classCount > 0 && (
                <div className="bg-muted/40 rounded-lg p-3 flex items-center gap-4 text-xs text-muted-foreground">
                  <span>已选 <span className="font-medium text-foreground">{pushData.targetType === 'grade' ? `${pushTargetStats.gradeCount}个年级` : `${pushTargetStats.classCount}个班级`}</span></span>
                  <span>覆盖 <span className="font-medium text-foreground">{pushTargetStats.classCount}</span> 个班</span>
                  <span><span className="font-medium text-foreground">{pushTargetStats.studentCount}</span> 名学生</span>
                  <span><span className="font-medium text-foreground">{pushTargetStats.parentCount}</span> 位家长</span>
                </div>
              )}
            </div>
          )}

          {/* 班主任模式：显示目标 */}
          {mode === 'class' && className && (
            <div className="text-sm bg-muted/40 rounded-lg p-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>推送给 <span className="font-medium">{className}</span> 全体学生家长</span>
            </div>
          )}

          <Textarea placeholder="推送说明（可选，如：请在本周内完成学习）" value={pushData.message} onChange={e => setPushData(p => ({ ...p, message: e.target.value }))} rows={3} />
          <Button className="w-full" onClick={handlePush} disabled={!pushData.courseId || (mode === 'department' && pushData.selectedGrades.length === 0 && pushData.selectedClassIds.length === 0)}>
            <Send className="h-4 w-4 mr-1.5" />{mode === 'class' ? '推送给我班' : '推送'}
          </Button>
        </div>
      </Card>

      {/* 推送概览 */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">推送概览</h2>
        <div className="space-y-4">
          {domains.map(dc => {
            const domainCourses = publishedCourses.filter(c => c.domain === dc.domain);
            return (
              <div key={dc.domain} className="flex items-center gap-3 p-3 rounded-lg border border-border/40">
                <div className={`w-9 h-9 rounded-lg ${dc.color} flex items-center justify-center shrink-0`}>{dc.icon}</div>
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
  );
});

/* ─── ProgressTab（学习进度 Tab 内容） ─── */

type ProgressTabProps = {
  classId: string;
};

const ProgressTab = memo(function ProgressTab({ classId }: ProgressTabProps) {
  const { enrollments, loading } = useCloudCourseEnrollments(classId);

  const stats = useMemo(() => {
    const total = enrollments.length;
    const completed = enrollments.filter(e => e.status === 'completed').length;
    const learning = enrollments.filter(e => e.status === 'learning').length;
    const pending = enrollments.filter(e => e.status === 'pushed' || e.status === 'scheduled').length;
    return { total, completed, learning, pending };
  }, [enrollments]);

  return (
    <div>
      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card className="border-border/40"><CardContent className="p-4 text-center"><div className="text-2xl font-bold">{stats.total}</div><div className="text-xs text-muted-foreground">总推送</div></CardContent></Card>
        <Card className="border-emerald-200/40"><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-emerald-600">{stats.completed}</div><div className="text-xs text-muted-foreground">已完成</div></CardContent></Card>
        <Card className="border-primary/20"><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-primary">{stats.learning}</div><div className="text-xs text-muted-foreground">学习中</div></CardContent></Card>
        <Card className="border-amber-200/40"><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-amber-600">{stats.pending}</div><div className="text-xs text-muted-foreground">待安排</div></CardContent></Card>
      </div>

      <Card>
        <div className="px-6 py-4 border-b border-border"><h2 className="font-medium">本班课程学习进度</h2></div>
        {loading ? (
          <div className="p-12 text-center text-muted-foreground"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" /><p className="text-sm">加载中...</p></div>
        ) : enrollments.length === 0 ? (
          <div className="p-12 text-center">
            <TrendingUp className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">暂无学习记录</p>
            <p className="text-xs text-muted-foreground mt-1">推送课程后，学习进度会在这里展示</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[600px]">
            <div className="divide-y divide-border/60">
              {enrollments.map(enrollment => {
                const isLive = enrollment.course?.format === 'live';
                const learnPath = isLive ? `/cloud-course/live/${enrollment.courseId}` : `/cloud-course/learn/${enrollment.courseId}`;
                const progressPct = Math.round(enrollment.progress * 100);
                return (
                  <div key={enrollment.id} className="px-6 py-4 flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg ${enrollment.course?.domain === 'parent' ? 'bg-emerald-100 text-emerald-700' : enrollment.course?.domain === 'student' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'} flex items-center justify-center shrink-0`}>
                      {isLive ? <Radio className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium truncate">{enrollment.course?.title || '未知课程'}</h4>
                        <Badge variant="outline" className="text-[10px] h-4 shrink-0">{isLive ? '直播' : '录播'}</Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <Progress value={progressPct} className="flex-1 h-1.5" />
                        <span className="text-xs text-muted-foreground shrink-0">{progressPct}%</span>
                      </div>
                    </div>
                    <Link href={learnPath}>
                      <Button size="sm" variant="ghost"><ExternalLink className="h-3.5 w-3.5" /></Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </Card>
    </div>
  );
});

/* ─── CourseFormDialog（新建/编辑课程弹窗） ─── */

type CourseFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  form: { title: string; description: string; domain: CourseDomain; format: 'live' | 'recorded'; category: string; targetAudience: string; coverImage: string };
  setForm: React.Dispatch<React.SetStateAction<{
    title: string; description: string; domain: CourseDomain; format: 'live' | 'recorded'; category: string; targetAudience: string; coverImage: string;
  }>>;
  chapters: Array<{ title: string; videoUrl: string; documentUrl: string; duration: number }>;
  setChapters: React.Dispatch<React.SetStateAction<Array<{ title: string; videoUrl: string; documentUrl: string; duration: number }>>>;
  onSubmit: () => void;
  creatableDomains: DomainConfig[];
  submitLabel: string;
};

const CourseFormDialog = memo(function CourseFormDialog({
  open, onOpenChange, title, form, setForm, chapters, setChapters, onSubmit, creatableDomains, submitLabel,
}: CourseFormDialogProps) {
  const addChapter = () => setChapters(prev => [...prev, { title: '', videoUrl: '', documentUrl: '', duration: 0 }]);
  const updateChapter = (i: number, field: string, value: string | number) => setChapters(prev => prev.map((ch, idx) => idx === i ? { ...ch, [field]: value } : ch));
  const removeChapter = (i: number) => setChapters(prev => prev.filter((_, idx) => idx !== i));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="space-y-5 mt-4">
          <Input placeholder="课程标题" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
          <Textarea placeholder="课程描述" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">课程域</label>
              <select className="w-full border rounded-md p-2 text-sm" value={form.domain} onChange={e => setForm(p => ({ ...p, domain: e.target.value as CourseDomain }))}>
                {creatableDomains.map(dc => <option key={dc.domain} value={dc.domain}>{dc.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">课程形态</label>
              <select className="w-full border rounded-md p-2 text-sm" value={form.format} onChange={e => setForm(p => ({ ...p, format: e.target.value as 'live' | 'recorded' }))}>
                <option value="recorded">录播(慕课)</option>
                <option value="live">直播</option>
              </select>
            </div>
          </div>
          <ImageUploader value={form.coverImage || undefined} onChange={(url) => setForm(p => ({ ...p, coverImage: url || '' }))} folder="cloud-course/covers" className="w-full" />
          <Input placeholder="分类（如：语文教研、安全教育）" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} />
          <Input placeholder="目标受众（如：全校教师、一年级家长）" value={form.targetAudience} onChange={e => setForm(p => ({ ...p, targetAudience: e.target.value }))} />

          {form.format === 'recorded' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">课程章节</label>
                <Button size="sm" variant="outline" onClick={addChapter}><Plus className="h-3 w-3 mr-1" />添加章节</Button>
              </div>
              {chapters.length === 0 ? (
                <p className="text-xs text-muted-foreground py-3 text-center border border-dashed rounded-lg">
                  点击"添加章节"创建课程内容，视频支持B站/YouTube等平台链接或MP4直链
                </p>
              ) : (
                <div className="space-y-3">
                  {chapters.map((ch, i) => (
                    <div key={i} className="border rounded-lg p-3 space-y-2 relative">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">第 {i + 1} 章</span>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-muted-foreground" onClick={() => removeChapter(i)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                      <Input placeholder="章节标题" value={ch.title} onChange={e => updateChapter(i, 'title', e.target.value)} className="h-8 text-sm" />
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <FileUploadField value={ch.videoUrl} onChange={(url) => updateChapter(i, 'videoUrl', url)} category="video" folder="cloud-course/videos" placeholder="支持B站/YouTube/优酷链接 或 MP4直链" iconType="video" />
                        </div>
                        <div className="flex-1">
                          <FileUploadField value={ch.documentUrl} onChange={(url) => updateChapter(i, 'documentUrl', url)} category="document" folder="cloud-course/courseware" placeholder="课件链接（可选）" iconType="document" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <Button onClick={onSubmit} className="w-full" disabled={!form.title}>{submitLabel}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});

/* ─── 主组件 ─── */

type CloudCourseManagementProps = {
  mode: 'department' | 'class';
  classId?: string;
  className?: string;
  defaultDomain?: CourseDomain;
};

export function CloudCourseManagement({ mode, classId, className, defaultDomain }: CloudCourseManagementProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(mode === 'class' ? 'push' : 'courses');
  const { stats } = useCloudCourseStats();
  const { createCourse, updateCourse } = useCloudCourseActions();

  const effectiveCreatableDomains = useMemo(
    () => MODE_CONFIGS[mode].domains,
    [mode]
  );

  const domains = effectiveCreatableDomains;

  // ── 新建课程 ──
  const [showCreate, setShowCreate] = useState(false);
  const [newCourse, setNewCourse] = useState({
    title: '', description: '',
    domain: (defaultDomain || effectiveCreatableDomains[0]?.domain || 'research') as CourseDomain,
    format: 'recorded' as 'live' | 'recorded',
    category: '', targetAudience: '', coverImage: '',
  });
  const [chapters, setChapters] = useState<Array<{ title: string; videoUrl: string; documentUrl: string; duration: number }>>([]);

  // ── 编辑课程 ──
  const [showEdit, setShowEdit] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    title: '', description: '',
    domain: 'research' as CourseDomain,
    format: 'recorded' as 'live' | 'recorded',
    category: '', targetAudience: '', coverImage: '',
  });
  const [editChapters, setEditChapters] = useState<Array<{ title: string; videoUrl: string; documentUrl: string; duration: number }>>([]);

  // 课程列表刷新（用 ref 标记，避免 key 重挂载）
  const [refreshTick, setRefreshTick] = useState(0);
  const triggerRefresh = useCallback(() => setRefreshTick(c => c + 1), []);

  // 新建
  const handleCreate = useCallback(async () => {
    if (!newCourse.title) return;
    const result = await createCourse({
      title: newCourse.title,
      description: newCourse.description,
      domain: newCourse.domain,
      format: newCourse.format,
      category: newCourse.category,
      targetAudience: newCourse.targetAudience,
      coverImage: newCourse.coverImage,
      creatorId: user?.id || '',
      creatorName: user?.name || '',
      chapters: newCourse.format === 'recorded'
        ? chapters.filter(ch => ch.title).map((ch, i) => ({
            title: ch.title, sortOrder: i + 1, videoUrl: ch.videoUrl || null, documentUrl: ch.documentUrl || null, duration: ch.duration || 0,
          }))
        : undefined,
    });
    if (result) {
      setShowCreate(false);
      setNewCourse({
        title: '', description: '',
        domain: (defaultDomain || effectiveCreatableDomains[0]?.domain || 'research') as CourseDomain,
        format: 'recorded', category: '', targetAudience: '', coverImage: '',
      });
      setChapters([]);
      triggerRefresh();
    }
  }, [newCourse, chapters, createCourse, user, defaultDomain, effectiveCreatableDomains, triggerRefresh]);

  // 编辑
  const handleEditCourse = useCallback(async (course: CloudCourse) => {
    setEditingCourseId(course.id);
    setEditForm({
      title: course.title || '', description: course.description || '',
      domain: course.domain || 'research', format: course.format || 'recorded',
      category: course.category || '', targetAudience: course.targetAudience || '',
      coverImage: course.coverImage || '',
    });
    if (course.chapters && course.chapters.length > 0) {
      setEditChapters(course.chapters.map(ch => ({
        title: ch.title || '', videoUrl: ch.videoUrl || '', documentUrl: ch.documentUrl || '', duration: ch.duration || 0,
      })));
    } else {
      try {
        const res = await apiClient.get<CloudCourse>(`/cloud-course/courses/${course.id}`);
        if (res.success && res.data?.chapters) {
          setEditChapters(res.data.chapters.map((ch: CloudCourseChapter) => ({
            title: ch.title || '', videoUrl: ch.videoUrl || '', documentUrl: ch.documentUrl || '', duration: ch.duration || 0,
          })));
        } else { setEditChapters([]); }
      } catch { setEditChapters([]); }
    }
    setShowEdit(true);
  }, []);

  const handleEditSave = useCallback(async () => {
    if (!editingCourseId || !editForm.title) return;
    const result = await updateCourse(editingCourseId, {
      title: editForm.title, description: editForm.description,
      domain: editForm.domain, format: editForm.format,
      category: editForm.category, targetAudience: editForm.targetAudience,
      coverImage: editForm.coverImage,
      chapters: editForm.format === 'recorded'
        ? editChapters.filter(ch => ch.title).map((ch, i) => ({
            title: ch.title, sortOrder: i + 1, videoUrl: ch.videoUrl || null, documentUrl: ch.documentUrl || null, duration: ch.duration || 0,
          }))
        : undefined,
    });
    if (result) {
      setShowEdit(false);
      setEditingCourseId(null);
      triggerRefresh();
    }
  }, [editingCourseId, editForm, editChapters, updateCourse, triggerRefresh]);

  return (
    <div className="space-y-6">
      {/* 统计概览 */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-border/40"><CardContent className="p-4 text-center"><div className="text-2xl font-bold">{stats.totalCourses}</div><div className="text-xs text-muted-foreground">总课程</div></CardContent></Card>
          <Card className="border-primary/20"><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-primary">{stats.totalEnrollments}</div><div className="text-xs text-muted-foreground">总选课</div></CardContent></Card>
          <Card className="border-emerald-200/40"><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-emerald-600">{stats.totalCompletions}</div><div className="text-xs text-muted-foreground">总完成</div></CardContent></Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            {mode === 'department' && <TabsTrigger value="courses">课程管理</TabsTrigger>}
            <TabsTrigger value="push">推送管理</TabsTrigger>
            {mode === 'class' && <TabsTrigger value="progress">学习进度</TabsTrigger>}
          </TabsList>
          <Button size="sm" onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-1.5" />新建课程</Button>
        </div>

        {/* 课程管理 */}
        {mode === 'department' && (
          <TabsContent value="courses">
            <CoursesTab key={refreshTick} domains={domains} includeDraft onMutation={triggerRefresh} onEdit={handleEditCourse} />
          </TabsContent>
        )}

        {/* 推送管理 */}
        <TabsContent value="push">
          <PushTab mode={mode} domains={domains} classId={classId} className={className} onPushed={triggerRefresh} />
        </TabsContent>

        {/* 学习进度 */}
        {mode === 'class' && (
          <TabsContent value="progress">
            <ProgressTab classId={classId!} />
          </TabsContent>
        )}
      </Tabs>

      {/* 新建课程弹窗 */}
      <CourseFormDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        title="新建课程"
        form={newCourse}
        setForm={setNewCourse as React.Dispatch<React.SetStateAction<{ title: string; description: string; domain: CourseDomain; format: 'live' | 'recorded'; category: string; targetAudience: string; coverImage: string }>>}
        chapters={chapters}
        setChapters={setChapters}
        onSubmit={handleCreate}
        creatableDomains={effectiveCreatableDomains}
        submitLabel="创建课程"
      />

      {/* 编辑课程弹窗 */}
      <CourseFormDialog
        open={showEdit}
        onOpenChange={setShowEdit}
        title="编辑课程"
        form={editForm}
        setForm={setEditForm as React.Dispatch<React.SetStateAction<{ title: string; description: string; domain: CourseDomain; format: 'live' | 'recorded'; category: string; targetAudience: string; coverImage: string }>>}
        chapters={editChapters}
        setChapters={setEditChapters}
        onSubmit={handleEditSave}
        creatableDomains={effectiveCreatableDomains}
        submitLabel="保存修改"
      />
    </div>
  );
}
