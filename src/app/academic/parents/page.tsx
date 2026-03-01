/**
 * 家长管理页面
 * 
 * 从学生数据中提取家长信息，支持：
 * - 家长列表展示
 * - 按班级、年级、关系筛选
 * - 搜索家长姓名、学生姓名、电话
 */

'use client';

import React, { useState, useMemo } from 'react';
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
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { useStudents, type ParentInfo } from '@/hooks';
import { toast } from 'sonner';

// 每页显示数量
const PAGE_SIZE = 15;

// 获取关系颜色
const getRelationshipColor = (relationship: string) => {
  const colorMap: Record<string, string> = {
    '父亲': 'bg-blue-100 text-blue-700',
    '母亲': 'bg-pink-100 text-pink-700',
    '爷爷': 'bg-amber-100 text-amber-700',
    '奶奶': 'bg-rose-100 text-rose-700',
    '外公': 'bg-orange-100 text-orange-700',
    '外婆': 'bg-red-100 text-red-700',
    '其他': 'bg-gray-100 text-gray-700',
  };
  return colorMap[relationship] || 'bg-gray-100 text-gray-700';
};

// 获取关系图标
const getRelationshipIcon = (relationship: string) => {
  const iconMap: Record<string, string> = {
    '父亲': '👨',
    '母亲': '👩',
    '爷爷': '👴',
    '奶奶': '👵',
    '外公': '👴',
    '外婆': '👵',
    '其他': '👤',
  };
  return iconMap[relationship] || '👤';
};

export default function ParentsPage() {
  // 使用学生数据Hook，从中提取家长信息
  const { 
    students, 
    loading, 
    error,
    refetch 
  } = useStudents();

  // 搜索和筛选状态
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [relationshipFilter, setRelationshipFilter] = useState('all');
  const [page, setPage] = useState(1);

  // 详情弹窗
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedParent, setSelectedParent] = useState<ParentInfo | null>(null);

  // 从学生数据中提取家长列表
  const parents = useMemo(() => {
    const parentList: ParentInfo[] = [];
    students.forEach(student => {
      if (student.parents && student.parents.length > 0) {
        student.parents.forEach(parent => {
          parentList.push({
            id: parent.id,
            name: parent.name,
            relationship: parent.relationship,
            phone: parent.phone,
            wechat: parent.wechat,
            isPrimary: parent.isPrimary,
            studentId: student.id,
            studentName: student.name,
            studentNo: student.studentNo,
            classId: student.classId,
            className: student.className,
            grade: student.grade,
          });
        });
      }
    });
    return parentList;
  }, [students]);

  // 获取筛选选项
  const gradeOptions = useMemo(() => {
    const grades = [...new Set(parents.map(p => p.grade))].sort((a, b) => a - b);
    return grades.map(g => ({ value: g.toString(), label: `${g}年级` }));
  }, [parents]);

  const classOptions = useMemo(() => {
    const classMap = new Map<string, string>();
    parents.forEach(p => {
      if (!classMap.has(p.classId)) {
        classMap.set(p.classId, p.className);
      }
    });
    return Array.from(classMap.entries()).map(([value, label]) => ({ value, label }));
  }, [parents]);

  const relationshipOptions = useMemo(() => {
    const relationships = [...new Set(parents.map(p => p.relationship))];
    return relationships.map(r => ({ value: r, label: r }));
  }, [parents]);

  // 统计数据
  const statistics = useMemo(() => ({
    total: parents.length,
    primaryCount: parents.filter(p => p.isPrimary).length,
    fathers: parents.filter(p => p.relationship === '父亲').length,
    mothers: parents.filter(p => p.relationship === '母亲').length,
    grandparents: parents.filter(p => ['爷爷', '奶奶', '外公', '外婆'].includes(p.relationship)).length,
    gradeDistribution: parents.reduce((acc, p) => {
      acc[p.grade] = (acc[p.grade] || 0) + 1;
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
        const matchPhone = parent.phone.includes(term);
        const matchStudentNo = parent.studentNo.toLowerCase().includes(term);
        if (!matchName && !matchStudentName && !matchPhone && !matchStudentNo) {
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
      if (relationshipFilter !== 'all' && parent.relationship !== relationshipFilter) {
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

  // 查看详情
  const handleViewDetail = (parent: ParentInfo) => {
    setSelectedParent(parent);
    setDetailDialogOpen(true);
  };

  // 导出数据
  const handleExport = () => {
    const csvContent = [
      ['家长姓名', '关系', '电话', '学生姓名', '学号', '班级', '主要联系人'].join(','),
      ...filteredParents.map(p => [
        p.name,
        p.relationship,
        p.phone,
        p.studentName,
        p.studentNo,
        p.className,
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
          <p className="text-gray-500 mt-1">查看和管理学生家长信息</p>
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
                <p className="text-2xl font-bold text-blue-600">{statistics.fathers}</p>
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
                <p className="text-2xl font-bold text-pink-600">{statistics.mothers}</p>
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
                <p className="text-2xl font-bold text-amber-600">{statistics.grandparents}</p>
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
                placeholder="搜索家长姓名、学生姓名、电话、学号..."
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
              <SelectTrigger className="w-[150px]">
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
                    <TableHead>学号</TableHead>
                    <TableHead>班级</TableHead>
                    <TableHead>主要联系人</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedParents.map((parent) => (
                    <TableRow key={parent.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getRelationshipIcon(parent.relationship)}</span>
                          <span className="font-medium">{parent.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRelationshipColor(parent.relationship)}>
                          {parent.relationship}
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
                      <TableCell className="text-gray-500">{parent.studentNo}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{parent.className}</Badge>
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
            <DialogDescription>查看家长和学生信息</DialogDescription>
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
                      <Badge className={getRelationshipColor(selectedParent.relationship)}>
                        {getRelationshipIcon(selectedParent.relationship)} {selectedParent.relationship}
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

              {/* 学生信息 */}
              <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-blue-900 flex items-center gap-2">
                  <Baby className="h-5 w-5" />
                  关联学生
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <Label className="text-gray-500">学生姓名</Label>
                    <p className="font-medium">{selectedParent.studentName}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">学号</Label>
                    <p className="font-medium">{selectedParent.studentNo}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">班级</Label>
                    <p className="font-medium">{selectedParent.className}</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">年级</Label>
                    <p className="font-medium">{selectedParent.grade}年级</p>
                  </div>
                  <div>
                    <Label className="text-gray-500">学生状态</Label>
                    <p>
                      <Badge variant="outline">{selectedParent.studentStatus}</Badge>
                    </p>
                  </div>
                </div>
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
