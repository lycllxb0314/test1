'use client';

/**
 * 荣誉统计图表组件
 * 
 * 统一用于德育处和班主任荣誉管理页面，通过 props 控制显示内容和权限
 */

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SimpleBarChart, SimplePieChart, SimpleLineChart } from '@/components/charts/SimpleBarChart';
import { toast } from 'sonner';
import { Medal, Target, Users, Calendar, BarChart3, Download } from 'lucide-react';

// ==================== 类型定义 ====================

type HonorLevel = '国家级' | '省级' | '市级' | '区级' | '校级' | '班级';
type HonorCategory = '综合' | '学习' | '德育' | '体育' | '艺术' | '劳动' | '科技';

interface StudentHonor {
  id: string;
  studentId: string;
  studentName: string;
  className?: string;
  grade?: string;
  title: string;
  level: HonorLevel;
  category: HonorCategory;
  issuer?: string;
  date: string;
  certificateNo?: string;
  description?: string;
  createdAt: string;
}

interface HonorStatistics {
  total: number;
  byLevel: Record<string, number>;
  byCategory: Record<string, number>;
  byGrade?: Record<string, number>;
  byMonth?: Record<string, number>;
  topStudents?: Array<{ studentId: string; studentName: string; count: number }>;
}

interface HonorChartsProps {
  /** 统计数据 */
  statistics: HonorStatistics | null;
  /** 限定班级ID（班主任专用，传此参数会限定查询范围） */
  classId?: string;
  /** 是否显示年级图表（德育处专用） */
  showGradeChart?: boolean;
  /** 是否显示月趋势图（德育处专用） */
  showMonthChart?: boolean;
  /** 图表高度 */
  chartHeight?: number;
}

// ==================== 配置 ====================

const HONOR_LEVELS: HonorLevel[] = ['国家级', '省级', '市级', '区级', '校级', '班级'];
const HONOR_CATEGORIES: HonorCategory[] = ['综合', '学习', '德育', '体育', '艺术', '劳动', '科技'];
const GRADE_NAMES: Record<string, string> = {
  '1': '一年级', '2': '二年级', '3': '三年级',
  '4': '四年级', '5': '五年级', '6': '六年级',
};

const LEVEL_COLORS: Record<HonorLevel, string> = {
  '国家级': '#dc2626',  // red-600
  '省级': '#ea580c',    // orange-600
  '市级': '#ca8a04',    // yellow-600
  '区级': '#16a34a',    // green-600
  '校级': '#2563eb',    // blue-600
  '班级': '#6b7280',    // gray-500
};

const PIE_COLORS = [
  '#f43f5e', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#06b6d4'
];

// ==================== 主组件 ====================

