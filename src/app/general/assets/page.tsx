'use client';

import React, { useState, useMemo } from 'react';
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
  Package,
  Plus,
  Search,
  Download,
  Upload,
  MapPin,
  Calendar,
  DollarSign,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  Wrench,
  Building2,
  Monitor,
  Sofa,
  Car,
  MoreHorizontal,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  BarChart3,
  PieChart,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAssets, useAssetStats, useAssetActions, type AssetRecord, type AssetFormData } from '@/hooks/useAssets';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// 资产分类配置
const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  '教学设备': { label: '教学设备', icon: Monitor, color: 'text-blue-500' },
  '办公设备': { label: '办公设备', icon: Monitor, color: 'text-cyan-500' },
  '家具': { label: '家具', icon: Sofa, color: 'text-amber-500' },
  '体育设施': { label: '体育设施', icon: Package, color: 'text-green-500' },
  '车辆': { label: '车辆', icon: Car, color: 'text-purple-500' },
  '建筑': { label: '建筑', icon: Building2, color: 'text-slate-500' },
  '其他': { label: '其他', icon: Package, color: 'text-gray-500' },
};

// 状态配置
const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  '在用': { label: '在用', color: 'text-green-700', bgColor: 'bg-green-50 border-green-200', icon: CheckCircle2 },
  '闲置': { label: '闲置', color: 'text-slate-600', bgColor: 'bg-slate-50 border-slate-200', icon: Clock },
  '维修中': { label: '维修中', color: 'text-amber-700', bgColor: 'bg-amber-50 border-amber-200', icon: Wrench },
  '报废': { label: '已报废', color: 'text-red-600', bgColor: 'bg-red-50 border-red-200', icon: XCircle },
};

