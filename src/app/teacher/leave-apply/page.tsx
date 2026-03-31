'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Calendar,
  FileText,
  Upload,
  Users,
  Clock,
  AlertCircle,
  CheckCircle,
  Send,
  ArrowLeft,
  Plus,
  X,
  UserCheck,
  CalendarClock,
  Loader2,
  Info,
} from 'lucide-react';
import { FILE_TYPE_CONFIGS } from '@/lib/file-upload-config';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getSubjectColor } from '@/lib/subject-colors';
import type { 
  LeaveType, 
  LeaveRequest, 
  AffectedSlot, 
  ApproverSelection,
  SignType,
  Attachment,
} from '@/types/leave-adjust';

// ==================== 类型定义 ====================

interface WeeklySlot {
  slotId: string;
  classId: string;
  className: string;
  grade: number;
  weekDay: number;
  periodIndex: number;
  subject: string;
  teacherId: string;
  teacherName: string;
  employeeId: string;
  isAdjusted: boolean;
  actualTeacherName: string;
  actualEmployeeId: string;
}

interface Approver {
  employeeId: string;
  name: string;
  role: string;
  roleName: string;
  department?: string;
  position?: string;
}

// 请假类型配置
const LEAVE_TYPES: { value: LeaveType; label: string; requireAttachment: boolean; desc: string }[] = [
  { value: '病假', label: '病假', requireAttachment: true, desc: '需上传医院证明' },
  { value: '事假', label: '事假', requireAttachment: false, desc: '因私事请假' },
  { value: '公假', label: '公假', requireAttachment: true, desc: '需上传公派任务通知' },
  { value: '婚假', label: '婚假', requireAttachment: true, desc: '需上传结婚证' },
  { value: '产假', label: '产假', requireAttachment: true, desc: '需上传医院证明' },
  { value: '丧假', label: '丧假', requireAttachment: false, desc: '直系亲属去世' },
];

const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五'];
const PERIODS = ['第1节', '第2节', '第3节', '第4节', '第5节', '第6节'];

// ==================== 主组件 ====================

