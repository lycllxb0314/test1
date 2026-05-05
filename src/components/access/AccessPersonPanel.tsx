/**
 * 门禁人员管理组件
 * 管理教师/学生/家长/访客四类人员
 */

'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAccessPersons } from '@/hooks/useAccessControl';
import { Search, RefreshCw, Download, UserPlus, ScanFace } from 'lucide-react';
import type { AccessPerson, PersonType } from '@/repositories/access-control.repository';
import { toast } from 'sonner';

const personTypeLabels: Record<PersonType, string> = {
  teacher: '教师',
  student: '学生',
  parent: '家长',
  visitor: '访客',
};

const personTypeColors: Record<PersonType, string> = {
  teacher: 'bg-blue-100 text-blue-800',
  student: 'bg-green-100 text-green-800',
  parent: 'bg-amber-100 text-amber-800',
  visitor: 'bg-purple-100 text-purple-800',
};

export function AccessPersonPanel() {
  const [personType, setPersonType] = useState<PersonType | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, total, loading, refresh, syncFromAcademic, generateFaceVector } = useAccessPersons({
    personType,
    search: search || undefined,
    page,
    pageSize: 15,
  });

  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [syncType, setSyncType] = useState<PersonType>('teacher');
  const [syncing, setSyncing] = useState(false);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    try {
      const result = await syncFromAcademic(syncType);
      toast.success(`同步完成，新增 ${result.synced} 条记录`);
      setShowSyncDialog(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '同步失败');
    } finally {
      setSyncing(false);
    }
  }, [syncType, syncFromAcademic]);

  const handleGenerateFace = useCallback(async (person: AccessPerson) => {
    if (!person.photoUrl) {
      toast.error('该人员未上传照片，无法生成人脸向量');
      return;
    }
    try {
      await generateFaceVector(person.id, person.photoUrl);
      toast.success('人脸向量生成成功');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '生成失败');
    }
  }, [generateFaceVector]);

  const totalPages = Math.ceil(total / 15);

  return (
    <div className="space-y-4">
      {/* 工具栏 */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-0">
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
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索姓名、部门..."
              className="pl-9"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowSyncDialog(true)}>
            <Download className="h-4 w-4 mr-1" /> 同步教务数据
          </Button>
          <Button variant="outline" size="sm" onClick={refresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 人员表格 */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">类型</TableHead>
                <TableHead>姓名</TableHead>
                <TableHead>部门/班级</TableHead>
                <TableHead>联系电话</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>有效期</TableHead>
                <TableHead className="w-24">人脸</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">加载中...</TableCell></TableRow>
              ) : data.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">暂无数据</TableCell></TableRow>
              ) : data.map((person) => (
                <TableRow key={person.id}>
                  <TableCell>
                    <Badge variant="secondary" className={personTypeColors[person.personType]}>
                      {personTypeLabels[person.personType]}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{person.name}</TableCell>
                  <TableCell className="text-muted-foreground">{person.department || '-'}</TableCell>
                  <TableCell className="text-muted-foreground">{person.phone || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={person.status === 'active' ? 'default' : 'secondary'}>
                      {person.status === 'active' ? '正常' : person.status === 'expired' ? '过期' : '停用'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {person.validFrom && person.validUntil
                      ? `${person.validFrom} ~ ${person.validUntil}`
                      : person.validFrom ? '长期有效' : '-'}
                  </TableCell>
                  <TableCell>
                    {person.photoUrl ? (
                      <Button variant="ghost" size="sm" onClick={() => handleGenerateFace(person)} title="生成人脸向量">
                        <ScanFace className="h-4 w-4 text-green-600" />
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">未录入</span>
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

      {/* 同步弹窗 */}
      <Dialog open={showSyncDialog} onOpenChange={setShowSyncDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>同步教务数据</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">从教务系统导入教师或学生数据到门禁系统</p>
            <Select value={syncType} onValueChange={(v) => setSyncType(v as PersonType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="teacher">教师</SelectItem>
                <SelectItem value="student">学生</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSyncDialog(false)}>取消</Button>
            <Button onClick={handleSync} disabled={syncing}>
              {syncing ? '同步中...' : '开始同步'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
