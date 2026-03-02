'use client';

/**
 * 课表编辑弹窗组件
 * 
 * 功能：
 * - 显示当前课时的详细信息
 * - 修改科目
 * - 选择教师（带筛选和搜索）
 */

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, User, BookOpen, Loader2 } from 'lucide-react';

// 科目列表
const SUBJECTS = [
  '语文', '数学', '英语', '道德与法治', '科学',
  '体育', '音乐', '美术', '劳动', '综合实践',
  '信息技术', '心育', '书法', '校本', '班会',
];

// 教师类型
interface Teacher {
  id: string;
  name: string;
  primarySubject: string;
  secondarySubjects: string[];
  teachableGrades: number[];
  weeklyHours: number;
  currentHours: number;
}

// 课表格子数据类型
interface SlotData {
  id: string;
  classId: string;
  className: string;
  grade: number;
  weekDay: number;
  periodIndex: number;
  periodName: string;
  subject: string;
  teacherId: string;
  teacherName: string;
}

interface ScheduleEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slot: SlotData | null;
  teachers: Teacher[];
  onSave: (slotId: string, subject: string, teacherId: string, teacherName: string) => Promise<void>;
}

export function ScheduleEditDialog({
  open,
  onOpenChange,
  slot,
  teachers,
  onSave,
}: ScheduleEditDialogProps) {
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [isSaving, setIsSaving] = useState(false);

  // 当 slot 变化时，初始化表单
  useEffect(() => {
    if (slot) {
      setSelectedSubject(slot.subject);
      setSelectedTeacherId(slot.teacherId);
      setSearchQuery('');
      setFilterSubject(slot.subject || 'all');
    }
  }, [slot]);

  // 筛选和搜索教师
  const filteredTeachers = useMemo(() => {
    if (!teachers) return [];
    
    return teachers.filter(teacher => {
      // 搜索过滤
      if (searchQuery && !teacher.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // 科目过滤
      if (filterSubject !== 'all') {
        const canTeach = 
          teacher.primarySubject === filterSubject || 
          teacher.secondarySubjects?.includes(filterSubject);
        if (!canTeach) return false;
      }
      
      // 年级过滤（教师只能教其可教年级范围内的班级）
      if (slot && !teacher.teachableGrades?.includes(slot.grade)) {
        return false;
      }
      
      return true;
    });
  }, [teachers, searchQuery, filterSubject, slot]);

  // 获取选中的教师名称
  const selectedTeacher = teachers.find(t => t.id === selectedTeacherId);

  // 处理保存
  const handleSave = async () => {
    if (!slot || !selectedSubject || !selectedTeacherId) return;
    
    setIsSaving(true);
    try {
      await onSave(slot.id, selectedSubject, selectedTeacherId, selectedTeacher?.name || '');
      onOpenChange(false);
    } catch (error) {
      console.error('保存失败:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!slot) return null;

  const weekDayNames = ['', '周一', '周二', '周三', '周四', '周五'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            编辑课表
          </DialogTitle>
        </DialogHeader>
        
        {/* 当前课程信息 */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">班级</span>
            <span className="font-medium">{slot.className}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">时间</span>
            <span className="font-medium">
              {weekDayNames[slot.weekDay]} {slot.periodName}
            </span>
          </div>
        </div>

        {/* 科目选择 */}
        <div className="space-y-2">
          <Label>科目</Label>
          <Select value={selectedSubject} onValueChange={(value) => {
            setSelectedSubject(value);
            // 切换科目时，自动设置筛选
            setFilterSubject(value);
            setSelectedTeacherId('');
          }}>
            <SelectTrigger>
              <SelectValue placeholder="选择科目" />
            </SelectTrigger>
            <SelectContent>
              {SUBJECTS.map(subject => (
                <SelectItem key={subject} value={subject}>
                  {subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 教师选择 */}
        <div className="space-y-2">
          <Label>教师</Label>
          
          {/* 搜索和筛选 */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索教师姓名..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="筛选科目" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部科目</SelectItem>
                {SUBJECTS.map(subject => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* 教师列表 */}
          <ScrollArea className="h-[200px] border rounded-md">
            <div className="p-2 space-y-1">
              {filteredTeachers.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  没有找到符合条件的教师
                </div>
              ) : (
                filteredTeachers.map(teacher => (
                  <div
                    key={teacher.id}
                    className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
                      selectedTeacherId === teacher.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => setSelectedTeacherId(teacher.id)}
                  >
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="font-medium">{teacher.name}</span>
                      <Badge 
                        variant="outline" 
                        className={selectedTeacherId === teacher.id ? 'border-primary-foreground/30' : ''}
                      >
                        {teacher.primarySubject}
                      </Badge>
                    </div>
                    <span className="text-xs">
                      {teacher.currentHours}/{teacher.weeklyHours}节
                    </span>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
          
          {/* 已选教师 */}
          {selectedTeacher && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>已选:</span>
              <Badge variant="secondary">
                {selectedTeacher.name} ({selectedTeacher.primarySubject})
              </Badge>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!selectedSubject || !selectedTeacherId || isSaving}
          >
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            保存修改
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
