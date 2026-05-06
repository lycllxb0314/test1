'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  School, Trees, Plus, CheckCircle, AlertTriangle, Edit2, Trash2,
  Thermometer, Droplets, Wind, Leaf, Search,
} from 'lucide-react';
import { toast } from 'sonner';

type EnvironmentArea = {
  id: string;
  name: string;
  areaType: string;
  status: string;
  cleanerName: string | null;
  lastCleanTime: string | null;
  description: string | null;
};

type GreenArea = {
  id: string;
  name: string;
  areaSize: string | null;
  plants: string | null;
  status: string;
  lastMaintainDate: string | null;
  nextMaintainDate: string | null;
  maintainerName: string | null;
  notes: string | null;
};

const AREA_TYPE_MAP: Record<string, string> = {
  teaching: '教学区', living: '生活区', sports: '运动区',
  public: '公共区', office: '办公区',
};

const STATUS_MAP: Record<string, { label: string; variant: string }> = {
  good: { label: '良好', variant: 'bg-green-100 text-green-700' },
  attention: { label: '需关注', variant: 'bg-yellow-100 text-yellow-700' },
  warning: { label: '需整改', variant: 'bg-red-100 text-red-700' },
};

type StaffMember = {
  id: string;
  name: string;
  position: string | null;
  area: string | null;
};

