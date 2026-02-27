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
  Search,
  Clock,
  CheckCircle,
  FileText,
  Receipt,
  TrendingUp,
  AlertCircle,
  Loader2,
  CheckSquare,
  Wallet,
  Upload,
  X,
  Paperclip,
} from 'lucide-react';
import { useExpenses, useExpenseStatistics, useProcessExpense } from '@/hooks/useApi';
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

// 附件预览组件
const AttachmentPreview: React.FC<{
  files: string[];
  onRemove?: (index: number) => void;
  readonly?: boolean;
}> = ({ files, onRemove, readonly = false }) => {
  if (!files || files.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {files.map((file, index) => (
        <div key={index} className="relative group">
          <a href={file} target="_blank" rel="noopener noreferrer">
            <div className="w-20 h-20 border rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center hover:opacity-80 transition-opacity">
              {file.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <img src={file} alt={`附件${index + 1}`} className="w-full h-full object-cover" />
              ) : (
                <Paperclip className="h-6 w-6 text-gray-400" />
              )}
            </div>
          </a>
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

export default function FinancePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showProcessDialog, setShowProcessDialog] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseReimbursement | null>(null);
  const [processAction, setProcessAction] = useState<'process' | 'complete'>('process');
  const [paymentNo, setPaymentNo] = useState('');
  const [bankTransactionNo, setBankTransactionNo] = useState('');
  const [financeRemark, setFinanceRemark] = useState('');
  const [paymentVouchers, setPaymentVouchers] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 使用统一Hooks获取数据
  const { data: expenses, loading: expensesLoading, refetch } = useExpenses();
  const { data: stats, loading: statsLoading } = useExpenseStatistics();
  const processMutation = useProcessExpense();

  // 过滤数据
  const filteredExpenses = (expenses || []).filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         e.expenseNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         e.applicantName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    const matchesFinance = ['approved', 'processing', 'completed'].includes(e.status);
    return matchesSearch && matchesStatus && matchesFinance;
  });

  // 模拟文件上传
  const handleFileUpload = async (files: FileList) => {
    const newFiles: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const url = URL.createObjectURL(file);
      newFiles.push(url);
    }

    setPaymentVouchers(prev => [...prev, ...newFiles]);
  };

  // 移除支付凭证
  const handleRemoveVoucher = (index: number) => {
    setPaymentVouchers(prev => prev.filter((_, i) => i !== index));
  };

  // 查看详情
  const handleViewDetail = (expense: ExpenseReimbursement) => {
    setSelectedExpense(expense);
    setShowDetailDialog(true);
  };

  // 打开处理对话框
  const handleOpenProcess = (expense: ExpenseReimbursement, action: 'process' | 'complete') => {
    setSelectedExpense(expense);
    setProcessAction(action);
    setPaymentNo('');
    setBankTransactionNo('');
    setFinanceRemark('');
    setPaymentVouchers([]);
    setShowProcessDialog(true);
  };

  // 提交处理
  const handleSubmitProcess = async () => {
    if (!selectedExpense) return;
    
    if (processAction === 'complete') {
      if (!paymentNo) {
        toast.error('请填写支付单号');
        return;
      }
      if (!bankTransactionNo) {
        toast.error('请填写银行流水号');
        return;
      }
      if (paymentVouchers.length === 0) {
        toast.error('请上传支付凭证');
        return;
      }
    }

    try {
      await processMutation.mutateAsync({
        id: selectedExpense.id,
        action: processAction,
        paymentNo: processAction === 'complete' ? paymentNo : undefined,
        processorId: 'finance-001',
        processorName: '财务人员',
      });
      
      toast.success(processAction === 'process' ? '已开始处理' : '已标记完成');
      setShowProcessDialog(false);
      setShowDetailDialog(false);
      refetch();
    } catch (error) {
      toast.error('操作失败，请重试');
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-orange-50/30 via-white to-amber-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">财务管理</h1>
          <p className="text-gray-500 mt-1">费用报销与财务支出管理</p>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">待处理报销</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {statsLoading ? '-' : (stats?.pendingCount || 0)}
                </p>
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
                <p className="text-sm text-gray-500">本月支出</p>
                <p className="text-2xl font-bold text-red-600">
                  ¥{(stats?.totalAmount || 0).toLocaleString()}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-red-100">
                <DollarSign className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">待支付金额</p>
                <p className="text-2xl font-bold text-blue-600">
                  ¥{(stats?.approvedAmount || 0).toLocaleString()}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100">
                <Receipt className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">本月完成</p>
                <p className="text-2xl font-bold text-green-600">
                  {statsLoading ? '-' : (stats?.completedCount || 0)}笔
                </p>
              </div>
              <div className="p-2 rounded-lg bg-green-100">
                <TrendingUp className="h-5 w-5 text-green-600" />
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
                <SelectItem value="approved">已批准</SelectItem>
                <SelectItem value="processing">处理中</SelectItem>
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
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expensesLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredExpenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-500">
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
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleViewDetail(expense)}>
                            <FileText className="h-4 w-4" />
                          </Button>
                          {expense.status === 'approved' && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleOpenProcess(expense, 'process')}
                              className="text-purple-600 hover:text-purple-700"
                            >
                              <Wallet className="h-4 w-4" />
                            </Button>
                          )}
                          {expense.status === 'processing' && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleOpenProcess(expense, 'complete')}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckSquare className="h-4 w-4" />
                            </Button>
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
              
              {/* 支付信息 */}
              {selectedExpense.status === 'completed' && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200 space-y-3">
                  <div className="flex items-center gap-2 text-green-700 font-medium">
                    <CheckCircle className="h-4 w-4" />
                    已完成支付
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div><span className="text-gray-500">支付单号：</span>{selectedExpense.paymentNo}</div>
                    <div><span className="text-gray-500">支付时间：</span>{selectedExpense.paymentDate}</div>
                    <div><span className="text-gray-500">银行流水号：</span>{selectedExpense.bankTransactionNo || '-'}</div>
                    <div><span className="text-gray-500">处理人：</span>{selectedExpense.financeHandlerName}</div>
                  </div>
                  {selectedExpense.paymentVouchers && selectedExpense.paymentVouchers.length > 0 && (
                    <div className="mt-2">
                      <span className="text-gray-500 text-sm">支付凭证：</span>
                      <AttachmentPreview files={selectedExpense.paymentVouchers} readonly />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            {selectedExpense?.status === 'approved' && (
              <Button 
                onClick={() => handleOpenProcess(selectedExpense, 'process')}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Wallet className="h-4 w-4 mr-2" />
                开始处理
              </Button>
            )}
            {selectedExpense?.status === 'processing' && (
              <Button 
                onClick={() => handleOpenProcess(selectedExpense, 'complete')}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckSquare className="h-4 w-4 mr-2" />
                标记完成
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 处理确认对话框 */}
      <Dialog open={showProcessDialog} onOpenChange={setShowProcessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {processAction === 'process' ? '开始处理报销' : '完成支付确认'}
            </DialogTitle>
            <DialogDescription>
              {selectedExpense?.title} - ¥{selectedExpense?.totalAmount.toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {processAction === 'complete' && (
              <>
                <div className="space-y-2">
                  <Label>支付单号 *</Label>
                  <Input
                    placeholder="如：PAY-2024-001"
                    value={paymentNo}
                    onChange={(e) => setPaymentNo(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>银行流水号 *</Label>
                  <Input
                    placeholder="银行转账流水号"
                    value={bankTransactionNo}
                    onChange={(e) => setBankTransactionNo(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>支付凭证 *</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      上传凭证
                    </Button>
                    <span className="text-xs text-gray-400">
                      已上传 {paymentVouchers.length} 张
                    </span>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    multiple
                    className="hidden"
                    onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                  />
                  <AttachmentPreview 
                    files={paymentVouchers} 
                    onRemove={handleRemoveVoucher}
                  />
                  <p className="text-xs text-gray-400">请上传银行转账凭证、回单等</p>
                </div>
                <div className="space-y-2">
                  <Label>财务备注</Label>
                  <Textarea
                    placeholder="备注信息（可选）"
                    value={financeRemark}
                    onChange={(e) => setFinanceRemark(e.target.value)}
                    rows={2}
                  />
                </div>
              </>
            )}
            
            {processAction === 'process' && (
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-amber-700 text-sm">
                  确认后将开始处理该报销申请，请核实发票和支付凭证后进行打款操作。
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProcessDialog(false)}>
              取消
            </Button>
            <Button 
              onClick={handleSubmitProcess}
              className={processAction === 'process' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-green-600 hover:bg-green-700'}
              disabled={processMutation.loading}
            >
              {processMutation.loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              确认
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
