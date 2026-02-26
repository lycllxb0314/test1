'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Image as ImageIcon,
  Upload,
  FolderOpen,
  Trash2,
  Check,
  Loader2,
  ZoomIn,
  Copy,
  Link,
  Settings,
  ChevronRight,
} from 'lucide-react';

interface ImageFile {
  key: string;
  url: string;
  fileName: string;
}

// 图片分类 - 与主页区块对应（移除了校训内涵和智慧校园）
const categories = [
  { value: 'hero', label: '顶部横幅', desc: '轮播图、学校介绍背景图' },
  { value: 'five_education', label: '五育并举', desc: '德智体美劳活动展示图片' },
  { value: 'teacher_dev', label: '教师发展', desc: '教师培训、教研活动图片' },
  { value: 'activities', label: '校园活动', desc: '校园活动、节日庆典图片' },
  { value: 'honors', label: '荣誉展示', desc: '荣誉证书、奖牌图片' },
  { value: 'news', label: '新闻动态', desc: '新闻配图' },
  { value: 'general', label: '其他', desc: '其他图片资源' },
];

// 主页区块配置 - 用于图片设置
const homepageSections = [
  { id: 'hero', name: '顶部横幅', type: 'multi', maxImages: 5, desc: '首页轮播图' },
  { id: 'five_education_deyu', name: '德育展示', type: 'multi', maxImages: 4, desc: '德育活动图片' },
  { id: 'five_education_zhiyu', name: '智育展示', type: 'multi', maxImages: 4, desc: '智育活动图片' },
  { id: 'five_education_tiyu', name: '体育展示', type: 'multi', maxImages: 4, desc: '体育活动图片' },
  { id: 'five_education_meiyu', name: '美育展示', type: 'multi', maxImages: 4, desc: '美育活动图片' },
  { id: 'five_education_laoyu', name: '劳育展示', type: 'multi', maxImages: 4, desc: '劳育活动图片' },
  { id: 'teacher_dev', name: '教师发展', type: 'multi', maxImages: 6, desc: '教师培训教研图片' },
  { id: 'activities', name: '校园活动', type: 'multi', maxImages: 4, desc: '校园活动图片' },
  { id: 'honors', name: '荣誉展示', type: 'multi', maxImages: 8, desc: '荣誉证书图片' },
];

