'use client';

import React from 'react';
import { MapPin, Phone, GraduationCap } from 'lucide-react';

/**
 * SiteFooter — 联系方式 + 页脚
 */
export function SiteFooter() {
  return (
    <>
      {/* 联系方式 */}
      <section className="py-10 bg-[#B89B6E] text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-6">
            <div className="bg-white rounded-lg p-2 inline-block">
              <img src="/logo-school.png" alt="福建省龙岩师范附属小学" className="h-12 w-auto" />
            </div>
          </div>
          <div className="border-t border-white/30 mb-6" />
          <div className="text-center space-y-3 text-sm text-white/85">
            <div className="flex items-center justify-center gap-3">
              <MapPin className="h-4 w-4 text-white/60" />
              <span>福建省龙岩市新罗区龙川东路11号</span>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Phone className="h-4 w-4 text-white/60" />
              <span>0597-2135008</span>
            </div>
            <p className="text-white/70 pt-2">珍视童心，张扬个性，全面发展 · 当有情怀的老师，办有温度的学校</p>
            <div className="pt-2">
              <div className="w-24 h-24 bg-white rounded-lg p-1 shadow-lg inline-block">
                <img src="/qrcode.png" alt="公众号二维码" className="w-full h-full object-contain" />
              </div>
              <p className="text-xs text-white/60 mt-1">关注我们</p>
            </div>
          </div>
        </div>
      </section>

      {/* 页脚 */}
      <footer className="py-6 bg-[#8C7A66] text-white/80 text-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-white" />
              <span>&copy; 2026 福建省龙岩师范附属小学 版权所有</span>
            </div>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors duration-300">隐私政策</a>
              <a href="#" className="hover:text-white transition-colors duration-300">使用条款</a>
              <a href="#" className="hover:text-white transition-colors duration-300">技术支持</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
