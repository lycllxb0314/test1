/**
 * 家长端 - 心理陪伴页面
 * 
 * 家长可以让孩子与童童进行心理陪伴对话
 */

import { Metadata } from 'next';
import { PsychologyPageContent } from './PsychologyPageContent';

export const metadata: Metadata = {
  title: '心理陪伴 - 童童哥哥',
  description: '与童童哥哥聊天，分享你的心情和想法',
};

export default function PsychologyPage() {
  return <PsychologyPageContent />;
}
