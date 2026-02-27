'use client';

import React, { useState, useRef } from 'react';
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
  Upload,
  X,
  Image as ImageIcon,
  Paperclip,
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

// 附件预览组件
const AttachmentPreview: React.FC<{
  files: string[];
  onRemove?: (index: number) => void;
  readonly?: boolean;
}> = ({ files, onRemove, readonly = false }) => {
  if (!files || files.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {files.map((file, index) => (
        <div key={index} className="relative group">
          <div className="w-16 h-16 border rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
            {file.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
              <img src={file} alt={`附件${index + 1}`} className="w-full h-full object-cover" />
            ) : (
              <Paperclip className="h-6 w-6 text-gray-400" />
            )}
          </div>
          {!readonly && onRemove && (
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
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
    items: [{ 
      id: `item-${Date.now()}`, 
      name: '', 
      category: 'office_supplies' as ExpenseCategory, 
      amount: 0, 
      expenseDate: new Date().toISOString().split('T')[0],
      invoiceNo: '',
      invoiceImages: [] as string[],
    }] as (ExpenseItem & { invoiceImages: string[] })[],
  });

  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // 使用统一Hooks获取数据
  const { data: expenses, loading, refetch } = useExpenses();
  const createMutation = useCreateExpense();
  const updateMutation = useUpdateExpense();
  const submitMutation = useSubmitExpense();
  const deleteMutation = useDeleteExpense();

  // 过滤数据 - 显示所有报销，不按申请人筛选（模拟数据中没有当前用户）
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

  // 模拟文件上传（实际项目中应调用对象存储API）
  const handleFileUpload = async (itemIndex: number, files: FileList) => {
    const newFiles: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // 模拟上传，生成一个临时的 blob URL
      const url = URL.createObjectURL(file);
      newFiles.push(url);
    }

    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === itemIndex 
          ? { ...item, invoiceImages: [...(item.invoiceImages || []), ...newFiles] }
          : item
      ),
    }));
  };

  // 移除发票图片
  const handleRemoveInvoiceImage = (itemIndex: number, imageIndex: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === itemIndex 
          ? { ...item, invoiceImages: item.invoiceImages?.filter((_, j) => j !== imageIndex) || [] }
          : item
      ),
    }));
  };

  // 添加报销项
  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { 
        id: `item-${Date.now()}`, 
        name: '', 
        category: prev.category, 
        amount: 0, 
        expenseDate: new Date().toISOString().split('T')[0],
        invoiceNo: '',
        invoiceImages: [],
      }],
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
  const handleItemChange = (index: number, field: string, value: string | number) => {
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
        items: formData.items.map(item => ({
          id: item.id,
          name: item.name,
          category: item.category,
          amount: item.amount,
          expenseDate: item.expenseDate,
          invoiceNo: item.invoiceNo,
          invoiceImages: item.invoiceImages,
        })),
        totalAmount,
        applicantId: user?.id || 'teacher-001',
        applicantName: user?.name || '教师',
        applicantRole: user?.role || 'teacher',
        department: user?.department || '语文教研组',
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
      items: [{ 
        id: `item-${Date.now()}`, 
        name: '', 
        category: 'office_supplies', 
        amount: 0, 
        expenseDate: new Date().toISOString().split('T')[0],
        invoiceNo: '',
        invoiceImages: [],
      }],
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
      items: expense.items.map(item => ({
        ...item,
        invoiceImages: item.invoiceImages || [],
      })),
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
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-green-50/30 via-white to-emerald-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">报销申请</h1>
          <p className="text-gray-500 mt-1">费用报销申请与管理</p>
        </div>
        <Button 
          onClick={() => { resetForm(); setShowNewDialog(true); }}
          className="bg-green-600 hover:bg-green-700 text-white gap-2"
        >
          <Plus className="h-4 w-4" />
          新建报销
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">草稿</p>
                <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
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
                <p className="text-2xl font-bold text-emerald-600">¥{stats.totalAmount.toLocaleString()}</p>
              </div>
              <div className="p-2 rounded-lg bg-emerald-100">
                <DollarSign className="h-5 w-5 text-emerald-600" />
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
                <SelectItem value="completed">已完成</SelectItem>
                <SelectItem value="rejected">已拒绝</SelectItem>
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
                <TableHead>发票</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>提交时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredExpenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
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
                    <TableCell>
                      {expense.items.some(item => (item.invoiceImages?.length || 0) > 0 || item.invoiceNo) ? (
                        <Badge className="bg-green-100 text-green-700">
                          <Paperclip className="h-3 w-3 mr-1" />
                          已上传
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-400">未上传</Badge>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(expense.status)}</TableCell>
                    <TableCell>{expense.submittedAt?.split('T')[0] || expense.createdAt.split('T')[0]}</TableCell>
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
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDelete(expense.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleSubmitApproval(expense.id)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {expense.status === 'rejected' && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(expense)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDelete(expense.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
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

      {/* 新建/编辑报销对话框 */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              {isEditing ? '编辑报销申请' : '新建报销申请'}
            </DialogTitle>
            <DialogDescription>
              填写报销信息，请确保上传发票扫描件或照片
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* 基本信息 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>报销标题 *</Label>
                <Input
                  placeholder="如：3月份办公用品采购"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>报销类别 *</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, category: v as ExpenseCategory }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择类别" />
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
            </div>

            {/* 报销明细 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>报销明细 *</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  添加项目
                </Button>
              </div>
              
              <div className="border rounded-lg divide-y">
                {formData.items.map((item, index) => (
                  <div key={item.id} className="p-4 space-y-3">
                    <div className="grid grid-cols-12 gap-3">
                      <div className="col-span-4">
                        <Label className="text-xs text-gray-500">项目名称</Label>
                        <Input
                          placeholder="项目名称"
                          value={item.name}
                          onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs text-gray-500">金额</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={item.amount || ''}
                          onChange={(e) => handleItemChange(index, 'amount', parseFloat(e.target.value) || 0)}
                          className="mt-1"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs text-gray-500">发生日期</Label>
                        <Input
                          type="date"
                          value={item.expenseDate}
                          onChange={(e) => handleItemChange(index, 'expenseDate', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs text-gray-500">发票号</Label>
                        <Input
                          placeholder="发票号"
                          value={item.invoiceNo || ''}
                          onChange={(e) => handleItemChange(index, 'invoiceNo', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div className="col-span-2 flex items-end">
                        {formData.items.length > 1 && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleRemoveItem(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* 发票附件上传 */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-gray-500">发票附件</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRefs.current[`item-${index}`]?.click()}
                        >
                          <Upload className="h-3 w-3 mr-1" />
                          上传发票
                        </Button>
                        <input
                          ref={(el) => { fileInputRefs.current[`item-${index}`] = el; }}
                          type="file"
                          accept="image/*,.pdf"
                          multiple
                          className="hidden"
                          onChange={(e) => e.target.files && handleFileUpload(index, e.target.files)}
                        />
                      </div>
                      <AttachmentPreview 
                        files={item.invoiceImages || []} 
                        onRemove={(imgIndex) => handleRemoveInvoiceImage(index, imgIndex)}
                      />
                      <p className="text-xs text-gray-400">支持上传发票扫描件或照片，可上传多张</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* 合计 */}
              <div className="flex justify-end p-4 bg-gray-50 rounded-lg">
                <div className="text-lg">
                  <span className="text-gray-500">合计金额：</span>
                  <span className="text-red-600 font-bold">¥{totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* 报销说明 */}
            <div className="space-y-2">
              <Label>报销说明</Label>
              <Textarea
                placeholder="请详细说明报销原因和用途..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter className="gap-2">
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
              className="bg-green-600 hover:bg-green-700"
            >
              {(createMutation.loading || updateMutation.loading || submitMutation.loading) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              提交申请
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 详情对话框 */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              报销详情
            </DialogTitle>
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
                  <Label className="text-gray-500">申请人</Label>
                  <p>{selectedExpense.applicantName}</p>
                </div>
                <div>
                  <Label className="text-gray-500">申请部门</Label>
                  <p>{selectedExpense.department}</p>
                </div>
                <div>
                  <Label className="text-gray-500">当前状态</Label>
                  {getStatusBadge(selectedExpense.status)}
                </div>
                <div>
                  <Label className="text-gray-500">提交时间</Label>
                  <p>{selectedExpense.submittedAt || selectedExpense.createdAt}</p>
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
                        <TableHead>发票号</TableHead>
                        <TableHead>发票附件</TableHead>
                        <TableHead>发生日期</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedExpense.items.map(item => (
                        <TableRow key={item.id}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell className="text-red-600">¥{item.amount.toLocaleString()}</TableCell>
                          <TableCell>{item.invoiceNo || '-'}</TableCell>
                          <TableCell>
                            {item.invoiceImages && item.invoiceImages.length > 0 ? (
                              <div className="flex gap-1">
                                {item.invoiceImages.map((img, i) => (
                                  <a key={i} href={img} target="_blank" rel="noopener noreferrer">
                                    <img src={img} alt={`发票${i+1}`} className="w-10 h-10 object-cover rounded border hover:opacity-80" />
                                  </a>
                                ))}
                              </div>
                            ) : '-'}
                          </TableCell>
                          <TableCell>{item.expenseDate}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-gray-50 font-semibold">
                        <TableCell>合计</TableCell>
                        <TableCell className="text-red-600">¥{selectedExpense.totalAmount.toLocaleString()}</TableCell>
                        <TableCell colSpan={3}></TableCell>
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
                  {selectedExpense.approvalFlow.map((node, index) => {
                    const record = selectedExpense.approvalRecords.find(r => r.nodeId === node.id);
                    return (
                      <div key={node.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                        <div className={`w-2 h-2 rounded-full ${
                          node.status === 'approved' ? 'bg-green-500' : 
                          node.status === 'rejected' ? 'bg-red-500' : 
                          index === selectedExpense.currentStep ? 'bg-yellow-500' : 'bg-gray-300'
                        }`} />
                        <div className="flex-1">
                          <span className="font-medium">{node.name}</span>
                          {record && (
                            <>
                              <span className="text-gray-500 mx-2">-</span>
                              <span>{record.approverName}</span>
                              {record.comment && (
                                <span className="text-gray-500 ml-2">({record.comment})</span>
                              )}
                            </>
                          )}
                        </div>
                        <div>
                          {node.status === 'approved' && <Badge className="bg-green-100 text-green-700 text-xs">已通过</Badge>}
                          {node.status === 'rejected' && <Badge className="bg-red-100 text-red-700 text-xs">已拒绝</Badge>}
                          {node.status === 'pending' && index === selectedExpense.currentStep && (
                            <Badge className="bg-yellow-100 text-yellow-700 text-xs">待审批</Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* 支付信息 */}
              {selectedExpense.status === 'completed' && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200 space-y-2">
                  <div className="flex items-center gap-2 text-green-700 font-medium">
                    <CheckCircle className="h-4 w-4" />
                    已完成支付
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-gray-500">支付单号：</span>{selectedExpense.paymentNo}</div>
                    <div><span className="text-gray-500">支付时间：</span>{selectedExpense.paymentDate}</div>
                  </div>
                  {selectedExpense.paymentVouchers && selectedExpense.paymentVouchers.length > 0 && (
                    <div className="mt-2">
                      <span className="text-gray-500 text-sm">支付凭证：</span>
                      <div className="flex gap-2 mt-1">
                        {selectedExpense.paymentVouchers.map((v, i) => (
                          <a key={i} href={v} target="_blank" rel="noopener noreferrer">
                            <img src={v} alt={`凭证${i+1}`} className="w-16 h-16 object-cover rounded border hover:opacity-80" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
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
