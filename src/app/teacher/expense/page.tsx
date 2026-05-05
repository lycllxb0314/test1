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
import { MultiImageUploader } from '@/components/ui/image-uploader';
import {
  useMyExpenses,
  useExpenseStatistics,
  useCreateExpense,
} from '@/hooks/useExpenseReimbursements';
import type { ExpenseRecord, ExpenseStatus, ExpenseItem } from '@/types/general';
import {
  DollarSign,
  Clock,
  CheckCircle,
  Eye,
  Plus,
  Trash2,
  FileText,
  Receipt,
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

// 类型选项
const TYPE_OPTIONS = [
  { value: 'travel', label: '差旅费' },
  { value: 'office', label: '办公费' },
  { value: 'teaching', label: '教学费' },
  { value: 'training', label: '培训费' },
  { value: 'equipment', label: '设备费' },
  { value: 'other', label: '其他' },
];

// 紧急程度选项
const URGENCY_OPTIONS = [
  { value: 'low', label: '低' },
  { value: 'normal', label: '普通' },
  { value: 'high', label: '高' },
  { value: 'urgent', label: '紧急' },
];

const URGENCY_CONFIG: Record<string, { label: string; color: string }> = {
  low: { label: '低', color: 'text-gray-600' },
  normal: { label: '普通', color: 'text-blue-600' },
  high: { label: '高', color: 'text-orange-600' },
  urgent: { label: '紧急', color: 'text-red-600' },
};

export default function TeacherExpensePage() {
  const { user } = useAuth();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseRecord | null>(null);
  
  // 表单数据
  const [formData, setFormData] = useState({
    title: '',
    type: 'office' as const,
    description: '',
    urgency: 'normal' as const,
    items: [] as ExpenseItem[],
    images: [] as string[],
  });

  const applicantId = user?.employeeId || user?.id;
  const { expenses, loading, refetch } = useMyExpenses(applicantId);
  const { statistics } = useExpenseStatistics(applicantId);
  const { createExpense, loading: createLoading } = useCreateExpense();

  // 计算总金额
  const totalAmount = formData.items.reduce((sum, item) => sum + item.amount, 0);

  // 添加费用项
  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        { name: '', description: '', amount: 0, date: new Date().toISOString().split('T')[0] },
      ],
    });
  };

  // 删除费用项
  const handleRemoveItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  // 更新费用项
  const handleUpdateItem = (index: number, field: keyof ExpenseItem, value: string | number) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  // 提交申请
  const handleSubmit = async () => {
    if (!user || !applicantId) return;
    if (!formData.title.trim()) {
      toast.error('请填写标题');
      return;
    }
    if (formData.items.length === 0) {
      toast.error('请至少添加一项费用明细');
      return;
    }
    if (formData.items.some(item => !item.name.trim() || item.amount <= 0)) {
      toast.error('请完善费用明细');
      return;
    }

    try {
      await createExpense({
        title: formData.title,
        type: formData.type,
        description: formData.description,
        urgency: formData.urgency,
        amount: totalAmount,
        items: formData.items,
        images: formData.images,
        applicantId: applicantId,
        applicantName: user.name,
        department: user.department || '',
      });
      
      toast.success('提交成功');
      setShowCreateDialog(false);
      resetForm();
      refetch();
    } catch (err) {
      toast.error('提交失败');
    }
  };

  // 重置表单
  const resetForm = () => {
    setFormData({
      title: '',
      type: 'office',
      description: '',
      urgency: 'normal',
      items: [],
      images: [],
    });
  };

  // 查看详情
  const handleViewDetail = (expense: ExpenseRecord) => {
    setSelectedExpense(expense);
    setShowDetailDialog(true);
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
          <h1 className="text-2xl font-bold text-foreground">报销申请</h1>
          <p className="text-muted-foreground">提交费用报销申请，查看审批进度</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          新建申请
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">我的申请</p>
                <p className="text-2xl font-bold text-foreground">
                  {statistics?.total || statistics?.totalCount || 0}
                </p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
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
                <p className="text-sm text-muted-foreground">已审批</p>
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
                <p className="text-sm text-muted-foreground">已到账</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatAmount(statistics?.paidAmount || 0)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 申请列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            我的报销申请
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">加载中...</div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">暂无报销申请</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>标题</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>金额</TableHead>
                  <TableHead>紧急程度</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>申请时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense: ExpenseRecord) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium">{expense.title}</TableCell>
                    <TableCell>
                      {TYPE_OPTIONS.find(t => t.value === expense.type)?.label || expense.type}
                    </TableCell>
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetail(expense)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 新建申请弹窗 */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新建报销申请</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>标题 *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="请输入报销标题"
                />
              </div>
              <div>
                <Label>类型</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as typeof formData.type })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>紧急程度</Label>
                <Select
                  value={formData.urgency}
                  onValueChange={(value) => setFormData({ ...formData, urgency: value as typeof formData.urgency })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {URGENCY_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>报销金额</Label>
                <p className="text-2xl font-bold text-green-600">{formatAmount(totalAmount)}</p>
              </div>
            </div>

            <div>
              <Label>报销说明</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="请详细描述报销事由"
                rows={3}
              />
            </div>

            {/* 费用明细 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>费用明细 *</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  添加项
                </Button>
              </div>
              <div className="space-y-2">
                {formData.items.map((item, index) => (
                  <div key={index} className="flex gap-2 items-start p-2 bg-muted rounded">
                    <Input
                      placeholder="名称"
                      value={item.name}
                      onChange={(e) => handleUpdateItem(index, 'name', e.target.value)}
                      className="w-32"
                    />
                    <Input
                      placeholder="说明"
                      value={item.description}
                      onChange={(e) => handleUpdateItem(index, 'description', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      type="date"
                      value={item.date || ''}
                      onChange={(e) => handleUpdateItem(index, 'date', e.target.value)}
                      className="w-36"
                    />
                    <Input
                      type="number"
                      placeholder="金额"
                      value={item.amount || ''}
                      onChange={(e) => handleUpdateItem(index, 'amount', parseFloat(e.target.value) || 0)}
                      className="w-24"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
                {formData.items.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    点击"添加项"添加费用明细
                  </p>
                )}
              </div>
            </div>

            {/* 附件上传 */}
            <div>
              <Label>附件图片</Label>
              <MultiImageUploader
                images={formData.images}
                onChange={(images: string[]) => setFormData({ ...formData, images })}
                maxImages={5}
                folder="expense-images"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={createLoading}>
              {createLoading ? '提交中...' : '提交申请'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                  <Label className="text-muted-foreground">类型</Label>
                  <p>{TYPE_OPTIONS.find(t => t.value === selectedExpense.type)?.label || selectedExpense.type}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">金额</Label>
                  <p className="font-medium text-lg">{formatAmount(selectedExpense.totalAmount || selectedExpense.amount)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">状态</Label>
                  <Badge className={STATUS_CONFIG[selectedExpense.status]?.bgColor + ' ' + STATUS_CONFIG[selectedExpense.status]?.color}>
                    {STATUS_CONFIG[selectedExpense.status]?.label}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">紧急程度</Label>
                  <p className={URGENCY_CONFIG[selectedExpense.urgency]?.color}>
                    {URGENCY_CONFIG[selectedExpense.urgency]?.label}
                  </p>
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
                    {selectedExpense.items.map((item: ExpenseItem, index: number) => (
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
                    {selectedExpense.images.map((url: string, index: number) => (
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
    </div>
  );
}
