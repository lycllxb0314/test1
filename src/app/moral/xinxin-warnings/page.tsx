'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  ShieldAlert, ShieldCheck, AlertTriangle, Clock, User, School, MessageSquare, CheckCircle2,
} from 'lucide-react';

type RiskLevel = 'high' | 'medium';
type TriggerType = 'legal_safety' | 'psychological';

type HomeSchoolWarning = {
  id: string;
  conversationId: string;
  teacherId: string;
  teacherName: string | null;
  className: string | null;
  studentName: string | null;
  riskLevel: RiskLevel;
  triggerType: TriggerType;
  triggerSummary: string;
  recommendation: string | null;
  isHandled: boolean;
  handlerName: string | null;
  handleNote: string | null;
  handledAt: string | null;
  createdAt: string;
};

const riskConfig: Record<RiskLevel, { label: string; color: string; icon: typeof ShieldAlert }> = {
  high: { label: '高危', color: 'bg-red-500', icon: ShieldAlert },
  medium: { label: '中危', color: 'bg-amber-500', icon: AlertTriangle },
};

const triggerConfig: Record<TriggerType, { label: string; desc: string }> = {
  legal_safety: { label: '法律安全红线', desc: '家长暴力威胁/极端维权/学生自残倾向' },
  psychological: { label: '心理承载红线', desc: '教师极度崩溃/职业倦怠/无法承受' },
};

