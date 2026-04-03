'use client';

/**
 * 家长端子女信息页面
 * 
 * 功能：
 * - 展示子女详细信息（复用教务处/班主任端的学生详情卡片逻辑）
 * - 支持编辑部分信息（联系电话、家庭住址等）
 * - 关键信息（姓名、性别、学号等）只读，需联系班主任修改
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Users, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ChildDetailCard } from '@/components/parent/ChildDetailCard';
import { toast } from 'sonner';

// 子女信息类型
interface ChildInfo {
  id: string;
  name: string;
  classId: string;
  className: string;
}

export default function ChildrenPage() {
  const { user } = useAuth();
  const [children, setChildren] = useState<ChildInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  // 加载子女列表
  useEffect(() => {
    const fetchChildren = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const res = await fetch('/api/parent/children', { credentials: 'include' });
        const result = await res.json();
        
        if (result.success && result.data) {
          setChildren(result.data);
          // 默认选中第一个子女
          if (result.data.length > 0) {
            setSelectedChildId(result.data[0].id);
          }
        } else {
          setError(result.error || '获取子女信息失败');
        }
      } catch (err) {
        console.error('Failed to fetch children:', err);
        setError('加载失败，请重试');
      }
      setLoading(false);
    };
    
    fetchChildren();
  }, []);

  // 刷新
  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/parent/children', { credentials: 'include' });
      const result = await res.json();
      
      if (result.success && result.data) {
        setChildren(result.data);
        if (result.data.length > 0 && !selectedChildId) {
          setSelectedChildId(result.data[0].id);
        }
        toast.success('刷新成功');
      } else {
        setError(result.error || '获取子女信息失败');
      }
    } catch (err) {
      console.error('Failed to refresh children:', err);
      setError('加载失败，请重试');
    }
    setLoading(false);
  };

  // 加载中
  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">子女信息</h1>
            <p className="text-muted-foreground mt-1">查看和管理子女基本信息</p>
          </div>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // 加载失败
  if (error) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">子女信息</h1>
            <p className="text-muted-foreground mt-1">查看和管理子女基本信息</p>
          </div>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-10 w-10 text-red-300 mb-3" />
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              重试
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 无子女
  if (children.length === 0) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">子女信息</h1>
            <p className="text-muted-foreground mt-1">查看和管理子女基本信息</p>
          </div>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-gray-500 mb-2">暂无子女信息</p>
            <p className="text-sm text-muted-foreground">如需绑定子女，请联系班主任</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">子女信息</h1>
          <p className="text-muted-foreground mt-1">查看和管理子女基本信息</p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          刷新
        </Button>
      </div>

      {/* 子女选择器（多个子女时显示） */}
      {children.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">选择子女：</span>
          {children.map((child) => (
            <Button
              key={child.id}
              variant={selectedChildId === child.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedChildId(child.id)}
            >
              {child.name}
              <Badge variant="secondary" className="ml-2 text-xs">
                {child.className}
              </Badge>
            </Button>
          ))}
        </div>
      )}

      {/* 子女详情卡片 */}
      {selectedChildId && (
        <ChildDetailCard studentId={selectedChildId} />
      )}
    </div>
  );
}
