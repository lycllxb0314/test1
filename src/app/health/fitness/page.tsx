'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { apiClient } from '@/services/api-client';
import type { FitnessAssessment } from '@/types/health-management';
import {
  Upload,
  Download,
  AlertCircle,
  CheckCircle2,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Stethoscope,
  Dumbbell,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type DataTab = 'fitness' | 'checkup';

export default function FitnessDataPage() {
  const [tab, setTab] = useState<DataTab>('fitness');
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [semester, setSemester] = useState('上学期');
  const [data, setData] = useState<FitnessAssessment[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // 分页
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [total, setTotal] = useState(0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<{
        data: FitnessAssessment[];
        pagination?: { total: number; page: number; pageSize: number; totalPages: number };
      }>(`/health/fitness?academicYear=${academicYear}&semester=${semester}&page=${page}&pageSize=${pageSize}`);
      if (res.success && res.data) {
        const d = res.data as unknown as { data: FitnessAssessment[]; pagination?: { total: number } };
        setData(d.data || []);
        setTotal(d.pagination?.total || 0);
      }
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [academicYear, semester, page, pageSize]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { setPage(1); }, [academicYear, semester]);

  // 下载模板
  const downloadTemplate = async (type: DataTab) => {
    try {
      const res = await fetch(`/api/health/fitness?template=${type}&academicYear=${academicYear}&semester=${semester}`);
      if (!res.ok) throw new Error('下载失败');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const disposition = res.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename\*?=(?:UTF-8'')?(.+)/);
      a.download = match ? decodeURIComponent(match[1]) : `${type === 'fitness' ? '体质测试' : '体检数据'}导入模板.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      setImportResult({ success: false, message: '模板下载失败' });
    }
  };

  // 导入数据
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) {
        setImportResult({ success: false, message: '文件内容为空' });
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/^\uFEFF/, ''));
      const records: Record<string, unknown>[] = [];

      for (let i = 1; i < lines.length; i++) {
        // 处理CSV中的逗号（简易方式，不考虑引号内逗号）
        const values = lines[i].split(',').map(v => v.trim());
        const record: Record<string, unknown> = {};
        headers.forEach((h, idx) => { record[h] = values[idx] || ''; });

        const rec = record as Record<string, string>;
        // 跳过空行
        if (!rec['学号'] && !rec['姓名']) continue;

        // 转换为DTO格式
        const dto: Record<string, unknown> = {
          studentNo: rec['学号'],
          studentName: rec['姓名'],
          academicYear: rec['学年'] || academicYear,
          semester: rec['学期'] || semester,
        };

        if (tab === 'fitness') {
          dto.heightCm = toNum(rec['身高(cm)']);
          dto.weightKg = toNum(rec['体重(kg)']);
          dto.bmi = toNum(rec['BMI']);
          dto.vitalCapacity = toNum(rec['肺活量(ml)']);
          dto.run50m = toNum(rec['50米跑(秒)']);
          dto.run50x8 = toNum(rec['50米×8往返跑(秒)']);
          dto.sitAndReach = toNum(rec['坐位体前屈(cm)']);
          dto.sitUps1min = toNum(rec['1分钟仰卧起坐(次)']);
          dto.ropeJump1min = toNum(rec['1分钟跳绳(次)']);
          dto.totalScore = toNum(rec['总分']);
          dto.gradeLevel = toString(rec['等级']);
        } else {
          dto.visionLeft = toNum(rec['左眼视力']);
          dto.visionRight = toNum(rec['右眼视力']);
          dto.dentalCariesLeft = toNum(rec['龋齿(左)']);
          dto.dentalCariesRight = toNum(rec['龋齿(右)']);
          dto.dentalFillingLeft = toNum(rec['已补(左)']);
          dto.dentalFillingRight = toNum(rec['已补(右)']);
          dto.dentalMissingLeft = toNum(rec['缺失(左)']);
          dto.dentalMissingRight = toNum(rec['缺失(右)']);
          dto.spineNormal = rec['脊柱正常'] === '是' || rec['脊柱正常'] === '1' ? true : rec['脊柱正常'] === '否' || rec['脊柱正常'] === '0' ? false : undefined;
          dto.systolicBp = toNum(rec['收缩压']);
          dto.diastolicBp = toNum(rec['舒张压']);
          dto.heartRate = toNum(rec['心率']);
          dto.colorBlindness = toString(rec['色觉']);
          dto.hearingLeft = toString(rec['左耳听力']);
          dto.hearingRight = toString(rec['右耳听力']);
          dto.checkupNotes = toString(rec['备注']);
        }

        records.push(dto);
      }

      if (records.length === 0) {
        setImportResult({ success: false, message: '没有有效数据行' });
        return;
      }

      const res = await apiClient.post<{ imported: number }>('/health/fitness', records);
      if (res.success) {
        const imported = (res.data as unknown as { imported: number })?.imported ?? records.length;
        setImportResult({ success: true, message: `成功导入 ${imported} 条记录` });
        loadData();
      } else {
        setImportResult({ success: false, message: '导入失败，请检查数据格式' });
      }
    } catch (err) {
      setImportResult({ success: false, message: `导入出错: ${err instanceof Error ? err.message : '未知错误'}` });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 过滤
  const filtered = searchQuery
    ? data.filter(d => (d.studentName || '').includes(searchQuery) || d.studentId.includes(searchQuery))
    : data;

  return (
    <div className="min-h-screen bg-background">
      {/* 头部 */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500 p-2.5 text-white">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">体质与体检数据</h1>
              <p className="text-xs text-muted-foreground">体质测试 + 体检数据统一管理，分别导入</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-5 space-y-5">
        {/* Tab切换 + 筛选 */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-lg border border-border bg-muted/30 p-0.5">
            <button
              onClick={() => setTab('fitness')}
              className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                tab === 'fitness' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Dumbbell className="h-4 w-4" /> 体质测试
            </button>
            <button
              onClick={() => setTab('checkup')}
              className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                tab === 'checkup' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Stethoscope className="h-4 w-4" /> 体检数据
            </button>
          </div>

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

          <div className="relative ml-auto w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜索姓名或学号..."
              className="pl-9 h-9 text-sm"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* 导入操作栏 */}
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Upload className="h-4 w-4" />
            {tab === 'fitness' ? '体质测试' : '体检数据'}导入：
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadTemplate(tab)}
          >
            <Download className="mr-1.5 h-3.5 w-3.5" /> 下载模板
          </Button>
          <Button
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
          >
            {importing ? (
              <><span className="mr-1.5 h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" /> 导入中...</>
            ) : (
              <><Upload className="mr-1.5 h-3.5 w-3.5" /> 导入数据</>
            )}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleImport}
          />
          <span className="text-xs text-muted-foreground">模板已预填学生姓名，按模板填写后导入</span>

          {importResult && (
            <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
              importResult.success ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}>
              {importResult.success ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
              {importResult.message}
            </div>
          )}
        </div>

        {/* 数据表格 */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <span className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              加载中...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <FileSpreadsheet className="mb-2 h-10 w-10 text-muted-foreground/30" />
              <p>暂无数据，请先下载模板并导入</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="sticky left-0 z-10 bg-muted/30 px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">姓名</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">学号</th>
                    {tab === 'fitness' ? (
                      <>
                        <th className="px-4 py-3 text-center font-medium text-muted-foreground whitespace-nowrap">身高(cm)</th>
                        <th className="px-4 py-3 text-center font-medium text-muted-foreground whitespace-nowrap">体重(kg)</th>
                        <th className="px-4 py-3 text-center font-medium text-muted-foreground whitespace-nowrap">BMI</th>
                        <th className="px-4 py-3 text-center font-medium text-muted-foreground whitespace-nowrap">肺活量</th>
                        <th className="px-4 py-3 text-center font-medium text-muted-foreground whitespace-nowrap">50米跑</th>
                        <th className="px-4 py-3 text-center font-medium text-muted-foreground whitespace-nowrap">往返跑</th>
                        <th className="px-4 py-3 text-center font-medium text-muted-foreground whitespace-nowrap">坐位体前屈</th>
                        <th className="px-4 py-3 text-center font-medium text-muted-foreground whitespace-nowrap">仰卧起坐</th>
                        <th className="px-4 py-3 text-center font-medium text-muted-foreground whitespace-nowrap">跳绳</th>
                        <th className="px-4 py-3 text-center font-medium text-muted-foreground whitespace-nowrap">总分</th>
                        <th className="px-4 py-3 text-center font-medium text-muted-foreground whitespace-nowrap">等级</th>
                      </>
                    ) : (
                      <>
                        <th className="px-4 py-3 text-center font-medium text-muted-foreground whitespace-nowrap">左眼视力</th>
                        <th className="px-4 py-3 text-center font-medium text-muted-foreground whitespace-nowrap">右眼视力</th>
                        <th className="px-4 py-3 text-center font-medium text-muted-foreground whitespace-nowrap">龋齿(左/右)</th>
                        <th className="px-4 py-3 text-center font-medium text-muted-foreground whitespace-nowrap">已补(左/右)</th>
                        <th className="px-4 py-3 text-center font-medium text-muted-foreground whitespace-nowrap">脊柱</th>
                        <th className="px-4 py-3 text-center font-medium text-muted-foreground whitespace-nowrap">血压</th>
                        <th className="px-4 py-3 text-center font-medium text-muted-foreground whitespace-nowrap">心率</th>
                        <th className="px-4 py-3 text-center font-medium text-muted-foreground whitespace-nowrap">色觉</th>
                        <th className="px-4 py-3 text-center font-medium text-muted-foreground whitespace-nowrap">听力</th>
                        <th className="px-4 py-3 text-center font-medium text-muted-foreground whitespace-nowrap">备注</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, idx) => (
                    <tr key={row.id || idx} className="border-b border-border/50 hover:bg-muted/10 transition-colors">
                      <td className="sticky left-0 z-10 bg-card px-4 py-2.5 font-medium text-foreground whitespace-nowrap">
                        {row.studentName || '-'}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">{row.studentId}</td>
                      {tab === 'fitness' ? (
                        <>
                          <td className="px-4 py-2.5 text-center">{row.heightCm ?? '-'}</td>
                          <td className="px-4 py-2.5 text-center">{row.weightKg ?? '-'}</td>
                          <td className="px-4 py-2.5 text-center">{row.bmi ?? '-'}</td>
                          <td className="px-4 py-2.5 text-center">{row.vitalCapacity ?? '-'}</td>
                          <td className="px-4 py-2.5 text-center">{row.run50m ?? '-'}</td>
                          <td className="px-4 py-2.5 text-center">{row.run50x8 ?? '-'}</td>
                          <td className="px-4 py-2.5 text-center">{row.sitAndReach ?? '-'}</td>
                          <td className="px-4 py-2.5 text-center">{row.sitUps1min ?? '-'}</td>
                          <td className="px-4 py-2.5 text-center">{row.ropeJump1min ?? '-'}</td>
                          <td className="px-4 py-2.5 text-center font-medium">{row.totalScore ?? '-'}</td>
                          <td className="px-4 py-2.5 text-center">
                            <GradeBadge level={row.gradeLevel} />
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-2.5 text-center">{row.visionLeft ?? '-'}</td>
                          <td className="px-4 py-2.5 text-center">{row.visionRight ?? '-'}</td>
                          <td className="px-4 py-2.5 text-center">{row.dentalCariesLeft ?? '-'}/{row.dentalCariesRight ?? '-'}</td>
                          <td className="px-4 py-2.5 text-center">{row.dentalFillingLeft ?? '-'}/{row.dentalFillingRight ?? '-'}</td>
                          <td className="px-4 py-2.5 text-center">
                            {row.spineNormal === true ? '正常' : row.spineNormal === false ? '异常' : '-'}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            {row.systolicBp && row.diastolicBp ? `${row.systolicBp}/${row.diastolicBp}` : '-'}
                          </td>
                          <td className="px-4 py-2.5 text-center">{row.heartRate ?? '-'}</td>
                          <td className="px-4 py-2.5 text-center">{row.colorBlindness ?? '-'}</td>
                          <td className="px-4 py-2.5 text-center">
                            {row.hearingLeft || row.hearingRight
                              ? `${row.hearingLeft || '-'}/${row.hearingRight || '-'}`
                              : '-'}
                          </td>
                          <td className="px-4 py-2.5 text-center text-xs text-muted-foreground max-w-[120px] truncate">
                            {row.checkupNotes ?? '-'}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 分页 */}
          {total > pageSize && (
            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <span className="text-xs text-muted-foreground">
                共 {total} 条，第 {page}/{totalPages} 页
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {getPageNumbers(page, totalPages).map((p, i) =>
                  p === '...' ? (
                    <span key={`dot-${i}`} className="px-1 text-muted-foreground">...</span>
                  ) : (
                    <Button
                      key={p}
                      variant={p === page ? 'default' : 'outline'}
                      size="sm"
                      className="min-w-[32px]"
                      onClick={() => setPage(p as number)}
                    >
                      {p}
                    </Button>
                  )
                )}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== 辅助组件 ====================

function GradeBadge({ level }: { level?: string }) {
  if (!level) return <span className="text-muted-foreground">-</span>;
  const map: Record<string, string> = {
    '优秀': 'bg-emerald-50 text-emerald-700',
    '良好': 'bg-blue-50 text-blue-700',
    '及格': 'bg-amber-50 text-amber-700',
    '不及格': 'bg-rose-50 text-rose-700',
  };
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${map[level] || 'bg-muted text-muted-foreground'}`}>
      {level}
    </span>
  );
}

// ==================== 工具函数 ====================

function toNum(v: string | undefined): number | undefined {
  if (!v || v === '' || v === '-') return undefined;
  const n = Number(v);
  return isNaN(n) ? undefined : n;
}

function toString(v: string | undefined): string | undefined {
  if (!v || v === '' || v === '-') return undefined;
  return v;
}

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '...')[] = [1];
  if (current > 3) pages.push('...');
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i);
  }
  if (current < total - 2) pages.push('...');
  pages.push(total);
  return pages;
}
