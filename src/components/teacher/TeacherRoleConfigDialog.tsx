/**
 * 教师角色配置对话框
 * 
 * 支持配置：
 * - 主要角色（班主任/科任教师/技能课教师等）
 * - 兼任职务（年段长/教务主任/少先队大队辅导员等，可多选）
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  UserCog,
  Save,
  Loader2,
  AlertCircle,
  Info,
} from 'lucide-react';
import {
  TeacherRole,
  AdministrativeRole,
  TEACHER_ROLE_LABELS,
  ADMINISTRATIVE_ROLE_LABELS,
  TEACHER_ROLE_COLORS,
} from '@/hooks/useTeachers';

/** 配置数据 */
export interface TeacherRoleConfig {
  teacherId: string;
  teacherName: string;
  primaryRole: TeacherRole;
  additionalRoles: AdministrativeRole[];
}

/** 组件属性 */
interface TeacherRoleConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: TeacherRoleConfig | null;
  onSave: (config: TeacherRoleConfig) => Promise<void>;
}

// 主要角色选项（领导层 + 教师本职角色）
const PRIMARY_ROLE_OPTIONS: TeacherRole[] = [
  // 领导层
  'principal',
  'secretary',
  'vice_principal',
  // 教师群体
  'head_teacher',
  'subject_teacher',
  'skill_teacher',
];

// 可兼任的行政职务选项（教研组长、行政职务等）
const ADMINISTRATIVE_ROLE_OPTIONS: AdministrativeRole[] = [
  'grade_leader',
  'research_group_leader',
  'research_group_deputy_leader',
  'academic_director',
  'moral_director',
  'general_director',
  'young_pioneer_counselor',
];

export function TeacherRoleConfigDialog({
  open,
  onOpenChange,
  config,
  onSave,
}: TeacherRoleConfigDialogProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<TeacherRoleConfig>({
    teacherId: '',
    teacherName: '',
    primaryRole: 'subject_teacher',
    additionalRoles: [],
  });

  // 初始化表单
  useEffect(() => {
    if (config) {
      setForm({
        teacherId: config.teacherId,
        teacherName: config.teacherName,
        primaryRole: config.primaryRole,
        additionalRoles: config.additionalRoles || [],
      });
    }
  }, [config]);

  // 切换兼任职务
  const toggleAdditionalRole = (role: AdministrativeRole) => {
    setForm(prev => ({
      ...prev,
      additionalRoles: prev.additionalRoles.includes(role)
        ? prev.additionalRoles.filter(r => r !== role)
        : [...prev.additionalRoles, role],
    }));
  };

  // 保存
  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave(form);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const roleColor = TEACHER_ROLE_COLORS[form.primaryRole];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            角色配置 - {form.teacherName}
          </DialogTitle>
          <DialogDescription>
            配置教师的主要角色和兼任职务
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 主要角色 */}
          <div className="space-y-2">
            <Label className="text-base font-medium">主要角色</Label>
            <Select
              value={form.primaryRole}
              onValueChange={(value) => setForm(prev => ({ 
                ...prev, 
                primaryRole: value as TeacherRole 
              }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIMARY_ROLE_OPTIONS.map(role => (
                  <SelectItem key={role} value={role}>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${TEACHER_ROLE_COLORS[role].bg.replace('bg-', 'bg-')}`} />
                      {TEACHER_ROLE_LABELS[role]}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-gray-500">当前角色：</span>
              <Badge className={`${roleColor.bg} ${roleColor.text}`}>
                {TEACHER_ROLE_LABELS[form.primaryRole]}
              </Badge>
            </div>
          </div>

          {/* 兼任职务 */}
          <div className="space-y-2">
            <Label className="text-base font-medium">
              兼任职务
              <span className="text-sm font-normal text-gray-500 ml-2">
                （可多选）
              </span>
            </Label>
            <div className="grid grid-cols-2 gap-3 mt-3">
              {ADMINISTRATIVE_ROLE_OPTIONS.map(role => {
                const isChecked = form.additionalRoles.includes(role);
                return (
                  <div
                    key={role}
                    className={`flex items-center space-x-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                      isChecked 
                        ? 'border-primary bg-primary/5' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleAdditionalRole(role)}
                  >
                    <Checkbox
                      id={role}
                      checked={isChecked}
                      onCheckedChange={() => toggleAdditionalRole(role)}
                    />
                    <label
                      htmlFor={role}
                      className="text-sm cursor-pointer select-none"
                    >
                      {ADMINISTRATIVE_ROLE_LABELS[role]}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 已选兼任职务显示 */}
          {form.additionalRoles.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm text-gray-500">已选兼任职务</Label>
              <div className="flex flex-wrap gap-2">
                {form.additionalRoles.map(role => (
                  <Badge
                    key={role}
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => toggleAdditionalRole(role)}
                  >
                    {ADMINISTRATIVE_ROLE_LABELS[role]}
                    <span className="ml-1 text-gray-400">×</span>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* 角色说明 */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>角色说明：</strong>
              <ul className="mt-2 space-y-1 list-disc list-inside text-gray-600">
                <li><strong>班主任</strong>：班级管理者，管理本班学生和家长</li>
                <li><strong>科任教师</strong>：语文、数学、英语等主科教师</li>
                <li><strong>技能课教师</strong>：音乐、美术、体育、科学等教师</li>
                <li><strong>教研组组长/副组长</strong>：负责教研活动组织</li>
              </ul>
              <p className="mt-2 text-gray-600">
                <strong>兼任职务</strong>：年段长、部门主任、少先队大队辅导员等可由教师兼任，不影响其主要角色。
              </p>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            取消
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                保存配置
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
