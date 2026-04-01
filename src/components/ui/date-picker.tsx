'use client';

import * as React from 'react';
import { format, parse } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface DatePickerProps {
  value?: string; // 格式: YYYY-MM-DD
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * 日期选择器组件
 * 支持 YYYY-MM-DD 格式的日期选择
 */
export function DatePicker({
  value,
  onChange,
  placeholder = '选择日期',
  disabled = false,
  className,
}: DatePickerProps) {
  // 将字符串日期转换为 Date 对象
  const selectedDate = React.useMemo(() => {
    if (!value) return undefined;
    const parsed = parse(value, 'yyyy-MM-dd', new Date());
    return isNaN(parsed.getTime()) ? undefined : parsed;
  }, [value]);

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      const formatted = format(date, 'yyyy-MM-dd');
      onChange?.(formatted);
    } else {
      onChange?.('');
    }
  };

  return (
    <Popover>
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
          {value ? format(selectedDate!, 'yyyy年MM月dd日', { locale: zhCN }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          initialFocus
          locale={zhCN}
        />
      </PopoverContent>
    </Popover>
  );
}

/**
 * 月份选择器组件
 * 支持 YYYY-MM 格式的月份选择
 */
export function MonthPicker({
  value,
  onChange,
  placeholder = '选择月份',
  disabled = false,
  className,
}: DatePickerProps) {
  const [currentMonth, setCurrentMonth] = React.useState<Date>(() => {
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

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      const formatted = format(date, 'yyyy-MM');
      onChange?.(formatted);
    } else {
      onChange?.('');
    }
  };

  return (
    <Popover>
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
          {value ? format(selectedDate!, 'yyyy年MM月', { locale: zhCN }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          defaultMonth={currentMonth}
          onMonthChange={setCurrentMonth}
          initialFocus
          locale={zhCN}
        />
      </PopoverContent>
    </Popover>
  );
}
