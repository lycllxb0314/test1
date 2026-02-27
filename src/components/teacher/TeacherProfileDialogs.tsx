'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

// 类型定义 - 使用更宽松的类型以兼容不同的数据源
type DialogType = 'honor' | 'training' | 'achievement' | 'record';

// 定义本地类型，避免类型冲突
interface LocalTeacherHonor {
  id: string;
  teacherId: string;
  title: string;
  level: string;
  category: string;
  issuer?: string;
  date: string;
  certificateNo?: string;
}

interface LocalTeacherTraining {
  id: string;
  teacherId: string;
  name: string;
  type: string;
  organizer: string;
  startDate: string;
  endDate: string;
  hours: number;
  status: string;
  certificate?: string;
  notes?: string;
}

interface LocalTeacherAchievement {
  id: string;
  teacherId: string;
  type: string;
  title: string;
  level?: string;
  result?: string;
  date: string;
  description?: string;
}

interface LocalTeacherRecord {
  id: string;
  teacherId: string;
  type: string;
  title: string;
  description?: string;
  date: string;
}

type EditItem = LocalTeacherHonor | LocalTeacherTraining | LocalTeacherAchievement | LocalTeacherRecord | null;

interface TeacherProfileDialogsProps {
  teacherId: string;
  type: DialogType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editItem?: EditItem;
}

// 荣誉表单
function HonorForm({
  teacherId,
  onSubmit,
  onCancel,
  initialData,
  isSubmitting,
}: {
  teacherId: string;
  onSubmit: (data: Partial<LocalTeacherHonor>) => void;
  onCancel: () => void;
  initialData?: LocalTeacherHonor | null;
  isSubmitting: boolean;
}) {
  const [form, setForm] = useState({
    title: initialData?.title || '',
    level: initialData?.level || '校级',
    category: initialData?.category || '综合',
    issuer: initialData?.issuer || '',
    date: initialData?.date || '',
    certificateNo: initialData?.certificateNo || '',
  });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">荣誉名称 *</Label>
        <Input
          id="title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="请输入荣誉名称"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="level">级别 *</Label>
          <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v as typeof form.level })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="校级">校级</SelectItem>
              <SelectItem value="区级">区级</SelectItem>
              <SelectItem value="市级">市级</SelectItem>
              <SelectItem value="省级">省级</SelectItem>
              <SelectItem value="国家级">国家级</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">类别 *</Label>
          <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as typeof form.category })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="综合">综合</SelectItem>
              <SelectItem value="教学">教学</SelectItem>
              <SelectItem value="德育">德育</SelectItem>
              <SelectItem value="科研">科研</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="issuer">颁发单位</Label>
        <Input
          id="issuer"
          value={form.issuer}
          onChange={(e) => setForm({ ...form, issuer: e.target.value })}
          placeholder="请输入颁发单位"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">获得时间 *</Label>
          <Input
            id="date"
            type="month"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="certificateNo">证书编号</Label>
          <Input
            id="certificateNo"
            value={form.certificateNo}
            onChange={(e) => setForm({ ...form, certificateNo: e.target.value })}
            placeholder="请输入证书编号"
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          取消
        </Button>
        <Button
          onClick={() => onSubmit({ ...form, teacherId })}
          disabled={isSubmitting || !form.title || !form.date}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? '更新' : '添加'}
        </Button>
      </DialogFooter>
    </div>
  );
}

