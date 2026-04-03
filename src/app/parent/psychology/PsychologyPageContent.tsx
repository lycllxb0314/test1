'use client';

/**
 * 心理陪伴页面内容组件
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { RealtimeChat } from '@/components/psychology/RealtimeChat';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

export function PsychologyPageContent() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [studentId, setStudentId] = useState<string | null>(null);
  const [isLoadingStudent, setIsLoadingStudent] = useState(true);
  const [showCrisisAlert, setShowCrisisAlert] = useState(false);
  const [crisisKeywords, setCrisisKeywords] = useState<string[]>([]);

  // 获取关联学生 ID
  useEffect(() => {
    const fetchStudentId = async () => {
      if (!user?.id) return;

      setIsLoadingStudent(true);
      
      // 家长端获取关联学生信息
      if (user.role === 'parent') {
        try {
          const response = await fetch('/api/parent/children');
          const data = await response.json();
          
          if (data.success && data.data?.length > 0) {
            // 使用第一个关联学生
            setStudentId(data.data[0].id);
          }
        } catch (error) {
          console.error('Failed to fetch student:', error);
        } finally {
          setIsLoadingStudent(false);
        }
      } else {
        setIsLoadingStudent(false);
      }
    };

    fetchStudentId();
  }, [user]);

  // 危机检测回调
  const handleCrisisDetected = (keywords: string[]) => {
    setCrisisKeywords(keywords);
    setShowCrisisAlert(true);
  };

  // 加载中
  if (isLoading || isLoadingStudent) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // 未登录
  if (!user) {
    router.push('/login');
    return null;
  }

  // 没有关联学生
  if (!studentId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              暂无关联的学生信息，请先完善个人资料
            </p>
            <Button onClick={() => router.push('/parent/profile')}>
              前往个人资料
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* 头部 */}
      <header className="flex-shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌈</span>
            <h1 className="text-lg font-semibold">童童哥哥</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            返回
          </Button>
        </div>
      </header>

      {/* 危机预警提示 */}
      {showCrisisAlert && (
        <Alert variant="destructive" className="m-4">
          <AlertTitle>温馨提示</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>
              检测到一些需要关注的表达，我们建议您与孩子进行更多沟通，
              如有需要请及时联系学校心理老师。
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowCrisisAlert(false)}
            >
              我知道了
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* 对话区域 */}
      <main className="flex-1 overflow-hidden">
        <RealtimeChat
          studentId={studentId}
          onCrisisDetected={handleCrisisDetected}
        />
      </main>
    </div>
  );
}
