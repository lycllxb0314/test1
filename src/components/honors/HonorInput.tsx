'use client';

/**
 * 荣誉输入组件
 * 
 * 用于家长申报时填写学生已获奖荣誉
 * 支持逐条添加、编辑、删除
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import type { StudentHonor, HonorLevel, HonorCategory } from '@/types/honor-campaign';
import { HONOR_LEVEL_OPTIONS, HONOR_CATEGORY_OPTIONS, getCurrentSchoolYear } from '@/types/honor-campaign';

type HonorInputProps = {
  value: StudentHonor[];
  onChange: (honors: StudentHonor[]) => void;
  schoolYear?: string;
  readonly?: boolean;
};

export function HonorInput({ value, onChange, schoolYear, readonly = false }: HonorInputProps) {
  const addHonor = () => {
    const newHonor: StudentHonor = {
      title: '',
      level: '校级',
      category: '综合荣誉',
      issuer: '',
      date: '',
      schoolYear: schoolYear || getCurrentSchoolYear(),
    };
    onChange([...value, newHonor]);
  };

  const updateHonor = (index: number, field: keyof StudentHonor, fieldValue: string) => {
    const updated = [...value];
    updated[index] = { ...updated[index], [field]: fieldValue };
    onChange(updated);
  };

  const removeHonor = (index: number) => {
    const updated = value.filter((_, i) => i !== index);
    onChange(updated);
  };

  const moveHonor = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= value.length) return;
    
    const updated = [...value];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    onChange(updated);
  };

  if (readonly) {
    return (
      <div className="space-y-2">
        {value.length === 0 ? (
          <p className="text-sm text-gray-400">暂无荣誉记录</p>
        ) : (
          value.map((honor, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <span className="font-medium">{honor.title}</span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-500">{honor.level}</span>
              {honor.issuer && (
                <>
                  <span className="text-gray-400">|</span>
                  <span className="text-gray-500">{honor.issuer}</span>
                </>
              )}
              {honor.date && (
                <>
                  <span className="text-gray-400">|</span>
                  <span className="text-gray-500">{honor.date}</span>
                </>
              )}
            </div>
          ))
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-base">已获奖荣誉</Label>
        <Button type="button" variant="outline" size="sm" onClick={addHonor}>
          <Plus className="h-4 w-4 mr-1" />
          添加荣誉
        </Button>
      </div>

      {value.length === 0 ? (
        <p className="text-sm text-gray-400 py-4 text-center border border-dashed rounded-lg">
          暂无荣誉记录，点击上方按钮添加
        </p>
      ) : (
        <div className="space-y-3">
          {value.map((honor, index) => (
            <Card key={index} className="border shadow-sm">
              <CardContent className="p-3">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm font-medium text-gray-500">荣誉 #{index + 1}</span>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => moveHonor(index, 'up')}
                      disabled={index === 0}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => moveHonor(index, 'down')}
                      disabled={index === value.length - 1}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                      onClick={() => removeHonor(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label className="text-xs text-gray-500">荣誉名称 *</Label>
                    <Input
                      value={honor.title}
                      onChange={(e) => updateHonor(index, 'title', e.target.value)}
                      placeholder="如：优秀学生、数学竞赛一等奖"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-gray-500">荣誉级别</Label>
                    <Select
                      value={honor.level}
                      onValueChange={(v) => updateHonor(index, 'level', v)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HONOR_LEVEL_OPTIONS.map((level) => (
                          <SelectItem key={level} value={level}>{level}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs text-gray-500">荣誉类别</Label>
                    <Select
                      value={honor.category}
                      onValueChange={(v) => updateHonor(index, 'category', v)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HONOR_CATEGORY_OPTIONS.map((category) => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs text-gray-500">颁发单位</Label>
                    <Input
                      value={honor.issuer || ''}
                      onChange={(e) => updateHonor(index, 'issuer', e.target.value)}
                      placeholder="如：市教育局"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-gray-500">获奖日期</Label>
                    <Input
                      type="date"
                      value={honor.date || ''}
                      onChange={(e) => updateHonor(index, 'date', e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label className="text-xs text-gray-500">证书编号（选填）</Label>
                    <Input
                      value={honor.certificateNo || ''}
                      onChange={(e) => updateHonor(index, 'certificateNo', e.target.value)}
                      placeholder="如有证书编号可填写"
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default HonorInput;
