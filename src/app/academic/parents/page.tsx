/**
 * 家长管理页面
 * 
 * 功能：
 * - 家长列表展示
 * - 批量开通账号
 * - 批量重置密码
 * - 批量导入家长
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Users,
  Search,
  Download,
  Upload,
  Phone,
  User,
  UserCircle,
  Loader2,
  Eye,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Key,
  MoreHorizontal,
  UserPlus,
  CheckSquare,
  Square,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

// 关系名称映射
const RELATION_NAMES: Record<string, string> = {
  father: '父亲',
  mother: '母亲',
  grandfather: '爷爷/外公',
  grandmother: '奶奶/外婆',
  other: '其他',
};

// 家长类型定义
interface Parent {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  name: string;
  relation: string;
  relationName: string;
  phone: string | null;
  wechat: string | null;
  idCard: string | null;
  occupation: string | null;
  company: string | null;
  isPrimary: boolean;
  hasAccount: boolean;
  userId: string | null;
  password: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// 批量操作结果类型
interface BatchResultItem {
  name: string;
  defaultPassword?: string;
  newPassword?: string;
}

interface BatchResults {
  success: number;
  failed: number;
  data?: BatchResultItem[];
  errors?: string[];
}

// 班级类型定义
interface Class {
  id: string;
  name: string;
  grade: number;
}

export default function ParentsPage() {
  const router = useRouter();
  // 状态
  const [parents, setParents] = useState<Parent[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedParents, setSelectedParents] = useState<Set<string>>(new Set());
  
  // 分页
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // 筛选
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [accountFilter, setAccountFilter] = useState('all');
  
  // 统计
  const [statistics, setStatistics] = useState({
    total: 0,
    hasAccountCount: 0,
    primaryParentCount: 0,
    relationDistribution: {} as Record<string, number>,
  });
  
  // 弹窗
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
  const [importData, setImportData] = useState('');
  const [batchResults, setBatchResults] = useState<BatchResults | null>(null);
  
  // 加载家长数据
  const loadParents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('pageSize', pageSize.toString());
      if (searchTerm) params.append('search', searchTerm);
      if (classFilter && classFilter !== 'all') params.append('classId', classFilter);
      if (accountFilter === 'true' || accountFilter === 'false') {
        params.append('hasAccount', accountFilter);
      }
      
      const response = await fetch(`/api/parents?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setParents(result.data);
        setTotal(result.pagination.total);
        setTotalPages(result.pagination.totalPages);
        setStatistics(result.statistics);
      } else {
        toast.error('加载家长数据失败');
      }
    } catch (err) {
      console.error('Failed to load parents:', err);
      toast.error('加载家长数据失败');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchTerm, classFilter, accountFilter]);
  
  // 加载班级数据
  const loadClasses = useCallback(async () => {
    try {
      const response = await fetch('/api/classes');
      const result = await response.json();
      if (result.success) {
        setClasses(result.data || []);
      }
    } catch (err) {
      console.error('Failed to load classes:', err);
    }
  }, []);
  
  useEffect(() => {
    loadParents();
    loadClasses();
  }, [loadParents, loadClasses]);
  
  // 批量操作
  const handleBatchOperation = async (action: string) => {
    if (selectedParents.size === 0) {
      toast.error('请先选择家长');
      return;
    }
    
    try {
      const response = await fetch('/api/parents/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          parentIds: Array.from(selectedParents),
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setBatchResults(result.data);
        setResultDialogOpen(true);
        setSelectedParents(new Set());
        loadParents();
      } else {
        toast.error(result.message || '操作失败');
      }
    } catch (err) {
      console.error('Batch operation failed:', err);
      toast.error('操作失败');
    }
  };
  
  // 批量导入
  const handleImport = async () => {
    if (!importData.trim()) {
      toast.error('请输入导入数据');
      return;
    }
    
    try {
      // 解析CSV数据
      const lines = importData.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      const parentsToImport = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const parent: Record<string, string> = {};
        
        headers.forEach((header, index) => {
          parent[header] = values[index] || '';
        });
        
        if (parent['学生ID'] && parent['家长姓名']) {
          parentsToImport.push({
            student_id: parent['学生ID'],
            name: parent['家长姓名'],
            relation: parent['关系'] || 'other',
            phone: parent['电话'],
            wechat: parent['微信'],
          });
        }
      }
      
      if (parentsToImport.length === 0) {
        toast.error('没有有效的导入数据');
        return;
      }
      
      const response = await fetch('/api/parents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parents: parentsToImport }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(result.message);
        setImportDialogOpen(false);
        setImportData('');
        loadParents();
      } else {
        toast.error(result.message || '导入失败');
      }
    } catch (err) {
      console.error('Import failed:', err);
      toast.error('导入失败，请检查数据格式');
    }
  };
  
  // 导出数据
  const handleExport = () => {
    const headers = ['家长姓名', '关系', '电话', '微信', '学生姓名', '班级', '是否主要联系人', '是否已开通账号'];
    const csvContent = [
      headers.join(','),
      ...parents.map(p => [
        p.name,
        p.relationName,
        p.phone || '',
        p.wechat || '',
        p.studentName,
        p.className,
        p.isPrimary ? '是' : '否',
        p.hasAccount ? '是' : '否',
      ].join(',')),
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
  
  // 全选/取消全选
  const handleSelectAll = () => {
    if (selectedParents.size === parents.length) {
      setSelectedParents(new Set());
    } else {
      setSelectedParents(new Set(parents.map(p => p.id)));
    }
  };
  
  // 切换单个选择
  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedParents);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedParents(newSelected);
  };
  
  // 获取关系颜色
  const getRelationshipColor = (relationName: string) => {
    const colorMap: Record<string, string> = {
      '父亲': 'bg-blue-100 text-blue-700',
      '母亲': 'bg-pink-100 text-pink-700',
      '爷爷/外公': 'bg-amber-100 text-amber-700',
      '奶奶/外婆': 'bg-rose-100 text-rose-700',
      '其他': 'bg-gray-100 text-gray-700',
    };
    return colorMap[relationName] || 'bg-gray-100 text-gray-700';
  };
  
  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-purple-50/30 via-white to-pink-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">家长管理</h1>
          <p className="text-gray-500 mt-1">
            管理学生家长信息、账号开通与密码重置
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <Download className="h-4 w-4" />
            导出数据
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => setImportDialogOpen(true)}>
            <Upload className="h-4 w-4" />
            批量导入
          </Button>
        </div>
      </div>
      
      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
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
                <p className="text-sm text-gray-500">已开通账号</p>
                <p className="text-2xl font-bold text-green-600">{statistics.hasAccountCount}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-100">
                <User className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">主要联系人</p>
                <p className="text-2xl font-bold text-blue-600">{statistics.primaryParentCount}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100">
                <Phone className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">未开通账号</p>
                <p className="text-2xl font-bold text-orange-600">{statistics.total - statistics.hasAccountCount}</p>
              </div>
              <div className="p-2 rounded-lg bg-orange-100">
                <Key className="h-5 w-5 text-orange-600" />
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
            
            <Select value={classFilter} onValueChange={(v) => { setClassFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="全部班级" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部班级</SelectItem>
                {classes.map(cls => (
                  <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={accountFilter} onValueChange={(v) => { setAccountFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="账号状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="true">已开通</SelectItem>
                <SelectItem value="false">未开通</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={() => { setSearchTerm(''); setClassFilter('all'); setAccountFilter('all'); }}>
              重置
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* 批量操作栏 */}
      {selectedParents.size > 0 && (
        <Card className="border-0 shadow-md bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">
                已选择 {selectedParents.size} 位家长
              </span>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleBatchOperation('create_accounts')}
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  批量开通账号
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleBatchOperation('reset_passwords')}
                >
                  <Key className="h-4 w-4 mr-1" />
                  批量重置密码
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleBatchOperation('set_primary')}
                >
                  设为主要联系人
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => handleBatchOperation('delete')}
                >
                  批量删除
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* 家长列表 */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              <span className="ml-2 text-gray-500">加载中...</span>
            </div>
          ) : parents.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p>暂无家长数据</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedParents.size === parents.length && parents.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>家长姓名</TableHead>
                    <TableHead>关系</TableHead>
                    <TableHead>联系电话</TableHead>
                    <TableHead>登录密码</TableHead>
                    <TableHead>学生姓名</TableHead>
                    <TableHead>班级</TableHead>
                    <TableHead>主要联系人</TableHead>
                    <TableHead>账号状态</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parents.map((parent) => (
                    <TableRow key={parent.id} className="hover:bg-gray-50">
                      <TableCell>
                        <Checkbox
                          checked={selectedParents.has(parent.id)}
                          onCheckedChange={() => handleToggleSelect(parent.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Link 
                          href={`/academic/parents/${parent.id}`}
                          className="font-medium text-purple-600 hover:text-purple-800 hover:underline cursor-pointer"
                        >
                          {parent.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRelationshipColor(parent.relationName)}>
                          {parent.relationName}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>{parent.phone || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {parent.hasAccount ? (
                          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                            {parent.password || '-'}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">未开通</span>
                        )}
                      </TableCell>
                      <TableCell>{parent.studentName}</TableCell>
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
                      <TableCell>
                        {parent.hasAccount ? (
                          <Badge className="bg-blue-100 text-blue-700">已开通</Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-400">未开通</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/academic/parents/${parent.id}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              查看详情
                            </DropdownMenuItem>
                            {!parent.hasAccount && (
                              <DropdownMenuItem onClick={() => {
                                setSelectedParents(new Set([parent.id]));
                                handleBatchOperation('create_accounts');
                              }}>
                                <UserPlus className="h-4 w-4 mr-2" />
                                开通账号
                              </DropdownMenuItem>
                            )}
                            {parent.hasAccount && (
                              <DropdownMenuItem onClick={() => {
                                setSelectedParents(new Set([parent.id]));
                                handleBatchOperation('reset_passwords');
                              }}>
                                <Key className="h-4 w-4 mr-2" />
                                重置密码
                              </DropdownMenuItem>
                            )}
                            {!parent.isPrimary && (
                              <DropdownMenuItem onClick={() => {
                                setSelectedParents(new Set([parent.id]));
                                handleBatchOperation('set_primary');
                              }}>
                                设为主要联系人
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* 分页 */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <div className="flex items-center gap-4">
                    <p className="text-sm text-gray-500">
                      共 {total} 条记录，第 {page}/{totalPages} 页
                    </p>
                    <Select 
                      value={pageSize.toString()} 
                      onValueChange={(value) => { setPageSize(parseInt(value)); setPage(1); }}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 条/页</SelectItem>
                        <SelectItem value="20">20 条/页</SelectItem>
                        <SelectItem value="50">50 条/页</SelectItem>
                        <SelectItem value="100">100 条/页</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
      
      {/* 详情弹窗 */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>家长详情</DialogTitle>
            <DialogDescription>查看家长信息和管理账号</DialogDescription>
          </DialogHeader>
          
          {selectedParent && (
            <div className="space-y-4">
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
                      <Badge className={getRelationshipColor(selectedParent.relationName)}>
                        {selectedParent.relationName}
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
                  <div>
                    <Label className="text-gray-500">主要联系人</Label>
                    <p>
                      {selectedParent.isPrimary ? (
                        <Badge className="bg-green-100 text-green-700">是</Badge>
                      ) : (
                        <Badge variant="outline">否</Badge>
                      )}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-500">账号状态</Label>
                    <p>
                      {selectedParent.hasAccount ? (
                        <Badge className="bg-blue-100 text-blue-700">已开通</Badge>
                      ) : (
                        <Badge variant="outline">未开通</Badge>
                      )}
                    </p>
                  </div>
                  {selectedParent.hasAccount && (
                    <div>
                      <Label className="text-gray-500">登录密码</Label>
                      <p className="font-mono text-sm bg-gray-100 px-2 py-1 rounded inline-block">
                        {selectedParent.password || '-'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-blue-900 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  关联学生
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
      
      {/* 批量导入弹窗 */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>批量导入家长</DialogTitle>
            <DialogDescription>
              请按CSV格式粘贴数据，首行为表头
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 text-sm">
              <p className="font-medium mb-2">CSV格式说明：</p>
              <code className="text-xs text-gray-600 block">
                学生ID,家长姓名,关系,电话,微信
              </code>
              <code className="text-xs text-gray-600 block mt-1">
                student-001,张三,father,13800138000,zhangsan
              </code>
              <p className="text-xs text-gray-500 mt-2">
                关系可选值：father(父亲), mother(母亲), grandfather(爷爷/外公), grandmother(奶奶/外婆), other(其他)
              </p>
            </div>
            
            <Textarea
              placeholder="粘贴CSV数据..."
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              rows={10}
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleImport}>
              导入
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 操作结果弹窗 */}
      <Dialog open={resultDialogOpen} onOpenChange={setResultDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>批量操作结果</DialogTitle>
          </DialogHeader>
          
          {batchResults && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{batchResults.success}</p>
                  <p className="text-sm text-gray-500">成功</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-red-600">{batchResults.failed}</p>
                  <p className="text-sm text-gray-500">失败</p>
                </div>
              </div>
              
              {batchResults.data && batchResults.data.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="font-medium mb-2">账号信息：</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {batchResults.data.map((item: BatchResultItem, index: number) => (
                      <div key={index} className="text-sm flex justify-between">
                        <span>{item.name}</span>
                        <span className="text-gray-500">
                          密码: {item.defaultPassword || item.newPassword}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {batchResults.errors && batchResults.errors.length > 0 && (
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="font-medium text-red-700 mb-2">错误信息：</p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {batchResults.errors.slice(0, 10).map((err: string, index: number) => (
                      <p key={index} className="text-sm text-red-600">{err}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setResultDialogOpen(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
