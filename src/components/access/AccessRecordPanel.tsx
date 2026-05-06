/**
 * 通行记录面板组件
 * 所有人员出入留存记录
 */

'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAccessRecords } from '@/hooks/useAccessControl';
import { Search, ChevronLeft, ChevronRight, ArrowDownCircle, ArrowUpCircle, AlertTriangle } from 'lucide-react';
import type { PersonType } from '@/repositories/access-control.repository';

const personTypeLabels: Record<PersonType, string> = {
  teacher: '教师', student: '学生', parent: '家长', visitor: '访客', staff: '后勤人员',
};

const personTypeStyles: Record<PersonType, string> = {
  teacher: 'bg-primary/10 text-primary',
  student: 'bg-emerald-500/10 text-emerald-700',
  parent: 'bg-amber-500/10 text-amber-700',
  visitor: 'bg-violet-500/10 text-violet-700',
  staff: 'bg-orange-500/10 text-orange-700',
};

const verifyMethodLabels: Record<string, string> = {
  face: '人脸识别', card: '刷卡', manual: '人工登记',
};

export function AccessRecordPanel() {
  const [personType, setPersonType] = useState<PersonType | undefined>(undefined);
  const [direction, setDirection] = useState<'in' | 'out' | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data, total, loading } = useAccessRecords({
    personType,
    direction,
    search: search || undefined,
    page,
    pageSize,
  });

  const totalPages = Math.ceil(total / pageSize);

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-4">
      {/* 工具栏 */}
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={personType || 'all'} onValueChange={(v) => { setPersonType(v === 'all' ? undefined : v as PersonType); setPage(1); }}>
          <SelectTrigger className="w-28"><SelectValue placeholder="人员类型" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            <SelectItem value="teacher">教师</SelectItem>
            <SelectItem value="student">学生</SelectItem>
            <SelectItem value="parent">家长</SelectItem>
            <SelectItem value="visitor">访客</SelectItem>
          </SelectContent>
        </Select>
        <Select value={direction || 'all'} onValueChange={(v) => { setDirection(v === 'all' ? undefined : v as 'in' | 'out'); setPage(1); }}>
          <SelectTrigger className="w-28"><SelectValue placeholder="出入方向" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            <SelectItem value="in">进入</SelectItem>
            <SelectItem value="out">离开</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="搜索姓名..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>

      {/* 记录表格 */}
      <Card className="border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-16">方向</TableHead>
                <TableHead className="w-16">类型</TableHead>
                <TableHead>姓名</TableHead>
                <TableHead>时间</TableHead>
                <TableHead>通行方式</TableHead>
                <TableHead>设备</TableHead>
                <TableHead className="w-20">体温</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">加载中...</TableCell></TableRow>
              ) : data.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">暂无记录</TableCell></TableRow>
              ) : data.map((record) => (
                <TableRow key={record.id} className={record.isAbnormal ? 'bg-red-500/5' : ''}>
                  <TableCell>
                    {record.direction === 'in' ? (
                      <div className="flex items-center gap-1 text-emerald-600">
                        <ArrowDownCircle className="h-4 w-4" />
                        <span className="text-xs font-medium">进入</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-orange-500">
                        <ArrowUpCircle className="h-4 w-4" />
                        <span className="text-xs font-medium">离开</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={personTypeStyles[record.personType]}>
                      {personTypeLabels[record.personType]}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {record.personName}
                    {record.isAbnormal && (
                      <AlertTriangle className="inline h-3.5 w-3.5 text-red-500 ml-1" />
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatTime(record.occurredAt)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {verifyMethodLabels[record.verifyMethod ?? ''] || record.verifyMethod}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{record.deviceName || '-'}</TableCell>
                  <TableCell className="text-sm">
                    {record.temperature ? (
                      <span className={record.temperature > 37.3 ? 'text-red-600 font-medium' : 'text-muted-foreground'}>
                        {record.temperature}°C
                      </span>
                    ) : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>共 {total} 条</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span>{page} / {totalPages}</span>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
