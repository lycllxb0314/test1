'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Star,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Award,
  Clock,
  CheckCircle,
  XCircle,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { StudentFullProfile, HabitCategory } from '@/types';
import { habitCategoryNames, habitCategoryColors } from '@/types';

interface HabitTabContentProps {
  profile: StudentFullProfile;
}

// 获取趋势图标
const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
  switch (trend) {
    case 'up':
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    case 'down':
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    default:
      return <Minus className="h-4 w-4 text-gray-400" />;
  }
};

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

// 获取场景中文名
const getSceneName = (scene: string) => {
  const sceneMap: Record<string, string> = {
    'classroom': '课堂',
    'campus': '校园',
    'home': '家庭',
    'activity': '活动',
    'other': '其他',
  };
  return sceneMap[scene] || scene;
};

export function HabitTabContent({ profile }: HabitTabContentProps) {
  const { habitProfile } = profile;

  if (!habitProfile) {
    return (
      <Card className="shadow-sm">
        <CardContent className="py-12">
          <p className="text-muted-foreground text-center">暂无习惯养成数据</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 综合评价卡片 */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            习惯养成总评
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-3xl font-bold text-primary">{habitProfile.overallScore}</div>
              <div className="text-sm text-muted-foreground">综合评分</div>
            </div>
            <div className="text-right">
              <Badge className={getLevelColor(habitProfile.level)}>
                {habitProfile.level}
              </Badge>
              <div className="flex items-center gap-1 mt-2 text-primary">
                <Star className="h-4 w-4" />
                <span className="text-sm">习惯之星 × {habitProfile.habitStarCount}</span>
              </div>
            </div>
          </div>
          
          {habitProfile.monthlyStars.length > 0 && (
            <div className="mt-4">
              <div className="text-sm text-muted-foreground mb-2">获评月份</div>
              <div className="flex flex-wrap gap-2">
                {habitProfile.monthlyStars.map(month => (
                  <Badge key={month} variant="outline">{month}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 各类别得分 */}
      {habitProfile.categoryScores && habitProfile.categoryScores.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              各类别得分
            </CardTitle>
            <CardDescription>八大习惯类别达成情况</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {habitProfile.categoryScores.map((item) => (
                <div key={item.category} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{item.categoryName}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-primary">{item.rate}%</span>
                      {getTrendIcon(item.trend)}
                    </div>
                  </div>
                  <Progress value={item.rate} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{item.score}/{item.maxScore}分</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 月度小目标 */}
      {habitProfile.monthlyGoals && habitProfile.monthlyGoals.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              月度小目标
            </CardTitle>
            <CardDescription>学生每月设定的习惯养成目标</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {habitProfile.monthlyGoals.map((goal, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {goal.achieved ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <Clock className="h-5 w-5 text-yellow-500" />
                    )}
                    <div>
                      <div className="font-medium">{goal.goal}</div>
                      <div className="text-sm text-muted-foreground">
                        {goal.month} · {habitCategoryNames[goal.category]}
                      </div>
                    </div>
                  </div>
                  <Badge variant={goal.achieved ? 'default' : 'secondary'}>
                    {goal.achieved ? '已达成' : '进行中'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 习惯之星记录 */}
      {habitProfile.habitStarRecords && habitProfile.habitStarRecords.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              习惯之星记录
            </CardTitle>
            <CardDescription>获评习惯之星荣誉记录</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {habitProfile.habitStarRecords.map((record, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-primary/5">
                  <div className="flex items-center gap-3">
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                    <div>
                      <div className="font-medium">
                        {record.month}
                        {record.category && ` · ${habitCategoryNames[record.category]}`}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {record.level === 'class' ? '班级之星' : 
                         record.level === 'grade' ? '年级之星' : '校级之星'}
                      </div>
                    </div>
                  </div>
                  <Badge className={
                    record.level === 'school' ? 'bg-red-100 text-red-700' :
                    record.level === 'grade' ? 'bg-purple-100 text-purple-700' :
                    'bg-blue-100 text-blue-700'
                  }>
                    {record.level === 'class' ? '班级' : 
                     record.level === 'grade' ? '年级' : '校级'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 习惯评价记录（全过程） */}
      {habitProfile.recentAssessments && habitProfile.recentAssessments.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              习惯评价记录
            </CardTitle>
            <CardDescription>伴随学生在校全过程的习惯评价</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {habitProfile.recentAssessments.map((assessment) => (
                <div key={assessment.id} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {assessment.type === 'praise' ? (
                        <ThumbsUp className="h-5 w-5 text-green-500 mt-0.5" />
                      ) : (
                        <ThumbsDown className="h-5 w-5 text-orange-500 mt-0.5" />
                      )}
                      <div>
                        <div className="font-medium">{assessment.title}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {assessment.content}
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {habitCategoryNames[assessment.category]}
                          </Badge>
                          <span>{getSceneName(assessment.scene || 'other')}</span>
                          <span>·</span>
                          <span>{assessment.recorderName}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${assessment.score > 0 ? 'text-green-600' : 'text-orange-600'}`}>
                        {assessment.score > 0 ? '+' : ''}{assessment.score}
                      </div>
                      <div className="text-xs text-muted-foreground">{assessment.occurredAt}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
