'use client';

import { Pill, Sparkles } from 'lucide-react';

export default function PrescriptionsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 p-2.5 text-white">
              <Pill className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">健康处方</h1>
              <p className="text-xs text-muted-foreground">AI膳食建议与运动处方</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" /> AI生成
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-6 py-20 text-center text-muted-foreground">
        <Pill className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
        <p>健康处方功能即将上线</p>
        <p className="mt-1 text-xs text-muted-foreground/70">基于学生健康画像，AI将自动生成个性化膳食建议和运动处方</p>
      </div>
    </div>
  );
}
