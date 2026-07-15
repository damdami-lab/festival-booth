import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request) {
  const body = await request.json().catch(() => null);
  const id = body?.id;

  if (!id) {
    return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { error, data } = await admin.from('applications').delete().eq('id', id).select('id');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data || data.length === 0) {
    return NextResponse.json({ error: '삭제된 행이 없습니다. (권한 또는 id를 확인해주세요)' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
