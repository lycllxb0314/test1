'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { 
  AlertTriangle, 
  Lock, 
  Eye, 
  MessageSquare,
  Heart,
  Shield,
  Key,
  Users,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { useAuthKeys, useWarnings, useSessions } from '@/hooks/useMentalHealth';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { StudentMentalHealthSummary } from '@/types/mental-health';

const emotionConfig: Record<string, { 
  label: string; 
  color: string;
  bgColor: string;
  borderColor: string;
  dotColor: string;
}> = {
  green: { 
    label: '良好', 
    color: 'text-teal-600',
    bgColor: 'bg-teal-500/10',
    borderColor: 'border-teal-500/20',
    dotColor: 'bg-teal-500'
  },
  yellow: { 
    label: '关注', 
    color: 'text-amber-600',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
    dotColor: 'bg-amber-500'
  },
  red: { 
    label: '预警', 
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    borderColor: 'border-destructive/20',
    dotColor: 'bg-destructive'
  },
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero 区域 */}
      <div className="relative overflow-hidden bg-gradient-to-br from-teal-50/50 via-background to-primary/5 dark:from-teal-950/20 dark:via-background dark:to-primary/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-teal-500/5 via-transparent to-transparent" />
        <div className="relative px-6 py-8 sm:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-teal-500/10">
                  <Heart className="h-5 w-5 text-teal-500" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">班级心理健康</h1>
                  <p className="text-muted-foreground text-sm">关注每一位学生的心理状态</p>
                </div>
              </div>
              {!authorized && (
                <Button 
                  onClick={() => setShowAuthDialog(true)}
                  className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700"
                >
                  <Key className="h-4 w-4 mr-1.5" /> 输入授权密钥
                </Button>
              )}
              {authorized && (
                <Badge className="bg-teal-500/10 text-teal-600 border-0 px-3 py-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> 已授权
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 sm:px-8 py-6 max-w-7xl mx-auto space-y-6">
        {/* 统计概览 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm bg-gradient-to-br from-card to-teal-50/30 dark:to-teal-950/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">班级人数</p>
                  <p className="text-2xl font-bold text-foreground">{students.length}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-teal-500/10">
                  <Users className="h-5 w-5 text-teal-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-card to-green-50/30 dark:to-green-950/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">状态良好</p>
                  <p className="text-2xl font-bold text-teal-600">
                    {students.filter(s => s.latestEmotion === 'green' || !s.latestEmotion).length}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-teal-500/10">
                  <CheckCircle2 className="h-5 w-5 text-teal-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-card to-amber-50/30 dark:to-amber-950/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">需关注</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {students.filter(s => s.latestEmotion === 'yellow').length}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-500/10">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-card to-destructive/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">预警中</p>
                  <p className="text-2xl font-bold text-destructive">
                    {students.filter(s => s.latestEmotion === 'red').length}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-destructive/10">
                  <Shield className="h-5 w-5 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 未授权提示 */}
        {!authorized && (
          <Card className="border-dashed border-2 border-border bg-gradient-to-r from-muted/30 to-muted/10">
            <CardContent className="py-10 flex flex-col items-center text-center">
              <div className="p-4 rounded-full bg-muted mb-4">
                <Lock className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-foreground mb-2">需要授权才能查看详细数据</h3>
              <p className="text-sm text-muted-foreground max-w-md mb-4">
                出于隐私保护，查看学生心理健康详细数据需要校领导授权的临时密钥
              </p>
              <Button variant="outline" onClick={() => setShowAuthDialog(true)}>
                <Key className="h-4 w-4 mr-1.5" /> 输入授权密钥
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
            const isExpanded = selectedStudent === student.studentId;

            return (
              <Card 
                key={student.studentId} 
                className={`border-0 shadow-sm overflow-hidden transition-all duration-300 ${
                  isExpanded ? 'shadow-md' : 'hover:shadow-md'
                } ${
                  emotionInfo ? emotionInfo.bgColor : 'bg-card'
                }`}
              >
                <div className={`h-1 ${
                  emotion === 'red' ? 'bg-gradient-to-r from-destructive via-destructive/80 to-destructive' :
                  emotion === 'yellow' ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500' :
                  'bg-gradient-to-r from-teal-500 via-teal-400 to-teal-500'
                }`} />
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        emotionInfo ? emotionInfo.bgColor : 'bg-muted'
                      }`}>
                        <span className="text-sm font-medium">
                          {student.studentName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{student.studentName}</span>
                          {authorized && warningCount > 0 && (
                            <Badge variant="destructive" className="text-xs h-5 px-1.5">
                              <AlertTriangle className="h-3 w-3 mr-0.5" /> {warningCount}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">学号：{student.studentNo}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {emotionInfo && (
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${emotionInfo.bgColor} ${emotionInfo.color} border-0`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${emotionInfo.dotColor} mr-1.5`} />
                          {emotionInfo.label}
                        </Badge>
                      )}
                      {authorized && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedStudent(isExpanded ? null : student.studentId)}
                          className="h-8 w-8 p-0"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* 展开的详细信息 */}
                  {authorized && isExpanded && (
                    <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
                      {warnings.filter(w => w.studentId === student.studentId).length > 0 ? (
                        <div>
                          <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                            预警记录
                          </h4>
                          <div className="space-y-2">
                            {warnings.filter(w => w.studentId === student.studentId).map(w => (
                              <div key={w.id} className="text-sm p-3 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <Badge 
                                    variant={w.severity === 'red' ? 'destructive' : 'outline'} 
                                    className="text-xs"
                                  >
                                    {w.severity === 'red' ? '红色' : '黄色'}
                                  </Badge>
                                  <span className="text-foreground">{w.title}</span>
                                </div>
                                {w.description && (
                                  <p className="text-xs text-muted-foreground mt-1">{w.description}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="h-4 w-4 text-teal-500" />
                          暂无预警记录
                        </div>
                      )}

                      {sessions.filter(s => s.studentId === student.studentId).length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                            <MessageSquare className="h-3.5 w-3.5 text-primary" />
                            近期对话
                          </h4>
                          <div className="space-y-2">
                            {sessions.filter(s => s.studentId === student.studentId).slice(0, 3).map(s => (
                              <div key={s.id} className="text-sm p-3 bg-muted/50 rounded-lg flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                                  <span className="text-foreground">{s.title ?? '对话'}</span>
                                </div>
                                <span className="text-xs text-muted-foreground">{s.turnCount}轮</span>
                              </div>
                            ))}
                          </div>
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
          <Card className="border-0 shadow-sm">
            <CardContent className="py-16 flex flex-col items-center space-y-4">
              <div className="p-4 rounded-full bg-muted">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="font-medium text-foreground">暂无班级学生数据</p>
                <p className="text-sm text-muted-foreground mt-1">请检查班级配置</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 授权密钥输入对话框 */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              输入授权密钥
            </DialogTitle>
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
              className="text-center text-lg font-mono tracking-widest h-12"
            />
            <p className="text-xs text-muted-foreground text-center mt-2">
              密钥由校领导或德育处生成，有效期内可使用
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAuthDialog(false)}>取消</Button>
            <Button 
              onClick={handleAuthorize}
              className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700"
            >
              验证密钥
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
