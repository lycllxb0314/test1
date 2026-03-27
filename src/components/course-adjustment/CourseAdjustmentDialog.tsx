'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  User,
  BookOpen,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Search,
  Star,
} from 'lucide-react';
import { toast } from 'sonner';

// 原始课时段类型
interface OriginalSlot {
  classId: string;
  className: string;
  grade: number;
  weekDay: number;
  periodIndex: number;
  subject: string;
  teacherId: string;
  teacherName: string;
}

// 调课结果类型
interface AdjustResult {
  action: string;
  substituteEmployeeId?: string;
  substituteName?: string;
  completedAt?: string;
}

// 同步状态类型
interface SyncStatus {
  synced: boolean;
  syncedAt?: string;
  error?: string;
}

// 通知状态类型
interface NotifyStatus {
  notified: boolean;
  notifiedAt?: string;
  recipients?: string[];
}

// 调课记录类型
interface CourseAdjustment {
  id: string;
  leaveRequestId?: string;
  workflowInstanceId?: string;
  applicantId: string;
  applicantName: string;
  adjusterId?: string;
  adjusterName?: string;
  adjustType?: string;
  originalSlot?: OriginalSlot;
  adjustResult?: AdjustResult;
  reason?: string;
  reasonType?: string;
  status: string;
  // 课程信息
  grade?: number;
  classId?: string;
  className?: string;
  subject?: string;
  weekDay?: number;
  periodIndex?: number;
  periodName?: string;
  // 生效时间
  effectiveWeek?: number | string;
  effectiveWeekDate?: string;
  effectiveYear?: string;
  // 代课教师
  substituteEmployeeId?: string;
  substituteName?: string;
  // 审批信息
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  // 同步状态
  syncStatus?: SyncStatus;
  notifyStatus?: NotifyStatus;
  // 时间戳
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string;
}

// 推荐教师类型
interface RecommendedTeacher {
  id: string;
  employeeId: string;
  name: string;
  primarySubject: string;
  secondarySubjects: string[];
  currentTeachingGrades: number[];
  department?: string;
  title?: string;
  totalWeeklyHours?: number;
  usedHours: number;
  substituteCount: number;
  isSameSubject: boolean;
  isAvailable: boolean;
  score: number;
  reason: string;
}

interface CourseAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adjustment: CourseAdjustment | null;
  onSuccess?: () => void;
}

// 星期映射
const WEEK_DAY_NAMES: Record<number, string> = {
  1: '一',
  2: '二',
  3: '三',
  4: '四',
  5: '五',
};

// 年级映射
const GRADE_NAMES: Record<number, string> = {
  1: '一年级',
  2: '二年级',
  3: '三年级',
  4: '四年级',
  5: '五年级',
  6: '六年级',
};

