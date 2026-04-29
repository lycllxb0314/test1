'use client';

import { useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  useCloudCourseStats,
  useCloudCourseActions,
} from '@/hooks/useCloudCourse';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Plus, Users, Star, Cloud } from 'lucide-react';
import { apiClient } from '@/services/api-client';
import type { CourseDomain, CloudCourse, CloudCourseChapter } from '@/types/cloud-course';
import { MODE_CONFIGS } from './constants';
import { CoursesTab } from './CoursesTab';
import { PushTab } from './PushTab';
import { ProgressTab } from './ProgressTab';
import { CourseFormDialog } from './CourseFormDialog';

type CourseFormData = {
  title: string;
  description: string;
  domain: CourseDomain;
  format: 'live' | 'recorded';
  category: string;
  targetAudience: string;
  coverImage: string;
};

type ChapterData = {
  title: string;
  videoUrl: string;
  documentUrl: string;
  duration: number;
};

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
  const [newCourse, setNewCourse] = useState<CourseFormData>({
    title: '', description: '',
    domain: (defaultDomain || effectiveCreatableDomains[0]?.domain || 'research') as CourseDomain,
    format: 'recorded',
    category: '', targetAudience: '', coverImage: '',
  });
  const [chapters, setChapters] = useState<ChapterData[]>([]);

  // ── 编辑课程 ──
  const [showEdit, setShowEdit] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<CourseFormData>({
    title: '', description: '',
    domain: 'research' as CourseDomain,
    format: 'recorded',
    category: '', targetAudience: '', coverImage: '',
  });
  const [editChapters, setEditChapters] = useState<ChapterData[]>([]);

  // 课程列表刷新
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

  // 页面标题/副标题
  const pageTitle = '云教学管理';
  const pageSubtitle = mode === 'class'
    ? '推送课程给家长 · 跟踪学习进度'
    : '教师研修 · 家长课堂 · 学生拓展';

  return (
    <div className="min-h-screen bg-background">
      {/* 页面头部 */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#A0785A] to-[#C9A96E] shadow-md">
                <Cloud className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">{pageTitle}</h1>
                <p className="text-sm text-muted-foreground mt-0.5">{pageSubtitle}</p>
              </div>
            </div>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-1.5" />新建课程
            </Button>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* 统计概览 */}
        {stats && (
          <div className="grid grid-cols-3 gap-4">
            <Card className="relative overflow-hidden border-border/60">
              <div className="absolute inset-0 bg-gradient-to-br from-[#A0785A] to-[#C9A96E] opacity-[0.06]" />
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-[#A0785A] to-[#C9A96E] shadow-sm">
                    <BookOpen className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{stats.totalCourses}</div>
                    <div className="text-xs text-muted-foreground">总课程</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden border-border/60">
              <div className="absolute inset-0 bg-gradient-to-br from-[#5C7A72] to-[#7DB5A8] opacity-[0.06]" />
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-[#5C7A72] to-[#7DB5A8] shadow-sm">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-[#5C7A72]">{stats.totalEnrollments}</div>
                    <div className="text-xs text-muted-foreground">总选课</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden border-border/60">
              <div className="absolute inset-0 bg-gradient-to-br from-[#C8956C] to-[#D4A07A] opacity-[0.06]" />
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-[#C8956C] to-[#D4A07A] shadow-sm">
                    <Star className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-[#C8956C]">{stats.totalCompletions}</div>
                    <div className="text-xs text-muted-foreground">总完成</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between border-b border-border pb-0">
            <TabsList className="bg-transparent p-0 h-auto border-0">
              {mode === 'department' && (
                <TabsTrigger value="courses" className="relative px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-primary transition-colors">
                  课程管理
                </TabsTrigger>
              )}
              <TabsTrigger value="push" className="relative px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-primary transition-colors">
                推送管理
              </TabsTrigger>
              {mode === 'class' && (
                <TabsTrigger value="progress" className="relative px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-primary transition-colors">
                  学习进度
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          {/* 课程管理 */}
          {mode === 'department' && (
            <TabsContent value="courses" className="mt-6">
              <CoursesTab key={refreshTick} domains={domains} includeDraft onMutation={triggerRefresh} onEdit={handleEditCourse} />
            </TabsContent>
          )}

          {/* 推送管理 */}
          <TabsContent value="push" className="mt-6">
            <PushTab mode={mode} domains={domains} classId={classId} className={className} onPushed={triggerRefresh} />
          </TabsContent>

          {/* 学习进度 */}
          {mode === 'class' && (
            <TabsContent value="progress" className="mt-6">
              <ProgressTab classId={classId!} />
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* 新建课程弹窗 */}
      <CourseFormDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        title="新建课程"
        form={newCourse}
        setForm={setNewCourse}
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
        setForm={setEditForm}
        chapters={editChapters}
        setChapters={setEditChapters}
        onSubmit={handleEditSave}
        creatableDomains={effectiveCreatableDomains}
        submitLabel="保存修改"
      />
    </div>
  );
}
