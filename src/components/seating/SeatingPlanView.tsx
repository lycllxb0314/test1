/**
 * 班级座位表组件（懒加载）
 * 
 * 支持功能：
 * - 显示座位矩阵
 * - 点击空座位选择学生入座
 * - 拖拽交换座位
 * - 随机排座
 * - 清空座位
 * 
 * @module components/seating/SeatingPlanView
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  Grid3X3,
  User,
  MoreVertical,
  Shuffle,
  Trash2,
  RefreshCw,
  Users,
  Eye,
  Settings,
  ArrowRightLeft,
  Loader2,
  Search,
} from 'lucide-react';
import type {
  SeatingPlan,
  SeatingConfig,
  Seat,
  SeatingStatistics,
} from '@/types/seating';

// ==================== 类型定义 ====================

type Student = {
  id: string;
  name: string;
  studentNo: string;
  gender: 'male' | 'female';
};

// ==================== 主组件 ====================

interface SeatingPlanViewProps {
  classId: string;
  className?: string;
  readOnly?: boolean;
}

const SeatingPlanViewInner: React.FC<SeatingPlanViewProps> = ({
  classId,
  className,
  readOnly = false,
}) => {
  // 状态
  const [plan, setPlan] = useState<SeatingPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [statistics, setStatistics] = useState<SeatingStatistics | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [showStudentDialog, setShowStudentDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [operating, setOperating] = useState(false);
  
  // 获取座位表
  const fetchPlan = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/seating-plans?classId=${classId}&isActive=true`);
      const data = await res.json();
      
      if (data.success && data.data) {
        setPlan(data.data);
        
        // 获取统计
        const statsRes = await fetch(`/api/seating-plans/${data.data.id}/statistics?classId=${classId}`);
        const statsData = await statsRes.json();
        if (statsData.success) {
          setStatistics(statsData.data);
          setStudents(statsData.data.unassignedStudentList || []);
        }
      } else {
        // 没有座位表，创建一个
        const createRes = await fetch('/api/seating-plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ classId }),
        });
        const createData = await createRes.json();
        if (createData.success) {
          setPlan(createData.data);
          setStatistics({
            totalSeats: createData.data.seats.length,
            occupiedSeats: 0,
            emptySeats: createData.data.seats.length,
            lockedSeats: 0,
            unassignedStudents: 0,
            unassignedStudentList: [],
          });
        }
      }
    } catch (e) {
      console.error('获取座位表失败:', e);
    } finally {
      setLoading(false);
    }
  }, [classId]);
  
  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);
  
  // 过滤学生
  const filteredStudents = useMemo(() => {
    if (!searchQuery) return students;
    const query = searchQuery.toLowerCase();
    return students.filter(
      s => s.name.toLowerCase().includes(query) || 
           s.studentNo.toLowerCase().includes(query)
    );
  }, [students, searchQuery]);
  
  // 分配座位
  const assignSeat = async (studentId: string) => {
    if (!plan || !selectedSeat || operating) return;
    
    setOperating(true);
    try {
      const res = await fetch(`/api/seating-plans/${plan.id}/assign-seat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seatId: selectedSeat.id,
          studentId,
        }),
      });
      const data = await res.json();
      
      if (data.success) {
        setPlan(data.data);
        setShowStudentDialog(false);
        setSelectedSeat(null);
        setSearchQuery('');
        fetchPlan(); // 刷新统计数据
      }
    } catch (e) {
      console.error('分配座位失败:', e);
    } finally {
      setOperating(false);
    }
  };
  
  // 清空座位
  const clearSeat = async (seatId: string) => {
    if (!plan || operating) return;
    
    setOperating(true);
    try {
      const res = await fetch(`/api/seating-plans/${plan.id}/clear-seat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seatId }),
      });
      const data = await res.json();
      
      if (data.success) {
        setPlan(data.data);
        fetchPlan();
      }
    } catch (e) {
      console.error('清空座位失败:', e);
    } finally {
      setOperating(false);
    }
  };
  
  // 清空所有座位
  const clearAllSeats = async () => {
    if (!plan || operating) return;
    if (!confirm('确定要清空所有座位吗？')) return;
    
    setOperating(true);
    try {
      const res = await fetch(`/api/seating-plans/${plan.id}/clear-seat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clearAll: true }),
      });
      const data = await res.json();
      
      if (data.success) {
        setPlan(data.data);
        fetchPlan();
      }
    } catch (e) {
      console.error('清空座位失败:', e);
    } finally {
      setOperating(false);
    }
  };
  
  // 随机排座
  const randomArrange = async () => {
    if (!plan || operating) return;
    if (!confirm('确定要随机安排座位吗？当前座位将被覆盖。')) return;
    
    setOperating(true);
    try {
      const res = await fetch(`/api/seating-plans/${plan.id}/random-arrange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId }),
      });
      const data = await res.json();
      
      if (data.success) {
        setPlan(data.data);
        fetchPlan();
      }
    } catch (e) {
      console.error('随机排座失败:', e);
    } finally {
      setOperating(false);
    }
  };
  
  // 交换座位
  const [swapMode, setSwapMode] = useState(false);
  const [swapSeat1, setSwapSeat1] = useState<Seat | null>(null);
  
  const handleSeatClick = (seat: Seat) => {
    if (readOnly) return;
    
    if (swapMode) {
      if (!swapSeat1) {
        setSwapSeat1(seat);
      } else if (seat.id !== swapSeat1.id) {
        // 执行交换
        swapSeats(swapSeat1.id, seat.id);
        setSwapMode(false);
        setSwapSeat1(null);
      }
    } else if (seat.status === 'empty') {
      // 打开学生选择对话框
      setSelectedSeat(seat);
      setShowStudentDialog(true);
    } else if (seat.status === 'occupied') {
      // 显示操作菜单
      setSelectedSeat(seat);
    }
  };
  
  const swapSeats = async (seatId1: string, seatId2: string) => {
    if (!plan || operating) return;
    
    setOperating(true);
    try {
      const res = await fetch(`/api/seating-plans/${plan.id}/swap-seats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seatId1, seatId2 }),
      });
      const data = await res.json();
      
      if (data.success) {
        setPlan(data.data);
      }
    } catch (e) {
      console.error('交换座位失败:', e);
    } finally {
      setOperating(false);
    }
  };
  
  // 座位矩阵
  const seatMatrix = useMemo(() => {
    if (!plan) return [];
    
    const matrix: Seat[][] = [];
    const { rows, columns } = plan.config;
    
    for (let r = 1; r <= rows; r++) {
      const row: Seat[] = [];
      for (let c = 1; c <= columns; c++) {
        const seat = plan.seats.find(
          s => s.position.row === r && s.position.column === c
        );
        row.push(seat || {
          id: `empty-${r}-${c}`,
          position: { row: r, column: c },
          status: 'empty' as const,
        });
      }
      matrix.push(row);
    }
    
    return matrix;
  }, [plan]);
  
  // 加载状态
  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-400" />
          <p className="text-sm text-slate-500 mt-2">加载座位表...</p>
        </CardContent>
      </Card>
    );
  }
  
  if (!plan) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Grid3X3 className="h-12 w-12 mx-auto text-slate-300" />
          <p className="text-slate-500 mt-2">暂无座位表</p>
          <Button className="mt-4" onClick={() => fetchPlan()}>
            创建座位表
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Grid3X3 className="h-5 w-5 text-slate-600" />
            <div>
              <CardTitle className="text-base">班级座位表</CardTitle>
              {className && (
                <p className="text-sm text-slate-500">{className}</p>
              )}
            </div>
          </div>
          
          {!readOnly && (
            <div className="flex items-center gap-2">
              {statistics && (
                <Badge variant="outline">
                  {statistics.occupiedSeats}/{statistics.totalSeats} 已坐
                </Badge>
              )}
              
              <Button
                size="sm"
                variant={swapMode ? 'default' : 'outline'}
                onClick={() => {
                  setSwapMode(!swapMode);
                  setSwapSeat1(null);
                }}
              >
                <ArrowRightLeft className="h-4 w-4 mr-1" />
                {swapMode ? '取消交换' : '交换座位'}
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={randomArrange}>
                    <Shuffle className="h-4 w-4 mr-2" />
                    随机排座
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={clearAllSeats} className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    清空座位
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={fetchPlan}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    刷新
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
        
        {swapMode && (
          <p className="text-sm text-blue-600 mt-2">
            {swapSeat1 
              ? `已选择 ${swapSeat1.studentName || `座位(${swapSeat1.position.row},${swapSeat1.position.column})`}，请点击要交换的座位`
              : '请点击第一个要交换的座位'
            }
          </p>
        )}
      </CardHeader>
      
      <CardContent>
        {/* 讲台 */}
        <div className="mb-4 py-2 bg-slate-100 rounded-lg text-center text-sm text-slate-600">
          讲台
        </div>
        
        {/* 座位矩阵 */}
        <div className="space-y-2">
          {seatMatrix.map((row, rowIndex) => (
            <div key={rowIndex} className="flex justify-center gap-2">
              {row.map((seat) => (
                <SeatCard
                  key={seat.id}
                  seat={seat}
                  isSwapMode={swapMode}
                  isSwapSelected={swapSeat1?.id === seat.id}
                  onClick={() => handleSeatClick(seat)}
                  onClear={() => clearSeat(seat.id)}
                  readOnly={readOnly}
                />
              ))}
            </div>
          ))}
        </div>
        
        {/* 未安排学生 */}
        {statistics && statistics.unassignedStudents > 0 && !readOnly && (
          <div className="mt-4 p-3 bg-amber-50 rounded-lg">
            <p className="text-sm text-amber-700">
              还有 {statistics.unassignedStudents} 名学生未安排座位
            </p>
          </div>
        )}
      </CardContent>
      
      {/* 学生选择对话框 */}
      <Dialog open={showStudentDialog} onOpenChange={setShowStudentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>选择学生入座</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="搜索学生..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <div className="max-h-[300px] overflow-y-auto space-y-1">
              {filteredStudents.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">
                  {searchQuery ? '未找到匹配的学生' : '所有学生都已安排座位'}
                </p>
              ) : (
                filteredStudents.map(student => (
                  <button
                    key={student.id}
                    onClick={() => assignSeat(student.id)}
                    disabled={operating}
                    className="w-full flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg text-left"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${
                      student.gender === 'male' ? 'bg-blue-500' : 'bg-pink-500'
                    }`}>
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{student.name}</p>
                      <p className="text-xs text-slate-500">{student.studentNo}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

// ==================== 座位卡片 ====================

interface SeatCardProps {
  seat: Seat;
  isSwapMode: boolean;
  isSwapSelected: boolean;
  onClick: () => void;
  onClear: () => void;
  readOnly: boolean;
}

const SeatCard: React.FC<SeatCardProps> = ({
  seat,
  isSwapMode,
  isSwapSelected,
  onClick,
  onClear,
  readOnly,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  
  const getSeatStyle = () => {
    if (isSwapSelected) {
      return 'bg-blue-100 border-blue-500 ring-2 ring-blue-500';
    }
    
    switch (seat.status) {
      case 'occupied':
        return 'bg-blue-50 border-blue-200';
      case 'locked':
        return 'bg-amber-50 border-amber-200';
      case 'teacher':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-slate-50 border-slate-200';
    }
  };
  
  return (
    <div
      className={`
        relative w-16 h-16 border rounded-lg flex flex-col items-center justify-center
        cursor-pointer transition-all
        ${getSeatStyle()}
        ${!readOnly && 'hover:shadow-md'}
        ${seat.status === 'empty' && !readOnly && 'hover:border-blue-400 hover:bg-blue-50'}
      `}
      onClick={onClick}
    >
      {seat.status === 'occupied' && seat.studentName ? (
        <>
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs ${
            Math.random() > 0.5 ? 'bg-blue-500' : 'bg-pink-500'
          }`}>
            {seat.studentName.charAt(0)}
          </div>
          <p className="text-xs font-medium mt-1 truncate w-full text-center px-1">
            {seat.studentName}
          </p>
          <p className="text-[10px] text-slate-400">
            {seat.position.row}排{seat.position.column}座
          </p>
          
          {!readOnly && !isSwapMode && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 hover:bg-red-600"
            >
              ×
            </button>
          )}
        </>
      ) : (
        <>
          <User className="h-5 w-5 text-slate-300" />
          <p className="text-[10px] text-slate-400 mt-1">
            {seat.position.row}排{seat.position.column}座
          </p>
        </>
      )}
      
      {seat.attributes?.isByWindow && (
        <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-4 bg-sky-400 rounded-r" />
      )}
    </div>
  );
};

// ==================== 懒加载导出 ====================

export const SeatingPlanView = (props: SeatingPlanViewProps) => (
  <Suspense
    fallback={
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-400" />
          <p className="text-sm text-slate-500 mt-2">加载座位表...</p>
        </CardContent>
      </Card>
    }
  >
    <SeatingPlanViewInner {...props} />
  </Suspense>
);

export default SeatingPlanView;
