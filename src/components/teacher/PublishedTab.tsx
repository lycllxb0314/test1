'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

interface PublishedTabProps {
  approvals: any[];
  loading: boolean;
  onRefresh: () => void;
}

export const PublishedTab: React.FC<PublishedTabProps> = ({ approvals, loading, onRefresh }) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>我发布的通知</CardTitle>
            <CardDescription>查看您发布的班级通知</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            刷新
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : approvals.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Send className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>暂无发布记录</p>
          </div>
        ) : (
          <div className="space-y-3">
            {approvals.map((item) => (
              <Card key={item.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">{item.title}</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant={item.status === 'approved' ? 'default' : 'secondary'}>
                    {item.status === 'approved' ? '已发布' : '待审批'}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
