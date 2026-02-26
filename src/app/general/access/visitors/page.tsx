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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Users,
  Plus,
  Search,
  Clock,
  Phone,
  Calendar,
  UserCheck,
  XCircle,
  CheckCircle,
  AlertTriangle,
  MapPin,
  Car,
  Eye,
  Edit,
  QrCode,
  Send,
  MoreHorizontal,
  FileText,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Visitor } from '@/types';

// 模拟访客数据
const mockVisitors: Visitor[] = [
  {
    id: 'v001',
    name: '张家长',
    gender: '男',
    phone: '13812345678',
    idCard: '3508**********1234',
    idType: '身份证',
    visitPurpose: '家长会',
    visitType: '家长来访',
    hostId: 't001',
    hostName: '王老师',
    hostType: 'teacher',
    hostPhone: '139****1001',
    expectedArriveTime: '2024-03-15 14:00',
    status: 'approved',
    temporaryAccess: [{ deviceId: 'dev-001', deviceName: '东校门入口', validFrom: '2024-03-15 14:00', validTo: '2024-03-15 17:00' }],
    createdAt: '2024-03-14 16:30',
    updatedAt: '2024-03-14 17:00',
    approvedBy: 'admin',
    approvedByName: '管理员',
    approvedAt: '2024-03-14 17:00',
  },
  {
    id: 'v002',
    name: '李工程师',
    gender: '男',
    phone: '13987654321',
    idCard: '3508**********5678',
    idType: '身份证',
    visitPurpose: '设备维修',
    visitType: '维修服务',
    hostId: 'dept101',
    hostName: '后勤部',
    hostType: 'staff',
    expectedArriveTime: '2024-03-15 15:30',
    status: 'pending',
    temporaryAccess: [],
    createdAt: '2024-03-15 09:00',
    updatedAt: '2024-03-15 09:00',
  },
  {
    id: 'v003',
    name: '王先生',
    gender: '男',
    phone: '13711112222',
    idCard: '3508**********9012',
    idType: '身份证',
    visitPurpose: '公务来访',
    visitType: '公务来访',
    hostId: 'principal',
    hostName: '校长室',
    hostType: 'teacher',
    expectedArriveTime: '2024-03-16 09:00',
    status: 'pending',
    temporaryAccess: [],
    createdAt: '2024-03-15 10:00',
    updatedAt: '2024-03-15 10:00',
  },
  {
    id: 'v004',
    name: '赵女士',
    gender: '女',
    phone: '13633334444',
    idCard: '3508**********3456',
    idType: '身份证',
    visitPurpose: '学生家长探访',
    visitType: '家长来访',
    hostId: 't002',
    hostName: '林老师',
    hostType: 'teacher',
    hostPhone: '139****1002',
    expectedArriveTime: '2024-03-15 10:00',
    actualArriveTime: '2024-03-15 10:05',
    actualLeaveTime: '2024-03-15 11:30',
    status: 'left',
    temporaryAccess: [{ deviceId: 'dev-001', deviceName: '东校门入口', validFrom: '2024-03-15 10:00', validTo: '2024-03-15 12:00', qrCode: 'QR-V004-001' }],
    createdAt: '2024-03-14 14:00',
    updatedAt: '2024-03-15 11:30',
  },
  {
    id: 'v005',
    name: '钱快递员',
    gender: '男',
    phone: '13555556666',
    idType: '身份证',
    visitPurpose: '快递配送',
    visitType: '快递配送',
    hostId: 'dept101',
    hostName: '后勤部',
    hostType: 'staff',
    expectedArriveTime: '2024-03-15 14:00',
    status: 'arrived',
    actualArriveTime: '2024-03-15 14:02',
    temporaryAccess: [{ deviceId: 'dev-003', deviceName: '西校门入口', validFrom: '2024-03-15 14:00', validTo: '2024-03-15 15:00', qrCode: 'QR-V005-001' }],
    createdAt: '2024-03-15 13:30',
    updatedAt: '2024-03-15 14:02',
  },
];

// 访客状态映射
const statusMap: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: '待审批', color: 'text-orange-600 bg-orange-50', icon: Clock },
  approved: { label: '已批准', color: 'text-green-600 bg-green-50', icon: CheckCircle },
  arrived: { label: '已到访', color: 'text-blue-600 bg-blue-50', icon: UserCheck },
  left: { label: '已离开', color: 'text-gray-600 bg-gray-50', icon: CheckCircle },
  cancelled: { label: '已取消', color: 'text-gray-500 bg-gray-50', icon: XCircle },
  rejected: { label: '已拒绝', color: 'text-red-600 bg-red-50', icon: XCircle },
};

// 来访类型映射
const visitTypeMap: Record<string, string> = {
  '家长来访': 'text-blue-600 bg-blue-50',
  '公务来访': 'text-purple-600 bg-purple-50',
  '维修服务': 'text-orange-600 bg-orange-50',
  '快递配送': 'text-teal-600 bg-teal-50',
  '其他': 'text-gray-600 bg-gray-50',
};

