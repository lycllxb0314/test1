'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Package,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  MapPin,
  Calendar,
  DollarSign,
  User,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { mockAssets } from '@/data/mock';

// 扩展资产数据
const assetsData = [
  ...mockAssets,
  {
    id: 'A004',
    assetNo: 'LY-2024-003',
    name: '实验室显微镜',
    category: '教学设备',
    specification: '双目生物显微镜',
    quantity: 20,
    unit: '台',
    value: 48000,
    purchaseDate: '2023-09-01',
    warrantyExpiry: '2026-09-01',
    location: '科学实验室',
    department: '科学组',
    status: '在用',
    createdAt: '2023-09-01',
  },
  {
    id: 'A005',
    assetNo: 'LY-2024-004',
    name: '图书馆书架',
    category: '家具',
    specification: '钢制双面书架',
    quantity: 30,
    unit: '组',
    value: 45000,
    purchaseDate: '2023-07-15',
    location: '图书馆',
    department: '图书馆',
    status: '在用',
    createdAt: '2023-07-15',
  },
  {
    id: 'A006',
    assetNo: 'LY-2024-005',
    name: '体育馆篮球架',
    category: '体育设施',
    specification: '电动升降篮球架',
    quantity: 2,
    unit: '套',
    value: 28000,
    purchaseDate: '2024-01-10',
    warrantyExpiry: '2027-01-10',
    location: '体育馆',
    department: '体育组',
    status: '在用',
    createdAt: '2024-01-10',
  },
];

export default function AssetsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // 筛选资产
  const filteredAssets = assetsData.filter((asset) => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.assetNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || asset.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // 计算统计
  const totalValue = assetsData.reduce((sum, asset) => sum + asset.value, 0);
  const totalQuantity = assetsData.reduce((sum, asset) => sum + asset.quantity, 0);

  // 获取状态徽章
  const getStatusBadge = (status: string) => {
    switch (status) {
      case '在用':
        return <Badge className="bg-green-100 text-green-700">在用</Badge>;
      case '闲置':
        return <Badge className="bg-gray-100 text-gray-700">闲置</Badge>;
      case '维修中':
        return <Badge className="bg-yellow-100 text-yellow-700">维修中</Badge>;
      case '报废':
        return <Badge className="bg-red-100 text-red-700">报废</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-orange-50/30 via-white to-amber-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">资产管理</h1>
          <p className="text-gray-500 mt-1">学校资产登记、查询与管理</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            批量导入
          </Button>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
            <Plus className="h-4 w-4" />
            新增资产
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">资产总数</p>
                <p className="text-3xl font-bold text-gray-900">{assetsData.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-100">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">物品数量</p>
                <p className="text-3xl font-bold text-gray-900">{totalQuantity}</p>
              </div>
              <div className="p-3 rounded-xl bg-green-100">
                <Package className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">资产总值</p>
                <p className="text-2xl font-bold text-gray-900">¥{(totalValue / 10000).toFixed(1)}万</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-100">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">资产分类</p>
                <p className="text-3xl font-bold text-gray-900">8</p>
              </div>
              <div className="p-3 rounded-xl bg-orange-100">
                <Package className="h-6 w-6 text-orange-600" />
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
                <SelectItem value="教学设备">教学设备</SelectItem>
                <SelectItem value="办公设备">办公设备</SelectItem>
                <SelectItem value="家具">家具</SelectItem>
                <SelectItem value="体育设施">体育设施</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="在用">在用</SelectItem>
                <SelectItem value="闲置">闲置</SelectItem>
                <SelectItem value="维修中">维修中</SelectItem>
                <SelectItem value="报废">报废</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="gap-1">
              <Download className="h-4 w-4" />
              导出
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 资产列表 */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>资产编号</TableHead>
                <TableHead>资产名称</TableHead>
                <TableHead>分类</TableHead>
                <TableHead>规格型号</TableHead>
                <TableHead>数量</TableHead>
                <TableHead>价值</TableHead>
                <TableHead>存放位置</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssets.map((asset) => (
                <TableRow key={asset.id} className="hover:bg-gray-50">
                  <TableCell className="font-mono text-sm">{asset.assetNo}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{asset.name}</p>
                      <p className="text-xs text-gray-500">{asset.department}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{asset.category}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">{asset.specification || '-'}</TableCell>
                  <TableCell>{asset.quantity} {asset.unit}</TableCell>
                  <TableCell className="font-medium">¥{asset.value.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-gray-600">
                      <MapPin className="h-3 w-3" />
                      {asset.location}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(asset.status)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem className="gap-2">
                          <Eye className="h-4 w-4" />
                          查看详情
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                          <Edit className="h-4 w-4" />
                          编辑信息
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                          <Package className="h-4 w-4" />
                          资产盘点
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2 text-red-600">
                          <Trash2 className="h-4 w-4" />
                          标记报废
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
