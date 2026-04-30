'use client';

/**
 * 教师端 - 课后服务管理
 *
 * 功能：
 * - 查看我所教授的课后服务课程
 * - 查看选课学生名单（点名表）
 * - AI 智能评语反馈（零教师负担）
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { apiClient } from '@/services/api-client';
import type { ApiResponse } from '@/services/api-client';
import {
  BookOpen,
  Users,
  Clock,
  CalendarDays,
  Loader2,
  Sparkles,
  Star,
  MessageSquareText,
  CheckCircle2,
} from 'lucide-react';
import type { AfterSchoolCourse, CourseEnrollment } from '@/types/after-school';
import { DAY_LABELS, CATEGORY_CONFIG } from '@/types/after-school';
import { useFeedbackGeneration } from '@/hooks/useAfterSchoolAI';
import type { FeedbackTag } from '@/types/after-school-ai';

const FEEDBACK_TAGS: FeedbackTag[] = [
  '专注认真', '思维活跃', '乐于助人', '动手能力强', '进步明显', '团队协作',
];

type Teacher = {
  id: string;
  name: string;
  employeeId: string;
};

export default function TeacherAfterSchoolPage() {
  const [courses, setCourses] = useState<AfterSchoolCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [rosterCourseId, setRosterCourseId] = useState<string | null>(null);
  const [roster, setRoster] = useState<CourseEnrollment[]>([]);
  const [rosterLoading, setRosterLoading] = useState(false);

  // 评语相关
  const [feedbackStudent, setFeedbackStudent] = useState<CourseEnrollment | null>(null);
  const [feedbackCourse, setFeedbackCourse] = useState<AfterSchoolCourse | null>(null);
  const [selectedTags, setSelectedTags] = useState<FeedbackTag[]>([]);
  const [attendanceRate, setAttendanceRate] = useState(95);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const { feedback, isGenerating, generate: generateFeedback, clearFeedback } = useFeedbackGeneration();

  // 获取当前教师信息
  useEffect(() => {
    apiClient.get<Teacher>('/auth/current').then((res: ApiResponse<Teacher>) => {
      if (res.success && res.data) {
        setTeacher(res.data);
      }
    }).catch(() => {});
  }, []);

  // 获取教师所教授的课后服务课程
  const fetchMyCourses = useCallback(async () => {
    if (!teacher) return;
    setLoading(true);
    try {
      const res = await apiClient.get<AfterSchoolCourse[]>(`/after-school/courses?teacherId=${teacher.employeeId}`);
      if (res.success && res.data) {
        setCourses(res.data);
      }
    } catch {
      toast.error('加载课程失败');
    } finally {
      setLoading(false);
    }
  }, [teacher]);

  useEffect(() => {
    fetchMyCourses();
  }, [fetchMyCourses]);

  // 查看点名表
  const openRoster = async (courseId: string) => {
    setRosterCourseId(courseId);
    setRosterLoading(true);
    try {
      const res = await apiClient.get<CourseEnrollment[]>(`/after-school/roster/${courseId}`);
      if (res.success && res.data) {
        setRoster(res.data);
      }
    } catch {
      toast.error('加载点名表失败');
    } finally {
      setRosterLoading(false);
    }
  };

  // 打开评语弹窗
  const openFeedbackDialog = (student: CourseEnrollment, course: AfterSchoolCourse) => {
    setFeedbackStudent(student);
    setFeedbackCourse(course);
    setSelectedTags([]);
    setAttendanceRate(95);
    clearFeedback();
    setShowFeedbackDialog(true);
  };

  // 生成评语
  const handleGenerateFeedback = () => {
    if (!feedbackStudent || !feedbackCourse) return;
    if (selectedTags.length === 0) {
      toast.error('请至少选择一个表现标签');
      return;
    }
    generateFeedback({
      studentName: feedbackStudent.studentName || '同学',
      courseName: feedbackCourse.name,
      selectedTags,
      attendanceRate,
    });
  };

  // 当前查看点名表的课程
  const currentRosterCourse = courses.find(c => c.id === rosterCourseId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#5C7A72]" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* 页头 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">我的课后服务</h1>
          <p className="text-sm text-muted-foreground mt-1">查看课程名单，一键生成AI期末评语</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchMyCourses}>
          <Loader2 className="h-3.5 w-3.5 mr-1" />刷新
        </Button>
      </div>

      {/* 课程卡片 */}
      {courses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground">暂无课后服务课程</p>
            <p className="text-xs text-muted-foreground mt-1">请联系教务处分配课后服务课程</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map(course => {
            const categoryConf = CATEGORY_CONFIG[course.category] || CATEGORY_CONFIG.interest;
            const remain = course.maxStudents - course.currentStudents;
            return (
              <Card key={course.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{course.name}</CardTitle>
                    <Badge variant="outline" className={categoryConf.color}>{categoryConf.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{DAY_LABELS[course.dayOfWeek as keyof typeof DAY_LABELS]}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{course.startTime}-{course.endTime}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{course.currentStudents}/{course.maxStudents}人</span>
                    <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5" />{course.classroom}</span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => openRoster(course.id)}>
                      <Users className="h-3.5 w-3.5 mr-1" />点名表
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* 点名表弹窗 */}
      <Dialog open={!!rosterCourseId} onOpenChange={(open: boolean) => { if (!open) setRosterCourseId(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[#5C7A72]" />
              {currentRosterCourse?.name || '课程'} - 点名表
            </DialogTitle>
            <DialogDescription>
              共 {roster.length} 名学生，点击"AI评语"一键生成期末反馈
            </DialogDescription>
          </DialogHeader>

          {rosterLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-[#5C7A72]" />
            </div>
          ) : roster.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">暂无选课学生</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">序号</TableHead>
                  <TableHead>学生姓名</TableHead>
                  <TableHead>班级</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roster.map((student, idx) => (
                  <TableRow key={student.id}>
                    <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell className="font-medium">{student.studentName}</TableCell>
                    <TableCell className="text-muted-foreground">{student.className || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[#5C7A72] border-[#5C7A72]/30 bg-[#5C7A72]/5">
                        <CheckCircle2 className="h-3 w-3 mr-1" />已确认
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-[#5C7A72] hover:text-[#4A6A62]"
                        onClick={() => {
                          if (currentRosterCourse) openFeedbackDialog(student, currentRosterCourse);
                        }}
                      >
                        <Sparkles className="h-3.5 w-3.5 mr-1" />AI评语
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>

      {/* AI 评语生成弹窗 */}
      <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquareText className="h-5 w-5 text-[#5C7A72]" />
              AI 期末评语
            </DialogTitle>
            <DialogDescription>
              为 {feedbackStudent?.studentName || '同学'} 生成《{feedbackCourse?.name || '课程'}》期末反馈
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 表现标签 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">本学期表现标签</label>
              <div className="flex flex-wrap gap-2">
                {FEEDBACK_TAGS.map(tag => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <Button
                      key={tag}
                      type="button"
                      size="sm"
                      variant={isSelected ? 'default' : 'outline'}
                      className={isSelected ? 'bg-[#5C7A72] hover:bg-[#4A6A62] text-white' : ''}
                      onClick={() => {
                        setSelectedTags(prev =>
                          prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                        );
                      }}
                    >
                      {tag}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* 出勤率 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">出勤率: {attendanceRate}%</label>
              <input
                type="range"
                min={50}
                max={100}
                value={attendanceRate}
                onChange={(e) => setAttendanceRate(Number(e.target.value))}
                className="w-full accent-[#5C7A72]"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            {/* 生成按钮 */}
            <Button
              className="w-full bg-[#5C7A72] hover:bg-[#4A6A62] text-white"
              onClick={handleGenerateFeedback}
              disabled={isGenerating || selectedTags.length === 0}
            >
              {isGenerating ? (
                <><Loader2 className="h-4 w-4 mr-1 animate-spin" />正在生成评语...</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-1" />生成评语</>
              )}
            </Button>

            {/* 评语结果 */}
            {feedback && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#5C7A72]">生成的评语</label>
                <div className="bg-muted/50 rounded-lg p-3 text-sm leading-relaxed whitespace-pre-wrap">
                  {feedback}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    navigator.clipboard.writeText(feedback);
                    toast.success('评语已复制到剪贴板');
                  }}
                >
                  复制评语
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