export default function VisitorsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'today'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);

  // 过滤访客
  const filterVisitors = () => {
    let filtered = mockVisitors;

    // 标签筛选
    if (activeTab === 'pending') {
      filtered = filtered.filter(v => v.status === 'pending');
    } else if (activeTab === 'today') {
      const today = new Date().toISOString().split('T')[0];
      filtered = filtered.filter(v => v.expectedArriveTime.startsWith(today));
    }

    // 状态筛选
    if (statusFilter !== 'all') {
      filtered = filtered.filter(v => v.status === statusFilter);
    }

    // 搜索
    if (searchTerm) {
      filtered = filtered.filter(v =>
        v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.phone.includes(searchTerm) ||
        v.hostName.includes(searchTerm)
      );
    }

    return filtered;
  };

  const filteredVisitors = filterVisitors();

  // 统计
  const stats = {
    total: mockVisitors.length,
    pending: mockVisitors.filter(v => v.status === 'pending').length,
    today: mockVisitors.filter(v => {
      const today = new Date().toISOString().split('T')[0];
      return v.expectedArriveTime.startsWith(today);
    }).length,
    visiting: mockVisitors.filter(v => v.status === 'arrived').length,
  };

  // 新访客表单
  const [newVisitor, setNewVisitor] = useState({
    name: '',
    gender: '男',
    phone: '',
    idCard: '',
    visitPurpose: '',
    visitType: '家长来访',
    hostName: '',
    hostPhone: '',
    expectedArriveTime: '',
    vehicleNo: '',
  });

  const handleAddVisitor = () => {
    // 这里会调用API创建访客
    setShowAddDialog(false);
    setNewVisitor({
      name: '',
      gender: '男',
      phone: '',
      idCard: '',
      visitPurpose: '',
      visitType: '家长来访',
      hostName: '',
      hostPhone: '',
      expectedArriveTime: '',
      vehicleNo: '',
    });
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-teal-50/30 via-white to-cyan-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-7 w-7 text-teal-600" />
            <h1 className="text-2xl font-bold text-gray-900">访客管理</h1>
          </div>
          <p className="text-gray-500 mt-1">访客登记、审批与临时通行权限管理</p>
        </div>
        <Button className="bg-teal-600 hover:bg-teal-700 text-white gap-2" onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4" />
          登记访客
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">待审批</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">今日访客</p>
                <p className="text-2xl font-bold text-blue-600">{stats.today}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">在访中</p>
                <p className="text-2xl font-bold text-green-600">{stats.visiting}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">本月累计</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total * 3}</p>
              </div>
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab 切换和筛选 */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full sm:w-auto">
          <TabsList>
            <TabsTrigger value="all">全部访客</TabsTrigger>
            <TabsTrigger value="pending">
              待审批
              {stats.pending > 0 && (
                <Badge className="ml-1.5 bg-orange-500 text-white text-xs px-1.5 py-0">{stats.pending}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="today">今日访客</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="搜索访客..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-48"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-28">
              <SelectValue placeholder="状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="pending">待审批</SelectItem>
              <SelectItem value="approved">已批准</SelectItem>
              <SelectItem value="arrived">已到访</SelectItem>
              <SelectItem value="left">已离开</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 访客列表 */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>访客信息</TableHead>
                <TableHead>来访类型</TableHead>
                <TableHead>被访人</TableHead>
                <TableHead>来访目的</TableHead>
                <TableHead>预计时间</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVisitors.map(visitor => {
                const statusInfo = statusMap[visitor.status];
                const StatusIcon = statusInfo.icon;
                return (
                  <TableRow key={visitor.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${visitor.gender === '男' ? 'bg-blue-400' : 'bg-pink-400'}`}>
                          {visitor.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{visitor.name}</p>
                          <p className="text-xs text-gray-400 flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {visitor.phone}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={visitTypeMap[visitor.visitType]}>{visitor.visitType}</Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{visitor.hostName}</p>
                        <p className="text-xs text-gray-400">{visitor.hostPhone || '-'}</p>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-32 truncate" title={visitor.visitPurpose}>{visitor.visitPurpose}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{visitor.expectedArriveTime.split(' ')[0]}</p>
                        <p className="text-gray-500">{visitor.expectedArriveTime.split(' ')[1]}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusInfo.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedVisitor(visitor)}>
                            <Eye className="h-4 w-4 mr-2" />
                            查看详情
                          </DropdownMenuItem>
                          {visitor.status === 'pending' && (
                            <>
                              <DropdownMenuItem className="text-green-600">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                批准访问
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <XCircle className="h-4 w-4 mr-2" />
                                拒绝访问
                              </DropdownMenuItem>
                            </>
                          )}
                          {visitor.status === 'approved' && (
                            <DropdownMenuItem>
                              <QrCode className="h-4 w-4 mr-2" />
                              发送通行码
                            </DropdownMenuItem>
                          )}
                          {visitor.status === 'arrived' && (
                            <DropdownMenuItem>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              登记离开
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            编辑信息
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 登记访客对话框 */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-teal-600" />
              登记访客
            </DialogTitle>
            <DialogDescription>
              填写访客信息并提交审批
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>姓名 *</Label>
                <Input value={newVisitor.name} onChange={(e) => setNewVisitor(prev => ({ ...prev, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>性别</Label>
                <Select value={newVisitor.gender} onValueChange={(v) => setNewVisitor(prev => ({ ...prev, gender: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="男">男</SelectItem>
                    <SelectItem value="女">女</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>联系电话 *</Label>
                <Input value={newVisitor.phone} onChange={(e) => setNewVisitor(prev => ({ ...prev, phone: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>身份证号</Label>
                <Input value={newVisitor.idCard} onChange={(e) => setNewVisitor(prev => ({ ...prev, idCard: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>来访类型</Label>
                <Select value={newVisitor.visitType} onValueChange={(v) => setNewVisitor(prev => ({ ...prev, visitType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="家长来访">家长来访</SelectItem>
                    <SelectItem value="公务来访">公务来访</SelectItem>
                    <SelectItem value="维修服务">维修服务</SelectItem>
                    <SelectItem value="快递配送">快递配送</SelectItem>
                    <SelectItem value="其他">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>车牌号码</Label>
                <Input value={newVisitor.vehicleNo} onChange={(e) => setNewVisitor(prev => ({ ...prev, vehicleNo: e.target.value }))} placeholder="选填" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>被访人 *</Label>
              <Input value={newVisitor.hostName} onChange={(e) => setNewVisitor(prev => ({ ...prev, hostName: e.target.value }))} placeholder="教师姓名或部门名称" />
            </div>
            <div className="space-y-2">
              <Label>来访目的 *</Label>
              <Textarea value={newVisitor.visitPurpose} onChange={(e) => setNewVisitor(prev => ({ ...prev, visitPurpose: e.target.value }))} placeholder="请简要说明来访目的" />
            </div>
            <div className="space-y-2">
              <Label>预计到达时间 *</Label>
              <Input type="datetime-local" value={newVisitor.expectedArriveTime} onChange={(e) => setNewVisitor(prev => ({ ...prev, expectedArriveTime: e.target.value }))} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>取消</Button>
            <Button className="bg-teal-600 hover:bg-teal-700" onClick={handleAddVisitor}>提交登记</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 访客详情对话框 */}
      <Dialog open={!!selectedVisitor} onOpenChange={() => setSelectedVisitor(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-teal-600" />
              访客详情
            </DialogTitle>
          </DialogHeader>

          {selectedVisitor && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-medium ${selectedVisitor.gender === '男' ? 'bg-blue-400' : 'bg-pink-400'}`}>
                  {selectedVisitor.name.charAt(0)}
                </div>
                <div>
                  <p className="text-lg font-medium">{selectedVisitor.name}</p>
                  <p className="text-sm text-gray-500">{selectedVisitor.gender} · {selectedVisitor.phone}</p>
                </div>
                <Badge className={statusMap[selectedVisitor.status].color}>
                  {statusMap[selectedVisitor.status].label}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-gray-500 text-xs">身份证号</Label>
                  <p>{selectedVisitor.idCard || '-'}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">来访类型</Label>
                  <p>{selectedVisitor.visitType}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">被访人</Label>
                  <p>{selectedVisitor.hostName}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">被访人电话</Label>
                  <p>{selectedVisitor.hostPhone || '-'}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-gray-500 text-xs">来访目的</Label>
                  <p>{selectedVisitor.visitPurpose}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">预计到达</Label>
                  <p>{selectedVisitor.expectedArriveTime}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">实际到达</Label>
                  <p>{selectedVisitor.actualArriveTime || '-'}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">实际离开</Label>
                  <p>{selectedVisitor.actualLeaveTime || '-'}</p>
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">车牌号码</Label>
                  <p>{selectedVisitor.vehicleNo || '-'}</p>
                </div>
              </div>

              {selectedVisitor.temporaryAccess.length > 0 && (
                <div className="border-t pt-4">
                  <Label className="text-gray-500 text-xs mb-2 block">临时通行权限</Label>
                  {selectedVisitor.temporaryAccess.map((access, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-teal-50 rounded text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-teal-600" />
                        <span>{access.deviceName}</span>
                      </div>
                      <span className="text-gray-500">{access.validFrom.split(' ')[1]} - {access.validTo.split(' ')[1]}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedVisitor(null)}>关闭</Button>
            {selectedVisitor?.status === 'pending' && (
              <>
                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">拒绝</Button>
                <Button className="bg-teal-600 hover:bg-teal-700">批准</Button>
              </>
            )}
            {selectedVisitor?.status === 'approved' && (
              <Button className="bg-teal-600 hover:bg-teal-700 gap-2">
                <Send className="h-4 w-4" />
                发送通行码
              </Button>
            )}
            {selectedVisitor?.status === 'arrived' && (
              <Button className="bg-green-600 hover:bg-green-700">登记离开</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
