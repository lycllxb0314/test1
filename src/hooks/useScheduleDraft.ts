'use client';

/**
 * 排课草稿管理 Hook
 * 
 * 提供草稿的保存、载入、发布等功能
 */

import { useState, useCallback } from 'react';

// 类型定义
export interface ScheduleDraft {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'published' | 'archived';
  semester: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  published_by: string | null;
  slots?: ScheduleSlot[];
}

export interface ScheduleSlot {
  id: string;
  class_id: string;
  class_name: string;
  grade: number;
  week_day: number;
  period_index: number;
  period_name: string;
  subject: string;
  teacher_id: string;
  teacher_name: string;
  draft_id: string;
}

export interface ClassSchedule {
  classId: string;
  className: string;
  grade: number;
  slots: {
    timeSlotId: string;
    timeSlot: {
      weekday: string;
      period: string;
      periodIndex: number;
    };
    subject: string;
    teacherId: string;
    teacherName: string;
  }[][];
}

export function useScheduleDraft() {
  const [drafts, setDrafts] = useState<ScheduleDraft[]>([]);
  const [currentDraft, setCurrentDraft] = useState<ScheduleDraft | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取草稿列表
  const fetchDrafts = useCallback(async (status?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      
      const response = await fetch(`/api/academic/schedule-drafts?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setDrafts(result.data);
      } else {
        setError(result.error || '获取草稿列表失败');
      }
    } catch (err) {
      setError('获取草稿列表失败');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 保存草稿
  const saveDraft = useCallback(async (
    name: string,
    slots: ScheduleSlot[],
    description?: string,
    semester?: string
  ): Promise<ScheduleDraft | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/academic/schedule-drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slots, description, semester }),
      });
      const result = await response.json();
      
      if (result.success) {
        const newDraft = result.data;
        setDrafts(prev => [newDraft, ...prev]);
        setCurrentDraft(newDraft);
        return newDraft;
      } else {
        setError(result.error || '保存草稿失败');
        return null;
      }
    } catch (err) {
      setError('保存草稿失败');
      console.error(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 载入草稿
  const loadDraft = useCallback(async (draftId: string): Promise<ScheduleDraft | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/academic/schedule-drafts/${draftId}`);
      const result = await response.json();
      
      if (result.success) {
        setCurrentDraft(result.data);
        return result.data;
      } else {
        setError(result.error || '载入草稿失败');
        return null;
      }
    } catch (err) {
      setError('载入草稿失败');
      console.error(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 更新单个课表格子
  const updateSlot = useCallback(async (
    draftId: string,
    slotId: string,
    subject: string,
    teacherId: string,
    teacherName: string
  ): Promise<boolean> => {
    setError(null);
    try {
      const response = await fetch(
        `/api/academic/schedule-drafts/${draftId}/slots/${slotId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subject, teacherId, teacherName }),
        }
      );
      const result = await response.json();
      
      if (result.success) {
        // 更新当前草稿中的课表数据
        if (currentDraft && currentDraft.id === draftId) {
          setCurrentDraft(prev => {
            if (!prev || !prev.slots) return prev;
            return {
              ...prev,
              slots: prev.slots.map(slot =>
                slot.id === slotId
                  ? { ...slot, subject, teacher_id: teacherId, teacher_name: teacherName }
                  : slot
              ),
            };
          });
        }
        return true;
      } else {
        setError(result.error || '更新失败');
        return false;
      }
    } catch (err) {
      setError('更新失败');
      console.error(err);
      return false;
    }
  }, [currentDraft]);

  // 发布草稿
  const publishDraft = useCallback(async (draftId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/academic/schedule-drafts/${draftId}/publish`,
        { method: 'POST' }
      );
      const result = await response.json();
      
      if (result.success) {
        // 更新草稿状态
        setDrafts(prev =>
          prev.map(d =>
            d.id === draftId
              ? { ...d, status: 'published' as const }
              : d
          )
        );
        if (currentDraft?.id === draftId) {
          setCurrentDraft(prev =>
            prev ? { ...prev, status: 'published' as const } : null
          );
        }
        return true;
      } else {
        setError(result.error || '发布失败');
        return false;
      }
    } catch (err) {
      setError('发布失败');
      console.error(err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentDraft]);

  // 删除草稿
  const deleteDraft = useCallback(async (draftId: string): Promise<boolean> => {
    setError(null);
    try {
      const response = await fetch(
        `/api/academic/schedule-drafts/${draftId}`,
        { method: 'DELETE' }
      );
      const result = await response.json();
      
      if (result.success) {
        setDrafts(prev => prev.filter(d => d.id !== draftId));
        if (currentDraft?.id === draftId) {
          setCurrentDraft(null);
        }
        return true;
      } else {
        setError(result.error || '删除失败');
        return false;
      }
    } catch (err) {
      setError('删除失败');
      console.error(err);
      return false;
    }
  }, [currentDraft]);

  // 创建新课表格子（为空槽添加课程）
  const createSlot = useCallback(async (
    draftId: string,
    slotData: {
      classId: string;
      className: string;
      grade: number;
      weekDay: number;
      periodIndex: number;
      periodName: string;
      subject: string;
      teacherId: string;
      teacherName: string;
    }
  ): Promise<boolean> => {
    setError(null);
    try {
      const response = await fetch(
        `/api/academic/schedule-drafts/${draftId}/slots`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(slotData),
        }
      );
      const result = await response.json();
      
      if (result.success) {
        // 更新当前草稿中的课表数据
        if (currentDraft && currentDraft.id === draftId) {
          setCurrentDraft(prev => {
            if (!prev) return prev;
            const newSlot: ScheduleSlot = {
              id: result.data.id,
              class_id: slotData.classId,
              class_name: slotData.className,
              grade: slotData.grade,
              week_day: slotData.weekDay,
              period_index: slotData.periodIndex,
              period_name: slotData.periodName,
              subject: slotData.subject,
              teacher_id: slotData.teacherId,
              teacher_name: slotData.teacherName,
              draft_id: draftId,
            };
            return {
              ...prev,
              slots: [...(prev.slots || []), newSlot],
            };
          });
        }
        return true;
      } else {
        setError(result.error || '创建失败');
        return false;
      }
    } catch (err) {
      setError('创建失败');
      console.error(err);
      return false;
    }
  }, [currentDraft]);

  return {
    drafts,
    currentDraft,
    isLoading,
    error,
    fetchDrafts,
    saveDraft,
    loadDraft,
    updateSlot,
    createSlot,
    publishDraft,
    deleteDraft,
    clearError: () => setError(null),
  };
}
