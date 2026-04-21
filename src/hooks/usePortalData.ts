'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type {
  CarouselItem,
  CarouselData,
  ChildHeartPathItem,
  PhilosophyData,
  NewsItem,
  NoticeItem,
  SchoolHonor,
  HonorData,
  PortalAnnouncement,
  AchievementCategoryData,
  AchievementCategoryState,
} from '@/components/portal/home/types';
import {
  defaultCarouselItems,
  defaultChildHeartPaths,
  defaultHonors,
} from '@/components/portal/home/types';

export type PortalData = {
  loading: boolean;
  carouselItems: CarouselItem[];
  childHeartPaths: ChildHeartPathItem[];
  honors: SchoolHonor[];
  newsItems: NewsItem[];
  notices: NoticeItem[];
  achievementCategories: AchievementCategoryState[];
};

/**
 * usePortalData — 门户首页数据获取 Hook
 *
 * - 并行请求所有接口 (Promise.all)
 * - AbortController 取消重复请求
 * - 组件卸载时自动 abort
 * - 返回默认数据作为后备
 */
export function usePortalData(): PortalData {
  const [loading, setLoading] = useState(true);
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>(defaultCarouselItems);
  const [childHeartPaths, setChildHeartPaths] = useState<ChildHeartPathItem[]>(defaultChildHeartPaths);
  const [honors, setHonors] = useState<SchoolHonor[]>(defaultHonors);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [achievementCategories, setAchievementCategories] = useState<AchievementCategoryState[]>([]);

  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    // 取消上一次未完成的请求
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;
    const { signal } = controller;

    try {
      setLoading(true);

      const [announcementsRes, carouselRes, philosophyRes, honorsRes, achievementsRes] = await Promise.all([
        fetch('/api/portal/announcements?limit=10', { signal }),
        fetch('/api/portal/carousel?limit=10', { signal }),
        fetch('/api/portal/philosophy?limit=10', { signal }),
        fetch('/api/portal/honors?limit=10', { signal }),
        fetch('/api/portal/achievements/categories', { signal }),
      ]);

      // ── 公告 + 新闻 ──
      const announcementsResult = await announcementsRes.json();
      if (announcementsResult.success) {
        const newsData: PortalAnnouncement[] = announcementsResult.data.news || [];
        setNewsItems(newsData.map((item: PortalAnnouncement) => ({
          id: item.id,
          title: item.title,
          summary: item.summary || '',
          date: item.publishedAt ? item.publishedAt.split('T')[0] : '',
          category: item.category || '校园新闻',
          level: item.mediaLevel,
          image: item.coverImage || '/images/campus/school-assembly.png',
        })));

        const announcementsData: PortalAnnouncement[] = announcementsResult.data.announcements || [];
        setNotices(announcementsData.map((item: PortalAnnouncement) => ({
          id: item.id,
          title: item.title,
          date: item.publishedAt ? item.publishedAt.split('T')[0] : '',
        })));
      }

      // ── 轮播图 ──
      const carouselResult = await carouselRes.json();
      if (carouselResult.success && carouselResult.data?.length > 0) {
        setCarouselItems(carouselResult.data.map((item: CarouselData) => ({
          id: item.id,
          type: item.type,
          image: item.image,
          videoUrl: item.videoUrl,
          bilibiliUrl: item.bilibiliUrl,
          bilibiliBvid: item.bilibiliBvid,
          title: item.title,
          subtitle: item.subtitle || '',
          tag: item.tag || '',
        })));
      }

      // ── 童心教育 ──
      const philosophyResult = await philosophyRes.json();
      if (philosophyResult.success && philosophyResult.data?.length > 0) {
        setChildHeartPaths(philosophyResult.data.map((item: PhilosophyData) => ({
          id: item.id,
          icon: item.icon,
          title: item.title,
          subtitle: item.subtitle,
          image: item.image,
        })));
      }

      // ── 办学荣誉 ──
      const honorsResult = await honorsRes.json();
      if (honorsResult.success && honorsResult.data?.length > 0) {
        setHonors(honorsResult.data.map((item: HonorData) => ({
          id: item.id,
          title: item.title,
          year: item.year || '',
        })));
      }

      // ── 成果特色办学 ──
      const achievementsResult = await achievementsRes.json();
      if (achievementsResult.success && achievementsResult.data?.length > 0) {
        setAchievementCategories(achievementsResult.data.map((item: AchievementCategoryData) => ({
          id: item.id,
          name: item.name,
          slug: item.slug,
          icon: item.icon,
          tag: item.tag,
          description: item.description,
          featuredAwardTitle: item.featured_award_title,
          featuredAwardContent: item.featured_award_content,
          stats: item.stats || [],
          honorsList: item.honors_list || [],
        })));
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      console.error('Failed to fetch portal data:', error);
    } finally {
      if (abortRef.current === controller) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchData();
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, [fetchData]);

  return { loading, carouselItems, childHeartPaths, honors, newsItems, notices, achievementCategories };
}
