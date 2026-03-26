'use client';

/**
 * 教师选择器组件
 * 
 * 功能：
 * - 支持按年级筛选教师
 * - 支持按学科筛选教师
 * - 支持搜索教师姓名
 * - 支持多选教师
 * - 显示已选教师列表
 */

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, Search, User, ChevronDown, ChevronUp } from 'lucide-react';
import { useTeachers, type TeacherInfo } from '@/hooks/useTeachers';
import { cn } from '@/lib/utils';

// ==================== 常量定义 ====================

/** 年级选项 */
const GRADE_OPTIONS = [
  { value: 'all', label: '全部年级' },
  { value: '1', label: '一年级' },
  { value: '2', label: '二年级' },
  { value: '3', label: '三年级' },
  { value: '4', label: '四年级' },
  { value: '5', label: '五年级' },
  { value: '6', label: '六年级' },
];

/** 学科选项 */
const SUBJECT_OPTIONS = [
  { value: 'all', label: '全部学科' },
  { value: '语文', label: '语文' },
  { value: '数学', label: '数学' },
  { value: '英语', label: '英语' },
  { value: '科学', label: '科学' },
  { value: '道德与法治', label: '道德与法治' },
  { value: '体育', label: '体育' },
  { value: '音乐', label: '音乐' },
  { value: '美术', label: '美术' },
  { value: '信息技术', label: '信息技术' },
  { value: '综合实践', label: '综合实践' },
];

// ==================== 类型定义 ====================

export interface SelectedTeacher {
  id: string;
  name: string;
  subject: string;
  avatar?: string;
}

interface TeacherSelectorProps {
  /** 已选教师ID列表 */
  selectedIds: string[];
  /** 选择变化回调 */
  onChange: (selectedIds: string[], selectedTeachers: SelectedTeacher[]) => void;
  /** 最大可选数量 */
  maxSelect?: number;
  /** 是否禁用 */
  disabled?: boolean;
  /** 占位符 */
  placeholder?: string;
  /** 预设学科筛选（教研主题的学科） */
  defaultSubject?: string;
  /** 预设年级筛选 */
  defaultGrade?: string;
  /** 容器样式 */
  className?: string;
  /** 外部传入的教师数据（优先使用） */
  teachers?: TeacherInfo[];
  /** 外部传入的加载状态 */
  loading?: boolean;
}

// ==================== 组件实现 ====================

