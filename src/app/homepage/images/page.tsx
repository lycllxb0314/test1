'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  X,
  Check,
  Loader2,
  ZoomIn,
  Copy,
} from 'lucide-react';

interface ImageFile {
  key: string;
  url: string;
  fileName: string;
}

// 图片分类 - 与主页区块对应
const categories = [
  { value: 'hero', label: '顶部横幅', desc: '轮播图、学校介绍背景' },
  { value: 'motto', label: '校训内涵', desc: '校训展示相关图片' },
  { value: 'five_education', label: '五育并举', desc: '德智体美劳五育展示图片' },
  { value: 'teacher_dev', label: '教师发展', desc: '教师培训、教研活动图片' },
  { value: 'activities', label: '校园活动', desc: '校园活动、节日庆典图片' },
  { value: 'honors', label: '荣誉展示', desc: '荣誉证书、奖牌图片' },
  { value: 'news', label: '新闻动态', desc: '新闻配图' },
  { value: 'smart_campus', label: '智慧校园', desc: '系统介绍相关图片' },
  { value: 'general', label: '其他', desc: '其他图片资源' },
];

export default function ImagesManagementPage() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [previewImage, setPreviewImage] = useState<ImageFile | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<ImageFile | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
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
      
      // 清空文件输入
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

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">图片管理</h1>
          <p className="text-gray-500 mt-1">管理主页展示的图片资源，支持上传和管理各类图片</p>
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

      {/* 上传成功提示 */}
      {uploadSuccess && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 text-green-700 border border-green-200">
          <Check className="h-4 w-4" />
          {uploadSuccess}
        </div>
      )}

      {/* 图片分类说明 */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">图片分类说明</CardTitle>
          <CardDescription>图片分类与主页区块对应，上传前请选择正确的分类</CardDescription>
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
            {selectedCategory === 'all' ? '显示所有分类的图片' : `显示「${categories.find(c => c.value === selectedCategory)?.label}」分类的图片`}
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
              <p className="text-sm mt-1">点击上方按钮上传图片</p>
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
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setPreviewImage(image)}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => copyImageUrl(image.url)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setDeleteDialog(image)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
