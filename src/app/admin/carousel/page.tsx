'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Upload,
  Play,
  Trash2,
  Video,
  Image as ImageIcon,
  Plus,
  X,
  Save,
  ChevronLeft,
} from 'lucide-react';
import { FILE_TYPE_CONFIGS } from '@/lib/file-upload-config';
import Link from 'next/link';

interface CarouselItem {
  type: 'image' | 'video';
  image: string;
  videoUrl?: string;
  title: string;
  subtitle: string;
  tag: string;
}

interface UploadedVideo {
  key: string;
  url: string;
  fileName: string;
  title?: string;
}

export default function CarouselManagePage() {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedVideos, setUploadedVideos] = useState<UploadedVideo[]>([]);
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([
    { type: 'image', image: '/images/campus/science-academy-opening.png', title: '少年科学院成立', subtitle: '中科院谢华安院士亲自指导', tag: '科创特色' },
    { type: 'image', image: '/images/campus/art-festival.png', title: '校园艺术节', subtitle: '全国艺术教育先进单位', tag: '艺术教育' },
    { type: 'image', image: '/images/campus/sports-start.jpg', title: '阳光体育运动', subtitle: '体质健康合格率全市第一梯队', tag: '阳光体育' },
    { type: 'image', image: '/images/campus/young-pioneers.png', title: '少先队活动', subtitle: '有效德育引领童心成长', tag: '德育实践' },
    { type: 'image', image: '/images/campus/classroom-teaching.jpg', title: '高效课堂', subtitle: '高效课堂发展童心智慧', tag: '教学特色' },
  ]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<CarouselItem>({
    type: 'image',
    image: '',
    title: '',
    subtitle: '',
    tag: '',
  });

  // 上传视频
  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name.replace(/\.[^/.]+$/, ''));

      const response = await fetch('/api/upload-video', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setUploadedVideos((prev) => [
          { key: data.key, url: data.url, fileName: data.fileName, title: data.title },
          ...prev,
        ]);
        alert('视频上传成功！');
      } else {
        alert(data.error || '上传失败');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('上传失败，请稍后重试');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, []);

  // 加载已上传的视频
  const loadVideos = useCallback(async () => {
    try {
      const response = await fetch('/api/upload-video?prefix=videos/');
      const data = await response.json();
      if (data.files) {
        setUploadedVideos(data.files);
      }
    } catch (error) {
      console.error('Load videos error:', error);
    }
  }, []);

  // 删除视频
  const handleDeleteVideo = useCallback(async (key: string) => {
    if (!confirm('确定要删除这个视频吗？')) return;

    try {
      const response = await fetch(`/api/upload-video?key=${encodeURIComponent(key)}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        setUploadedVideos((prev) => prev.filter((v) => v.key !== key));
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  }, []);

  // 添加到轮播图
  const addToCarousel = useCallback((video: UploadedVideo) => {
    const newItem: CarouselItem = {
      type: 'video',
      image: video.url, // 使用视频URL作为封面
      videoUrl: video.url,
      title: video.title || video.fileName.replace(/\.[^/.]+$/, ''),
      subtitle: '点击播放视频',
      tag: '视频',
    };
    setCarouselItems((prev) => [...prev, newItem]);
  }, []);

  // 编辑轮播项
  const startEdit = useCallback((index: number) => {
    setEditingIndex(index);
    setEditForm(carouselItems[index]);
  }, [carouselItems]);

  const saveEdit = useCallback(() => {
    if (editingIndex === null) return;
    setCarouselItems((prev) => {
      const newItems = [...prev];
      newItems[editingIndex] = editForm;
      return newItems;
    });
    setEditingIndex(null);
  }, [editingIndex, editForm]);

  const deleteCarouselItem = useCallback((index: number) => {
    if (!confirm('确定要删除这个轮播项吗？')) return;
    setCarouselItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // 生成配置代码
  const generateConfigCode = useCallback(() => {
    const code = `// 轮播图数据
const carouselItems: CarouselItem[] = ${JSON.stringify(carouselItems, null, 2)};`;
    return code;
  }, [carouselItems]);

  React.useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  return (
    <div className="min-h-screen bg-[#FDF8F3]">
      {/* 顶部导航 */}
      <header className="bg-[#8B5A2B] text-white py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-white/80 hover:text-white">
              <ChevronLeft className="h-5 w-5" />
              返回首页
            </Link>
            <span className="text-white/30">|</span>
            <h1 className="text-lg font-bold">轮播图管理</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* 左侧：视频上传 */}
          <div className="space-y-6">
            {/* 上传区域 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8DDD0]/50">
              <h2 className="text-lg font-bold text-[#3D2314] mb-4 flex items-center gap-2">
                <Upload className="h-5 w-5 text-[#8B5A2B]" />
                上传视频
              </h2>
              
              <div className="border-2 border-dashed border-[#E8DDD0] rounded-xl p-8 text-center">
                <input
                  type="file"
                  accept={FILE_TYPE_CONFIGS.video.accept}
                  onChange={handleUpload}
                  className="hidden"
                  id="video-upload"
                  disabled={uploading}
                />
                <label
                  htmlFor="video-upload"
                  className={`cursor-pointer ${uploading ? 'opacity-50' : ''}`}
                >
                  <Video className="h-12 w-12 text-[#D4A574] mx-auto mb-3" />
                  <p className="text-[#8B5A2B] mb-2">
                    {uploading ? `上传中... ${uploadProgress}%` : '点击或拖拽上传视频'}
                  </p>
                  <p className="text-sm text-[#8B5A2B]/60">支持 MP4、MOV、AVI、WebM，最大 500MB</p>
                </label>
              </div>
            </div>

            {/* 已上传视频列表 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8DDD0]/50">
              <h2 className="text-lg font-bold text-[#3D2314] mb-4 flex items-center gap-2">
                <Video className="h-5 w-5 text-[#8B5A2B]" />
                已上传视频
              </h2>
              
              {uploadedVideos.length === 0 ? (
                <p className="text-center text-[#8B5A2B]/60 py-8">暂无上传的视频</p>
              ) : (
                <div className="space-y-3">
                  {uploadedVideos.map((video, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-[#FDF8F3] rounded-xl"
                    >
                      <div className="w-12 h-12 bg-[#E8DDD0] rounded-lg flex items-center justify-center">
                        <Video className="h-6 w-6 text-[#8B5A2B]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[#3D2314] truncate">{video.fileName}</p>
                        <p className="text-xs text-[#8B5A2B]/60 truncate">{video.key}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addToCarousel(video)}
                          className="border-[#D4A574] text-[#8B5A2B] hover:bg-[#D4A574]/10"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteVideo(video.key)}
                          className="border-red-300 text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 右侧：轮播图配置 */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8DDD0]/50">
              <h2 className="text-lg font-bold text-[#3D2314] mb-4 flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-[#8B5A2B]" />
                轮播图配置
              </h2>
              
              <div className="space-y-3">
                {carouselItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-[#FDF8F3] rounded-xl"
                  >
                    <div className="w-16 h-10 bg-[#E8DDD0] rounded overflow-hidden flex-shrink-0">
                      {item.type === 'video' ? (
                        <div className="w-full h-full flex items-center justify-center bg-[#3D2314]">
                          <Play className="h-4 w-4 text-white" />
                        </div>
                      ) : (
                        <img src={item.image} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-[#D4A574] text-[#3D2314] px-2 py-0.5 rounded">
                          {item.tag}
                        </span>
                        <span className="text-xs text-[#8B5A2B]/60">
                          {item.type === 'video' ? '视频' : '图片'}
                        </span>
                      </div>
                      <p className="font-medium text-[#3D2314] truncate">{item.title}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(index)}
                        className="border-[#D4A574] text-[#8B5A2B]"
                      >
                        编辑
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteCarouselItem(index)}
                        className="border-red-300 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 配置代码 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8DDD0]/50">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[#3D2314] flex items-center gap-2">
                  <Save className="h-5 w-5 text-[#8B5A2B]" />
                  配置代码
                </h2>
                <Button
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(generateConfigCode());
                    alert('已复制到剪贴板');
                  }}
                  className="bg-[#8B5A2B] hover:bg-[#6B4423] text-white"
                >
                  复制代码
                </Button>
              </div>
              <pre className="bg-[#3D2314] text-[#D4A574] p-4 rounded-xl text-xs overflow-x-auto whitespace-pre-wrap">
                {generateConfigCode()}
              </pre>
              <p className="text-xs text-[#8B5A2B]/60 mt-3">
                将以上代码复制到 src/app/page.tsx 中替换原有的 carouselItems 配置
              </p>
            </div>
          </div>
        </div>

        {/* 编辑弹窗 */}
        {editingIndex !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-bold text-[#3D2314] mb-4">编辑轮播项</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-[#8B5A2B] mb-1 block">类型</label>
                  <select
                    value={editForm.type}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, type: e.target.value as 'image' | 'video' }))}
                    className="w-full border border-[#E8DDD0] rounded-lg p-2"
                  >
                    <option value="image">图片</option>
                    <option value="video">视频</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm text-[#8B5A2B] mb-1 block">封面图片URL</label>
                  <input
                    type="text"
                    value={editForm.image}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, image: e.target.value }))}
                    className="w-full border border-[#E8DDD0] rounded-lg p-2"
                    placeholder="/images/campus/xxx.jpg"
                  />
                </div>
                
                {editForm.type === 'video' && (
                  <div>
                    <label className="text-sm text-[#8B5A2B] mb-1 block">视频URL</label>
                    <input
                      type="text"
                      value={editForm.videoUrl || ''}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, videoUrl: e.target.value }))}
                      className="w-full border border-[#E8DDD0] rounded-lg p-2"
                      placeholder="https://..."
                    />
                  </div>
                )}
                
                <div>
                  <label className="text-sm text-[#8B5A2B] mb-1 block">标题</label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                    className="w-full border border-[#E8DDD0] rounded-lg p-2"
                  />
                </div>
                
                <div>
                  <label className="text-sm text-[#8B5A2B] mb-1 block">副标题</label>
                  <input
                    type="text"
                    value={editForm.subtitle}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, subtitle: e.target.value }))}
                    className="w-full border border-[#E8DDD0] rounded-lg p-2"
                  />
                </div>
                
                <div>
                  <label className="text-sm text-[#8B5A2B] mb-1 block">标签</label>
                  <input
                    type="text"
                    value={editForm.tag}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, tag: e.target.value }))}
                    className="w-full border border-[#E8DDD0] rounded-lg p-2"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={() => setEditingIndex(null)}
                  variant="outline"
                  className="flex-1"
                >
                  取消
                </Button>
                <Button
                  onClick={saveEdit}
                  className="flex-1 bg-[#8B5A2B] hover:bg-[#6B4423] text-white"
                >
                  保存
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
