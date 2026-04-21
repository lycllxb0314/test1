'use client';

import { Skeleton } from '@/components/ui/skeleton';

/**
 * 轮播图骨架屏
 */
export function CarouselSkeleton() {
  return (
    <div className="relative w-full aspect-[21/9] rounded-xl overflow-hidden">
      <Skeleton className="w-full h-full" />
    </div>
  );
}

/**
 * 公告卡片骨架屏
 */
export function AnnouncementSkeleton() {
  return (
    <div className="bg-card rounded-lg border p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-16 rounded" />
        <Skeleton className="h-5 w-48 rounded" />
      </div>
      <Skeleton className="h-4 w-full rounded" />
      <Skeleton className="h-4 w-3/4 rounded" />
      <div className="flex justify-between items-center pt-1">
        <Skeleton className="h-3 w-24 rounded" />
        <Skeleton className="h-3 w-16 rounded" />
      </div>
    </div>
  );
}

/**
 * 公告列表骨架屏
 */
export function AnnouncementListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <AnnouncementSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * 荣誉卡片骨架屏
 */
export function HonorSkeleton() {
  return (
    <div className="bg-card rounded-lg border p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="h-3 w-20 rounded" />
        </div>
      </div>
      <Skeleton className="h-3 w-full rounded" />
      <Skeleton className="h-3 w-2/3 rounded" />
    </div>
  );
}

/**
 * 荣誉网格骨架屏
 */
export function HonorGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <HonorSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * 成果分类骨架屏
 */
export function AchievementSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-32 rounded" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-card rounded-lg border p-3 space-y-2">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-3 w-full rounded" />
            <Skeleton className="h-3 w-2/3 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 童心教育骨架屏
 */
export function PhilosophySkeleton() {
  return (
    <div className="bg-card rounded-lg border p-6 space-y-4">
      <Skeleton className="h-6 w-40 rounded" />
      <Skeleton className="h-4 w-full rounded" />
      <Skeleton className="h-4 w-full rounded" />
      <Skeleton className="h-4 w-3/4 rounded" />
      <div className="grid grid-cols-2 gap-3 pt-2">
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
      </div>
    </div>
  );
}

/**
 * 门户页面完整骨架屏
 */
export function PortalPageSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 轮播图 */}
      <CarouselSkeleton />

      {/* 公告 */}
      <section>
        <Skeleton className="h-7 w-32 mb-4 rounded" />
        <AnnouncementListSkeleton count={4} />
      </section>

      {/* 荣誉 */}
      <section>
        <Skeleton className="h-7 w-28 mb-4 rounded" />
        <HonorGridSkeleton count={3} />
      </section>

      {/* 成果 */}
      <section>
        <AchievementSkeleton />
      </section>

      {/* 童心教育 */}
      <section>
        <PhilosophySkeleton />
      </section>
    </div>
  );
}
