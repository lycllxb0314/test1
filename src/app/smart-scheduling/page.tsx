'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertCircle, 
  CheckCircle2, 
  Lightbulb, 
  Users, 
  BookOpen, 
  Calendar,
  Sparkles,
  ArrowRight,
  Loader2
} from 'lucide-react';

interface GuidanceData {
  success: boolean;
  config: {
    school: string;
    classCount: number;
    classesPerGrade: number;
    teacherCount: number;
  };
  guidance: {
    currentStatus: {
      teacherCount: number;
      classCount: number;
      avgPeriodsPerTeacher: number;
      maxPeriodsPerTeacher: number;
      minPeriodsPerTeacher: number;
    };
    practices: Array<{
      type: 'info' | 'warning' | 'error' | 'success';
      category: string;
      title: string;
      description: string;
      action?: { label: string; target?: string };
    }>;
  };
  subjectRequirements: Record<string, number>;
  teacherRequirements: Record<string, { required: number; available: number; gap: number }>;
}

interface DivisionResult {
  success: boolean;
  division: {
    id: string;
    name: string;
    quality: {
      coverage: number;
      balanceScore: number;
      crossGradeRatio: number;
      headTeacherMatch: number;
    };
    recommendations: string[];
    warnings: string[];
    assignments: Array<{
      teacherId: string;
      teacherName: string;
      subject: string;
      totalPeriods: number;
      classCount: number;
      isHeadTeacher: boolean;
    }>;
    totalAssignments: number;
  };
}

interface ScheduleResult {
  success: boolean;
  division: {
    id: string;
    name: string;
    quality: {
      coverage: number;
      balanceScore: number;
      crossGradeRatio: number;
      headTeacherMatch: number;
    };
  };
  schedule: {
    id: string;
    totalSlots: number;
    quality: {
      coverage: number;
      conflictCount: number;
      alternationScore: number;
      rotationScore: number;
    };
    slots: Array<{
      classId: string;
      className: string;
      grade: number;
      weekDay: number;
      periodIndex: number;
      subject: string;
      teacherId: string;
      teacherName: string;
    }>;
  };
}

const SUBJECT_NAMES: Record<string, string> = {
  chinese: '语文',
  math: '数学',
  pe: '体育',
  music: '音乐',
  art: '美术',
  moral: '道德与法治',
  science: '科学',
  english: '英语',
};

