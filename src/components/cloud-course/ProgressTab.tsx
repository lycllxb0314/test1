import React, { useMemo, memo } from 'react';
import Link from 'next/link';
import { useCloudCourseEnrollments } from '@/hooks/useCloudCourse';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Star, Play, Clock, Radio, TrendingUp, ExternalLink } from 'lucide-react';
import { DOMAIN_CONFIGS } from './constants';

type ProgressTabProps = {
  classId: string;
};

export const ProgressTab = memo(function ProgressTab({ classId }: ProgressTabProps) {
  const { enrollments, loading } = useCloudCourseEnrollments(classId);

  const stats = useMemo(() => {
    const total = enrollments.length;
    const completed = enrollments.filter(e => e.status === 'completed').length;
    const learning = enrollments.filter(e => e.status === 'learning').length;
    const pending = enrollments.filter(e => e.status === 'pushed' || e.status === 'scheduled').length;
    return { total, completed, learning, pending };
  }, [enrollments]);

  const statCards = [
    { label: '总推送', value: stats.total, gradient: 'from-[#A0785A] to-[#C9A96E]', icon: <Send className="h-4 w-4 text-white" /> },
    { label: '已完成', value: stats.completed, gradient: 'from-[#5C7A72] to-[#7DB5A8]', icon: <Star className="h-4 w-4 text-white" /> },
    { label: '学习中', value: stats.learning, gradient: 'from-[#C9A96E] to-[#D4B87A]', icon: <Play className="h-4 w-4 text-white" /> },
    { label: '待安排', value: stats.pending, gradient: 'from-[#C8956C] to-[#D4A07A]', icon: <Clock className="h-4 w-4 text-white" /> },
  ];

  return (
    <div>
      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {statCards.map(s => (
          <Card key={s.label} className="relative overflow-hidden border-border/60">
            <div className={`absolute inset-0 bg-gradient-to-br ${s.gradient} opacity-[0.06]`} />
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${s.gradient} shadow-sm`}>{s.icon}</div>
                <div>
                  <div className="text-2xl font-bold">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/60">
        <div className="px-6 py-4 border-b border-border"><h2 className="font-semibold">本班课程学习进度</h2></div>
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
                const domainConfig = enrollment.course?.domain ? DOMAIN_CONFIGS[enrollment.course.domain] : null;
                return (
                  <div key={enrollment.id} className="px-6 py-4 flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${domainConfig?.gradient || 'from-[#A0785A] to-[#C9A96E]'} flex items-center justify-center shrink-0 shadow-sm`}>
                      <div className="text-white">{isLive ? <Radio className="h-4 w-4" /> : <Play className="h-4 w-4" />}</div>
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
