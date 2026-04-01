'use client';

import * as React from 'react';
import { format, parse, setYear, setMonth, startOfMonth } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DatePickerProps {
  value?: string; // 格式: YYYY-MM-DD
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

// 生成年份列表（1950-当前年份+1）
const generateYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = 1950; year <= currentYear + 1; year++) {
    years.push(year);
  }
  return years;
};

// 生成月份列表
const months = [
  { value: 0, label: '1月' },
  { value: 1, label: '2月' },
  { value: 2, label: '3月' },
  { value: 3, label: '4月' },
  { value: 4, label: '5月' },
  { value: 5, label: '6月' },
  { value: 6, label: '7月' },
  { value: 7, label: '8月' },
  { value: 8, label: '9月' },
  { value: 9, label: '10月' },
  { value: 10, label: '11月' },
  { value: 11, label: '12月' },
];

/**
 * 日期选择器组件（带年份月份下拉选择）
 * 支持 YYYY-MM-DD 格式的日期选择
 */
export function DatePicker({
  value,
  onChange,
  placeholder = '选择日期',
  disabled = false,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [viewDate, setViewDate] = React.useState<Date>(() => {
    if (value) {
      const parsed = parse(value, 'yyyy-MM-dd', new Date());
      return isNaN(parsed.getTime()) ? new Date() : parsed;
    }
    return new Date();
  });

  // 将字符串日期转换为 Date 对象
  const selectedDate = React.useMemo(() => {
    if (!value) return undefined;
    const parsed = parse(value, 'yyyy-MM-dd', new Date());
    return isNaN(parsed.getTime()) ? undefined : parsed;
  }, [value]);

  const years = React.useMemo(() => generateYears(), []);

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      const formatted = format(date, 'yyyy-MM-dd');
      onChange?.(formatted);
      setOpen(false);
    } else {
      onChange?.('');
    }
  };

  const handleYearChange = (yearStr: string) => {
    const year = parseInt(yearStr);
    const newDate = setYear(viewDate, year);
    setViewDate(newDate);
  };

  const handleMonthChange = (monthStr: string) => {
    const month = parseInt(monthStr);
    const newDate = setMonth(viewDate, month);
    setViewDate(newDate);
  };

  const handlePrevMonth = () => {
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setViewDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setViewDate(newDate);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value && selectedDate ? format(selectedDate, 'yyyy年MM月dd日', { locale: zhCN }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 border-b">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handlePrevMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Select value={String(viewDate.getFullYear())} onValueChange={handleYearChange}>
              <SelectTrigger className="h-8 w-[90px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {years.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}年
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={String(viewDate.getMonth())} onValueChange={handleMonthChange}>
              <SelectTrigger className="h-8 w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={String(month.value)}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleNextMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          month={viewDate}
          onMonthChange={setViewDate}
          initialFocus
          locale={zhCN}
          classNames={{
            nav: 'hidden', // 隐藏默认的导航按钮
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

/**
 * 月份选择器组件（带年份下拉选择）
 * 支持 YYYY-MM 格式的月份选择
 */
export function MonthPicker({
  value,
  onChange,
  placeholder = '选择月份',
  disabled = false,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [viewDate, setViewDate] = React.useState<Date>(() => {
    if (value) {
      const parsed = parse(value + '-01', 'yyyy-MM-dd', new Date());
      return isNaN(parsed.getTime()) ? new Date() : parsed;
    }
    return new Date();
  });

  // 将字符串月份转换为 Date 对象
  const selectedDate = React.useMemo(() => {
    if (!value) return undefined;
    const parsed = parse(value + '-01', 'yyyy-MM-dd', new Date());
    return isNaN(parsed.getTime()) ? undefined : parsed;
  }, [value]);

  const years = React.useMemo(() => generateYears(), []);

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      const formatted = format(date, 'yyyy-MM');
      onChange?.(formatted);
      setOpen(false);
    } else {
      onChange?.('');
    }
  };

  const handleYearChange = (yearStr: string) => {
    const year = parseInt(yearStr);
    const newDate = setYear(viewDate, year);
    setViewDate(newDate);
  };

  const handleMonthChange = (monthStr: string) => {
    const month = parseInt(monthStr);
    let newDate = setMonth(viewDate, month);
    newDate = startOfMonth(newDate);
    setViewDate(newDate);
    // 直接选择月份后关闭
    handleSelect(newDate);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value && selectedDate ? format(selectedDate, 'yyyy年MM月', { locale: zhCN }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 border-b">
          <div className="flex items-center gap-2">
            <Select value={String(viewDate.getFullYear())} onValueChange={handleYearChange}>
              <SelectTrigger className="h-8 w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {years.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}年
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="p-3">
          <div className="grid grid-cols-4 gap-2">
            {months.map((month) => (
              <Button
                key={month.value}
                variant={
                  selectedDate && 
                  selectedDate.getFullYear() === viewDate.getFullYear() && 
                  selectedDate.getMonth() === month.value
                    ? 'default'
                    : 'outline'
                }
                size="sm"
                className="h-9"
                onClick={() => handleMonthChange(String(month.value))}
              >
                {month.label}
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