// 资产表单弹窗组件
function AssetFormDialog({
  open,
  onClose,
  onSubmit,
  initialData,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AssetFormData) => Promise<void>;
  initialData?: AssetRecord | null;
  loading: boolean;
}) {
  const [formData, setFormData] = useState<AssetFormData>(() => ({
    name: initialData?.name || '',
    category: initialData?.category || '教学设备',
    assetNo: initialData?.asset_no || initialData?.assetNo || '',
    specification: initialData?.specification || '',
    quantity: initialData?.quantity || 1,
    unit: '台',
    purchase_price: initialData?.purchase_price || initialData?.purchasePrice || 0,
    purchase_date: initialData?.purchase_date || initialData?.purchaseDate || '',
    warranty_expiry: initialData?.warranty_expiry || initialData?.warrantyExpiry || '',
    location: initialData?.location || '',
    department: initialData?.department || '',
    manager: initialData?.manager || '',
    status: initialData?.status || '在用',
  }));

  React.useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        category: initialData.category,
        assetNo: initialData.asset_no || initialData.assetNo || '',
        specification: initialData.specification || '',
        quantity: initialData.quantity || 1,
        unit: '台',
        purchase_price: initialData.purchase_price || initialData.purchasePrice || 0,
        purchase_date: initialData.purchase_date || initialData.purchaseDate || '',
        warranty_expiry: initialData.warranty_expiry || initialData.warrantyExpiry || '',
        location: initialData.location || '',
        department: initialData.department || '',
        manager: initialData.manager || '',
        status: initialData.status,
      });
    } else {
      setFormData({
        name: '',
        category: '教学设备',
        assetNo: '',
        specification: '',
        quantity: 1,
        unit: '台',
        purchase_price: 0,
        purchase_date: '',
        warranty_expiry: '',
        location: '',
        department: '',
        manager: '',
        status: '在用',
      });
    }
  }, [initialData, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.category) {
      toast.error('请填写资产名称和分类');
      return;
    }
    await onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? '编辑资产' : '新增资产'}</DialogTitle>
          <DialogDescription>
            {initialData ? '修改资产信息' : '录入新的资产信息'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">资产名称 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="请输入资产名称"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">资产分类 *</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assetNo">资产编号</Label>
              <Input
                id="assetNo"
                value={formData.assetNo}
                onChange={(e) => setFormData({ ...formData, assetNo: e.target.value })}
                placeholder="自动生成或手动输入"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="specification">规格型号</Label>
              <Input
                id="specification"
                value={formData.specification || ''}
                onChange={(e) => setFormData({ ...formData, specification: e.target.value })}
                placeholder="如：HP ProBook 450"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">数量</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">单位</Label>
              <Select value={formData.unit} onValueChange={(v) => setFormData({ ...formData, unit: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="台">台</SelectItem>
                  <SelectItem value="套">套</SelectItem>
                  <SelectItem value="件">件</SelectItem>
                  <SelectItem value="个">个</SelectItem>
                  <SelectItem value="组">组</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchase_price">购买金额（元）</Label>
              <Input
                id="purchase_price"
                type="number"
                min="0"
                value={formData.purchase_price}
                onChange={(e) => setFormData({ ...formData, purchase_price: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchase_date">购买日期</Label>
              <Input
                id="purchase_date"
                type="date"
                value={formData.purchase_date}
                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="warranty_expiry">保修截止日期</Label>
              <Input
                id="warranty_expiry"
                type="date"
                value={formData.warranty_expiry || ''}
                onChange={(e) => setFormData({ ...formData, warranty_expiry: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">存放位置</Label>
              <Input
                id="location"
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="如：教学楼301室"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">归属部门</Label>
              <Input
                id="department"
                value={formData.department || ''}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="如：教务处"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="manager">负责人</Label>
              <Input
                id="manager"
                value={formData.manager || ''}
                onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                placeholder="负责人姓名"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">状态</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// 统计卡片组件
function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: { value: number; label: string };
  color: string;
}) {
  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-xs text-green-600">+{trend.value}%</span>
                <span className="text-xs text-muted-foreground">{trend.label}</span>
              </div>
            )}
          </div>
          <div className={cn('p-3 rounded-xl', color)}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 分类进度条组件
function CategoryBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{count}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// 主页面组件
export default function AssetsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<AssetRecord | null>(null);
  const [detailAsset, setDetailAsset] = useState<AssetRecord | null>(null);

  const { assets, loading: assetsLoading, refetch } = useAssets({});
  const { stats, loading: statsLoading } = useAssetStats();
  const { createAsset, updateAsset, deleteAsset, loading: actionLoading } = useAssetActions();

  // 筛选资产
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const matchesSearch =
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.asset_no || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.location || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || asset.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [assets, searchTerm, categoryFilter, statusFilter]);

  // 获取状态徽章
  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG['在用'];
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={cn('gap-1', config.color, config.bgColor)}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // 获取分类徽章
  const getCategoryBadge = (category: string) => {
    const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG['其他'];
    const Icon = config.icon;
    return (
      <Badge variant="secondary" className={cn('gap-1', config.color)}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // 处理提交
  const handleSubmit = async (data: AssetFormData) => {
    try {
      let result;
      if (editingAsset) {
        result = await updateAsset(editingAsset.id, data);
        if (result.success) {
          toast.success('资产更新成功');
        } else {
          toast.error(result.error || '更新失败');
          return;
        }
      } else {
        result = await createAsset(data);
        if (result.success) {
          toast.success('资产创建成功');
        } else {
          toast.error(result.error || '创建失败');
          return;
        }
      }
      setDialogOpen(false);
      setEditingAsset(null);
      refetch();
    } catch (err) {
      toast.error('操作失败');
    }
  };

  // 处理删除
  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除该资产吗？')) return;
    const result = await deleteAsset(id);
    if (result.success) {
      toast.success('资产已删除');
      refetch();
    } else {
      toast.error(result.error || '删除失败');
    }
  };

  // 打开编辑弹窗
  const handleEdit = (asset: AssetRecord) => {
    setEditingAsset(asset);
    setDialogOpen(true);
  };

  // 打开新增弹窗
  const handleAdd = () => {
    setEditingAsset(null);
    setDialogOpen(true);
  };

  // 格式化金额
  const formatMoney = (value: number | null | undefined) => {
    if (!value) return '-';
    return `¥${Number(value).toLocaleString()}`;
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">资产管理</h1>
          <p className="text-muted-foreground mt-1">学校固定资产登记、查询与管理</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            批量导入
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            导出报表
          </Button>
          <Button onClick={handleAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            新增资产
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="资产总数"
          value={stats?.totalAssets || 0}
          subtitle="种不同资产"
          icon={Package}
          color="bg-blue-500"
        />
        <StatCard
          title="物品数量"
          value={stats?.totalQuantity || 0}
          subtitle="件/台/套"
          icon={BarChart3}
          color="bg-emerald-500"
        />
        <StatCard
          title="资产总值"
          value={stats?.totalValue ? `¥${(stats.totalValue / 10000).toFixed(1)}万` : '¥0'}
          subtitle="固定资产总额"
          icon={DollarSign}
          color="bg-violet-500"
        />
        <StatCard
          title="资产分类"
          value={Object.keys(stats?.byCategory || {}).length}
          subtitle="个分类"
          icon={PieChart}
          color="bg-amber-500"
        />
      </div>

      {/* 分类分布 + 状态概览 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 分类分布 */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <PieChart className="h-4 w-4 text-muted-foreground" />
              资产分类分布
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats?.byCategory && Object.entries(stats.byCategory)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 6)
              .map(([category, count]) => (
                <CategoryBar
                  key={category}
                  label={category}
                  count={count}
                  total={stats?.totalAssets || 1}
                  color={
                    category === '教学设备' ? 'bg-blue-500' :
                    category === '办公设备' ? 'bg-cyan-500' :
                    category === '家具' ? 'bg-amber-500' :
                    category === '体育设施' ? 'bg-green-500' :
                    'bg-gray-400'
                  }
                />
              ))}
            {(!stats?.byCategory || Object.keys(stats.byCategory).length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">暂无分类数据</p>
            )}
          </CardContent>
        </Card>

        {/* 状态概览 */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              资产状态概览
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(STATUS_CONFIG).map(([status, config]) => {
                const count = stats?.byStatus?.[status] || 0;
                const Icon = config.icon;
                return (
                  <div
                    key={status}
                    className={cn(
                      'p-4 rounded-lg border',
                      config.bgColor,
                      'cursor-pointer hover:shadow-sm transition-shadow'
                    )}
                    onClick={() => setStatusFilter(status === statusFilter ? 'all' : status)}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={cn('h-4 w-4', config.color)} />
                      <span className={cn('text-sm font-medium', config.color)}>{config.label}</span>
                    </div>
                    <p className="text-2xl font-bold">{count}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和筛选 */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索资产名称、编号或位置..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="资产分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部分类</SelectItem>
                {Object.keys(CATEGORY_CONFIG).map((key) => (
                  <SelectItem key={key} value={key}>{CATEGORY_CONFIG[key].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                {Object.keys(STATUS_CONFIG).map((key) => (
                  <SelectItem key={key} value={key}>{STATUS_CONFIG[key].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 资产列表 */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {assetsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mb-4 opacity-50" />
              <p>暂无资产数据</p>
              <Button variant="outline" className="mt-4" onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-2" />
                添加第一个资产
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-medium">资产编号</TableHead>
                  <TableHead className="font-medium">资产名称</TableHead>
                  <TableHead className="font-medium">分类</TableHead>
                  <TableHead className="font-medium">规格型号</TableHead>
                  <TableHead className="font-medium text-center">数量</TableHead>
                  <TableHead className="font-medium text-right">价值</TableHead>
                  <TableHead className="font-medium">存放位置</TableHead>
                  <TableHead className="font-medium">状态</TableHead>
                  <TableHead className="font-medium text-center">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssets.map((asset) => (
                  <TableRow key={asset.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {asset.asset_no || asset.assetNo || '-'}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{asset.name}</p>
                        {asset.department && (
                          <p className="text-xs text-muted-foreground">{asset.department}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getCategoryBadge(asset.category)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {asset.specification || asset.model || '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      {asset.quantity || 1} {asset.unit || '台'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatMoney(asset.purchase_price || asset.purchasePrice || asset.value)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="text-sm">{asset.location || '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(asset.status)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="gap-2" onClick={() => setDetailAsset(asset)}>
                            <Eye className="h-4 w-4" />
                            查看详情
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2" onClick={() => handleEdit(asset)}>
                            <Edit className="h-4 w-4" />
                            编辑信息
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2">
                            <Wrench className="h-4 w-4" />
                            报修申请
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="gap-2 text-destructive focus:text-destructive"
                            onClick={() => handleDelete(asset.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            删除资产
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 新增/编辑弹窗 */}
      <AssetFormDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingAsset(null);
        }}
        onSubmit={handleSubmit}
        initialData={editingAsset}
        loading={actionLoading}
      />

      {/* 详情弹窗 */}
      <Dialog open={!!detailAsset} onOpenChange={() => setDetailAsset(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              资产详情
            </DialogTitle>
          </DialogHeader>
          {detailAsset && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">资产编号</p>
                  <p className="font-mono">{detailAsset.asset_no || detailAsset.assetNo || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">资产名称</p>
                  <p className="font-medium">{detailAsset.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">分类</p>
                  {getCategoryBadge(detailAsset.category)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">状态</p>
                  {getStatusBadge(detailAsset.status)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">规格型号</p>
                  <p>{detailAsset.specification || detailAsset.model || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">数量</p>
                  <p>{detailAsset.quantity || 1} {detailAsset.unit || '台'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">购买金额</p>
                  <p className="font-medium">{formatMoney(detailAsset.purchase_price || detailAsset.purchasePrice || detailAsset.value)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">购买日期</p>
                  <p>{detailAsset.purchase_date || detailAsset.purchaseDate || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">存放位置</p>
                  <p className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    {detailAsset.location || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">负责人</p>
                  <p>{detailAsset.manager || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">保修截止</p>
                  <p>{detailAsset.warranty_expiry || detailAsset.warrantyExpiry || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">归属部门</p>
                  <p>{detailAsset.department || '-'}</p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setDetailAsset(null)}>
                  关闭
                </Button>
                <Button onClick={() => {
                  setDetailAsset(null);
                  handleEdit(detailAsset);
                }}>
                  编辑
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
