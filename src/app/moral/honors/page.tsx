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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Award,
  Search,
  Download,
  Plus,
  Trophy,
  Medal,
  Star,
  Filter,
  Calendar,
  Building,
  FileText,
  Edit,
  Trash2,
  Eye,
} from 'lucide-react';

// 模拟荣誉数据
const mockHonors = [
  { id: 'h001', studentId: '2024001', studentName: '张小明', className: '六年级1班', title: '校级三好学生', level: '校级', category: '综合', issuer: '龙岩师范附属小学', date: '2024-06-30', semester: '2023-2024-2', certificateNo: 'LY2024001' },
  { id: 'h002', studentId: '2024002', studentName: '李小红', className: '六年级1班', title: '市级数学竞赛一等奖', level: '市级', category: '学习', issuer: '龙岩市教育局', date: '2024-05-15', semester: '2023-2024-2', certificateNo: 'LY2024002' },
  { id: 'h003', studentId: '2024001', studentName: '张小明', className: '六年级1班', title: '区级作文比赛二等奖', level: '区级', category: '学习', issuer: '新罗区教育局', date: '2024-04-20', semester: '2023-2024-2', certificateNo: 'LY2024003' },
  { id: 'h004', studentId: '2024003', studentName: '王小刚', className: '六年级2班', title: '习惯之星', level: '校级', category: '德育', issuer: '龙岩师范附属小学', date: '2024-03-15', semester: '2023-2024-2', certificateNo: '' },
  { id: 'h005', studentId: '2024004', studentName: '赵小芳', className: '五年级1班', title: '省级绘画比赛三等奖', level: '省级', category: '艺术', issuer: '福建省教育厅', date: '2024-01-10', semester: '2023-2024-1', certificateNo: 'FJ2024005' },
  { id: 'h006', studentId: '2024002', studentName: '李小红', className: '六年级1班', title: '优秀少先队员', level: '校级', category: '德育', issuer: '龙岩师范附属小学', date: '2024-06-01', semester: '2023-2024-2', certificateNo: '' },
  { id: 'h007', studentId: '2024005', studentName: '刘小华', className: '五年级2班', title: '运动会百米第一名', level: '校级', category: '体育', issuer: '龙岩师范附属小学', date: '2024-11-20', semester: '2024-2025-1', certificateNo: '' },
  { id: 'h008', studentId: '2024001', studentName: '张小明', className: '六年级1班', title: '劳动之星', level: '班级', category: '劳动', issuer: '六年级1班', date: '2024-11-01', semester: '2024-2025-1', certificateNo: '' },
];

// 荣誉级别选项
const honorLevels = [
  { value: 'all', label: '全部级别' },
  { value: '国家级', label: '国家级' },
  { value: '省级', label: '省级' },
  { value: '市级', label: '市级' },
  { value: '区级', label: '区级' },
  { value: '校级', label: '校级' },
  { value: '班级', label: '班级' },
];

// 荣誉类别选项
const honorCategories = [
  { value: 'all', label: '全部类别' },
  { value: '综合', label: '综合' },
  { value: '学习', label: '学习' },
  { value: '德育', label: '德育' },
  { value: '体育', label: '体育' },
  { value: '艺术', label: '艺术' },
  { value: '劳动', label: '劳动' },
  { value: '科技', label: '科技' },
];

// 获取荣誉级别颜色
const getLevelColor = (level: string) => {
  const colorMap: Record<string, string> = {
    '国家级': 'bg-red-100 text-red-700 border-red-200',
    '省级': 'bg-purple-100 text-purple-700 border-purple-200',
    '市级': 'bg-blue-100 text-blue-700 border-blue-200',
    '区级': 'bg-green-100 text-green-700 border-green-200',
    '校级': 'bg-orange-100 text-orange-700 border-orange-200',
    '班级': 'bg-gray-100 text-gray-700 border-gray-200',
  };
  return colorMap[level] || 'bg-gray-100 text-gray-700';
};

// 获取荣誉级别图标
const getLevelIcon = (level: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    '国家级': <Trophy className="h-4 w-4 text-red-600" />,
    '省级': <Medal className="h-4 w-4 text-purple-600" />,
    '市级': <Medal className="h-4 w-4 text-blue-600" />,
    '区级': <Star className="h-4 w-4 text-green-600" />,
    '校级': <Star className="h-4 w-4 text-orange-600" />,
    '班级': <Star className="h-4 w-4 text-gray-600" />,
  };
  return iconMap[level] || <Award className="h-4 w-4" />;
};