export default function TeacherSelector({
  selectedIds,
  onChange,
  maxSelect,
  disabled = false,
  placeholder = '选择参与教师',
  defaultSubject = 'all',
  defaultGrade = 'all',
  className,
  teachers: externalTeachers,
  loading: externalLoading,
}: TeacherSelectorProps) {
  // === 状态 ===
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState(defaultGrade);
  const [subjectFilter, setSubjectFilter] = useState(defaultSubject);
  const [showFilters, setShowFilters] = useState(false);
  
  // === 获取教师数据（支持外部传入或内部获取）===
  const { allTeachers: internalTeachers, loading: internalLoading, refetch } = useTeachers();
  
  // 优先使用外部传入的数据
  const allTeachers = externalTeachers ?? internalTeachers;
  const loading = externalLoading ?? internalLoading;
  
  // === 筛选后的教师列表 ===
  const filteredTeachers = useMemo(() => {
    let result = allTeachers;
    
    // 按年级筛选
    if (gradeFilter !== 'all') {
      const grade = parseInt(gradeFilter);
      result = result.filter(t => t.teachableGrades?.includes(grade));
    }
    
    // 按学科筛选
    if (subjectFilter !== 'all') {
      result = result.filter(t => 
        t.subject === subjectFilter || 
        t.teachableSubjects?.includes(subjectFilter)
      );
    }
    
    // 按姓名搜索
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.name.toLowerCase().includes(query) ||
        t.department?.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [allTeachers, gradeFilter, subjectFilter, searchQuery]);
  
  // === 已选教师信息 ===
  const selectedTeachers = useMemo(() => {
    return allTeachers
      .filter(t => selectedIds.includes(t.id))
      .map(t => ({
        id: t.id,
        name: t.name,
        subject: t.subject,
        avatar: t.avatar,
      }));
  }, [allTeachers, selectedIds]);
  
  // === 处理教师选择 ===
  const handleToggleTeacher = (teacherId: string) => {
    const isSelected = selectedIds.includes(teacherId);
    
    if (isSelected) {
      // 取消选择
      const newIds = selectedIds.filter(id => id !== teacherId);
      const newTeachers = selectedTeachers.filter(t => t.id !== teacherId);
      onChange(newIds, newTeachers);
    } else {
      // 添加选择
      if (maxSelect && selectedIds.length >= maxSelect) {
        return; // 已达最大选择数量
      }
      const teacher = allTeachers.find(t => t.id === teacherId);
      if (teacher) {
        const newIds = [...selectedIds, teacherId];
        const newTeachers = [
          ...selectedTeachers,
          {
            id: teacher.id,
            name: teacher.name,
            subject: teacher.subject,
            avatar: teacher.avatar,
          },
        ];
        onChange(newIds, newTeachers);
      }
    }
  };
  
  // === 移除已选教师 ===
  const handleRemoveTeacher = (teacherId: string) => {
    const newIds = selectedIds.filter(id => id !== teacherId);
    const newTeachers = selectedTeachers.filter(t => t.id !== teacherId);
    onChange(newIds, newTeachers);
  };
  
  // === 清空选择 ===
  const handleClearAll = () => {
    onChange([], []);
  };
  
  // === 获取教师头像显示 ===
  const getAvatarFallback = (teacher: TeacherInfo) => {
    return teacher.name.slice(0, 1);
  };
  
  return (
    <div className={cn('space-y-3', className)}>
      {/* 已选教师显示 */}
      {selectedTeachers.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">
              已选择 {selectedTeachers.length} 位教师
              {maxSelect && ` / 最多 ${maxSelect} 位`}
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleClearAll}
              disabled={disabled}
              className="h-7 text-xs text-slate-400 hover:text-slate-600"
            >
              清空
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedTeachers.map(teacher => (
              <Badge 
                key={teacher.id} 
                variant="secondary"
                className="pl-2 pr-1 py-1 gap-1.5"
              >
                <span>{teacher.name}</span>
                <span className="text-slate-400">({teacher.subject})</span>
                <button
                  onClick={() => handleRemoveTeacher(teacher.id)}
                  disabled={disabled}
                  className="ml-1 rounded-full hover:bg-slate-200 p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      {/* 筛选区域 */}
      <div className="space-y-2">
        {/* 搜索框 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索教师姓名..."
            disabled={disabled}
            className="pl-9"
          />
        </div>
        
        {/* 筛选器展开/收起 */}
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="w-full justify-between text-slate-500"
          >
            <span>高级筛选</span>
            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          
          {showFilters && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              <Select value={gradeFilter} onValueChange={setGradeFilter} disabled={disabled}>
                <SelectTrigger>
                  <SelectValue placeholder="选择年级" />
                </SelectTrigger>
                <SelectContent>
                  {GRADE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={subjectFilter} onValueChange={setSubjectFilter} disabled={disabled}>
                <SelectTrigger>
                  <SelectValue placeholder="选择学科" />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECT_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>
      
      {/* 教师列表 */}
      <div className="border rounded-lg">
        <ScrollArea className="h-[240px]">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-slate-400 text-sm">加载中...</div>
            </div>
          ) : filteredTeachers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-8">
              <User className="h-8 w-8 text-slate-300 mb-2" />
              <p className="text-slate-400 text-sm">没有找到符合条件的教师</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredTeachers.map(teacher => {
                const isSelected = selectedIds.includes(teacher.id);
                const isDisabled = Boolean(disabled || (!isSelected && maxSelect && selectedIds.length >= maxSelect));
                
                const handleSelect = () => {
                  if (isDisabled) return;
                  handleToggleTeacher(teacher.id);
                };
                
                return (
                  <div
                    key={teacher.id}
                    onClick={handleSelect}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 transition-colors',
                      isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-slate-50',
                      isSelected && 'bg-primary/5'
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      disabled={isDisabled}
                      onCheckedChange={handleSelect}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={teacher.avatar} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {getAvatarFallback(teacher)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900 truncate">{teacher.name}</span>
                        {teacher.primaryRole === 'head_teacher' && (
                          <Badge variant="outline" className="text-xs px-1.5 py-0 h-5">
                            班主任
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {teacher.subject} · {teacher.department}
                      </div>
                    </div>
                    {teacher.teachableGrades && teacher.teachableGrades.length > 0 && (
                      <div className="text-xs text-slate-400">
                        {teacher.teachableGrades.slice(0, 3).map(g => `${g}年级`).join('、')}
                        {teacher.teachableGrades.length > 3 && '...'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>
      
      {/* 统计信息 */}
      <div className="text-xs text-slate-400 text-center">
        共 {filteredTeachers.length} 位教师
        {searchQuery && ` (搜索: "${searchQuery}")`}
        {gradeFilter !== 'all' && ` · ${GRADE_OPTIONS.find(g => g.value === gradeFilter)?.label}`}
        {subjectFilter !== 'all' && ` · ${subjectFilter}`}
      </div>
    </div>
  );
}