export default function SmartSchedulingPage() {
  const [step, setStep] = useState<'guidance' | 'division' | 'schedule'>('guidance');
  const [guidanceData, setGuidanceData] = useState<GuidanceData | null>(null);
  const [divisionResult, setDivisionResult] = useState<DivisionResult | null>(null);
  const [scheduleResult, setScheduleResult] = useState<ScheduleResult | null>(null);
  const [loading, setLoading] = useState(false);

  // 加载指导数据
  useEffect(() => {
    fetchGuidance();
  }, []);

  const fetchGuidance = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/smart-scheduling?action=guidance');
      const data = await res.json();
      setGuidanceData(data);
    } catch (error) {
      console.error('Failed to fetch guidance:', error);
    } finally {
      setLoading(false);
    }
  };

  const executeDivision = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/smart-scheduling?action=division');
      const data = await res.json();
      setDivisionResult(data);
      setStep('division');
    } catch (error) {
      console.error('Failed to execute division:', error);
    } finally {
      setLoading(false);
    }
  };

  const executeSchedule = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/smart-scheduling?action=schedule');
      const data = await res.json();
      setScheduleResult(data);
      setStep('schedule');
    } catch (error) {
      console.error('Failed to execute schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPracticeIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      default:
        return <Lightbulb className="h-5 w-5 text-blue-500" />;
    }
  };

  if (loading && !guidanceData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            智能分工与排课
          </h1>
          <p className="text-muted-foreground mt-1">
            系统自动生成最佳实践方案，教务主任只需一键确认
          </p>
        </div>
        <div className="flex items-center gap-2">
          {step === 'guidance' && (
            <Button onClick={executeDivision} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              开始智能分工
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
          {step === 'division' && (
            <Button onClick={executeSchedule} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              一键排课
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>

      {/* 步骤指示器 */}
      <div className="flex items-center gap-4">
        <div className={`flex items-center gap-2 ${step === 'guidance' ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'guidance' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            1
          </div>
          <span className="font-medium">最佳实践指导</span>
        </div>
        <div className="h-px flex-1 bg-border" />
        <div className={`flex items-center gap-2 ${step === 'division' ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'division' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            2
          </div>
          <span className="font-medium">智能分工方案</span>
        </div>
        <div className="h-px flex-1 bg-border" />
        <div className={`flex items-center gap-2 ${step === 'schedule' ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'schedule' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            3
          </div>
          <span className="font-medium">智能排课结果</span>
        </div>
      </div>

      {/* 步骤1: 最佳实践指导 */}
      {step === 'guidance' && guidanceData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 学校概况 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                学校概况
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">学校名称</span>
                <span className="font-medium">{guidanceData.config.school}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">班级总数</span>
                <span className="font-medium">{guidanceData.config.classCount}个</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">每年级班级</span>
                <span className="font-medium">{guidanceData.config.classesPerGrade}个</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">教师总数</span>
                <span className="font-medium">{guidanceData.config.teacherCount}位</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">平均课时/教师</span>
                <span className="font-medium">{guidanceData.guidance.currentStatus.avgPeriodsPerTeacher}节/周</span>
              </div>
            </CardContent>
          </Card>

          {/* 教师需求分析 */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                教师需求分析
              </CardTitle>
              <CardDescription>
                基于课程标准和班级数量，系统自动计算各科教师需求量
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(guidanceData.teacherRequirements).map(([subject, req]) => (
                  <div key={subject} className="p-3 rounded-lg border bg-card">
                    <div className="text-sm text-muted-foreground mb-1">
                      {SUBJECT_NAMES[subject] || subject}
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-2xl font-bold">{req.available}</span>
                      <span className="text-muted-foreground">/ {req.required}人</span>
                    </div>
                    <div className="mt-2">
                      {req.gap >= 0 ? (
                        <Badge variant="secondary" className="text-green-600 bg-green-50">
                          充足 +{req.gap}
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          缺口 {req.gap}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 最佳实践建议 */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                最佳实践指导
              </CardTitle>
              <CardDescription>
                系统根据教育规范和学校实际情况，为教务主任提供专业建议
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {guidanceData.guidance.practices.map((practice, index) => (
                  <div 
                    key={index} 
                    className={`p-4 rounded-lg border ${
                      practice.type === 'warning' ? 'border-amber-200 bg-amber-50' :
                      practice.type === 'error' ? 'border-red-200 bg-red-50' :
                      practice.type === 'success' ? 'border-green-200 bg-green-50' :
                      'border-blue-200 bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {getPracticeIcon(practice.type)}
                      <div>
                        <div className="font-medium">{practice.title}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {practice.description}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 步骤2: 分工方案 */}
      {step === 'division' && divisionResult && (
        <div className="space-y-6">
          {/* 质量指标 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">任务覆盖率</div>
                <div className="text-3xl font-bold text-green-600">
                  {divisionResult.division.quality.coverage.toFixed(1)}%
                </div>
                <Progress value={divisionResult.division.quality.coverage} className="mt-2" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">工作量均衡度</div>
                <div className="text-3xl font-bold text-blue-600">
                  {divisionResult.division.quality.balanceScore.toFixed(0)}分
                </div>
                <Progress value={divisionResult.division.quality.balanceScore} className="mt-2" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">班主任匹配率</div>
                <div className="text-3xl font-bold text-amber-600">
                  {divisionResult.division.quality.headTeacherMatch.toFixed(0)}%
                </div>
                <Progress value={divisionResult.division.quality.headTeacherMatch} className="mt-2" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">跨年级比例</div>
                <div className="text-3xl font-bold text-purple-600">
                  {(divisionResult.division.quality.crossGradeRatio * 100).toFixed(0)}%
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 警告和建议 */}
          {(divisionResult.division.warnings.length > 0 || divisionResult.division.recommendations.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>系统建议</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {divisionResult.division.warnings.map((w, i) => (
                    <div key={i} className="flex items-start gap-2 text-amber-600">
                      <AlertCircle className="h-4 w-4 mt-0.5" />
                      <span>{w}</span>
                    </div>
                  ))}
                  {divisionResult.division.recommendations.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 text-blue-600">
                      <Lightbulb className="h-4 w-4 mt-0.5" />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 教师分配列表 */}
          <Card>
            <CardHeader>
              <CardTitle>教师分工方案</CardTitle>
              <CardDescription>
                共 {divisionResult.totalAssignments} 位教师已分配教学任务
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {divisionResult.division.assignments.slice(0, 10).map((teacher) => (
                  <div 
                    key={teacher.teacherId}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{teacher.teacherName}</div>
                        <div className="text-sm text-muted-foreground">{teacher.subject}</div>
                      </div>
                      {teacher.isHeadTeacher && (
                        <Badge variant="secondary">班主任</Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{teacher.totalPeriods}节/周</div>
                      <div className="text-sm text-muted-foreground">{teacher.classCount}个班级</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 步骤3: 排课结果 */}
      {step === 'schedule' && scheduleResult && (
        <div className="space-y-6">
          {/* 排课质量 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">总课时</div>
                <div className="text-3xl font-bold">{scheduleResult.schedule.totalSlots}节</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">覆盖率</div>
                <div className="text-3xl font-bold text-green-600">
                  {scheduleResult.schedule.quality.coverage.toFixed(1)}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">冲突数</div>
                <div className="text-3xl font-bold text-blue-600">
                  {scheduleResult.schedule.quality.conflictCount}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground">交替得分</div>
                <div className="text-3xl font-bold text-amber-600">
                  {scheduleResult.schedule.quality.alternationScore.toFixed(0)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 课表预览 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                课表预览
              </CardTitle>
              <CardDescription>
                显示前100条排课记录
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">班级</th>
                      <th className="text-left p-2">星期</th>
                      <th className="text-left p-2">节次</th>
                      <th className="text-left p-2">科目</th>
                      <th className="text-left p-2">教师</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scheduleResult.schedule.slots.slice(0, 20).map((slot, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="p-2">{slot.className}</td>
                        <td className="p-2">周{['一', '二', '三', '四', '五'][slot.weekDay - 1]}</td>
                        <td className="p-2">第{slot.periodIndex}节</td>
                        <td className="p-2">
                          <Badge variant="outline">{slot.subject}</Badge>
                        </td>
                        <td className="p-2">{slot.teacherName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
