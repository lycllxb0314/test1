/**
 * 家长详情页面
 * 
 * 功能：
 * - 查看和编辑家长详细信息
 * - 管理家长账号
 * - 查看关联学生信息
 */

'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
  ArrowLeft,
  User,
  Phone,
  MessageSquare,
  CreditCard,
  Briefcase,
  Building2,
  Users,
  Key,
  Save,
  Loader2,
  UserPlus,
  RefreshCw,
  Star,
  StarOff,
  School,
  Calendar,
  MapPin,
  FileText,
  Mail,
} from 'lucide-react';
import { toast } from 'sonner';

// 关系选项
const RELATION_OPTIONS = [
  { value: 'father', label: '父亲' },
  { value: 'mother', label: '母亲' },
  { value: 'grandfather', label: '爷爷/外公' },
  { value: 'grandmother', label: '奶奶/外婆' },
  { value: 'other', label: '其他' },
];

// 关系名称映射
const RELATION_NAMES: Record<string, string> = {
  father: '父亲',
  mother: '母亲',
  grandfather: '爷爷/外公',
  grandmother: '奶奶/外婆',
  other: '其他',
};

// 家长类型定义
interface ParentDetail {
  id: string;
  student_id?: string;
  studentId?: string;
  student_name?: string;
  studentName?: string;
  class_id?: string;
  classId?: string;
  class_name?: string;
  className?: string;
  name: string;
  relation: string;
  relation_name?: string;
  relationName?: string;
  phone: string | null;
  wechat: string | null;
  email: string | null;
  // 个人信息（扩展）
  gender: string | null;
  birth_date?: string | null;
  birthDate?: string | null;
  id_card?: string | null;
  idCard?: string | null;
  education: string | null;
  political_status?: string | null;
  politicalStatus?: string | null;
  // 地址信息
  household_address?: string | null;
  householdAddress?: string | null;
  current_address?: string | null;
  currentAddress?: string | null;
  // 紧急联系人
  emergency_contact?: string | null;
  emergencyContact?: string | null;
  emergency_phone?: string | null;
  emergencyPhone?: string | null;
  // 工作信息
  occupation: string | null;
  work_unit?: string | null;
  company?: string | null;
  // 账号信息
  is_primary?: boolean;
  isPrimary?: boolean;
  has_account?: boolean;
  hasAccount?: boolean;
  account_id?: string | null;
  userId?: string | null;
  password: string | null;
  status: string;
  remark: string | null;
  created_at: string;
  updated_at: string;
}

// 学生简要信息
interface StudentBrief {
  id: string;
  name: string;
  studentNo?: string;
  student_no?: string;
  className?: string;
  class_name?: string;
  gender: string;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ParentDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [parent, setParent] = useState<ParentDetail | null>(null);
  const [student, setStudent] = useState<StudentBrief | null>(null);
  const [otherParents, setOtherParents] = useState<ParentDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  
  // 表单数据
  const [formData, setFormData] = useState({
    name: '',
    relation: '',
    phone: '',
    wechat: '',
    email: '',
    gender: '',
    birth_date: '',
    id_card: '',
    education: '',
    political_status: '',
    household_address: '',
    current_address: '',
    emergency_contact: '',
    emergency_phone: '',
    occupation: '',
    work_unit: '',
    remark: '',
  });

  // 加载家长数据
  useEffect(() => {
    loadParentData();
  }, [resolvedParams.id]);