// 培训表单
function TrainingForm({
  teacherId,
  onSubmit,
  onCancel,
  initialData,
  isSubmitting,
}: {
  teacherId: string;
  onSubmit: (data: Partial<LocalTeacherTraining>) => void;
  onCancel: () => void;
  initialData?: LocalTeacherTraining | null;
  isSubmitting: boolean;
}) {
  const [form, setForm] = useState({
    name: initialData?.name || '',
    type: initialData?.type || '校内培训',
    organizer: initialData?.organizer || '',
    startDate: initialData?.startDate || '',
    endDate: initialData?.endDate || '',
    hours: initialData?.hours || 0,
    status: initialData?.status || '进行中',
    certificate: initialData?.certificate || '',
    notes: initialData?.notes || '',
  });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">培训名称 *</Label>
        <Input
          id="name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="请输入培训名称"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">培训类型 *</Label>
          <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as typeof form.type })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="校内培训">校内培训</SelectItem>
              <SelectItem value="区级培训">区级培训</SelectItem>
              <SelectItem value="市级培训">市级培训</SelectItem>
              <SelectItem value="省级培训">省级培训</SelectItem>
              <SelectItem value="国家级培训">国家级培训</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">状态</Label>
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as typeof form.status })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="进行中">进行中</SelectItem>
              <SelectItem value="已完成">已完成</SelectItem>
              <SelectItem value="未通过">未通过</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="organizer">主办单位</Label>
        <Input
          id="organizer"
          value={form.organizer}
          onChange={(e) => setForm({ ...form, organizer: e.target.value })}
          placeholder="请输入主办单位"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">开始日期 *</Label>
          <Input
            id="startDate"
            type="date"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">结束日期 *</Label>
          <Input
            id="endDate"
            type="date"
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="hours">学时</Label>
          <Input
            id="hours"
            type="number"
            value={form.hours}
            onChange={(e) => setForm({ ...form, hours: parseInt(e.target.value) || 0 })}
            placeholder="0"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="certificate">证书编号</Label>
          <Input
            id="certificate"
            value={form.certificate}
            onChange={(e) => setForm({ ...form, certificate: e.target.value })}
            placeholder="如有证书请填写"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">备注</Label>
        <Textarea
          id="notes"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="其他备注信息"
          rows={2}
        />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          取消
        </Button>
        <Button
          onClick={() => onSubmit({ ...form, teacherId })}
          disabled={isSubmitting || !form.name || !form.startDate}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? '更新' : '添加'}
        </Button>
      </DialogFooter>
    </div>
  );
}

// 成果表单
function AchievementForm({
  teacherId,
  onSubmit,
  onCancel,
  initialData,
  isSubmitting,
}: {
  teacherId: string;
  onSubmit: (data: Partial<LocalTeacherAchievement>) => void;
  onCancel: () => void;
  initialData?: LocalTeacherAchievement | null;
  isSubmitting: boolean;
}) {
  const [form, setForm] = useState({
    type: initialData?.type || '公开课',
    title: initialData?.title || '',
    level: initialData?.level || '',
    result: initialData?.result || '',
    date: initialData?.date || '',
    description: initialData?.description || '',
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">成果类型 *</Label>
          <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as typeof form.type })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="公开课">公开课</SelectItem>
              <SelectItem value="教学比赛">教学比赛</SelectItem>
              <SelectItem value="论文发表">论文发表</SelectItem>
              <SelectItem value="课题研究">课题研究</SelectItem>
              <SelectItem value="指导学生获奖">指导学生获奖</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="level">级别</Label>
          <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v })}>
            <SelectTrigger>
              <SelectValue placeholder="选择级别" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="校级">校级</SelectItem>
              <SelectItem value="区级">区级</SelectItem>
              <SelectItem value="市级">市级</SelectItem>
              <SelectItem value="省级">省级</SelectItem>
              <SelectItem value="国家级">国家级</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="title">成果名称 *</Label>
        <Input
          id="title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="请输入成果名称"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">时间 *</Label>
          <Input
            id="date"
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="result">成绩/奖项</Label>
          <Input
            id="result"
            value={form.result}
            onChange={(e) => setForm({ ...form, result: e.target.value })}
            placeholder="如：一等奖、优秀等"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">描述说明</Label>
        <Textarea
          id="description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="请输入成果描述"
          rows={3}
        />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          取消
        </Button>
        <Button
          onClick={() => onSubmit({ ...form, teacherId })}
          disabled={isSubmitting || !form.title || !form.date}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? '更新' : '添加'}
        </Button>
      </DialogFooter>
    </div>
  );
}

