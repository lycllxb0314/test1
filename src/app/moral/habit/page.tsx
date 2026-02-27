'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HabitDevelopmentPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/moral/habit/overview');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
        <p className="mt-4 text-gray-600">正在跳转到习惯养成总览...</p>
      </div>
    </div>
  );
}
