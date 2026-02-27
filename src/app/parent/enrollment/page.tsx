'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { toast } from 'sonner';
import {
  UserPlus,
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  Eye,
  AlertCircle,
  User,
  Phone,
  MapPin,
  Home,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

// 申请状态类型
type ApplicationStatus = 'pending' | 'reviewing' | 'approved' | 'rejected' | 'synced';

// 申请记录类型
interface Application {
  id: string;
  studentName: string;
  status: ApplicationStatus;
  submittedAt: string;
  applyGrade: number;
  applyClassName?: string;
  notes?: string;
}

export default function ParentEnrollmentPage() {
  const [applyDialog, setApplyDialog] = useState(false);
  const [successDialog, setSuccessDialog] = useState(false);
  const [detailDialog, setDetailDialog] = useState(false);
  const [myApplications, setMyApplications] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  
  // 表单数据
  const [formData, setFormData] = useState({
    // 学生基本信息
    studentName: '',
    gender: 'male',
    birthDate: '',
    idCard: '',
    ethnicity: '汉族',
    nativePlace: '',
    politicalStatus: '',
    // 申请信息
    applyGrade: '1',
    studentType: '普通',
    // 家庭信息
    familyType: '核心家庭',
    // 家长1
    parentName: '',
    parentPhone: '',
    parentRelation: '父亲',
    parentWechat: '',
    // 家长2
    parent2Name: '',
    parent2Phone: '',
    parent2Relation: '母亲',
    parent2Wechat: '',
    // 紧急联系人
    emergencyContact: '',
    emergencyPhone: '',
    // 地址
    homeAddress: '',
  });

  // 表单验证错误
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 获取我的申请
  const fetchMyApplications = async () => {
    try {
      const res = await fetch('/api/enrollment?status=all');
      const data = await res.json();
      if (data.success) {
        // 这里应该根据当前用户过滤，mock数据暂不处理
        setMyApplications(data.data.filter((a: Application) => 
          a.status === 'synced' || a.status === 'approved' || a.status === 'pending'
        ).slice(0, 3));
      }
    } catch {
      // 忽略错误
    }
  };

  useEffect(() => {
    fetchMyApplications();
  }, []);

  // 验证表单
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.studentName.trim()) {
      newErrors.studentName = '请输入学生姓名';
    }
    if (!formData.birthDate) {
      newErrors.birthDate = '请选择出生日期';
    }
    if (!formData.parentName.trim()) {
      newErrors.parentName = '请输入家长姓名';
    }
    if (!formData.parentPhone.trim()) {
      newErrors.parentPhone = '请输入联系电话';
    } else if (!/^1[3-9]\d{9}$/.test(formData.parentPhone)) {
      newErrors.parentPhone = '请输入正确的手机号';
    }
    if (!formData.homeAddress.trim()) {
      newErrors.homeAddress = '请输入家庭住址';
    }
    if (formData.idCard && !/^\d{17}[\dXx]$/.test(formData.idCard)) {
      newErrors.idCard = '请输入正确的身份证号';
    }
    if (formData.parent2Phone && !/^1[3-9]\d{9}$/.test(formData.parent2Phone)) {
      newErrors.parent2Phone = '请输入正确的手机号';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 提交申请
  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('请检查表单填写是否正确');
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
        fetchMyApplications();
        // 重置表单
        setFormData({
          studentName: '',
          gender: 'male',
          birthDate: '',
          idCard: '',
          ethnicity: '汉族',
          nativePlace: '',
          politicalStatus: '',
          applyGrade: '1',
          studentType: '普通',
          familyType: '核心家庭',
          parentName: '',
          parentPhone: '',
          parentRelation: '父亲',
          parentWechat: '',
          parent2Name: '',
          parent2Phone: '',
          parent2Relation: '母亲',
          parent2Wechat: '',
          emergencyContact: '',
          emergencyPhone: '',
          homeAddress: '',
        });
        setErrors({});
      } else {
        toast.error(data.message || '提交失败，请重试');
      }
    } catch {
      toast.error('提交失败，请重试');
    }
  };

  // 查看详情
  const handleViewDetail = (app: Application) => {
    setSelectedApp(app);
    setDetailDialog(true);
  };

  const getStatusBadge = (status: ApplicationStatus) => {
    const config: Record<ApplicationStatus, { label: string; color: string; description: string }> = {
      pending: { label: '待审核', color: 'bg-amber-100 text-amber-700', description: '等待教务处审核' },
      reviewing: { label: '审核中', color: 'bg-blue-100 text-blue-700', description: '正在审核中' },
      approved: { label: '已通过', color: 'bg-green-100 text-green-700', description: '审核通过，等待同步' },
      rejected: { label: '已拒绝', color: 'bg-red-100 text-red-700', description: '申请被拒绝' },
      synced: { label: '已入学', color: 'bg-purple-100 text-purple-700', description: '已完成入学注册' },
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
            <div className="w-12 h-12 rounded-xl bg-cyan-100 flex items-center justify-center shrink-0">
              <UserPlus className="h-6 w-6 text-cyan-600" />
            </div>
            <div>
              <h3 className="font-medium text-lg">新生入学注册须知</h3>
              <p className="text-muted-foreground mt-1">
                本功能用于新入学一年级学生信息登记。请如实填写学生基本信息及家长联系方式，
                提交后请等待教务处审核。审核通过后，学生信息将同步至学生管理系统。
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-cyan-600" />
                  <span>审核周期：3-5个工作日</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-cyan-600" />
                  <span>需准备：户口本、接种证</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <ShieldCheck className="h-4 w-4 text-cyan-600" />
                  <span>信息仅用于学籍管理</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-cyan-600" />
                  <span>审核结果短信通知</span>
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
          {myApplications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>暂无申请记录</p>
              <p className="text-sm mt-1">点击上方"新生入学登记"开始注册</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myApplications.map((app) => (
                <div 
                  key={app.id} 
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleViewDetail(app)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{app.studentName}</p>
                      <p className="text-sm text-muted-foreground">
                        申请{app.applyGrade}年级 · {app.applyClassName || '待分配班级'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground hidden md:block">
                      {app.submittedAt.split(' ')[0]}
                    </span>
                    {getStatusBadge(app.status)}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
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
              请如实填写以下信息，带 <span className="text-red-500">*</span> 为必填项
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* 学生基本信息 */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                学生基本信息
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>姓名 <span className="text-red-500">*</span></Label>
                  <Input 
                    value={formData.studentName}
                    onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                    placeholder="请输入学生姓名"
                  />
                  {errors.studentName && <p className="text-xs text-red-500">{errors.studentName}</p>}
                </div>
                <div className="space-y-2">
                  <Label>性别 <span className="text-red-500">*</span></Label>
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
                  <Label>出生日期 <span className="text-red-500">*</span></Label>
                  <Input 
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  />
                  {errors.birthDate && <p className="text-xs text-red-500">{errors.birthDate}</p>}
                </div>
                <div className="space-y-2">
                  <Label>身份证号</Label>
                  <Input 
                    value={formData.idCard}
                    onChange={(e) => setFormData({ ...formData, idCard: e.target.value })}
                    placeholder="18位身份证号码"
                    maxLength={18}
                  />
                  {errors.idCard && <p className="text-xs text-red-500">{errors.idCard}</p>}
                </div>
                <div className="space-y-2">
                  <Label>民族</Label>
                  <Select value={formData.ethnicity} onValueChange={(v) => setFormData({ ...formData, ethnicity: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="汉族">汉族</SelectItem>
                      <SelectItem value="畲族">畲族</SelectItem>
                      <SelectItem value="回族">回族</SelectItem>
                      <SelectItem value="其他">其他</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>籍贯</Label>
                  <Input 
                    value={formData.nativePlace}
                    onChange={(e) => setFormData({ ...formData, nativePlace: e.target.value })}
                    placeholder="如：福建龙岩"
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>政治面貌</Label>
                  <Input 
                    value={formData.politicalStatus}
                    onChange={(e) => setFormData({ ...formData, politicalStatus: e.target.value })}
                    placeholder="如：少先队员（可留空）"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* 申请信息 */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                申请信息
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>申请年级 <span className="text-red-500">*</span></Label>
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

            <Separator />

            {/* 家庭信息 */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Home className="h-4 w-4 text-primary" />
                家庭信息
              </h4>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>家庭类型</Label>
                  <Select value={formData.familyType} onValueChange={(v) => setFormData({ ...formData, familyType: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="核心家庭">核心家庭（父母+子女）</SelectItem>
                      <SelectItem value="单亲家庭">单亲家庭</SelectItem>
                      <SelectItem value="重组家庭">重组家庭</SelectItem>
                      <SelectItem value="隔代家庭">隔代家庭（祖辈抚养）</SelectItem>
                      <SelectItem value="其他">其他</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 家长1 */}
                <div className="bg-muted/30 p-4 rounded-lg space-y-4">
                  <p className="text-sm font-medium">主要监护人 <span className="text-red-500">*</span></p>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>姓名 <span className="text-red-500">*</span></Label>
                      <Input 
                        value={formData.parentName}
                        onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                      />
                      {errors.parentName && <p className="text-xs text-red-500">{errors.parentName}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>关系 <span className="text-red-500">*</span></Label>
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
                      <Label>联系电话 <span className="text-red-500">*</span></Label>
                      <Input 
                        value={formData.parentPhone}
                        onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                        placeholder="11位手机号"
                        maxLength={11}
                      />
                      {errors.parentPhone && <p className="text-xs text-red-500">{errors.parentPhone}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>微信号</Label>
                    <Input 
                      value={formData.parentWechat}
                      onChange={(e) => setFormData({ ...formData, parentWechat: e.target.value })}
                      placeholder="方便班级群沟通"
                    />
                  </div>
                </div>

                {/* 家长2 */}
                <div className="bg-muted/30 p-4 rounded-lg space-y-4">
                  <p className="text-sm font-medium text-muted-foreground">第二监护人（选填）</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>姓名</Label>
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
                        placeholder="11位手机号"
                        maxLength={11}
                      />
                      {errors.parent2Phone && <p className="text-xs text-red-500">{errors.parent2Phone}</p>}
                    </div>
                  </div>
                </div>

                {/* 紧急联系人 */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>紧急联系人</Label>
                    <Input 
                      value={formData.emergencyContact}
                      onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                      placeholder="非父母的其他紧急联系人"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>紧急联系电话</Label>
                    <Input 
                      value={formData.emergencyPhone}
                      onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                      placeholder="紧急联系人电话"
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* 地址信息 */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                地址信息
              </h4>
              <div className="space-y-2">
                <Label>家庭住址 <span className="text-red-500">*</span></Label>
                <Textarea
                  value={formData.homeAddress}
                  onChange={(e) => setFormData({ ...formData, homeAddress: e.target.value })}
                  placeholder="请输入详细家庭住址，如：龙岩市新罗区xx街道xx路xx号xx小区x栋x室"
                  rows={2}
                />
                {errors.homeAddress && <p className="text-xs text-red-500">{errors.homeAddress}</p>}
              </div>
            </div>

            {/* 提示 */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800">温馨提示</p>
                  <ul className="text-amber-700 mt-1 space-y-1">
                    <li>• 请确保所填信息真实准确，将用于学籍注册</li>
                    <li>• 身份证号将用于学籍系统实名认证</li>
                    <li>• 手机号将用于接收审核结果通知</li>
                  </ul>
                </div>
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

      {/* 申请详情对话框 */}
      <Dialog open={detailDialog} onOpenChange={setDetailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>申请详情</DialogTitle>
          </DialogHeader>
          {selectedApp && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-lg">{selectedApp.studentName}</p>
                  <p className="text-sm text-muted-foreground">
                    申请{selectedApp.applyGrade}年级
                  </p>
                </div>
                {getStatusBadge(selectedApp.status)}
              </div>
              <div className="bg-muted/30 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">提交时间</span>
                  <span>{selectedApp.submittedAt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">分配班级</span>
                  <span>{selectedApp.applyClassName || '待分配'}</span>
                </div>
                {selectedApp.notes && (
                  <div className="pt-2 border-t">
                    <span className="text-muted-foreground">备注：</span>
                    <span>{selectedApp.notes}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialog(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
