import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * GET - 获取财务记录列表
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    let query = client
      .from('financial_records')
      .select('*')
      .order('transaction_date', { ascending: false });

    if (type) query = query.eq('type', type);
    if (category) query = query.eq('category', category);
    if (year) query = query.gte('transaction_date', `${year}-01-01`).lte('transaction_date', `${year}-12-31`);
    if (month) {
      const monthStart = `${year}-${month.padStart(2, '0')}-01`;
      const monthEnd = `${year}-${month.padStart(2, '0')}-31`;
      query = query.gte('transaction_date', monthStart).lte('transaction_date', monthEnd);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: (data || []).map((r: any) => ({
        id: r.id,
        type: r.type,
        category: r.category,
        amount: r.amount,
        description: r.description,
        transactionDate: r.transaction_date,
        payer: r.payer,
        payee: r.payee,
        invoiceNumber: r.invoice_number,
        status: r.status,
        approvedBy: r.approved_by,
        createdAt: r.created_at,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch financial records:', error);
    return NextResponse.json({ success: false, error: '获取财务记录失败' }, { status: 500 });
  }
}

/**
 * POST - 创建财务记录
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const body = await request.json();

    const { data, error } = await client
      .from('financial_records')
      .insert({
        type: body.type,
        category: body.category,
        amount: body.amount,
        description: body.description,
        transaction_date: body.transactionDate,
        payer: body.payer,
        payee: body.payee,
        invoice_number: body.invoiceNumber,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Failed to create financial record:', error);
    return NextResponse.json({ success: false, error: '创建财务记录失败' }, { status: 500 });
  }
}
