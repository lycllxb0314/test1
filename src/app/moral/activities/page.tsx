'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Calendar,
  Plus,
  Search,
  Users,
  MapPin,
  Clock,
  CheckCircle,
  Star,
  Edit,
  Trash2,
  MoreHorizontal,
  Loader2,
} from 'lucide-react';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { BatchToolbar, SelectColumn, type BatchAction } from '@/components/common/BatchToolbar';

// 德育活动数据类型
interface MoralActivity {
  id: string;
  title: string;
  type: string;
  organizer: string;
  participants: number;
  date: string;
  location: string;
  status: 'planning' | 'upcoming' | 'completed' | 'cancelled';
  description?: string;
}

// 活动类型选项
const activityTypes = [
  '志愿服务',
  '主题教育',
  '感恩教育',
  '环保教育',
  '安全教育',
  '书香校园',
  '爱国主义教育',
  '心理健康',
];

// 组织者选项
const organizers = [
  '少先队大队',
  '德育处',
  '教务处',
  '安保处',
  '科学组',
  '艺术组',
  '体育组',
];

// 状态选项
const statusOptions = [
  { value: 'planning', label: '计划中', color: 'gray' },
  { value: 'upcoming', label: '即将开始', color: 'blue' },
  { value: 'completed', label: '已完成', color: 'green' },
  { value: 'cancelled', label: '已取消', color: 'red' },
];

// 模拟德育活动数据
const mockActivities: MoralActivity[] = [
  { id: '1', title: '学雷锋志愿服务活动', type: '志愿服务', organizer: '少先队大队', participants: 200, date: '2024-03-05', location: '社区', status: 'completed', description: '组织学生到社区开展志愿服务活动' },
  { id: '2', title: '清明节祭扫活动', type: '主题教育', organizer: '德育处', participants: 500, date: '2024-04-03', location: '烈士陵园', status: 'upcoming', description: '组织学生前往烈士陵园进行祭扫' },
  { id: '3', title: '母亲节感恩活动', type: '感恩教育', organizer: '少先队大队', participants: 2800, date: '2024-05-12', location: '各班级', status: 'planning' },
  { id: '4', title: '植树节环保活动', type: '环保教育', organizer: '科学组', participants: 150, date: '2024-03-12', location: '校园', status: 'completed' },
  { id: '5', title: '防震减灾演练', type: '安全教育', organizer: '安保处', participants: 2800, date: '2024-03-18', location: '全校', status: 'completed' },
  { id: '6', title: '读书节系列活动', type: '书香校园', organizer: '教务处', participants: 2800, date: '2024-04-15', location: '图书馆', status: 'upcoming' },
  { id: '7', title: '心理健康讲座', type: '心理健康', organizer: '德育处', participants: 500, date: '2024-04-20', location: '报告厅', status: 'planning' },
];

