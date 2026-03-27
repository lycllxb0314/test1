'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Users,
  Phone,
  MapPin,
  Calendar,
  Edit,
  User,
  Mail,
  CreditCard,
  Home,
} from 'lucide-react';

// 子女信息类型
interface ChildInfo {
  id: string;
  name: string;
  gender: string;
  avatar: string;
  classId: string;
  className: string;
  grade: number;
  studentNo: string;
  birthDate: string;
  idCard: string;
  ethnicity: string;
  nativePlace: string;
  address: string;
  phone: string;
  status: string;
  parents: Array<{
    name: string;
    relation: string;
    phone: string;
    isEmergency: boolean;
  }>;
}

export default function ChildrenPage() {
  const { user } = useAuth();
  const [editDialog, setEditDialog] = useState(false);
  const [selectedChild, setSelectedChild] = useState<ChildInfo | null>(null);

  // 模拟子女数据
  const children = [
    {
      id: 's001',
      name: '张小明',
      gender: 'male',
      avatar: '👦',
      classId: 'c001',
      className: '三年(1)班',
      grade: 3,
      studentNo: '20220301',
      birthDate: '2015-06-15',
      idCard: '350802201506150011',
      ethnicity: '汉族',
      nativePlace: '福建龙岩',
      address: '龙岩市新罗区东城街道xx路xx号',
      phone: '',
      status: '在校',
      parents: [
        { name: '张伟', relation: '父亲', phone: '13800138001', isEmergency: true },
        { name: '李芳', relation: '母亲', phone: '13800138002', isEmergency: false },
      ],
    },
  ];

  // 打开编辑对话框
  const handleEdit = (child: ChildInfo) => {
    setSelectedChild({ ...child });
    setEditDialog(true);
  };

  // 保存编辑
  const handleSave = () => {
    toast.success('信息更新成功');
    setEditDialog(false);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">子女信息</h1>
          <p className="text-muted-foreground mt-1">查看和管理子女基本信息</p>
        </div>
      </div>

      <div className="space-y-6">
        {children.map((child) => (
          <Card key={child.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{child.avatar}</div>
                  <div>
                    <CardTitle className="text-xl">{child.name}</CardTitle>
                    <CardDescription>
                      {child.className} · 学号: {child.studentNo}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-700">{child.status}</Badge>
                  <Button variant="outline" onClick={() => handleEdit(child)}>
                    <Edit className="h-4 w-4 mr-2" />
                    编辑信息
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="basic">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">基本信息</TabsTrigger>
                  <TabsTrigger value="family">家庭信息</TabsTrigger>
                  <TabsTrigger value="school">学籍信息</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="mt-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">姓名</p>
                      <p className="font-medium">{child.name}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">性别</p>
                      <p className="font-medium">{child.gender === 'male' ? '男' : '女'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">出生日期</p>
                      <p className="font-medium">{child.birthDate}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">身份证号</p>
                      <p className="font-medium">{child.idCard}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">民族</p>
                      <p className="font-medium">{child.ethnicity}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">籍贯</p>
                      <p className="font-medium">{child.nativePlace}</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="family" className="mt-4">
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      家长信息
                    </h4>
                    <div className="grid gap-4">
                      {child.parents.map((parent, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{parent.name}</p>
                              <p className="text-sm text-muted-foreground">{parent.relation}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="h-4 w-4" />
                              <span>{parent.phone}</span>
                            </div>
                            {parent.isEmergency && (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                紧急联系人
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4">
                      <h4 className="font-medium flex items-center gap-2 mb-2">
                        <Home className="h-4 w-4" />
                        家庭住址
                      </h4>
                      <p className="text-muted-foreground bg-muted/30 p-4 rounded-lg">{child.address}</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="school" className="mt-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">学号</p>
                      <p className="font-medium">{child.studentNo}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">年级</p>
                      <p className="font-medium">{child.grade}年级</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">班级</p>
                      <p className="font-medium">{child.className}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">入学日期</p>
                      <p className="font-medium">2022-09-01</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">学生类型</p>
                      <p className="font-medium">普通</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">在读状态</p>
                      <Badge className="bg-green-100 text-green-700">{child.status}</Badge>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 编辑对话框 */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>编辑子女信息</DialogTitle>
            <DialogDescription>
              更新子女的基本信息
            </DialogDescription>
          </DialogHeader>
          {selectedChild && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>姓名</Label>
                  <Input value={selectedChild.name} disabled />
                </div>
                <div className="space-y-2">
                  <Label>性别</Label>
                  <Input value={selectedChild.gender === 'male' ? '男' : '女'} disabled />
                </div>
              </div>
              <div className="space-y-2">
                <Label>家庭住址</Label>
                <Input 
                  value={selectedChild.address}
                  onChange={(e) => setSelectedChild({ ...selectedChild, address: e.target.value })}
                />
              </div>
              <div className="text-sm text-muted-foreground">
                注：姓名、性别、身份证等关键信息需联系班主任修改
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>取消</Button>
            <Button onClick={handleSave}>保存修改</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
