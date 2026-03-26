'use client';

/**
 * 教研活动创建对话框（增强版）
 * 
 * 功能：
 * - 创建教研活动
 * - 选择教室地点（联动教室管理）
 * - 选择日期和时段（可视化时段占用）
 * - 选择参与教师（支持筛选和搜索）
 * - 自动创建教室预约（教务处直接安排，无需审核）
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2,
  MapPin,
  Calendar,
  Clock,
  Users,
  Check,
  ChevronDown,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import TeacherSelector, { type SelectedTeacher } from './TeacherSelector';
import { useTeachers, type TeacherInfo } from '@/hooks/useTeachers';

// ==================== 类型定义 ====================

interface Room {
  id: string;
  name: string;
  code: string;
  type: string;
  building: string;
  floor?: number;
  location?: string;
  capacity: number;
  facilities?: {
    projector?: boolean;
    computer?: boolean;
    microphone?: boolean;
    speaker?: boolean;
    whiteboard?: boolean;
    blackboard?: boolean;
    airConditioner?: boolean;
    wifi?: boolean;
  };
  status: string;
}

interface TimeSlot {
  id: string;
  label: string;
  start: string;
  end: string;
}

interface Booking {
  id: string;
  title: string;
  time_slots: string[];
  status: string;
}

// ==================== 配置 ====================

const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  seminar: '研讨会',
  lesson_observation: '听课评课',
  collective_prep: '集体备课',
  training: '培训学习',
  workshop: '工作坊',
  salon: '教学沙龙',
};

const TIME_SLOTS: TimeSlot[] = [
  { id: 'morning_1', label: '第1节', start: '08:00', end: '08:45' },
  { id: 'morning_2', label: '第2节', start: '08:55', end: '09:40' },
  { id: 'morning_3', label: '第3节', start: '10:00', end: '10:45' },
  { id: 'noon', label: '午休', start: '12:00', end: '14:00' },
  { id: 'afternoon_1', label: '第4节', start: '14:00', end: '14:45' },
  { id: 'afternoon_2', label: '第5节', start: '14:55', end: '15:40' },
  { id: 'afternoon_3', label: '第6节', start: '16:00', end: '16:45' },
  { id: 'evening', label: '晚上', start: '19:00', end: '21:00' },
];

const ROOM_TYPE_LABELS: Record<string, string> = {
  classroom: '普通教室',
  lab: '实验室',
  computer_room: '计算机房',
  music_room: '音乐教室',
  art_room: '美术教室',
  meeting_room: '会议室',
  lecture_hall: '报告厅',
  multi_media: '多媒体教室',
  activity_room: '活动室',
};

// ==================== 组件 ====================

interface ActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  themeId: string;
  stageId?: string;
  onSuccess?: () => void;
}

export default function ActivityDialog({ 
  open, 
  onOpenChange, 
  themeId, 
  stageId,
  onSuccess 
}: ActivityDialogProps) {
  // 状态
  const [submitting, setSubmitting] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [existingBookings, setExistingBookings] = useState<Booking[]>([]);
  const [roomPopoverOpen, setRoomPopoverOpen] = useState(false);
  
  // 教师选择状态
  const { allTeachers, loading: teachersLoading } = useTeachers();
  const [selectedTeachers, setSelectedTeachers] = useState<SelectedTeacher[]>([]);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);
  
  // 表单数据
  const [formData, setFormData] = useState({
    title: '',
    type: 'seminar',
    description: '',
    roomId: '',
    roomName: '',
    bookingDate: '',
    timeSlots: [] as string[],
  });
  
  // 加载教室列表
  useEffect(() => {
    if (open) {
      loadRooms();
    }
  }, [open]);
  
  // 当日期或教室改变时，加载预约情况
  useEffect(() => {
    if (formData.roomId && formData.bookingDate) {
      loadBookings();
    }
  }, [formData.roomId, formData.bookingDate]);
  
  const loadRooms = async () => {
    setLoadingRooms(true);
    try {
      const res = await fetch('/api/academic/rooms?status=available');
      const data = await res.json();
      
      if (data.success) {
        setRooms(data.data || []);
      }
    } catch (err) {
      console.error('加载教室失败:', err);
    } finally {
      setLoadingRooms(false);
    }
  };
  
  const loadBookings = async () => {
    setLoadingBookings(true);
    try {
      const res = await fetch(
        `/api/academic/rooms/bookings?roomId=${formData.roomId}&bookingDate=${formData.bookingDate}`
      );
      const data = await res.json();
      
      if (data.success) {
        setExistingBookings(
          (data.data || []).filter(
            (b: Booking) => !['rejected', 'cancelled'].includes(b.status)
          )
        );
      }
    } catch (err) {
      console.error('加载预约失败:', err);
    } finally {
      setLoadingBookings(false);
    }
  };
  
  // 获取已占用的时段
  const getOccupiedSlots = useCallback(() => {
    const occupied = new Set<string>();
    existingBookings.forEach(booking => {
      (booking.time_slots || []).forEach(slot => occupied.add(slot));
    });
    return occupied;
  }, [existingBookings]);
  
  // 切换时段选择
  const toggleTimeSlot = (slotId: string) => {
    const occupied = getOccupiedSlots();
    if (occupied.has(slotId)) {
      toast.error('该时段已被预约');
      return;
    }
    
    setFormData(prev => {
      const slots = [...prev.timeSlots];
      const index = slots.indexOf(slotId);
      
      if (index > -1) {
        slots.splice(index, 1);
      } else {
        slots.push(slotId);
      }
      
      // 按时段顺序排序
      slots.sort((a, b) => {
        const aIndex = TIME_SLOTS.findIndex(s => s.id === a);
        const bIndex = TIME_SLOTS.findIndex(s => s.id === b);
        return aIndex - bIndex;
      });
      
      return { ...prev, timeSlots: slots };
    });
  };
  
  // 计算时长（分钟）
  const calculateDuration = () => {
    if (formData.timeSlots.length === 0) return 0;
    
    const firstSlot = TIME_SLOTS.find(s => s.id === formData.timeSlots[0]);
    const lastSlot = TIME_SLOTS.find(s => s.id === formData.timeSlots[formData.timeSlots.length - 1]);
    
    if (!firstSlot || !lastSlot) return 0;
    
    const [startH, startM] = firstSlot.start.split(':').map(Number);
    const [endH, endM] = lastSlot.end.split(':').map(Number);
    
    return (endH * 60 + endM) - (startH * 60 + startM);
  };
  
  // 选择教室
  const handleSelectRoom = (room: Room) => {
    setFormData(prev => ({
      ...prev,
      roomId: room.id,
      roomName: room.name,
    }));
    setRoomPopoverOpen(false);
  };
  
  // 提交表单
  const handleSubmit = async () => {
    // 验证必填字段
    if (!formData.title) {
      toast.error('请输入活动名称');
      return;
    }
    
    if (!formData.bookingDate) {
      toast.error('请选择活动日期');
      return;
    }
    
    if (formData.timeSlots.length === 0) {
      toast.error('请选择活动时段');
      return;
    }
    
    setSubmitting(true);
    try {
      // 1. 创建教室预约（直接批准）
      let bookingId = null;
      if (formData.roomId) {
        const bookingRes = await fetch('/api/research/activities/booking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: formData.roomId,
            roomName: formData.roomName,
            bookingDate: formData.bookingDate,
            timeSlots: formData.timeSlots,
            title: formData.title,
            purpose: 'meeting',
            expectedAttendees: 20,
            description: formData.description,
          }),
        });
        
        const bookingData = await bookingRes.json();
        
        if (!bookingData.success) {
          toast.error(bookingData.error || '教室预约失败');
          setSubmitting(false);
          return;
        }
        
        bookingId = bookingData.data?.id;
      }
      
      // 2. 创建教研活动
      const res = await fetch('/api/research/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          themeId,
          stageId,
          title: formData.title,
          type: formData.type,
          description: formData.description,
          location: formData.roomName || '',
          scheduledAt: formData.bookingDate ? `${formData.bookingDate}T${TIME_SLOTS.find(s => s.id === formData.timeSlots[0])?.start || '08:00'}` : null,
          duration: calculateDuration(),
          participantIds: selectedTeacherIds,
          bookingId,
          roomId: formData.roomId,
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success('教研活动创建成功');
        // 重置表单
        setFormData({
          title: '',
          type: 'seminar',
          description: '',
          roomId: '',
          roomName: '',
          bookingDate: '',
          timeSlots: [],
        });
        setSelectedTeacherIds([]);
        setSelectedTeachers([]);
        setExistingBookings([]);
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(data.error || '创建失败');
      }
    } catch (err) {
      console.error('创建活动失败:', err);
      toast.error('创建失败');
    } finally {
      setSubmitting(false);
    }
  };
  
  // 关闭时重置
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setFormData({
        title: '',
        type: 'seminar',
        description: '',
        roomId: '',
        roomName: '',
        bookingDate: '',
        timeSlots: [],
      });
      setSelectedTeacherIds([]);
      setSelectedTeachers([]);
      setExistingBookings([]);
    }
    onOpenChange(open);
  };
  
  // 获取时段显示文本
  const getTimeSlotsText = () => {
    if (formData.timeSlots.length === 0) return '请选择时段';
    return formData.timeSlots.map(id => 
      TIME_SLOTS.find(s => s.id === id)?.label
    ).join('、');
  };
  
  const occupiedSlots = getOccupiedSlots();
  const selectedRoom = rooms.find(r => r.id === formData.roomId);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>创建教研活动</DialogTitle>
          <DialogDescription>
            安排教研活动，选择教室、时间和参与教师，系统将自动完成教室预约
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-5 py-4">
          {/* 基本信息 */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">1</span>
              基本信息
            </h4>
            
            <div className="grid gap-4 pl-8">
              <div className="grid gap-2">
                <Label htmlFor="title">活动名称 *</Label>
                <Input
                  id="title"
                  placeholder="输入活动名称"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>活动类型</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={v => setFormData({ ...formData, type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ACTIVITY_TYPE_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>预估时长</Label>
                  <div className="flex items-center h-10 px-3 rounded-md border border-slate-200 bg-slate-50 text-sm text-slate-600">
                    {formData.timeSlots.length > 0 ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 text-slate-400" />
                        {calculateDuration()} 分钟
                      </>
                    ) : (
                      '选择时段后自动计算'
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 时间地点 */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">2</span>
              时间地点
            </h4>
            
            <div className="grid gap-4 pl-8">
              <div className="grid grid-cols-2 gap-4">
                {/* 教室选择 */}
                <div className="grid gap-2">
                  <Label>活动地点</Label>
                  <Popover open={roomPopoverOpen} onOpenChange={setRoomPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="justify-between font-normal"
                      >
                        {formData.roomName ? (
                          <span className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-slate-400" />
                            {formData.roomName}
                          </span>
                        ) : (
                          <span className="text-slate-400">选择教室或手动输入</span>
                        )}
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align="start">
                      <Command>
                        <CommandInput placeholder="搜索教室..." />
                        <CommandList>
                          <CommandEmpty>未找到教室</CommandEmpty>
                          <CommandGroup>
                            <ScrollArea className="h-64">
                              {rooms.map(room => (
                                <CommandItem
                                  key={room.id}
                                  value={`${room.name} ${room.building}`}
                                  onSelect={() => handleSelectRoom(room)}
                                >
                                  <div className="flex flex-col gap-1 w-full">
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium">{room.name}</span>
                                      {formData.roomId === room.id && (
                                        <Check className="h-4 w-4 text-indigo-500" />
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                      <span>{room.building}</span>
                                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                                      <span>容纳 {room.capacity} 人</span>
                                      <Badge variant="outline" className="text-[10px]">
                                        {ROOM_TYPE_LABELS[room.type] || room.type}
                                      </Badge>
                                    </div>
                                  </div>
                                </CommandItem>
                              ))}
                            </ScrollArea>
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                
                {/* 日期选择 */}
                <div className="grid gap-2">
                  <Label>活动日期 *</Label>
                  <Input
                    type="date"
                    value={formData.bookingDate}
                    onChange={e => setFormData({ ...formData, bookingDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
              
              {/* 时段选择 */}
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label>活动时段 *</Label>
                  {formData.roomId && formData.bookingDate && (
                    <span className="text-xs text-slate-400">
                      {loadingBookings ? '加载中...' : `${occupiedSlots.size} 个时段已占用`}
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-4 gap-2">
                  {TIME_SLOTS.map(slot => {
                    const isOccupied = occupiedSlots.has(slot.id);
                    const isSelected = formData.timeSlots.includes(slot.id);
                    
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        disabled={isOccupied}
                        onClick={() => toggleTimeSlot(slot.id)}
                        className={cn(
                          "relative px-3 py-2.5 rounded-lg border text-sm transition-all",
                          isOccupied && "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed",
                          !isOccupied && !isSelected && "bg-white border-slate-200 hover:border-indigo-300 hover:bg-indigo-50",
                          isSelected && "bg-indigo-500 border-indigo-500 text-white"
                        )}
                      >
                        <div className="font-medium">{slot.label}</div>
                        <div className={cn(
                          "text-[10px]",
                          isSelected ? "text-indigo-100" : "text-slate-400"
                        )}>
                          {slot.start}-{slot.end}
                        </div>
                        {isOccupied && (
                          <div className="absolute inset-0 flex items-center justify-center bg-slate-100/80 rounded-lg">
                            <AlertCircle className="h-4 w-4 text-slate-400" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                
                {formData.timeSlots.length > 0 && (
                  <div className="flex items-center gap-2 p-2 bg-indigo-50 rounded-lg text-sm text-indigo-600">
                    <Clock className="h-4 w-4" />
                    <span>已选择：{getTimeSlotsText()}</span>
                    <span className="text-indigo-400">|</span>
                    <span>时长 {calculateDuration()} 分钟</span>
                  </div>
                )}
              </div>
              
              {/* 手动输入地点 */}
              {!formData.roomId && (
                <div className="grid gap-2">
                  <Label>或手动输入地点</Label>
                  <Input
                    placeholder="如：三楼会议室"
                    value={formData.roomName}
                    onChange={e => setFormData({ ...formData, roomName: e.target.value })}
                  />
                </div>
              )}
            </div>
          </div>
          
          {/* 其他信息 */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">3</span>
              其他信息
            </h4>
            
            <div className="grid gap-4 pl-8">
              <div className="grid gap-2">
                <Label>活动描述</Label>
                <Textarea
                  placeholder="描述活动内容、议程等"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          </div>
          
          {/* 参与教师 */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">3</span>
              参与教师
              {selectedTeachers.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  已选 {selectedTeachers.length} 人
                </Badge>
              )}
            </h4>
            
            <div className="pl-8">
              <TeacherSelector
                selectedIds={selectedTeacherIds}
                onChange={(ids, teachers) => {
                  setSelectedTeacherIds(ids);
                  setSelectedTeachers(teachers);
                }}
                placeholder="选择参与本次活动的教师"
                teachers={allTeachers}
                loading={teachersLoading}
              />
            </div>
          </div>
          
          {/* 其他信息 */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">4</span>
              其他信息
            </h4>
            
            <div className="grid gap-4 pl-8">
              <div className="grid gap-2">
                <Label>活动描述</Label>
                <Textarea
                  placeholder="描述活动内容、议程等"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>取消</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            创建活动
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
