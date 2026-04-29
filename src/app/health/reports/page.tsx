'use client';

import { BarChart3, Sparkles } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 p-2.5 text-white">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">周期报告</h1>
              <p className="text-xs text-muted-foreground">周/月/学期健康报告生成</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" /> AI生成
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-6 py-20 text-center text-muted-foreground">
        <BarChart3 className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
        <p>周期报告功能即将上线</p>
        <p className="mt-1 text-xs text-muted-foreground/70">AI自动生成每周、每月、每学期的学生健康综合报告</p>
      </div>
    </div>
  );
}
