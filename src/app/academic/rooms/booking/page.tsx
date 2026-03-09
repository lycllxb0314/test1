'use client';

/**
 * 教室预约 - 教师端入口
 * 重定向到教师空间的预约页面
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function RoomBookingPage() {
  const router = useRouter();
  
  useEffect(() => {
    // 重定向到教师空间的教室预约页面
    router.replace('/teacher/room-booking');
  }, [router]);
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  );
}