// 成长记录表单
function RecordForm({
  teacherId,
  onSubmit,
  onCancel,
  initialData,
  isSubmitting,
}: {
  teacherId: string;
  onSubmit: (data: Partial<LocalTeacherRecord>) => void;
  onCancel: () => void;
  initialData?: LocalTeacherRecord | null;
  isSubmitting: boolean;
}) {
  const [form, setForm] = useState({
    type: initialData?.type || 'other',
    title: initialData?.title || '',
    description: initialData?.description || '',
    date: initialData?.date || '',
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type">记录类型 *</Label>
          <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as typeof form.type })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="education">学历</SelectItem>
              <SelectItem value="title">职称</SelectItem>
              <SelectItem value="position">职务</SelectItem>
              <SelectItem value="award">荣誉</SelectItem>
              <SelectItem value="training">培训</SelectItem>
              <SelectItem value="research">科研</SelectItem>
              <SelectItem value="other">其他</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="date">时间 *</Label>
          <Input
            id="date"
            type="month"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="title">标题 *</Label>
        <Input
          id="title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="请输入记录标题"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">详细描述</Label>
        <Textarea
          id="description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="请输入详细描述"
          rows={3}
        />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          取消
        </Button>
        <Button
          onClick={() => onSubmit({ ...form, teacherId })}
          disabled={isSubmitting || !form.title || !form.date}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? '更新' : '添加'}
        </Button>
      </DialogFooter>
    </div>
  );
}

// 主组件
export function TeacherProfileDialogs({
  teacherId,
  type,
  open,
  onOpenChange,
  onSuccess,
  editItem,
}: TeacherProfileDialogsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: Record<string, unknown>) => {
    setIsSubmitting(true);
    try {
      let endpoint = '';
      let method = 'POST';
      
      switch (type) {
        case 'honor':
          endpoint = '/api/teachers/honors';
          break;
        case 'training':
          endpoint = '/api/teachers/trainings';
          break;
        case 'achievement':
          endpoint = '/api/teachers/achievements';
          break;
        case 'record':
          endpoint = '/api/teachers/records';
          break;
      }

      if (editItem?.id) {
        method = 'PUT';
        data.id = editItem.id;
      }

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        onSuccess();
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTitle = () => {
    const isEdit = !!editItem?.id;
    switch (type) {
      case 'honor':
        return isEdit ? '编辑荣誉' : '添加荣誉';
      case 'training':
        return isEdit ? '编辑培训' : '添加培训';
      case 'achievement':
        return isEdit ? '编辑成果' : '添加成果';
      case 'record':
        return isEdit ? '编辑记录' : '添加成长记录';
      default:
        return '';
    }
  };

  const getDescription = () => {
    switch (type) {
      case 'honor':
        return '填写教师获得的荣誉奖项信息';
      case 'training':
        return '填写教师参加的培训经历';
      case 'achievement':
        return '填写教师的教学成果信息';
      case 'record':
        return '填写教师成长经历记录';
      default:
        return '';
    }
  };

  const renderForm = () => {
    switch (type) {
      case 'honor':
        return (
          <HonorForm
            teacherId={teacherId}
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
            initialData={editItem as LocalTeacherHonor}
            isSubmitting={isSubmitting}
          />
        );
      case 'training':
        return (
          <TrainingForm
            teacherId={teacherId}
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
            initialData={editItem as LocalTeacherTraining}
            isSubmitting={isSubmitting}
          />
        );
      case 'achievement':
        return (
          <AchievementForm
            teacherId={teacherId}
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
            initialData={editItem as LocalTeacherAchievement}
            isSubmitting={isSubmitting}
          />
        );
      case 'record':
        return (
          <RecordForm
            teacherId={teacherId}
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
            initialData={editItem as LocalTeacherRecord}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>
        {renderForm()}
      </DialogContent>
    </Dialog>
  );
}

// 导出删除函数
export async function deleteTeacherProfileItem(
  type: 'honor' | 'training' | 'achievement' | 'record',
  id: string
): Promise<boolean> {
  try {
    let endpoint = '';
    switch (type) {
      case 'honor':
        endpoint = `/api/teachers/honors?id=${id}`;
        break;
      case 'training':
        endpoint = `/api/teachers/trainings?id=${id}`;
        break;
      case 'achievement':
        endpoint = `/api/teachers/achievements?id=${id}`;
        break;
      case 'record':
        endpoint = `/api/teachers/records?id=${id}`;
        break;
    }

    const response = await fetch(endpoint, { method: 'DELETE' });
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Delete error:', error);
    return false;
  }
}
