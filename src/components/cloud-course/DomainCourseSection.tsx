import React, { useState, useMemo, useCallback, memo } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useCloudCourses, useCloudCourseActions } from '@/hooks/useCloudCourse';
import type { CourseDomain, CloudCourse } from '@/types/cloud-course';
import type { DomainConfig } from './constants';
import { CourseCard } from './CourseCard';

type DomainCourseSectionProps = {
  domain: CourseDomain;
  domainConfig: DomainConfig;
  includeDraft?: boolean;
  onMutation?: () => void;
  onEdit: (course: CloudCourse) => void;
};

export const DomainCourseSection = memo(function DomainCourseSection({
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
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${domainConfig.gradient} flex items-center justify-center shadow-sm`}>
            <div className="text-white">{domainConfig.icon}</div>
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">{domainConfig.label}</h2>
            <p className="text-xs text-muted-foreground">{filtered.length} 门课程</p>
          </div>
        </div>
        <div className="relative w-56">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="搜索课程..." value={keyword} onChange={e => setKeyword(e.target.value)} className="pl-8 h-8 text-sm" />
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground bg-muted/30 rounded-xl border border-dashed border-border">
          <div className={`w-12 h-12 rounded-xl ${domainConfig.bg} flex items-center justify-center mx-auto mb-3 opacity-50`}>
            {domainConfig.icon}
          </div>
          <p className="text-sm">暂无课程</p>
          <p className="text-xs mt-1">点击右上角"新建课程"创建</p>
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
