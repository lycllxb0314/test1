'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ThumbsUp,
  ThumbsDown,
  Calendar,
  Clock,
  Award,
  AlertTriangle,
  Info,
  AlertCircle,
  Heart,
  Users,
  Target,
  TrendingUp,
} from 'lucide-react';
import { StudentFullProfile } from '@/types';

interface MoralTabContentProps {
  profile: StudentFullProfile;
  // 权限控制：是否可以查看德育预警
  canViewWarnings?: boolean;
}

// 获取等级颜色
const getLevelColor = (level: string) => {
  const colorMap: Record<string, string> = {
    '优秀': 'bg-green-100 text-green-700',
    '良好': 'bg-blue-100 text-blue-700',
    '合格': 'bg-yellow-100 text-yellow-700',
    '待提高': 'bg-red-100 text-red-700',
  };
  return colorMap[level] || 'bg-gray-100 text-gray-700';
};

// 获取预警级别图标和颜色
const getWarningLevelInfo = (level: 'info' | 'warning' | 'danger') => {
  switch (level) {
    case 'danger':
      return { 
        icon: <AlertCircle className="h-5 w-5 text-red-500" />, 
        color: 'bg-red-50 border-red-200',
        badge: 'bg-red-100 text-red-700'
      };
    case 'warning':
      return { 
        icon: <AlertTriangle className="h-5 w-5 text-orange-500" />, 
        color: 'bg-orange-50 border-orange-200',
        badge: 'bg-orange-100 text-orange-700'
      };
    default:
      return { 
        icon: <Info className="h-5 w-5 text-blue-500" />, 
        color: 'bg-blue-50 border-blue-200',
        badge: 'bg-blue-100 text-blue-700'
      };
  }
};

export function MoralTabContent({ profile, canViewWarnings = false }: MoralTabContentProps) {
  const { moralPerformance } = profile;

  if (!moralPerformance) {
    return (
      <Card className="shadow-sm">
        <CardContent className="py-12">
          <p className="text-muted-foreground text-center">暂无德育表现数据</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 行为评价统计 */}
      {moralPerformance.behaviorStats && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ThumbsUp className="h-5 w-5 text-primary" />
              行为评价统计
            </CardTitle>
            <CardDescription>本学期行为表现统计</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">
                  {moralPerformance.behaviorStats.praiseCount}
                </div>
                <div className="text-sm text-muted-foreground">表扬次数</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-3xl font-bold text-orange-600">
                  {moralPerformance.behaviorStats.improveCount}
                </div>
                <div className="text-sm text-muted-foreground">待改进次数</div>
              </div>
              <div className="text-center p-4 bg-primary/5 rounded-lg">
                <div className="text-3xl font-bold text-primary">
                  {moralPerformance.behaviorStats.behaviorScore}
                </div>
                <div className="text-sm text-muted-foreground">行为得分</div>
              </div>
            </div>
            
            {/* 行为得分进度条 */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">行为得分率</span>
                <span className="font-medium">{moralPerformance.behaviorStats.behaviorScore}%</span>
              </div>
              <Progress 
                value={moralPerformance.behaviorStats.behaviorScore} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* 德育活动参与 */}
      {moralPerformance.activities && moralPerformance.activities.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              德育活动参与
            </CardTitle>
            <CardDescription>参与的德育活动与少先队活动</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {moralPerformance.activities.map((activity) => (
                <div key={activity.id} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Heart className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{activity.title}</div>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <Badge variant="outline" className="text-xs">{activity.type}</Badge>
                          {activity.role && (
                            <>
                              <span>·</span>
                              <span>{activity.role}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">{activity.date}</div>
                      {activity.achievement && (
                        <Badge className="mt-1 bg-primary/10 text-primary">
                          {activity.achievement}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 志愿服务记录 */}
      {moralPerformance.volunteerRecords && moralPerformance.volunteerRecords.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              志愿服务记录
            </CardTitle>
            <CardDescription>参与志愿服务活动情况</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {moralPerformance.volunteerRecords.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                      <Heart className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium">{record.activity}</div>
                      <div className="text-sm text-muted-foreground">{record.date}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">{record.hours}小时</div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* 志愿服务总时长 */}
            <div className="mt-4 p-3 bg-green-50 rounded-lg text-center">
              <span className="text-sm text-muted-foreground">累计志愿服务时长：</span>
              <span className="text-lg font-bold text-green-600 ml-1">
                {moralPerformance.volunteerRecords.reduce((sum, r) => sum + r.hours, 0)}小时
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 德育预警（权限控制：德育主任、班主任、家长可见） */}
      {canViewWarnings && moralPerformance.warnings && moralPerformance.warnings.length > 0 && (
        <Card className="shadow-sm border-orange-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              德育预警
            </CardTitle>
            <CardDescription>
              仅德育主任、班主任、家长可见
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {moralPerformance.warnings.map((warning) => {
                // 转换level类型
                const level = warning.level === '重度' ? 'danger' as const :
                              warning.level === '中度' ? 'warning' as const :
                              'info' as const;
                const levelInfo = getWarningLevelInfo(level);
                return (
                  <div 
                    key={warning.id} 
                    className={`p-3 border rounded-lg ${levelInfo.color}`}
                  >
                    <div className="flex items-start gap-3">
                      {levelInfo.icon}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{warning.type}</span>
                          <Badge className={levelInfo.badge}>
                            {level === 'danger' ? '高风险' : 
                             level === 'warning' ? '中风险' : '低风险'}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {warning.content}
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          {warning.createdAt}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 综合素质评价 */}
      {moralPerformance.comprehensiveEvaluation && moralPerformance.comprehensiveEvaluation.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              综合素质评价
            </CardTitle>
            <CardDescription>德育综合评价记录</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {moralPerformance.comprehensiveEvaluation.map((evaluation, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="font-medium">{evaluation.semester}</div>
                    <Badge className={getLevelColor(evaluation.level)}>
                      {evaluation.level}
                    </Badge>
                  </div>
                  
                  {/* 评分详情 */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center p-2 bg-primary/5 rounded">
                      <div className="text-lg font-bold text-primary">{evaluation.moralScore}</div>
                      <div className="text-xs text-muted-foreground">德育分</div>
                    </div>
                    <div className="text-center p-2 bg-primary/5 rounded">
                      <div className="text-lg font-bold text-primary">{evaluation.socialScore}</div>
                      <div className="text-xs text-muted-foreground">社会实践</div>
                    </div>
                    <div className="text-center p-2 bg-primary/5 rounded">
                      <div className="text-lg font-bold text-primary">{evaluation.volunteerScore}</div>
                      <div className="text-xs text-muted-foreground">志愿服务</div>
                    </div>
                  </div>
                  
                  {/* 总分 */}
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg mb-3">
                    <span className="text-sm">综合得分</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-green-600">{evaluation.totalScore}</span>
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    </div>
                  </div>
                  
                  {/* 评语 */}
                  {evaluation.comment && (
                    <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded">
                      <div className="font-medium mb-1">教师评语：</div>
                      {evaluation.comment}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
