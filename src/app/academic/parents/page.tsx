/**
 * 家长管理页面
 * 
 * ==================== 数据架构 ====================
 * 按照四核心 Hook 架构设计：
 * 
 * 1. useClasses（聚合根）- 获取学生、班级、班主任信息
 *    - 班级是聚合根，包含完整的学生和家长信息
 *    - 提供班级维度的筛选和统计
 * 
 * 2. useParents（家长管理）- 提供家长管理功能
 *    - 设置主要联系人
 *    - 开通账号、重置密码
 *    - 更新通知设置
 * 
 * ==================== 数据流向 ====================
 * useClasses.classes → 提取学生和家长 → 展示
 * useParents → 管理操作 → 更新数据 → refetch useClasses
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Users,
  Search,
  Download,
  Phone,
  User,
  UserCircle,
  Heart,
  Baby,
  Loader2,
  Eye,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Key,
} from 'lucide-react';
import { 
  useClasses,        // 聚合根：获取学生、班级、班主任信息
  useParents,        // 家长管理：账号、设置等管理功能
  type ParentBasicInfo,
  type ParentRelation,
} from '@/hooks';
import { toast } from 'sonner';

// 每页显示数量
const PAGE_SIZE = 15;

// 关系名称映射
const RELATION_NAMES: Record<ParentRelation, string> = {
  father: '父亲',
  mother: '母亲',
  grandfather: '爷爷/外公',
  grandmother: '奶奶/外婆',
  other: '其他',
};

// 获取关系颜色
const getRelationshipColor = (relationName: string) => {
  const colorMap: Record<string, string> = {
    '父亲': 'bg-blue-100 text-blue-700',
    '母亲': 'bg-pink-100 text-pink-700',
    '爷爷': 'bg-amber-100 text-amber-700',
    '奶奶': 'bg-rose-100 text-rose-700',
    '外公': 'bg-orange-100 text-orange-700',
    '外婆': 'bg-red-100 text-red-700',
    '爷爷/外公': 'bg-amber-100 text-amber-700',
    '奶奶/外婆': 'bg-rose-100 text-rose-700',
    '其他': 'bg-gray-100 text-gray-700',
  };
  return colorMap[relationName] || 'bg-gray-100 text-gray-700';
};

// 获取关系图标
const getRelationshipIcon = (relationName: string) => {
  const iconMap: Record<string, string> = {
    '父亲': '👨',
    '母亲': '👩',
    '爷爷': '👴',
    '奶奶': '👵',
    '外公': '👴',
    '外婆': '👵',
    '爷爷/外公': '👴',
    '奶奶/外婆': '👵',
    '其他': '👤',
  };
  return iconMap[relationName] || '👤';
};

export default function ParentsPage() {
  // ==================== 数据获取 ====================
  
  // 1. useClasses（聚合根）：获取学生、班级、班主任信息
  const { 
    classes,           // 班级容器（包含学生和家长）
    loading, 
    error, 
    refetch,
    statistics: classStatistics,
  } = useClasses();
  
  // 2. useParents：家长管理功能
  const {
    setPrimaryParent,
    createParentAccount,
    resetParentPassword,
  } = useParents();

  // 搜索和筛选状态
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [relationshipFilter, setRelationshipFilter] = useState('all');
  const [page, setPage] = useState(1);

  // 详情弹窗
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedParent, setSelectedParent] = useState<ParentBasicInfo | null>(null);

  // ==================== 从班级聚合根提取家长列表 ====================
  
  const parents = useMemo(() => {
    const parentList: ParentBasicInfo[] = [];
    
    classes.forEach(cls => {
      // 从班级容器中获取家长列表
      if (cls.parents && cls.parents.length > 0) {
        cls.parents.forEach(parent => {
          parentList.push({
            ...parent,
            // 班级信息（来自聚合根）
            classId: cls.id,
            className: cls.name,
            grade: cls.grade,
            // 班主任信息（来自聚合根）
            headTeacherId: cls.headTeacherId,
            headTeacherName: cls.headTeacherName,
          });
        });
      }
    });
    
    return parentList;
  }, [classes]);

  // 获取筛选选项
  const gradeOptions = useMemo(() => {
    const grades = [...new Set(parents.map(p => p.grade))].filter((g): g is number => typeof g === 'number').sort((a, b) => a - b);
    return grades.map(g => ({ value: g.toString(), label: `${g}年级` }));
  }, [parents]);

  const classOptions = useMemo(() => {
    return classes
      .filter(c => c.parents && c.parents.length > 0)
      .map(c => ({ value: c.id, label: `${c.name} (${c.parents.length}位家长)` }));
  }, [classes]);

  const relationshipOptions = useMemo(() => {
    const relationships = [...new Set(parents.map(p => p.relationName).filter(Boolean))];
    return relationships.map(r => ({ value: r || '', label: r || '' }));
  }, [parents]);

  // 统计数据
  const statistics = useMemo(() => ({
    total: parents.length,
    primaryCount: parents.filter(p => p.isPrimary).length,
    fatherCount: parents.filter(p => p.relationName === '父亲').length,
    motherCount: parents.filter(p => p.relationName === '母亲').length,
    grandparentCount: parents.filter(p => ['爷爷', '奶奶', '外公', '外婆', '爷爷/外公', '奶奶/外婆'].includes(p.relationName || '')).length,
    gradeDistribution: parents.reduce((acc, p) => {
      if (p.grade) {
        acc[p.grade] = (acc[p.grade] || 0) + 1;
      }
      return acc;
    }, {} as Record<number, number>),
  }), [parents]);

  // 筛选后的家长列表
  const filteredParents = useMemo(() => {
    return parents.filter(parent => {
      // 搜索过滤
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchName = parent.name.toLowerCase().includes(term);
        const matchStudentName = parent.studentName.toLowerCase().includes(term);
        const matchPhone = (parent.phone || '').includes(term);
        if (!matchName && !matchStudentName && !matchPhone) {
          return false;
        }
      }

      // 年级过滤
      if (gradeFilter !== 'all' && parent.grade !== parseInt(gradeFilter)) {
        return false;
      }

      // 班级过滤
      if (classFilter !== 'all' && parent.classId !== classFilter) {
        return false;
      }

      // 关系过滤
      if (relationshipFilter !== 'all' && parent.relationName !== relationshipFilter) {
        return false;
      }

      return true;
    });
  }, [parents, searchTerm, gradeFilter, classFilter, relationshipFilter]);

  // 分页
  const totalPages = Math.ceil(filteredParents.length / PAGE_SIZE);
  const paginatedParents = filteredParents.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  // ==================== 操作处理 ====================

  // 查看详情
  const handleViewDetail = (parent: ParentBasicInfo) => {
    setSelectedParent(parent);
    setDetailDialogOpen(true);
  };

  // 设置主要联系人
  const handleSetPrimary = useCallback(async (parent: ParentBasicInfo) => {
    const success = await setPrimaryParent(parent.studentId, parent.id);
    if (success) {
      toast.success('已设置为该学生的主要联系人');
      refetch(); // 刷新聚合根数据
    } else {
      toast.error('设置失败');
    }
  }, [setPrimaryParent, refetch]);

  // 创建家长账号
  const handleCreateAccount = useCallback(async (parent: ParentBasicInfo) => {
    const success = await createParentAccount(parent.id);
    if (success) {
      toast.success('家长账号已创建，默认密码为手机号后6位');
    } else {
      toast.error('创建账号失败');
    }
  }, [createParentAccount]);

  // 重置密码
  const handleResetPassword = useCallback(async (parent: ParentBasicInfo) => {
    const success = await resetParentPassword(parent.id);
    if (success) {
      toast.success('密码已重置为手机号后6位');
    } else {
      toast.error('重置密码失败');
    }
  }, [resetParentPassword]);

  // 导出数据
  const handleExport = () => {
    const csvContent = [
      ['家长姓名', '关系', '电话', '学生姓名', '班级', '年级', '主要联系人'].join(','),
      ...filteredParents.map(p => [
        p.name,
        p.relationName || '',
        p.phone || '',
        p.studentName,
        p.className || '',
        p.grade ? `${p.grade}年级` : '',
        p.isPrimary ? '是' : '否',
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `家长数据_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('导出成功');
  };

  // 重置筛选
  const handleReset = () => {
    setSearchTerm('');
    setGradeFilter('all');
    setClassFilter('all');
    setRelationshipFilter('all');
    setPage(1);
  };

  // 错误提示
  if (error) {
    return (
      <div className="p-6 lg:p-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-red-500">{error}</p>
            <Button variant="outline" className="mt-4" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              重试
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-purple-50/30 via-white to-pink-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">家长管理</h1>
          <p className="text-gray-500 mt-1">
            数据来源：班级聚合根 → 学生 → 家长
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <Download className="h-4 w-4" />
            导出数据
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">家长总数</p>
                <p className="text-2xl font-bold text-purple-600">{statistics.total}</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-100">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">父亲</p>
                <p className="text-2xl font-bold text-blue-600">{statistics.fatherCount}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100">
                <User className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">母亲</p>
                <p className="text-2xl font-bold text-pink-600">{statistics.motherCount}</p>
              </div>
              <div className="p-2 rounded-lg bg-pink-100">
                <User className="h-5 w-5 text-pink-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">祖辈</p>
                <p className="text-2xl font-bold text-amber-600">{statistics.grandparentCount}</p>
              </div>
              <div className="p-2 rounded-lg bg-amber-100">
                <Heart className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">主要联系人</p>
                <p className="text-2xl font-bold text-green-600">{statistics.primaryCount}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-100">
                <Phone className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和筛选 */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索家长姓名、学生姓名、电话..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>

            <Select value={gradeFilter} onValueChange={(v) => { setGradeFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="全部年级" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部年级</SelectItem>
                {gradeOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={classFilter} onValueChange={(v) => { setClassFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="全部班级" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部班级</SelectItem>
                {classOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={relationshipFilter} onValueChange={(v) => { setRelationshipFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="全部关系" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部关系</SelectItem>
                {relationshipOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={handleReset}>
              重置
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 家长列表 */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              <span className="ml-2 text-gray-500">加载中...</span>
            </div>
          ) : filteredParents.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p>暂无家长数据</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>家长姓名</TableHead>
                    <TableHead>关系</TableHead>
                    <TableHead>联系电话</TableHead>
                    <TableHead>学生姓名</TableHead>
                    <TableHead>班级</TableHead>
                    <TableHead>班主任</TableHead>
                    <TableHead>主要联系人</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedParents.map((parent) => (
                    <TableRow key={`${parent.id}-${parent.studentId}`} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getRelationshipIcon(parent.relationName || '')}</span>
                          <span className="font-medium">{parent.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRelationshipColor(parent.relationName || '')}>
                          {parent.relationName || ''}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>{parent.phone || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Baby className="h-4 w-4 text-gray-400" />
                          <span>{parent.studentName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{parent.className}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">{parent.headTeacherName || '-'}</span>
                      </TableCell>
                      <TableCell>
                        {parent.isPrimary ? (
                          <Badge className="bg-green-100 text-green-700">是</Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-400">否</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetail(parent)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          详情
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* 分页 */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-sm text-gray-500">
                    共 {filteredParents.length} 条记录，第 {page}/{totalPages} 页
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm px-2">{page} / {totalPages}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* 家长详情弹窗 */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>家长详情</DialogTitle>
            <DialogDescription>查看家长信息和管理账号</DialogDescription>
          </DialogHeader>

          {selectedParent && (
            <div className="space-y-4">
              {/* 家长信息 */}
              <div className="bg-purple-50 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-purple-900 flex items-center gap-2">
                  <UserCircle className="h-5 w-5" />
                  家长信息
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <Label className="text-gray-500">姓名</Label>
                    <p className="font-medium">{selectedParent.name}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">关系</Label>
                    <p>
                      <Badge className={getRelationshipColor(selectedParent.relationName || '')}>
                        {getRelationshipIcon(selectedParent.relationName || '')} {selectedParent.relationName || ''}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500">联系电话</Label>
                    <p className="font-medium">{selectedParent.phone || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">微信号</Label>
                    <p className="font-medium">{selectedParent.wechat || '-'}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-gray-500">主要联系人</Label>
                    <p>
                      {selectedParent.isPrimary ? (
                        <Badge className="bg-green-100 text-green-700">是</Badge>
                      ) : (
                        <Badge variant="outline">否</Badge>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* 学生信息（来自班级聚合根） */}
              <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-blue-900 flex items-center gap-2">
                  <Baby className="h-5 w-5" />
                  关联学生（来自班级聚合根）
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <Label className="text-gray-500">学生姓名</Label>
                    <p className="font-medium">{selectedParent.studentName}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">班级</Label>
                    <p className="font-medium">{selectedParent.className}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">年级</Label>
                    <p className="font-medium">{selectedParent.grade ? `${selectedParent.grade}年级` : '-'}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">班主任</Label>
                    <p className="font-medium">{selectedParent.headTeacherName || '-'}</p>
                  </div>
                </div>
              </div>

              {/* 操作按钮（来自 useParents） */}
              <div className="flex flex-wrap gap-2 pt-2">
                {!selectedParent.isPrimary && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleSetPrimary(selectedParent)}
                  >
                    <User className="h-4 w-4 mr-1" />
                    设为主要联系人
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleCreateAccount(selectedParent)}
                >
                  <Key className="h-4 w-4 mr-1" />
                  开通账号
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleResetPassword(selectedParent)}
                >
                  <Key className="h-4 w-4 mr-1" />
                  重置密码
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
