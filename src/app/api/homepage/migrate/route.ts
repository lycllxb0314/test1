import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 初始化主页内容数据
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();

    // 1. 插入校训内涵
    const mottoContent = [
      { character: '明德', meaning: '明德修身，立德树人', desc: '以德为先，培养学生健全人格与家国情怀' },
      { character: '博学', meaning: '博学笃志，广闻强识', desc: '拓宽视野，培养学生终身学习的能力' },
      { character: '笃行', meaning: '笃行致远，知行合一', desc: '注重实践，培养学生解决问题的能力' },
      { character: '创新', meaning: '开拓进取，勇于创新', desc: '激发潜能，培养学生创新精神与实践能力' },
    ];

    await client.from('homepage_sections').upsert({
      section_type: 'motto',
      section_title: '校训内涵',
      section_subtitle: '明德 博学 笃行 创新',
      content: mottoContent,
      sort_order: 1,
      updated_by: 'system',
    }, { onConflict: 'section_type' });

    // 2. 插入五育数据
    const fiveEducationContent = [
      {
        category: '德育',
        motto: '明德',
        goal: '培养有理想、有道德、有担当的时代新人',
        practice: '少先队活动、主题班会、社会实践、红色教育',
        color: '#B22222',
      },
      {
        category: '智育',
        motto: '博学',
        goal: '培养善思考、会学习、能创新的智慧少年',
        practice: '课堂教学、学科竞赛、科技创新、阅读工程',
        color: '#1565C0',
      },
      {
        category: '体育',
        motto: '笃行',
        goal: '培养体魄健、意志坚、精神强的阳光少年',
        practice: '体育课堂、阳光大课间、体育社团、田径运动会',
        color: '#E65100',
      },
      {
        category: '美育',
        motto: '创新',
        goal: '培养有审美、会表达、能创造的艺术素养',
        practice: '艺术课堂、社团活动、校园艺术节、传统文化',
        color: '#6A1B9A',
      },
      {
        category: '劳育',
        motto: '笃行',
        goal: '培养爱劳动、会劳动、懂劳动的时代新人',
        practice: '劳动课程、校园种植、家务劳动、劳动技能大赛',
        color: '#2E7D32',
      },
    ];

    await client.from('homepage_sections').upsert({
      section_type: 'five_education',
      section_title: '五育并举',
      section_subtitle: '德智体美劳全面发展',
      content: fiveEducationContent,
      sort_order: 2,
      updated_by: 'system',
    }, { onConflict: 'section_type' });

    // 3. 插入智慧校园介绍
    const smartCampusContent = [
      { icon: 'Building2', title: '总务后勤', desc: '资产管理、后勤保障', forWho: '总务人员', color: '#8B4513' },
      { icon: 'GraduationCap', title: '教务教研', desc: '教学管理、教研活动', forWho: '教师、教研组', color: '#1565C0' },
      { icon: 'Heart', title: '德育管理', desc: '学生管理、成长档案', forWho: '班主任、德育处', color: '#B22222' },
      { icon: 'Users', title: '教师空间', desc: '工作台、家校沟通', forWho: '全体教师', color: '#6A1B9A' },
    ];

    await client.from('homepage_sections').upsert({
      section_type: 'smart_campus',
      section_title: '智慧校园',
      section_subtitle: '一体化管理平台',
      content: smartCampusContent,
      sort_order: 3,
      updated_by: 'system',
    }, { onConflict: 'section_type' });

    // 4. 插入荣誉数据
    const honors = [
      { title: '全国文明校园', year: '2023', organization: '中央文明办', level: '国家级', sort_order: 1 },
      { title: '福建省示范小学', year: '2018', organization: '福建省教育厅', level: '省级', sort_order: 2 },
      { title: '全国青少年校园足球特色学校', year: '2022', organization: '教育部', level: '国家级', sort_order: 3 },
      { title: '福建省德育工作先进学校', year: '2021', organization: '福建省教育厅', level: '省级', sort_order: 4 },
      { title: '龙岩市教学质量先进单位', year: '2023', organization: '龙岩市教育局', level: '市级', sort_order: 5 },
      { title: '全国优秀少先队集体', year: '2020', organization: '共青团中央', level: '国家级', sort_order: 6 },
    ];

    for (const honor of honors) {
      await client.from('homepage_honors').upsert(honor, { onConflict: 'id' });
    }

    // 5. 插入新闻数据
    const news = [
      { title: '我校师生在省级科技创新大赛中荣获一等奖', category: '喜讯', summary: '在刚刚结束的福建省青少年科技创新大赛中，我校师生表现优异...', is_top: true },
      { title: '学校开展"传承红色基因"主题教育活动', category: '活动', summary: '为传承红色基因，弘扬革命精神，学校组织开展了...', is_top: false },
      { title: '著名教育专家到校指导教学工作', category: '新闻', summary: '日前，著名教育专家XXX教授莅临我校指导...', is_top: false },
      { title: '学校足球队荣获市级联赛冠军', category: '喜讯', summary: '在龙岩市小学生足球联赛中，我校足球队顽强拼搏...', is_top: true },
    ];

    for (const item of news) {
      await client.from('homepage_news').insert({
        ...item,
        publish_date: new Date().toISOString(),
        created_by: 'system',
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: '初始数据已成功导入',
      sections: 3,
      honors: honors.length,
      news: news.length,
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 });
  }
}
