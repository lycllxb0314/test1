/**
 * 通行记录组件
 * 展示所有人员的出入记录
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
import type { PersonType, Direction } from '@/types/access';
import { Search, ArrowDownCircle, ArrowUpCircle, Thermometer } from 'lucide-react';

const personTypeLabels: Record<string, string> = { teacher: '教师', student: '学生', parent: '家长', visitor: '访客' };
const personTypeColors: Record<string, string> = {
  teacher: 'bg-blue-100 text-blue-800', student: 'bg-green-100 text-green-800',
  parent: 'bg-amber-100 text-amber-800', visitor: 'bg-purple-100 text-purple-800',
};

const methodLabels: Record<string, string> = { face: '人脸识别', card: '刷卡', manual: '人工' };

export function AccessRecordPanel() {
  const [personType, setPersonType] = useState<PersonType | undefined>(undefined);
  const [direction, setDirection] = useState<Direction | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, total, loading } = useAccessRecords({
    personType,
    direction,
    search: search || undefined,
    page,
    pageSize: 15,
  });

  const totalPages = Math.ceil(total / 15);

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
        <Select value={direction || 'all'} onValueChange={(v) => { setDirection(v === 'all' ? undefined : v as Direction); setPage(1); }}>
          <SelectTrigger className="w-24"><SelectValue placeholder="方向" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            <SelectItem value="in">进入</SelectItem>
            <SelectItem value="out">离开</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="搜索姓名、设备..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>

      {/* 记录表格 */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">方向</TableHead>
                <TableHead className="w-16">类型</TableHead>
                <TableHead>姓名</TableHead>
                <TableHead>通行时间</TableHead>
                <TableHead>设备</TableHead>
                <TableHead>验证方式</TableHead>
                <TableHead>体温</TableHead>
                <TableHead>状态</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">加载中...</TableCell></TableRow>
              ) : data.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">暂无记录</TableCell></TableRow>
              ) : data.map((rec) => (
                <TableRow key={rec.id}>
                  <TableCell>
                    {rec.direction === 'in' ? (
                      <ArrowDownCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <ArrowUpCircle className="h-5 w-5 text-orange-600" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={personTypeColors[rec.personType] || ''}>
                      {personTypeLabels[rec.personType] || rec.personType}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{rec.personName}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {rec.occurredAt ? new Date(rec.occurredAt).toLocaleString('zh-CN') : '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{rec.deviceName || '-'}</TableCell>
                  <TableCell className="text-muted-foreground">{methodLabels[rec.verifyMethod] || rec.verifyMethod}</TableCell>
                  <TableCell>
                    {rec.temperature ? (
                      <span className={`flex items-center gap-1 ${rec.temperature > 37.3 ? 'text-red-600 font-bold' : ''}`}>
                        <Thermometer className="h-3 w-3" />{rec.temperature}°C
                      </span>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    {rec.isAbnormal ? (
                      <Badge variant="destructive">异常</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">正常</Badge>
                    )}
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
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>上一页</Button>
            <span className="py-1">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>下一页</Button>
          </div>
        </div>
      )}
    </div>
  );
}
