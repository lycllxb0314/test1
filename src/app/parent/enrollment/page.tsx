'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  UserPlus,
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  Eye,
} from 'lucide-react';

// 模拟已提交的申请
const mockMyApplications = [
  {
    id: 'ns003',
    studentName: '王小明',
    status: 'synced',
    submittedAt: '2024-08-10 09:15:00',
    applyGrade: 1,
    applyClass: '一年(1)班',
  },
];

export default function ParentEnrollmentPage() {
  const [applyDialog, setApplyDialog] = useState(false);
  const [successDialog, setSuccessDialog] = useState(false);
  
  // 表单数据
  const [formData, setFormData] = useState({
    studentName: '',
    gender: 'male',
    birthDate: '',
    idCard: '',
    ethnicity: '汉族',
    nativePlace: '',
    applyGrade: '1',
    parentName: '',
    parentPhone: '',
    parentRelation: '父亲',
    parent2Name: '',
    parent2Phone: '',
    parent2Relation: '母亲',
    homeAddress: '',
    studentType: '普通',
  });

  // 提交申请
  const handleSubmit = async () => {
    // 验证必填字段
    if (!formData.studentName || !formData.birthDate || !formData.parentName || !formData.parentPhone || !formData.homeAddress) {
      toast.error('请填写所有必填项');
      return;
    }

    try {
      const res = await fetch('/api/enrollment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setApplyDialog(false);
        setSuccessDialog(true);
      } else {
        toast.error('提交失败，请重试');
      }
    } catch {
      toast.error('提交失败，请重试');
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; color: string }> = {
      pending: { label: '待审核', color: 'bg-amber-100 text-amber-700' },
      reviewing: { label: '审核中', color: 'bg-blue-100 text-blue-700' },
      approved: { label: '已通过', color: 'bg-green-100 text-green-700' },
      rejected: { label: '已拒绝', color: 'bg-red-100 text-red-700' },
      synced: { label: '已入学', color: 'bg-purple-100 text-purple-700' },
    };
    const s = config[status] || config.pending;
    return <Badge className={s.color}>{s.label}</Badge>;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">新生注册</h1>
          <p className="text-muted-foreground mt-1">为新生办理入学注册手续</p>
        </div>
        <Badge className="bg-amber-100 text-amber-700">
          <Calendar className="h-3 w-3 mr-1" />
          每年9月开放
        </Badge>
      </div>

      {/* 说明卡片 */}
      <Card className="bg-gradient-to-br from-cyan-50 to-teal-50 border-cyan-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center">
              <UserPlus className="h-6 w-6 text-cyan-600" />
            </div>
            <div>
              <h3 className="font-medium text-lg">新生入学注册</h3>
              <p className="text-muted-foreground mt-1">
                本功能用于新入学一年级学生信息登记。请如实填写学生基本信息及家长联系方式，
                提交后请等待教务处审核。审核通过后，学生信息将同步至学生管理系统。
              </p>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  审核周期：3-5个工作日
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  需准备：户口本、接种证
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 申请入口 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">开始注册</CardTitle>
          <CardDescription>填写新生基本信息，提交入学申请</CardDescription>
        </CardHeader>
        <CardContent>
          <Button size="lg" onClick={() => setApplyDialog(true)}>
            <UserPlus className="h-5 w-5 mr-2" />
            新生入学登记
          </Button>
        </CardContent>
      </Card>

      {/* 我的申请 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">我的申请记录</CardTitle>
          <CardDescription>查看已提交的新生注册申请</CardDescription>
        </CardHeader>
        <CardContent>
          {mockMyApplications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              暂无申请记录
            </div>
          ) : (
            <div className="space-y-3">
              {mockMyApplications.map((app) => (
                <div key={app.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                      👦
                    </div>
                    <div>
                      <p className="font-medium">{app.studentName}</p>
                      <p className="text-sm text-muted-foreground">
                        申请{app.applyGrade}年级 · {app.applyClass || '待分配'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">{app.submittedAt.split(' ')[0]}</span>
                    {getStatusBadge(app.status)}
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 新生登记表对话框 */}
      <Dialog open={applyDialog} onOpenChange={setApplyDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新生入学登记</DialogTitle>
            <DialogDescription>
              请如实填写以下信息，带 * 为必填项
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* 学生基本信息 */}
            <div>
              <h4 className="font-medium mb-3">学生基本信息</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>姓名 *</Label>
                  <Input 
                    value={formData.studentName}
                    onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                    placeholder="请输入学生姓名"
                  />
                </div>
                <div className="space-y-2">
                  <Label>性别 *</Label>
                  <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">男</SelectItem>
                      <SelectItem value="female">女</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>出生日期 *</Label>
                  <Input 
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>身份证号</Label>
                  <Input 
                    value={formData.idCard}
                    onChange={(e) => setFormData({ ...formData, idCard: e.target.value })}
                    placeholder="选填"
                  />
                </div>
                <div className="space-y-2">
                  <Label>民族</Label>
                  <Input 
                    value={formData.ethnicity}
                    onChange={(e) => setFormData({ ...formData, ethnicity: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>籍贯</Label>
                  <Input 
                    value={formData.nativePlace}
                    onChange={(e) => setFormData({ ...formData, nativePlace: e.target.value })}
                    placeholder="如：福建龙岩"
                  />
                </div>
              </div>
            </div>

            {/* 申请信息 */}
            <div>
              <h4 className="font-medium mb-3">申请信息</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>申请年级 *</Label>
                  <Select value={formData.applyGrade} onValueChange={(v) => setFormData({ ...formData, applyGrade: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">一年级</SelectItem>
                      <SelectItem value="2">二年级</SelectItem>
                      <SelectItem value="3">三年级</SelectItem>
                      <SelectItem value="4">四年级</SelectItem>
                      <SelectItem value="5">五年级</SelectItem>
                      <SelectItem value="6">六年级</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>学生类型</Label>
                  <Select value={formData.studentType} onValueChange={(v) => setFormData({ ...formData, studentType: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="普通">普通</SelectItem>
                      <SelectItem value="随迁子女">随迁子女</SelectItem>
                      <SelectItem value="留守儿童">留守儿童</SelectItem>
                      <SelectItem value="残疾学生">残疾学生</SelectItem>
                      <SelectItem value="低保家庭">低保家庭</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* 家长信息 */}
            <div>
              <h4 className="font-medium mb-3">家长信息</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>家长姓名 *</Label>
                  <Input 
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>关系 *</Label>
                  <Select value={formData.parentRelation} onValueChange={(v) => setFormData({ ...formData, parentRelation: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="父亲">父亲</SelectItem>
                      <SelectItem value="母亲">母亲</SelectItem>
                      <SelectItem value="爷爷">爷爷</SelectItem>
                      <SelectItem value="奶奶">奶奶</SelectItem>
                      <SelectItem value="外公">外公</SelectItem>
                      <SelectItem value="外婆">外婆</SelectItem>
                      <SelectItem value="其他">其他</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>联系电话 *</Label>
                  <Input 
                    value={formData.parentPhone}
                    onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="space-y-2">
                  <Label>家长2姓名</Label>
                  <Input 
                    value={formData.parent2Name}
                    onChange={(e) => setFormData({ ...formData, parent2Name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>关系</Label>
                  <Select value={formData.parent2Relation} onValueChange={(v) => setFormData({ ...formData, parent2Relation: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="母亲">母亲</SelectItem>
                      <SelectItem value="父亲">父亲</SelectItem>
                      <SelectItem value="爷爷">爷爷</SelectItem>
                      <SelectItem value="奶奶">奶奶</SelectItem>
                      <SelectItem value="外公">外公</SelectItem>
                      <SelectItem value="外婆">外婆</SelectItem>
                      <SelectItem value="其他">其他</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>联系电话</Label>
                  <Input 
                    value={formData.parent2Phone}
                    onChange={(e) => setFormData({ ...formData, parent2Phone: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* 地址信息 */}
            <div>
              <h4 className="font-medium mb-3">地址信息</h4>
              <div className="space-y-2">
                <Label>家庭住址 *</Label>
                <Textarea
                  value={formData.homeAddress}
                  onChange={(e) => setFormData({ ...formData, homeAddress: e.target.value })}
                  placeholder="请输入详细家庭住址"
                  rows={2}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApplyDialog(false)}>取消</Button>
            <Button onClick={handleSubmit}>提交申请</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 成功提示对话框 */}
      <Dialog open={successDialog} onOpenChange={setSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-500" />
              提交成功
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground">
              您的新生入学申请已成功提交，教务处将在3-5个工作日内完成审核。
              审核结果将通过短信通知您，您也可以在本页面查看申请进度。
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setSuccessDialog(false)}>我知道了</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
