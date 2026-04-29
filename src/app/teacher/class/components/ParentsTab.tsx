'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Phone, Mail, Search, Plus, UserPlus, MoreHorizontal, Loader2, User, Home, MessageCircle, Trash2,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { StudentBasicInfo } from '@/hooks/useClasses';
import type { Parent } from '@/types';

interface Props {
  students: StudentBasicInfo[];
  loading: boolean;
  onRefresh: () => void;
}

// 获取主要家长（优先母亲，其次父亲）
function getPrimaryParent(parents: Parent[] | undefined): Parent | null {
  if (!parents || parents.length === 0) return null;
  const mother = parents.find(p => p.relationship === '母亲');
  const father = parents.find(p => p.relationship === '父亲');
  return mother || father || parents[0];
}

export function ParentsTab({ students, loading, onRefresh }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [newParent, setNewParent] = useState({ name: '', phone: '', relationship: '母亲' as const, wechat: '' });
  const [saving, setSaving] = useState(false);

  const filteredStudents = students.filter(s =>
    !searchTerm || s.name.includes(searchTerm) || s.studentNo?.includes(searchTerm)
  );

  const handleAddParent = async () => {
    if (!newParent.name || !newParent.phone || !selectedStudentId) return;
    setSaving(true);
    try {
      const res = await fetch('/api/parents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...newParent, studentId: selectedStudentId }),
      });
      const result = await res.json();
      if (result.success) {
        setAddDialogOpen(false);
        setNewParent({ name: '', phone: '', relationship: '母亲', wechat: '' });
        onRefresh();
      }
    } catch {
      // error handled silently
    } finally {
      setSaving(false);
    }
  };

  const relationshipLabels: Record<string, string> = {
    father: '父亲', mother: '母亲', grandfather: '爷爷/外公', grandmother: '奶奶/外婆', other: '其他',
  };

  const relationshipColors: Record<string, string> = {
    father: 'bg-blue-100 text-blue-700',
    mother: 'bg-pink-100 text-pink-700',
    grandfather: 'bg-amber-100 text-amber-700',
    grandmother: 'bg-purple-100 text-purple-700',
    other: 'bg-gray-100 text-gray-700',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 搜索栏 */}
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索学生姓名或学号..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button size="sm" onClick={() => {
          setSelectedStudentId(students[0]?.id || '');
          setAddDialogOpen(true);
        }}>
          <UserPlus className="h-4 w-4 mr-1.5" />添加家长
        </Button>
      </div>

      {/* 家长列表 */}
      <div className="space-y-3">
        {filteredStudents.map(student => {
          const primary = getPrimaryParent(student.parents);
          return (
            <Card key={student.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center gap-2 min-w-[120px]">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {student.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{student.name}</p>
                        <p className="text-xs text-muted-foreground">{student.studentNo}</p>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-wrap gap-3">
                      {student.parents && student.parents.length > 0 ? (
                        student.parents.map((parent, idx) => (
                          <div key={idx} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50">
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${relationshipColors[parent.relationship ?? ''] || 'bg-gray-100 text-gray-700'}`}>
                              {relationshipLabels[parent.relationship ?? ''] || parent.relationship}
                            </Badge>
                            <span className="text-sm font-medium">{parent.name}</span>
                            {parent.phone && (
                              <a href={`tel:${parent.phone}`} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                                <Phone className="h-3 w-3" />{parent.phone}
                              </a>
                            )}
                            {parent.wechat && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <MessageCircle className="h-3 w-3" />{parent.wechat}
                              </span>
                            )}
                          </div>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">暂无家长信息</span>
                      )}
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        setSelectedStudentId(student.id);
                        setAddDialogOpen(true);
                      }}>
                        <UserPlus className="h-4 w-4 mr-2" />添加家长
                      </DropdownMenuItem>
                      {primary?.phone && (
                        <DropdownMenuItem onClick={() => window.open(`tel:${primary.phone}`)}>
                          <Phone className="h-4 w-4 mr-2" />联系家长
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredStudents.length === 0 && (
        <Card className="py-12">
          <CardContent className="text-center">
            <User className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">暂无家长信息</p>
          </CardContent>
        </Card>
      )}

      {/* 添加家长弹窗 */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>添加家长</DialogTitle>
            <DialogDescription>为学生添加家长联系方式</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>学生</Label>
              <select
                className="w-full mt-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedStudentId}
                onChange={e => setSelectedStudentId(e.target.value)}
              >
                <option value="">选择学生</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.studentNo})</option>
                ))}
              </select>
            </div>
            <div>
              <Label>姓名 *</Label>
              <Input value={newParent.name} onChange={e => setNewParent(p => ({ ...p, name: e.target.value }))} placeholder="家长姓名" className="mt-1.5" />
            </div>
            <div>
              <Label>关系 *</Label>
              <select
                className="w-full mt-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={newParent.relationship}
                onChange={e => setNewParent(p => ({ ...p, relationship: e.target.value as typeof newParent.relationship }))}
              >
                {Object.entries(relationshipLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>电话 *</Label>
              <Input value={newParent.phone} onChange={e => setNewParent(p => ({ ...p, phone: e.target.value }))} placeholder="手机号" className="mt-1.5" />
            </div>
            <div>
              <Label>微信</Label>
              <Input value={newParent.wechat} onChange={e => setNewParent(p => ({ ...p, wechat: e.target.value }))} placeholder="微信号（选填）" className="mt-1.5" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>取消</Button>
            <Button onClick={handleAddParent} disabled={saving || !newParent.name || !newParent.phone || !selectedStudentId}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