export default function ActivitiesPage() {
  // 数据状态
  const [activities, setActivities] = useState<MoralActivity[]>(mockActivities);
  const [loading, setLoading] = useState(false);
  
  // 搜索和筛选
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // 选择状态
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // 对话框状态
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [batchDeleteDialogOpen, setBatchDeleteDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  
  // 当前活动
  const [currentActivity, setCurrentActivity] = useState<MoralActivity | null>(null);
  const [formData, setFormData] = useState<Partial<MoralActivity>>({});

  // 统计数据
  const stats = {
    total: activities.length,
    participants: activities.reduce((sum, a) => sum + a.participants, 0),
    completed: activities.filter(a => a.status === 'completed').length,
    featured: activities.filter(a => a.participants > 1000).length,
  };

  // 筛选后的活动列表
  const filteredActivities = activities.filter(a => {
    const matchesSearch = a.title.includes(searchTerm) || a.type.includes(searchTerm);
    const matchesType = typeFilter === 'all' || a.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  // 获取状态标签
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string; label: string }> = {
      planning: { bg: 'bg-gray-100', text: 'text-gray-700', label: '计划中' },
      upcoming: { bg: 'bg-blue-100', text: 'text-blue-700', label: '即将开始' },
      completed: { bg: 'bg-green-100', text: 'text-green-700', label: '已完成' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-700', label: '已取消' },
    };
    const s = statusMap[status] || statusMap.planning;
    return <Badge className={`${s.bg} ${s.text}`}>{s.label}</Badge>;
  };

  // 获取类型标签
  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      '志愿服务': 'bg-red-100 text-red-700',
      '主题教育': 'bg-blue-100 text-blue-700',
      '感恩教育': 'bg-pink-100 text-pink-700',
      '环保教育': 'bg-green-100 text-green-700',
      '安全教育': 'bg-orange-100 text-orange-700',
      '书香校园': 'bg-purple-100 text-purple-700',
      '爱国主义教育': 'bg-red-100 text-red-700',
      '心理健康': 'bg-teal-100 text-teal-700',
    };
    return <Badge className={colors[type] || 'bg-gray-100 text-gray-700'}>{type}</Badge>;
  };

  // 选择操作
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredActivities.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredActivities.map(a => a.id)));
    }
  }, [selectedIds.size, filteredActivities]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // 打开编辑对话框
  const openEditDialog = useCallback((activity: MoralActivity) => {
    setCurrentActivity(activity);
    setFormData({ ...activity });
    setEditDialogOpen(true);
  }, []);

  // 打开删除对话框
  const openDeleteDialog = useCallback((activity: MoralActivity) => {
    setCurrentActivity(activity);
    setDeleteDialogOpen(true);
  }, []);

  // 打开新增对话框
  const openAddDialog = useCallback(() => {
    setCurrentActivity(null);
    setFormData({
      type: '志愿服务',
      organizer: '少先队大队',
      status: 'planning',
      participants: 0,
    });
    setAddDialogOpen(true);
  }, []);

  // 保存活动
  const handleSave = useCallback(async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (currentActivity) {
      setActivities(prev => prev.map(a => 
        a.id === currentActivity.id ? { ...a, ...formData } as MoralActivity : a
      ));
    } else {
      const newActivity: MoralActivity = {
        id: String(Date.now()),
        title: formData.title || '',
        type: formData.type || '志愿服务',
        organizer: formData.organizer || '少先队大队',
        participants: formData.participants || 0,
        date: formData.date || new Date().toISOString().split('T')[0],
        location: formData.location || '',
        status: formData.status as any || 'planning',
        description: formData.description,
      };
      setActivities(prev => [...prev, newActivity]);
    }
    
    setLoading(false);
    setEditDialogOpen(false);
    setAddDialogOpen(false);
    setFormData({});
  }, [currentActivity, formData]);

  // 删除活动
  const handleDelete = useCallback(async () => {
    if (!currentActivity) return;
    
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setActivities(prev => prev.filter(a => a.id !== currentActivity.id));
    setLoading(false);
    setDeleteDialogOpen(false);
    setCurrentActivity(null);
  }, [currentActivity]);

  // 批量删除
  const handleBatchDelete = useCallback(async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setActivities(prev => prev.filter(a => !selectedIds.has(a.id)));
    setLoading(false);
    setBatchDeleteDialogOpen(false);
    clearSelection();
  }, [selectedIds, clearSelection]);

  // 批量更新状态
  const handleBatchUpdateStatus = useCallback(async (status: MoralActivity['status']) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setActivities(prev => prev.map(a => 
      selectedIds.has(a.id) ? { ...a, status } : a
    ));
    setLoading(false);
    clearSelection();
  }, [selectedIds, clearSelection]);

  // 批量操作按钮
  const batchActions: BatchAction[] = [
    {
      key: 'delete',
      label: '批量删除',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: () => setBatchDeleteDialogOpen(true),
      destructive: true,
    },
    {
      key: 'complete',
      label: '标记完成',
      icon: <CheckCircle className="h-4 w-4" />,
      onClick: () => handleBatchUpdateStatus('completed'),
    },
    {
      key: 'cancel',
      label: '取消活动',
      icon: <Calendar className="h-4 w-4" />,
      onClick: () => handleBatchUpdateStatus('cancelled'),
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-green-50/30 via-white to-teal-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">德育活动</h1>
          <p className="text-gray-500 mt-1">德育活动组织与管理</p>
        </div>
        <Button 
          className="bg-green-500 hover:bg-green-600 text-white gap-2"
          onClick={openAddDialog}
        >
          <Plus className="h-4 w-4" />
          新建活动
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">本月活动</p>
                <p className="text-2xl font-bold text-green-600">{stats.total}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-100">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">参与人次</p>
                <p className="text-2xl font-bold text-blue-600">{stats.participants.toLocaleString()}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">已完成</p>
                <p className="text-2xl font-bold text-orange-600">{stats.completed}</p>
              </div>
              <div className="p-2 rounded-lg bg-orange-100">
                <CheckCircle className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">大型活动</p>
                <p className="text-2xl font-bold text-purple-600">{stats.featured}</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-100">
                <Star className="h-5 w-5 text-purple-600" />
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
                placeholder="搜索活动名称或类型..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="活动类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                {activityTypes.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                {statusOptions.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 批量操作工具栏 */}
      <BatchToolbar
        selectedCount={selectedIds.size}
        totalCount={filteredActivities.length}
        isAllSelected={selectedIds.size === filteredActivities.length && filteredActivities.length > 0}
        onToggleSelectAll={toggleSelectAll}
        onClearSelection={clearSelection}
        actions={batchActions}
        processing={loading}
      />

      {/* 活动列表 */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedIds.size === filteredActivities.length && filteredActivities.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>活动名称</TableHead>
                <TableHead>活动类型</TableHead>
                <TableHead>组织者</TableHead>
                <TableHead>参与人数</TableHead>
                <TableHead>活动时间</TableHead>
                <TableHead>地点</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="w-12">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredActivities.map((activity) => (
                <TableRow key={activity.id} className="hover:bg-gray-50">
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <SelectColumn
                      selected={selectedIds.has(activity.id)}
                      onToggle={() => toggleSelect(activity.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{activity.title}</TableCell>
                  <TableCell>{getTypeBadge(activity.type)}</TableCell>
                  <TableCell>{activity.organizer}</TableCell>
                  <TableCell>{activity.participants}人</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-gray-400" />
                      {activity.date}
                    </div>
                  </TableCell>
                  <TableCell>{activity.location}</TableCell>
                  <TableCell>{getStatusBadge(activity.status)}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(activity)}>
                          <Edit className="h-4 w-4 mr-2" />
                          编辑
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => openDeleteDialog(activity)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          删除
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

      {/* 新增/编辑对话框 */}
      <Dialog open={addDialogOpen || editDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setAddDialogOpen(false);
          setEditDialogOpen(false);
          setFormData({});
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{currentActivity ? '编辑活动' : '新建活动'}</DialogTitle>
            <DialogDescription>
              {currentActivity ? '修改活动信息' : '填写新活动信息'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">活动名称 *</Label>
              <Input
                id="title"
                value={formData.title || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="请输入活动名称"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">活动类型</Label>
                <Select
                  value={formData.type || '志愿服务'}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {activityTypes.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="organizer">组织者</Label>
                <Select
                  value={formData.organizer || '少先队大队'}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, organizer: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {organizers.map(o => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">活动日期</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="participants">预计人数</Label>
                <Input
                  id="participants"
                  type="number"
                  value={formData.participants || 0}
                  onChange={(e) => setFormData(prev => ({ ...prev, participants: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">活动地点</Label>
                <Input
                  id="location"
                  value={formData.location || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="请输入地点"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">状态</Label>
                <Select
                  value={formData.status || 'planning'}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">活动描述</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="请输入活动描述"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAddDialogOpen(false);
              setEditDialogOpen(false);
            }}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={loading || !formData.title}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  保存中...
                </>
              ) : (
                '保存'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="确认删除活动"
        description={`确定要删除活动"${currentActivity?.title}"吗？此操作不可撤销。`}
        loading={loading}
      />

      {/* 批量删除确认对话框 */}
      <DeleteConfirmDialog
        open={batchDeleteDialogOpen}
        onOpenChange={setBatchDeleteDialogOpen}
        onConfirm={handleBatchDelete}
        title="确认批量删除"
        description={`确定要删除选中的 ${selectedIds.size} 个活动吗？此操作不可撤销。`}
        loading={loading}
      />
    </div>
  );
}