export default function ImagesManagementPage() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [previewImage, setPreviewImage] = useState<ImageFile | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<ImageFile | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  
  // 设置图片到主页区块
  const [settingsDialog, setSettingsDialog] = useState<ImageFile | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [imageTitle, setImageTitle] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchImages = useCallback(async () => {
    setLoading(true);
    try {
      const prefix = selectedCategory === 'all' ? 'homepage/' : `homepage/${selectedCategory}/`;
      const res = await fetch(`/api/upload?prefix=${prefix}`);
      const data = await res.json();
      setImages(data.files || []);
    } catch (error) {
      console.error('Failed to fetch images:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadSuccess(null);

    try {
      const category = selectedCategory === 'all' ? 'general' : selectedCategory;
      
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', category);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || '上传失败');
        }
      }

      setUploadSuccess(`成功上传 ${files.length} 张图片`);
      fetchImages();
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      alert(error.message || '上传失败');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;

    try {
      const res = await fetch(`/api/upload?key=${encodeURIComponent(deleteDialog.key)}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setImages(images.filter(img => img.key !== deleteDialog.key));
      }
    } catch (error) {
      console.error('Failed to delete:', error);
    } finally {
      setDeleteDialog(null);
    }
  };

  const copyImageUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setUploadSuccess('图片链接已复制');
    setTimeout(() => setUploadSuccess(null), 2000);
  };

  const getCategoryName = (key: string) => {
    const parts = key.split('/');
    if (parts.length >= 2) {
      const cat = categories.find(c => c.value === parts[1]);
      return cat?.label || parts[1];
    }
    return '其他';
  };

  // 设置图片到主页区块
  const openSettingsDialog = (image: ImageFile) => {
    setSettingsDialog(image);
    setSelectedSection('');
    setImageTitle('');
  };

  const handleSetToSection = async () => {
    if (!settingsDialog || !selectedSection) {
      alert('请选择要设置的主页区块');
      return;
    }

    try {
      // 获取当前区块的图片配置
      const res = await fetch(`/api/homepage?section=${selectedSection.split('_')[0]}`);
      const data = await res.json();
      const currentContent = data.data?.content || {};
      
      // 根据区块类型处理
      const section = homepageSections.find(s => s.id === selectedSection);
      if (!section) return;

      // 获取当前图片列表
      const currentImages = currentContent.images || [];
      
      // 检查是否已达到最大数量
      if (currentImages.length >= (section.maxImages || 4)) {
        alert(`该区块最多只能设置 ${section.maxImages} 张图片`);
        return;
      }

      // 添加新图片
      const newImage = {
        src: settingsDialog.url,
        title: imageTitle || settingsDialog.fileName.split('_').pop()?.split('.')[0] || '图片',
      };

      // 更新区块内容
      const updatedContent = {
        ...currentContent,
        images: [...currentImages, newImage],
      };

      // 保存到数据库
      await fetch('/api/homepage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section_type: selectedSection.split('_')[0],
          content: updatedContent,
          updated_by: '管理员',
        }),
      });

      setUploadSuccess(`图片已设置到「${section.name}」区块`);
      setSettingsDialog(null);
      setTimeout(() => setUploadSuccess(null), 3000);
    } catch (error) {
      console.error('Failed to set image:', error);
      alert('设置失败，请稍后重试');
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">图片管理</h1>
          <p className="text-gray-500 mt-1">上传图片并设置到主页各区块展示</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="选择分类" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部分类</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            multiple
            onChange={handleUpload}
            className="hidden"
          />
          <Button 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                上传中...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                上传图片
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 操作提示 */}
      {uploadSuccess && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 text-green-700 border border-green-200">
          <Check className="h-4 w-4" />
          {uploadSuccess}
        </div>
      )}

      {/* 使用说明 */}
      <Card className="border-0 shadow-md border-blue-200 bg-blue-50/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <ImageIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">使用说明</p>
              <ol className="list-decimal list-inside space-y-1 text-blue-700">
                <li>选择分类后点击「上传图片」按钮上传图片</li>
                <li>点击图片上的「设置」按钮，可将图片设置到主页对应区块</li>
                <li>也可以复制图片链接，在区块设置中手动引用</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 图片分类说明 */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">图片分类</CardTitle>
          <CardDescription>选择分类后上传图片，便于管理和查找</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {categories.map(cat => (
              <div
                key={cat.value}
                className={`p-4 rounded-lg cursor-pointer transition-all border ${
                  selectedCategory === cat.value
                    ? 'bg-primary/10 border-primary ring-2 ring-primary/20'
                    : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
                onClick={() => setSelectedCategory(cat.value)}
              >
                <div className="flex items-center gap-2 mb-1">
                  <ImageIcon className={`h-5 w-5 ${selectedCategory === cat.value ? 'text-primary' : 'text-gray-400'}`} />
                  <p className={`font-medium ${selectedCategory === cat.value ? 'text-primary' : 'text-gray-900'}`}>
                    {cat.label}
                  </p>
                </div>
                <p className="text-xs text-gray-500">{cat.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 图片列表 */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">
            图片列表
            <Badge variant="secondary" className="ml-2">{images.length}</Badge>
          </CardTitle>
          <CardDescription>
            {selectedCategory === 'all' 
              ? '显示所有分类的图片，点击图片上的「设置」按钮可将图片设置到主页' 
              : `显示「${categories.find(c => c.value === selectedCategory)?.label}」分类的图片`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-gray-400" />
              <p className="mt-2 text-gray-500">加载中...</p>
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FolderOpen className="h-16 w-16 mx-auto mb-3 text-gray-300" />
              <p>暂无图片</p>
              <p className="text-sm mt-1">选择分类后点击上方按钮上传图片</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {images.map((image) => (
                <div
                  key={image.key}
                  className="group relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50 hover:shadow-lg transition-all"
                >
                  <img
                    src={image.url}
                    alt={image.fileName}
                    className="w-full h-full object-cover"
                  />
                  {/* 悬浮操作层 */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setPreviewImage(image)}
                        title="预览"
                      >
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => openSettingsDialog(image)}
                        title="设置到主页"
                        className="gap-1"
                      >
                        <Settings className="h-4 w-4" />
                        设置
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => copyImageUrl(image.url)}
                        title="复制链接"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleteDialog(image)}
                        title="删除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {/* 分类标签 */}
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="text-xs bg-white/90">
                      {getCategoryName(image.key)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 预览弹窗 */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>图片预览</DialogTitle>
            <DialogDescription>{previewImage?.fileName}</DialogDescription>
          </DialogHeader>
          {previewImage && (
            <div className="relative">
              <img
                src={previewImage.url}
                alt={previewImage.fileName}
                className="w-full rounded-lg"
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewImage(null)}>
              关闭
            </Button>
            <Button onClick={() => {
              if (previewImage) {
                copyImageUrl(previewImage.url);
              }
            }}>
              <Copy className="h-4 w-4 mr-2" />
              复制链接
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 设置到主页区块弹窗 */}
      <Dialog open={!!settingsDialog} onOpenChange={() => setSettingsDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>设置图片到主页</DialogTitle>
            <DialogDescription>
              选择要将此图片设置到的主页区块
            </DialogDescription>
          </DialogHeader>
          
          {settingsDialog && (
            <div className="space-y-4">
              {/* 图片预览 */}
              <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={settingsDialog.url}
                  alt={settingsDialog.fileName}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* 选择区块 */}
              <div>
                <label className="text-sm font-medium text-gray-700">选择主页区块</label>
                <Select value={selectedSection} onValueChange={setSelectedSection}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="选择要设置的区块" />
                  </SelectTrigger>
                  <SelectContent>
                    {homepageSections.map(section => (
                      <SelectItem key={section.id} value={section.id}>
                        <div className="flex flex-col">
                          <span>{section.name}</span>
                          <span className="text-xs text-gray-500">{section.desc}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* 图片标题 */}
              <div>
                <label className="text-sm font-medium text-gray-700">图片标题（可选）</label>
                <Input
                  value={imageTitle}
                  onChange={(e) => setImageTitle(e.target.value)}
                  placeholder="如：入队仪式、运动会等"
                  className="mt-1"
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsDialog(null)}>
              取消
            </Button>
            <Button onClick={handleSetToSection} disabled={!selectedSection}>
              <Check className="h-4 w-4 mr-2" />
              确认设置
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认弹窗 */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除这张图片吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          {deleteDialog && (
            <div className="py-4">
              <img
                src={deleteDialog.url}
                alt={deleteDialog.fileName}
                className="w-32 h-32 object-cover rounded-lg mx-auto"
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