  const loadParentData = async () => {
    setLoading(true);
    try {
      // 加载家长信息
      const response = await fetch(`/api/parents/${resolvedParams.id}`);
      const result = await response.json();
      
      if (result.success) {
        setParent(result.data);
        setFormData({
          name: result.data.name || '',
          relation: result.data.relation || '',
          phone: result.data.phone || '',
          wechat: result.data.wechat || '',
          email: result.data.email || '',
          gender: result.data.gender || '',
          birth_date: result.data.birth_date || '',
          id_card: result.data.id_card || '',
          education: result.data.education || '',
          political_status: result.data.political_status || '',
          household_address: result.data.household_address || '',
          current_address: result.data.current_address || '',
          emergency_contact: result.data.emergency_contact || '',
          emergency_phone: result.data.emergency_phone || '',
          occupation: result.data.occupation || '',
          work_unit: result.data.work_unit || '',
          remark: result.data.remark || '',
        });
        
        // 加载关联学生信息
        if (result.data.student_id) {
          const studentRes = await fetch(`/api/students/${result.data.student_id}`);
          const studentResult = await studentRes.json();
          if (studentResult.success) {
            setStudent(studentResult.data);
          }
          
          // 加载该学生的其他家长
          const otherParentsRes = await fetch(`/api/parents?studentId=${result.data.student_id}`);
          const otherParentsResult = await otherParentsRes.json();
          if (otherParentsResult.success) {
            setOtherParents(
              otherParentsResult.data.filter((p: ParentDetail) => p.id !== resolvedParams.id)
            );
          }
        }
      } else {
        toast.error('加载家长信息失败');
        router.push('/academic/parents');
      }
    } catch (err) {
      console.error('Failed to load parent:', err);
      toast.error('加载家长信息失败');
    } finally {
      setLoading(false);
    }
  };

