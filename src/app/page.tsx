'use client';

import React, { useState, useEffect } from 'react';
import { usePortalData } from '@/hooks/usePortalData';
import { HomeHeader } from '@/components/portal/home/HomeHeader';
import { HeroCarousel } from '@/components/portal/home/HeroCarousel';
import { NewsSection } from '@/components/portal/home/NewsSection';
import { PhilosophySection } from '@/components/portal/home/PhilosophySection';
import { QuickLinksSection } from '@/components/portal/home/QuickLinksSection';
import { SiteFooter } from '@/components/portal/home/SiteFooter';
import { VideoPlayerModal } from '@/components/portal/home/VideoPlayerModal';
import type { CarouselItem } from '@/components/portal/home/types';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<CarouselItem | null>(null);

  const portalData = usePortalData();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #FEFCF9 0%, #FDF9F3 50%, #FBF5EE 100%)' }}>
      <HomeHeader scrolled={scrolled} />

      <div style={{ fontSize: '18px' }}>
        <HeroCarousel
          items={portalData.carouselItems}
          onPlayVideo={setPlayingVideo}
        />

        <NewsSection
          loading={portalData.loading}
          newsItems={portalData.newsItems}
          notices={portalData.notices}
        />

        <PhilosophySection
          loading={portalData.loading}
          childHeartPaths={portalData.childHeartPaths}
          honors={portalData.honors}
          achievementCategories={portalData.achievementCategories}
        />

        <QuickLinksSection />
        <SiteFooter />

        <VideoPlayerModal
          video={playingVideo}
          onClose={() => setPlayingVideo(null)}
        />
      </div>
    </div>
  );
}
