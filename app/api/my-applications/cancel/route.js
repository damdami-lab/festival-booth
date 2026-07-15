import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { hashApplicationPassword } from '@/lib/hash';

export async function POST(request) {
  const body = await request.json().catch(() => null);
  const { id, student_class, student_number, password } = body || {};

  if (!id || !student_class || !student_number || !password) {
    return NextResponse.json({ error: '입력값을 확인해주세요.' }, { status: 400 });
  }

  const studentClass = Number(student_class);
  const studentNumber = Number(student_number);

  const admin = getSupabaseAdmin();

  // 취소하려는 행이 정말 이 반/번호의 신청이 맞는지 먼저 확인
  const { data: row, error: fetchError } = await admin
    .from('applications')
    .select('id, student_class, student_number, password_hash')
    .eq('id', id)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: '조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ error: '이미 삭제되었거나 존재하지 않는 신청입니다.' }, { status: 404 });
  }
  if (row.student_class !== studentClass || row.student_number !== studentNumber) {
    return NextResponse.json({ error: '본인의 신청만 취소할 수 있습니다.' }, { status: 403 });
  }

  const passwordHash = await hashApplicationPassword(password, studentClass, studentNumber);
  if (row.password_hash !== passwordHash) {
    return NextResponse.json({ error: '비밀번호가 일치하지 않습니다.' }, { status: 401 });
  }

  const { error: deleteError, data: deleted } = await admin
    .from('applications')
    .delete()
    .eq('id', id)
    .select('id');

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }
  if (!deleted || deleted.length === 0) {
    return NextResponse.json({ error: '삭제에 실패했습니다. 다시 시도해주세요.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
