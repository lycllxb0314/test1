'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  useExpenses, 
  useExpenseStatistics, 
  useExpenseActions 
} from '@/hooks/useExpenseReimbursements';
import type { ExpenseRecord, ExpenseStatus, ExpenseType } from '@/types/general';
import {
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  CreditCard,
  Search,
  Eye,
  Check,
  X,
  FileText,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// 状态配置
const STATUS_CONFIG: Record<ExpenseStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: '待审批', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  approved: { label: '已审批', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  rejected: { label: '已拒绝', color: 'text-red-700', bgColor: 'bg-red-100' },
  paid: { label: '已支付', color: 'text-green-700', bgColor: 'bg-green-100' },
  reimbursed: { label: '已报销', color: 'text-green-700', bgColor: 'bg-green-100' },
  cancelled: { label: '已取消', color: 'text-gray-700', bgColor: 'bg-gray-100' },
};

// 类型配置
const TYPE_CONFIG: Record<string, string> = {
  travel: '差旅费',
  office: '办公费',
  teaching: '教学费',
  training: '培训费',
  equipment: '设备费',
  other: '其他',
};

// 紧急程度配置
const URGENCY_CONFIG: Record<string, { label: string; color: string }> = {
  low: { label: '低', color: 'text-gray-600' },
  normal: { label: '普通', color: 'text-blue-600' },
  high: { label: '高', color: 'text-orange-600' },
  urgent: { label: '紧急', color: 'text-red-600' },
};

export default function FinanceManagementPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedExpense, setSelectedExpense] = useState<ExpenseRecord | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [approveComment, setApproveComment] = useState('');
  const [approveAction, setApproveAction] = useState<'approve' | 'reject'>('approve');
  const [payData, setPayData] = useState({
    paidAmount: 0,
    paymentMethod: 'bank_transfer',
    transactionNo: '',
  });

  const { expenses, loading, refetch } = useExpenses({
    status: statusFilter && statusFilter !== 'all' ? statusFilter as ExpenseStatus : undefined,
    type: typeFilter && typeFilter !== 'all' ? typeFilter as ExpenseType : undefined,
  });

  const { statistics, refetch: refetchStats } = useExpenseStatistics();

  const { approveExpense, rejectExpense, payExpense, loading: actionLoading } = useExpenseActions();

  // 过滤搜索
  const filteredExpenses = expenses.filter(
    (expense: ExpenseRecord) =>
      expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.applicantName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 查看详情
  const handleViewDetail = (expense: ExpenseRecord) => {
    setSelectedExpense(expense);
    setShowDetailDialog(true);
  };

  // 打开审批弹窗
  const handleOpenApproveDialog = (expense: ExpenseRecord, action: 'approve' | 'reject') => {
    setSelectedExpense(expense);
    setApproveAction(action);
    setApproveComment('');
    setShowApproveDialog(true);
  };

  // 打开支付弹窗
  const handleOpenPayDialog = (expense: ExpenseRecord) => {
    setSelectedExpense(expense);
    setPayData({
      paidAmount: expense.totalAmount || expense.amount || 0,
      paymentMethod: 'bank_transfer',
      transactionNo: '',
    });
    setShowPayDialog(true);
  };

  // 执行审批
  const handleApprove = async () => {
    if (!selectedExpense || !user) return;

    try {
      if (approveAction === 'approve') {
        await approveExpense(selectedExpense.id, {
          approverId: user.employeeId || user.id,
          approverName: user.name,
          comment: approveComment,
        });
      } else {
        await rejectExpense(selectedExpense.id, {
          approverId: user.employeeId || user.id,
          approverName: user.name,
          reason: approveComment,
        });
      }
      
      toast.success(approveAction === 'approve' ? '审批通过' : '已拒绝');
      setShowApproveDialog(false);
      refetch();
      refetchStats();
    } catch (err) {
      toast.error('操作失败');
    }
  };

  // 执行支付
  const handlePay = async () => {
    if (!selectedExpense) return;

    try {
      await payExpense(selectedExpense.id, {
        paidAmount: payData.paidAmount,
        paymentMethod: payData.paymentMethod,
        transactionNo: payData.transactionNo,
      });
      
      toast.success('支付成功');
      setShowPayDialog(false);
      refetch();
      refetchStats();
    } catch (err) {
      toast.error('支付失败');
    }
  };

  // 格式化日期
  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('zh-CN');
  };

  // 格式化金额
  const formatAmount = (amount: number | undefined) => {
    return `¥${(amount || 0).toFixed(2)}`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">财务管理</h1>
          <p className="text-muted-foreground">报销申请审批与支付管理</p>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">总申请金额</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatAmount(statistics?.totalAmount || 0)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">待审批</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {statistics?.pending || statistics?.pendingCount || 0}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">已审批待支付</p>
                <p className="text-2xl font-bold text-blue-600">
                  {statistics?.approved || statistics?.approvedCount || 0}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">已支付金额</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatAmount(statistics?.paidAmount || 0)}
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和筛选 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索标题或申请人..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="状态筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="pending">待审批</SelectItem>
                <SelectItem value="approved">已审批</SelectItem>
                <SelectItem value="rejected">已拒绝</SelectItem>
                <SelectItem value="paid">已支付</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="类型筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="travel">差旅费</SelectItem>
                <SelectItem value="office">办公费</SelectItem>
                <SelectItem value="teaching">教学费</SelectItem>
                <SelectItem value="training">培训费</SelectItem>
                <SelectItem value="equipment">设备费</SelectItem>
                <SelectItem value="other">其他</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 报销列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            报销申请列表
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">加载中...</div>
          ) : filteredExpenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">暂无数据</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>标题</TableHead>
                  <TableHead>申请人</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>金额</TableHead>
                  <TableHead>紧急程度</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>申请时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map((expense: ExpenseRecord) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium">{expense.title}</TableCell>
                    <TableCell>{expense.applicantName}</TableCell>
                    <TableCell>{TYPE_CONFIG[expense.type] || expense.type}</TableCell>
                    <TableCell className="font-medium">{formatAmount(expense.totalAmount || expense.amount)}</TableCell>
                    <TableCell>
                      <span className={URGENCY_CONFIG[expense.urgency]?.color || ''}>
                        {URGENCY_CONFIG[expense.urgency]?.label || expense.urgency}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_CONFIG[expense.status]?.bgColor + ' ' + STATUS_CONFIG[expense.status]?.color}>
                        {STATUS_CONFIG[expense.status]?.label || expense.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(expense.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetail(expense)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {expense.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600 hover:text-green-700"
                              onClick={() => handleOpenApproveDialog(expense, 'approve')}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleOpenApproveDialog(expense, 'reject')}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {expense.status === 'approved' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:text-blue-700"
                            onClick={() => handleOpenPayDialog(expense)}
                          >
                            <CreditCard className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 详情弹窗 */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>报销详情</DialogTitle>
          </DialogHeader>
          {selectedExpense && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">标题</Label>
                  <p className="font-medium">{selectedExpense.title}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">申请人</Label>
                  <p className="font-medium">{selectedExpense.applicantName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">类型</Label>
                  <p>{TYPE_CONFIG[selectedExpense.type] || selectedExpense.type}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">金额</Label>
                  <p className="font-medium text-lg">{formatAmount(selectedExpense.totalAmount || selectedExpense.amount)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">紧急程度</Label>
                  <p className={URGENCY_CONFIG[selectedExpense.urgency]?.color}>
                    {URGENCY_CONFIG[selectedExpense.urgency]?.label}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">状态</Label>
                  <Badge className={STATUS_CONFIG[selectedExpense.status]?.bgColor + ' ' + STATUS_CONFIG[selectedExpense.status]?.color}>
                    {STATUS_CONFIG[selectedExpense.status]?.label}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">申请时间</Label>
                  <p>{formatDate(selectedExpense.createdAt)}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">报销说明</Label>
                <p className="mt-1 p-3 bg-muted rounded-md">{selectedExpense.description || '无'}</p>
              </div>
              {selectedExpense.items && selectedExpense.items.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">费用明细</Label>
                  <div className="mt-2 space-y-2">
                    {selectedExpense.items.map((item, index) => (
                      <div key={index} className="flex justify-between p-2 bg-muted rounded">
                        <span>{item.name} - {item.description}</span>
                        <span className="font-medium">{formatAmount(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {selectedExpense.images && selectedExpense.images.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">附件图片</Label>
                  <div className="mt-2 flex gap-2 flex-wrap">
                    {selectedExpense.images.map((url, index) => (
                      <img
                        key={index}
                        src={url}
                        alt={`附件${index + 1}`}
                        className="h-20 w-20 object-cover rounded border cursor-pointer"
                        onClick={() => window.open(url, '_blank')}
                      />
                    ))}
                  </div>
                </div>
              )}
              {selectedExpense.rejectionReason && (
                <div>
                  <Label className="text-red-500">拒绝原因</Label>
                  <p className="mt-1 p-3 bg-red-50 text-red-700 rounded-md">
                    {selectedExpense.rejectionReason}
                  </p>
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

      {/* 审批弹窗 */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approveAction === 'approve' ? '审批通过' : '拒绝申请'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>审批意见</Label>
              <Textarea
                value={approveComment}
                onChange={(e) => setApproveComment(e.target.value)}
                placeholder={approveAction === 'approve' ? '审批意见（可选）' : '请填写拒绝原因'}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              取消
            </Button>
            <Button
              variant={approveAction === 'approve' ? 'default' : 'destructive'}
              onClick={handleApprove}
              disabled={actionLoading || (approveAction === 'reject' && !approveComment.trim())}
            >
              {actionLoading ? '处理中...' : (approveAction === 'approve' ? '确认通过' : '确认拒绝')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 支付弹窗 */}
      <Dialog open={showPayDialog} onOpenChange={setShowPayDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认支付</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>支付金额</Label>
              <Input
                type="number"
                value={payData.paidAmount}
                onChange={(e) => setPayData({ ...payData, paidAmount: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <Label>支付方式</Label>
              <Select
                value={payData.paymentMethod}
                onValueChange={(value) => setPayData({ ...payData, paymentMethod: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">银行转账</SelectItem>
                  <SelectItem value="cash">现金</SelectItem>
                  <SelectItem value="alipay">支付宝</SelectItem>
                  <SelectItem value="wechat">微信</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>交易流水号</Label>
              <Input
                value={payData.transactionNo}
                onChange={(e) => setPayData({ ...payData, transactionNo: e.target.value })}
                placeholder="可选"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPayDialog(false)}>
              取消
            </Button>
            <Button onClick={handlePay} disabled={actionLoading}>
              {actionLoading ? '处理中...' : '确认支付'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
