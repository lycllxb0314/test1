'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  LayoutGrid, Users, School, Search, ChevronDown, ChevronRight,
  Clock, User, BookOpen, Calendar, RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getSubjectColor } from '@/lib/subject-colors';

import { ClassScheduleCard } from './components/ClassScheduleCard';
import { TeacherScheduleCard } from './components/TeacherScheduleCard';
import { ScheduleMatrix } from './components/ScheduleMatrix';
import { useSchoolSchedule } from './useSchoolSchedule';

export default function SchoolSchedulePage() {
  const {
    viewMode, setViewMode,
    classData, filteredTeacherData, summary, subjects,
    loading,
    gradeFilter, setGradeFilter,
    subjectFilter, setSubjectFilter,
    searchQuery, setSearchQuery,
    expandedGrades, expandedSubjects,
    toggleGrade, toggleSubject,
    detailDialog, setDetailDialog,
    viewTeacherDetail,
    loadData,
    grades,
  } = useSchoolSchedule();

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            全校课表总览
          </h1>
          <p className="text-muted-foreground mt-1">
            查看所有年级、班级、教师的课表安排
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
          <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
          刷新
        </Button>
      </div>

      {/* 统计卡片 */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <School className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">{summary.totalClasses}</div>
                  <div className="text-xs text-muted-foreground">班级总数</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-500" />
                <div>
                  <div className="text-2xl font-bold">{summary.totalTeachers}</div>
                  <div className="text-xs text-muted-foreground">有课教师</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-purple-500" />
                <div>
                  <div className="text-2xl font-bold">{summary.totalSlots}</div>
                  <div className="text-xs text-muted-foreground">总课时</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                <div>
                  <div className="text-2xl font-bold">{Math.round((summary.totalSlots / summary.totalClasses) || 0)}</div>
                  <div className="text-xs text-muted-foreground">平均班课时</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 主内容区 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center border rounded-lg p-1">
                <Button
                  variant={viewMode === 'classes' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('classes')}
                  className="gap-1"
                >
                  <School className="h-4 w-4" />
                  按班级
                </Button>
                <Button
                  variant={viewMode === 'teachers' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('teachers')}
                  className="gap-1"
                >
                  <Users className="h-4 w-4" />
                  按教师
                </Button>
                <Button
                  variant={viewMode === 'summary' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('summary')}
                  className="gap-1"
                >
                  <LayoutGrid className="h-4 w-4" />
                  统计
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {viewMode === 'classes' && (
                <Select value={gradeFilter} onValueChange={setGradeFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="选择年级" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部年级</SelectItem>
                    {grades.map(g => (
                      <SelectItem key={g} value={g.toString()}>{g}年级</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {viewMode === 'teachers' && (
                <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="选择学科" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部学科</SelectItem>
                    {subjects.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={viewMode === 'classes' ? '搜索班级...' : '搜索教师...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-48 pl-9"
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* 按班级视图 */}
          {viewMode === 'classes' && (
            loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-stone-400">
                <div className="w-12 h-12 border-4 border-stone-200 border-t-amber-500 rounded-full animate-spin mb-4" />
                <span>加载课表数据...</span>
              </div>
            ) : classData.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                暂无课表数据
              </div>
            ) : (
              <div className="space-y-6">
                {classData.map((gradeData) => (
                  <div key={gradeData.grade} className="border rounded-xl overflow-hidden">
                    <div
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-stone-50 to-white cursor-pointer hover:bg-stone-100 transition-colors"
                      onClick={() => toggleGrade(gradeData.grade)}
                    >
                      <div className="flex items-center gap-3">
                        {expandedGrades.has(gradeData.grade) ? (
                          <ChevronDown className="h-5 w-5 text-stone-400" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-stone-400" />
                        )}
                        <span className="text-lg font-bold text-stone-800">{gradeData.gradeName}</span>
                        <Badge variant="secondary" className="ml-1">
                          {gradeData.classCount} 个班级
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        已排 {gradeData.classes.reduce((sum, c) => sum + c.slots.length, 0)} 节课
                      </div>
                    </div>

                    {expandedGrades.has(gradeData.grade) && (
                      <div className="p-4 space-y-4 bg-stone-50/50">
                        {gradeData.classes.map((cls, index) => (
                          <ClassScheduleCard
                            key={cls.id}
                            cls={cls}
                            classIndex={index}
                            totalInGrade={gradeData.classCount}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          )}

          {/* 按教师视图 */}
          {viewMode === 'teachers' && (
            loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-stone-400">
                <div className="w-12 h-12 border-4 border-stone-200 border-t-amber-500 rounded-full animate-spin mb-4" />
                <span>加载教师数据...</span>
              </div>
            ) : filteredTeacherData.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                暂无教师课表数据
              </div>
            ) : (
              <div className="space-y-6">
                {filteredTeacherData.map((group) => (
                  <div key={group.subject} className="border rounded-xl overflow-hidden">
                    <div
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-stone-50 to-white cursor-pointer hover:bg-stone-100 transition-colors"
                      onClick={() => toggleSubject(group.subject)}
                    >
                      <div className="flex items-center gap-3">
                        {expandedSubjects.has(group.subject) ? (
                          <ChevronDown className="h-5 w-5 text-stone-400" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-stone-400" />
                        )}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shadow-sm ${getSubjectColor(group.subject).bg} ${getSubjectColor(group.subject).text}`}>
                          {group.subject.slice(0, 1)}
                        </div>
                        <span className="text-lg font-bold text-stone-800">{group.subject}</span>
                        <Badge variant="secondary" className="ml-1">
                          {group.teacherCount} 位教师
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        共 {group.teachers.reduce((sum, t) => sum + t.totalHours, 0)} 节课
                      </div>
                    </div>

                    {expandedSubjects.has(group.subject) && (
                      <div className="p-4 bg-stone-50/50">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {group.teachers.map((teacher) => (
                            <TeacherScheduleCard
                              key={teacher.id}
                              teacher={teacher}
                              onViewDetail={viewTeacherDetail}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          )}

          {/* 统计视图 */}
          {viewMode === 'summary' && summary && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">各年级课表统计</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {summary.gradeStats.map((stat) => (
                      <div key={stat.grade} className="flex items-center justify-between">
                        <span className="text-sm">{stat.gradeName}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-muted-foreground">
                            {stat.classCount} 个班级
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${Math.min(100, (stat.slotCount / (stat.classCount * 30)) * 100)}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium w-12 text-right">
                              {stat.slotCount}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">各学科课时统计</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {summary.subjectStats.slice(0, 10).map((stat) => {
                      const colors = getSubjectColor(stat.subject);
                      return (
                        <div key={stat.subject} className="flex items-center justify-between">
                          <span className="text-sm">{stat.subject}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={cn('h-full rounded-full', colors.bg)}
                                style={{ width: `${Math.min(100, (stat.hours / (summary.totalSlots || 1)) * 100 * 3)}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium w-12 text-right">
                              {stat.hours}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 详情弹窗 */}
      <Dialog open={!!detailDialog} onOpenChange={() => setDetailDialog(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {detailDialog?.type === 'class' ? (
                <span className="flex items-center gap-2">
                  <School className="h-5 w-5" />
                  {detailDialog?.data?.name || ''} 课表
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {detailDialog?.data?.name || ''} 课表
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {detailDialog && detailDialog.scheduleMatrix && (
            <ScheduleMatrix
              matrix={detailDialog.scheduleMatrix}
              type={detailDialog.type}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
