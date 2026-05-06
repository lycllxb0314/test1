'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Key, 
  Plus, 
  Copy, 
  Ban, 
  Sparkles,
  Clock,
  Users,
  Shield,
  CheckCircle2,
  XCircle,
  QrCode
} from 'lucide-react';
import { useAuthKeys } from '@/hooks/useMentalHealth';
import { toast } from 'sonner';

const scopeConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  class: { label: '指定班级', color: 'text-teal-600', bgColor: 'bg-teal-500/10' },
  student: { label: '指定学生', color: 'text-amber-600', bgColor: 'bg-amber-500/10' },
  all: { label: '全校', color: 'text-rose-600', bgColor: 'bg-rose-500/10' },
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

  const activeKeys = authKeys.filter(k => k.isActive);
  const expiredKeys = authKeys.filter(k => !k.isActive);

  return (
    <div className="min-h-screen">
      {/* Hero 区域 */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-teal-50/50 dark:from-primary/10 dark:via-background dark:to-teal-950/20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
        <div className="relative px-6 py-8 sm:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10">
                  <Key className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">授权密钥管理</h1>
                  <p className="text-muted-foreground text-sm">生成临时密钥，授权班主任查看学生心理健康数据</p>
                </div>
              </div>
              <Button 
                onClick={() => setShowCreate(!showCreate)}
                className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 shadow-md shadow-teal-500/20"
              >
                <Plus className="h-4 w-4 mr-1.5" /> 生成密钥
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 sm:px-8 py-6 max-w-7xl mx-auto space-y-6">
        {/* 统计卡片 */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-0 shadow-sm bg-gradient-to-br from-card to-teal-50/30 dark:to-teal-950/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">有效密钥</p>
                  <p className="text-2xl font-bold text-teal-600">{activeKeys.length}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-teal-500/10">
                  <CheckCircle2 className="h-5 w-5 text-teal-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-card to-muted/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">已失效</p>
                  <p className="text-2xl font-bold text-muted-foreground">{expiredKeys.length}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-muted">
                  <XCircle className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-card to-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">总使用次数</p>
                  <p className="text-2xl font-bold text-primary">
                    {authKeys.reduce((sum, k) => sum + k.usedCount, 0)}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 创建表单 */}
        {showCreate && (
          <Card className="border-0 shadow-md overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-teal-500 via-primary to-teal-500" />
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">生成新密钥</h2>
                  <p className="text-sm text-muted-foreground">创建临时授权密钥供班主任使用</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <div className="space-y-2">
                  <Label className="text-foreground font-medium">描述说明</Label>
                  <Input
                    placeholder="如：三年级2班心理数据查看"
                    value={form.description}
                    onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                    className="bg-muted/30"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground font-medium">授权范围</Label>
                  <select
                    className="w-full h-10 rounded-lg border border-input bg-muted/30 px-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
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
                    <Label className="text-foreground font-medium">班级ID</Label>
                    <Input
                      placeholder="输入班级ID"
                      value={form.targetClassId}
                      onChange={(e) => setForm(prev => ({ ...prev, targetClassId: e.target.value }))}
                      className="bg-muted/30"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-foreground font-medium">最大使用次数</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.maxUses}
                    onChange={(e) => setForm(prev => ({ ...prev, maxUses: parseInt(e.target.value) || 1 }))}
                    className="bg-muted/30"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-foreground font-medium">有效时长（小时）</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.expiresInHours}
                    onChange={(e) => setForm(prev => ({ ...prev, expiresInHours: parseInt(e.target.value) || 24 }))}
                    className="bg-muted/30"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-border/50">
                <Button 
                  onClick={handleCreate}
                  className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700"
                >
                  <Sparkles className="h-4 w-4 mr-1.5" /> 确认生成
                </Button>
                <Button variant="outline" onClick={() => setShowCreate(false)}>
                  取消
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 密钥列表 */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
            <p className="text-muted-foreground">加载中...</p>
          </div>
        ) : authKeys.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-16 flex flex-col items-center space-y-4">
              <div className="p-4 rounded-full bg-primary/10">
                <QrCode className="h-10 w-10 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-medium text-foreground">暂无授权密钥</p>
                <p className="text-sm text-muted-foreground mt-1">点击上方按钮生成新密钥</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* 有效密钥 */}
            {activeKeys.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-500" />
                  有效密钥 ({activeKeys.length})
                </h3>
                <div className="space-y-3">
                  {activeKeys.map((k) => {
                    const config = scopeConfig[k.scope] || scopeConfig.class;
                    return (
                      <Card key={k.id} className="border-0 shadow-sm overflow-hidden bg-gradient-to-r from-card to-teal-50/30 dark:to-teal-950/10 hover:shadow-md transition-all">
                        <div className="h-1 bg-gradient-to-r from-teal-500 via-teal-400 to-teal-500" />
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0 space-y-3">
                              {/* 密钥码 */}
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-teal-500/10">
                                  <Key className="h-4 w-4 text-teal-600" />
                                </div>
                                <code className="text-sm font-mono bg-teal-500/10 text-teal-700 dark:text-teal-300 px-3 py-1.5 rounded-lg">
                                  {k.keyCode}
                                </code>
                                <Badge className="bg-teal-500/10 text-teal-600 border-0">有效</Badge>
                                <Badge variant="outline" className={`${config.bgColor} ${config.color} border-0`}>
                                  {config.label}
                                </Badge>
                              </div>

                              {/* 描述 */}
                              {k.description && (
                                <p className="text-sm text-muted-foreground pl-11">{k.description}</p>
                              )}

                              {/* 详细信息 */}
                              <div className="flex items-center gap-6 text-xs text-muted-foreground pl-11">
                                <span className="flex items-center gap-1.5">
                                  <Users className="h-3.5 w-3.5" />
                                  已用 <span className="font-medium text-foreground">{k.usedCount}</span>/{k.maxUses} 次
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <Clock className="h-3.5 w-3.5" />
                                  过期：{new Date(k.expiresAt).toLocaleString('zh-CN')}
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <Shield className="h-3.5 w-3.5" />
                                  创建人：{k.createdByName}
                                </span>
                              </div>
                            </div>

                            {/* 操作按钮 */}
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => copyKey(k.keyCode)}
                                className="hover:bg-teal-50 dark:hover:bg-teal-950/30"
                              >
                                <Copy className="h-3.5 w-3.5 mr-1.5" /> 复制
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => deactivateAuthKey(k.id)}
                                className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                              >
                                <Ban className="h-3.5 w-3.5 mr-1.5" /> 停用
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 已失效密钥 */}
            {expiredKeys.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  已失效密钥 ({expiredKeys.length})
                </h3>
                <div className="space-y-3 opacity-60">
                  {expiredKeys.slice(0, 5).map((k) => {
                    const config = scopeConfig[k.scope] || scopeConfig.class;
                    return (
                      <Card key={k.id} className="border-0 shadow-sm bg-muted/30">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Key className="h-4 w-4 text-muted-foreground" />
                              <code className="text-sm font-mono bg-muted px-2 py-0.5 rounded text-muted-foreground">
                                {k.keyCode}
                              </code>
                              <Badge variant="secondary" className="text-xs">已失效</Badge>
                              <Badge variant="outline" className="text-xs">{config.label}</Badge>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {k.description || '无描述'}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