export function HonorCharts({
  statistics,
  classId,
  showGradeChart = false,
  showMonthChart = false,
  chartHeight = 250,
}: HonorChartsProps) {
  // === 弹窗状态 ===
  const [chartDetailOpen, setChartDetailOpen] = useState(false);
  const [chartDetailTitle, setChartDetailTitle] = useState('');
  const [chartDetailData, setChartDetailData] = useState<StudentHonor[]>([]);

  // ==================== 图表点击处理 ====================

  const handleChartClick = useCallback(async (data: { name: string; value: number; type: string }) => {
    if (data.value === 0) return;
    
    // 根据图表类型确定筛选条件
    let filterKey = '';
    let filterValue = data.name;
    let title = '';
    
    switch (data.type) {
      case 'level':
        filterKey = 'level';
        filterValue = data.name;
        title = `${data.name}荣誉列表 (${data.value}条)`;
        break;
      case 'category':
        filterKey = 'category';
        filterValue = data.name;
        title = `${data.name}类荣誉列表 (${data.value}条)`;
        break;
      case 'grade':
        filterKey = 'grade';
        // 从"X年级"提取数字
        const gradeMatch = data.name.match(/(\d)/);
        filterValue = gradeMatch ? gradeMatch[1] : data.name;
        title = `${data.name}荣誉列表 (${data.value}条)`;
        break;
      case 'month':
        filterKey = 'month';
        // 从"XX月"提取月份
        const monthMatch = data.name.match(/(\d+)/);
        filterValue = monthMatch ? monthMatch[1] : data.name;
        title = `${data.name}荣誉列表 (${data.value}条)`;
        break;
      default:
        title = `荣誉列表 (${data.value}条)`;
    }
    
    setChartDetailTitle(title);
    setChartDetailOpen(true);
    
    // 加载筛选后的数据
    try {
      const params = new URLSearchParams();
      params.set('page', '1');
      params.set('pageSize', '100');
      
      // 如果限定了班级，添加班级筛选
      if (classId) {
        params.set('classId', classId);
      }
      
      if (filterKey && filterValue) {
        params.set(filterKey, filterValue);
      }
      
      const res = await fetch(`/api/student-honors?${params.toString()}`, {
        credentials: 'include',
      });
      const result = await res.json();
      
      if (result.success) {
        const honorsData = result.data?.data || result.data || [];
        setChartDetailData(Array.isArray(honorsData) ? honorsData : []);
      }
    } catch (err) {
      console.error('加载图表详情数据失败:', err);
      setChartDetailData([]);
    }
  }, [classId]);

  // ==================== 导出功能 ====================

  const handleExportChartDetail = async () => {
    if (chartDetailData.length === 0) {
      toast.error('暂无数据可导出');
      return;
    }

    try {
      // 动态导入 xlsx 库
      const XLSX = await import('xlsx');
      
      // 转换数据格式
      const rows = chartDetailData.map(honor => ({
        '学生姓名': honor.studentName,
        '班级': honor.className,
        '荣誉名称': honor.title,
        '级别': honor.level,
        '类别': honor.category,
        '颁发单位': honor.issuer || '',
        '获奖日期': honor.date,
        '证书编号': honor.certificateNo || '',
        '备注': honor.description || '',
      }));
      
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '学生荣誉');
      
      // 生成文件名
      const filename = `${chartDetailTitle.replace(/[()（）]/g, '')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, filename);
      
      toast.success('导出成功');
    } catch (err) {
      console.error('导出失败:', err);
      toast.error('导出失败');
    }
  };

  // ==================== 图表数据转换 ====================

  const levelChartData = statistics ? HONOR_LEVELS.map(level => ({
    name: level,
    value: statistics.byLevel[level] || 0,
    fill: LEVEL_COLORS[level],
  })) : [];

  const categoryChartData = statistics ? HONOR_CATEGORIES.map(cat => ({
    name: cat,
    value: statistics.byCategory[cat] || 0,
  })) : [];

  const gradeChartData = statistics?.byGrade ? Object.entries(statistics.byGrade).map(([grade, count]) => ({
    name: GRADE_NAMES[grade] || `${grade}年级`,
    value: count,
  })) : [];

  const monthChartData = statistics?.byMonth ? Object.entries(statistics.byMonth)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .map(([month, count]) => ({
      name: `${month}月`,
      value: count,
    })) : [];

  // ==================== 渲染 ====================

  const EmptyPlaceholder = () => (
    <div style={{ height: chartHeight }} className="flex items-center justify-center text-gray-400">
      暂无数据
    </div>
  );

  return (
    <>
      {/* 图表区域 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 按级别统计 */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Medal className="h-5 w-5 text-amber-500" />
              按级别统计
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statistics ? (
              <SimpleBarChart 
                data={levelChartData} 
                height={chartHeight}
                colors={Object.values(LEVEL_COLORS)}
                chartType="level"
                onItemClick={handleChartClick}
              />
            ) : (
              <EmptyPlaceholder />
            )}
          </CardContent>
        </Card>

        {/* 按类别统计 */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              按类别统计
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statistics ? (
              <SimplePieChart 
                data={categoryChartData} 
                height={chartHeight}
                colors={PIE_COLORS}
                chartType="category"
                onItemClick={handleChartClick}
              />
            ) : (
              <EmptyPlaceholder />
            )}
          </CardContent>
        </Card>

        {/* 按年级统计 - 仅德育处 */}
        {showGradeChart && (
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-500" />
                按年级统计
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statistics && gradeChartData.length > 0 ? (
                <SimpleBarChart 
                  data={gradeChartData} 
                  height={chartHeight}
                  colors={['#8b5cf6']}
                  chartType="grade"
                  onItemClick={handleChartClick}
                />
              ) : (
                <EmptyPlaceholder />
              )}
            </CardContent>
          </Card>
        )}

        {/* 按月份统计 - 仅德育处 */}
        {showMonthChart && (
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-green-500" />
                按月份统计（本年度）
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statistics && monthChartData.length > 0 ? (
                <SimpleLineChart 
                  data={monthChartData} 
                  height={chartHeight}
                  color="#22c55e"
                  chartType="month"
                  onItemClick={handleChartClick}
                />
              ) : (
                <EmptyPlaceholder />
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* 图表详情弹窗 */}
      <Dialog open={chartDetailOpen} onOpenChange={setChartDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              {chartDetailTitle}
            </DialogTitle>
            <DialogDescription>
              点击图表查看详细数据
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto">
            {chartDetailData.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>学生姓名</TableHead>
                    <TableHead>荣誉名称</TableHead>
                    <TableHead>级别</TableHead>
                    <TableHead>类别</TableHead>
                    <TableHead>获奖日期</TableHead>
                    <TableHead>颁发单位</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chartDetailData.map((honor) => (
                    <TableRow key={honor.id}>
                      <TableCell className="font-medium">{honor.studentName}</TableCell>
                      <TableCell>{honor.title}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          honor.level === '国家级' ? 'bg-red-100 text-red-700' :
                          honor.level === '省级' ? 'bg-orange-100 text-orange-700' :
                          honor.level === '市级' ? 'bg-yellow-100 text-yellow-700' :
                          honor.level === '区级' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {honor.level}
                        </span>
                      </TableCell>
                      <TableCell>{honor.category}</TableCell>
                      <TableCell>{honor.date}</TableCell>
                      <TableCell>{honor.issuer || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <BarChart3 className="h-12 w-12 mb-4 opacity-50" />
                <p>暂无数据</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setChartDetailOpen(false)}>
              关闭
            </Button>
            <Button onClick={handleExportChartDetail} disabled={chartDetailData.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              导出 Excel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
