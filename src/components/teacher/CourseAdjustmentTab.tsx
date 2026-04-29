'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarClock, RefreshCw, CheckCircle, Clock, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CourseAdjustment } from '@/components/course-adjustment/CourseAdjustmentDialog';

// 常量映射
const WEEK_DAY_NAMES: Record<number, string> = { 1: '周一', 2: '周二', 3: '周三', 4: '周四', 5: '周五' };
const GRADE_NAMES: Record<number, string> = { 1: '一年级', 2: '二年级', 3: '三年级', 4: '四年级', 5: '五年级', 6: '六年级' };

interface CourseAdjustmentTabProps {
  adjustViewMode: 'pending' | 'completed';
  setAdjustViewMode: (mode: 'pending' | 'completed') => void;
  adjustStats: { pending: number; completed: number };
  adjustments: CourseAdjustment[];
  completedAdjustments: CourseAdjustment[];
  adjustmentLoading: boolean;
  completedLoading: boolean;
  onRefreshPending: () => void;
  onRefreshCompleted: () => void;
  onOpenAdjustDialog: (adjust: CourseAdjustment) => void;
}

export const CourseAdjustmentTab: React.FC<CourseAdjustmentTabProps> = ({
  adjustViewMode, setAdjustViewMode, adjustStats, adjustments, completedAdjustments,
  adjustmentLoading, completedLoading, onRefreshPending, onRefreshCompleted, onOpenAdjustDialog
}) => {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* 调课列表 */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CalendarClock className="h-5 w-5" />调课中心
                </CardTitle>
                <CardDescription>
                  {adjustViewMode === 'pending' ? '需要安排代课教师的课程' : '已完成处理的调课记录'}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center border rounded-lg p-0.5">
                  <Button
                    variant={adjustViewMode === 'pending' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-7 px-3"
                    onClick={() => setAdjustViewMode('pending')}
                  >
                    待处理 ({adjustStats.pending})
                  </Button>
                  <Button
                    variant={adjustViewMode === 'completed' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-7 px-3"
                    onClick={() => setAdjustViewMode('completed')}
                  >
                    已处理 ({adjustStats.completed})
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => adjustViewMode === 'pending' ? onRefreshPending() : onRefreshCompleted()}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />刷新
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* 待处理调课列表 */}
            {adjustViewMode === 'pending' && (
              <>
                {adjustmentLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : adjustments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>暂无待处理调课</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {adjustments.map((adjust: CourseAdjustment) => (
                      <Card
                        key={adjust.id}
                        className="border-l-4 border-l-amber-500 hover:shadow-md transition-shadow cursor-pointer bg-card"
                        onClick={() => onOpenAdjustDialog(adjust)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center flex-wrap gap-2 mb-3">
                                <Badge variant="outline" className="border-amber-500/50 text-amber-600">
                                  {adjust.grade ? (GRADE_NAMES[adjust.grade] || `${adjust.grade}年级`) : '未知年级'}
                                </Badge>
                                <Badge variant="secondary">
                                  {adjust.subject || '未知科目'}
                                </Badge>
                                <Badge variant="outline" className="text-muted-foreground">
                                  {adjust.applicantName} 请假
                                </Badge>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Clock className="h-4 w-4 shrink-0" />
                                  <span>第{adjust.effectiveWeek || '?'}周 {adjust.weekDay ? WEEK_DAY_NAMES[adjust.weekDay] : '?'} 第{(adjust.periodIndex ?? 0) + 1}节</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <GraduationCap className="h-4 w-4 shrink-0" />
                                  <span>{adjust.className || '未知班级'}</span>
                                </div>
                              </div>

                              {adjust.reason && (
                                <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                                  原因：{adjust.reason}
                                </p>
                              )}
                            </div>

                            <Button size="sm" variant="default" className="shrink-0">
                              处理调课
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* 已处理调课列表 */}
            {adjustViewMode === 'completed' && (
              <>
                {completedLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : completedAdjustments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>暂无已处理调课记录</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {completedAdjustments.map((adjust: CourseAdjustment) => (
                      <Card
                        key={adjust.id}
                        className="border-l-4 border-l-green-500 bg-card"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center flex-wrap gap-2 mb-3">
                                <Badge variant="outline" className="border-green-500/50 text-green-600">
                                  {adjust.grade ? (GRADE_NAMES[adjust.grade] || `${adjust.grade}年级`) : '未知年级'}
                                </Badge>
                                <Badge variant="secondary">
                                  {adjust.subject || '未知科目'}
                                </Badge>
                                <Badge variant="outline" className="text-muted-foreground">
                                  {adjust.applicantName} 请假
                                </Badge>
                                <Badge className={cn(
                                  'font-normal',
                                  adjust.adjustType === 'substitute'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-gray-100 text-gray-700'
                                )}>
                                  {adjust.adjustType === 'substitute'
                                    ? `代课：${adjust.substituteName || '未知'}`
                                    : '课程取消'}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Clock className="h-4 w-4 shrink-0" />
                                  <span>第{adjust.effectiveWeek || '?'}周 {adjust.weekDay ? WEEK_DAY_NAMES[adjust.weekDay] : '?'} 第{(adjust.periodIndex ?? 0) + 1}节</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <GraduationCap className="h-4 w-4 shrink-0" />
                                  <span>{adjust.className || '未知班级'}</span>
                                </div>
                              </div>

                              {adjust.adjusterName && (
                                <p className="text-sm text-muted-foreground mt-2">
                                  处理人：{adjust.adjusterName}
                                  {adjust.completedAt && ` · ${new Date(adjust.completedAt).toLocaleString('zh-CN')}`}
                                </p>
                              )}
                            </div>

                            <Badge className="bg-green-100 text-green-700 border-green-200">
                              <CheckCircle className="h-3.5 w-3.5 mr-1" />
                              已完成
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 操作说明与统计 */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">智能调课说明</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600 space-y-2">
            <p>• <strong>智能推荐</strong>：系统自动推荐可用的代课教师</p>
            <p>• <strong>优先级</strong>：同学科、无课冲突、工作量少</p>
            <p>• <strong>一键安排</strong>：选择教师后自动通知并更新课表</p>
            <p>• <strong>取消课程</strong>：该节课取消不上</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">统计数据</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">待处理</span>
              <Badge className="bg-amber-100 text-amber-700">{adjustStats.pending}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">已完成</span>
              <Badge className="bg-green-100 text-green-700">{adjustStats.completed}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
