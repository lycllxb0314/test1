'use client';

/**
 * 卓越教师管理子组件
 *
 * 含三个子 Tab：名师风采、教师团队、教师获奖
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { GraduationCap, Plus, Pencil, Trash2, Star, Users, Award, Loader2 } from 'lucide-react';
import { ImageUpload } from './ImageUpload';

// ==================== 表单类型 ====================

type ProfileForm = {
  name: string;
  title: string;
  subject: string;
  image: string;
  description: string;
  achievements: string;
  motto: string;
  sortOrder: number;
  isActive: boolean;
};

type TeamForm = {
  name: string;
  subject: string;
  description: string;
  image: string;
  members: string;
  achievements: string;
  sortOrder: number;
  isActive: boolean;
};

type AwardForm = {
  teacherName: string;
  awardName: string;
  awardLevel: string;
  awardDate: string;
  subject: string;
  description: string;
  image: string;
  certificateUrl: string;
  sortOrder: number;
  isActive: boolean;
};

const defaultProfileForm: ProfileForm = {
  name: '', title: '', subject: '', image: '', description: '', achievements: '', motto: '', sortOrder: 0, isActive: true,
};
const defaultTeamForm: TeamForm = {
  name: '', subject: '', description: '', image: '', members: '[]', achievements: '', sortOrder: 0, isActive: true,
};
const defaultAwardForm: AwardForm = {
  teacherName: '', awardName: '', awardLevel: '', awardDate: '', subject: '', description: '', image: '', certificateUrl: '', sortOrder: 0, isActive: true,
};

// ==================== 组件 ====================

export function TeacherExcellenceManagement() {
  const [subTab, setSubTab] = useState('profiles');
  const [profiles, setProfiles] = useState<Record<string, unknown>[]>([]);
  const [teams, setTeams] = useState<Record<string, unknown>[]>([]);
  const [awards, setAwards] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  // 对话框状态
  const [profileDialog, setProfileDialog] = useState<{ open: boolean; id?: string }>({ open: false });
  const [teamDialog, setTeamDialog] = useState<{ open: boolean; id?: string }>({ open: false });
  const [awardDialog, setAwardDialog] = useState<{ open: boolean; id?: string }>({ open: false });

  // 表单状态
  const [profileForm, setProfileForm] = useState<ProfileForm>({ ...defaultProfileForm });
  const [teamForm, setTeamForm] = useState<TeamForm>({ ...defaultTeamForm });
  const [awardForm, setAwardForm] = useState<AwardForm>({ ...defaultAwardForm });

  const fetchProfiles = async () => {
    try {
      const res = await fetch('/api/teacher-excellence/profiles?admin=true');
      const result = await res.json();
      if (result.success) setProfiles(result.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchTeams = async () => {
    try {
      const res = await fetch('/api/teacher-excellence/teams?admin=true');
      const result = await res.json();
      if (result.success) setTeams(result.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchAwards = async () => {
    try {
      const res = await fetch('/api/teacher-excellence/awards?admin=true');
      const result = await res.json();
      if (result.success) setAwards(result.data || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchProfiles(), fetchTeams(), fetchAwards()]).finally(() => setLoading(false));
  }, []);

  // 名师风采 CRUD
  const openProfileDialog = (item?: Record<string, unknown>) => {
    if (item) {
      setProfileForm({
        name: (item.name as string) || '',
        title: (item.title as string) || '',
        subject: (item.subject as string) || '',
        image: (item.image as string) || '',
        description: (item.description as string) || '',
        achievements: Array.isArray(item.achievements) ? (item.achievements as string[]).join('\n') : '',
        motto: (item.motto as string) || '',
        sortOrder: (item.sortOrder as number) || 0,
        isActive: item.isActive !== false,
      });
      setProfileDialog({ open: true, id: item.id as string });
    } else {
      setProfileForm({ ...defaultProfileForm });
      setProfileDialog({ open: true });
    }
  };

  const saveProfile = async () => {
    const payload = {
      ...profileForm,
      achievements: profileForm.achievements.split('\n').filter(s => s.trim()),
    };
    try {
      if (profileDialog.id) {
        await fetch(`/api/teacher-excellence/profiles/${profileDialog.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      } else {
        await fetch('/api/teacher-excellence/profiles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      }
      setProfileDialog({ open: false });
      fetchProfiles();
    } catch (e) { console.error(e); }
  };

  const deleteProfile = async (id: string) => {
    if (!confirm('确定删除此名师风采记录？')) return;
    try {
      await fetch(`/api/teacher-excellence/profiles/${id}`, { method: 'DELETE' });
      fetchProfiles();
    } catch (e) { console.error(e); }
  };

  // 教师团队 CRUD
  const openTeamDialog = (item?: Record<string, unknown>) => {
    if (item) {
      setTeamForm({
        name: (item.name as string) || '',
        subject: (item.subject as string) || '',
        description: (item.description as string) || '',
        image: (item.image as string) || '',
        members: Array.isArray(item.members) ? JSON.stringify(item.members, null, 2) : '[]',
        achievements: Array.isArray(item.achievements) ? (item.achievements as string[]).join('\n') : '',
        sortOrder: (item.sortOrder as number) || 0,
        isActive: item.isActive !== false,
      });
      setTeamDialog({ open: true, id: item.id as string });
    } else {
      setTeamForm({ ...defaultTeamForm });
      setTeamDialog({ open: true });
    }
  };

  const saveTeam = async () => {
    let membersArr: unknown[] = [];
    try { membersArr = JSON.parse(teamForm.members); } catch { membersArr = []; }
    const payload = {
      ...teamForm,
      members: membersArr,
      achievements: teamForm.achievements.split('\n').filter(s => s.trim()),
    };
    try {
      if (teamDialog.id) {
        await fetch(`/api/teacher-excellence/teams/${teamDialog.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      } else {
        await fetch('/api/teacher-excellence/teams', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      }
      setTeamDialog({ open: false });
      fetchTeams();
    } catch (e) { console.error(e); }
  };

  const deleteTeam = async (id: string) => {
    if (!confirm('确定删除此教师团队记录？')) return;
    try {
      await fetch(`/api/teacher-excellence/teams/${id}`, { method: 'DELETE' });
      fetchTeams();
    } catch (e) { console.error(e); }
  };

  // 教师获奖 CRUD
  const openAwardDialog = (item?: Record<string, unknown>) => {
    if (item) {
      setAwardForm({
        teacherName: (item.teacherName as string) || '',
        awardName: (item.awardName as string) || '',
        awardLevel: (item.awardLevel as string) || '',
        awardDate: (item.awardDate as string) || '',
        subject: (item.subject as string) || '',
        description: (item.description as string) || '',
        image: (item.image as string) || '',
        certificateUrl: (item.certificateUrl as string) || '',
        sortOrder: (item.sortOrder as number) || 0,
        isActive: item.isActive !== false,
      });
      setAwardDialog({ open: true, id: item.id as string });
    } else {
      setAwardForm({ ...defaultAwardForm });
      setAwardDialog({ open: true });
    }
  };

  const saveAward = async () => {
    try {
      if (awardDialog.id) {
        await fetch(`/api/teacher-excellence/awards/${awardDialog.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(awardForm) });
      } else {
        await fetch('/api/teacher-excellence/awards', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(awardForm) });
      }
      setAwardDialog({ open: false });
      fetchAwards();
    } catch (e) { console.error(e); }
  };

  const deleteAward = async (id: string) => {
    if (!confirm('确定删除此获奖记录？')) return;
    try {
      await fetch(`/api/teacher-excellence/awards/${id}`, { method: 'DELETE' });
      fetchAwards();
    } catch (e) { console.error(e); }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#C9A96E]" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5 text-[#C9A96E]" />卓越教师管理</CardTitle>
        <CardDescription>管理名师风采、教师团队和教师获奖信息</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={subTab} onValueChange={setSubTab}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="profiles" className="gap-1"><Star className="h-3.5 w-3.5" />名师风采</TabsTrigger>
            <TabsTrigger value="teams" className="gap-1"><Users className="h-3.5 w-3.5" />教师团队</TabsTrigger>
            <TabsTrigger value="awards" className="gap-1"><Award className="h-3.5 w-3.5" />教师获奖</TabsTrigger>
          </TabsList>

          {/* 名师风采列表 */}
          <TabsContent value="profiles">
            <div className="flex justify-end mb-4">
              <Button onClick={() => openProfileDialog()} size="sm" className="gap-1"><Plus className="h-4 w-4" />新增名师</Button>
            </div>
            <div className="space-y-2">
              {profiles.map((item) => (
                <div key={item.id as string} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#C9A96E]/10 flex items-center justify-center">
                      <Star className="h-5 w-5 text-[#C9A96E]" />
                    </div>
                    <div>
                      <p className="font-medium">{item.name as string}</p>
                      <p className="text-sm text-muted-foreground">{item.title as string} · {item.subject as string}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openProfileDialog(item)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteProfile(item.id as string)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
              {profiles.length === 0 && <p className="text-center text-muted-foreground py-8">暂无名师风采数据</p>}
            </div>
          </TabsContent>

          {/* 教师团队列表 */}
          <TabsContent value="teams">
            <div className="flex justify-end mb-4">
              <Button onClick={() => openTeamDialog()} size="sm" className="gap-1"><Plus className="h-4 w-4" />新增团队</Button>
            </div>
            <div className="space-y-2">
              {teams.map((item) => (
                <div key={item.id as string} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#8B7355]/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-[#8B7355]" />
                    </div>
                    <div>
                      <p className="font-medium">{item.name as string}</p>
                      <p className="text-sm text-muted-foreground">{item.subject as string}学科教研组</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openTeamDialog(item)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteTeam(item.id as string)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
              {teams.length === 0 && <p className="text-center text-muted-foreground py-8">暂无教师团队数据</p>}
            </div>
          </TabsContent>

          {/* 教师获奖列表 */}
          <TabsContent value="awards">
            <div className="flex justify-end mb-4">
              <Button onClick={() => openAwardDialog()} size="sm" className="gap-1"><Plus className="h-4 w-4" />新增获奖</Button>
            </div>
            <div className="space-y-2">
              {awards.map((item) => (
                <div key={item.id as string} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#A08060]/10 flex items-center justify-center">
                      <Award className="h-5 w-5 text-[#A08060]" />
                    </div>
                    <div>
                      <p className="font-medium">{item.awardName as string}</p>
                      <p className="text-sm text-muted-foreground">{item.teacherName as string} · {item.awardLevel as string}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openAwardDialog(item)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteAward(item.id as string)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
              {awards.length === 0 && <p className="text-center text-muted-foreground py-8">暂无教师获奖数据</p>}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* 名师风采编辑对话框 */}
      <Dialog open={profileDialog.open} onOpenChange={(open) => setProfileDialog({ open })}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{profileDialog.id ? '编辑名师' : '新增名师'}</DialogTitle>
            <DialogDescription>填写名师风采信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>姓名</Label><Input value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>职称</Label><Input value={profileForm.title} onChange={(e) => setProfileForm({ ...profileForm, title: e.target.value })} /></div>
              <div><Label>学科</Label><Input value={profileForm.subject} onChange={(e) => setProfileForm({ ...profileForm, subject: e.target.value })} /></div>
            </div>
            <ImageUpload value={profileForm.image} onChange={(url) => setProfileForm({ ...profileForm, image: url })} label="照片" />
            <div><Label>简介</Label><Textarea value={profileForm.description} onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })} rows={3} /></div>
            <div><Label>荣誉成就（每行一条）</Label><Textarea value={profileForm.achievements} onChange={(e) => setProfileForm({ ...profileForm, achievements: e.target.value })} rows={3} placeholder="全国优秀教师&#10;省特级教师" /></div>
            <div><Label>教育格言</Label><Input value={profileForm.motto} onChange={(e) => setProfileForm({ ...profileForm, motto: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>排序</Label><Input type="number" value={profileForm.sortOrder} onChange={(e) => setProfileForm({ ...profileForm, sortOrder: parseInt(e.target.value) || 0 })} /></div>
              <div className="flex items-center gap-2 pt-6"><Switch checked={profileForm.isActive} onCheckedChange={(v) => setProfileForm({ ...profileForm, isActive: v })} /><Label>启用</Label></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProfileDialog({ open: false })}>取消</Button>
            <Button onClick={saveProfile}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 教师团队编辑对话框 */}
      <Dialog open={teamDialog.open} onOpenChange={(open) => setTeamDialog({ open })}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{teamDialog.id ? '编辑团队' : '新增团队'}</DialogTitle>
            <DialogDescription>填写教师团队信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>团队名称</Label><Input value={teamForm.name} onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })} /></div>
              <div><Label>学科</Label><Input value={teamForm.subject} onChange={(e) => setTeamForm({ ...teamForm, subject: e.target.value })} /></div>
            </div>
            <ImageUpload value={teamForm.image} onChange={(url) => setTeamForm({ ...teamForm, image: url })} label="封面图" />
            <div><Label>团队介绍</Label><Textarea value={teamForm.description} onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })} rows={3} /></div>
            <div><Label>成员（JSON格式）</Label><Textarea value={teamForm.members} onChange={(e) => setTeamForm({ ...teamForm, members: e.target.value })} rows={4} placeholder='[{"name":"张老师","role":"组长","title":"高级教师"}]' /></div>
            <div><Label>团队荣誉（每行一条）</Label><Textarea value={teamForm.achievements} onChange={(e) => setTeamForm({ ...teamForm, achievements: e.target.value })} rows={3} placeholder="省优秀教研组&#10;市教学研究基地" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>排序</Label><Input type="number" value={teamForm.sortOrder} onChange={(e) => setTeamForm({ ...teamForm, sortOrder: parseInt(e.target.value) || 0 })} /></div>
              <div className="flex items-center gap-2 pt-6"><Switch checked={teamForm.isActive} onCheckedChange={(v) => setTeamForm({ ...teamForm, isActive: v })} /><Label>启用</Label></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTeamDialog({ open: false })}>取消</Button>
            <Button onClick={saveTeam}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 教师获奖编辑对话框 */}
      <Dialog open={awardDialog.open} onOpenChange={(open) => setAwardDialog({ open })}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{awardDialog.id ? '编辑获奖' : '新增获奖'}</DialogTitle>
            <DialogDescription>填写教师获奖信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>教师姓名</Label><Input value={awardForm.teacherName} onChange={(e) => setAwardForm({ ...awardForm, teacherName: e.target.value })} /></div>
              <div><Label>学科</Label><Input value={awardForm.subject} onChange={(e) => setAwardForm({ ...awardForm, subject: e.target.value })} /></div>
            </div>
            <div><Label>获奖名称</Label><Input value={awardForm.awardName} onChange={(e) => setAwardForm({ ...awardForm, awardName: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>获奖等级</Label>
                <Select value={awardForm.awardLevel} onValueChange={(v) => setAwardForm({ ...awardForm, awardLevel: v })}>
                  <SelectTrigger><SelectValue placeholder="选择等级" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="国家级">国家级</SelectItem>
                    <SelectItem value="省级">省级</SelectItem>
                    <SelectItem value="市级">市级</SelectItem>
                    <SelectItem value="区级">区级</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>获奖时间</Label><Input value={awardForm.awardDate} onChange={(e) => setAwardForm({ ...awardForm, awardDate: e.target.value })} placeholder="2024-09" /></div>
            </div>
            <div><Label>详细描述</Label><Textarea value={awardForm.description} onChange={(e) => setAwardForm({ ...awardForm, description: e.target.value })} rows={3} /></div>
            <ImageUpload value={awardForm.certificateUrl} onChange={(url) => setAwardForm({ ...awardForm, certificateUrl: url })} label="荣誉证书" />
            <div className="grid grid-cols-2 gap-4">
              <div><Label>排序</Label><Input type="number" value={awardForm.sortOrder} onChange={(e) => setAwardForm({ ...awardForm, sortOrder: parseInt(e.target.value) || 0 })} /></div>
              <div className="flex items-center gap-2 pt-6"><Switch checked={awardForm.isActive} onCheckedChange={(v) => setAwardForm({ ...awardForm, isActive: v })} /><Label>启用</Label></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAwardDialog({ open: false })}>取消</Button>
            <Button onClick={saveAward}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
