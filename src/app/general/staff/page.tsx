'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from '@/components/ui/pagination';
import {
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Camera,
  CheckCircle2,
  AlertCircle,
  Upload,
  User,
  Shield,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

// ==================== 类型 ====================

type StaffMember = {
  id: string;
  name: string;
  personType: string;
  position: string;
  department: string;
  phone: string;
  area: string;
  photoUrl: string;
  status: string;
  hasFaceVector: boolean;
  createdAt: string;
  updatedAt: string;
};

type StaffFormData = {
  name: string;
  position: string;
  department: string;
  phone: string;
  area: string;
};

const DEPARTMENTS = [
  { value: 'cleaning', label: '保洁部' },
  { value: 'security', label: '安保部' },
  { value: 'canteen', label: '食堂部' },
  { value: 'maintenance', label: '维修部' },
  { value: 'gardening', label: '绿化部' },
  { value: 'logistics', label: '物流部' },
  { value: 'other', label: '其他' },
];

const DEPARTMENT_MAP: Record<string, string> = Object.fromEntries(
  DEPARTMENTS.map(d => [d.value, d.label]),
);

// ==================== 组件 ====================

export default function StaffManagementPage() {
  // 状态
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // 弹窗
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPhotoDialog, setShowPhotoDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentStaff, setCurrentStaff] = useState<StaffMember | null>(null);

  // 表单
  const [formData, setFormData] = useState<StaffFormData>({
    name: '',
    position: '',
    department: '',
    phone: '',
    area: '',
  });

  // 照片上传
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 加载列表
  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });
      if (search) params.set('search', search);
      if (departmentFilter && departmentFilter !== 'all') params.set('department', departmentFilter);

      const res = await fetch(`/api/general/staff?${params}`, { credentials: 'include' });
      const json = await res.json();
      if (json.success && json.data) {
        setStaffList(json.data.items || []);
        setTotal(json.data.total || 0);
      }
    } catch (e) {
      console.error('获取人员列表失败:', e);
      toast.error('获取人员列表失败');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, departmentFilter]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  // 创建
  const handleCreate = async () => {
    if (!formData.name || !formData.position || !formData.department) {
      toast.error('请填写姓名、岗位和部门');
      return;
    }
    try {
      const res = await fetch('/api/general/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('人员创建成功');
        setShowCreateDialog(false);
        resetForm();
        fetchStaff();
      } else {
        toast.error(json.error || '创建失败');
      }
    } catch {
      toast.error('创建失败');
    }
  };

  // 更新
  const handleUpdate = async () => {
    if (!currentStaff) return;
    try {
      const res = await fetch(`/api/general/staff/${currentStaff.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('更新成功');
        setShowEditDialog(false);
        setCurrentStaff(null);
        resetForm();
        fetchStaff();
      } else {
        toast.error(json.error || '更新失败');
      }
    } catch {
      toast.error('更新失败');
    }
  };

  // 删除
  const handleDelete = async () => {
    if (!currentStaff) return;
    try {
      const res = await fetch(`/api/general/staff/${currentStaff.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const json = await res.json();
      if (json.success) {
        toast.success('删除成功');
        setShowDeleteDialog(false);
        setCurrentStaff(null);
        fetchStaff();
      } else {
        toast.error(json.error || '删除失败');
      }
    } catch {
      toast.error('删除失败');
    }
  };

  // 照片上传
  const handlePhotoUpload = async () => {
    if (!currentStaff || !photoPreview) return;
    setUploading(true);
    try {
      // 1) 先上传文件
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          fileData: photoPreview,
          fileName: `staff-${currentStaff.id}-${Date.now()}.jpg`,
        }),
      });
      const uploadJson = await res.json();
      if (!uploadJson.success || !uploadJson.data?.url) {
        toast.error('照片上传失败');
        return;
      }

      // 2) 更新人员照片 + 触发向量生成
      const photoRes = await fetch(`/api/general/staff/${currentStaff.id}/photo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ photoUrl: uploadJson.data.url }),
      });
      const photoJson = await photoRes.json();
      if (photoJson.success) {
        toast.success('照片已更新，人脸向量正在后台生成');
        setShowPhotoDialog(false);
        setCurrentStaff(null);
        setPhotoPreview('');
        fetchStaff();
      } else {
        toast.error(photoJson.error || '更新照片失败');
      }
    } catch {
      toast.error('照片上传失败');
    } finally {
      setUploading(false);
    }
  };

  // 选择文件 → 预览
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('照片不能超过5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setFormData({ name: '', position: '', department: '', phone: '', area: '' });
  };

  const openEdit = (staff: StaffMember) => {
    setCurrentStaff(staff);
    setFormData({
      name: staff.name,
      position: staff.position,
      department: staff.department,
      phone: staff.phone,
      area: staff.area,
    });
    setShowEditDialog(true);
  };

  const openPhoto = (staff: StaffMember) => {
    setCurrentStaff(staff);
    setPhotoPreview(staff.photoUrl || '');
    setShowPhotoDialog(true);
  };

  // 统计
  const totalStaff = total;
  const withVector = staffList.filter(s => s.hasFaceVector).length;
  const withoutVector = staffList.filter(s => !s.hasFaceVector).length;

  return (
    <div className="space-y-6 px-6 py-4">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold">人员管理</h1>
        <p className="text-muted-foreground mt-1">管理后勤人员信息与门禁人脸照片</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">总人数</p>
                <p className="text-2xl font-bold">{totalStaff}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-500/10">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">已录入人脸</p>
                <p className="text-2xl font-bold">{withVector}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-orange-500/10">
                <AlertCircle className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">未录入人脸</p>
                <p className="text-2xl font-bold">{withoutVector}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 工具栏 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索姓名、岗位..."
                className="pl-9"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <Select value={departmentFilter} onValueChange={v => { setDepartmentFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="全部部门" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部部门</SelectItem>
                {DEPARTMENTS.map(d => (
                  <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => { resetForm(); setShowCreateDialog(true); }}>
              <Plus className="h-4 w-4 mr-1" /> 添加人员
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 列表 */}
      <Card>
        <CardContent className="p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px] px-4 py-3">照片</TableHead>
                <TableHead className="px-4 py-3">姓名</TableHead>
                <TableHead className="px-4 py-3">岗位</TableHead>
                <TableHead className="px-4 py-3">部门</TableHead>
                <TableHead className="px-4 py-3">联系电话</TableHead>
                <TableHead className="px-4 py-3">负责区域</TableHead>
                <TableHead className="px-4 py-3">门禁状态</TableHead>
                <TableHead className="w-[80px] px-4 py-3">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    加载中...
                  </TableCell>
                </TableRow>
              ) : staffList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    暂无人员数据
                  </TableCell>
                </TableRow>
              ) : (
                staffList.map(staff => (
                  <TableRow key={staff.id}>
                    <TableCell className="px-4 py-3">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                        {staff.photoUrl ? (
                          <img src={staff.photoUrl} alt={staff.name} className="h-full w-full object-cover" />
                        ) : (
                          <User className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium px-4 py-3">{staff.name}</TableCell>
                    <TableCell className="px-4 py-3">{staff.position}</TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge variant="secondary">{DEPARTMENT_MAP[staff.department] || staff.department}</Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3">{staff.phone || '-'}</TableCell>
                    <TableCell className="px-4 py-3">{staff.area || '-'}</TableCell>
                    <TableCell className="px-4 py-3">
                      {staff.hasFaceVector ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> 已录入
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-orange-600 border-orange-300">
                          <AlertCircle className="h-3 w-3 mr-1" /> 未录入
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openPhoto(staff)}>
                            <Camera className="h-4 w-4 mr-2" />
                            {staff.hasFaceVector ? '更新照片' : '上传照片'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(staff)}>
                            <Pencil className="h-4 w-4 mr-2" /> 编辑信息
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => { setCurrentStaff(staff); setShowDeleteDialog(true); }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> 删除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 分页 */}
      {total > pageSize && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className={page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              {Array.from({ length: Math.ceil(total / pageSize) }, (_, i) => i + 1)
                .filter(p => p === 1 || p === Math.ceil(total / pageSize) || Math.abs(p - page) <= 1)
                .map(p => (
                  <PaginationItem key={p}>
                    <Button
                      variant={p === page ? 'default' : 'outline'}
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </Button>
                  </PaginationItem>
                ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setPage(p => Math.min(Math.ceil(total / pageSize), p + 1))}
                  className={page >= Math.ceil(total / pageSize) ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* 创建/编辑弹窗 */}
      <Dialog open={showCreateDialog || showEditDialog} onOpenChange={v => {
        if (!v) { setShowCreateDialog(false); setShowEditDialog(false); setCurrentStaff(null); resetForm(); }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{showEditDialog ? '编辑人员信息' : '添加后勤人员'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>姓名 *</Label>
                <Input
                  value={formData.name}
                  onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                  placeholder="请输入姓名"
                />
              </div>
              <div className="space-y-2">
                <Label>岗位 *</Label>
                <Input
                  value={formData.position}
                  onChange={e => setFormData(f => ({ ...f, position: e.target.value }))}
                  placeholder="如：保洁员、保安"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>部门 *</Label>
                <Select
                  value={formData.department}
                  onValueChange={v => setFormData(f => ({ ...f, department: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="请选择部门" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map(d => (
                      <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>联系电话</Label>
                <Input
                  value={formData.phone}
                  onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))}
                  placeholder="请输入电话"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>负责区域</Label>
              <Input
                value={formData.area}
                onChange={e => setFormData(f => ({ ...f, area: e.target.value }))}
                placeholder="如：教学楼A栋、操场"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreateDialog(false); setShowEditDialog(false); setCurrentStaff(null); resetForm();
            }}>取消</Button>
            <Button onClick={showEditDialog ? handleUpdate : handleCreate}>
              {showEditDialog ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 照片上传弹窗 */}
      <Dialog open={showPhotoDialog} onOpenChange={v => {
        if (!v) { setShowPhotoDialog(false); setCurrentStaff(null); setPhotoPreview(''); }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>门禁人脸照片</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              为 <span className="font-medium text-foreground">{currentStaff?.name}</span> 上传门禁人脸照片。
              照片上传后将自动生成人脸向量用于门禁验证。
            </p>

            {/* 照片预览 */}
            <div className="flex justify-center">
              <div className="relative h-48 w-48 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden bg-muted/30">
                {photoPreview ? (
                  <img src={photoPreview} alt="预览" className="h-full w-full object-cover" />
                ) : (
                  <div className="text-center">
                    <Camera className="h-10 w-10 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">请选择照片</p>
                  </div>
                )}
              </div>
            </div>

            {/* 上传按钮 */}
            <div className="flex justify-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                选择照片
              </Button>
            </div>

            {currentStaff?.hasFaceVector && (
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700 dark:text-green-400">
                  该人员已录入人脸数据，上传新照片将覆盖原有数据
                </span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowPhotoDialog(false); setCurrentStaff(null); setPhotoPreview(''); }}>
              取消
            </Button>
            <Button onClick={handlePhotoUpload} disabled={!photoPreview || uploading}>
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> 上传中...
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4 mr-2" /> 确认上传
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认弹窗 */}
      <Dialog open={showDeleteDialog} onOpenChange={v => {
        if (!v) { setShowDeleteDialog(false); setCurrentStaff(null); }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <p className="py-4">
            确定要删除 <span className="font-medium">{currentStaff?.name}</span> 吗？删除后该人员的门禁权限将一并移除。
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDeleteDialog(false); setCurrentStaff(null); }}>取消</Button>
            <Button variant="destructive" onClick={handleDelete}>确认删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
