/**
 * 门禁人员管理组件
 * 教师/学生数据自动从教务系统展示，家长/访客从门禁表展示
 * 照片上传后自动触发人脸向量生成
 */

'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ImageUploader } from '@/components/ui/image-uploader';
import { useAccessPersons } from '@/hooks/useAccessControl';
import { Search, RefreshCw, ScanFace, Upload, ChevronLeft, ChevronRight } from 'lucide-react';
import type { AccessPerson, PersonType } from '@/repositories/access-control.repository';
import { toast } from 'sonner';

const personTypeLabels: Record<PersonType, string> = {
  teacher: '教师', student: '学生', parent: '家长', visitor: '访客',
};

const personTypeBadgeStyles: Record<PersonType, string> = {
  teacher: 'bg-primary/10 text-primary',
  student: 'bg-emerald-500/10 text-emerald-700',
  parent: 'bg-amber-500/10 text-amber-700',
  visitor: 'bg-violet-500/10 text-violet-700',
};

export function AccessPersonPanel() {
  const [personType, setPersonType] = useState<PersonType | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const { data, total, loading, refresh, updatePhoto } = useAccessPersons({
    personType,
    search: search || undefined,
    page,
    pageSize,
  });

  const [photoPerson, setPhotoPerson] = useState<AccessPerson | null>(null);
  const [uploading, setUploading] = useState(false);

  const handlePhotoChange = useCallback(async (url: string | undefined) => {
    if (!url || !photoPerson) return;
    setUploading(true);
    try {
      await updatePhoto(photoPerson.id, url, {
        name: photoPerson.name,
        personType: photoPerson.personType,
        department: photoPerson.department,
        relatedId: photoPerson.relatedId,
      });
      toast.success('照片已更新，人脸向量正在生成中...');
      setPhotoPerson(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '更新失败');
    } finally {
      setUploading(false);
    }
  }, [photoPerson, updatePhoto]);

  const totalPages = Math.ceil(total / pageSize);

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
        <Button variant="outline" size="sm" onClick={refresh}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* 人员表格 */}
      <Card className="border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-20">类型</TableHead>
                <TableHead>姓名</TableHead>
                <TableHead>部门/班级</TableHead>
                <TableHead>联系电话</TableHead>
                <TableHead className="w-28">有效期</TableHead>
                <TableHead className="w-24">人脸</TableHead>
                <TableHead className="w-20">照片</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">加载中...</TableCell></TableRow>
              ) : data.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">暂无数据</TableCell></TableRow>
              ) : data.map((person) => (
                <TableRow key={person.id}>
                  <TableCell>
                    <Badge variant="secondary" className={personTypeBadgeStyles[person.personType]}>
                      {personTypeLabels[person.personType]}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{person.name}</TableCell>
                  <TableCell className="text-muted-foreground">{person.department || '-'}</TableCell>
                  <TableCell className="text-muted-foreground">{person.phone || '-'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {person.validFrom && person.validUntil
                      ? `${person.validFrom} ~ ${person.validUntil}`
                      : person.validFrom ? '长期有效' : '-'}
                  </TableCell>
                  <TableCell>
                    {person.hasFaceVector ? (
                      <div className="flex items-center gap-1 text-emerald-600">
                        <ScanFace className="h-4 w-4" />
                        <span className="text-xs font-medium">已录入</span>
                      </div>
                    ) : person.photoUrl ? (
                      <div className="flex items-center gap-1 text-amber-600">
                        <ScanFace className="h-4 w-4" />
                        <span className="text-xs font-medium">待录入</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">无照片</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPhotoPerson(person)}
                      title={person.photoUrl ? '更换照片' : '上传照片'}
                    >
                      <Upload className="h-4 w-4 text-muted-foreground" />
                    </Button>
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

      {/* 照片上传弹窗 */}
      <Dialog open={!!photoPerson} onOpenChange={() => setPhotoPerson(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>上传人脸照片 - {photoPerson?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-muted-foreground mb-3">
              上传照片后将自动生成人脸向量，用于后续人脸比对通行
            </p>
            <ImageUploader
              value={photoPerson?.photoUrl}
              onChange={handlePhotoChange}
              folder="access-faces"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPhotoPerson(null)} disabled={uploading}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
