'use client';

import { Stethoscope } from 'lucide-react';

export default function CheckupPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gradient-to-br from-sky-500 to-sky-600 p-2.5 text-white">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">体检管理</h1>
              <p className="text-xs text-muted-foreground">学生体检数据管理与导入</p>
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-6 py-20 text-center text-muted-foreground">
        <Stethoscope className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
        <p>体检管理功能即将上线</p>
        <p className="mt-1 text-xs text-muted-foreground/70">支持校医批量导入体检数据，含视力、龋齿、脊柱等检查项目</p>
      </div>
    </div>
  );
}