export default function EnvironmentPage() {
  const [envAreas, setEnvAreas] = useState<EnvironmentArea[]>([]);
  const [greenAreas, setGreenAreas] = useState<GreenArea[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'env' | 'green'>('env');

  // 弹窗
  const [showEnvDialog, setShowEnvDialog] = useState(false);
  const [showGreenDialog, setShowGreenDialog] = useState(false);
  const [editingEnv, setEditingEnv] = useState<EnvironmentArea | null>(null);
  const [editingGreen, setEditingGreen] = useState<GreenArea | null>(null);

  // 表单
  const [envForm, setEnvForm] = useState({ name: '', areaType: 'teaching', status: 'good', cleanerName: '', description: '' });
  const [greenForm, setGreenForm] = useState({ name: '', areaSize: '', plants: '', status: 'good', lastMaintainDate: '', nextMaintainDate: '', maintainerName: '', notes: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [envRes, greenRes, staffRes] = await Promise.all([
        fetch('/api/general/environment', { credentials: 'include' }),
        fetch('/api/general/green-areas', { credentials: 'include' }),
        fetch('/api/general/staff', { credentials: 'include' }),
      ]);
      const envData = await envRes.json();
      const greenData = await greenRes.json();
      const staffData = await staffRes.json();
      if (envData.success) setEnvAreas(envData.data);
      if (greenData.success) setGreenAreas(greenData.data);
      if (staffData.success) setStaffList(staffData.data);
    } catch {
      toast.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // 环境区域 CRUD
  const handleSaveEnv = async () => {
    try {
      const url = editingEnv ? `/api/general/environment/${editingEnv.id}` : '/api/general/environment';
      const method = editingEnv ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(envForm),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(editingEnv ? '更新成功' : '创建成功');
        setShowEnvDialog(false);
        setEditingEnv(null);
        fetchData();
      } else {
        toast.error(data.error || '操作失败');
      }
    } catch {
      toast.error('网络错误');
    }
  };

  const handleDeleteEnv = async (id: string) => {
    if (!confirm('确定删除该区域？')) return;
    try {
      const res = await fetch(`/api/general/environment/${id}`, { method: 'DELETE', credentials: 'include' });
      const data = await res.json();
      if (data.success) { toast.success('删除成功'); fetchData(); }
      else toast.error(data.error || '删除失败');
    } catch { toast.error('网络错误'); }
  };

  // 绿化区域 CRUD
  const handleSaveGreen = async () => {
    try {
      const url = editingGreen ? `/api/general/green-areas/${editingGreen.id}` : '/api/general/green-areas';
      const method = editingGreen ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(greenForm),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(editingGreen ? '更新成功' : '创建成功');
        setShowGreenDialog(false);
        setEditingGreen(null);
        fetchData();
      } else {
        toast.error(data.error || '操作失败');
      }
    } catch {
      toast.error('网络错误');
    }
  };

  const handleDeleteGreen = async (id: string) => {
    if (!confirm('确定删除该绿化区域？')) return;
    try {
      const res = await fetch(`/api/general/green-areas/${id}`, { method: 'DELETE', credentials: 'include' });
      const data = await res.json();
      if (data.success) { toast.success('删除成功'); fetchData(); }
      else toast.error(data.error || '删除失败');
    } catch { toast.error('网络错误'); }
  };

  const openEditEnv = (area: EnvironmentArea) => {
    setEditingEnv(area);
    setEnvForm({
      name: area.name, areaType: area.areaType, status: area.status,
      cleanerName: area.cleanerName || '', description: area.description || '',
    });
    setShowEnvDialog(true);
  };

  const openEditGreen = (area: GreenArea) => {
    setEditingGreen(area);
    setGreenForm({
      name: area.name, areaSize: area.areaSize || '', plants: area.plants || '',
      status: area.status, lastMaintainDate: area.lastMaintainDate || '',
      nextMaintainDate: area.nextMaintainDate || '', maintainerName: area.maintainerName || '',
      notes: area.notes || '',
    });
    setShowGreenDialog(true);
  };

  const filteredEnv = envAreas.filter(a => !search || a.name.includes(search) || (a.cleanerName || '').includes(search));
  const filteredGreen = greenAreas.filter(a => !search || a.name.includes(search) || (a.plants || '').includes(search));

  const goodCount = envAreas.filter(a => a.status === 'good').length;
  const totalCount = envAreas.length;
  const goodRate = totalCount > 0 ? Math.round((goodCount / totalCount) * 100) : 0;
  const attentionCount = envAreas.filter(a => a.status !== 'good').length;

  return (
    <div className="p-6 lg:p-8 space-y-6 min-h-screen">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">环境管理</h1>
          <p className="text-muted-foreground mt-1">校园环境卫生与绿化维护</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="搜索区域..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-56" />
          </div>
          <Button onClick={() => { setEditingEnv(null); setEnvForm({ name: '', areaType: 'teaching', status: 'good', cleanerName: '', description: '' }); setShowEnvDialog(true); }} className="gap-2">
            <Plus className="h-4 w-4" /> 新建区域
          </Button>
          <Button variant="outline" onClick={() => { setEditingGreen(null); setGreenForm({ name: '', areaSize: '', plants: '', status: 'good', lastMaintainDate: '', nextMaintainDate: '', maintainerName: '', notes: '' }); setShowGreenDialog(true); }} className="gap-2">
            <Leaf className="h-4 w-4" /> 新建绿化
          </Button>
        </div>
      </div>

      {/* 统计 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">环境优良率</p>
                <p className="text-2xl font-bold text-green-600">{goodRate}%</p>
              </div>
              <div className="p-2 rounded-lg bg-green-100"><CheckCircle className="h-5 w-5 text-green-600" /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">绿化面积</p>
                <p className="text-2xl font-bold text-green-600">
                  {greenAreas.reduce((sum, a) => sum + parseInt(a.areaSize || '0'), 0)}㎡
                </p>
              </div>
              <div className="p-2 rounded-lg bg-green-100"><Trees className="h-5 w-5 text-green-600" /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">保洁人员</p>
                <p className="text-2xl font-bold">{new Set(envAreas.map(a => a.cleanerName).filter(Boolean)).size}人</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100"><School className="h-5 w-5 text-blue-600" /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">待处理</p>
                <p className="text-2xl font-bold text-orange-600">{attentionCount}项</p>
              </div>
              <div className="p-2 rounded-lg bg-orange-100"><AlertTriangle className="h-5 w-5 text-orange-600" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-2 border-b pb-2">
        <Button variant={tab === 'env' ? 'default' : 'ghost'} size="sm" onClick={() => setTab('env')}>
          区域清洁状态
        </Button>
        <Button variant={tab === 'green' ? 'default' : 'ghost'} size="sm" onClick={() => setTab('green')} className="gap-1">
          <Leaf className="h-3.5 w-3.5" /> 绿化养护
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">加载中...</div>
      ) : tab === 'env' ? (
        /* 区域清洁 */
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>区域名称</TableHead>
                  <TableHead>区域类型</TableHead>
                  <TableHead>保洁人员</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>最后清洁时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEnv.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">暂无数据</TableCell></TableRow>
                ) : filteredEnv.map(area => (
                  <TableRow key={area.id}>
                    <TableCell className="font-medium">{area.name}</TableCell>
                    <TableCell>{AREA_TYPE_MAP[area.areaType] || area.areaType}</TableCell>
                    <TableCell>{area.cleanerName || '-'}</TableCell>
                    <TableCell>
                      <Badge className={STATUS_MAP[area.status]?.variant || ''}>{STATUS_MAP[area.status]?.label || area.status}</Badge>
                    </TableCell>
                    <TableCell>{area.lastCleanTime ? new Date(area.lastCleanTime).toLocaleString('zh-CN') : '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEditEnv(area)}><Edit2 className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteEnv(area.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        /* 绿化养护 */
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>绿化区域</TableHead>
                  <TableHead>面积</TableHead>
                  <TableHead>主要植物</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>养护人</TableHead>
                  <TableHead>上次养护</TableHead>
                  <TableHead>下次养护</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGreen.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">暂无数据</TableCell></TableRow>
                ) : filteredGreen.map(area => (
                  <TableRow key={area.id}>
                    <TableCell className="font-medium">{area.name}</TableCell>
                    <TableCell>{area.areaSize || '-'}</TableCell>
                    <TableCell>{area.plants || '-'}</TableCell>
                    <TableCell>
                      <Badge className={STATUS_MAP[area.status]?.variant || ''}>{STATUS_MAP[area.status]?.label || area.status}</Badge>
                    </TableCell>
                    <TableCell>{area.maintainerName || '-'}</TableCell>
                    <TableCell>{area.lastMaintainDate || '-'}</TableCell>
                    <TableCell>{area.nextMaintainDate || '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openEditGreen(area)}><Edit2 className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteGreen(area.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* 环境监测卡片 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Thermometer className="h-5 w-5 text-red-500" /> 空气质量
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-2">优</div>
            <p className="text-sm text-muted-foreground">AQI: 35 · PM2.5: 18μg/m³</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Droplets className="h-5 w-5 text-blue-500" /> 水质监测
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-2">达标</div>
            <p className="text-sm text-muted-foreground">饮用水pH: 7.2 · 余氯: 0.3mg/L</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Wind className="h-5 w-5 text-cyan-500" /> 噪音监测
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-2">正常</div>
            <p className="text-sm text-muted-foreground">教学区: 45dB · 操场: 55dB</p>
          </CardContent>
        </Card>
      </div>

      {/* 环境区域编辑弹窗 */}
      <Dialog open={showEnvDialog} onOpenChange={setShowEnvDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingEnv ? '编辑区域' : '新建区域'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium">区域名称</label>
              <Input value={envForm.name} onChange={e => setEnvForm(f => ({ ...f, name: e.target.value }))} placeholder="如：教学楼A区" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">区域类型</label>
                <Select value={envForm.areaType} onValueChange={v => setEnvForm(f => ({ ...f, areaType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="teaching">教学区</SelectItem>
                    <SelectItem value="living">生活区</SelectItem>
                    <SelectItem value="sports">运动区</SelectItem>
                    <SelectItem value="public">公共区</SelectItem>
                    <SelectItem value="office">办公区</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">状态</label>
                <Select value={envForm.status} onValueChange={v => setEnvForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="good">良好</SelectItem>
                    <SelectItem value="attention">需关注</SelectItem>
                    <SelectItem value="warning">需整改</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">保洁人员</label>
              <Select value={envForm.cleanerName || '_none'} onValueChange={v => setEnvForm(f => ({ ...f, cleanerName: v === '_none' ? '' : v }))}>
                <SelectTrigger><SelectValue placeholder="选择保洁人员" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">不指定</SelectItem>
                  {staffList.map(s => (
                    <SelectItem key={s.id} value={s.name}>{s.name}{s.position ? ` (${s.position})` : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {staffList.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">暂无后勤人员，请先在人员管理中添加</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">备注</label>
              <Textarea value={envForm.description} onChange={e => setEnvForm(f => ({ ...f, description: e.target.value }))} placeholder="区域描述..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEnvDialog(false)}>取消</Button>
            <Button onClick={handleSaveEnv}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 绿化区域编辑弹窗 */}
      <Dialog open={showGreenDialog} onOpenChange={setShowGreenDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingGreen ? '编辑绿化区域' : '新建绿化区域'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium">区域名称</label>
              <Input value={greenForm.name} onChange={e => setGreenForm(f => ({ ...f, name: e.target.value }))} placeholder="如：前广场花坛" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">面积</label>
                <Input value={greenForm.areaSize} onChange={e => setGreenForm(f => ({ ...f, areaSize: e.target.value }))} placeholder="如：200㎡" />
              </div>
              <div>
                <label className="text-sm font-medium">状态</label>
                <Select value={greenForm.status} onValueChange={v => setGreenForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="good">良好</SelectItem>
                    <SelectItem value="attention">需修剪</SelectItem>
                    <SelectItem value="warning">需整改</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">主要植物</label>
              <Input value={greenForm.plants} onChange={e => setGreenForm(f => ({ ...f, plants: e.target.value }))} placeholder="如：月季、杜鹃" />
            </div>
            <div>
              <label className="text-sm font-medium">养护人</label>
              <Select value={greenForm.maintainerName || '_none'} onValueChange={v => setGreenForm(f => ({ ...f, maintainerName: v === '_none' ? '' : v }))}>
                <SelectTrigger><SelectValue placeholder="选择养护人" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">不指定</SelectItem>
                  {staffList.map(s => (
                    <SelectItem key={s.id} value={s.name}>{s.name}{s.position ? ` (${s.position})` : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {staffList.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">暂无后勤人员，请先在人员管理中添加</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">上次养护日期</label>
                <Input type="date" value={greenForm.lastMaintainDate} onChange={e => setGreenForm(f => ({ ...f, lastMaintainDate: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium">下次养护日期</label>
                <Input type="date" value={greenForm.nextMaintainDate} onChange={e => setGreenForm(f => ({ ...f, nextMaintainDate: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">备注</label>
              <Textarea value={greenForm.notes} onChange={e => setGreenForm(f => ({ ...f, notes: e.target.value }))} placeholder="养护备注..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGreenDialog(false)}>取消</Button>
            <Button onClick={handleSaveGreen}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
