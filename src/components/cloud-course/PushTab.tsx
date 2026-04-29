import React, { useState, useMemo, useCallback, useEffect, memo, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useCloudCourseActions } from '@/hooks/useCloudCourse';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Send, Users, BookOpen, TrendingUp, ExternalLink } from 'lucide-react';
import { apiClient } from '@/services/api-client';
import type { CloudCourse } from '@/types/cloud-course';
import type { DomainConfig } from './constants';
import { DOMAIN_CONFIGS } from './constants';

type PushTabProps = {
  mode: 'department' | 'class';
  domains: DomainConfig[];
  classId?: string;
  className?: string;
  onPushed: () => void;
};

export const PushTab = memo(function PushTab({ mode, domains, classId, className, onPushed }: PushTabProps) {
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
      <Card className="border-border/60">
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#A0785A] to-[#C9A96E] flex items-center justify-center shadow-sm">
              <Send className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold">推送课程</h2>
              <p className="text-xs text-muted-foreground">{mode === 'class' ? '推送给本班家长' : '推送给目标群体'}</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* 课程选择 */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">选择课程</label>
              {publishedCourses.length > 0 ? (
                <select className="w-full border rounded-lg p-2.5 text-sm bg-background focus:ring-1 focus:ring-primary focus:border-primary" value={pushData.courseId} onChange={e => setPushData(p => ({ ...p, courseId: e.target.value }))}>
                  <option value="">-- 请选择课程 --</option>
                  {publishedCourses.map(c => (
                    <option key={c.id} value={c.id}>[{DOMAIN_CONFIGS[c.domain]?.label}] {c.title}</option>
                  ))}
                </select>
              ) : (
                <div className="text-sm text-muted-foreground py-8 text-center border border-dashed rounded-lg bg-muted/30">
                  暂无已发布课程可推送，请先创建并发布课程
                </div>
              )}
            </div>

            {/* 选中课程预览 */}
            {selectedPushCourse && (
              <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg border border-border/40">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${DOMAIN_CONFIGS[selectedPushCourse.domain]?.gradient || 'from-[#A0785A] to-[#C9A96E]'} flex items-center justify-center shrink-0 shadow-sm`}>
                  <div className="text-white">{DOMAIN_CONFIGS[selectedPushCourse.domain]?.icon || <BookOpen className="h-5 w-5" />}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium truncate">{selectedPushCourse.title}</h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <Badge variant="outline" className="text-[10px] h-4">{selectedPushCourse.format === 'live' ? '直播' : '录播'}</Badge>
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
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">推送方式</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setPushData(p => ({ ...p, targetType: 'grade' }))} className={`flex-1 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${pushData.targetType === 'grade' ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-muted-foreground/40'}`}>按年级</button>
                    <button type="button" onClick={() => setPushData(p => ({ ...p, targetType: 'class' }))} className={`flex-1 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${pushData.targetType === 'class' ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-muted-foreground/40'}`}>按班级</button>
                  </div>
                </div>

                {gradesLoading ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    加载年级班级数据...
                  </div>
                ) : gradesData.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">暂无班级数据</div>
                ) : pushData.targetType === 'grade' ? (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">选择年级（勾选后自动包含该年级所有班级）</label>
                    <div className="space-y-1.5">
                      {gradesData.map(g => {
                        const isSelected = pushData.selectedGrades.includes(g.grade);
                        const studentCount = g.classes.reduce((s, c) => s + c.studentCount, 0);
                        return (
                          <button key={g.grade} type="button" onClick={() => toggleGrade(g.grade)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all ${isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/40'}`}>
                            <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-primary border-primary' : 'border-muted-foreground/40'}`}>
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
                    <label className="text-xs font-medium text-muted-foreground">选择班级</label>
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
                                <button key={cls.id} type="button" onClick={() => toggleClass(cls.id)} className={`flex items-center gap-2 px-2.5 py-2 rounded-md border text-left text-sm transition-all ${isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/40'}`}>
                                  <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-primary border-primary' : 'border-muted-foreground/40'}`}>
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
                  <div className="bg-primary/5 rounded-lg p-3 flex items-center gap-4 text-xs text-muted-foreground border border-primary/10">
                    <span>已选 <span className="font-semibold text-foreground">{pushData.targetType === 'grade' ? `${pushTargetStats.gradeCount}个年级` : `${pushTargetStats.classCount}个班级`}</span></span>
                    <span>覆盖 <span className="font-semibold text-foreground">{pushTargetStats.classCount}</span> 个班</span>
                    <span><span className="font-semibold text-foreground">{pushTargetStats.studentCount}</span> 名学生</span>
                    <span><span className="font-semibold text-foreground">{pushTargetStats.parentCount}</span> 位家长</span>
                  </div>
                )}
              </div>
            )}

            {/* 班主任模式：显示目标 */}
            {mode === 'class' && className && (
              <div className="text-sm bg-[#5C7A72]/5 rounded-lg p-3 flex items-center gap-2 border border-[#5C7A72]/20">
                <Users className="h-4 w-4 text-[#5C7A72]" />
                <span>推送给 <span className="font-semibold text-[#5C7A72]">{className}</span> 全体学生家长</span>
              </div>
            )}

            <Textarea placeholder="推送说明（可选，如：请在本周内完成学习）" value={pushData.message} onChange={e => setPushData(p => ({ ...p, message: e.target.value }))} rows={3} className="resize-none" />
            <Button className="w-full" onClick={handlePush} disabled={!pushData.courseId || (mode === 'department' && pushData.selectedGrades.length === 0 && pushData.selectedClassIds.length === 0)}>
              <Send className="h-4 w-4 mr-1.5" />{mode === 'class' ? '推送给我班' : '推送课程'}
            </Button>
          </div>
        </div>
      </Card>

      {/* 推送概览 */}
      <Card className="border-border/60">
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#5C7A72] to-[#7DB5A8] flex items-center justify-center shadow-sm">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold">推送概览</h2>
              <p className="text-xs text-muted-foreground">各域课程推送与选课情况</p>
            </div>
          </div>

          <div className="space-y-3">
            {domains.map(dc => {
              const domainCourses = publishedCourses.filter(c => c.domain === dc.domain);
              return (
                <div key={dc.domain} className="flex items-center gap-3 p-3.5 rounded-xl border border-border/40 hover:border-border transition-colors">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${dc.gradient} flex items-center justify-center shrink-0 shadow-sm`}>
                    <div className="text-white">{dc.icon}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium">{dc.label}</h4>
                    <p className="text-xs text-muted-foreground">{domainCourses.length} 门已发布</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">{domainCourses.reduce((s, c) => s + c.enrolledCount, 0)}</div>
                    <div className="text-xs text-muted-foreground">总选课</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
});
