'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Bell,
  Calendar,
  Eye,
  User,
  Tag,
  Clock,
  ChevronRight,
} from 'lucide-react';

// 公告详情类型
interface AnnouncementDetail {
  id: string;
  title: string;
  summary: string;
  content: string;
  type: string;
  category: string;
  mediaLevel?: string;
  authorName?: string;
  department?: string;
  coverImage?: string;
  images?: string[];
  attachments?: Array<{ name: string; url: string }>;
  isPinned?: boolean;
  viewCount?: number;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function NoticeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  
  const [notice, setNotice] = useState<AnnouncementDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    
    const fetchNotice = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/portal/announcements/${id}`);
        const result = await response.json();
        
        if (result.success && result.data) {
          setNotice(result.data);
        } else {
          setError(result.error || '公告不存在');
        }
      } catch (err) {
        console.error('Failed to fetch notice:', err);
        setError('加载公告失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotice();
  }, [id]);

  // 格式化日期
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // 加载状态
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FDF8F3] to-[#F5EDE4]">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* 顶部导航骨架 */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-full bg-[#E8DDD0]/50 animate-pulse" />
            <div className="h-6 w-24 bg-[#E8DDD0]/50 rounded animate-pulse" />
          </div>
          
          {/* 内容骨架 */}
          <div className="bg-white/90 rounded-2xl shadow-lg p-8">
            <div className="h-8 w-3/4 bg-[#E8DDD0]/50 rounded animate-pulse mb-4" />
            <div className="h-4 w-1/2 bg-[#E8DDD0]/30 rounded animate-pulse mb-6" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-4 bg-[#E8DDD0]/30 rounded animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error || !notice) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FDF8F3] to-[#F5EDE4] flex items-center justify-center">
        <div className="text-center px-4">
          <div className="w-20 h-20 bg-[#E8DDD0]/50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Bell className="w-10 h-10 text-[#8B5A2B]/50" />
          </div>
          <h2 className="text-xl font-bold text-[#3D2314] mb-2">
            {error || '公告不存在'}
          </h2>
          <p className="text-[#8B5A2B]/60 mb-6">
            该公告可能已被删除或暂未发布
          </p>
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#8B5A2B] text-white rounded-xl hover:bg-[#6B4423] transition"
          >
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FDF8F3] to-[#F5EDE4]">
      {/* 顶部导航栏 */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-[#E8DDD0]/50">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-[#8B5A2B] hover:text-[#3D2314] transition"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">返回</span>
              </button>
              <div className="flex items-center gap-2 text-sm">
                <Link href="/" className="text-[#8B5A2B]/70 hover:text-[#8B5A2B] transition">
                  首页
                </Link>
                <ChevronRight className="w-4 h-4 text-[#8B5A2B]/40" />
                <Link href="/#announcements" className="text-[#8B5A2B]/70 hover:text-[#8B5A2B] transition">
                  通知公告
                </Link>
                <ChevronRight className="w-4 h-4 text-[#8B5A2B]/40" />
                <span className="text-[#3D2314] font-medium truncate max-w-[200px]">
                  {notice.title}
                </span>
              </div>
            </div>
            
            <Link 
              href="/" 
              className="text-xl font-bold text-[#8B5A2B] hidden sm:block"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              龙岩师范附属小学
            </Link>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 文章卡片 */}
        <article className="bg-white/90 rounded-2xl shadow-lg shadow-[#D4A574]/10 border border-[#E8DDD0]/40 overflow-hidden">
          {/* 封面图 */}
          {notice.coverImage && (
            <div className="relative w-full aspect-video bg-[#F5EDE4]">
              <img
                src={notice.coverImage}
                alt={notice.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </div>
          )}
          
          {/* 文章头部 */}
          <div className="p-6 border-b border-[#E8DDD0]/40">
            {/* 类型标签 */}
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#8B5A2B] text-white rounded-full text-sm font-medium">
                <Bell className="w-4 h-4" />
                {notice.category || '通知公告'}
              </span>
              {notice.isPinned && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#D4A574]/20 text-[#8B5A2B] rounded text-xs">
                  置顶
                </span>
              )}
            </div>
            
            {/* 标题 */}
            <h1 
              className="text-2xl md:text-3xl font-bold text-[#3D2314] mb-4 leading-tight"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              {notice.title}
            </h1>
            
            {/* 摘要 */}
            {notice.summary && (
              <p className="text-[#8B5A2B]/70 text-base leading-relaxed mb-4 border-l-4 border-[#D4A574] pl-4 bg-[#FDF8F3]/50 py-3 rounded-r-lg">
                {notice.summary}
              </p>
            )}
            
            {/* 元信息 */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-[#8B5A2B]/60">
              {notice.authorName && (
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  <span>{notice.authorName}</span>
                </div>
              )}
              {notice.publishedAt && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(notice.publishedAt)}</span>
                </div>
              )}
              {notice.viewCount !== undefined && (
                <div className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4" />
                  <span>{notice.viewCount} 次浏览</span>
                </div>
              )}
              {notice.department && (
                <div className="flex items-center gap-1.5">
                  <Tag className="w-4 h-4" />
                  <span>{notice.department}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* 文章正文 */}
          <div className="p-6">
            <div 
              className="prose prose-[#3D2314] max-w-none
                prose-headings:text-[#3D2314] prose-headings:font-bold
                prose-p:text-[#3D2314]/90 prose-p:leading-relaxed
                prose-a:text-[#8B5A2B] prose-a:no-underline hover:prose-a:underline
                prose-img:rounded-xl prose-img:shadow-lg
              "
              dangerouslySetInnerHTML={{ __html: notice.content || '' }}
            />
            
            {/* 图片画廊 */}
            {notice.images && notice.images.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-bold text-[#3D2314] mb-4">相关图片</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {notice.images.map((img, index) => (
                    <div 
                      key={index}
                      className="relative aspect-square rounded-xl overflow-hidden bg-[#F5EDE4] cursor-pointer hover:shadow-lg transition-shadow"
                    >
                      <img
                        src={img}
                        alt={`${notice.title} - 图片 ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* 附件下载 */}
            {notice.attachments && notice.attachments.length > 0 && (
              <div className="mt-8 p-4 bg-[#FDF8F3] rounded-xl border border-[#E8DDD0]/50">
                <h3 className="text-lg font-bold text-[#3D2314] mb-4">附件下载</h3>
                <div className="space-y-2">
                  {notice.attachments.map((file, index) => (
                    <a
                      key={index}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-white rounded-lg border border-[#E8DDD0]/50 hover:border-[#D4A574] hover:bg-[#D4A574]/5 transition group"
                    >
                      <div className="w-10 h-10 bg-[#8B5A2B]/10 rounded-lg flex items-center justify-center group-hover:bg-[#8B5A2B]/20 transition">
                        <span className="text-[#8B5A2B] font-bold text-sm">
                          {file.name.split('.').pop()?.toUpperCase() || 'FILE'}
                        </span>
                      </div>
                      <span className="text-[#3D2314] group-hover:text-[#8B5A2B] transition">
                        {file.name}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* 文章底部 */}
          <div className="px-6 pb-6">
            <div className="flex items-center justify-between pt-6 border-t border-[#E8DDD0]/40">
              <div className="text-sm text-[#8B5A2B]/50">
                {notice.updatedAt && notice.updatedAt !== notice.createdAt && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>更新于 {formatDate(notice.updatedAt)}</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => router.push('/#announcements')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#F5EDE4] text-[#8B5A2B] rounded-lg hover:bg-[#E8DDD0] transition"
              >
                <ArrowLeft className="w-4 h-4" />
                返回列表
              </button>
            </div>
          </div>
        </article>
      </div>
      
      {/* 底部版权信息 */}
      <footer className="py-8 border-t border-[#E8DDD0]/30 bg-[#F5EDE4]/50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm text-[#8B5A2B]/60">
            © 福建省龙岩师范附属小学 版权所有
          </p>
        </div>
      </footer>
    </div>
  );
}
