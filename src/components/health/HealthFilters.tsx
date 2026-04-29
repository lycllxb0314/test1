/**
 * 健康模块公共筛选器 + 分页组件
 *
 * GradeClassFilter  —— 年级 / 班级级联筛选
 * PaginationControl —— 统一分页控件（复用家长管理分页风格）
 */
'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// ===================== 类型 =====================

type ClassInfo = { id: string; name: string; gradeNumber: number; className?: string };

type GradeClassFilterProps = {
  /** 选中的年级（数字字符串，如 '1' ~ '6'），'all' 为全部 */
  grade: string;
  onGradeChange: (grade: string) => void;
  /** 选中的班级 id，'all' 为全部 */
  classId: string;
  onClassIdChange: (classId: string) => void;
};

type PaginationControlProps = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

// ===================== 班级数据 Hook =====================

export function useClassesData() {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/classes');
      const result = await res.json();
      if (result.success) {
        setClasses(
          (result.data || []).map((c: Record<string, unknown>) => ({
            id: c.id as string,
            name: c.name as string,
            gradeNumber: (c.gradeNumber ?? c.grade ?? c.grade_number ?? 0) as number,
          })),
        );
      }
    } catch (err) {
      console.error('[useClassesData] load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // 按年级分组
  const gradeOptions = [...new Set(classes.map(c => c.gradeNumber))]
    .filter(Boolean)
    .sort((a, b) => a - b);

  const classesByGrade = (grade: number | string) =>
    grade === 'all'
      ? classes
      : classes.filter(c => String(c.gradeNumber) === String(grade));

  return { classes, loading, gradeOptions, classesByGrade };
}

// ===================== 年级 / 班级筛选器 =====================

const GRADE_LABELS: Record<string, string> = {
  '1': '一年级', '2': '二年级', '3': '三年级',
  '4': '四年级', '5': '五年级', '6': '六年级',
};

export function GradeClassFilter({ grade, onGradeChange, classId, onClassIdChange }: GradeClassFilterProps) {
  const { gradeOptions, classesByGrade } = useClassesData();

  const filteredClasses = classesByGrade(grade);

  return (
    <>
      <Select value={grade} onValueChange={v => { onGradeChange(v); onClassIdChange('all'); }}>
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="全部年级" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部年级</SelectItem>
          {gradeOptions.map(g => (
            <SelectItem key={g} value={String(g)}>{GRADE_LABELS[String(g)] || `${g}年级`}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={classId} onValueChange={onClassIdChange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="全部班级" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部班级</SelectItem>
          {filteredClasses.map(c => (
            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}

// ===================== 分页控件 =====================

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export function PaginationControl({
  page, pageSize, total, totalPages,
  onPageChange, onPageSizeChange,
}: PaginationControlProps) {
  if (total === 0) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border">
      <div className="flex items-center gap-4">
        <p className="text-sm text-muted-foreground">
          共 {total} 条记录，第 {page}/{totalPages} 页
        </p>
        <Select
          value={String(pageSize)}
          onValueChange={v => onPageSizeChange(parseInt(v, 10))}
        >
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZE_OPTIONS.map(s => (
              <SelectItem key={s} value={String(s)}>{s} 条/页</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm px-2 text-muted-foreground">{page} / {totalPages}</span>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
