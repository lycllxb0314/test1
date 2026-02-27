'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DollarSign,
  Plus,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Eye,
  Edit,
  Trash2,
  Send,
  Receipt,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useExpenses, useCreateExpense, useUpdateExpense, useSubmitExpense, useDeleteExpense } from '@/hooks/useApi';
import { toast } from 'sonner';
import type { ExpenseReimbursement, ExpenseCategory, ExpenseItem } from '@/types';

// 报销类别配置
const expenseCategories: { id: ExpenseCategory; name: string; icon: string }[] = [
  { id: 'office_supplies', name: '办公用品', icon: '📝' },
  { id: 'travel', name: '差旅费', icon: '✈️' },
  { id: 'training', name: '培训费用', icon: '📚' },
  { id: 'teaching_materials', name: '教学材料', icon: '📖' },
  { id: 'activity', name: '活动经费', icon: '🎉' },
  { id: 'transportation', name: '交通费', icon: '🚗' },
  { id: 'communication', name: '通讯费', icon: '📱' },
  { id: 'equipment', name: '设备费用', icon: '💻' },
  { id: 'maintenance', name: '维修费用', icon: '🔧' },
  { id: 'other', name: '其他', icon: '📋' },
];

// 状态徽章
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'draft':
      return <Badge variant="outline" className="text-gray-600">草稿</Badge>;
    case 'pending':
      return <Badge className="bg-yellow-100 text-yellow-700">待审批</Badge>;
    case 'approved':
      return <Badge className="bg-blue-100 text-blue-700">已批准</Badge>;
    case 'rejected':
      return <Badge className="bg-red-100 text-red-700">已拒绝</Badge>;
    case 'processing':
      return <Badge className="bg-purple-100 text-purple-700">处理中</Badge>;
    case 'completed':
      return <Badge className="bg-green-100 text-green-700">已完成</Badge>;
    case 'cancelled':
      return <Badge className="bg-gray-100 text-gray-600">已取消</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function TeacherExpensePage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseReimbursement | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // 表单状态
  const [formData, setFormData] = useState({
    title: '',
    category: 'office_supplies' as ExpenseCategory,
    description: '',
    items: [{ id: `item-${Date.now()}`, name: '', category: 'office_supplies' as ExpenseCategory, amount: 0, expenseDate: new Date().toISOString().split('T')[0] }] as ExpenseItem[],
  });

  // 使用统一Hooks获取数据
  const { data: expenses, loading, refetch } = useExpenses({ applicantId: user?.id });
  const createMutation = useCreateExpense();
  const updateMutation = useUpdateExpense();
  const submitMutation = useSubmitExpense();
  const deleteMutation = useDeleteExpense();

  // 过滤数据
  const filteredExpenses = (expenses || []).filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         e.expenseNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // 统计
  const stats = {
    draft: (expenses || []).filter(e => e.status === 'draft').length,
    pending: (expenses || []).filter(e => e.status === 'pending').length,
    completed: (expenses || []).filter(e => e.status === 'completed').length,
    totalAmount: (expenses || []).filter(e => e.status === 'completed').reduce((sum, e) => sum + e.totalAmount, 0),
  };

  // 添加报销项
  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { id: `item-${Date.now()}`, name: '', category: prev.category, amount: 0, expenseDate: new Date().toISOString().split('T')[0] }],
    }));
  };

  // 删除报销项
  const handleRemoveItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }));
    }
  };

  // 更新报销项
  const handleItemChange = (index: number, field: keyof ExpenseItem, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  // 计算总金额
  const totalAmount = formData.items.reduce((sum, item) => sum + item.amount, 0);

  // 提交表单
  const handleSubmit = async (isDraft: boolean) => {
    if (!formData.title.trim()) {
      toast.error('请输入报销标题');
      return;
    }
    if (formData.items.some(item => !item.name.trim() || item.amount <= 0)) {
      toast.error('请完善报销项目信息');
      return;
    }

    try {
      const expenseData = {
        title: formData.title,
        category: formData.category,
        description: formData.description,
        items: formData.items,
        totalAmount,
        applicantId: user?.id,
        applicantName: user?.name,
        applicantRole: user?.role,
        department: user?.department || '',
        phone: user?.phone,
      };

      if (isEditing && selectedExpense) {
        await updateMutation.mutateAsync({ id: selectedExpense.id, data: expenseData });
        if (!isDraft) {
          await submitMutation.mutateAsync(selectedExpense.id);
        }
        toast.success(isDraft ? '报销申请已保存' : '报销申请已提交');
      } else {
        const result = await createMutation.mutateAsync(expenseData);
        if (!isDraft && result) {
          await submitMutation.mutateAsync(result.id);
        }
        toast.success(isDraft ? '报销申请已保存为草稿' : '报销申请已提交');
      }

      setShowNewDialog(false);
      resetForm();
      refetch();
    } catch (error) {
      toast.error('操作失败，请重试');
    }
  };

  // 提交审批
  const handleSubmitApproval = async (id: string) => {
    try {
      await submitMutation.mutateAsync(id);
      toast.success('报销申请已提交审批');
      refetch();
    } catch (error) {
      toast.error('提交失败，请重试');
    }
  };

  // 删除报销
  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个报销申请吗？')) return;
    
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('报销申请已删除');
      refetch();
    } catch (error) {
      toast.error('删除失败，请重试');
    }
  };

  // 重置表单
  const resetForm = () => {
    setFormData({
      title: '',
      category: 'office_supplies',
      description: '',
      items: [{ id: `item-${Date.now()}`, name: '', category: 'office_supplies', amount: 0, expenseDate: new Date().toISOString().split('T')[0] }],
    });
    setIsEditing(false);
    setSelectedExpense(null);
  };

  // 打开编辑
  const handleEdit = (expense: ExpenseReimbursement) => {
    setSelectedExpense(expense);
    setFormData({
      title: expense.title,
      category: expense.category,
      description: expense.description,
      items: expense.items,
    });
    setIsEditing(true);
    setShowNewDialog(true);
  };

  // 查看详情
  const handleViewDetail = (expense: ExpenseReimbursement) => {
    setSelectedExpense(expense);
    setShowDetailDialog(true);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-emerald-50/30 via-white to-teal-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">报销申请</h1>
          <p className="text-gray-500 mt-1">费用报销申请与进度查询</p>
        </div>
        <Dialog open={showNewDialog} onOpenChange={(open) => { setShowNewDialog(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
              <Plus className="h-4 w-4" />
              新建报销
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isEditing ? '编辑报销申请' : '新建报销申请'}</DialogTitle>
              <DialogDescription>
                填写报销信息，可保存为草稿或直接提交审批
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* 基本信息 */}
              <div className="space-y-2">
                <Label htmlFor="title">报销标题 *</Label>
                <Input
                  id="title"
                  placeholder="如：教学办公用品采购"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>报销类别 *</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData(prev => ({ ...prev, category: v as ExpenseCategory }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 报销项目明细 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>报销项目明细 *</Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                    <Plus className="h-4 w-4 mr-1" />
                    添加项目
                  </Button>
                </div>
                
                <div className="border rounded-lg divide-y">
                  {formData.items.map((item, index) => (
                    <div key={item.id} className="p-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <Input
                            placeholder="项目名称"
                            value={item.name}
                            onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                          />
                          <Input
                            type="number"
                            placeholder="金额"
                            value={item.amount || ''}
                            onChange={(e) => handleItemChange(index, 'amount', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        {formData.items.length > 1 && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveItem(index)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                      <Input
                        type="date"
                        value={item.expenseDate}
                        onChange={(e) => handleItemChange(index, 'expenseDate', e.target.value)}
                        className="w-48"
                      />
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-end">
                  <div className="text-lg font-semibold">
                    合计金额：<span className="text-red-600">¥{totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* 报销说明 */}
              <div className="space-y-2">
                <Label htmlFor="description">报销说明</Label>
                <Textarea
                  id="description"
                  placeholder="请详细说明报销原因和用途..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setShowNewDialog(false)}>
                取消
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleSubmit(true)}
                disabled={createMutation.loading || updateMutation.loading}
              >
                {createMutation.loading || updateMutation.loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                保存草稿
              </Button>
              <Button 
                onClick={() => handleSubmit(false)}
                disabled={createMutation.loading || updateMutation.loading || submitMutation.loading}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {createMutation.loading || updateMutation.loading || submitMutation.loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                提交审批
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">草稿</p>
                <p className="text-2xl font-bold text-gray-700">{stats.draft}</p>
              </div>
              <div className="p-2 rounded-lg bg-gray-100">
                <FileText className="h-5 w-5 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">待审批</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="p-2 rounded-lg bg-yellow-100">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">已完成</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">已报销金额</p>
                <p className="text-2xl font-bold text-blue-600">¥{stats.totalAmount.toLocaleString()}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和筛选 */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索报销标题或单号..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="状态筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="draft">草稿</SelectItem>
                <SelectItem value="pending">待审批</SelectItem>
                <SelectItem value="approved">已批准</SelectItem>
                <SelectItem value="rejected">已拒绝</SelectItem>
                <SelectItem value="completed">已完成</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 报销列表 */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>报销单号</TableHead>
                <TableHead>标题</TableHead>
                <TableHead>类别</TableHead>
                <TableHead>金额</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>提交时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredExpenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    暂无报销记录
                  </TableCell>
                </TableRow>
              ) : (
                filteredExpenses.map((expense) => (
                  <TableRow key={expense.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{expense.expenseNo}</TableCell>
                    <TableCell>{expense.title}</TableCell>
                    <TableCell>
                      {expenseCategories.find(c => c.id === expense.category)?.name || expense.category}
                    </TableCell>
                    <TableCell className="text-red-600 font-medium">¥{expense.totalAmount.toLocaleString()}</TableCell>
                    <TableCell>{getStatusBadge(expense.status)}</TableCell>
                    <TableCell>{expense.submittedAt || expense.createdAt}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleViewDetail(expense)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {expense.status === 'draft' && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(expense)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(expense.id)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleSubmitApproval(expense.id)}>
                              <Send className="h-4 w-4 text-emerald-600" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 详情对话框 */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>报销详情</DialogTitle>
            <DialogDescription>
              {selectedExpense?.expenseNo}
            </DialogDescription>
          </DialogHeader>
          
          {selectedExpense && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">报销标题</Label>
                  <p className="font-medium">{selectedExpense.title}</p>
                </div>
                <div>
                  <Label className="text-gray-500">报销类别</Label>
                  <p>{expenseCategories.find(c => c.id === selectedExpense.category)?.name}</p>
                </div>
                <div>
                  <Label className="text-gray-500">申请部门</Label>
                  <p>{selectedExpense.department}</p>
                </div>
                <div>
                  <Label className="text-gray-500">申请人</Label>
                  <p>{selectedExpense.applicantName}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-gray-500">报销明细</Label>
                <div className="mt-2 border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>项目名称</TableHead>
                        <TableHead>金额</TableHead>
                        <TableHead>发生日期</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedExpense.items.map(item => (
                        <TableRow key={item.id}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell className="text-red-600">¥{item.amount.toLocaleString()}</TableCell>
                          <TableCell>{item.expenseDate}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-gray-50 font-semibold">
                        <TableCell>合计</TableCell>
                        <TableCell className="text-red-600">¥{selectedExpense.totalAmount.toLocaleString()}</TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
              
              {selectedExpense.description && (
                <div>
                  <Label className="text-gray-500">报销说明</Label>
                  <p className="mt-1 text-gray-700">{selectedExpense.description}</p>
                </div>
              )}
              
              {/* 审批进度 */}
              <div>
                <Label className="text-gray-500">审批进度</Label>
                <div className="mt-2 space-y-2">
                  {selectedExpense.approvalRecords.map(record => (
                    <div key={record.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                      <div className={`w-2 h-2 rounded-full ${record.action === 'approve' ? 'bg-green-500' : 'bg-red-500'}`} />
                      <div className="flex-1">
                        <span className="font-medium">{record.nodeName}</span>
                        <span className="text-gray-500 mx-2">-</span>
                        <span>{record.approverName}</span>
                      </div>
                      <div className="text-sm text-gray-500">{record.createdAt}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
