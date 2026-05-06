'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  AlertTriangle, 
  Check, 
  Eye, 
  Clock,
  Shield,
  Filter,
  Search,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  User,
  X
} from 'lucide-react';
import { useWarnings } from '@/hooks/useMentalHealth';

type WarningWithStudent = {
  id: string;
  studentId: string;
  studentName?: string;
  className?: string;
  sessionId?: string;
  warningType: string;
  severity: string;
  title: string;
  description?: string;
  keywords?: string[];
  isRead: boolean;
  readBy?: string;
  readAt?: string;
  isHandled: boolean;
  handledBy?: string;
  handledAt?: string;
  handleNote?: string;
  createdAt: string;
};

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
};

const severityConfig: Record<string, { 
  label: string; 
  bgColor: string;
  textColor: string;
  borderColor: string;
  iconBg: string;
}> = {
  red: { 
    label: '红色预警', 
    bgColor: 'bg-destructive/5',
    textColor: 'text-destructive',
    borderColor: 'border-destructive/20',
    iconBg: 'bg-destructive/10'
  },
  yellow: { 
    label: '黄色预警', 
    bgColor: 'bg-amber-500/5',
    textColor: 'text-amber-600',
    borderColor: 'border-amber-500/20',
    iconBg: 'bg-amber-500/10'
  },
};

const warningTypeLabels: Record<string, string> = {
  red_line: '红线触发',
  sensitive: '敏感内容',
  trend: '趋势异常',
};

