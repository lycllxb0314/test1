'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from 'lucide-react';
import { LedgerEntry, LEDGER_TYPE_LABELS } from '@/types/class-sop';

// ==================== 台账 Tab ====================

interface LedgerTabProps {
  entries: LedgerEntry[];
  loading: boolean;
}

export const LedgerTab: React.FC<LedgerTabProps> = ({ entries, loading }) => {
  if (loading) {
    return <div className="text-center py-12 text-slate-400">加载中...</div>;
  }

  if (entries.length === 0) {
    return (
      <Card className="py-16">
        <CardContent className="text-center">
          <CheckCircle2 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 mb-1">暂无台账记录</p>
          <p className="text-sm text-slate-400">完成流程执行后将自动生成台账</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {entries.map(entry => (
        <Card key={entry.id} className="hover:shadow-md transition-all">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-900">{entry.title}</h3>
              <Badge variant="outline">{LEDGER_TYPE_LABELS[entry.type]}</Badge>
            </div>
            <p className="text-xs text-slate-500 mb-3 line-clamp-2">{entry.description}</p>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{new Date(entry.occurredAt).toLocaleDateString()}</span>
              <span>{entry.handlerName}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
