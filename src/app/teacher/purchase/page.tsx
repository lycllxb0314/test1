'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  ShoppingCart,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  Package,
  Eye,
  Image as ImageIcon,
  X,
  FileText,
  Trash2,
  Loader2,
  Upload,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/services/api-client';
import type { PurchaseRecord, PurchaseItem, PurchaseStatus, PurchaseType, PurchaseUrgency } from '@/types/general';
import { toast } from 'sonner';

const STATUS_CONFIG: Record<PurchaseStatus, { label: string; color: string; bgColor: string }> = {
  draft: { label: '草稿', color: 'text-gray-700', bgColor: 'bg-gray-100' },
  pending: { label: '待审批', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  approved: { label: '已批准', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  ordered: { label: '已下单', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  received: { label: '已到货', color: 'text-cyan-700', bgColor: 'bg-cyan-100' },
  completed: { label: '已完成', color: 'text-green-700', bgColor: 'bg-green-100' },
  rejected: { label: '已拒绝', color: 'text-red-700', bgColor: 'bg-red-100' },
};

const TYPE_LABELS: Record<PurchaseType, string> = {
  office_supplies: '办公用品',
  equipment: '教学设备',
  maintenance: '维修材料',
  other: '其他',
};

const URGENCY_CONFIG: Record<PurchaseUrgency, { label: string; color: string }> = {
  low: { label: '低', color: 'text-gray-600' },
  normal: { label: '普通', color: 'text-blue-600' },
  high: { label: '高', color: 'text-orange-600' },
  urgent: { label: '紧急', color: 'text-red-600' },
};

export default function TeacherPurchasePage() {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // 弹窗状态
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 表单状态
  const [formData, setFormData] = useState({
    title: '',
    type: 'office_supplies' as PurchaseType,
    items: [{ id: crypto.randomUUID(), name: '', quantity: 1, unit: '个', estimatedPrice: 0, remark: '' }] as PurchaseItem[],
    reason: '',
    urgency: 'normal' as PurchaseUrgency,
    department: '',
    budgetSource: '',
    images: [] as string[],
  });

  // 加载我的采购申请
  const loadPurchases = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await apiClient.get<PurchaseRecord[]>(`/api/general/purchase?applicantId=${user.id}`);
      if (res.success && res.data) {
        setPurchases(res.data);
      }
    } catch (err) {
      console.error('加载采购申请失败:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPurchases();
  }, [user?.id]);

  // 统计数据
  const stats = useMemo(() => {
    return {
      total: purchases.length,
      pending: purchases.filter(p => p.status === 'pending').length,
      approved: purchases.filter(p => p.status === 'approved').length,
      completed: purchases.filter(p => p.status === 'completed').length,
    };
  }, [purchases]);

  // 添加物品项
  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { id: crypto.randomUUID(), name: '', quantity: 1, unit: '个', estimatedPrice: 0, remark: '' }],
    }));
  };

  // 删除物品项
  const removeItem = (index: number) => {
    if (formData.items.length === 1) return;
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  // 更新物品项
  const updateItem = (index: number, field: keyof PurchaseItem, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  // 计算总金额
  const totalAmount = useMemo(() => {
    return formData.items.reduce((sum, item) => sum + (item.estimatedPrice || 0) * (item.quantity || 1), 0);
  }, [formData.items]);

  // 图片上传
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (formData.images.length + files.length > 3) {
      toast.error('最多上传 3 张图片');
      return;
    }

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (formData.images.length >= 3) break;

        if (!file.type.startsWith('image/')) {
          toast.error('只能上传图片文件');
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          toast.error('图片大小不能超过 10MB');
          continue;
        }

        const formDataUpload = new FormData();
        formDataUpload.append('file', file);
        formDataUpload.append('folder', 'purchase-images');

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formDataUpload,
        });

        const data = await res.json();
        if (data.success && data.data?.url) {
          setFormData(prev => ({
            ...prev,
            images: [...prev.images, data.data.url],
          }));
        }
      }
    } catch (err) {
      console.error('图片上传失败:', err);
      toast.error('图片上传失败');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // 移除图片
  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  // 提交采购申请
  const handleSubmit = async () => {
    if (!formData.title || !formData.reason) {
      toast.error('请填写采购标题和申请原因');
      return;
    }

    if (formData.items.some(item => !item.name)) {
      toast.error('请填写所有物品名称');
      return;
    }

    if (!user?.id || !user?.name) {
      toast.error('请先登录');
      return;
    }

    setSaving(true);
    try {
      const res = await apiClient.post<PurchaseRecord>('/api/general/purchase', {
        ...formData,
        status: 'pending',
        applicantId: user.id,
        applicantName: user.name,
        totalAmount,
      });

      if (res.success) {
        toast.success('采购申请提交成功');
        setShowCreateDialog(false);
        setFormData({
          title: '',
          type: 'office_supplies',
          items: [{ name: '', quantity: 1, unit: '个', estimatedPrice: 0, remark: '' }],
          reason: '',
          urgency: 'normal',
          department: '',
          budgetSource: '',
          images: [],
        });
        loadPurchases();
      } else {
        toast.error('提交失败');
      }
    } catch (err) {
      toast.error('提交失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  // 查看详情
  const handleViewDetail = (purchase: PurchaseRecord) => {
    setSelectedPurchase(purchase);
    setShowDetailDialog(true);
  };

  const getStatusBadge = (status: PurchaseStatus) => {
    const config = STATUS_CONFIG[status];
    return <Badge className={`${config.color} ${config.bgColor} hover:${config.bgColor}`}>{config.label}</Badge>;
  };

  const getUrgencyBadge = (urgency: PurchaseUrgency) => {
    const config = URGENCY_CONFIG[urgency];
    return <span className={`${config.color} font-medium`}>{config.label}</span>;
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">采购申请</h1>
          <p className="text-muted-foreground mt-1">提交物品采购申请，查看审批进度</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          新建申请
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">我的申请</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="p-2 rounded-lg bg-muted">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">待审批</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="p-2 rounded-lg bg-yellow-50">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">已批准</p>
                <p className="text-2xl font-bold text-blue-600">{stats.approved}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-50">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">已完成</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-50">
                <Package className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 申请列表 */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>我的采购申请</CardTitle>
          <CardDescription>查看您提交的所有采购申请及其处理进度</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : purchases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mb-4" />
              <p>暂无采购申请</p>
              <p className="text-sm mt-1">点击右上角"新建申请"按钮提交采购申请</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>申请标题</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>物品数量</TableHead>
                  <TableHead>预估金额</TableHead>
                  <TableHead>紧急程度</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>提交时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.map(purchase => (
                  <TableRow key={purchase.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {purchase.title}
                        {purchase.images && purchase.images.length > 0 && (
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{TYPE_LABELS[purchase.type]}</TableCell>
                    <TableCell>{purchase.items?.length || 0} 项</TableCell>
                    <TableCell>¥{(purchase.total_amount || 0).toLocaleString()}</TableCell>
                    <TableCell>{getUrgencyBadge(purchase.urgency)}</TableCell>
                    <TableCell>{getStatusBadge(purchase.status)}</TableCell>
                    <TableCell>{new Date(purchase.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleViewDetail(purchase)}>
                        <Eye className="h-4 w-4 mr-1" />
                        查看
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新建采购申请</DialogTitle>
            <DialogDescription>填写采购物品信息和申请原因</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* 基本信息 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">采购标题 *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="请输入采购标题"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">采购类型</Label>
                <Select value={formData.type} onValueChange={(v: PurchaseType) => setFormData(prev => ({ ...prev, type: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="office_supplies">办公用品</SelectItem>
                    <SelectItem value="equipment">教学设备</SelectItem>
                    <SelectItem value="maintenance">维修材料</SelectItem>
                    <SelectItem value="other">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department">申请部门</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={e => setFormData(prev => ({ ...prev, department: e.target.value }))}
                  placeholder="请输入申请部门"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="budgetSource">预算来源</Label>
                <Input
                  id="budgetSource"
                  value={formData.budgetSource}
                  onChange={e => setFormData(prev => ({ ...prev, budgetSource: e.target.value }))}
                  placeholder="请输入预算来源"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="urgency">紧急程度</Label>
              <Select value={formData.urgency} onValueChange={(v: PurchaseUrgency) => setFormData(prev => ({ ...prev, urgency: v }))}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">低</SelectItem>
                  <SelectItem value="normal">普通</SelectItem>
                  <SelectItem value="high">高</SelectItem>
                  <SelectItem value="urgent">紧急</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 物品清单 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>物品清单</Label>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  添加物品
                </Button>
              </div>

              <div className="space-y-3">
                {formData.items.map((item, index) => (
                  <div key={index} className="flex items-end gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">物品名称</Label>
                      <Input
                        value={item.name}
                        onChange={e => updateItem(index, 'name', e.target.value)}
                        placeholder="物品名称"
                      />
                    </div>
                    <div className="w-20 space-y-1">
                      <Label className="text-xs">数量</Label>
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={e => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="w-16 space-y-1">
                      <Label className="text-xs">单位</Label>
                      <Input
                        value={item.unit}
                        onChange={e => updateItem(index, 'unit', e.target.value)}
                        placeholder="单位"
                      />
                    </div>
                    <div className="w-24 space-y-1">
                      <Label className="text-xs">预估单价</Label>
                      <Input
                        type="number"
                        min={0}
                        value={item.estimatedPrice}
                        onChange={e => updateItem(index, 'estimatedPrice', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">备注</Label>
                      <Input
                        value={item.remark}
                        onChange={e => updateItem(index, 'remark', e.target.value)}
                        placeholder="备注（选填）"
                      />
                    </div>
                    {formData.items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="text-right text-sm text-muted-foreground">
                预估总金额：<span className="font-bold text-foreground text-lg">¥{totalAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* 申请原因 */}
            <div className="space-y-2">
              <Label htmlFor="reason">申请原因 *</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={e => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="请详细说明采购原因和用途"
                rows={3}
              />
            </div>

            {/* 图片上传 */}
            <div className="space-y-2">
              <Label>附件图片（最多3张）</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageUpload}
              />
              <div className="flex gap-3 flex-wrap">
                {formData.images.map((url, index) => (
                  <div key={index} className="relative w-24 h-24 rounded-lg overflow-hidden border bg-muted">
                    <img src={url} alt={`图片${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {formData.images.length < 3 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-24 h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
                  >
                    {uploading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <>
                        <Upload className="h-6 w-6" />
                        <span className="text-xs mt-1">上传</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              提交申请
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 详情弹窗 */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>采购申请详情</DialogTitle>
          </DialogHeader>

          {selectedPurchase && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">采购标题</p>
                  <p className="font-medium">{selectedPurchase.title}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">采购类型</p>
                  <p>{TYPE_LABELS[selectedPurchase.type]}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">申请部门</p>
                  <p>{selectedPurchase.department || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">预算来源</p>
                  <p>{selectedPurchase.budget_source || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">紧急程度</p>
                  <p>{getUrgencyBadge(selectedPurchase.urgency)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">状态</p>
                  <p>{getStatusBadge(selectedPurchase.status)}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">物品清单</p>
                <div className="bg-muted/50 rounded-lg p-3">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>物品名称</TableHead>
                        <TableHead>数量</TableHead>
                        <TableHead>单位</TableHead>
                        <TableHead>预估单价</TableHead>
                        <TableHead>备注</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedPurchase.items?.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell>¥{(item.estimatedPrice || 0).toLocaleString()}</TableCell>
                          <TableCell>{item.remark || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="text-right mt-2 font-medium">
                  总金额：¥{(selectedPurchase.total_amount || 0).toLocaleString()}
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">申请原因</p>
                <p className="whitespace-pre-wrap">{selectedPurchase.reason}</p>
              </div>

              {selectedPurchase.images && selectedPurchase.images.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">附件图片</p>
                  <div className="flex gap-3">
                    {selectedPurchase.images.map((url, index) => (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-24 h-24 rounded-lg overflow-hidden border hover:border-primary transition-colors"
                      >
                        <img src={url} alt={`图片${index + 1}`} className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {selectedPurchase.rejection_reason && (
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="text-sm font-medium text-red-700">拒绝原因</p>
                  <p className="text-sm text-red-600 mt-1">{selectedPurchase.rejection_reason}</p>
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