export default function WarningsPage() {
  const { warnings, loading, fetchWarnings, markAsRead, handleWarning } = useWarnings();
  const [filter, setFilter] = useState<'all' | 'red' | 'yellow'>('all');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'handled' | 'all'>('pending');
  const [handleNote, setHandleNote] = useState<Record<string, string>>({});
  const [searchKeyword, setSearchKeyword] = useState('');
  const [detailSession, setDetailSession] = useState<{ sessionId: string; studentName: string } | null>(null);
  const [detailMessages, setDetailMessages] = useState<ChatMessage[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    const params: Record<string, string | boolean> = {};
    if (statusFilter === 'pending') params.isHandled = false;
    else if (statusFilter === 'handled') params.isHandled = true;
    if (filter !== 'all') params.severity = filter;
    fetchWarnings(params);
  }, [filter, statusFilter, fetchWarnings]);

  const viewSessionDetail = useCallback(async (sessionId: string, studentName: string) => {
    setDetailSession({ sessionId, studentName });
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/mental-health/sessions?sessionId=${sessionId}`);
      const data = await res.json();
      if (data.data?.messages) {
        setDetailMessages(data.data.messages.map((m: Record<string, unknown>) => ({
          id: m.id as string,
          role: m.role as 'user' | 'assistant' | 'system',
          content: m.content as string,
          createdAt: m.createdAt as string,
        })));
      }
    } catch (err) {
      console.error('load session detail error:', err);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const typedWarnings = warnings as WarningWithStudent[];

  const filteredWarnings = typedWarnings.filter(w => 
    !searchKeyword || 
    w.title.includes(searchKeyword) || 
    w.description?.includes(searchKeyword) ||
    w.studentName?.includes(searchKeyword) ||
    w.className?.includes(searchKeyword) ||
    w.keywords?.some(kw => kw.includes(searchKeyword))
  );

  const stats = {
    total: warnings.length,
    red: warnings.filter(w => w.severity === 'red').length,
    yellow: warnings.filter(w => w.severity === 'yellow').length,
    unread: warnings.filter(w => !w.isRead).length,
    handled: warnings.filter(w => w.isHandled).length,
  };

  return (
    <div className="min-h-screen">
      {/* Hero 区域 */}
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-50/50 via-background to-rose-50/30 dark:from-amber-950/20 dark:via-background dark:to-rose-950/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-amber-500/5 via-transparent to-transparent" />
        <div className="relative px-6 py-8 sm:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-amber-500/10">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">预警管理</h1>
            </div>
            <p className="text-muted-foreground">及时发现，用心关怀，守护每一位学生的心理健康</p>
          </div>
        </div>
      </div>

      <div className="px-6 sm:px-8 py-6 max-w-7xl mx-auto space-y-6">
        {/* 统计卡片 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm bg-gradient-to-br from-card to-muted/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">待处理</p>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-500/10">
                  <Clock className="h-5 w-5 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-card to-destructive/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">红色预警</p>
                  <p className="text-2xl font-bold text-destructive">{stats.red}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-destructive/10">
                  <Shield className="h-5 w-5 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-card to-amber-500/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">黄色预警</p>
                  <p className="text-2xl font-bold text-amber-600">{stats.yellow}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-500/10">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-card to-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">未读消息</p>
                  <p className="text-2xl font-bold text-primary">{stats.unread}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-primary/10">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 工具栏 */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索预警..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            {(['pending', 'handled', 'all'] as const).map((s) => (
              <Button
                key={s}
                variant={statusFilter === s ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(s)}
                className={statusFilter === s ? 'bg-gradient-to-r from-amber-500 to-amber-600 border-0' : ''}
              >
                {s === 'pending' ? '待处理' : s === 'handled' ? '已处理' : '全部'}
              </Button>
            ))}
            <div className="w-px h-5 bg-border mx-1" />
            {(['all', 'red', 'yellow'] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? '全部等级' : severityConfig[f].label}
              </Button>
            ))}
          </div>
        </div>

        {/* 预警列表 */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-amber-500 border-t-transparent" />
            <p className="text-muted-foreground">加载中...</p>
          </div>
        ) : filteredWarnings.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-16 flex flex-col items-center space-y-4">
              <div className="p-4 rounded-full bg-primary/10">
                <CheckCircle2 className="h-10 w-10 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-medium text-foreground">暂无{statusFilter === 'handled' ? '已处理' : filter !== 'all' ? severityConfig[filter].label : ''}预警</p>
                <p className="text-sm text-muted-foreground mt-1">{statusFilter === 'handled' ? '暂无已处理的预警记录' : '学生心理状态良好'}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredWarnings.map((w, index) => {
              const config = severityConfig[w.severity] || severityConfig.yellow;
              return (
                <Card 
                  key={w.id} 
                  className={`border-0 shadow-sm overflow-hidden transition-all hover:shadow-md ${config.bgColor}`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className={`h-1 ${w.severity === 'red' ? 'bg-gradient-to-r from-destructive via-destructive/80 to-destructive' : 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500'}`} />
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0 space-y-3">
                        {/* 头部 */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge 
                            variant="outline" 
                            className={`${config.bgColor} ${config.textColor} border-current`}
                          >
                            {config.label}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {warningTypeLabels[w.warningType] ?? w.warningType}
                          </Badge>
                          {!w.isRead && (
                            <Badge variant="outline" className="text-xs animate-pulse border-primary/30 text-primary">
                              未读
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground ml-auto">
                            {new Date(w.createdAt).toLocaleString('zh-CN')}
                          </span>
                        </div>

                        {/* 标题 + 学生信息 */}
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-foreground text-lg">{w.title}</h3>
                          {(w.studentName || w.className) && (
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <User className="h-3.5 w-3.5" />
                              <span>{w.className ? `${w.className} ` : ''}{w.studentName || '未知学生'}</span>
                            </div>
                          )}
                        </div>

                        {/* 描述 */}
                        {w.description && (
                          <p className="text-sm text-muted-foreground leading-relaxed">{w.description}</p>
                        )}

                        {/* 关键词 */}
                        {w.keywords && w.keywords.length > 0 && (
                          <div className="flex gap-1.5 flex-wrap">
                            {w.keywords.map((kw, i) => (
                              <Badge key={i} variant="outline" className="text-xs bg-background/50">
                                {kw}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* 操作区 */}
                        <div className="flex items-center gap-3 pt-2 border-t border-border/50">
                          {w.sessionId && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => viewSessionDetail(w.sessionId!, w.studentName || '未知学生')}
                              className="text-primary hover:text-primary/80"
                            >
                              <MessageSquare className="h-4 w-4 mr-1.5" /> 查看对话
                            </Button>
                          )}
                          {!w.isRead && !w.isHandled && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => markAsRead(w.id)}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <Eye className="h-4 w-4 mr-1.5" /> 标记已读
                            </Button>
                          )}
                          {!w.isHandled && (
                            <div className="flex items-center gap-2 flex-1">
                              <Input
                                placeholder="添加处理备注..."
                                value={handleNote[w.id] ?? ''}
                                onChange={(e) => setHandleNote(prev => ({ ...prev, [w.id]: e.target.value }))}
                                className="max-w-xs bg-background/50"
                              />
                              <Button
                                size="sm"
                                onClick={async () => { await handleWarning(w.id, handleNote[w.id] ?? '已处理'); /* 刷新当前筛选 */ const params: Record<string, string | boolean> = {}; if (statusFilter === 'pending') params.isHandled = false; else if (statusFilter === 'handled') params.isHandled = true; if (filter !== 'all') params.severity = filter; fetchWarnings(params); }}
                                className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700"
                              >
                                <Check className="h-4 w-4 mr-1.5" /> 处理完成
                              </Button>
                            </div>
                          )}
                          {w.isHandled && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <CheckCircle2 className="h-4 w-4 text-teal-500" />
                              <span>已处理</span>
                              {w.handledBy && <span>by {w.handledBy}</span>}
                              {w.handledAt && <span>· {new Date(w.handledAt).toLocaleString('zh-CN')}</span>}
                              {w.handleNote && <span>· {w.handleNote}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* 对话详情弹窗 */}
      {detailSession && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setDetailSession(null)}>
          <div className="bg-card rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">对话详情 - {detailSession.studentName}</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setDetailSession(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {detailLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
                </div>
              ) : detailMessages.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">暂无对话记录</p>
              ) : (
                detailMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-lg px-3 py-2 ${
                      msg.role === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : msg.role === 'system'
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-muted text-foreground'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                        {new Date(msg.createdAt).toLocaleString('zh-CN')}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
