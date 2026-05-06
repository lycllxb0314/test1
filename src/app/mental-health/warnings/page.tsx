'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Check, Eye } from 'lucide-react';
import { useWarnings } from '@/hooks/useMentalHealth';

const severityConfig: Record<string, { label: string; variant: 'destructive' | 'outline' | 'secondary' }> = {
  red: { label: '红色预警', variant: 'destructive' },
  yellow: { label: '黄色预警', variant: 'outline' },
};

const warningTypeLabels: Record<string, string> = {
  red_line: '红线触发',
  sensitive: '敏感内容',
  trend: '趋势异常',
};

export default function WarningsPage() {
  const { warnings, loading, fetchWarnings, markAsRead, handleWarning } = useWarnings();
  const [filter, setFilter] = useState<'all' | 'red' | 'yellow'>('all');
  const [handleNote, setHandleNote] = useState<Record<string, string>>({});

  useEffect(() => {
    const params: Record<string, string | boolean> = { isHandled: false };
    if (filter !== 'all') params.severity = filter;
    fetchWarnings(params);
  }, [filter, fetchWarnings]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">预警管理</h1>
          <p className="text-muted-foreground mt-1">查看和处理学生心理健康预警</p>
        </div>
        <div className="flex gap-2">
          {(['all', 'red', 'yellow'] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? '全部' : severityConfig[f].label}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">加载中...</div>
      ) : warnings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            暂无{filter !== 'all' ? severityConfig[filter].label : ''}预警
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {warnings.map((w) => (
            <Card key={w.id} className={!w.isRead ? 'border-primary/30' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={severityConfig[w.severity]?.variant ?? 'outline'}>
                      {severityConfig[w.severity]?.label ?? w.severity}
                    </Badge>
                    <Badge variant="secondary">{warningTypeLabels[w.warningType] ?? w.warningType}</Badge>
                    {!w.isRead && <Badge variant="outline">未读</Badge>}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(w.createdAt).toLocaleString('zh-CN')}
                  </span>
                </div>
                <CardTitle className="text-base mt-2">{w.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {w.description && (
                  <p className="text-sm text-muted-foreground">{w.description}</p>
                )}
                {w.keywords && w.keywords.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {w.keywords.map((kw, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{kw}</Badge>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-3 pt-2">
                  {!w.isRead && (
                    <Button variant="outline" size="sm" onClick={() => markAsRead(w.id)}>
                      <Eye className="h-3 w-3 mr-1" /> 标记已读
                    </Button>
                  )}
                  {!w.isHandled && (
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="处理备注"
                        value={handleNote[w.id] ?? ''}
                        onChange={(e) => setHandleNote(prev => ({ ...prev, [w.id]: e.target.value }))}
                        className="h-8 w-48"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleWarning(w.id, handleNote[w.id] ?? '已处理')}
                      >
                        <Check className="h-3 w-3 mr-1" /> 处理完成
                      </Button>
                    </div>
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
