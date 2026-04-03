'use client';

/**
 * 心理预警管理页面内容
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { PsychologyAlert, AlertStatistics, AlertLevel, AlertStatus } from '@/types/psychology';

// 预警级别颜色
const alertLevelColors: Record<AlertLevel, string> = {
  red: 'bg-red-500 text-white',
  orange: 'bg-orange-500 text-white',
  yellow: 'bg-yellow-500 text-black',
};

// 预警级别名称
const alertLevelNames: Record<AlertLevel, string> = {
  red: '红色预警',
  orange: '橙色预警',
  yellow: '黄色预警',
};

// 预警状态名称
const alertStatusNames: Record<AlertStatus, string> = {
  pending: '待处理',
  processing: '处理中',
  resolved: '已解决',
  closed: '已关闭',
};

export function PsychologyAlertsContent() {
  const [statistics, setStatistics] = useState<AlertStatistics | null>(null);
  const [alerts, setAlerts] = useState<PsychologyAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<PsychologyAlert | null>(null);
  const [handleNotes, setHandleNotes] = useState('');
  const [showHandleDialog, setShowHandleDialog] = useState(false);

  // 获取统计数据
  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const response = await fetch('/api/psychology/alerts?action=statistics');
        const data = await response.json();
        if (data.success) {
          setStatistics(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch statistics:', error);
      }
    };

    fetchStatistics();
  }, []);

  // 获取预警列表
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/psychology/alerts?action=list');
        const data = await response.json();
        if (data.success) {
          setAlerts(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch alerts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  // 处理预警
  const handleAlert = async (status: AlertStatus) => {
    if (!selectedAlert) return;

    try {
      const response = await fetch('/api/psychology/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'handle',
          alertId: selectedAlert.id,
          handlerId: 'current_user', // 实际应从认证获取
          handlerName: '德育老师', // 实际应从认证获取
          status,
          handleNotes,
        }),
      });

      const data = await response.json();
      if (data.success) {
        // 更新列表
        setAlerts(prev => prev.map(a => 
          a.id === selectedAlert.id ? data.data : a
        ));
        setShowHandleDialog(false);
        setSelectedAlert(null);
        setHandleNotes('');
      }
    } catch (error) {
      console.error('Failed to handle alert:', error);
    }
  };

  // 打开处理对话框
  const openHandleDialog = (alert: PsychologyAlert) => {
    setSelectedAlert(alert);
    setHandleNotes(alert.handleNotes || '');
    setShowHandleDialog(true);
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">心理预警管理</h1>
          <p className="text-muted-foreground">管理学生心理危机预警信息</p>
        </div>
      </div>

      {/* 统计卡片 */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                待处理
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-500">
                {statistics.byStatus.pending}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                红色预警
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {statistics.byLevel.red}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                橙色预警
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-500">
                {statistics.byLevel.orange}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                黄色预警
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-500">
                {statistics.byLevel.yellow}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 预警列表 */}
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">待处理</TabsTrigger>
          <TabsTrigger value="processing">处理中</TabsTrigger>
          <TabsTrigger value="resolved">已解决</TabsTrigger>
          <TabsTrigger value="all">全部</TabsTrigger>
        </TabsList>

        {['pending', 'processing', 'resolved', 'all'].map(tab => (
          <TabsContent key={tab} value={tab} className="mt-4">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                加载中...
              </div>
            ) : (
              <div className="space-y-4">
                {alerts
                  .filter(a => tab === 'all' || a.status === tab)
                  .map(alert => (
                    <Card 
                      key={alert.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => openHandleDialog(alert)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={alertLevelColors[alert.alertLevel]}>
                                {alertLevelNames[alert.alertLevel]}
                              </Badge>
                              <Badge variant="outline">
                                {alertStatusNames[alert.status]}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {new Date(alert.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="font-medium mb-1">{alert.content}</p>
                            <p className="text-sm text-muted-foreground">
                              关键词：{alert.keywords.join('、')}
                            </p>
                            {alert.context && (
                              <p className="text-sm text-muted-foreground mt-2 p-2 bg-muted rounded">
                                "{alert.context}"
                              </p>
                            )}
                          </div>
                          <Button variant="outline" size="sm">
                            查看
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                
                {alerts.filter(a => tab === 'all' || a.status === tab).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    暂无预警记录
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* 处理对话框 */}
      <Dialog open={showHandleDialog} onOpenChange={setShowHandleDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>处理预警</DialogTitle>
          </DialogHeader>
          
          {selectedAlert && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={alertLevelColors[selectedAlert.alertLevel]}>
                  {alertLevelNames[selectedAlert.alertLevel]}
                </Badge>
                <Badge variant="outline">
                  {alertStatusNames[selectedAlert.status]}
                </Badge>
              </div>
              
              <div>
                <p className="font-medium">{selectedAlert.content}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  关键词：{selectedAlert.keywords.join('、')}
                </p>
              </div>

              {selectedAlert.context && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">原话："{selectedAlert.context}"</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium">处理记录</label>
                <Textarea
                  value={handleNotes}
                  onChange={(e) => setHandleNotes(e.target.value)}
                  placeholder="请记录处理情况..."
                  rows={4}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowHandleDialog(false)}>
              取消
            </Button>
            <Button 
              variant="secondary"
              onClick={() => handleAlert('processing')}
            >
              标记处理中
            </Button>
            <Button onClick={() => handleAlert('resolved')}>
              标记已解决
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