export default function LeaveApplyPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  // === 表单状态 ===
  const [leaveType, setLeaveType] = useState<LeaveType | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [duration, setDuration] = useState(1);
  const [reason, setReason] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [needAdjustment, setNeedAdjustment] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState<AffectedSlot[]>([]);
  const [approvers, setApprovers] = useState<ApproverSelection[]>([]);
  const [signType, setSignType] = useState<SignType>('countersign'); // 签批方式：会签/或签
  
  // === 数据状态 ===
  const [weeklySlots, setWeeklySlots] = useState<WeeklySlot[]>([]);
  const [availableApprovers, setAvailableApprovers] = useState<Approver[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // === 计算属性 ===
  const durationDays = startDate && endDate 
    ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
    : 1;
  
  const selectedLeaveType = LEAVE_TYPES.find(t => t.value === leaveType);
  
  // === 数据加载 ===
  useEffect(() => {
    if (user?.employeeId) {
      loadWeeklySlots();
      loadApprovers();
    }
  }, [user]);
  
  useEffect(() => {
    // 自动计算时长
    if (startDate && endDate) {
      setDuration(durationDays);
    }
  }, [startDate, endDate, durationDays]);
  
  // 同步签批方式到已选审批人
  useEffect(() => {
    if (approvers.length > 0) {
      setApprovers(prev => prev.map(a => ({ ...a, signType })));
    }
  }, [signType]);
  
  // 加载本周课表
  const loadWeeklySlots = async () => {
    setLoading(true);
    try {
      const weekStart = getWeekMonday();
      const res = await fetch(`/api/schedule/weekly?employeeId=${user?.employeeId}&weekStartDate=${weekStart}`, {
        credentials: 'include',
      });
      const result = await res.json();
      
      if (result.success) {
        setWeeklySlots(result.data?.slots || []);
      }
    } catch (err) {
      console.error('加载课表失败:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // 加载审批人
  const loadApprovers = async () => {
    try {
      const res = await fetch('/api/users/approvers', {
        credentials: 'include',
      });
      const result = await res.json();
      
      if (result.success) {
        setAvailableApprovers(result.data || []);
      }
    } catch (err) {
      console.error('加载审批人失败:', err);
    }
  };
  
  // === 课程选择 ===
  const toggleSlot = (slot: WeeklySlot) => {
    const affected: AffectedSlot = {
      slotId: slot.slotId,
      weekDay: slot.weekDay,
      periodIndex: slot.periodIndex,
      classId: slot.classId,
      className: slot.className,
      subject: slot.subject,
      grade: slot.grade,
    };
    
    setSelectedSlots(prev => {
      const exists = prev.find(s => s.slotId === slot.slotId);
      if (exists) {
        return prev.filter(s => s.slotId !== slot.slotId);
      }
      return [...prev, affected];
    });
  };
  
  const isSlotSelected = (slotId: string) => {
    return selectedSlots.some(s => s.slotId === slotId);
  };
  
  // === 审批人选择 ===
  const toggleApprover = (approver: Approver, signType: SignType) => {
    setApprovers(prev => {
      const exists = prev.find(a => a.employeeId === approver.employeeId);
      if (exists) {
        return prev.filter(a => a.employeeId !== approver.employeeId);
      }
      return [...prev, {
        role: approver.role,
        employeeId: approver.employeeId,
        userName: approver.name,
        signType,
      }];
    });
  };
  
  const isApproverSelected = (employeeId: string) => {
    return approvers.some(a => a.employeeId === employeeId);
  };
  
  // === 文件上传 ===
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    // TODO: 实际上传到对象存储
    for (const file of Array.from(files)) {
      // 模拟上传
      const attachment: Attachment = {
        name: file.name,
        url: URL.createObjectURL(file), // 临时 URL
        size: file.size,
        type: file.type,
      };
      setAttachments(prev => [...prev, attachment]);
    }
    
    toast.success(`已添加 ${files.length} 个附件`);
  };
  
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };
  
  // === 提交申请 ===
  const handleSubmit = async () => {
    // 验证
    if (!leaveType) {
      toast.error('请选择请假类型');
      return;
    }
    if (!startDate || !endDate) {
      toast.error('请选择请假日期');
      return;
    }
    if (!reason.trim()) {
      toast.error('请填写请假原因');
      return;
    }
    if (selectedLeaveType?.requireAttachment && attachments.length === 0) {
      toast.error(`请上传${selectedLeaveType.label}相关证明`);
      return;
    }
    if (needAdjustment && selectedSlots.length === 0) {
      toast.error('请选择需要调课的课程');
      return;
    }
    if (approvers.length === 0) {
      toast.error('请选择审批人');
      return;
    }
    
    setSubmitting(true);
    try {
      const response = await fetch('/api/leave-requests-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: leaveType,
          startDate,
          endDate,
          duration,
          durationUnit: 'day',
          reason,
          attachments,
          needAdjustment,
          affectedSlots: selectedSlots,
          approverSelection: approvers,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('请假申请已提交');
        router.push('/teacher/leave');
      } else {
        toast.error(result.error || '提交失败');
      }
    } catch (err) {
      console.error('提交失败:', err);
      toast.error('提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };
  
  // === 渲染 ===
  return (
    <div className="container mx-auto py-6 space-y-6 max-w-4xl">
      {/* 页面标题 */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          返回
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            请假申请
          </h1>
          <p className="text-muted-foreground mt-1">
            填写请假信息，选择审批人提交审批
          </p>
        </div>
      </div>
      
      {/* 表单内容 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：基本信息 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 请假类型和日期 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">请假信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 请假类型 */}
              <div className="space-y-2">
                <Label>请假类型 <span className="text-red-500">*</span></Label>
                <RadioGroup 
                  value={leaveType} 
                  onValueChange={(v) => setLeaveType(v as LeaveType)}
                  className="grid grid-cols-3 gap-2"
                >
                  {LEAVE_TYPES.map(type => (
                    <div key={type.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={type.value} id={type.value} />
                      <Label htmlFor={type.value} className="cursor-pointer">
                        {type.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                {selectedLeaveType && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    {selectedLeaveType.desc}
                    {selectedLeaveType.requireAttachment && (
                      <Badge variant="outline" className="text-xs ml-1">需附件</Badge>
                    )}
                  </p>
                )}
              </div>
              
              {/* 日期选择 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>开始日期 <span className="text-red-500">*</span></Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>结束日期 <span className="text-red-500">*</span></Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                  />
                </div>
              </div>
              
              {/* 时长显示 */}
              {startDate && endDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>共 <strong>{durationDays}</strong> 天</span>
                </div>
              )}
              
              {/* 请假原因 */}
              <div className="space-y-2">
                <Label>请假原因 <span className="text-red-500">*</span></Label>
                <Textarea
                  placeholder="请详细说明请假原因..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                />
              </div>
              
              {/* 附件上传 */}
              <div className="space-y-2">
                <Label>
                  附件
                  {selectedLeaveType?.requireAttachment && (
                    <span className="text-red-500"> *</span>
                  )}
                </Label>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <label className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      上传附件
                      <input
                        type="file"
                        className="hidden"
                        multiple
                        accept={FILE_TYPE_CONFIGS['image-document'].accept}
                        onChange={handleFileUpload}
                      />
                    </label>
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {FILE_TYPE_CONFIGS['image-document'].hint}
                  </span>
                </div>
                
                {/* 已上传附件 */}
                {attachments.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm">{file.name}</span>
                          {file.size && (
                            <span className="text-xs text-muted-foreground">
                              ({Math.round(file.size / 1024)}KB)
                            </span>
                          )}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => removeAttachment(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* 调课选择 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">调课安排</CardTitle>
                  <CardDescription>
                    选择请假期间需要调课的课程
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="need-adjustment"
                    checked={needAdjustment}
                    onCheckedChange={(checked) => setNeedAdjustment(!!checked)}
                  />
                  <Label htmlFor="need-adjustment" className="cursor-pointer">
                    需要调课
                  </Label>
                </div>
              </div>
            </CardHeader>
            {needAdjustment && (
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    加载课表...
                  </div>
                ) : weeklySlots.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    暂无课程安排
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* 课表网格 */}
                    <div className="bg-white rounded-lg border overflow-hidden">
                      <div className="p-2">
                        <div className="grid grid-cols-6 gap-1">
                          {/* 表头 */}
                          <div className="h-8"></div>
                          {WEEKDAYS.map((day) => (
                            <div key={day} className="h-8 flex items-center justify-center text-sm font-bold text-stone-600 bg-stone-100 rounded">
                              {day}
                            </div>
                          ))}
                          
                          {/* 课程格子 */}
                          {[0, 1, 2, 3, 4, 5].map((periodIdx) => (
                            <div key={periodIdx} className="contents">
                              <div className="h-12 flex items-center justify-center text-sm font-medium text-stone-500">
                                {periodIdx + 1}
                              </div>
                              {WEEKDAYS.map((_, dayIdx) => {
                                const slot = weeklySlots.find(
                                  s => s.weekDay === dayIdx + 1 && s.periodIndex === periodIdx
                                );
                                const isSelected = slot ? isSlotSelected(slot.slotId) : false;
                                const colors = slot ? getSubjectColor(slot.subject) : null;
                                
                                return (
                                  <div
                                    key={`${dayIdx}-${periodIdx}`}
                                    onClick={() => slot && toggleSlot(slot)}
                                    className={cn(
                                      "h-12 rounded transition-all cursor-pointer flex flex-col items-center justify-center",
                                      slot 
                                        ? isSelected
                                          ? "ring-2 ring-primary ring-offset-1"
                                          : "hover:ring-1 hover:ring-stone-300"
                                        : "bg-stone-50 border border-dashed border-stone-200 cursor-default",
                                      slot && !isSelected && `${colors?.bg} ${colors?.border} border`
                                    )}
                                  >
                                    {slot ? (
                                      <>
                                        <span className={cn("text-xs font-bold", colors?.text)}>
                                          {slot.subject}
                                        </span>
                                        <span className="text-[10px] text-stone-500 truncate max-w-full">
                                          {slot.className}
                                        </span>
                                        {isSelected && (
                                          <CheckCircle className="absolute top-0.5 right-0.5 h-3 w-3 text-primary" />
                                        )}
                                      </>
                                    ) : (
                                      <span className="text-xs text-stone-300">-</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* 已选课程 */}
                    {selectedSlots.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm">已选择 {selectedSlots.length} 节课</Label>
                        <div className="flex flex-wrap gap-2">
                          {selectedSlots.map((slot, idx) => {
                            const colors = getSubjectColor(slot.subject);
                            return (
                              <Badge key={idx} className={`${colors.bg} ${colors.text}`}>
                                {WEEKDAYS[slot.weekDay - 1]}第{slot.periodIndex + 1}节 {slot.className}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
          
          {/* 审批人选择 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                审批人选择 <span className="text-red-500">*</span>
              </CardTitle>
              <CardDescription>
                选择审批人并指定签批方式
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* 签批方式选择 */}
              <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                <Label className="text-sm font-medium mb-2 block">签批方式</Label>
                <RadioGroup 
                  value={signType} 
                  onValueChange={(v) => setSignType(v as SignType)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="countersign" id="countersign" />
                    <Label htmlFor="countersign" className="cursor-pointer">
                      <span className="font-medium">会签</span>
                      <span className="text-xs text-muted-foreground ml-1">（所有审批人都需同意）</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="parallel" id="parallel" />
                    <Label htmlFor="parallel" className="cursor-pointer">
                      <span className="font-medium">或签</span>
                      <span className="text-xs text-muted-foreground ml-1">（任一审批人同意即可）</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              
              {availableApprovers.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  暂无可用审批人
                </div>
              ) : (
                <div className="space-y-3">
                  {availableApprovers.map((approver) => {
                    const isSelected = isApproverSelected(approver.employeeId);
                    return (
                      <div
                        key={approver.employeeId}
                        onClick={() => toggleApprover(approver, signType)}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all",
                          isSelected 
                            ? "border-primary bg-primary/5" 
                            : "border-stone-200 hover:border-stone-300"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                            isSelected ? "bg-primary text-white" : "bg-stone-100 text-stone-600"
                          )}>
                            {approver.name.slice(0, 1)}
                          </div>
                          <div>
                            <div className="font-medium">{approver.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {approver.roleName}
                              {approver.department && ` · ${approver.department}`}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isSelected && (
                            <Badge variant="secondary" className="text-xs">
                              {signType === 'countersign' ? '会签' : '或签'}
                            </Badge>
                          )}
                          <div className={cn(
                            "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                            isSelected ? "border-primary bg-primary" : "border-stone-300"
                          )}>
                            {isSelected && <CheckCircle className="h-3 w-3 text-white" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* 已选审批人 */}
              {approvers.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <Label className="text-sm">审批流程</Label>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {approvers.map((approver, idx) => (
                      <React.Fragment key={approver.employeeId}>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <UserCheck className="h-3 w-3" />
                          {approver.userName}
                        </Badge>
                        {idx < approvers.length - 1 && (
                          <ArrowLeft className="h-4 w-4 text-muted-foreground rotate-180" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    * 签批方式：{signType === 'countersign' ? '会签（所有审批人都需同意）' : '或签（任一审批人同意即可）'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* 右侧：摘要和提交 - 使用 sticky 固定 */}
        <div className="lg:self-start">
          <div className="lg:sticky lg:top-6 space-y-6">
            <Card>
            <CardHeader>
              <CardTitle className="text-base">申请摘要</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">申请人</span>
                <span className="font-medium">{user?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">请假类型</span>
                <span className="font-medium">{leaveType || '-'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">请假时长</span>
                <span className="font-medium">{durationDays} 天</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">调课节数</span>
                <span className="font-medium">
                  {needAdjustment ? `${selectedSlots.length} 节` : '无需调课'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">审批人</span>
                <span className="font-medium">
                  {approvers.length > 0 ? `${approvers.length} 人` : '-'}
                </span>
              </div>
              {approvers.length > 1 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">签批方式</span>
                  <span className="font-medium">
                    {signType === 'countersign' ? '会签' : '或签'}
                  </span>
                </div>
              )}
              
              <Separator />
              
              {/* 提交按钮 */}
              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    提交中...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    提交申请
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
          
          {/* 流程说明 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">审批流程</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">1</div>
                  <div>
                    <div className="font-medium">提交申请</div>
                    <div className="text-muted-foreground">填写信息并选择审批人</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center text-xs font-bold shrink-0">2</div>
                  <div>
                    <div className="font-medium">领导审批</div>
                    <div className="text-muted-foreground">校长室领导审批通过</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold shrink-0">3</div>
                  <div>
                    <div className="font-medium">年段长调课</div>
                    <div className="text-muted-foreground">安排代课教师</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold shrink-0">4</div>
                  <div>
                    <div className="font-medium">完成</div>
                    <div className="text-muted-foreground">更新课表和工作量</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// 辅助函数：获取本周周一
function getWeekMonday(date?: Date): string {
  const d = date || new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0];
}