export default function HonorsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedHonor, setSelectedHonor] = useState<typeof mockHonors[0] | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // 筛选荣誉
  const filteredHonors = mockHonors.filter(h => {
    const matchesSearch = h.studentName.includes(searchTerm) || 
                          h.studentId.includes(searchTerm) || 
                          h.title.includes(searchTerm);
    const matchesLevel = levelFilter === 'all' || h.level === levelFilter;
    const matchesCategory = categoryFilter === 'all' || h.category === categoryFilter;
    return matchesSearch && matchesLevel && matchesCategory;
  });

  // 统计数据
  const stats = {
    total: mockHonors.length,
    national: mockHonors.filter(h => h.level === '国家级').length,
    provincial: mockHonors.filter(h => h.level === '省级').length,
    municipal: mockHonors.filter(h => h.level === '市级').length,
    district: mockHonors.filter(h => h.level === '区级').length,
    school: mockHonors.filter(h => h.level === '校级').length,
  };

  // 查看详情
  const handleViewDetail = (honor: typeof mockHonors[0]) => {
    setSelectedHonor(honor);
    setDetailDialogOpen(true);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 bg-gradient-to-br from-amber-50/30 via-white to-yellow-50/30 min-h-screen">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Trophy className="h-7 w-7 text-amber-500" />
            荣誉管理
          </h1>
          <p className="text-gray-500 mt-1">学生荣誉奖项记录与管理</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            导出报表
          </Button>
          <Button className="bg-amber-500 hover:bg-amber-600 text-white gap-2" onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            添加荣誉
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-500">荣誉总数</p>
            <p className="text-2xl font-bold text-amber-600">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-500">国家级</p>
            <p className="text-2xl font-bold text-red-600">{stats.national}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-500">省级</p>
            <p className="text-2xl font-bold text-purple-600">{stats.provincial}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-500">市级</p>
            <p className="text-2xl font-bold text-blue-600">{stats.municipal}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-500">区级</p>
            <p className="text-2xl font-bold text-green-600">{stats.district}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-500">校级</p>
            <p className="text-2xl font-bold text-orange-600">{stats.school}</p>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和筛选 */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索学生姓名、学号或荣誉名称..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="荣誉级别" />
              </SelectTrigger>
              <SelectContent>
                {honorLevels.map(level => (
                  <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="荣誉类别" />
              </SelectTrigger>
              <SelectContent>
                {honorCategories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 荣誉列表 */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">荣誉记录</CardTitle>
          <CardDescription>共 {filteredHonors.length} 条记录</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>学生信息</TableHead>
                <TableHead>荣誉名称</TableHead>
                <TableHead>级别</TableHead>
                <TableHead>类别</TableHead>
                <TableHead>颁发单位</TableHead>
                <TableHead>获奖日期</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHonors.map((honor) => (
                <TableRow key={honor.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div>
                      <p className="font-medium">{honor.studentName}</p>
                      <p className="text-xs text-muted-foreground">{honor.className}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getLevelIcon(honor.level)}
                      <span className="font-medium">{honor.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getLevelColor(honor.level)} variant="outline">
                      {honor.level}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{honor.category}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{honor.issuer}</TableCell>
                  <TableCell className="text-sm">{honor.date}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleViewDetail(honor)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 荣誉详情对话框 */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              荣誉详情
            </DialogTitle>
          </DialogHeader>
          {selectedHonor && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-lg">
                <div className="p-3 bg-amber-100 rounded-full">
                  {getLevelIcon(selectedHonor.level)}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{selectedHonor.title}</h3>
                  <div className="flex gap-2 mt-1">
                    <Badge className={getLevelColor(selectedHonor.level)} variant="outline">
                      {selectedHonor.level}
                    </Badge>
                    <Badge variant="secondary">{selectedHonor.category}</Badge>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">学生：</span>
                  <span className="font-medium">{selectedHonor.studentName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">班级：</span>
                  <span className="font-medium">{selectedHonor.className}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">获奖日期：</span>
                  <span className="font-medium">{selectedHonor.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">学期：</span>
                  <span className="font-medium">{selectedHonor.semester}</span>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <Building className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <span className="text-muted-foreground">颁发单位：</span>
                    <span className="font-medium">{selectedHonor.issuer}</span>
                  </div>
                </div>
                {selectedHonor.certificateNo && (
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      <span className="text-muted-foreground">证书编号：</span>
                      <span className="font-medium">{selectedHonor.certificateNo}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>关闭</Button>
            <Button>编辑荣誉</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 添加荣誉对话框 */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>添加荣誉</DialogTitle>
            <DialogDescription>为学生添加新的荣誉记录</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm">学生</label>
              <Input placeholder="搜索学生..." className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm">荣誉名称</label>
              <Input placeholder="如：三好学生" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm">荣誉级别</label>
              <Select>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="选择级别" />
                </SelectTrigger>
                <SelectContent>
                  {honorLevels.slice(1).map(level => (
                    <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm">荣誉类别</label>
              <Select>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="选择类别" />
                </SelectTrigger>
                <SelectContent>
                  {honorCategories.slice(1).map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm">颁发单位</label>
              <Input placeholder="颁发机构名称" className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-sm">获奖日期</label>
              <Input type="date" className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>取消</Button>
            <Button>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