export default function XinxinWarningsPage() {
  const [warnings, setWarnings] = useState<HomeSchoolWarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'pending' | 'handled'>('pending');
  const [handleDialog, setHandleDialog] = useState<HomeSchoolWarning | null>(null);
  const [handleNote, setHandleNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [detailDialog, setDetailDialog] = useState<HomeSchoolWarning | null>(null);

  const fetchWarnings = useCallback(async () => {
    try {
      const isHandled = tab === 'handled';
      const res = await fetch(`/api/home-school/warnings?isHandled=${isHandled}`, { credentials: 'include' });
      const data = await res.json();
      setWarnings(data.data || []);
    } catch (err) {
      console.error('获取预警失败:', err);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { fetchWarnings(); }, [fetchWarnings]);

  const handleWarning = async () => {
    if (!handleDialog) return;
    setSubmitting(true);
    try {
      await fetch('/api/home-school/warnings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ warningId: handleDialog.id, handleNote }),
      });
      setHandleDialog(null);
      setHandleNote('');
      fetchWarnings();
    } catch (err) {
      console.error('处理预警失败:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const pendingCount = tab === 'pending' ? warnings.length : 0;

  return (
    <div className="px-6 py-4 space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold">家校沟通预警</h1>
        <p className="text-muted-foreground mt-1">
          心心智能体脱敏抽取的结构化预警，保护教师，赋能德育
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
              <ShieldAlert className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">高危预警</p>
              <p className="text-xl font-bold">{warnings.filter(w => w.riskLevel === 'high' && !w.isHandled).length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">中危预警</p>
              <p className="text-xl font-bold">{warnings.filter(w => w.riskLevel === 'medium' && !w.isHandled).length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">已处理</p>
              <p className="text-xl font-bold">{warnings.filter(w => w.isHandled).length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-2">
        <Button variant={tab === 'pending' ? 'default' : 'outline'} size="sm" onClick={() => { setTab('pending'); setLoading(true); }}>
          待处理 {pendingCount > 0 && <Badge variant="destructive" className="ml-2 text-xs">{pendingCount}</Badge>}
        </Button>
        <Button variant={tab === 'handled' ? 'default' : 'outline'} size="sm" onClick={() => { setTab('handled'); setLoading(true); }}>
          已处理
        </Button>
      </div>

      {/* 预警列表 */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">加载中...</div>
      ) : warnings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-400" />
            <p>{tab === 'pending' ? '暂无待处理预警' : '暂无已处理预警'}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {warnings.map(w => {
            const risk = riskConfig[w.riskLevel];
            const trigger = triggerConfig[w.triggerType];
            return (
              <Card key={w.id} className="overflow-hidden">
                <div className={`h-1 ${risk.color}`} />
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`${risk.color} text-white`}>{risk.label}</Badge>
                        <Badge variant="outline">{trigger.label}</Badge>
                        {w.isHandled && (
                          <Badge className="bg-green-100 text-green-700">
                            <CheckCircle2 className="h-3 w-3 mr-1" />已处理
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{w.teacherName || '未知教师'}</span>
                        {w.className && <span className="flex items-center gap-1"><School className="h-3.5 w-3.5" />{w.className}</span>}
                        {w.studentName && <span>家长: {w.studentName}家长</span>}
                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{new Date(w.createdAt).toLocaleString('zh-CN')}</span>
                      </div>

                      <div className="text-sm">
                        <span className="font-medium text-foreground">风险摘要：</span>
                        <span className="text-muted-foreground">{w.triggerSummary}</span>
                      </div>

                      {w.recommendation && (
                        <div className="text-sm">
                          <span className="font-medium text-foreground">处理建议：</span>
                          <span className="text-amber-700">{w.recommendation}</span>
                        </div>
                      )}

                      {w.isHandled && (
                        <div className="text-sm border-t pt-2 mt-2">
                          <div className="flex items-center gap-2 text-green-700">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="font-medium">处理人: {w.handlerName || '未知'}</span>
                            <span className="text-muted-foreground">{w.handledAt ? new Date(w.handledAt).toLocaleString('zh-CN') : ''}</span>
                          </div>
                          {w.handleNote && <p className="mt-1 text-muted-foreground">备注: {w.handleNote}</p>}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      {!w.isHandled && (
                        <Button size="sm" onClick={() => { setHandleDialog(w); setHandleNote(''); }}>
                          处理
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => setDetailDialog(w)}>
                        <MessageSquare className="h-3.5 w-3.5 mr-1" />详情
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* 处理弹窗 */}
      <Dialog open={!!handleDialog} onOpenChange={(v) => { if (!v) setHandleDialog(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>处理预警</DialogTitle>
          </DialogHeader>
          {handleDialog && (
            <div className="space-y-4">
              <div className="text-sm space-y-1">
                <p><span className="font-medium">教师：</span>{handleDialog.teacherName}</p>
                <p><span className="font-medium">班级：</span>{handleDialog.className || '-'}</p>
                <p><span className="font-medium">风险摘要：</span>{handleDialog.triggerSummary}</p>
                {handleDialog.recommendation && <p><span className="font-medium">建议：</span>{handleDialog.recommendation}</p>}
              </div>
              <Textarea
                placeholder="请填写处理备注..."
                value={handleNote}
                onChange={(e) => setHandleNote(e.target.value)}
                rows={3}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setHandleDialog(null)}>取消</Button>
            <Button onClick={handleWarning} disabled={submitting}>
              {submitting ? '提交中...' : '确认处理'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 详情弹窗 */}
      <Dialog open={!!detailDialog} onOpenChange={(v) => { if (!v) setDetailDialog(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>预警详情</DialogTitle>
          </DialogHeader>
          {detailDialog && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">风险等级</span><p className="font-medium">{riskConfig[detailDialog.riskLevel].label}</p></div>
                <div><span className="text-muted-foreground">触发类型</span><p className="font-medium">{triggerConfig[detailDialog.triggerType].label}</p></div>
                <div><span className="text-muted-foreground">教师</span><p className="font-medium">{detailDialog.teacherName}</p></div>
                <div><span className="text-muted-foreground">班级</span><p className="font-medium">{detailDialog.className || '-'}</p></div>
                <div><span className="text-muted-foreground">涉及家长</span><p className="font-medium">{detailDialog.studentName ? `${detailDialog.studentName}家长` : '-'}</p></div>
                <div><span className="text-muted-foreground">触发时间</span><p className="font-medium">{new Date(detailDialog.createdAt).toLocaleString('zh-CN')}</p></div>
              </div>
              <div>
                <span className="text-muted-foreground">风险摘要</span>
                <p className="font-medium mt-1 p-2 bg-muted rounded-md">{detailDialog.triggerSummary}</p>
              </div>
              {detailDialog.recommendation && (
                <div>
                  <span className="text-muted-foreground">处理建议</span>
                  <p className="font-medium mt-1 p-2 bg-amber-50 rounded-md text-amber-800">{detailDialog.recommendation}</p>
                </div>
              )}
              <div className="text-xs text-muted-foreground border-t pt-2">
                此预警由心心智能体通过「脱敏折叠」算法生成，不含原始聊天记录，仅保留结构化风险实体数据。
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
