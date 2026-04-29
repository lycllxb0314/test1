import React, { memo } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Radio, Play, Clock, Layers, Users, Star, Edit3, Eye, Trash2 } from 'lucide-react';
import type { CloudCourse } from '@/types/cloud-course';
import type { DomainConfig } from './constants';

type CourseCardProps = {
  course: CloudCourse;
  domainConfig: DomainConfig;
  onPublish: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (course: CloudCourse) => void;
};

export const CourseCard = memo(function CourseCard({ course, domainConfig, onPublish, onDelete, onEdit }: CourseCardProps) {
  const learnPath = course.format === 'live'
    ? `/cloud-course/live/${course.id}`
    : `/cloud-course/learn/${course.id}`;

  return (
    <Card className="group overflow-hidden border-border/60 hover:border-primary/40 hover:shadow-md transition-all duration-200">
      {/* 封面 */}
      <div className="relative aspect-video bg-muted">
        {course.coverImage ? (
          <img src={course.coverImage} alt={course.title} className="w-full h-full object-cover" />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${domainConfig.bg}`}>
            <div className="opacity-40">{domainConfig.icon}</div>
          </div>
        )}
        <div className="absolute top-2 left-2 flex gap-1">
          <Badge variant="secondary" className="text-[10px] h-5 bg-background/90 backdrop-blur-sm">
            {course.format === 'live' ? <><Radio className="h-2.5 w-2.5 mr-0.5" />直播</> : <><Play className="h-2.5 w-2.5 mr-0.5" />录播</>}
          </Badge>
          <Badge variant="outline" className={`text-[10px] h-5 ${course.status === 'published' ? 'bg-[#5C7A72]/10 text-[#5C7A72] border-[#5C7A72]/30' : 'bg-[#C9A96E]/10 text-[#C8956C] border-[#C8956C]/30'}`}>
            {course.status === 'published' ? '已发布' : '草稿'}
          </Badge>
        </div>
        {course.totalDuration > 0 && (
          <div className="absolute bottom-2 right-2 bg-foreground/70 text-background text-[10px] px-1.5 py-0.5 rounded">
            <Clock className="h-2.5 w-2.5 inline mr-0.5" />{Math.round(course.totalDuration / 60)}分钟
          </div>
        )}
      </div>

      {/* 信息 */}
      <div className="p-3.5 space-y-2">
        <h3 className="text-sm font-medium leading-tight line-clamp-2 text-foreground">{course.title}</h3>
        {course.description && <p className="text-xs text-muted-foreground line-clamp-2">{course.description}</p>}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {course.totalChapters > 0 && <span className="flex items-center gap-1"><Layers className="h-3 w-3" />{course.totalChapters}章节</span>}
          {course.enrolledCount > 0 && <span className="flex items-center gap-1"><Users className="h-3 w-3" />{course.enrolledCount}人</span>}
          {course.rating > 0 && <span className="flex items-center gap-1"><Star className="h-3 w-3 text-[#C9A96E]" />{course.rating.toFixed(1)}</span>}
        </div>
        {/* 操作 */}
        <div className="flex items-center gap-2 pt-2.5 border-t border-border/60">
          {course.status === 'draft' && (
            <Button size="sm" variant="outline" onClick={() => onPublish(course.id)} className="flex-1 h-7 text-xs">发布</Button>
          )}
          <Button size="sm" variant="outline" onClick={() => onEdit(course)} className="flex-1 h-7 text-xs">
            <Edit3 className="h-3 w-3 mr-1" />编辑
          </Button>
          <Link href={learnPath} className="flex-1">
            <Button size="sm" variant="outline" className="w-full h-7 text-xs"><Eye className="h-3 w-3 mr-1" />预览</Button>
          </Link>
          <Button size="sm" variant="ghost" onClick={() => onDelete(course.id)} className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
});
