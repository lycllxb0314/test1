'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Save,
  Loader2,
  Building,
  Users,
  MapPin,
  Settings,
} from 'lucide-react';
import { RoomType, RoomStatus } from '@/types';

// 教室类型选项
const roomTypeOptions: { value: RoomType; label: string }[] = [
  { value: 'seminar_room', label: '教研室' },
  { value: 'lecture_hall', label: '阶梯教室' },
  { value: 'multimedia_room', label: '多媒体教室' },
  { value: 'lab', label: '实验室' },
  { value: 'meeting_room', label: '会议室' },
  { value: 'activity_room', label: '活动室' },
];

// 教室状态选项
const roomStatusOptions: { value: RoomStatus; label: string }[] = [
  { value: 'available', label: '空闲' },
  { value: 'in_use', label: '使用中' },
  { value: 'reserved', label: '已预约' },
  { value: 'maintenance', label: '维护中' },
  { value: 'locked', label: '已锁定' },
];

// 楼栋选项
const buildingOptions = [
  '教学楼A栋',
  '教学楼B栋',
  '教学楼C栋',
  '实验楼',
  '综合楼',
  '行政楼',
  '体育馆',
  '艺术楼',
];

// 设施选项
const facilityOptions = [
  { key: 'projector', label: '投影仪' },
  { key: 'computer', label: '电脑' },
  { key: 'microphone', label: '麦克风' },
  { key: 'speaker', label: '音响' },
  { key: 'whiteboard', label: '白板' },
  { key: 'blackboard', label: '黑板' },
  { key: 'airConditioner', label: '空调' },
  { key: 'wifi', label: 'WiFi' },
  { key: 'videoConference', label: '视频会议设备' },
  { key: 'recording', label: '录播设备' },
];

interface FormData {
  id: string;
  name: string;
  code: string;
  type: RoomType | '';
  building: string;
  floor: number;
  location: string;
  capacity: number;
  area: number;
  facilities: Record<string, boolean>;
  extraFacilities: string;
  status: RoomStatus;
  remark: string;
}

const initialFormData: FormData = {
  id: '',
  name: '',
  code: '',
  type: '',
  building: '',
  floor: 1,
  location: '',
  capacity: 30,
  area: 0,
  facilities: {
    projector: false,
    computer: false,
    microphone: false,
    speaker: false,
    whiteboard: false,
    blackboard: false,
    airConditioner: false,
    wifi: false,
    videoConference: false,
    recording: false,
  },
  extraFacilities: '',
  status: 'available',
  remark: '',
};

