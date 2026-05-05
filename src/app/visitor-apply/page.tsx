/**
 * 访客预约申请页面（门户公开页面）
 * 访客和家长可在此提交入校申请
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { DoorOpen, CheckCircle, Clock, AlertCircle, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';

type ApplyStep = 'form' | 'success';

type ApplicationResult = {
  id: string;
  status: string;
  expectedDate: string;
};

export default function VisitorApplyPage() {
  const [step, setStep] = useState<ApplyStep>('form');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ApplicationResult | null>(null);

  // 表单状态
  const [applicantType, setApplicantType] = useState<'parent' | 'visitor'>('visitor');
  const [applicantName, setApplicantName] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [idCard, setIdCard] = useState('');
  const [purpose, setPurpose] = useState('');
  const [targetPerson, setTargetPerson] = useState('');
  const [targetDepartment, setTargetDepartment] = useState('');
  const [relation, setRelation] = useState('');
  const [studentName, setStudentName] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [expectedTimeStart, setExpectedTimeStart] = useState('');
  const [expectedTimeEnd, setExpectedTimeEnd] = useState('');
  const [remark, setRemark] = useState('');

  const handleSubmit = async () => {
    // 基本验证
    if (!applicantName.trim()) { toast.error('请输入姓名'); return; }
    if (!applicantPhone.trim()) { toast.error('请输入联系电话'); return; }
    if (!purpose.trim()) { toast.error('请输入来访事由'); return; }
    if (!expectedDate) { toast.error('请选择来访日期'); return; }
    if (!expectedTimeStart || !expectedTimeEnd) { toast.error('请选择来访时段'); return; }
    if (applicantType === 'parent' && !studentName.trim()) { toast.error('请输入关联学生姓名'); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/access/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantType,
          applicantName,
          applicantPhone,
          idCard: idCard || undefined,
          purpose,
          targetPerson: targetPerson || undefined,
          targetDepartment: targetDepartment || undefined,
          relation: applicantType === 'parent' ? relation : undefined,
          studentName: applicantType === 'parent' ? studentName : undefined,
          expectedDate,
          expectedTimeStart,
          expectedTimeEnd,
          remark: remark || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.data);
        setStep('success');
        toast.success('申请提交成功');
      } else {
        toast.error(data.error?.message || '提交失败');
      }
    } catch (err) {
      toast.error('网络错误，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'success' && result) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-6 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold">申请提交成功</h2>
            <p className="text-muted-foreground">您的入校申请已提交，请等待审批</p>
            <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">申请编号</span>
                <span className="font-mono">{result.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">来访日期</span>
                <span>{result.expectedDate}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">审批状态</span>
                <Badge className="bg-amber-100 text-amber-800">待审批</Badge>
              </div>
            </div>
            <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground bg-blue-50 rounded-lg p-3">
              <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <span>审批通过后，请在约定时间内凭身份证入校，超时需重新申请</span>
            </div>
            <Button className="w-full" onClick={() => { setStep('form'); setResult(null); }}>
              继续申请
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      {/* 顶部栏 */}
      <div className="bg-gradient-to-r from-[#C9A96E] to-[#B89B6E] text-white">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <DoorOpen className="h-8 w-8" />
            <div>
              <h1 className="text-xl font-bold">访客预约</h1>
              <p className="text-white/80 text-sm">福建省龙岩师范附属小学</p>
            </div>
          </div>
        </div>
      </div>

      {/* 表单区域 */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* 须知 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">入校须知</p>
                <p>1. 访客入校需提前申请，经审批通过后方可入校</p>
                <p>2. 通行时间以申请时段为准，超时需重新申请</p>
                <p>3. 入校时请携带身份证件，配合门禁验证</p>
                <p>4. 家长需注明关联学生信息</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 申请类型选择 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">申请类型</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <button
                className={`p-4 rounded-lg border-2 text-center transition-all ${
                  applicantType === 'visitor'
                    ? 'border-primary bg-primary/5'
                    : 'border-muted hover:border-muted-foreground/30'
                }`}
                onClick={() => setApplicantType('visitor')}
              >
                <DoorOpen className={`h-6 w-6 mx-auto mb-1 ${applicantType === 'visitor' ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`text-sm font-medium ${applicantType === 'visitor' ? 'text-primary' : 'text-muted-foreground'}`}>访客</span>
              </button>
              <button
                className={`p-4 rounded-lg border-2 text-center transition-all ${
                  applicantType === 'parent'
                    ? 'border-primary bg-primary/5'
                    : 'border-muted hover:border-muted-foreground/30'
                }`}
                onClick={() => setApplicantType('parent')}
              >
                <svg className={`h-6 w-6 mx-auto mb-1 ${applicantType === 'parent' ? 'text-primary' : 'text-muted-foreground'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span className={`text-sm font-medium ${applicantType === 'parent' ? 'text-primary' : 'text-muted-foreground'}`}>家长</span>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* 基本信息 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">基本信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>姓名 *</Label>
                <Input placeholder="请输入姓名" value={applicantName} onChange={(e) => setApplicantName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>联系电话 *</Label>
                <Input placeholder="请输入手机号" value={applicantPhone} onChange={(e) => setApplicantPhone(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>身份证号</Label>
              <Input placeholder="请输入身份证号（选填）" value={idCard} onChange={(e) => setIdCard(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* 来访信息 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">来访信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>来访事由 *</Label>
              <Textarea placeholder="请简述来访事由" value={purpose} onChange={(e) => setPurpose(e.target.value)} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>被访人</Label>
                <Input placeholder="请输入被访人姓名" value={targetPerson} onChange={(e) => setTargetPerson(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>被访部门</Label>
                <Input placeholder="如：教务处、一年级组" value={targetDepartment} onChange={(e) => setTargetDepartment(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>来访日期 *</Label>
                <Input type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>开始时间 *</Label>
                <Input type="time" value={expectedTimeStart} onChange={(e) => setExpectedTimeStart(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>结束时间 *</Label>
                <Input type="time" value={expectedTimeEnd} onChange={(e) => setExpectedTimeEnd(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 家长专属信息 */}
        {applicantType === 'parent' && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">家长信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>学生姓名 *</Label>
                  <Input placeholder="请输入学生姓名" value={studentName} onChange={(e) => setStudentName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>与学生关系</Label>
                  <Select value={relation} onValueChange={setRelation}>
                    <SelectTrigger><SelectValue placeholder="请选择" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="father">父亲</SelectItem>
                      <SelectItem value="mother">母亲</SelectItem>
                      <SelectItem value="grandfather">祖父</SelectItem>
                      <SelectItem value="grandmother">祖母</SelectItem>
                      <SelectItem value="other">其他</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 备注 */}
        <Card>
          <CardContent className="pt-4 space-y-2">
            <Label>备注</Label>
            <Textarea placeholder="其他需要说明的事项（选填）" value={remark} onChange={(e) => setRemark(e.target.value)} rows={2} />
          </CardContent>
        </Card>

        {/* 提交 */}
        <Button className="w-full h-12 text-base" onClick={handleSubmit} disabled={submitting}>
          {submitting ? '提交中...' : '提交申请'}
        </Button>

        <p className="text-center text-xs text-muted-foreground pb-4">
          提交即表示您同意遵守学校入校管理规定
        </p>
      </div>
    </div>
  );
}
