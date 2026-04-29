'use client';

import { Apple } from 'lucide-react';

export default function ObservationsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gradient-to-br from-rose-400 to-rose-500 p-2.5 text-white">
              <Apple className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">家长观察数据</h1>
              <p className="text-xs text-muted-foreground">家长每日提交的睡眠、饮食、精神状态观察</p>
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-6 py-20 text-center text-muted-foreground">
        <Apple className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
        <p>家长观察数据查看功能即将上线</p>
        <p className="mt-1 text-xs text-muted-foreground/70">家长通过家长端提交每日观察，管理端可查看数据汇总</p>
      </div>
    </div>
  );
}
