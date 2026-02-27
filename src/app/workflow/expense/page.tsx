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
  Search,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  AlertCircle,
  Loader2,
  Receipt,
  CheckSquare,
  XSquare,
  Paperclip,
  CreditCard,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useExpenses, useApproveExpense } from '@/hooks/useApi';
import { toast } from 'sonner';
import type { ExpenseReimbursement } from '@/types';

// 报销类别配置
const expenseCategories: { id: string; name: string }[] = [
  { id: 'office_supplies', name: '办公用品' },
  { id: 'travel', name: '差旅费' },
  { id: 'training', name: '培训费用' },
  { id: 'teaching_materials', name: '教学材料' },
  { id: 'activity', name: '活动经费' },
  { id: 'transportation', name: '交通费' },
  { id: 'communication', name: '通讯费' },
  { id: 'equipment', name: '设备费用' },
  { id: 'maintenance', name: '维修费用' },
  { id: 'other', name: '其他' },
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

export default function ExpenseApprovalPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseReimbursement | null>(null);
  const [approveComment, setApproveComment] = useState('');
  const [approveAction, setApproveAction] = useState<'approve' | 'reject'>('approve');

  // 使用统一Hooks获取数据
  const { data: expenses, loading, refetch } = useExpenses({ status: statusFilter === 'all' ? undefined : statusFilter });
  const approveMutation = useApproveExpense();

  // 过滤数据
  const filteredExpenses = (expenses || []).filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         e.expenseNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         e.applicantName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // 统计
  const stats = {
    pending: (expenses || []).filter(e => e.status === 'pending').length,
    approved: (expenses || []).filter(e => e.status === 'approved').length,
    rejected: (expenses || []).filter(e => e.status === 'rejected').length,
    totalAmount: (expenses || []).filter(e => e.status === 'pending').reduce((sum, e) => sum + e.totalAmount, 0),
  };

  // 查看详情
  const handleViewDetail = (expense: ExpenseReimbursement) => {
    setSelectedExpense(expense);
    setShowDetailDialog(true);
  };

  // 打开审批对话框
  const handleOpenApprove = (expense: ExpenseReimbursement, action: 'approve' | 'reject') => {
    setSelectedExpense(expense);
    setApproveAction(action);
    setApproveComment('');
    setShowApproveDialog(true);
  };

  // 提交审批
  const handleSubmitApproval = async () => {
    if (!selectedExpense) return;

    try {
      await approveMutation.mutateAsync({
        id: selectedExpense.id,
        approved: approveAction === 'approve',
        comment: approveComment,
        approverId: user?.id,
        approverName: user?.name,
      });
      
      toast.success(approveAction === 'approve' ? '审批通过' : '已拒绝');
      setShowApproveDialog(false);
      setShowDetailDialog(false);
      refetch();
    } catch (error) {
      toast.error('操作失败，请重试');
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-purple-50/30 via-white to-pink-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">报销审批</h1>
          <p className="text-gray-500 mt-1">费用报销申请审批管理</p>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter('pending')}>
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

        <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter('approved')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">已批准</p>
                <p className="text-2xl font-bold text-blue-600">{stats.approved}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setStatusFilter('rejected')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">已拒绝</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <div className="p-2 rounded-lg bg-red-100">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">待审批金额</p>
                <p className="text-2xl font-bold text-purple-600">¥{stats.totalAmount.toLocaleString()}</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-100">
                <DollarSign className="h-5 w-5 text-purple-600" />
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
                placeholder="搜索报销标题、单号或申请人..."
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
                <TableHead>申请人</TableHead>
                <TableHead>部门</TableHead>
                <TableHead>类别</TableHead>
                <TableHead>金额</TableHead>
                <TableHead>附件</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>提交时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredExpenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    暂无报销记录
                  </TableCell>
                </TableRow>
              ) : (
                filteredExpenses.map((expense) => {
                  const hasInvoice = expense.items.some(item => (item.invoiceImages?.length || 0) > 0);
                  const hasPayment = expense.items.some(item => (item.paymentProofs?.length || 0) > 0);
                  return (
                    <TableRow key={expense.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{expense.expenseNo}</TableCell>
                      <TableCell>{expense.title}</TableCell>
                      <TableCell>{expense.applicantName}</TableCell>
                      <TableCell>{expense.department}</TableCell>
                      <TableCell>
                        {expenseCategories.find(c => c.id === expense.category)?.name || expense.category}
                      </TableCell>
                      <TableCell className="text-red-600 font-medium">¥{expense.totalAmount.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Badge variant={hasInvoice ? 'default' : 'outline'} className={hasInvoice ? 'bg-blue-100 text-blue-700 text-xs' : 'text-gray-400 text-xs'}>
                            发票{hasInvoice ? '✓' : '✗'}
                          </Badge>
                          <Badge variant={hasPayment ? 'default' : 'outline'} className={hasPayment ? 'bg-green-100 text-green-700 text-xs' : 'text-gray-400 text-xs'}>
                            支付{hasPayment ? '✓' : '✗'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(expense.status)}</TableCell>
                      <TableCell>{expense.submittedAt?.split('T')[0] || expense.createdAt.split('T')[0]}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleViewDetail(expense)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {expense.status === 'pending' && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleOpenApprove(expense, 'approve')}
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckSquare className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleOpenApprove(expense, 'reject')}
                                className="text-red-600 hover:text-red-700"
                              >
                                <XSquare className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 详情对话框 - 横向大屏幕 */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-[1200px] w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Receipt className="h-5 w-5" />
              报销详情
            </DialogTitle>
            <DialogDescription>
              {selectedExpense?.expenseNo}
            </DialogDescription>
          </DialogHeader>
          
          {selectedExpense && (
            <div className="space-y-4">
              {/* 基本信息 */}
              <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-gray-500 text-xs">报销标题</Label>
                  <p className="font-medium">{selectedExpense.title}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">报销类别</Label>
                  <p>{expenseCategories.find(c => c.id === selectedExpense.category)?.name}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">申请部门</Label>
                  <p>{selectedExpense.department}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">申请人</Label>
                  <p>{selectedExpense.applicantName}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">联系电话</Label>
                  <p>{selectedExpense.phone || '-'}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">当前状态</Label>
                  {getStatusBadge(selectedExpense.status)}
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">提交时间</Label>
                  <p>{selectedExpense.submittedAt || selectedExpense.createdAt}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">总金额</Label>
                  <p className="text-red-600 font-bold text-lg">¥{selectedExpense.totalAmount.toLocaleString()}</p>
                </div>
              </div>
              
              {/* 报销明细 */}
              <div>
                <Label className="text-gray-500 text-xs mb-2 block">报销明细及附件</Label>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-100">
                        <TableHead className="w-[200px]">项目名称</TableHead>
                        <TableHead className="w-[100px]">金额</TableHead>
                        <TableHead className="w-[120px]">发票号</TableHead>
                        <TableHead className="w-[150px]">发票附件</TableHead>
                        <TableHead className="w-[150px]">支付凭证</TableHead>
                        <TableHead>发生日期</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedExpense.items.map(item => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell className="text-red-600">¥{item.amount.toLocaleString()}</TableCell>
                          <TableCell>{item.invoiceNo || '-'}</TableCell>
                          <TableCell>
                            {item.invoiceImages && item.invoiceImages.length > 0 ? (
                              <div className="flex gap-1">
                                {item.invoiceImages.map((img, i) => (
                                  <a key={i} href={img} target="_blank" rel="noopener noreferrer">
                                    <img src={img} alt={`发票${i+1}`} className="w-12 h-12 object-cover rounded border hover:opacity-80 cursor-pointer" />
                                  </a>
                                ))}
                              </div>
                            ) : <span className="text-gray-400 text-xs">无</span>}
                          </TableCell>
                          <TableCell>
                            {item.paymentProofs && item.paymentProofs.length > 0 ? (
                              <div className="flex gap-1">
                                {item.paymentProofs.map((img, i) => (
                                  <a key={i} href={img} target="_blank" rel="noopener noreferrer">
                                    <img src={img} alt={`支付凭证${i+1}`} className="w-12 h-12 object-cover rounded border hover:opacity-80 cursor-pointer" />
                                  </a>
                                ))}
                              </div>
                            ) : <span className="text-gray-400 text-xs">无</span>}
                          </TableCell>
                          <TableCell>{item.expenseDate}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-green-50">
                        <TableCell className="font-bold">合计</TableCell>
                        <TableCell className="text-red-600 font-bold">¥{selectedExpense.totalAmount.toLocaleString()}</TableCell>
                        <TableCell colSpan={4}></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
              
              {selectedExpense.description && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Label className="text-gray-500 text-xs">报销说明</Label>
                  <p className="mt-1 text-gray-700">{selectedExpense.description}</p>
                </div>
              )}
              
              {/* 审批进度 */}
              <div>
                <Label className="text-gray-500 text-xs mb-3 block">审批进度</Label>
                <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg overflow-x-auto">
                  {selectedExpense.approvalFlow.map((node, index) => {
                    const record = selectedExpense.approvalRecords.find(r => r.nodeId === node.id);
                    const isLast = index === selectedExpense.approvalFlow.length - 1;
                    return (
                      <React.Fragment key={node.id}>
                        <div className="flex flex-col items-center min-w-[120px]">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            node.status === 'approved' ? 'bg-green-500 text-white' : 
                            node.status === 'rejected' ? 'bg-red-500 text-white' : 
                            index === selectedExpense.currentStep ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-500'
                          }`}>
                            {node.status === 'approved' ? <CheckCircle className="h-5 w-5" /> :
                             node.status === 'rejected' ? <XCircle className="h-5 w-5" /> :
                             index + 1}
                          </div>
                          <span className="mt-2 text-sm font-medium">{node.name}</span>
                          {record && (
                            <span className="text-xs text-gray-500">{record.approverName}</span>
                          )}
                          {record?.comment && (
                            <span className="text-xs text-gray-400 max-w-[100px] truncate">({record.comment})</span>
                          )}
                        </div>
                        {!isLast && (
                          <div className={`h-1 w-12 rounded ${
                            node.status === 'approved' ? 'bg-green-500' : 'bg-gray-200'
                          }`} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            {selectedExpense?.status === 'pending' && (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => handleOpenApprove(selectedExpense, 'reject')}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <XSquare className="h-4 w-4 mr-2" />
                  拒绝
                </Button>
                <Button 
                  onClick={() => handleOpenApprove(selectedExpense, 'approve')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckSquare className="h-4 w-4 mr-2" />
                  通过
                </Button>
              </>
            )}
            {selectedExpense?.status !== 'pending' && (
              <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
                关闭
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 审批确认对话框 */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approveAction === 'approve' ? '确认通过' : '确认拒绝'}
            </DialogTitle>
            <DialogDescription>
              {selectedExpense?.title} - ¥{selectedExpense?.totalAmount.toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>审批意见（可选）</Label>
              <Textarea
                placeholder={approveAction === 'approve' ? '填写审批意见...' : '请填写拒绝原因...'}
                value={approveComment}
                onChange={(e) => setApproveComment(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              取消
            </Button>
            <Button 
              onClick={handleSubmitApproval}
              className={approveAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
              disabled={approveMutation.loading}
            >
              {approveMutation.loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              确认{approveAction === 'approve' ? '通过' : '拒绝'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
