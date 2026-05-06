'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertTriangle, Lock, Eye, MessageSquare } from 'lucide-react';
import { useAuthKeys, useWarnings, useSessions } from '@/hooks/useMentalHealth';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { StudentMentalHealthSummary } from '@/types/mental-health';

const emotionConfig: Record<string, { label: string; color: string }> = {
  green: { label: '良好', color: 'text-green-600' },
  yellow: { label: '关注', color: 'text-yellow-600' },
  red: { label: '预警', color: 'text-red-600' },
};

export default function TeacherMentalHealthPage() {
  const { user } = useAuth();
  const { verifyAuthKey } = useAuthKeys();
  const { warnings, fetchWarnings } = useWarnings();
  const { sessions, fetchSessions } = useSessions();

  const [students, setStudents] = useState<StudentMentalHealthSummary[]>([]);
  const [authorized, setAuthorized] = useState(false);
  const [authKeyCode, setAuthKeyCode] = useState('');
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 加载班级学生列表（始终可见）
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await fetch('/api/mental-health/sessions?classId=' + (user?.classId ?? ''));
        const data = await res.json();
        if (data.data?.students) {
          setStudents(data.data.students);
        } else if (Array.isArray(data.data)) {
          setStudents(data.data);
        }
      } catch (err) {
        console.error('fetch students error:', err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.classId) {
      fetchStudents();
    }
  }, [user?.classId]);

  // 授权验证
  const handleAuthorize = useCallback(async () => {
    if (!authKeyCode.trim()) {
      toast.error('请输入授权密钥');
      return;
    }
    const result = await verifyAuthKey(authKeyCode, user?.classId);
    const isValid = 'valid' in result ? (result as { valid: boolean }).valid : false;
    if (isValid) {
      setAuthorized(true);
      setShowAuthDialog(false);
      toast.success('授权成功，可查看学生数据');
      fetchWarnings({ isHandled: false });
      fetchSessions({ classId: user?.classId });
    } else {
      toast.error('密钥无效或已过期');
    }
  }, [authKeyCode, user?.classId, verifyAuthKey, fetchWarnings, fetchSessions]);

  // 获取学生相关预警数量
  const getStudentWarningCount = useCallback((studentId: string) => {
    return warnings.filter(w => w.studentId === studentId && !w.isHandled).length;
  }, [warnings]);

  // 获取学生最近会话情绪
  const getStudentEmotion = useCallback((studentId: string) => {
    const studentSessions = sessions
      .filter(s => s.studentId === studentId && !s.isClosed)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return studentSessions[0]?.emotionLevel ?? null;
  }, [sessions]);

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">班级心理健康</h1>
          <p className="text-muted-foreground mt-1">查看本班学生心理健康概况</p>
        </div>
        {!authorized && (
          <Button onClick={() => setShowAuthDialog(true)}>
            <Lock className="h-4 w-4 mr-1" /> 输入授权密钥
          </Button>
        )}
      </div>

      {/* 未授权提示 */}
      {!authorized && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <Lock className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              您可以看到本班学生列表，但查看详细数据需要校领导授权的临时密钥
            </p>
            <Button variant="outline" className="mt-4" onClick={() => setShowAuthDialog(true)}>
              输入授权密钥
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 学生列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {students.map((student) => {
          const warningCount = authorized ? getStudentWarningCount(student.studentId) : 0;
          const emotion = authorized ? getStudentEmotion(student.studentId) : student.latestEmotion;
          const emotionInfo = emotion ? emotionConfig[emotion] : null;

          return (
            <Card key={student.studentId} className="relative">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{student.studentName}</span>
                      {authorized && warningCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-0.5" /> {warningCount}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">学号：{student.studentNo}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {emotionInfo && (
                      <Badge variant="outline" className="text-xs">
                        <span className={emotionInfo.color}>{emotionInfo.label}</span>
                      </Badge>
                    )}
                    {authorized && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedStudent(selectedStudent === student.studentId ? null : student.studentId)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* 展开的详细信息 */}
                {authorized && selectedStudent === student.studentId && (
                  <div className="mt-4 pt-4 border-t space-y-3">
                    {warnings.filter(w => w.studentId === student.studentId).length > 0 ? (
                      <div>
                        <h4 className="text-sm font-medium mb-2">预警记录</h4>
                        {warnings.filter(w => w.studentId === student.studentId).map(w => (
                          <div key={w.id} className="text-sm p-2 bg-muted/50 rounded mb-1">
                            <div className="flex items-center gap-1">
                              <Badge variant={w.severity === 'red' ? 'destructive' : 'outline'} className="text-xs">
                                {w.severity === 'red' ? '红色' : '黄色'}
                              </Badge>
                              <span>{w.title}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">暂无预警记录</p>
                    )}

                    {sessions.filter(s => s.studentId === student.studentId).length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">近期对话</h4>
                        {sessions.filter(s => s.studentId === student.studentId).slice(0, 3).map(s => (
                          <div key={s.id} className="text-sm p-2 bg-muted/50 rounded mb-1 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="h-3 w-3" />
                              <span>{s.title ?? '对话'}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{s.turnCount}轮</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {students.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            暂无班级学生数据
          </CardContent>
        </Card>
      )}

      {/* 授权密钥输入对话框 */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>输入授权密钥</DialogTitle>
            <DialogDescription>
              请输入校领导提供的临时密钥以查看学生心理健康数据
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="请输入授权密钥"
              value={authKeyCode}
              onChange={(e) => setAuthKeyCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAuthorize()}
              className="text-center text-lg font-mono tracking-widest"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAuthDialog(false)}>取消</Button>
            <Button onClick={handleAuthorize}>验证</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
