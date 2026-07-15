import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  const body = await request.json().catch(() => null);
  const ids = body?.ids;

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'id 목록이 필요합니다.' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { error, data } = await admin.from('applications').delete().in('id', ids).select('id');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, deletedCount: data?.length || 0 });
}
