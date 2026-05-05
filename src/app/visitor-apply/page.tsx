/**
 * 访客通行申请页面 (公开，无需登录)
 */

'use client';

import { useState } from 'react';
import type { ApplicationStatus } from '@/repositories/access-control.repository';

type ApplicantType = 'parent' | 'visitor';

type FormData = {
  applicantType: ApplicantType;
  applicantName: string;
  applicantPhone: string;
  idCard: string;
  photoUrl: string;
  purpose: string;
  targetPerson: string;
  targetDepartment: string;
  relation: string;
  studentName: string;
  studentId: string;
  expectedDate: string;
  expectedTimeStart: string;
  expectedTimeEnd: string;
  remark: string;
};

const initialForm: FormData = {
  applicantType: 'visitor',
  applicantName: '',
  applicantPhone: '',
  idCard: '',
  photoUrl: '',
  purpose: '',
  targetPerson: '',
  targetDepartment: '',
  relation: '',
  studentName: '',
  studentId: '',
  expectedDate: '',
  expectedTimeStart: '09:00',
  expectedTimeEnd: '17:00',
  remark: '',
};

export default function VisitorApplyPage() {
  const [form, setForm] = useState<FormData>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const updateForm = (field: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.applicantName.trim()) {
      setResult({ success: false, message: '请输入姓名' });
      return;
    }
    if (!form.purpose.trim()) {
      setResult({ success: false, message: '请输入来访事由' });
      return;
    }
    if (!form.expectedDate) {
      setResult({ success: false, message: '请选择来访日期' });
      return;
    }
    if (!form.photoUrl) {
      setResult({ success: false, message: '请上传本人照片，用于门禁人脸识别' });
      return;
    }

    setSubmitting(true);
    setResult(null);

    try {
      const res = await fetch('/api/access/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();

      if (json.success) {
        setResult({ success: true, message: '申请已提交，请等待审批结果' });
        setForm(initialForm);
      } else {
        setResult({ success: false, message: json.error?.message || '提交失败，请稍后重试' });
      }
    } catch {
      setResult({ success: false, message: '网络错误，请稍后重试' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* 顶部栏 */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">校园通行申请</h1>
            <p className="text-xs text-muted-foreground">访客与家长入校申请</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* 结果提示 */}
        {result && (
          <div className={`mb-6 p-4 rounded-lg border ${result.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-destructive/10 border-destructive/20 text-destructive'}`}>
            <div className="flex items-center gap-2">
              {result.success ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              )}
              <span className="text-sm font-medium">{result.message}</span>
            </div>
          </div>
        )}

        {/* 申请人类型 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-foreground mb-2">申请人身份</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => updateForm('applicantType', 'visitor')}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                form.applicantType === 'visitor'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="text-base font-medium text-foreground">访客</div>
              <div className="text-xs text-muted-foreground mt-1">外来人员入校办事</div>
            </button>
            <button
              type="button"
              onClick={() => updateForm('applicantType', 'parent')}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                form.applicantType === 'parent'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="text-base font-medium text-foreground">家长</div>
              <div className="text-xs text-muted-foreground mt-1">学生家长入校</div>
            </button>
          </div>
        </div>

        {/* 基本信息 */}
        <div className="bg-card border rounded-xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">基本信息</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">姓名 <span className="text-destructive">*</span></label>
              <input
                type="text"
                value={form.applicantName}
                onChange={e => updateForm('applicantName', e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                placeholder="请输入姓名"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">联系电话</label>
              <input
                type="tel"
                value={form.applicantPhone}
                onChange={e => updateForm('applicantPhone', e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                placeholder="请输入手机号"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">身份证号</label>
              <input
                type="text"
                value={form.idCard}
                onChange={e => updateForm('idCard', e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                placeholder="请输入身份证号"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">来访事由 <span className="text-destructive">*</span></label>
              <input
                type="text"
                value={form.purpose}
                onChange={e => updateForm('purpose', e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                placeholder="如：家长会、设备维修等"
              />
            </div>
          </div>
        </div>

        {/* 照片上传 */}
        <div className="bg-card border rounded-xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-1">本人照片 <span className="text-destructive">*</span></h2>
          <p className="text-xs text-muted-foreground mb-4">用于门禁人脸识别通行，请上传正面免冠照</p>
          {form.photoUrl ? (
            <div className="relative group w-32 h-32 mx-auto rounded-xl overflow-hidden border bg-muted/20">
              <img src={form.photoUrl} alt="申请人照片" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => updateForm('photoUrl', '')}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-background/80 border shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ) : (
            <label className="block w-32 h-32 mx-auto border-2 border-dashed rounded-xl cursor-pointer hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-1.5 bg-muted/5">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file || !file.type.startsWith('image/')) return;
                  if (file.size > 10 * 1024 * 1024) {
                    setResult({ success: false, message: '照片不能超过10MB' });
                    return;
                  }
                  try {
                    const fd = new FormData();
                    fd.append('file', file);
                    fd.append('folder', 'access-photos');
                    const res = await fetch('/api/upload', { method: 'POST', body: fd });
                    const data = await res.json();
                    if (data.success && data.data?.url) {
                      updateForm('photoUrl', data.data.url);
                    } else {
                      setResult({ success: false, message: '照片上传失败，请重试' });
                    }
                  } catch {
                    setResult({ success: false, message: '照片上传失败，请重试' });
                  }
                }}
              />
              <svg className="w-8 h-8 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              <span className="text-xs text-muted-foreground">点击上传照片</span>
            </label>
          )}
          <p className="text-[10px] text-muted-foreground/60 text-center mt-2">支持 JPG/PNG，建议正面免冠照</p>
        </div>

        {/* 被访信息 */}
        <div className="bg-card border rounded-xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">被访信息</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">被访人</label>
              <input
                type="text"
                value={form.targetPerson}
                onChange={e => updateForm('targetPerson', e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                placeholder="被访教师或负责人姓名"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">被访部门</label>
              <input
                type="text"
                value={form.targetDepartment}
                onChange={e => updateForm('targetDepartment', e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                placeholder="如：教务处、一年级1班"
              />
            </div>
            {form.applicantType === 'parent' && (
              <>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">与学生关系</label>
                  <input
                    type="text"
                    value={form.relation}
                    onChange={e => updateForm('relation', e.target.value)}
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    placeholder="如：父亲、母亲"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">学生姓名</label>
                  <input
                    type="text"
                    value={form.studentName}
                    onChange={e => updateForm('studentName', e.target.value)}
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    placeholder="在校就读的学生姓名"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* 时间信息 */}
        <div className="bg-card border rounded-xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">来访时间</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">来访日期 <span className="text-destructive">*</span></label>
              <input
                type="date"
                value={form.expectedDate}
                onChange={e => updateForm('expectedDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">开始时间</label>
              <input
                type="time"
                value={form.expectedTimeStart}
                onChange={e => updateForm('expectedTimeStart', e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">结束时间</label>
              <input
                type="time"
                value={form.expectedTimeEnd}
                onChange={e => updateForm('expectedTimeEnd', e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* 备注 */}
        <div className="bg-card border rounded-xl p-6 mb-6">
          <label className="block text-xs text-muted-foreground mb-1">备注</label>
          <textarea
            value={form.remark}
            onChange={e => updateForm('remark', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
            placeholder="其他需要说明的信息"
          />
        </div>

        {/* 提交 */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? '提交中...' : '提交申请'}
        </button>

        <p className="text-xs text-muted-foreground text-center mt-4">
          提交后请等待学校审批，审批通过后方可入校
        </p>
      </main>
    </div>
  );
}
