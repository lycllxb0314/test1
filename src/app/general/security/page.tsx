'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Shield,
  Plus,
  Eye,
  AlertTriangle,
  CheckCircle,
  Calendar,
  MapPin,
  Users,
  Clock,
  FileText,
  Wrench,
  Trash2,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useSafetyStatistics,
  useDrills,
  useInspections,
  useDrillActions,
  useInspectionActions,
  type SafetyDrill,
  type SafetyInspection,
} from '@/hooks/useSafety';

// 演练类型映射
const drillTypeLabels: Record<string, string> = {
  fire: '消防演练',
  earthquake: '地震演练',
  anti_terror: '防恐演练',
  other: '其他演练',
};

// 检查类型映射
const inspectionTypeLabels: Record<string, string> = {
  daily: '日常巡查',
  fire: '消防检查',
  gate: '门卫检查',
  facility: '设施检查',
  other: '其他检查',
};

// 检查状态映射
const statusLabels: Record<string, string> = {  pending: '待处理',
  in_progress: '处理中',
  completed: '已完成',
};

export default function SecurityPage() {
  const [activeTab, setActiveTab] = useState<'patrol' | 'drill'>('patrol');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('__all__');
  const [filterStatus, setFilterStatus] = useState<string>('__all__');
  
  // 弹窗状态
  const [drillDialogOpen, setDrillDialogOpen] = useState(false);
  const [inspectionDialogOpen, setInspectionDialogOpen] = useState(false);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SafetyDrill | SafetyInspection | null>(null);
  const [detailType, setDetailType] = useState<'drill' | 'inspection'>('inspection');
  
  // 表单状态
  const [drillForm, setDrillForm] = useState({
    type: 'fire',
    title: '',
    drillDate: '',
    location: '',
    participants: 0,
    duration: 0,
    result: '',
    issues: '',
    improvements: '',
    organizer: '',
  });
  
  const [inspectionForm, setInspectionForm] = useState({
    type: 'daily',
    inspector: '',
    inspectionDate: '',
    area: '',
    issues: '',
    notes: '',
  });

  // 数据获取
  const { data: stats, isLoading: statsLoading } = useSafetyStatistics();
  const { data: drills = [], isLoading: drillsLoading } = useDrills();
  const { data: inspectionsData, isLoading: inspectionsLoading } = useInspections({
    status: filterStatus !== '__all__' ? filterStatus : undefined,
    type: filterType !== '__all__' ? filterType : undefined,
  });
  
  const inspections: SafetyInspection[] = inspectionsData?.data || [];
  
  // 操作 hooks
  const drillActions = useDrillActions();
  const inspectionActions = useInspectionActions();

  // 统计卡片数据
  const statsCards = [
    { 
      title: '今日检查', 
      value: stats?.todayInspections ?? 0, 
      icon: Eye, 
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    { 
      title: '待处理隐患', 
      value: stats?.pendingHazards ?? 0, 
      icon: AlertTriangle, 
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    { 
      title: '本月整改', 
      value: stats?.resolvedThisMonth ?? 0, 
      icon: CheckCircle, 
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    { 
      title: '安全等级', 
      value: stats?.safetyLevel ?? '-', 
      icon: Shield, 
      color: stats?.safetyLevel === '良好' ? 'text-green-600' : 'text-orange-600',
      bgColor: stats?.safetyLevel === '良好' ? 'bg-green-100' : 'bg-orange-100',
    },
  ];

  // 状态标签
  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
      in_progress: { bg: 'bg-blue-100', text: 'text-blue-700' },
      completed: { bg: 'bg-green-100', text: 'text-green-700' },
    };
    const style = config[status] || { bg: 'bg-gray-100', text: 'text-gray-700' };
    return <Badge className={`${style.bg} ${style.text}`}>{statusLabels[status] || status}</Badge>;
  };

  // 创建演练
  const handleCreateDrill = async () => {
    if (!drillForm.title || !drillForm.drillDate || !drillForm.organizer) {
      toast.error('请填写完整信息');
      return;
    }
    
    try {
      await drillActions.create({
        type: drillForm.type,
        title: drillForm.title,
        drillDate: drillForm.drillDate,
        location: drillForm.location,
        participants: drillForm.participants,
        duration: drillForm.duration,
        result: drillForm.result,
        issues: drillForm.issues ? drillForm.issues.split('\n').filter(Boolean) : [],
        improvements: drillForm.improvements ? drillForm.improvements.split('\n').filter(Boolean) : [],
        organizer: drillForm.organizer,
      });
      toast.success('创建演练记录成功');
      setDrillDialogOpen(false);
      setDrillForm({
        type: 'fire', title: '', drillDate: '', location: '',
        participants: 0, duration: 0, result: '', issues: '', improvements: '', organizer: '',
      });
    } catch {
      toast.error('创建演练记录失败');
    }
  };

  // 创建检查
  const handleCreateInspection = async () => {
    if (!inspectionForm.inspector || !inspectionForm.inspectionDate || !inspectionForm.area) {
      toast.error('请填写完整信息');
      return;
    }
    
    try {
      await inspectionActions.create({
        type: inspectionForm.type,
        inspector: inspectionForm.inspector,
        inspectionDate: inspectionForm.inspectionDate,
        area: inspectionForm.area,
        issues: inspectionForm.issues ? inspectionForm.issues.split('\n').filter(Boolean) : [],
        notes: inspectionForm.notes,
      });
      toast.success('创建检查记录成功');
      setInspectionDialogOpen(false);
      setInspectionForm({
        type: 'daily', inspector: '', inspectionDate: '', area: '', issues: '', notes: '',
      });
    } catch {
      toast.error('创建检查记录失败');
    }
  };

  // 解决问题
  const handleResolve = async (id: string) => {
    try {
      await inspectionActions.resolve(id, '当前用户');
      toast.success('问题已标记为解决');
    } catch {
      toast.error('操作失败');
    }
  };

  // 删除记录
  const handleDelete = async (type: 'drill' | 'inspection', id: string) => {
    if (!confirm('确定要删除此记录吗？')) return;
    
    try {
      if (type === 'drill') {
        await drillActions.delete(id);
      } else {
        await inspectionActions.delete(id);
      }
      toast.success('删除成功');
      setDetailSheetOpen(false);
    } catch {
      toast.error('删除失败');
    }
  };

  // 查看详情
  const handleViewDetail = (item: SafetyDrill | SafetyInspection, type: 'drill' | 'inspection') => {
    setSelectedItem(item);
    setDetailType(type);
    setDetailSheetOpen(true);
  };

  // 过滤搜索
  const filteredInspections = inspections.filter((item) =>
    item.area.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.inspector.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDrills = drills.filter((item) =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-orange-50/30 via-background to-amber-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">安全管理</h1>
          <p className="text-muted-foreground mt-1">校园安全巡查与演练管理</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setInspectionDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            新建检查
          </Button>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => setDrillDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            新建演练
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        {statsCards.map((stat, index) => (
          <Card key={index} className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>
                    {statsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : stat.value}
                  </p>
                </div>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-2 border-b">
        <button
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'patrol' 
              ? 'border-orange-500 text-orange-600' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('patrol')}
        >
          安全检查
        </button>
        <button
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'drill' 
              ? 'border-orange-500 text-orange-600' 
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveTab('drill')}
        >
          安全演练
        </button>
      </div>

      {/* 筛选栏 */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Input
            placeholder="搜索区域或人员..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-4"
          />
        </div>
        {activeTab === 'patrol' && (
          <>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="检查类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">全部类型</SelectItem>
                {Object.entries(inspectionTypeLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">全部状态</SelectItem>
                {Object.entries(statusLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}
      </div>

      {/* 安全检查列表 */}
      {activeTab === 'patrol' && (
        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            {inspectionsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredInspections.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">暂无检查记录</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>检查编号</TableHead>
                    <TableHead>检查类型</TableHead>
                    <TableHead>检查区域</TableHead>
                    <TableHead>检查人员</TableHead>
                    <TableHead>发现问题</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>检查时间</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInspections.map((record) => (
                    <TableRow key={record.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => handleViewDetail(record, 'inspection')}>
                      <TableCell className="font-medium">{record.id}</TableCell>
                      <TableCell>{inspectionTypeLabels[record.type] || record.type}</TableCell>
                      <TableCell>{record.area}</TableCell>
                      <TableCell>{record.inspector}</TableCell>
                      <TableCell>
                        {record.issues && record.issues.length > 0 ? (
                          <Badge className="bg-red-100 text-red-700">{record.issues.length}个问题</Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-700">无问题</Badge>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell>{record.inspectionDate}</TableCell>
                      <TableCell>
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          {!record.resolved && (
                            <Button size="sm" variant="ghost" onClick={() => handleResolve(record.id)}>
                              <Wrench className="h-4 w-4 text-green-600" />
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
      )}

      {/* 安全演练列表 */}
      {activeTab === 'drill' && (
        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            {drillsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredDrills.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">暂无演练记录</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>演练名称</TableHead>
                    <TableHead>演练类型</TableHead>
                    <TableHead>地点</TableHead>
                    <TableHead>参与人数</TableHead>
                    <TableHead>时长(分)</TableHead>
                    <TableHead>组织人</TableHead>
                    <TableHead>演练日期</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDrills.map((drill) => (
                    <TableRow key={drill.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => handleViewDetail(drill, 'drill')}>
                      <TableCell className="font-medium">{drill.title}</TableCell>
                      <TableCell>{drillTypeLabels[drill.type] || drill.type}</TableCell>
                      <TableCell>{drill.location}</TableCell>
                      <TableCell>{drill.participants || '-'}</TableCell>
                      <TableCell>{drill.duration || '-'}</TableCell>
                      <TableCell>{drill.organizer}</TableCell>
                      <TableCell>{drill.drillDate}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleViewDetail(drill, 'drill'); }}>
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
      )}

      {/* 新建演练弹窗 */}
      <Dialog open={drillDialogOpen} onOpenChange={setDrillDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>新建安全演练</DialogTitle>
            <DialogDescription>填写演练信息创建新的演练记录</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>演练类型</Label>
                <Select value={drillForm.type} onValueChange={(v) => setDrillForm({ ...drillForm, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(drillTypeLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>演练名称 *</Label>
                <Input value={drillForm.title} onChange={(e) => setDrillForm({ ...drillForm, title: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>演练日期 *</Label>
                <Input type="date" value={drillForm.drillDate} onChange={(e) => setDrillForm({ ...drillForm, drillDate: e.target.value })} />
              </div>
              <div>
                <Label>演练地点</Label>
                <Input value={drillForm.location} onChange={(e) => setDrillForm({ ...drillForm, location: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>参与人数</Label>
                <Input type="number" value={drillForm.participants} onChange={(e) => setDrillForm({ ...drillForm, participants: parseInt(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>时长(分钟)</Label>
                <Input type="number" value={drillForm.duration} onChange={(e) => setDrillForm({ ...drillForm, duration: parseInt(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>组织人 *</Label>
                <Input value={drillForm.organizer} onChange={(e) => setDrillForm({ ...drillForm, organizer: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>演练结果</Label>
              <Textarea value={drillForm.result} onChange={(e) => setDrillForm({ ...drillForm, result: e.target.value })} rows={2} />
            </div>
            <div>
              <Label>发现问题 (每行一个)</Label>
              <Textarea value={drillForm.issues} onChange={(e) => setDrillForm({ ...drillForm, issues: e.target.value })} rows={2} placeholder="问题1&#10;问题2" />
            </div>
            <div>
              <Label>改进措施 (每行一个)</Label>
              <Textarea value={drillForm.improvements} onChange={(e) => setDrillForm({ ...drillForm, improvements: e.target.value })} rows={2} placeholder="措施1&#10;措施2" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDrillDialogOpen(false)}>取消</Button>
            <Button onClick={handleCreateDrill} disabled={drillActions.isCreating}>
              {drillActions.isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 新建检查弹窗 */}
      <Dialog open={inspectionDialogOpen} onOpenChange={setInspectionDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>新建安全检查</DialogTitle>
            <DialogDescription>填写检查信息创建新的检查记录</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>检查类型</Label>
                <Select value={inspectionForm.type} onValueChange={(v) => setInspectionForm({ ...inspectionForm, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(inspectionTypeLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>检查人员 *</Label>
                <Input value={inspectionForm.inspector} onChange={(e) => setInspectionForm({ ...inspectionForm, inspector: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>检查日期 *</Label>
                <Input type="date" value={inspectionForm.inspectionDate} onChange={(e) => setInspectionForm({ ...inspectionForm, inspectionDate: e.target.value })} />
              </div>
              <div>
                <Label>检查区域 *</Label>
                <Input value={inspectionForm.area} onChange={(e) => setInspectionForm({ ...inspectionForm, area: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>发现问题 (每行一个)</Label>
              <Textarea value={inspectionForm.issues} onChange={(e) => setInspectionForm({ ...inspectionForm, issues: e.target.value })} rows={3} placeholder="问题1&#10;问题2" />
            </div>
            <div>
              <Label>备注</Label>
              <Textarea value={inspectionForm.notes} onChange={(e) => setInspectionForm({ ...inspectionForm, notes: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInspectionDialogOpen(false)}>取消</Button>
            <Button onClick={handleCreateInspection} disabled={inspectionActions.isCreating}>
              {inspectionActions.isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 详情侧边栏 */}
      <Sheet open={detailSheetOpen} onOpenChange={setDetailSheetOpen}>
        <SheetContent className="w-[500px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{detailType === 'drill' ? '演练详情' : '检查详情'}</SheetTitle>
            <SheetDescription>{selectedItem?.id}</SheetDescription>
          </SheetHeader>
          
          {selectedItem && detailType === 'drill' && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{(selectedItem as SafetyDrill).title}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">类型:</span>
                  <span>{drillTypeLabels[(selectedItem as SafetyDrill).type] || (selectedItem as SafetyDrill).type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">日期:</span>
                  <span>{(selectedItem as SafetyDrill).drillDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">地点:</span>
                  <span>{(selectedItem as SafetyDrill).location || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">人数:</span>
                  <span>{(selectedItem as SafetyDrill).participants || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">时长:</span>
                  <span>{(selectedItem as SafetyDrill).duration || '-'}分钟</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">组织人:</span>
                  <span>{(selectedItem as SafetyDrill).organizer}</span>
                </div>
              </div>
              
              {(selectedItem as SafetyDrill).result && (
                <div>
                  <h4 className="font-medium mb-2">演练结果</h4>
                  <p className="text-sm text-muted-foreground">{(selectedItem as SafetyDrill).result}</p>
                </div>
              )}
              
              {(selectedItem as SafetyDrill).issues && (selectedItem as SafetyDrill).issues!.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">发现问题</h4>
                  <ul className="text-sm space-y-1">
                    {(selectedItem as SafetyDrill).issues!.map((issue, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {(selectedItem as SafetyDrill).improvements && (selectedItem as SafetyDrill).improvements!.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">改进措施</h4>
                  <ul className="text-sm space-y-1">
                    {(selectedItem as SafetyDrill).improvements!.map((improvement, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        <span>{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="pt-4 border-t">
                <Button variant="destructive" size="sm" onClick={() => handleDelete('drill', selectedItem.id)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  删除记录
                </Button>
              </div>
            </div>
          )}
          
          {selectedItem && detailType === 'inspection' && (
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">类型:</span>
                  <span>{inspectionTypeLabels[(selectedItem as SafetyInspection).type] || (selectedItem as SafetyInspection).type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">日期:</span>
                  <span>{(selectedItem as SafetyInspection).inspectionDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">区域:</span>
                  <span>{(selectedItem as SafetyInspection).area}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">检查人:</span>
                  <span>{(selectedItem as SafetyInspection).inspector}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">状态:</span>
                  {getStatusBadge((selectedItem as SafetyInspection).status)}
                </div>
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">已解决:</span>
                  <span>{(selectedItem as SafetyInspection).resolved ? '是' : '否'}</span>
                </div>
              </div>
              
              {(selectedItem as SafetyInspection).issues && (selectedItem as SafetyInspection).issues!.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">发现问题</h4>
                  <ul className="text-sm space-y-1">
                    {(selectedItem as SafetyInspection).issues!.map((issue, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {(selectedItem as SafetyInspection).notes && (
                <div>
                  <h4 className="font-medium mb-2">备注</h4>
                  <p className="text-sm text-muted-foreground">{(selectedItem as SafetyInspection).notes}</p>
                </div>
              )}
              
              <div className="pt-4 border-t flex gap-2">
                {detailType === 'inspection' && !(selectedItem as SafetyInspection).resolved && (
                  <Button size="sm" onClick={() => { handleResolve(selectedItem.id); setDetailSheetOpen(false); }}>
                    <Wrench className="h-4 w-4 mr-2" />
                    标记已解决
                  </Button>
                )}
                <Button variant="destructive" size="sm" onClick={() => handleDelete('inspection', selectedItem.id)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  删除
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