export function CourseAdjustmentDialog({
  open,
  onOpenChange,
  adjustment,
  onSuccess,
}: CourseAdjustmentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [recommendedTeachers, setRecommendedTeachers] = useState<RecommendedTeacher[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [action, setAction] = useState<'substitute' | 'cancel'>('substitute');
  const [remark, setRemark] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');

  // 获取推荐教师
  const fetchRecommendedTeachers = useCallback(async () => {
    if (!adjustment) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        adjustmentId: adjustment.id,
        grade: String(adjustment.grade || 0),
        subject: adjustment.subject || '',
        weekDay: String(adjustment.weekDay || 0),
        periodIndex: String(adjustment.periodIndex || 0),
        effectiveWeek: String(adjustment.effectiveWeek || ''),
      });
      
      const response = await fetch(`/api/course-adjustments/recommend-teachers?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setRecommendedTeachers(data.data.recommended || []);
        // 默认选择第一个推荐的教师
        if (data.data.recommended?.length > 0) {
          setSelectedTeacherId(data.data.recommended[0].employeeId);
        }
      } else {
        toast.error(data.error || '获取推荐教师失败');
      }
    } catch (err) {
      console.error('获取推荐教师失败:', err);
      toast.error('获取推荐教师失败');
    } finally {
      setLoading(false);
    }
  }, [adjustment]);

  useEffect(() => {
    if (open && adjustment) {
      fetchRecommendedTeachers();
      setRemark('');
      setAction('substitute');
      setSearchKeyword('');
    }
  }, [open, adjustment, fetchRecommendedTeachers]);

  // 提交调课处理
  const handleSubmit = async () => {
    if (!adjustment) return;
    
    if (action === 'substitute' && !selectedTeacherId) {
      toast.error('请选择代课教师');
      return;
    }
    
    setSubmitting(true);
    try {
      const selectedTeacher = recommendedTeachers.find(t => t.employeeId === selectedTeacherId);
      
      const response = await fetch('/api/course-adjustments/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adjustmentId: adjustment.id,
          action,
          substituteEmployeeId: action === 'substitute' ? selectedTeacherId : undefined,
          substituteName: action === 'substitute' ? selectedTeacher?.name : undefined,
          remark,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(action === 'substitute' ? '已安排代课教师' : '已取消该课程');
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(data.error || '处理失败');
      }
    } catch (err) {
      console.error('提交调课处理失败:', err);
      toast.error('提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 过滤教师列表
  const filteredTeachers = recommendedTeachers.filter(teacher => {
    if (!searchKeyword) return true;
    return teacher.name.includes(searchKeyword) ||
           teacher.primarySubject.includes(searchKeyword) ||
           teacher.department?.includes(searchKeyword);
  });

  if (!adjustment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            调课处理
          </DialogTitle>
          <DialogDescription>
            为请假教师安排代课或取消课程
          </DialogDescription>
        </DialogHeader>

        {/* 调课详情 */}
        <Card className="bg-muted/50">
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">请假教师：</span>
                <span className="font-medium">{adjustment.applicantName}</span>
              </div>
              <div>
                <span className="text-muted-foreground">年级班级：</span>
                <span className="font-medium">
                  {adjustment.grade ? (GRADE_NAMES[adjustment.grade] || `${adjustment.grade}年级`) : '未知年级'}
                  {adjustment.className || '未知班级'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">科目：</span>
                <span className="font-medium">{adjustment.subject || '未知'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">时间：</span>
                <span className="font-medium">
                  第{adjustment.effectiveWeek || '?'}周 
                  {adjustment.weekDay ? `周${WEEK_DAY_NAMES[adjustment.weekDay]}` : '未知'}
                  {adjustment.periodIndex !== undefined ? ` 第${adjustment.periodIndex + 1}节` : ''}
                </span>
              </div>
              {adjustment.reason && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">请假原因：</span>
                  <span>{adjustment.reason}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 处理方式选择 */}
        <div className="space-y-4">
          <Label>处理方式</Label>
          <RadioGroup
            value={action}
            onValueChange={(v) => setAction(v as 'substitute' | 'cancel')}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="substitute" id="substitute" />
              <Label htmlFor="substitute" className="cursor-pointer">
                安排代课教师
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="cancel" id="cancel" />
              <Label htmlFor="cancel" className="cursor-pointer">
                取消课程
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* 代课教师选择 */}
        {action === 'substitute' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>选择代课教师</Label>
              <div className="relative w-48">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索教师..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span className="text-muted-foreground">正在分析可用教师...</span>
              </div>
            ) : filteredTeachers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>暂无可用代课教师</p>
                <p className="text-sm">该年级所有教师在该时段都有课</p>
              </div>
            ) : (
              <RadioGroup
                value={selectedTeacherId}
                onValueChange={setSelectedTeacherId}
                className="space-y-3"
              >
                {filteredTeachers.map((teacher) => (
                  <div
                    key={teacher.employeeId}
                    className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                      selectedTeacherId === teacher.employeeId
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <RadioGroupItem value={teacher.employeeId} id={teacher.employeeId} />
                    <Label
                      htmlFor={teacher.employeeId}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{teacher.name}</span>
                            {teacher.isSameSubject && (
                              <Badge variant="secondary" className="text-xs">
                                <Star className="h-3 w-3 mr-1" />
                                同学科
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {teacher.primarySubject}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span>{teacher.department}</span>
                            <span>{teacher.title}</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              已排{teacher.usedHours}节
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-sm">
                            {teacher.isAvailable ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span className={teacher.isAvailable ? 'text-green-600' : 'text-red-500'}>
                              {teacher.reason}
                            </span>
                          </div>
                          {teacher.isAvailable && (
                            <div className="text-xs text-muted-foreground mt-1">
                              推荐指数: {teacher.score}分
                            </div>
                          )}
                        </div>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}
          </div>
        )}

        {/* 备注 */}
        <div className="space-y-2">
          <Label>备注（可选）</Label>
          <Textarea
            placeholder="请输入备注信息..."
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            rows={3}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || (action === 'substitute' && !selectedTeacherId)}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                处理中...
              </>
            ) : action === 'substitute' ? (
              '确认安排代课'
            ) : (
              '确认取消课程'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
