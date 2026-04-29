'use client';

import { useEffect, useState, useRef } from 'react';
import { apiClient } from '@/services/api-client';
import type { FitnessAssessment } from '@/types/health-management';
import {
  Upload,
  Download,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  Search,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function FitnessPage() {
  const [assessments, setAssessments] = useState<FitnessAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [semester, setSemester] = useState('上学期');
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ success: boolean; message: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadAssessments();
  }, [academicYear, semester]);

  const loadAssessments = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<FitnessAssessment[]>(
        `/health/fitness?academicYear=${academicYear}&semester=${semester}`
      );
      if (res.success && res.data) {
        setAssessments(res.data);
      }
    } catch (err) {
      console.error('[FitnessPage] load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // 读取 Excel/CSV 文件并解析
      const text = await file.text();
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) {
        setUploadResult({ success: false, message: '文件为空或格式不正确' });
        return;
      }

      // 解析 CSV（简化版，支持从模板导出的格式）
      const headers = lines[0].split(',').map(h => h.trim());
      const records = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length < 2) continue;

        const record: Record<string, unknown> = {
          academicYear,
          semester,
          testDate: new Date().toISOString().split('T')[0],
        };
        for (let j = 0; j < headers.length; j++) {
          const header = headers[j];
          const val = values[j];
          if (!val) continue;

          if (header === '学号') record.studentId = val;
          else if (header === '身高(cm)') record.heightCm = parseFloat(val) || undefined;
          else if (header === '体重(kg)') record.weightKg = parseFloat(val) || undefined;
          else if (header === 'BMI') record.bmi = parseFloat(val) || undefined;
          else if (header === '肺活量(ml)') record.vitalCapacity = parseInt(val) || undefined;
          else if (header === '50米跑(秒)') record.run50m = parseFloat(val) || undefined;
          else if (header === '坐位体前屈(cm)') record.sitAndReach = parseFloat(val) || undefined;
          else if (header === '1分钟仰卧起坐(次)') record.sitUps1min = parseInt(val) || undefined;
          else if (header === '1分钟跳绳(次)') record.ropeJump1min = parseInt(val) || undefined;
          else if (header === '总分') record.totalScore = parseFloat(val) || undefined;
          else if (header === '等级') record.gradeLevel = val;
          else if (header === '左眼视力') record.visionLeft = parseFloat(val) || undefined;
          else if (header === '右眼视力') record.visionRight = parseFloat(val) || undefined;
        }

        if (record.studentId) records.push(record);
      }

      if (records.length === 0) {
        setUploadResult({ success: false, message: '未解析到有效数据，请检查文件格式' });
        return;
      }

      const res = await apiClient.post<{ imported: number }>('/health/fitness', records);
      if (res.success && res.data) {
        setUploadResult({ success: true, message: `成功导入 ${res.data.imported} 条记录` });
        loadAssessments();
      } else {
        setUploadResult({ success: false, message: '导入失败，请检查数据格式' });
      }
    } catch (err) {
      setUploadResult({ success: false, message: '文件解析错误' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const downloadTemplate = () => {
    const headers = '学号,身高(cm),体重(kg),BMI,肺活量(ml),50米跑(秒),坐位体前屈(cm),1分钟仰卧起坐(次),1分钟跳绳(次),总分,等级,左眼视力,右眼视力';
    const blob = new Blob([headers + '\n'], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `体质测试导入模板_${academicYear}_${semester}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredAssessments = assessments.filter(a =>
    !searchQuery || a.studentId?.includes(searchQuery) || a.studentName?.includes(searchQuery)
  );

  const gradeLevelColor = (level?: string) => {
    if (level === '优秀') return 'text-emerald-600 bg-emerald-50';
    if (level === '良好') return 'text-teal-600 bg-teal-50';
    if (level === '及格') return 'text-amber-600 bg-amber-50';
    if (level === '不及格') return 'text-rose-600 bg-rose-50';
    return 'text-gray-500 bg-gray-50';
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 p-2.5 text-white">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">体质数据管理</h1>
              <p className="text-xs text-muted-foreground">体质测评与体检数据导入、管理</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6">
        {/* 操作栏 */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <select
              value={academicYear}
              onChange={e => setAcademicYear(e.target.value)}
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
            >
              <option value="2025-2026">2025-2026学年</option>
              <option value="2024-2025">2024-2025学年</option>
              <option value="2023-2024">2023-2024学年</option>
            </select>
            <select
              value={semester}
              onChange={e => setSemester(e.target.value)}
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
            >
              <option value="上学期">上学期</option>
              <option value="下学期">下学期</option>
            </select>
          </div>

          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索学号或姓名..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="mr-1.5 h-4 w-4" />
              下载模板
            </Button>
            <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              <Upload className="mr-1.5 h-4 w-4" />
              {uploading ? '导入中...' : '导入数据'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        </div>

        {/* 上传结果提示 */}
        {uploadResult && (
          <div className={`mb-4 flex items-center gap-2 rounded-lg p-3 text-sm ${
            uploadResult.success ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
          }`}>
            {uploadResult.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {uploadResult.message}
            <button onClick={() => setUploadResult(null)} className="ml-auto"><X className="h-3.5 w-3.5" /></button>
          </div>
        )}

        {/* 数据表格 */}
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">学号</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">身高(cm)</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">体重(kg)</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">BMI</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">肺活量</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">50米跑</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">体前屈</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">仰卧起坐</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">跳绳</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">总分</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">等级</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">视力</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={12} className="py-12 text-center text-muted-foreground">加载中...</td></tr>
                ) : filteredAssessments.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-12 text-center">
                      <FileSpreadsheet className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                      <p className="text-muted-foreground">暂无数据</p>
                      <p className="mt-1 text-xs text-muted-foreground/70">点击&ldquo;下载模板&rdquo;获取导入格式，再&ldquo;导入数据&rdquo;</p>
                    </td>
                  </tr>
                ) : (
                  filteredAssessments.map(a => (
                    <tr key={a.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">{a.studentId}</td>
                      <td className="px-4 py-3 text-center">{a.heightCm ?? '-'}</td>
                      <td className="px-4 py-3 text-center">{a.weightKg ?? '-'}</td>
                      <td className="px-4 py-3 text-center font-medium">{a.bmi ?? '-'}</td>
                      <td className="px-4 py-3 text-center">{a.vitalCapacity ?? '-'}</td>
                      <td className="px-4 py-3 text-center">{a.run50m ?? '-'}</td>
                      <td className="px-4 py-3 text-center">{a.sitAndReach ?? '-'}</td>
                      <td className="px-4 py-3 text-center">{a.sitUps1min ?? '-'}</td>
                      <td className="px-4 py-3 text-center">{a.ropeJump1min ?? '-'}</td>
                      <td className="px-4 py-3 text-center font-medium">{a.totalScore ?? '-'}</td>
                      <td className="px-4 py-3 text-center">
                        {a.gradeLevel ? (
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${gradeLevelColor(a.gradeLevel)}`}>
                            {a.gradeLevel}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 text-center text-xs">
                        {a.visionLeft || a.visionRight
                          ? `${a.visionLeft ?? '-'}/${a.visionRight ?? '-'}`
                          : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t border-border bg-muted/30 px-4 py-2.5 text-xs text-muted-foreground">
            共 {filteredAssessments.length} 条记录 · {academicYear} {semester}
          </div>
        </div>
      </div>
    </div>
  );
}

function Activity(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/>
    </svg>
  );
}
