import {
  Users, Shield, AlertTriangle, MessageCircle,
  Sparkles, Calendar, AlertCircle,
} from 'lucide-react';
import { SOPCategory } from '@/types/class-sop';

export const categoryConfig: Record<SOPCategory, { icon: React.ElementType; color: string; bg: string; gradient: string }> = {
  conflict: {
    icon: Users, color: 'text-rose-600', bg: 'bg-rose-50', gradient: 'from-rose-500 to-pink-500',
  },
  safety: {
    icon: Shield, color: 'text-orange-600', bg: 'bg-orange-50', gradient: 'from-orange-500 to-amber-500',
  },
  discipline: {
    icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', gradient: 'from-red-500 to-rose-500',
  },
  communication: {
    icon: MessageCircle, color: 'text-blue-600', bg: 'bg-blue-50', gradient: 'from-blue-500 to-indigo-500',
  },
  hygiene: {
    icon: Sparkles, color: 'text-emerald-600', bg: 'bg-emerald-50', gradient: 'from-emerald-500 to-teal-500',
  },
  attendance: {
    icon: Calendar, color: 'text-violet-600', bg: 'bg-violet-50', gradient: 'from-violet-500 to-purple-500',
  },
  activity: {
    icon: Calendar, color: 'text-cyan-600', bg: 'bg-cyan-50', gradient: 'from-cyan-500 to-sky-500',
  },
  emergency: {
    icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', gradient: 'from-red-600 to-rose-600',
  },
};

export type AttachmentData = {
  key: string;
  url: string;
  name: string;
  size: number;
  type: string;
  evidenceType: 'photo' | 'video' | 'audio' | 'document';
};