export default function EditRoomPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  // 加载教室数据
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await fetch(`/api/academic/rooms?id=${roomId}`);
        const result = await res.json();
        
        if (result.success && result.data) {
          const room = Array.isArray(result.data) ? result.data[0] : result.data;
          if (room) {
            setFormData({
              id: room.id,
              name: room.name,
              code: room.code,
              type: room.type,
              building: room.building,
              floor: room.floor || 1,
              location: room.location || '',
              capacity: room.capacity || 30,
              area: room.area || 0,
              facilities: room.facilities || initialFormData.facilities,
              extraFacilities: room.extra_facilities 
                ? room.extra_facilities.join('，') 
                : '',
              status: room.status,
              remark: room.remark || '',
            });
          }
        }
      } catch (err) {
        console.error('加载教室数据失败:', err);
        alert('加载教室数据失败');
        router.push('/academic/rooms');
      } finally {
        setLoading(false);
      }
    };
    
    if (roomId) {
      fetchRoom();
    }
  }, [roomId, router]);

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFacilityChange = (key: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      facilities: { ...prev.facilities, [key]: checked },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证必填字段
    if (!formData.name || !formData.code || !formData.type || !formData.building) {
      alert('请填写所有必填字段');
      return;
    }
    
    setSaving(true);
    
    try {
      const response = await fetch('/api/academic/rooms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: formData.id,
          name: formData.name,
          code: formData.code,
          type: formData.type,
          building: formData.building,
          floor: formData.floor,
          location: formData.location,
          capacity: formData.capacity,
          area: formData.area || null,
          facilities: formData.facilities,
          extraFacilities: formData.extraFacilities 
            ? formData.extraFacilities.split(/[,，]/).map(s => s.trim()).filter(Boolean) 
            : null,
          status: formData.status,
          remark: formData.remark || null,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('教室信息更新成功');
        router.push('/academic/rooms');
      } else {
        alert('更新失败: ' + (result.error || '未知错误'));
      }
    } catch (err) {
      console.error('更新教室失败:', err);
      alert('更新失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* 页面标题 */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/academic/rooms">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">编辑教室</h1>
          <p className="text-muted-foreground">修改教室信息并保存</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基本信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              基本信息
            </CardTitle>
            <CardDescription>教室的基本属性信息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">教室名称 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => handleInputChange('name', e.target.value)}
                  placeholder="如：第一阶梯教室"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">教室编号 *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={e => handleInputChange('code', e.target.value)}
                  placeholder="如：A101"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">教室类型 *</Label>
                <Select
                  value={formData.type}
                  onValueChange={value => handleInputChange('type', value as RoomType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择教室类型" />
                  </SelectTrigger>
                  <SelectContent>
                    {roomTypeOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">状态</Label>
                <Select
                  value={formData.status}
                  onValueChange={value => handleInputChange('status', value as RoomStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roomStatusOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 位置信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              位置信息
            </CardTitle>
            <CardDescription>教室的位置详情</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="building">所在楼栋 *</Label>
                <Select
                  value={formData.building}
                  onValueChange={value => handleInputChange('building', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择楼栋" />
                  </SelectTrigger>
                  <SelectContent>
                    {buildingOptions.map(option => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="floor">楼层</Label>
                <Input
                  id="floor"
                  type="number"
                  min="1"
                  max="99"
                  value={formData.floor}
                  onChange={e => handleInputChange('floor', parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="location">位置详情</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={e => handleInputChange('location', e.target.value)}
                  placeholder="如：东侧走廊尽头"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 规模与容量 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              规模与容量
            </CardTitle>
            <CardDescription>教室的容量和面积信息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capacity">容纳人数</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={e => handleInputChange('capacity', parseInt(e.target.value) || 30)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="area">面积 (平方米)</Label>
                <Input
                  id="area"
                  type="number"
                  min="0"
                  value={formData.area}
                  onChange={e => handleInputChange('area', parseInt(e.target.value) || 0)}
                  placeholder="选填"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 设施配置 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              设施配置
            </CardTitle>
            <CardDescription>教室内的设备和设施</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {facilityOptions.map(facility => (
                <div key={facility.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={facility.key}
                    checked={formData.facilities[facility.key]}
                    onCheckedChange={checked => 
                      handleFacilityChange(facility.key, checked as boolean)
                    }
                  />
                  <Label htmlFor={facility.key} className="cursor-pointer">
                    {facility.label}
                  </Label>
                </div>
              ))}
            </div>
            <div className="space-y-2 pt-4 border-t">
              <Label htmlFor="extraFacilities">其他设施</Label>
              <Input
                id="extraFacilities"
                value={formData.extraFacilities}
                onChange={e => handleInputChange('extraFacilities', e.target.value)}
                placeholder="多个设施用逗号分隔，如：钢琴、电子琴"
              />
            </div>
          </CardContent>
        </Card>

        {/* 备注 */}
        <Card>
          <CardHeader>
            <CardTitle>备注信息</CardTitle>
            <CardDescription>其他需要说明的信息</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.remark}
              onChange={e => handleInputChange('remark', e.target.value)}
              placeholder="请输入备注信息..."
              rows={3}
            />
          </CardContent>
        </Card>

        {/* 操作按钮 */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/academic/rooms">取消</Link>
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                保存
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
