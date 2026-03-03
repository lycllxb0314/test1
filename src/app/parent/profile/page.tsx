/**
 * 家长个人信息维护页面
 * 
 * 功能：
 * - 查看和编辑个人信息
 * - 修改密码
 */

'use client';

import React, { useState, useEffect } from 'react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  User,
  Phone,
  Mail,
  MessageSquare,
  MapPin,
  Briefcase,
  Building2,
  CreditCard,
  Save,
  Loader2,
  Key,
  Eye,
  EyeOff,
  Calendar,
  Star,
  Users,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useParentProfile, type ParentProfile, type ParentProfileFormData } from '@/hooks/useParentProfile';

export default function ParentProfilePage() {
  const { user } = useAuth();
  const { 
    profile, 
    loading, 
    saving, 
    fetchProfile, 
    updateProfile, 
    changePassword 
  } = useParentProfile();
  
  const [editing, setEditing] = useState(false);
  
  // 密码修改
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  // 表单数据
  const [formData, setFormData] = useState<ParentProfileFormData>({
    wechat: '',
    email: '',
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

  // 同步profile到formData
  useEffect(() => {
    if (profile) {
      setFormData({
        wechat: profile.wechat || '',
        email: profile.email || '',
        education: profile.education || '',
        political_status: profile.political_status || '',
        household_address: profile.household_address || '',
        current_address: profile.current_address || '',
        emergency_contact: profile.emergency_contact || '',
        emergency_phone: profile.emergency_phone || '',
        occupation: profile.occupation || '',
        work_unit: profile.work_unit || '',
        remark: profile.remark || '',
      });
    }
  }, [profile]);

  // 保存修改
  const handleSave = async () => {
    const result = await updateProfile(formData);
    if (result) {
      setEditing(false);
    }
  };

  // 修改密码
  const handleChangePassword = async () => {
    if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('请填写完整信息');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('新密码长度不能少于6位');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('两次输入的新密码不一致');
      return;
    }

    const result = await changePassword(passwordForm.oldPassword, passwordForm.newPassword);
    if (result) {
      setPasswordDialog(false);
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="h-12 w-12 text-gray-300 mb-4" />
        <p className="text-gray-500">无法获取个人信息</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">个人资料</h1>
          <p className="text-gray-500 mt-1">查看和管理您的个人信息</p>
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
            <>
              <Dialog open={passwordDialog} onOpenChange={setPasswordDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Key className="h-4 w-4 mr-2" />
                    修改密码
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[400px]">
                  <DialogHeader>
                    <DialogTitle>修改密码</DialogTitle>
                    <DialogDescription>请输入旧密码和新密码</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>旧密码</Label>
                      <div className="relative">
                        <Input
                          type={showOldPassword ? 'text' : 'password'}
                          value={passwordForm.oldPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                          placeholder="请输入旧密码"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          onClick={() => setShowOldPassword(!showOldPassword)}
                        >
                          {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>新密码</Label>
                      <div className="relative">
                        <Input
                          type={showNewPassword ? 'text' : 'password'}
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                          placeholder="请输入新密码（至少6位）"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>确认新密码</Label>
                      <Input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        placeholder="请再次输入新密码"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setPasswordDialog(false)}>
                      取消
                    </Button>
                    <Button onClick={handleChangePassword}>确认修改</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button onClick={() => setEditing(true)}>
                编辑信息
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：基本信息 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 个人信息卡片 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-cyan-600" />
                基本信息
              </CardTitle>
              <CardDescription>您的基本身份信息</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 姓名（只读） */}
                <div className="space-y-2">
                  <Label>姓名</Label>
                  <p className="p-2 bg-gray-50 rounded-md font-medium">{profile.name}</p>
                </div>

                {/* 关系（只读） */}
                <div className="space-y-2">
                  <Label>与学生关系</Label>
                  <p className="p-2 bg-gray-50 rounded-md">
                    <Badge className="bg-cyan-100 text-cyan-700">{profile.relation_name}</Badge>
                  </p>
                </div>

                {/* 手机号（只读） */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    联系电话
                  </Label>
                  <p className="p-2 bg-gray-50 rounded-md font-mono">{profile.phone}</p>
                  <p className="text-xs text-gray-500">如需更换手机号，请联系学校管理员</p>
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
                      {profile.wechat || <span className="text-gray-400">未填写</span>}
                    </p>
                  )}
                </div>

                {/* 邮箱 */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    电子邮箱
                  </Label>
                  {editing ? (
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="请输入邮箱"
                    />
                  ) : (
                    <p className="p-2 bg-gray-50 rounded-md">
                      {profile.email || <span className="text-gray-400">未填写</span>}
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
                      {profile.education || <span className="text-gray-400">未填写</span>}
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
                      {profile.political_status || <span className="text-gray-400">未填写</span>}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 地址与联系 */}
          <Card>
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
                      {profile.household_address || <span className="text-gray-400">未填写</span>}
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
                      {profile.current_address || <span className="text-gray-400">未填写</span>}
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
                      {profile.emergency_contact || <span className="text-gray-400">未填写</span>}
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
                      {profile.emergency_phone || <span className="text-gray-400">未填写</span>}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 工作信息 */}
          <Card>
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
                      {profile.occupation || <span className="text-gray-400">未填写</span>}
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
                      {profile.work_unit || <span className="text-gray-400">未填写</span>}
                    </p>
                  )}
                </div>

                {/* 备注 */}
                <div className="space-y-2 md:col-span-2">
                  <Label>备注</Label>
                  {editing ? (
                    <Textarea
                      value={formData.remark}
                      onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                      placeholder="请输入备注信息"
                      rows={3}
                    />
                  ) : (
                    <p className="p-2 bg-gray-50 rounded-md min-h-[60px]">
                      {profile.remark || <span className="text-gray-400">暂无备注</span>}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧：关联信息 */}
        <div className="space-y-6">
          {/* 关联学生 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                关联子女
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profile.student ? (
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-xl">
                    {profile.student.gender === '男' ? '👦' : '👧'}
                  </div>
                  <div>
                    <p className="font-medium">{profile.student.name}</p>
                    <p className="text-sm text-gray-500">{profile.student.class_name}</p>
                    <p className="text-xs text-gray-400">学号: {profile.student.student_no}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-center py-4">暂无关联子女</p>
              )}
            </CardContent>
          </Card>

          {/* 其他家长 */}
          {profile.otherParents && profile.otherParents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-amber-600" />
                  其他家长
                </CardTitle>
                <CardDescription>该子女的其他家长</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {profile.otherParents.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{p.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {p.relation_name}
                        </Badge>
                      </div>
                      {p.is_primary && (
                        <Star className="h-4 w-4 text-amber-500" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 主要联系人标识 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-600" />
                主要联系人
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profile.is_primary ? (
                <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg">
                  <Star className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="font-medium text-amber-700">您是主要联系人</p>
                    <p className="text-xs text-amber-600">学校会优先联系您</p>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 text-sm">您不是主要联系人</p>
                  <p className="text-xs text-gray-400 mt-1">如需变更请联系学校管理员</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
