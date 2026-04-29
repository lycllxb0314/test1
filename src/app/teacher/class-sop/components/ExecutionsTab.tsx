'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, ArrowRight } from 'lucide-react';
import { SOPExecution } from '@/types/class-sop';
import { categoryConfig } from '../lib/constants';

// ==================== 执行卡片 ====================

const ExecutionCard: React.FC<{
  execution: SOPExecution;
  onContinue: (e: SOPExecution) => void;
}> = ({ execution, onContinue }) => {
  const completed = execution.steps.filter(s => s.status === 'completed').length;
  const total = execution.steps.length;
  const progress = (completed / total) * 100;
  const config = categoryConfig[execution.category];

  return (
    <Card className={`hover:shadow-md transition-all ${
      execution.status === 'in_progress' ? 'ring-2 ring-blue-500/20 bg-blue-50/30' : ''
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center`}>
              <config.icon className={`h-4 w-4 ${config.color}`} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-900">{execution.templateName}</h3>
              <p className="text-xs text-slate-500">{execution.className}</p>
            </div>
          </div>

          <Badge variant={execution.status === 'in_progress' ? 'default' : 'secondary'}>
            {execution.status === 'in_progress' ? '进行中' : '已完成'}
          </Badge>
        </div>

        <div className="space-y-2 mb-3">
          <div className="flex justify-between text-xs text-slate-500">
            <span>进度</span>
            <span>{completed}/{total}</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>{execution.executorName}</span>
          {execution.status === 'in_progress' ? (
            <Button size="sm" variant="default" onClick={() => onContinue(execution)}>
              继续
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          ) : (
            <span>{new Date(execution.completedAt || execution.startedAt).toLocaleDateString()}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// ==================== 执行记录 Tab ====================

interface ExecutionsTabProps {
  executions: SOPExecution[];
  loading: boolean;
  onContinue: (e: SOPExecution) => void;
}

export const ExecutionsTab: React.FC<ExecutionsTabProps> = ({ executions, loading, onContinue }) => {
  if (loading) {
    return <div className="text-center py-12 text-slate-400">加载中...</div>;
  }

  if (executions.length === 0) {
    return (
      <Card className="py-16">
        <CardContent className="text-center">
          <Clock className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 mb-1">暂无执行记录</p>
          <p className="text-sm text-slate-400">选择一个流程开始执行</p>
        </CardContent>
      </Card>
    );
  }

  const inProgress = executions.filter(e => e.status === 'in_progress');
  const completed = executions.filter(e => e.status === 'completed');

  return (
    <div className="space-y-6">
      {/* 进行中 */}
      {inProgress.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            进行中 ({inProgress.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inProgress.map(exec => (
              <ExecutionCard key={exec.id} execution={exec} onContinue={onContinue} />
            ))}
          </div>
        </section>
      )}

      {/* 已完成 */}
      {completed.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-slate-700 mb-3">
            已完成 ({completed.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completed.slice(0, 6).map(exec => (
              <ExecutionCard key={exec.id} execution={exec} onContinue={onContinue} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
