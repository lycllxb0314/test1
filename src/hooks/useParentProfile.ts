/**
 * 家长个人信息 Hook
 * 
 * 用于家长端获取和更新当前登录家长的个人信息
 */

import { useState, useEffect, useCallback } from 'react';

// 家长详细信息类型
export interface ParentProfile {
  id: string;
  name: string;
  relation: string;
  relation_name: string;
  phone: string | null;
  wechat: string | null;
  email: string | null;
  gender: string | null;
  birth_date: string | null;
  id_card: string | null;
  education: string | null;
  political_status: string | null;
  household_address: string | null;
  current_address: string | null;
  emergency_contact: string | null;
  emergency_phone: string | null;
  occupation: string | null;
  work_unit: string | null;
  is_primary: boolean;
  has_account: boolean;
  password: string | null;
  remark: string | null;
  student?: {
    id: string;
    name: string;
    student_no: string;
    class_name: string;
    gender: string;
  };
  otherParents?: Array<{
    id: string;
    name: string;
    relation: string;
    relation_name: string;
    phone: string;
    is_primary: boolean;
  }>;
}

// 可编辑的字段
export interface ParentProfileFormData {
  wechat: string;
  email: string;
  education: string;
  political_status: string;
  household_address: string;
  current_address: string;
  emergency_contact: string;
  emergency_phone: string;
  occupation: string;
  work_unit: string;
  remark: string;
}

// Hook 返回类型
export interface UseParentProfileReturn {
  profile: ParentProfile | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  
  // 获取个人信息
  fetchProfile: () => Promise<void>;
  
  // 更新个人信息
  updateProfile: (data: ParentProfileFormData) => Promise<boolean>;
  
  // 修改密码
  changePassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
}

/**
 * 家长个人信息 Hook
 */
export function useParentProfile(): UseParentProfileReturn {
  const [profile, setProfile] = useState<ParentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取个人信息
  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/parents/me');
      const result = await response.json();

      if (result.success) {
        setProfile(result.data);
      } else {
        setError(result.error || '获取个人信息失败');
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setError('获取个人信息失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 更新个人信息
  const updateProfile = useCallback(async (data: ParentProfileFormData): Promise<boolean> => {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch('/api/parents/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        setProfile(result.data);
        return true;
      } else {
        setError(result.error || '更新失败');
        return false;
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError('更新失败');
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  // 修改密码
  const changePassword = useCallback(async (
    oldPassword: string, 
    newPassword: string
  ): Promise<boolean> => {
    try {
      setError(null);

      const response = await fetch('/api/parents/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldPassword,
          newPassword,
        }),
      });

      const result = await response.json();

      if (result.success) {
        return true;
      } else {
        setError(result.error || '密码修改失败');
        return false;
      }
    } catch (err) {
      console.error('Failed to change password:', err);
      setError('密码修改失败');
      return false;
    }
  }, []);

  // 初始化加载
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    saving,
    error,
    fetchProfile,
    updateProfile,
    changePassword,
  };
}

export default useParentProfile;
