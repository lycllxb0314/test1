'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Key, Plus, Copy, Ban } from 'lucide-react';
import { useAuthKeys } from '@/hooks/useMentalHealth';
import { toast } from 'sonner';

const scopeLabels: Record<string, string> = {
  class: '指定班级',
  student: '指定学生',
  all: '全校',
};

export default function AuthKeysPage() {
  const { authKeys, loading, fetchAuthKeys, createAuthKey, deactivateAuthKey } = useAuthKeys();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    description: '',
    scope: 'class' as string,
    targetClassId: '',
    maxUses: 1,
    expiresInHours: 24,
  });

  useEffect(() => {
    fetchAuthKeys();
  }, [fetchAuthKeys]);

  const handleCreate = async () => {
    const result = await createAuthKey({
      description: form.description,
      scope: form.scope,
      targetClassId: form.scope === 'class' ? form.targetClassId : undefined,
      maxUses: form.maxUses,
      validHours: form.expiresInHours,
    });
    if (result) {
      toast.success(`密钥创建成功：${result.keyCode ?? '请查看列表'}`);
      setShowCreate(false);
      setForm({ description: '', scope: 'class', targetClassId: '', maxUses: 1, expiresInHours: 24 });
    } else {
      toast.error('密钥创建失败');
    }
  };

  const copyKey = (keyCode: string) => {
    navigator.clipboard.writeText(keyCode);
    toast.success('密钥已复制到剪贴板');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">授权密钥管理</h1>
          <p className="text-muted-foreground mt-1">生成临时密钥，授权班主任查看学生心理健康数据</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          <Plus className="h-4 w-4 mr-1" /> 生成密钥
        </Button>
      </div>

      {/* 创建表单 */}
      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">生成新密钥</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>描述</Label>
                <Input
                  placeholder="如：三年级2班心理数据查看"
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>授权范围</Label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={form.scope}
                  onChange={(e) => setForm(prev => ({ ...prev, scope: e.target.value }))}
                >
                  <option value="class">指定班级</option>
                  <option value="student">指定学生</option>
                  <option value="all">全校</option>
                </select>
              </div>
              {form.scope === 'class' && (
                <div className="space-y-2">
                  <Label>班级ID</Label>
                  <Input
                    placeholder="输入班级ID"
                    value={form.targetClassId}
                    onChange={(e) => setForm(prev => ({ ...prev, targetClassId: e.target.value }))}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>最大使用次数</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.maxUses}
                  onChange={(e) => setForm(prev => ({ ...prev, maxUses: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>有效时长（小时）</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.expiresInHours}
                  onChange={(e) => setForm(prev => ({ ...prev, expiresInHours: parseInt(e.target.value) || 24 }))}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate}>确认生成</Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>取消</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 密钥列表 */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">加载中...</div>
      ) : authKeys.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            暂无授权密钥，点击上方按钮生成
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {authKeys.map((k) => (
            <Card key={k.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Key className="h-4 w-4" />
                    <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded">{k.keyCode}</code>
                    <Badge variant={k.isActive ? 'default' : 'secondary'}>
                      {k.isActive ? '有效' : '已失效'}
                    </Badge>
                    <Badge variant="outline">{scopeLabels[k.scope] ?? k.scope}</Badge>
                  </div>
                  {k.description && (
                    <p className="text-sm text-muted-foreground">{k.description}</p>
                  )}
                  <div className="text-xs text-muted-foreground mt-1 space-x-4">
                    <span>已用 {k.usedCount}/{k.maxUses} 次</span>
                    <span>过期时间：{new Date(k.expiresAt).toLocaleString('zh-CN')}</span>
                    <span>创建人：{k.createdByName}</span>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  {k.isActive && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => copyKey(k.keyCode)}>
                        <Copy className="h-3 w-3 mr-1" /> 复制
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => deactivateAuthKey(k.id)}>
                        <Ban className="h-3 w-3 mr-1" /> 停用
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