  // 保存修改
  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('请输入家长姓名');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/parents/${resolvedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          relation_name: RELATION_NAMES[formData.relation] || '其他',
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('保存成功');
        setEditing(false);
        loadParentData();
      } else {
        toast.error(result.error || '保存失败');
      }
    } catch (err) {
      console.error('Failed to save parent:', err);
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 开通账号
  const handleCreateAccount = async () => {
    if (!parent?.phone) {
      toast.error('请先填写手机号');
      return;
    }

    try {
      const response = await fetch('/api/parents/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_accounts',
          parentIds: [parent.id],
        }),
      });

      const result = await response.json();

      if (result.success && result.data.success > 0) {
        toast.success(`账号开通成功，密码：${result.data.data[0].defaultPassword}`);
        loadParentData();
      } else {
        toast.error(result.data?.errors?.[0] || '开通账号失败');
      }
    } catch (err) {
      console.error('Failed to create account:', err);
      toast.error('开通账号失败');
    }
  };

  // 重置密码
  const handleResetPassword = async () => {
    try {
      const response = await fetch('/api/parents/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset_passwords',
          parentIds: [parent!.id],
        }),
      });

      const result = await response.json();

      if (result.success && result.data.success > 0) {
        toast.success(`密码重置成功，新密码：${result.data.data[0].newPassword}`);
        loadParentData();
      } else {
        toast.error(result.data?.errors?.[0] || '重置密码失败');
      }
    } catch (err) {
      console.error('Failed to reset password:', err);
      toast.error('重置密码失败');
    }
  };

  // 设置为主要联系人
  const handleSetPrimary = async () => {
    try {
      const response = await fetch('/api/parents/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set_primary',
          parentIds: [parent!.id],
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('已设为主要联系人');
        loadParentData();
      } else {
        toast.error('设置失败');
      }
    } catch (err) {
      console.error('Failed to set primary:', err);
      toast.error('设置失败');
    }
  };

  // 获取关系颜色
  const getRelationColor = (relation: string) => {
    const colorMap: Record<string, string> = {
      father: 'bg-blue-100 text-blue-700',
      mother: 'bg-pink-100 text-pink-700',
      grandfather: 'bg-amber-100 text-amber-700',
      grandmother: 'bg-rose-100 text-rose-700',
      other: 'bg-gray-100 text-gray-700',
    };
    return colorMap[relation] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!parent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Users className="h-16 w-16 text-gray-300 mb-4" />
        <p className="text-gray-500">家长信息不存在</p>
        <Button className="mt-4" onClick={() => router.push('/academic/parents')}>
          返回列表
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-purple-50/30 via-white to-pink-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/academic/parents')}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            返回
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <User className="h-6 w-6" />
              家长详情
            </h1>
            <p className="text-gray-500 mt-1">查看和管理家长信息</p>
          </div>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button variant="outline" onClick={() => setEditing(false)}>
                取消
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                <Save className="h-4 w-4 mr-1" />
                保存
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditing(true)}>
              编辑信息
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：基本信息 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 个人信息卡片 */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-purple-600" />
                基本信息
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 姓名 */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    家长姓名 <span className="text-red-500">*</span>
                  </Label>
                  {editing ? (
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="请输入家长姓名"
                    />
                  ) : (
                    <p className="p-2 bg-gray-50 rounded-md font-medium">{parent.name}</p>
                  )}
                </div>

                {/* 关系 */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    与学生关系
                  </Label>
                  {editing ? (
                    <Select
                      value={formData.relation}
                      onValueChange={(v) => setFormData({ ...formData, relation: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择关系" />
                      </SelectTrigger>
                      <SelectContent>
                        {RELATION_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="p-2 bg-gray-50 rounded-md">
                      <Badge className={getRelationColor(parent.relation)}>
                        {parent.relation_name}
                      </Badge>
                    </p>
                  )}
                </div>

                {/* 性别 */}
                <div className="space-y-2">
                  <Label>性别</Label>
                  {editing ? (
                    <Select
                      value={formData.gender}
                      onValueChange={(v) => setFormData({ ...formData, gender: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择性别" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="男">男</SelectItem>
                        <SelectItem value="女">女</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="p-2 bg-gray-50 rounded-md">
                      {parent.gender || <span className="text-gray-400">未填写</span>}
                    </p>
                  )}
                </div>

                {/* 出生日期 */}
                <div className="space-y-2">
                  <Label>出生日期</Label>
                  {editing ? (
                    <Input
                      type="date"
                      value={formData.birth_date}
                      onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                    />
                  ) : (
                    <p className="p-2 bg-gray-50 rounded-md">
                      {parent.birth_date || <span className="text-gray-400">未填写</span>}
                    </p>
                  )}
                </div>

                {/* 手机号 */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    联系电话
                  </Label>
                  {editing ? (
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="请输入手机号"
                    />
                  ) : (
                    <p className="p-2 bg-gray-50 rounded-md">
                      {parent.phone || <span className="text-gray-400">未填写</span>}
                    </p>
                  )}
                </div>

                {/* 微信 */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    微信号
                  </Label>
                  {editing ? (
                    <Input
                      value={formData.wechat}
                      onChange={(e) => setFormData({ ...formData, wechat: e.target.value })}
                      placeholder="请输入微信号"
                    />
                  ) : (
                    <p className="p-2 bg-gray-50 rounded-md">
                      {parent.wechat || <span className="text-gray-400">未填写</span>}
                    </p>
                  )}
                </div>

                {/* 邮箱 */}
                <div className="space-y-2">
                  <Label>电子邮箱</Label>
                  {editing ? (
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="请输入邮箱"
                    />
                  ) : (
                    <p className="p-2 bg-gray-50 rounded-md">
                      {parent.email || <span className="text-gray-400">未填写</span>}
                    </p>
                  )}
                </div>

                {/* 身份证 */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <CreditCard className="h-3 w-3" />
                    身份证号
                  </Label>
                  {editing ? (
                    <Input
                      value={formData.id_card}
                      onChange={(e) => setFormData({ ...formData, id_card: e.target.value })}
                      placeholder="请输入身份证号"
                    />
                  ) : (
                    <p className="p-2 bg-gray-50 rounded-md font-mono">
                      {parent.id_card || <span className="text-gray-400">未填写</span>}
                    </p>
                  )}
                </div>

                {/* 学历 */}
                <div className="space-y-2">
                  <Label>学历</Label>
                  {editing ? (
                    <Select
                      value={formData.education}
                      onValueChange={(v) => setFormData({ ...formData, education: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择学历" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="初中及以下">初中及以下</SelectItem>
                        <SelectItem value="高中">高中</SelectItem>
                        <SelectItem value="中专">中专</SelectItem>
                        <SelectItem value="大专">大专</SelectItem>
                        <SelectItem value="本科">本科</SelectItem>
                        <SelectItem value="硕士">硕士</SelectItem>
                        <SelectItem value="博士">博士</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="p-2 bg-gray-50 rounded-md">
                      {parent.education || <span className="text-gray-400">未填写</span>}
                    </p>
                  )}
                </div>

                {/* 政治面貌 */}
                <div className="space-y-2">
                  <Label>政治面貌</Label>
                  {editing ? (
                    <Select
                      value={formData.political_status}
                      onValueChange={(v) => setFormData({ ...formData, political_status: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择政治面貌" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="群众">群众</SelectItem>
                        <SelectItem value="共青团员">共青团员</SelectItem>
                        <SelectItem value="中共党员">中共党员</SelectItem>
                        <SelectItem value="民主党派">民主党派</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="p-2 bg-gray-50 rounded-md">
                      {parent.political_status || <span className="text-gray-400">未填写</span>}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 地址与联系卡片 */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-green-600" />
                地址与联系
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 户籍地址 */}
                <div className="space-y-2 md:col-span-2">
                  <Label>户籍地址</Label>
                  {editing ? (
                    <Input
                      value={formData.household_address}
                      onChange={(e) => setFormData({ ...formData, household_address: e.target.value })}
                      placeholder="请输入户籍地址"
                    />
                  ) : (
                    <p className="p-2 bg-gray-50 rounded-md">
                      {parent.household_address || <span className="text-gray-400">未填写</span>}
                    </p>
                  )}
                </div>

                {/* 现居住址 */}
                <div className="space-y-2 md:col-span-2">
                  <Label>现居住址</Label>
                  {editing ? (
                    <Input
                      value={formData.current_address}
                      onChange={(e) => setFormData({ ...formData, current_address: e.target.value })}
                      placeholder="请输入现居住址"
                    />
                  ) : (
                    <p className="p-2 bg-gray-50 rounded-md">
                      {parent.current_address || <span className="text-gray-400">未填写</span>}
                    </p>
                  )}
                </div>

                {/* 紧急联系人 */}
                <div className="space-y-2">
                  <Label>紧急联系人</Label>
                  {editing ? (
                    <Input
                      value={formData.emergency_contact}
                      onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                      placeholder="请输入紧急联系人"
                    />
                  ) : (
                    <p className="p-2 bg-gray-50 rounded-md">
                      {parent.emergency_contact || <span className="text-gray-400">未填写</span>}
                    </p>
                  )}
                </div>

                {/* 紧急联系电话 */}
                <div className="space-y-2">
                  <Label>紧急联系电话</Label>
                  {editing ? (
                    <Input
                      value={formData.emergency_phone}
                      onChange={(e) => setFormData({ ...formData, emergency_phone: e.target.value })}
                      placeholder="请输入紧急联系电话"
                    />
                  ) : (
                    <p className="p-2 bg-gray-50 rounded-md">
                      {parent.emergency_phone || <span className="text-gray-400">未填写</span>}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 工作信息卡片 */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-orange-600" />
                工作信息
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 职业 */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Briefcase className="h-3 w-3" />
                    职业
                  </Label>
                  {editing ? (
                    <Input
                      value={formData.occupation}
                      onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                      placeholder="请输入职业"
                    />
                  ) : (
                    <p className="p-2 bg-gray-50 rounded-md">
                      {parent.occupation || <span className="text-gray-400">未填写</span>}
                    </p>
                  )}
                </div>

                {/* 工作单位 */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    工作单位
                  </Label>
                  {editing ? (
                    <Input
                      value={formData.work_unit}
                      onChange={(e) => setFormData({ ...formData, work_unit: e.target.value })}
                      placeholder="请输入工作单位"
                    />
                  ) : (
                    <p className="p-2 bg-gray-50 rounded-md">
                      {parent.work_unit || <span className="text-gray-400">未填写</span>}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 其他信息卡片 */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-600" />
                其他信息
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 主要联系人 */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    主要联系人
                  </Label>
                  <div className="p-2 bg-gray-50 rounded-md flex items-center justify-between">
                    {parent.is_primary ? (
                      <Badge className="bg-amber-100 text-amber-700">
                        <Star className="h-3 w-3 mr-1" />
                        主要联系人
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-400">否</Badge>
                    )}
                    {!parent.is_primary && !editing && (
                      <Button size="sm" variant="outline" onClick={handleSetPrimary}>
                        设为主要
                      </Button>
                    )}
                  </div>
                </div>

                {/* 备注 */}
                <div className="space-y-2 md:col-span-2">
                  <Label className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    备注
                  </Label>
                  {editing ? (
                    <Textarea
                      value={formData.remark}
                      onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                      placeholder="请输入备注信息"
                      rows={3}
                    />
                  ) : (
                    <p className="p-2 bg-gray-50 rounded-md min-h-[60px]">
                      {parent.remark || <span className="text-gray-400">暂无备注</span>}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 账号信息卡片 */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-blue-600" />
                账号信息
              </CardTitle>
              <CardDescription>家长登录账号管理</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 账号状态 */}
                <div className="space-y-2">
                  <Label>账号状态</Label>
                  <div className="p-2 bg-gray-50 rounded-md flex items-center justify-between">
                    {parent.has_account ? (
                      <Badge className="bg-green-100 text-green-700">已开通</Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-400">未开通</Badge>
                    )}
                    {!parent.has_account && (
                      <Button size="sm" onClick={handleCreateAccount}>
                        <UserPlus className="h-4 w-4 mr-1" />
                        开通账号
                      </Button>
                    )}
                  </div>
                </div>

                {/* 登录账号 */}
                <div className="space-y-2">
                  <Label>登录账号</Label>
                  <div className="p-2 bg-gray-50 rounded-md font-mono">
                    {parent.has_account && parent.phone ? (
                      parent.phone
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">家长使用手机号登录</p>
                </div>

                {/* 登录密码 */}
                <div className="space-y-2">
                  <Label>登录密码</Label>
                  <div className="p-2 bg-gray-50 rounded-md flex items-center justify-between">
                    {parent.has_account ? (
                      <span className="font-mono">{parent.password || '-'}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                    {parent.has_account && (
                      <Button size="sm" variant="outline" onClick={handleResetPassword}>
                        <RefreshCw className="h-4 w-4 mr-1" />
                        重置
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">默认密码为手机号后6位</p>
                </div>

                {/* 创建时间 */}
                <div className="space-y-2">
                  <Label>创建时间</Label>
                  <div className="p-2 bg-gray-50 rounded-md">
                    {new Date(parent.created_at).toLocaleString('zh-CN')}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧：关联信息 */}
        <div className="space-y-6">
          {/* 关联学生 */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <School className="h-5 w-5 text-green-600" />
                关联学生
              </CardTitle>
            </CardHeader>
            <CardContent>
              {student ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-xl">
                      {student.gender === '男' || student.gender === 'male' ? '👦' : '👧'}
                    </div>
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-sm text-gray-500">{student.className || student.class_name}</p>
                    </div>
                  </div>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500">学号</span>
                      <span>{student.studentNo || student.student_no}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">性别</span>
                      <span>{student.gender === 'male' ? '男' : student.gender === 'female' ? '女' : student.gender}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-center py-4">暂无关联学生</p>
              )}
            </CardContent>
          </Card>

          {/* 其他家长 */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-orange-600" />
                其他家长
              </CardTitle>
              <CardDescription>该学生的其他家长</CardDescription>
            </CardHeader>
            <CardContent>
              {otherParents.length > 0 ? (
                <div className="space-y-2">
                  {otherParents.map(p => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                      onClick={() => router.push(`/academic/parents/${p.id}`)}
                    >
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{p.name}</span>
                        <Badge className={getRelationColor(p.relation)} variant="outline">
                          {p.relationName || p.relation_name}
                        </Badge>
                      </div>
                      {(p.isPrimary || p.is_primary) && (
                        <Star className="h-4 w-4 text-amber-500" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-4">暂无其他家长</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
