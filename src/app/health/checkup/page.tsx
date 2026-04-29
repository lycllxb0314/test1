'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CheckupPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/health/fitness?tab=checkup');
  }, [router]);
  return null;
}
